# ATI Analysis — Scale, Reliability & AWS Refactor Plan

> ## ⚠ Amended 2026-07-14 — execution moved to `phases/`
>
> This document remains the **workstream encyclopedia** (A–K below and the seam table), but
> the sequenced roadmap at the bottom is superseded by the **6-week phased plan in
> [phases/README.md](phases/README.md)**, which resequences the work after two code audits
> (auth surface + endpoint/scale inventory) and a design review. Key amendments:
>
> 1. **New Workstream K — Authorization/RBAC** (below, after H). The audits found that
>    server-side authorization **does not exist** — `is_admin` is computed but never enforced,
>    any authenticated user can mutate any campus's data, and attribution is client-supplied.
>    Workstream H (secrets hygiene) was necessary but nowhere near sufficient. Full findings:
>    [phases/security-review.md](phases/security-review.md); design:
>    [adr-002-rbac-and-identity.md](adr-002-rbac-and-identity.md).
> 2. **Right-sized concurrency target:** "hundreds–thousands of concurrent users" overstated —
>    the real shape is **low-thousands of accounts, low-hundreds concurrent at peak**
>    (reporting season). Autoscaling/pool/load-bar numbers in the phases use the smaller figure.
> 3. **Deferred tracks:** F (admin runtime config), G (agent platform), I (OpenAPI contract),
>    J (frontend) run **after** the 6-week window. In-window dependencies they inherit are
>    listed in [phases/README.md](phases/README.md).
> 4. **Five deviations** from this plan (CloudFront deferral, circular-import deferral,
>    load-test-driven pagination, reads-systemwide policy, CLI-only role admin) are recorded
>    with rationale in [phases/README.md](phases/README.md) for sign-off.
> 5. **IaC approach fixed by [adr-003-by-hand-then-iac.md](adr-003-by-hand-then-iac.md):**
>    staging built by hand as a learning reference, then rebuilt from Terraform and the
>    hand-built stack destroyed — never `terraform import`.

## Context

ATI Analysis is a Flask + neomodel + Neo4j knowledge graph with a React (CRA) frontend,
today deployed as a **single Windows box running IIS + wfastcgi**, manually pushed by
`robocopy` over an SMB share, with **no CI/CD, no containers**, and **live secrets committed
to `.env` files**. It runs against a **single on-prem Neo4j** at a fixed CSU IP, stores
**auth in a local SQLite file** and **uploaded files on local disk**, and **runs its test
suite against the live production database**. It cannot horizontally scale, cannot be safely
tested in CI, and is one disk failure away from data loss.

We want to move it to AWS and re-shape it to support **hundreds–thousands of concurrent
users** (one CSU-wide deployment, single shared graph), be **highly reliable**, stay
**Python on the backend**, become **highly testable/test-automated**, give **admins runtime
control over backend config**, and be a **reliable platform for AI-agent development**
(agent-operable MCP + agent-friendly codebase + evaluation/observability).

The good news: the codebase already has the **right seams** for almost every swap. This is a
**strangler-fig migration exploiting existing abstractions**, not a rewrite.

### Locked decisions (from planning Q&A)
- **Scale model:** one CSU-wide deployment, single shared Neo4j graph (multi-campus stays modeled *inside* the graph). No multi-tenant isolation work.
- **Auth:** keep **local accounts now**, but preserve/harden the provider seam so **SAML university SSO** drops in later.
- **Neo4j:** **Neo4j Aura (managed)**.
- **AI focus:** (1) agent-operable platform, (2) AI-agent-friendly codebase, (3) evaluation & observability. **No in-product LLM features** in scope.
- **Web framework:** stay on **Flask** for this migration (Django ruled out — the graph datastore neutralizes its ORM/admin value; see `adr-001-web-framework.md`). Adopt a **Pydantic v2 + OpenAPI 3.1** contract layer on Flask **now**, so a later **FastAPI** move is a drop-in, not a rewrite.
- **Frontend:** best-practices **modernization/rewrite** in scope — **Vite + TypeScript + Orval-generated typed client + TanStack Query + Playwright E2E**, migrated **incrementally**, **keeping Chakra UI + `claude_files/design-sense.md`** as the visual canon (re-tool the plumbing, not the look). See `frontend-modernization.md`.

---

## Target AWS architecture

