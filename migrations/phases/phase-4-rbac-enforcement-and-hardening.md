# Phase 4 — RBAC enforcement + security hardening (Week 5: Aug 17–21)

**Goal:** flip authorization from shadow to **enforce** on staging — backed by two weeks of
shadow-mode evidence — and close the remaining audit findings (login protection, upload
hardening, file-delete ownership, password reset). Plus the one scheduled performance fix: the
goal-report N+1.

**Why this phase is independently shippable:** enforcement is a staged flag flip on an
environment carrying no production traffic, validated by its own test suite. Even if cutover
slipped indefinitely, "staging enforces campus-scoped RBAC with a green permission-matrix
suite" is a complete, demonstrable capability.

**Precondition:** shadow mode has run on staging since week 3 and both triage passes are done.
If shadow coverage has gaps (an endpoint nobody exercised), exercise it *before* flipping.

---

## 1. Concepts

**Shadow → enforce.** For two weeks the middleware computed a decision for every real request
and logged it without blocking. Flipping to enforce doesn't introduce new logic — it changes
what happens on "deny" from *log* to *403*. That's why the risk profile is low: the decisions
have been observable, and false denials were fixed while they were harmless log lines.

**Deny-by-default, in both dimensions.** (1) A request matching no registry entry → 403 (new
endpoints fail closed until registered — and CI fails if the registry doesn't cover the URL
map). (2) A user with no applicable role assignment → 403. Security posture comes from the
defaults, not from remembering to add checks.

**Presigned URLs kill two birds.** Serving downloads via short-lived presigned S3 URLs moves
file bytes off the app tier (scale win) *and* takes uploaded content off the app origin — an
uploaded HTML/SVG no longer renders same-origin, which neutralizes the stored-XSS finding
without content-sniffing gymnastics. Combined with an upload allowlist, the file-abuse surface
closes.

**Account lockout vs edge rate-limiting.** Week 4's WAF rate rule throttles by IP (stops dumb
brute force); app-level lockout (`failed_logins`/`locked_until`, schema already present since
week 2) stops targeted guessing that rotates IPs. Both are cheap; do both.

**Why the N+1 fix is here, not week 6:** week 6 is cutover week — no new app code. The
goal-report fix is independent of RBAC, near-certain needed (hundreds of Bolt round-trips per
report now cross ~tens-of-ms WAN latency to Aura → multi-second reports), and the Phase-2 diff
harness is its ready-made regression net.

---

## 2. Runbook (human track)

1. **Review the shadow-log analysis** (agent produces it Monday): every distinct
   (endpoint, action, role) → decision, with would-deny events classified. You adjudicate the
   contested cells — these are policy calls, not code calls.
2. **Final matrix sign-off** (the authoritative copy in
   [security-review.md](security-review.md) §4 gets your initials per contested row).
3. **Flip `RBAC_MODE=enforce` on staging** (one env var via Terraform; you run the apply).
4. **QA as each role:** the seed script creates five fixture users (one per role, scoped to a
   sentinel campus). Log in as each; confirm the app degrades gracefully on 403s (the frontend
   shows a permission message rather than a blank crash — agent adds the minimal interceptor
   handling; full role-aware UI is track J).
5. **Grant real roles:** using the new CLI, assign roles to the actual current user base
   (~handful of users today), including the `can_approve_yse` migration mapping you approved in
   week 2.
6. **Password reset path decision:** if SES production access arrived, test the email flow; if
   not, confirm the fallback (admin-set temp password + forced change at next login) as the
   launch story.

---

## 3. Agent track (parallel, reviewable PRs)

1. **Shadow-log analysis + false-denial fixes** (registry entries, scope-parser edge cases).
2. **Permission-matrix pytest suite** (`pytest -m rbac`): five fixture users × the matrix —
   contributor writes evidence at campus A (200) and campus B (403); viewer any-write (403);
   wg_lead edits own-WG minutes (200) / other-WG (403); campus_admin cross-WG (200);
   system_admin grants a role; **every denial asserted to have an `audit_log` row**. Uses the
   `9999-9999` sentinel-year isolation.
3. **Role CLI:** `manage_users.py grant-role / revoke-role / list-roles` + the seed script
   (fixture users, `can_approve_yse` migration).
4. **Password reset:** token flow (hash-at-rest `reset_token_hash`, expiry) + SES send; CLI
   fallback `manage_users.py set-temp-password --force-change`.
5. **Login lockout:** threshold/backoff using the week-2 columns (proposed: 10 failures → 15
   min lock; alarm on lock spikes).
6. **Upload hardening:** extension + MIME allowlist (docx/xlsx/pptx/pdf/png/jpg/csv/txt/md —
   Q4.2 confirms), size cap kept at 50 MB; **downloads switch to presigned URLs** (
   `StoredFile.serialize()`'s `download_url` becomes a redirect endpoint that mints one);
   `Content-Disposition: attachment` for anything not on an inline-safe list.
7. **File-delete ownership:** `DELETE /files/<key>` enforces the matrix's delete column
   (uploader / WG / campus_admin scope) via the graph-derived scope check in the query layer.
8. **`get_goal_report` N+1 fix:** rewrite per the batched-apoc pattern proven in
   `implementation/read.py:184-342` — one (or few) Cypher round-trips per report instead of
   hundreds. Validated against the diff harness (payload-identical) + a timing assertion.

---

## 4. Verification

**The one end-to-end check:** the permission-matrix suite runs green **against enforcing
staging** — five fixture users, every allow/deny cell exercised, cross-campus writes 403,
every denial carrying an `audit_log` row — and you have personally logged in as each role and
seen the app behave.

Plus: goal report payload-identical and ≥10× fewer DB round-trips (timing logged);
upload of an `.html` file rejected; download of a real file arrives via presigned URL;
locked-out account after 10 bad passwords; reset flow (email or fallback) works end-to-end.

Rollback: `RBAC_MODE=shadow` — one env var, instant, keeps logging.

---

## 5. Open questions & sign-off

**Blocking:**

- [ ] **Q4.1** Adjudicate the shadow-log contested cells (list produced Monday). Known
  candidates: contributor deleting own uploads; whether `viewer` exists at launch or waits for
  real read-only users; whether wg_lead can edit the campus plan's executive summary.
- [ ] **Q4.2** Upload allowlist: confirm the proposed extension list (what do campuses actually
  attach as evidence — any format missing?).
- [ ] **Q4.3** Lockout parameters: 10 failures / 15 minutes OK?

**Checkpoint:**

- [ ] **Q4.4** SES arrived? Choose launch story: email reset vs admin temp-password.
- [ ] **Q4.5** Review the real-user role grants before they're applied (the handful of current
  users — who gets campus_admin where?).

**Exit checklist (sign before Phase 5):**

- [ ] `RBAC_MODE=enforce` on staging; matrix suite green; denials audited
- [ ] You QA'd all five roles by hand
- [ ] Goal-report fix merged; diff-harness clean; timing recorded
- [ ] Upload allowlist + presigned downloads + delete ownership live
- [ ] Lockout + reset flow shipped; real users granted roles
- [ ] Decisions recorded in the Decision Log
