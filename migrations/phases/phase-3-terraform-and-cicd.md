# Phase 3 — Terraform rebuild + CI/CD (Week 4: Aug 10–14)

**Goal:** everything hand-built in week 3 is recreated **from code**, the hand-built stack is
destroyed, prod is stamped dark from the same modules, and merges to master deploy staging
automatically. From this week on, *the repository is the configuration*.

**Why this phase is independently shippable:** "infrastructure reproducible from an empty AWS
account + push-to-deploy" is a complete, verifiable capability on its own — it's also the
user's stated end-goal for the AWS portion ("use infra as code to save all settings").

**Approach is fixed by [ADR-003](../adr-003-by-hand-then-iac.md):** rebuild from code and
throw away `ati-manual-*`; never `terraform import`.

---

## 1. Concepts

**Terraform's loop.** You declare resources in `.tf` files (HCL); `terraform plan` diffs your
declaration against reality and shows what would change; `terraform apply` makes it so. The
**state file** is Terraform's memory of what it manages — ours lives in an S3 bucket with the
native lockfile (`use_lockfile = true`), so state survives your laptop.

**Drift** = someone changed reality outside Terraform (console edit). `terraform plan` exposes
it. After this week, console changes to app-stack resources are forbidden; break-glass edits
get back-ported to HCL the same week.

**Roots and modules.** A *root* is a directory you run `apply` in, with its own state. We use
two roots per environment (ADR-003): `foundation` (stateful, precious: S3 data bucket, RDS,
ECR, ACM — `prevent_destroy = true`) and `app` (stateless, cattle: VPC, ALB, ECS, WAF —
destroyable at will). Shared *modules* hold the resource definitions; `envs/staging` and
`envs/prod` are thin roots that instantiate them with different variables. Directory-per-env,
no workspaces — more legible for a first-timer.

**Why the split matters this week:** the week-3 hand-built stack is destroyed, but its *data*
(RDS contents, S3 objects) must survive. Foundation resources are created once by Terraform and
the data migrates in; only app-stack resources are the throwaway experiment.

**CI/CD pipeline.** GitHub Actions builds the image → pushes to ECR → tells ECS to deploy the
new task definition. Staging deploys on every merge to master; prod waits for a **manual
approval gate** (GitHub environment protection rule).

**WAF** — a rule layer on the ALB: AWS managed rule sets (common attacks, bad inputs) plus a
**rate-based rule on the login path** (closes the audit's "login brute-force, no throttle"
finding at the edge; app-level lockout follows in week 5).

---

## 2. Runbook (human track — agent-paired learning week)

You write the HCL with the agent pairing; you run every `plan`/`apply` yourself and read the
plans. Suggested order:

1. **Bootstrap:** state bucket (console, once) + `infra/` skeleton:
   ```
   infra/
     modules/{network,ecs-app,rds,files-bucket,waf,alarms}/
     envs/staging/{foundation,app}/
     envs/prod/{foundation,app}/
   ```
2. **`envs/staging/foundation`:** ECR, RDS, files bucket, ACM cert, Secrets Manager entries —
   apply, then migrate data in: RDS dump/restore from the hand-built instance, `aws s3 sync`
   from the hand-built bucket. Add `prevent_destroy` lifecycle blocks.
3. **`envs/staging/app`:** VPC via `terraform-aws-modules/vpc`; hand-written `aws_ecs_*`,
   `aws_lb_*`, SG chain — transcribed from your week-3 settings ledger. Apply → a parallel
   stack (`ati-staging-*`) rises next to `ati-manual-*`.
4. **Parity check:** run the identical Phase-2 smoke test against the Terraform stack's URL.
5. **Destroy the hand-built stack** (console, deliberately — feel what it deletes; RDS/S3
   week-3 originals can go once data migration is verified).
6. **Stamp prod dark:** `envs/prod/{foundation,app}` with prod tfvars (bigger tasks, multi-AZ
   RDS toggle) — applied, healthy, **no users and no data**; final data sync happens at
   cutover (Phase 5).
7. **ACM validation:** chase the campus-IT ticket from week 3; attach certs.
8. Read every `terraform plan` before approving — that habit *is* the deliverable.

---

## 3. Agent track (parallel, reviewable PRs)

1. **Deploy pipeline** (`.github/workflows/deploy.yml`): build → push ECR → update ECS service
   (staging on merge to master; prod behind a GitHub environment approval gate). Image tags =
   git SHA; rollback = redeploy previous tag (documented one-liner).
2. **WAF module:** AWS managed core rule set + rate-based rule on `/ati/data-api/v1/login`
   (+ the IP-allowlist rule if Q2.1 said restrict).
3. **Four CloudWatch alarms → email (SNS):** ALB 5xx rate; ECS running < desired; RDS free
   storage; account budget. Written as the `alarms` module.
4. **Drift check job:** scheduled `terraform plan -detailed-exitcode` in CI, red on drift.
5. **Shadow-log triage #1:** first analysis of accumulated `audit_log` shadow decisions —
   would-deny events classified as (a) real policy (correct), (b) registry gap, (c) scope
   parser bug. Fixes for (b)/(c) land now; report to human for (a) review.

---

## 4. Verification

**The one end-to-end check:** from an **empty state** (fresh `terraform apply` of both staging
roots), the resulting stack passes the *unchanged* Phase-2 smoke test; an immediate follow-up
`terraform plan` shows **zero changes** (no drift, nothing unmanaged); and a push to master
auto-deploys a trivial change to staging (bump a version string, watch it appear).

Plus: prod stack applied and healthy (dark); alarms fire a test notification; hand-built stack
gone.

Rollback: `terraform destroy` on the app root and re-apply — cattle, not pets. Foundation
roots are protected by `prevent_destroy`.

---

## 5. Open questions & sign-off

**Blocking:**

- [ ] **Q3.1** Prod sizing to start: proposed 2 × (0.5 vCPU / 1 GB) Fargate tasks, RDS
  `db.t4g.micro` single-AZ (multi-AZ at ~2× cost — defensible to defer until post-cutover).
  Approve or adjust; see the cost model in [README.md](README.md).
- [ ] **Q3.2** Who can approve prod deploys (the GitHub environment gate)? Just you, or a
  second person for bus-factor?
- [ ] **Q3.3** Alarm destination email (and is email enough, or add SMS for the 5xx alarm)?

**Checkpoint:**

- [ ] **Q3.4** Review shadow-log triage #1 — any (a)-class "real policy" denials that look
  wrong are early warnings about the matrix; adjudicate them now, not in week 5.
- [ ] **Q3.5** Approve destruction of the hand-built stack (after parity check passes).

**Exit checklist (sign before Phase 4):**

- [ ] Empty-state apply → smoke green; zero-drift plan; auto-deploy demonstrated
- [ ] Prod stamped dark from the same modules
- [ ] Hand-built `ati-manual-*` destroyed; data migrated and verified
- [ ] WAF live (incl. login rate rule); four alarms armed and test-fired
- [ ] Shadow-log triage #1 reviewed; registry/parser fixes merged
- [ ] ACM certs validated (or ticket escalated — flag as cutover risk)