```
Route53 → CloudFront ──► S3 (React build, static)          ← frontend, cached at edge
             │
             └► ALB (HTTPS, WAF) ──► ECS Fargate service: Flask/waitress (2..N tasks, autoscaled)
                        │                     │  │  │
                        │                     │  │  └─► Neo4j Aura (Bolt+routing, APOC Core)
                        │                     │  └────► RDS Postgres (auth store, runtime config, audit)
                        │                     └───────► S3 (uploaded files via app/fs S3 backend)
                        │
                        └► ECS Fargate service: ati-graph MCP (streamable-http, authed, write-gated)
   Secrets Manager + SSM Parameter Store → injected as env into both ECS services
   CloudWatch Logs/Metrics + OpenTelemetry traces ; ElastiCache Redis (rate-limit + cache) optional
   GitHub Actions → build/test (ephemeral Neo4j+APOC) → push ECR → deploy ECS
```

Key property: the Flask container becomes **stateless** — every piece of local state (SQLite,
disk files, per-PID logs, baked config) moves to a shared managed service, so ECS can run N
identical tasks behind the ALB.

---

## Workstreams

Each maps to one or more of the seven goals. Files named are the real seams to modify.

### A. Containerize + AWS runtime  *(goals: AWS, scale, reliability)*
- **Dockerfile** (Linux, Python 3.14, `waitress`/`gunicorn`) building `app/` + serving via `deployment/wsgi.py`'s `application`. Retire IIS/wfastcgi; keep `deployment/` PowerShell as legacy reference only.
- **Frontend to S3 + CloudFront**, not served by Flask. Stop shipping `frontend/src/build` inside the app container.
- **ECS Fargate** service + **ALB** (TLS, health checks) + autoscaling policy (target-tracking on CPU + ALB request count). Second Fargate service for the MCP server.
- **IaC**: Terraform (or CDK) for ALB/ECS/RDS/S3/CloudFront/Secrets/WAF — everything reproducible, no click-ops.
- Critical files: new `Dockerfile`, new `infra/` (Terraform), `deployment/wsgi.py` (reuse), `run.py` (dev only), `app/frontend/src/` build → S3.

### B. Make the app stateless  *(goals: scale, reliability, AWS)*
Every item below already has a seam — this is mostly *adding one backend + config*, not rearchitecting.
- **Config/secrets → env, sourced from Secrets Manager + SSM.** `app/config_gateway.py` already resolves `os.environ` first and is explicitly designed for "a new source plugs in HERE, once." In AWS, ECS injects Secrets Manager/SSM values as env vars → the gateway works **unchanged**. Drop the `web.config` source path in cloud (leave code for legacy). Add an optional native SSM/Secrets source in the chain for values you'd rather pull at runtime.
- **Auth store → RDS Postgres.** `app/auth/store.py` is a clean function API (`create_user`, `verify_user`, `set_password`, `set_active`, `list_users`). Add `app/auth/store_pg.py` implementing the same functions over psycopg, select via a new `AUTH_STORE_BACKEND` env (default `sqlite` for dev, `postgres` in cloud). Port `manage_users.py`. Passwords already werkzeug-hashed — migrate rows directly.
- **File store → S3.** `app/fs/base.py` defines `StorageBackend`; `app/fs/controller.py` selects by `FS_PROVIDER`. Add `app/fs/backends/s3.py` (boto3) implementing `save/open/exists/stat/delete/iter_keys`; set `FS_PROVIDER=s3`, `FS_S3_BUCKET=…`. Serve downloads via **presigned URLs** to keep bytes off the app tier. `gc_orphan_files.py` already iterates keys — works over S3 unchanged.
- **Sessions:** signed client-side cookies are already scale-friendly — **keep them**. Only requirement: identical `FLASK_SECRET_KEY` across tasks, sourced from Secrets Manager (`_finalize_secret` in `app/__init__.py` already fails closed).
- **Logging → CloudWatch.** Replace per-PID rotating files (`app/logging_config.py`) with structured JSON to stdout (12-factor); ECS ships to CloudWatch. Keep/replace the Seq shipper in `deployment/wsgi.py`.

