# Phase 2 — AWS staging by hand + Aura (Week 3: Aug 3–7)

**Goal:** a working staging environment on AWS, **built by hand in the console** so every
setting is understood before Terraform captures it (ADR-003), with the graph migrated to Neo4j
Aura and proven equivalent by a payload diff. This is the primary *learning week*.

**Why this phase is independently shippable:** at its end there is a real, reachable HTTPS
staging URL running the containerized app against Aura + RDS + S3 — a complete parallel
environment that can be evaluated on its own regardless of whether IaC or cutover ever happen.

**This hand-built stack is a throwaway reference implementation** — week 4 rebuilds it from
Terraform and destroys this one. Only the *foundation* data (RDS contents, S3 objects, Aura)
survives. Name everything `ati-manual-*` so the two stacks never blur.

---

## 1. Concepts

**The request path you're building:**
`browser → ALB (HTTPS, WAF later) → ECS Fargate task (your container) → Aura / RDS / S3`

- **VPC** — your private network slice. Subnets are address ranges pinned to availability
  zones (AZs); we use **public subnets** and skip NAT gateways at this scale (ADR-003 —
  Fargate tasks get public IPs; **security groups** do the real gatekeeping).
- **Security group (SG)** — a stateful firewall per resource. Ours: ALB-SG allows 443 from the
  world; App-SG allows the app port *only from ALB-SG*; RDS-SG allows 5432 *only from App-SG*.
  Chaining SGs by reference (not IP) is the idiom.
- **ECR** — AWS's Docker registry; you `docker push` the Phase-1 image to it.
- **ECS Fargate** — runs containers without managing servers. A **task definition** is the
  recipe (image, CPU/memory, env vars, secrets); a **service** keeps N tasks alive and
  registered with the ALB.
- **ALB + target group** — the load balancer spreads requests across tasks; the **target
  group** tracks which tasks are healthy by polling `/ati/healthz` (built in Phase 1). Tasks
  failing checks get replaced automatically.
