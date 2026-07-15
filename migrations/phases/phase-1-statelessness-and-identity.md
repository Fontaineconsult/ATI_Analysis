# Phase 1 — Statelessness + identity foundation (Week 2: Jul 27–31)

**Goal:** the app runs identically on N interchangeable containers — every piece of local state
(SQLite auth DB, disk files, per-PID logs, baked config) moves behind a shared service — and
the **full RBAC schema** lands in Postgres on day one (enforcement comes later; see the RBAC
through-line in [README.md](README.md)).

**Why this phase is independently shippable:** a stateless app with a Postgres auth store, an
S3 file backend, and server-derived attribution is strictly better than today even if it kept
running on the IIS box. Nothing here requires ECS/ALB to exist yet.

---

## 1. Concepts

**12-factor statelessness.** Horizontal scaling means any request can land on any container, so
no container may hold state the next request needs: files → S3, users/roles → Postgres, config →
environment variables, logs → stdout (the platform ships them). Flask's signed-cookie sessions
are *already* stateless (the state rides in the cookie) — they only need the same
`FLASK_SECRET_KEY` on every container.

**S3 in five sentences.** Buckets hold objects under string keys; there are no real folders.
Access is via IAM policies — we'll create one IAM user whose policy allows only
`GetObject/PutObject/DeleteObject/ListBucket` on our one bucket (least privilege). "Block Public
Access" stays ON — the app reads privately. A **presigned URL** is a time-limited signed link
that lets a browser download an object directly from S3 without credentials — Phase 4 uses
these to take file downloads off the app tier entirely. Our existing `app/fs` design
(content-addressed SHA-256 keys, streaming) maps 1:1 onto S3 semantics.

**Why Postgres for auth (and not the graph).** Identity/roles want transactions, uniqueness,
and boring relational audit rows; the graph stays the knowledge model. RDS (week 3) is managed
Postgres — this week we develop against a local Docker Postgres, same engine.

**Session epoch (revocation without Redis).** The cookie stores `user_id + session_epoch`. Each
request compares the cookie's epoch to the user's row; bump the column → all that user's
cookies die. Simple, no shared session store needed.

**Shadow-ready RBAC schema.** We create `users`, `role_assignments`, and `audit_log` complete
now — including lockout, reset-token, `session_epoch`, and `person_uid` columns — so weeks 3–5
never ALTER the schema. Enforcement stays off; only the data model ships.

**Docker in three sentences.** A `Dockerfile` describes an image (OS + Python + app); a
container is a running instance of it. The same image runs on your laptop and on ECS Fargate —
that's the point. Ours serves the CRA build from Flask same-origin (see deviation #1 in
[README.md](README.md)), so there's exactly one thing to deploy.

---

## 2. Runbook (human track)

### 2.1 First AWS lesson: the dev S3 bucket, by hand (~1–2 h)

1. Console → S3 → Create bucket `ati-dev-files-<suffix>` (us-west-2). Leave **Block Public
   Access ON**. Enable **versioning** (undelete safety net; verified in the Phase 5 drill).
2. IAM → Create policy `ati-dev-files-rw` allowing `s3:GetObject`, `s3:PutObject`,
   `s3:DeleteObject` on `arn:aws:s3:::ati-dev-files-<suffix>/*` and `s3:ListBucket` on the
   bucket ARN.
3. IAM → Create user `ati-dev-app` (no console access) → attach the policy → create access
   key → put key/secret into your **local** `.env.development` (never committed).
4. Record every choice in the settings ledger below — this is the raw material for Terraform in
   week 4.

> **Settings ledger** (fill as you go): bucket name/region/versioning ▢ policy JSON ▢ IAM user
> name ▢ where the key is stored ▢

### 2.2 Local Postgres

`docker run -d --name ati-pg -e POSTGRES_PASSWORD=... -p 5432:5432 postgres:17` — or via a
`docker-compose.dev.yml` the agent track provides. No AWS yet; RDS comes in week 3.

### 2.3 Answer the RBAC policy questions (§5) — they gate the agent track's registry work.

### 2.4 Review two agent-track outputs that need human judgment

- The **person_uid backfill report** (auth email ↔ graph Person match proposals) — approve
  each mapping.
- The **permission matrix** ([../adr-002-rbac-and-identity.md](../adr-002-rbac-and-identity.md))
  — confirm or amend contested cells while they're cheap to change.

---

## 3. Agent track (parallel, reviewable PRs)

1. **Dockerfile** — Linux, Python 3.14, `waitress`; serves `deployment/wsgi.py:application`;
   copies the CRA build into the image and serves it same-origin; frontend built with a
   **relative** API base so no per-env rebuilds. Plus `docker-compose.dev.yml` (app ×2 +
   Postgres) for the verification test.
