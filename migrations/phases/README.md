# phases/ — The 6-week execution plan

This folder is the **execution layer** of the AWS scale refactor: six week-sized phases, each
independently buildable, testable, and verifiable. The master plan
([../aws-scale-refactor-plan.md](../aws-scale-refactor-plan.md)) remains the workstream
encyclopedia; these docs are what we actually run, in order.

Two cross-cutting design docs ground the phases:

- **[schema-review-23-campuses.md](schema-review-23-campuses.md)** — what the graph schema and
  API surface look like under 23 campuses / low-thousands of users, and the changes required.
- **[security-review.md](security-review.md)** — threat model, the full findings-to-controls
  traceability table, and the campus-scoped RBAC design.

Decision records: [ADR-002 RBAC & identity](../adr-002-rbac-and-identity.md),
[ADR-003 by-hand-then-IaC](../adr-003-by-hand-then-iac.md).

---

## How each phase works (the in-the-loop protocol)

Every phase doc has the same five sections, and the protocol is the same every week:

1. **Concepts** — read first. A plain-language primer on the week's new technology. Nothing in
   the runbook should be a mystery after this section.
2. **Runbook (human track)** — the by-hand steps *you* execute: console work, decisions,
   external tickets. This is deliberately not automated — doing it by hand once is how the
   settings become understood before infra-as-code captures them.
3. **Agent track** — code built in parallel (delegable to Claude) against seams identified in
   the audits. You review PRs; you don't have to write this.
4. **Verification** — ONE end-to-end check that proves the phase done, plus the automated
   tests that lock it in.
5. **Open questions & sign-off** — questions you answer **before** (blocking) or **during**
   (checkpoint) the phase, and an exit checklist you sign before the next phase starts.

**A phase does not start until its blocking questions are answered, and does not end until its
exit checklist is signed.** Record every answer in the Decision Log below so the reasoning
survives the migration.

---

## Calendar

| Week | Dates (2026) | Phase | Theme | One-line exit test |
|---|---|---|---|---|
| 1 | Jul 20–24 | [Phase 0](phase-0-hygiene-and-ci.md) | Hygiene + CI foundation | CI green on a fresh clone with zero live-DB access |
| 2 | Jul 27–31 | [Phase 1](phase-1-statelessness-and-identity.md) | Statelessness + identity foundation | Two containers share Postgres + S3; no local state |
| 3 | Aug 3–7 | [Phase 2](phase-2-aws-staging-by-hand.md) | AWS staging by hand + Aura | Outside-network HTTPS smoke + clean Aura payload diff |
| 4 | Aug 10–14 | [Phase 3](phase-3-terraform-and-cicd.md) | Terraform rebuild + CI/CD | Empty-state `terraform apply` passes the same smoke |
| 5 | Aug 17–21 | [Phase 4](phase-4-rbac-enforcement-and-hardening.md) | RBAC enforcement + hardening | Permission-matrix suite green; every denial audited |
| 6 | Aug 24–28 | [Phase 5](phase-5-scale-verify-and-cutover.md) | Scale-verify + cutover | Load bar met; zero-diff parallel run; DNS cut |

> ⚠ **Calendar collision:** week 6 lands at CSU fall-semester start. Phase 5 carries a blocking
> question: cut over mid-August (compress) or parallel-run into early September with the IIS
> box as instant rollback. Decide by end of week 4.

Pacing assumption: **~15–20 focused human-hours/week plus agent leverage.** Weeks 3–4 are
deliberately *human-learning* weeks (AWS console, Terraform) while the agent track builds the
RBAC machinery in shadow mode — the two tracks are pipelined, not serial.

---

## The RBAC through-line (why it's sliced across weeks 2–5)

RBAC touches every endpoint and is the highest-regression-risk change in the program, so it is
**never a one-week monolith**:

- **Week 2** — the full relational schema lands with the Postgres auth store (users,
  role_assignments, audit_log), plus session-bound attribution.
- **Weeks 3–4** — enforcement middleware runs in **shadow mode** on staging: it computes
  allow/deny on every real request and logs the decision, but blocks nothing. Two weeks of
  empirical evidence accumulate while you're heads-down in the console.
- **Week 5** — analyze the shadow log, fix false denials, flip `RBAC_MODE=enforce`, run the
  permission-matrix suite.

Building is decoupled from enforcing; that's what makes each slice independently verifiable.

---

## Deviations from the master plan (need your sign-off)

These were recommended by the design review and are reflected in the phase docs. Initial each
one (or push back) before Phase 0 starts:

| # | Deviation | Rationale | Sign-off |
|---|---|---|---|
| 1 | **CloudFront + S3 static hosting deferred** — the SPA is served same-origin from the Flask container; WAF attaches to the ALB directly | CRA bakes `REACT_APP_API_URL` into the bundle across dozens of files; same-origin + relative API base deletes CORS, per-env builds, and cache invalidation from the window. CloudFront returns naturally with the Vite rewrite (track J). | ☐ |
| 2 | **Circular-import refactor deferred** past week 6 | Serves the deferred agent-friendliness goal; `_warmup_data_api()` works in CI; the import-graph restructure eats days | ☐ |
| 3 | **Pagination is load-test-driven, not scheduled** | Graph is ~11.5K YSE; set the k6 bar, paginate only endpoints that fail it | ☐ |
| 4 | **Reads systemwide, writes campus-scoped** (default RBAC policy) | Matches today's observed behavior; halves the enforcement problem. *Also a Phase 1 blocking question — this row is the policy default if you agree.* | ☐ |
| 5 | **Role administration is CLI-only in-window** | User management is CLI-only today; an admin UI belongs to deferred track F | ☐ |

## Deferred tracks (post-week-6)

| Track | What | New dependency created by this window |
|---|---|---|
| I — OpenAPI contract | Pydantic + committed spec on Flask | Registry of endpoints from RBAC work doubles as the spec inventory |
| J — Frontend modernization | Vite + TS + Orval + TanStack Query + Playwright | Must absorb **role-aware UI** (route-level gating replacing advisory checks; today `Dashboard.js:63` renders Settings unguarded) and restore CloudFront hosting |
| G — Agent platform | Hosted MCP, token auth, eval harness | MCP remains an acknowledged RBAC bypass (env-gated, writes off) until this track adds per-token identity |
| F — Admin runtime config | Settings store + admin UI | Role-assignment UI lands here |

---

## Decision Log

Append-only. Every blocking/checkpoint question's answer goes here with a date.

| Date | Phase | Decision | Notes |
|---|---|---|---|
| 2026-07-14 | — | 6-week scope = core infra + security; tracks I/J/G/F deferred | Paced for solo maintainer with other duties |
| 2026-07-14 | — | Campus-scoped RBAC built in-window (5 fixed roles) | See ADR-002 |
| 2026-07-14 | — | Local accounts kept; RBAC store SAML-ready; self-service password reset added | SAML/InCommon is a post-window track |
| 2026-07-14 | — | Two environments: staging + prod | Staging is the by-hand sandbox; prod stamped from Terraform |
| 2026-07-14 | — | By-hand first, then Terraform **rebuild** (never `terraform import`) | See ADR-003 |
