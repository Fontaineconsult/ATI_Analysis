# migrations/ — AWS Scale & Reliability Refactor planning workspace

This folder is where we plan the migration of ATI Analysis from the single Windows/IIS box
to a scalable, reliable, AWS-hosted, agent-operable platform. It is **planning docs, not
runnable DB migrations.**

## Start here

**[phases/](phases/README.md)** is the execution layer: six week-sized phases (Jul 20 – Aug 28,
2026), each independently buildable/testable/verifiable, with a phase-gate protocol that keeps
Daniel in the loop on every decision. Everything else in this folder is reference material the
phases point into.

## Documents

- **[phases/README.md](phases/README.md)** — the 6-week calendar, phase-gate protocol,
  deviations sign-off list, and the running Decision Log. **The place to look for "what do I do
  next."**
- **[phases/phase-0…phase-5](phases/)** — the six phase docs (Concepts / Runbook / Agent track /
  Verification / Open questions & sign-off).
- **[phases/schema-review-23-campuses.md](phases/schema-review-23-campuses.md)** — deep schema
  + API review for 23 campuses / low-thousands of users: unique-index collision verdicts,
  campus-anchoring analysis, volume math, endpoint inventory, the goal-report N+1 anatomy.
- **[phases/security-review.md](phases/security-review.md)** — threat model, the 16-finding
  register, findings→controls traceability, and the authoritative RBAC DDL + permission matrix.
- **[aws-scale-refactor-plan.md](aws-scale-refactor-plan.md)** — the master plan: workstreams
  A–K and the seam-by-seam file table. Reference encyclopedia; the phases sequence it.
- **[adr-001-web-framework.md](adr-001-web-framework.md)** — stay on Flask; Pydantic+OpenAPI
  later; FastAPI optional future.
- **[adr-002-rbac-and-identity.md](adr-002-rbac-and-identity.md)** — campus-scoped RBAC,
  SAML-ready identity model, enforcement design.
- **[adr-003-by-hand-then-iac.md](adr-003-by-hand-then-iac.md)** — AWS by hand first, then
  Terraform **rebuild** (never import); foundation/app root split.
- **[frontend-modernization.md](frontend-modernization.md)** — Workstream J deep-dive
  (**deferred** post-week-6; inherits role-aware UI + CloudFront restoration).

## Locked decisions

*From planning Q&A, 2026-07-14 (superseded/extended entries marked):*
- One CSU-wide deployment, single shared Neo4j graph (no multi-tenant isolation).
- Keep local accounts now; preserve the auth provider seam for eventual SAML university SSO.
  **Extended:** RBAC store designed SAML-ready (`auth_source`, future `idp_group_map`);
  self-service password reset added in-window. See ADR-002.
- Neo4j **Aura** (managed).
- AI focus: agent-operable platform + agent-friendly codebase + evaluation/observability. **No
  in-product LLM features.**
- Backend stays Python. **Web framework: Flask now** (ADR-001); Pydantic+OpenAPI contract is
  **deferred track I**.
- Frontend rewrite (Vite/TS/Orval/TanStack/Playwright) is **deferred track J**.

*Added 2026-07-14 (phase planning):*
- **6-week window, core infra + security only.** Tracks I, J, G (agent platform), F (admin
  runtime config) continue after week 6. Pacing assumes a solo maintainer with other duties;
  docs are written to teach, and human/agent tracks run in parallel each week.
- **Campus-scoped RBAC built in-window** — 5 fixed roles, reads-systemwide/writes-campus-scoped
  default, shadow→enforce rollout. See ADR-002.
- **Environments: staging + prod**, by-hand first then Terraform rebuild. See ADR-003.
- Five approved-pending-sign-off **deviations from the master plan** (CloudFront deferred,
  circular-import deferred, load-test-driven pagination, reads-systemwide, CLI-only role
  admin) — see the table in [phases/README.md](phases/README.md).

## Do-first, non-negotiable (Phase 0 — week 1)

- Rotate the live secrets currently committed in `app/.env.*` (Neo4j password, OpenAI key,
  Asana PAT) and purge git history (see memory: *repo-not-public-until-history-purged*).
  Now scheduled with a full runbook: [phases/phase-0-hygiene-and-ci.md](phases/phase-0-hygiene-and-ci.md).
- Standardize on Python 3.14 and retire the `.venv` (3.12) / `.venv314` split.