### C. Neo4j Aura + data-layer hardening  *(goals: scale, reliability, AWS)*
- **Migrate to Aura**: export current graph, import to Aura, repoint `DATABASE_URL` (neo4j+s:// routing URI). Update the two `.env` templates and the connection model in `app/__init__.py` (`db.set_connection`) + `graph_schema.set_connection`.
- **APOC audit (blocking):** grep every `apoc.*` across the ~62 `db.cypher_query` sites (notably `queries/compound_queries/get_all_by_working_group_campus.py`). Confirm each is **APOC Core** (`apoc.convert.toJson`, `apoc.coll.toSet` are Core → OK on Aura). Any **APOC Extended / GDS** call must be rewritten in Cypher or moved to AuraDS. Produce an allowlist and fail CI if a non-Core apoc call is introduced.
- **Connection pool + resilience:** size the driver pool per Fargate task; add retry/backoff on transient Bolt errors; replace the brittle `hasattr(db,'connection')` guard in `app/__init__.py:before_request` with an explicit, version-stable init.
- **Pagination + read caps:** large reads (`get_all_persons`, working-group evidence trees) return whole sets today. Add limit/offset (or cursor) params to the heavy read endpoints and the N+1 `serialize()` loops flagged in `graph_schema.py`.
- **Read caching (optional):** ElastiCache Redis for hot read endpoints + the frontend report caches.

### D. Reliability & stability  *(goals: reliability, scale)*
- **Health endpoints:** add `GET /ati/healthz` (liveness) and `GET /ati/readyz` (checks Aura + Postgres + S3) for the ALB target group.
- **Global error handling in-process:** move the catch-all `@app.errorhandler(Exception)` from `deployment/wsgi.py` into `create_app()` so dev and prod behave identically; fix endpoints that `raise ApiError` instead of returning a response envelope (`StatusLevelAPI`, `TrendsAPI`, `report.GoalReportAPI`).
- **Rate limiting:** Flask-Limiter backed by Redis (or ALB/WAF rules) — protects the public read surface and the MCP write path.
- **Autoscaling + graceful shutdown:** ECS min 2 tasks across AZs; SIGTERM draining; request timeouts.
- **WAF** on CloudFront/ALB; security headers.

### E. Testability & CI/CD  *(goals: testable, reliability, agent-friendly)*
- **Ephemeral test DB in CI.** `tests/conftest.py` already supports redirect via `NEO4J_TEST_DATABASE_URL` + `NEO4J_TEST_DATABASE`. GitHub Actions spins a **Neo4j service container with APOC**, sets those two vars → the whole suite runs off a throwaway DB. Keep the `9999-9999` sentinel isolation as defense-in-depth. **Never run CI against live.**
- **Kill the two-venv split.** Standardize on **Python 3.14** everywhere (delete `.venv` 3.12 usage); one `requirements.txt` + `requirements-dev.txt`, lockfile. This removes the "reads work / writes fail" MCP footgun.
- **Fix the circular-import root cause** (also serves goal: agent-friendly). Move `errors/custom_exceptions.py` out of the `data_api` package into a neutral module, make endpoint registration explicit/lazy, and **remove the `_warmup_data_api()` accommodation** in `conftest.py` and the `ensure_app()` dance in the MCP features. This is the single biggest "agents keep tripping on this" fragility.
- **Frontend tests + e2e.** Frontend has only ~4 axios-mock tests today. Add React Testing Library component tests for the key containers/contexts, and a **Playwright** e2e smoke suite (login → dashboard → report) run in CI against a seeded stack.
- **Lint/type gates:** ruff + mypy (backend), ESLint + `CI=true npm test` (frontend), coverage thresholds — all wired into GitHub Actions PR checks.
- **Delete dead code** surfaced during exploration: `endpoints/data_api/api_endpoints.py` (never registered), the unregistered older `evidence.py`, `merge_query_params` in `app/__init__.py`, and the experimental `app/open-ai/` + `app/graphRag/` stubs (module-level side-effect `print`s). Less surface = fewer agent traps.

### F. Admin runtime config control  *(goal: admin control of backend config)*
Today **nothing operational is runtime-editable** — config is `web.config`/`.env` (edit + recycle), vocabularies are hardcoded in `app/data_config.py` (edit + restart), and academic-year defaults are duplicated across `data_config.py` + 3 frontend spots.
- **Runtime settings store:** an `app_settings` table in RDS Postgres (key/value + type + description + updated_by/at), fronted by an **admin-only** `GET/PUT /ati/data-api/v1/admin/settings` API and a **Settings → App Config** admin UI panel. Values feed a new source in the `config_gateway` chain (cached, with code defaults as fallback).
- **Feature flags:** same store; gate risky/AI features and the MCP write path.
- **Editable vocabularies:** promote the *display* vocabularies in `data_config.PUBLIC_VOCABULARIES` to DB-backed (graph nodes or the settings store) with the code map as seed/fallback, so admins edit working groups / status levels / year lists without a deploy. Keep structural dispatch maps (`implementor_classes`, etc.) as code — they are code, not settings.
- **Centralize academic-year state:** single source (settings store) consumed by both backend and frontend; eliminates the 4-way duplication the `semester-migration` skill exists to paper over.
- Gate the Settings route at the router level (today `Dashboard.js` renders it unconditionally; admin checks are only inside components).

### G. Agent-operable platform + evaluation  *(goal: AI development)*
- **Host the MCP server.** `app/database/cypher_runner/mcp/config.py` already supports `streamable-http` via `ATI_MCP_TRANSPORT`. Run it as its own **ECS Fargate service** behind the ALB. It already reuses the sanctioned `queries/<domain>` functions — keep that one-way coupling.
- **Auth + write-gating for hosted MCP:** put bearer-token/OIDC auth in front (today gating is only the `ATI_MCP_ALLOW_WRITE` env boolean, fine for local stdio, insufficient when hosted). Per-token scopes; keep `[WRITE]` tools opt-in.
- **Audit log:** every MCP/agent write (annotate_yse, set_yse_status, ontology edits, minutes) writes an append-only audit row (RDS) with actor/token, tool, args hash, target handle, timestamp — needed for trust + eval.
- **Evaluation harness:** golden datasets + assertion tests for the high-value read tools and the ontology engine (`introspect_schema`/`assemble_ontology`/`ontology_health` already unit-tested in `tests/test_ontology_engine.py` — extend into a graded eval). Track ontology description coverage (currently ~18.7%) as a metric over time.
- **Observability for AI:** OpenTelemetry traces spanning MCP tool → queries → Bolt; per-tool latency/error metrics in CloudWatch; structured logs correlating agent actions to graph changes.

### H. Security & hygiene (pre-req, do first)  *(cross-cutting)*
- **Rotate every committed secret** (Neo4j password `neo4j:accessibility`, the OpenAI key, the Asana PAT) and move to Secrets Manager. **Purge git history** (already tracked in memory: *repo-not-public-until-history-purged*) — keep repo private until done.
- Remove secrets from `app/.env.development` / `app/.env.production`; replace with `.env.example` templates.

### K. Authorization & RBAC  *(added 2026-07-14; goals: security, multi-campus scale — cross-cutting, in-window)*
Added after the auth audit found a flat authenticated-or-not model with no enforcement of
`is_admin`, no campus scoping, spoofable attribution, and no audit trail.
- **Campus-scoped RBAC:** 5 fixed roles (`system_admin/campus_admin/wg_lead/contributor/viewer`)
  in Postgres `role_assignments`; default policy reads-systemwide/writes-campus-scoped.
- **Enforcement:** central permission registry + blueprint `before_request`, deny-by-default
  (incl. on registry miss, CI-checked against `app.url_map`); `RBAC_MODE=off|shadow|enforce`
  staged rollout (schema wk 2 → shadow wks 3–4 → enforce wk 5); campus scope derived from
  composite identifiers (kind-aware parser in `identifiers.py`) with query-layer
  `assert_scope` as defense in depth.
- **Identity:** `users.person_uid` links auth users to graph Persons (one-time reviewed email
  backfill); attribution comes from the session, never the body; `session_epoch` gives
  revocation; `Person.can_approve_yse` migrates into role assignments.
- **Hardening bundle:** login lockout + WAF rate rule, upload MIME allowlist + presigned
  downloads (kills the stored-XSS vector), file-delete ownership, password reset, secure
  cookie/auth defaults, append-only `audit_log`.
- Authoritative artifacts: [phases/security-review.md](phases/security-review.md) §4;
  decisions: [adr-002-rbac-and-identity.md](adr-002-rbac-and-identity.md).

### I. API contract layer — OpenAPI on Flask  *(goals: agent-friendly, testable, reliability; enables the frontend — **deferred track**)*
The linchpin that connects "Flask now / FastAPI later" with "Orval on the front."
- Introduce **Pydantic v2** request/response models at the endpoint boundary and **emit an OpenAPI 3.1 spec** from Flask via a Pydantic-native bridge (shortlist: **flask-openapi3** or **spectree**; pick via a short spike). The spec is the single source of truth for the API contract.
- Adopt **incrementally**: wrap the existing MethodView action-dispatch endpoints (`endpoints/data_api/*.py`) with schema validation + typed responses, domain by domain. Validation replaces ad-hoc `request.get_json()` handling and yields consistent `400`s (ties into Workstream D's error envelope).
- Publish the spec at `GET /ati/openapi.json` (+ Swagger/Redoc UI in non-prod). **Commit a snapshot** so drift is a reviewable diff and CI can fail on generated-vs-committed mismatch.
- **FastAPI portability:** the Pydantic models + the framework-agnostic `queries/` layer are exactly what a future FastAPI app reuses — that move becomes low-risk and stays off the critical path.
- **Agent value (G):** the OpenAPI spec is an agent-consumable contract; pairs with the MCP surface.

### J. Frontend modernization / rewrite  *(goals: maintenance, testable, agent-friendly)*
Full detail in `frontend-modernization.md`; summary:
- **Build:** **CRA → Vite** (CRA is deprecated). Vite `server.proxy` replaces `setupProxy.js`; SPA output → S3/CloudFront (Workstream A). Not Next.js — no SSR tier for a static SPA + API.
- **Language:** **JS → TypeScript**, incrementally (`allowJs`, area by area).
- **Typed API layer via Orval:** generate a **typed client + TanStack Query hooks + MSW mocks** from the OpenAPI spec (Workstream I). **Replaces `services/api/{get,post,put,delete}.js`** and **deletes the hand-rolled caching / in-flight-dedupe in `DataContext`** (TanStack Query does it natively). Orval's client uses the existing `setupAxios.js` instance (withCredentials + 401 interceptor) pointed at a **runtime** API base URL (fixes the build-time-baked `REACT_APP_API_URL`).
- **State split:** TanStack Query owns server state; keep `SettingsContext` (currentCampus/year, URL-driven) + `AuthContext`/`AuthGate` for UI/session state. Centralized academic-year (Workstream F) removes the 4-way year duplication.
- **Design system:** **keep Chakra UI + `design-sense.md`** — preserve the look. (Chakra v2→v3 and any visual redesign are separate, opt-in tasks.)
- **Testing:** RTL component tests against Orval **MSW mocks** (deterministic, no live backend) + **Playwright** E2E in CI (login → dashboard → report → upload). Replaces the ~4 axios-mock tests that cover almost nothing today.
- **Strategy:** **strangler-fig, area by area** (`report_`, `settings_`, `graph_components`, `campus_plan_`) — stand up the Vite+TS+Orval shell first, then migrate one area at a time behind the same routes.

---

## Sequenced roadmap

> **Superseded 2026-07-14:** the operative sequence is the 6-week plan in
> [phases/README.md](phases/README.md) (Phase 0 hygiene/CI → 1 statelessness/identity → 2 AWS
> staging by hand + Aura → 3 Terraform/CI-CD → 4 RBAC enforcement/hardening → 5
> scale-verify/cutover, with I/J/G/F as post-window tracks). The table below is kept for the
> original workstream mapping.

| Phase | Theme | Outcome |
|---|---|---|
| **0. Hygiene** (H, part of E) | Rotate + purge secrets; standardize on Py 3.14 single venv; delete dead code | Safe to open up, no interpreter footgun |
| **1. CI foundation** (E) | Dockerfile; GitHub Actions with ephemeral Neo4j+APOC; fix circular-import root cause; suite green off live DB | Every PR tested automatically, reproducibly |
| **2. Statelessness** (B) | S3 fs backend; Postgres auth store; config via env/Secrets Manager; stdout logging | App runs identically on N nodes |
| **3. AWS runtime** (A, C) | Terraform ECS/ALB/RDS/S3/CloudFront; migrate graph to Aura (APOC audit); frontend to CloudFront | Live on AWS, horizontally scalable |
| **4. Reliability & scale** (D, C) | Health checks, autoscaling, rate limiting, pagination, caching, WAF, in-process error handler | Handles hundreds–thousands of users, stable |
| **5. Admin config** (F) | Runtime settings store + admin UI, feature flags, editable vocabularies, centralized AY | Admins control backend config without deploys |
| **6. Agent platform + eval** (G) | Hosted authed MCP service, audit log, eval harness, OTel tracing | Reliable, observable AI-agent platform |
| **API-contract track** (I) | Pydantic + OpenAPI on Flask; publish + commit `/ati/openapi.json` | Typed contract; unblocks Orval; portable to FastAPI |
| **Frontend track** (J) | Vite+TS shell → Orval client → migrate areas → Playwright E2E | Modern, typed, tested frontend on CloudFront |

Phases 0–1 are prerequisites; 2–3 are the core lift; 4–6 can partly parallelize once the app is on AWS.
The **API-contract track (I)** should start alongside Phase 1 — it is the linchpin for both agent-friendliness and the frontend. The **frontend track (J)** runs largely in parallel once track I emits a first spec; neither blocks the AWS/scale phases.

---

## Critical files / seams to modify (representative)

| Concern | Existing seam to reuse | Change |
|---|---|---|
| Config/secrets | `app/config_gateway.py` (os.environ-first chain) | Inject via Secrets Manager/SSM; optional native source in chain |
| Auth store | `app/auth/store.py` (function API), `providers/__init__.py` (SSO seam) | Add `store_pg.py`; keep provider seam for SAML |
| File storage | `app/fs/base.py` `StorageBackend`, `controller.py` `FS_PROVIDER` | Add `backends/s3.py`, presigned URLs |
| Neo4j connection | `app/__init__.py` before_request, `graph_schema.set_connection` | Repoint to Aura; robust init; pool tuning |
| Heavy reads | `queries/compound_queries/get_all_by_working_group_campus.py`, `graph_schema.py` serialize loops | APOC-Core audit; pagination; fix N+1 |
| MCP hosting | `app/database/cypher_runner/mcp/config.py` (transport), `server.py` | streamable-http on ECS; token auth; audit |
| Tests/CI | `tests/conftest.py` (`NEO4J_TEST_DATABASE_URL` redirect) | Ephemeral Neo4j in Actions; remove warm-up hack |
| Deploy | `deployment/` (IIS, reference), `deployment/wsgi.py` | New `Dockerfile` + `infra/` Terraform; ECS |
| Admin config | `app/data_config.py`, `endpoints/data_api/settings.py` (GET-only) | Settings store + admin PUT + UI |
| Dead code | `endpoints/data_api/api_endpoints.py`, `evidence.py`, `app/open-ai/`, `app/graphRag/`, `merge_query_params` | Delete |
| API contract | `endpoints/data_api/*.py` (MethodView action-dispatch) | Wrap with Pydantic schemas; emit + commit OpenAPI at `/ati/openapi.json` |
| Frontend build | `app/frontend/src/` (CRA), `setupProxy.js`, `setupAxios.js` | CRA→Vite, JS→TS, Vite proxy; runtime API base URL |
| Frontend data layer | `services/api/{get,post,put,delete}.js`, `context/DataContext.js` | Replace with Orval client + TanStack Query hooks; delete hand-rolled cache |

---

## Verification

- **Per workstream, add/extend tests first** (the suite is the safety net for a strangler migration):
  - **B (stateless):** `tests/test_fs.py` parametrized to run against a MinIO/S3 mock; new `test_auth_store_pg.py` mirroring `test_auth_store.py` against a Postgres test container; `test_config_gateway.py` extended for the new source order.
  - **C (Aura/APOC):** a CI check that greps for non-Core `apoc.*`; run the full integration suite against an Aura-parity Neo4j+APOC container.
  - **E (CI):** GitHub Actions green on a fresh checkout with **no access to the live DB** — this is the acceptance test that CI works.
  - **D (reliability):** load test (k6/Locust) against the ALB to a target concurrency; confirm autoscaling triggers and p95 latency holds; `curl /ati/readyz` returns dependency health.
  - **F (admin config):** change a vocabulary/feature flag via the admin UI and confirm it takes effect **without redeploy**; assert academic-year rollover no longer needs frontend edits.
  - **G (agent platform):** drive the hosted MCP over streamable-http from Claude Code with a scoped token; confirm write-gating + audit rows; run the ontology eval harness and record coverage.
  - **I (API contract):** CI diffs the generated OpenAPI against the committed snapshot (fail on drift); schema-validation unit tests for representative endpoints; Swagger UI loads in non-prod.
  - **J (frontend):** `tsc --noEmit` + ESLint clean; RTL suites run against Orval MSW mocks with zero network; Playwright E2E green in CI against the seeded stack; bundle-size/Lighthouse budget enforced on the Vite build.
- **End-to-end smoke (Playwright, in CI):** login → dashboard → open an indicator report → upload a file (lands in S3) → agent annotation via MCP appears in the report.
- **Cutover validation:** run AWS stack in parallel with the IIS box against a read replica/export, diff key report payloads old-vs-new (the `neomodel-defaults-vs-apoc-null` memory is the template for deep old-vs-new diffing) before DNS switch.