2. **`app/fs/backends/s3.py`** implementing the `StorageBackend` interface
   (`save/open/exists/stat/delete/iter_keys`) over boto3, selected by `FS_PROVIDER=s3` +
   `FS_S3_BUCKET`; keeps content-addressed SHA-256 keys so `gc_orphan_files.py` works
   unchanged. Parametrize `tests/test_fs.py` to run against the real dev bucket (no MinIO —
   see deviation in README).
3. **`app/auth/store_pg.py`** — same function API as `store.py` (`create_user`, `verify_user`,
   `set_password`, `set_active`, `list_users`), selected by `AUTH_STORE_BACKEND=postgres`;
   **full DDL** from [security-review.md](security-review.md) §RBAC (users incl.
   `auth_source`, `person_uid`, `session_epoch`, `failed_logins`, `locked_until`,
   `reset_token_hash`; `role_assignments`; `audit_log`). Migration script: SQLite rows →
   Postgres (werkzeug hashes port unchanged); `AUTH_ADMINS` env entries → `system_admin` role
   rows (env kept as first-boot bootstrap only). Port `manage_users.py`; mirror
   `test_auth_store.py` into `test_auth_store_pg.py` against a Postgres test container.
4. **Server-derived attribution** — the session identity's `person_uid` replaces
   client-supplied fields: stop reading `created_by` from bodies (`documents.py:146` et al.);
   **delete the Person-creation-from-payload path** (`queries/documentation/create.py:180-193`);
   unknown person → 400, not node creation.
5. **Health endpoints** — `GET /ati/healthz` (liveness, no dependencies) and `GET /ati/readyz`
   (checks Neo4j + Postgres + S3). *Moved forward from the old plan's week 6: the week-3 ALB
   target group needs a health-check path.*
6. **Stdout JSON logging** replacing per-PID rotating files (`app/logging_config.py`); keep a
   dev-pretty mode.
7. **Secure defaults flipped:** `AUTH_ENFORCED` default **true** (dev opts out explicitly in
   `.env.development`); `SESSION_COOKIE_SECURE` true outside dev. One-line changes; do not wait
   for week 5.
8. **person_uid backfill report** — email-match heuristic over auth users × graph Persons,
   emitted as a reviewable table (human approves; then the column is authoritative — see
   ADR-002 §6).

---

## 4. Verification

**The one end-to-end check:** `docker compose up` two app containers (same image, ports
5001/5002) sharing local Postgres + the real dev S3 bucket. Create a user and upload a file via
instance **A**; log in and download it via instance **B**; delete a container and repeat.
Proves: no local state survives, sessions work across instances, files and identity are shared.

Automated locks: `test_auth_store_pg.py` green; `test_fs.py` green against S3; CI unchanged
(still ephemeral Neo4j); a smoke test hitting `/ati/healthz` + `/ati/readyz` in the compose
stack.

Rollback: `AUTH_STORE_BACKEND=sqlite` and `FS_PROVIDER=local` remain functional — every new
backend is additive behind an env switch.

---

## 5. Open questions & sign-off

**Blocking (answer before the RBAC schema/registry work starts):**

- [ ] **Q1.1 — The big one:** confirm **reads systemwide, writes campus-scoped** (ADR-002 §2).
  If any role's *reads* must be campus-restricted, every Cypher read needs a mandatory campus
  filter and the 6-week plan must be resized — say so now.
- [ ] **Q1.2** `Person.can_approve_yse`: who holds it today (agent will produce the list), and
  which role does each holder map to (`wg_lead` vs `campus_admin`)?
- [ ] **Q1.3** Password policy for local accounts: proposed = min 12 chars, no composition
  rules, breach-list check deferred. OK?
- [ ] **Q1.4** Session lifetime: keep 12 h, or shorten (8 h) now that revocation exists?

**Checkpoint (during the week):**

- [ ] **Q1.5** Approve the person_uid backfill mapping report (each unmatched auth user needs a
  decision: create Person, link manually, or leave unlinked-with-warning).
- [ ] **Q1.6** Confirm contested matrix cells (contributor deletes own uploads? viewer role
  needed at launch or later?).

**Exit checklist (sign before Phase 2):**

- [ ] Two-container verification passed (screenshot/log in the Decision Log)
- [ ] RBAC DDL applied; SQLite users migrated; `AUTH_ADMINS` → role rows
- [ ] Attribution is session-derived; payload-Person-creation path deleted
- [ ] healthz/readyz live; stdout logging; secure defaults flipped
- [ ] S3 settings ledger complete (feeds week-4 Terraform)
- [ ] Decisions recorded in the Decision Log
