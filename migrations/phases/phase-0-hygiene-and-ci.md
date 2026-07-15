# Phase 0 — Hygiene + CI foundation (Week 1: Jul 20–24)

**Goal:** the repo is safe to build on — no live secrets anywhere in git or history, one Python
interpreter, and a CI pipeline that tests every PR against a throwaway database.

**Why this phase is independently shippable:** even if the migration stopped here, rotated
secrets + purged history + green CI is standalone value the current IIS deployment benefits
from immediately. Nothing in it depends on AWS existing.

---

## 1. Concepts

**Why rotation *and* history purge, not either alone.** The git history contains a live Neo4j
password, an OpenAI key, and an Asana PAT (memory: *repo-not-public-until-history-purged*).
Purging history removes the evidence but not the exposure — anyone who ever cloned still has
the old secrets, so they must be **rotated** (changed at the source). Rotation alone isn't
enough either: history with dead credentials still teaches attackers your naming and patterns,
and the DB dumps in history are data exposure by themselves. So: rotate first (kills the risk),
purge second (cleans the record).

**`git-filter-repo`** rewrites every commit to remove chosen paths/strings. It changes all
commit hashes downstream of the first rewritten commit → requires a **force-push**, and every
existing clone becomes incompatible (collaborators must re-clone, not pull). Always work on a
fresh mirror clone and keep an untouched backup mirror until verification passes.

**Ephemeral test database in CI.** GitHub Actions can run a *service container* — a Neo4j
started fresh for each CI run and thrown away after. `tests/conftest.py` already supports
redirection via `NEO4J_TEST_DATABASE_URL` + `NEO4J_TEST_DATABASE`, so CI never touches the live
DB. The `9999-9999` sentinel-year isolation stays as defense-in-depth.

**gitleaks** scans a repo (including full history) for secret-shaped strings. As a CI gate it
prevents the *next* leaked credential from ever landing.

**AWS account basics.** Root user = the account owner login — used once to set up MFA and
billing, then never again; day-to-day work happens as an IAM identity. A **budget alarm** emails
you when forecast spend crosses a threshold — the guard rail that makes hand-experimentation in
week 3 safe.

**APOC-Core audit (pulled forward from week 3).** Aura (managed Neo4j) only ships APOC *Core*
procedures. Our ~62 raw-Cypher call sites must be checked now — any APOC Extended/GDS call
found later would block the week-3 Aura import. It's a grep + allowlist + CI gate; no AWS
needed.

---

## 2. Runbook (human track)

### 2.1 Rotate the three secrets *(do this before anything else)*

| Secret | Where it lives | Rotation action |
|---|---|---|
| Neo4j `neo4j:accessibility` | on-prem DB at the fixed CSU IP | `ALTER CURRENT USER SET PASSWORD` (or via Neo4j Browser); update `app/.env.development` locally (NOT committed) and the IIS box's machine env vars |
| OpenAI API key | committed `.env.*` | platform.openai.com → revoke key, issue new (or delete — the `app/open-ai/` stub is dead code being removed this week) |
| Asana PAT | committed `.env.*` | Asana → My Settings → Apps → revoke + reissue |

After rotation, confirm the IIS app still works (it reads machine env vars per memory:
*iis-wfastcgi-env-vars*), and the ati-graph MCP still connects (it reads the same env — see
memory: *venv-split-tests-vs-mcp*).

### 2.2 Purge git history

1. `git clone --mirror <repo> ati-backup.git` — **keep this untouched until step 6 verifies.**
2. Fresh mirror clone → run `git-filter-repo` removing: `app/.env.development`,
   `app/.env.production`, any `*.dump`/DB-export files, and the literal old credential strings
   (`--replace-text`).
3. Add `.env.example` templates (agent track prepares them) so developers know what vars exist.
4. Force-push; confirm GitHub shows rewritten history.
5. Re-clone your working copies (old clones are unusable — expected).
6. Verify: `gitleaks detect --source . --log-opts=--all` is clean; repo stays **private** until
   this passes.