- **ACM** — free TLS certificates, but validation requires a DNS record in the domain's zone —
  which for us means a **ticket to campus IT** (see runbook; likely the #1 external blocker).
- **Secrets Manager vs SSM Parameter Store** — Secrets Manager for credentials (Aura password,
  `FLASK_SECRET_KEY`, RDS password), SSM for plain config. ECS injects both as env vars, which
  `app/config_gateway.py` already reads — **no code change needed**; this is the seam working
  as designed.
- **Aura** — managed Neo4j. Connection URI changes from `bolt://` to `neo4j+s://` (TLS +
  routing). Only APOC *Core* exists there — which Phase 0's audit already verified/fixed.
  Import = upload a dump of the on-prem graph.
- **WAN latency changes the math:** on-prem Bolt round-trips were sub-millisecond; to Aura
  they're tens of ms. This is why the goal-report N+1 fix (hundreds of round-trips per request)
  is scheduled in week 5, and why the driver pool/retry tuning happens now.

---

## 2. Runbook (human track)

Record every non-default choice in the settings ledger (bottom) — it becomes week-4 HCL.

### Days 1–2 — Aura first (independent of all other AWS work)

1. Create the Aura instance (staging tier per Q2.2), get the `neo4j+s://` URI + credentials.
2. **Import rehearsal:** dump the on-prem graph (coordinate a quiet window), upload to Aura.
3. Apply the **unique-index constraint changes** from
   [schema-review-23-campuses.md](schema-review-23-campuses.md) §2 during the rehearsal — the
   import is the cheap moment to change constraints (agent track prepares the Cypher).
4. Run the agent-built **payload diff harness** (old-vs-new; the `neomodel-defaults-vs-apoc-null`
   memory is the template for why this matters). Iterate until the diff is clean.

### Days 2–3 — external tickets (start early; latency is not yours)

5. **DNS/TLS ticket to campus IT:** request (a) the ACM validation CNAME for the chosen
   hostname, (b) a heads-up that a CNAME cutover request follows in ~3 weeks. (Q2.3 decides the
   hostname first.)
6. **SES production access request** (AWS support ticket, ~24 h–days): needed for week-5
   password-reset email. Fallback exists (admin temp passwords) but ask now.
7. **Exposure policy check (Q2.1):** confirm CSU policy allows this app on the public internet
   behind WAF + enforced auth — or plan an IP-allowlist WAF rule.

### Days 3–5 — the AWS console runbook, in dependency order

8. **VPC:** create `ati-manual-vpc` (2 public subnets, 2 AZs, internet gateway). Console's
   "VPC and more" wizard is fine — read what it generates; that's the learning.
9. **SGs:** `ati-manual-alb-sg` (443 in from 0.0.0.0/0), `ati-manual-app-sg` (8080 in from
   alb-sg), `ati-manual-rds-sg` (5432 in from app-sg).
10. **RDS:** `db.t4g.micro` Postgres 17, single-AZ (staging), in the VPC with rds-sg. Run the
    Phase-1 DDL + migrate the dev Postgres data (agent provides the script).
11. **S3:** create the real staging files bucket (versioning on); copy dev-bucket objects if
    any matter.
12. **ECR:** create repo, `docker push` the Phase-1 image (console shows the exact commands).
13. **Secrets Manager:** store Aura URI/password, RDS URL, `FLASK_SECRET_KEY` (generate fresh
    ≥32 chars).
14. **ECS:** cluster → task definition (image, 0.5 vCPU/1 GB, env from SSM + secrets from
    Secrets Manager) → service (desired 2, app-sg, attach to target group).
15. **ALB:** create with alb-sg → target group (health check `/ati/healthz`) → HTTPS listener
    with the ACM cert (once validated via ticket #5; HTTP on a temp hostname if blocked).
16. Smoke it: hit the ALB DNS name, log in, click around.

> **Settings ledger:** VPC CIDR/subnets ▢ SG rules ▢ RDS class/engine/params ▢ bucket names ▢
> ECR repo ▢ task def (cpu/mem/env/secret ARNs) ▢ service desired count ▢ target group health
> path/thresholds ▢ listener/cert ▢ Aura tier/URI ▢

---

## 3. Agent track (parallel, reviewable PRs)

1. **Payload diff harness** — fetches the heavy read endpoints (goal report, WG evidence tree,
   yse catalog) from two backends and deep-diffs JSON (normalizing null/default drift);
   reusable in Phase 5's parallel-run check.
2. **Driver pool + resilience tuning** for WAN latency: explicit pool size per task,
   retry/backoff on transient Bolt errors, replace the `hasattr(db,'connection')` guard in
   `app/__init__.py:92-95` with an explicit version-stable init.
3. **RBAC shadow middleware deployed to staging by end of week** — the permission registry +
   `before_request` hook from ADR-002 §3 with `RBAC_MODE=shadow`: logs every
   (endpoint, action, role, campus, decision) to `audit_log`, blocks nothing. Includes the CI
   test walking `app.url_map` for registry coverage, and the kind-aware
   `campus_from_identifier` parser in `app/database/identifiers.py` (+ unit tests: YSE vs
   WGP vs asset identifier shapes, unknown-campus rejection).
4. **Unique-index migration Cypher** (from the schema review verdicts) ready for the import
   rehearsal.
5. **MCP repoint:** ati-graph MCP gets its own Aura credential (least privilege), writes
   default-off. Document loudly: **MCP bypasses app RBAC until track G** — acceptable only
   while restricted to the maintainer.
6. RDS DDL/data migration script (dev Postgres → RDS).

---

## 4. Verification

**The one end-to-end check:** from **outside the campus network**, open the HTTPS staging URL →
log in → open an indicator report (data served from Aura) → upload a file and download it
(bytes in the staging S3 bucket) — **and** the old-vs-new payload diff between on-prem export
and Aura is clean on the three heavy endpoints.

Plus: shadow-mode decisions visibly accumulating in `audit_log` (spot-check rows); `/ati/readyz`
green (Aura + RDS + S3 all reachable); kill one ECS task and watch the service replace it.

Rollback: nothing to roll back — production traffic still points at the IIS box; this whole
environment is additive.

---

## 5. Open questions & sign-off

**Blocking (answer before the week starts):**

- [ ] **Q2.1** Public exposure: does CSU policy permit the app publicly reachable behind
  WAF + enforced auth, or do we need an IP-allowlist (campus ranges + VPN) WAF rule from day
  one?
- [ ] **Q2.2** Aura tier: Free for staging + Professional (~$65/mo) for prod at cutover — or
  Professional for staging too (needed if Free's limits block the import; check dump size
  first)?
- [ ] **Q2.3** Hostname: what should the AWS-hosted app be called (e.g. `ati.sfsu.edu`
  retargeted at cutover vs a new name like `ati-csu.org` you control)? Determines who owns the
  DNS zone and how painful ticket #5 is.

**Checkpoint (during the week):**

- [ ] **Q2.4** Sign off the unique-index verdict table (schema review §2) before it's applied
  in the import rehearsal.
- [ ] **Q2.5** If the exposure answer is "restrict": approve the allowlist ranges.

**Exit checklist (sign before Phase 3):**

- [ ] Outside-network HTTPS smoke passed; readyz green; task-replacement observed
- [ ] Aura diff clean; constraint changes applied; on-prem graph still authoritative
- [ ] Shadow middleware live on staging; registry CI coverage test green
- [ ] SES request submitted; DNS/TLS ticket opened; exposure policy answered
- [ ] Settings ledger complete — every console choice recorded
- [ ] MCP repointed with scoped credential, writes off, bypass documented
