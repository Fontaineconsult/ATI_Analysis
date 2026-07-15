# ADR-003 — AWS configured by hand first, then captured as infra-as-code (rebuild, not import)

- **Status:** Accepted
- **Date:** 2026-07-14
- **Deciders:** Daniel Fontaine

## Context

The AWS environment must be **configurable and testable by hand** — the maintainer is learning
the platform and needs to understand every setting — but the end state must be **infra-as-code
so all settings are saved** and prod is reproducible. Two ways to get from a hand-built
environment to Terraform: `terraform import` the existing resources, or rebuild them from
freshly written code and discard the hand-built stack.

## Decision

1. **Week 3: build staging by hand** (console/CLI runbook in
   [phases/phase-2-aws-staging-by-hand.md](phases/phase-2-aws-staging-by-hand.md)). The
   hand-built stack is a *reference implementation and learning exercise*, not the future
   production environment.
2. **Week 4: write Terraform from scratch and `apply` a fresh, name-prefixed parallel stack**
   (`ati-staging` alongside the hand-built `ati-manual`). Verify the Terraform stack passes the
   identical smoke test, then **destroy the hand-built stack**. Prod is a second thin root with
   different tfvars — the proof that the code captures every setting.
3. **Never use `terraform import`** for this migration.
4. **Split stateful from stateless roots:** `infra/foundation` (S3 data bucket, RDS, ECR,
   Route53/ACM — created once, `prevent_destroy`, excluded from throwaway experiments) and
   `infra/app` (VPC, ALB, ECS, WAF — freely destroyable/recreatable). Data created in the
   hand-built week (auth users, uploaded files) is tiny; it migrates into foundation resources
   once.
5. Style guardrails: community `terraform-aws-modules/vpc` module for the VPC (no learning
   value in hand-writing route tables); **hand-written** `aws_ecs_*` / `aws_lb_*` resources
   (that's where the app-specific knowledge lives); S3 state backend with the native lockfile
   (`use_lockfile = true`, Terraform ≥ 1.10, no DynamoDB table); **directory-per-environment**
   (`infra/envs/staging/`, `infra/envs/prod/`) rather than workspaces.

## Why not `terraform import`?

For a first-time Terraform user, import is the worst of both worlds: it only pulls resources
into *state* — you still hand-write HCL that must match dozens of computed attributes you never
consciously chose. The first many `terraform plan` runs become noise-diffs on defaults (ALB
listener rules, target-group health-check tuples, security-group rule ordering are notorious).
Import teaches Terraform's most frustrating corner first, on day one.

Rebuilding is also the better lesson: every console screen filled in during week 3 becomes a
checklist for the week-4 HCL, and "fresh `apply` passes the same smoke test" is a much stronger
statement of *the code is the configuration* than "import stopped complaining."

## Consequences

- One week of duplicate infrastructure cost (two parallel staging stacks) — trivial at this
  scale.
- The hand-built runbook must record every non-default setting as it's made (the phase-2 doc
  provides a settings ledger for exactly this).
- After week 4, **console changes to `infra/app` resources are forbidden** — drift shows up in
  `terraform plan` and CI can check for it. Break-glass console changes must be back-ported to
  HCL the same week.
- NAT gateway deliberately skipped at this scale (Fargate tasks in public subnets with public
  IPs + tight security groups); revisit if compliance requires private subnets.