### 2.3 Create the AWS account

1. Sign up (decide personal vs CSU-billed — blocking Q1), enable **MFA on root**, then create
   an IAM Identity Center (or IAM) admin user for daily work; stop using root.
2. Region: **us-west-2 (Oregon)** recommended — closest full-featured region to CA, cheaper
   than us-west-1.
3. Billing → Budgets: create a monthly budget (suggested $100 for now) with alerts at
   50/80/100% to your email.

### 2.4 Answer Phase 1's blocking questions (§5 of phase-1 doc) so week 2 starts unblocked.

---

## 3. Agent track (parallel, reviewable PRs)

1. **GitHub Actions CI** (`.github/workflows/ci.yml`): pytest job with a
   `neo4j:5-community` service container + APOC Core plugin, env
   `NEO4J_TEST_DATABASE_URL`/`NEO4J_TEST_DATABASE` pointed at it; frontend job `CI=true npm
   test`. Acceptance: the workflow has **no secrets and no network path to the live DB**.
2. **gitleaks job** in the same workflow (fails on findings; baseline file only if needed).
3. **Single venv:** standardize on Python 3.14 (`.venv314` becomes `.venv`; delete the 3.12
   one), one `requirements.txt` + `requirements-dev.txt` with a lock; update `pytest.ini`
   docs/scripts. Kills the "reads work / writes fail" MCP footgun (memory:
   *venv-split-tests-vs-mcp*).
4. **Delete dead code:** `app/endpoints/data_api/api_endpoints.py`, the unregistered
   `evidence.py` (audit-confirmed: `__init__.py:14` imports `evidence_campus as evidence`),
   `app/open-ai/`, `app/graphRag/`, `merge_query_params` in `app/__init__.py`.
5. **APOC-Core audit:** script greps all `apoc.*` calls across `app/database/queries/`,
   classifies against the Aura Core allowlist, emits a report; CI gate fails on any non-Core
   call introduced later.
6. **`.env.example` templates** for dev/prod var names (no values).

---

## 4. Verification

**The one end-to-end check:** on a **fresh clone** of the rewritten repo, GitHub Actions runs
green — full pytest suite against the ephemeral Neo4j — with zero credentials for, or network
path to, the live database. Plus: `gitleaks` over the full rewritten history reports zero live
secrets.

Automated locks: CI required on PRs to master; gitleaks + APOC gates in the same workflow.

Rollback: the untouched `ati-backup.git` mirror restores history if the rewrite goes wrong
(only *before* others re-clone; afterwards, fix forward).

---

## 5. Open questions & sign-off

**Blocking (answer before starting):**

- [ ] **Q0.1** AWS account: personal card (reimbursed?) or CSU-procured account? This decides
  billing setup and whether procurement lead time exists. If CSU procurement is slow, start
  personal and migrate — flag it.
- [ ] **Q0.2** Who else has clones of this repo? (Force-push coordination — they must re-clone.)
- [ ] **Q0.3** Is anything else using the OpenAI key or Asana PAT that rotation would break
  (scripts, other machines, the Asana connector's scheduled use)?

**Checkpoint (during the week):**

- [ ] **Q0.4** APOC audit results review: if any non-Core call is found, approve the rewrite
  plan (plain Cypher equivalent) before week 3.

**Exit checklist (sign before Phase 1):**

- [ ] All three secrets rotated; IIS app + MCP verified working with new values
- [ ] History purged; gitleaks clean over `--all`; backup mirror retained offline
- [ ] CI green on fresh clone, no live-DB access
- [ ] Single Py 3.14 venv; dead code deleted
- [ ] AWS account exists: root MFA, IAM admin, budget alarm, region chosen
- [ ] Decisions recorded in [README.md](README.md) Decision Log
