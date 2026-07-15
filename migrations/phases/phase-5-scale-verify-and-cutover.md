# Phase 5 — Scale-verify + cutover (Week 6: Aug 24–28)

**Goal:** prove the AWS stack holds the target load, drill the disaster paths, run old and new
in parallel until the payloads match — then move DNS. **No new application features this week.**
Everything that runs in week 6 has already run somewhere for at least a week.

**Why this phase is independently shippable:** the load test, backup drills, and parallel-run
diff are pure verification with their own pass/fail bars; cutover itself is a reversible
runbook (DNS back = rollback) executed only on a signed go/no-go.

> ⚠ **Calendar collision (decided in week 4, Q5.1):** this week lands at CSU fall-semester
> start. Option A: compress and cut over mid-August. Option B (default): treat this week as
> the *verification* week, run the parallel-run through early September, and cut DNS in a
> quiet window with the IIS box as instant rollback. The phase works identically either way —
> only the DNS-switch date moves.

---

## 1. Concepts

**Load testing with k6.** Scripted virtual users replay realistic flows (login → dashboard →
report → upload) against staging. The **bar is agreed before the run** (otherwise results get
rationalized): proposed — **200 concurrent users, p95 latency < 500 ms on the top-5 endpoints,
error rate < 0.1%**. 200 concurrent is deliberately conservative for "low-thousands of
*accounts*" — concurrency at peak (reporting season) is a fraction of accounts; Q5.2 sets the
final number.

**Load-test-driven pagination** (deviation #3): the graph is small (~11.5K YSE); rather than
paginate ~20 endpoints on principle, run the bar and paginate **only what fails** — most
likely candidates per the audit: `/evidence/yses-by-campus/<year>` (all campuses × YSE) and
`/implementations?all=true`. Each gets limit/offset params; unpaginated behavior stays default
so the frontend doesn't change this week.

**Autoscaling: watch it, don't trust it.** Target-tracking on CPU + ALB request count, min 2 /
max 4 tasks. The test isn't "is autoscaling configured" but "did we *see* 2→4 during load and
2 again after."

**An untested backup is a rumor.** Three drills, each ending in verified data: restore an Aura
backup into a scratch instance (run the diff harness against it); restore the RDS snapshot;
delete + undelete an S3 object via versioning.

**Parallel-run diff.** Old (IIS/on-prem) and new (AWS) run simultaneously; the Phase-2 diff
harness compares key report payloads across both daily. Zero-diff for the agreed window is the
strongest cutover evidence there is. Requires a **content freeze** (or a defined merge window)
so the two datasets don't drift for real reasons.

**DNS cutover mechanics.** Lower the record's TTL days ahead (ticket to campus IT — already
warned in week 3); at cutover the CNAME flips to the ALB; rollback is flipping it back. The IIS
box goes to **warm standby**: config frozen, service stopped but startable, kept ≥30 days.

---

## 2. Runbook (human track)

1. **Go/no-go inputs (Monday):** Phase-4 exit checklist signed; load bar agreed (Q5.2); cutover
   date confirmed vs the calendar decision (Q5.1); campus-IT cutover ticket scheduled;
   announcement drafted (Q5.3).
2. **Run the load test with the agent;** watch the CloudWatch dashboard live — this is the
   payoff lesson for weeks 3–4 (you can now read every graph on it).
3. **Backup drills** (agent scripts, you execute): Aura restore→diff; RDS snapshot restore; S3
   versioning undelete. Record durations — that's your real RTO.
4. **Content freeze + final syncs:** announce the freeze window; final `aws s3 sync` delta of
   uploaded files; final graph export → Aura import; final auth-DB delta.
5. **Parallel-run:** run the diff harness daily against both stacks; investigate any non-zero
   diff to root cause (the `neomodel-defaults-vs-apoc-null` memory shows how subtle these get).
6. **Cutover:** execute the runbook — DNS flip, watch traffic arrive (ALB metrics), smoke test
   as a real user, keep the bridge open for the first campus-user reports.
7. **IIS to warm standby:** stop the site, freeze config, document the restart procedure in the
   rollback runbook. Do **not** decommission.

---

## 3. Agent track (parallel)

1. **k6 scripts** for the top flows (login, dashboard primary fetch, indicator report, goal
   report, WG evidence tree, file upload/download) parameterized by the bar; CloudWatch
   dashboard to watch during runs.
2. **Pagination for failures only** — limit/offset on any endpoint that misses the bar,
   default-off, with tests.
3. **Cutover runbook + rollback runbook** (step-by-step, timestamped checkboxes, owner per
   step, abort criteria at each stage).
4. **Parallel-run automation:** scheduled diff-harness runs + a small report.
5. **Backup-drill scripts** (Aura restore driver, RDS snapshot restore, S3 undelete
   demonstration).
6. **Post-cutover watch:** alarm review, error-log triage for the first 48 h.

---

## 4. Verification

**The one end-to-end check:** the load bar is met on enforcing staging (k6 report archived);
autoscaling observed 2→4→2; all three backup drills produced verified data; the parallel-run
diff is **zero** across the agreed window; DNS cut executed with the rollback runbook standing
by — and real campus users are on the AWS stack.

Success criteria for closing the whole 6-week program:
- Live on AWS behind HTTPS + WAF, min 2 tasks across AZs
- 100% infra reproducible from `infra/` (zero-drift plan)
- Campus-scoped RBAC enforcing, every mutation audited
- Load bar met; backups drilled; rollback path proven and retained ≥30 days

---

## 5. Open questions & sign-off

**Blocking (some decided earlier — confirm here):**

- [ ] **Q5.1** (decided end of week 4) Cutover date: mid-August compress vs early-September
  quiet window with extended parallel-run. Default: September.
- [ ] **Q5.2** Load bar: confirm 200 concurrent / p95 500 ms / 0.1% errors — or set your own
  numbers from expected reporting-season usage.
- [ ] **Q5.3** Who announces to campus users, and what's the freeze window they're told?

**Checkpoint:**

- [ ] **Q5.4** Any non-zero parallel-run diff: accept-with-explanation or block cutover (each
  instance individually adjudicated).
- [ ] **Q5.5** Go/no-go sign-off the day before DNS flip.

**Exit checklist (program close):**

- [ ] Load bar met (report archived in the Decision Log)
- [ ] Three backup drills passed; RTO durations recorded
- [ ] Zero-diff parallel run over the agreed window
- [ ] DNS cut; 48-h watch clean; IIS warm standby documented
- [ ] Deferred-tracks handoff note written (what tracks I/J/G/F inherit — see
  [README.md](README.md) deferred-tracks table)
