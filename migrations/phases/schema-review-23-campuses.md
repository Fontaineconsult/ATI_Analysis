# Schema & API review — what 23 campuses and low-thousands of users actually mean

Deep review of `app/database/graph_schema.py` (full read, 2,417 lines), `identifiers.py`, the
endpoint surface, and the query layer, asking one question: **what breaks when this system
serves 23 campuses with low-thousands of user accounts?** Companion to
[security-review.md](security-review.md) (which owns the permission model those users need).

## TL;DR

1. **Data volume is a non-problem.** ~11.5K YSE nodes at full build-out — tiny for Neo4j. The
   scale risk is **per-request traversal fan-out** (one report = hundreds of Bolt round-trips)
   multiplied by concurrent users and WAN latency to Aura — not node count.
2. **Global unique indexes are the schema's real 23-campus bug.** Several will throw
   constraint violations the first time two campuses independently author same-named content.
   Fix at the Aura import (Phase 2), the one cheap moment to change constraints.
3. **Campus is well-anchored on the evidence backbone, absent on the content leaves.** Fine
   for reads; it forces the RBAC write-scope check for content nodes down into the query layer
   (one YSE-edge hop). Do **not** add campus edges to content nodes — derive.
4. **Identity is split across three stores with no links:** auth users (SQLite), graph Person,
   and a permission flag (`can_approve_yse`) stranded on Person. The `person_uid` column +
   RBAC store (ADR-002) unify it.

---

## 1. Volume math (structural, parameterized by indicator count)

| Node family | Formula | @ ~100 SI, 23 campuses, 5 years |
|---|---|---|
| YearSuccessEvidence | SI × campuses × years | **~11,500** (dominant) |
| CampusPlan | campuses × years | 115 |
| WorkingGroupPlan | 3–4 × CampusPlan (web/pro/ins + Steering) | 345–460 |
| MeetingMinutes / Query / ProgressUpdate | unbounded per WGP | low thousands |
| Documents/Webpages/Notes/Messages/Metrics | leaves off YSE + implementations | highest-cardinality, accumulating |
| Person | people involved, all campuses | low thousands (≈ user accounts) |

Even ×10 these numbers are trivial for Aura. **Conclusion: never shard, never multi-tenant the
graph — the locked single-graph decision is right.** All scale work goes to the request path.

## 2. Unique-index collision audit (fix at Aura import — Phase 2, Q2.4)

Global uniqueness that was harmless with one authoring campus becomes a 500-generator with 23
concurrently-writing campuses. Verdicts:

| Property (unique today) | Collision scenario | Verdict |
|---|---|---|
| `Person.name` | two "Maria Garcia"s at different campuses | **Drop unique** → plain index. Identity = `unique_id`. UI disambiguates by campus/email. *(Also unblocks person merging later.)* |
| `Plan.description` | two campuses write "Improve web accessibility training" | **Drop unique** → plain index. A description as identity was always fragile. |
| `Process/Project/Procedure/Service/Guidance/Tracking/InternalPolicy.title` | "Web Accessibility Training" ×2 | **Drop unique** → plain index. Same reasoning; campus context comes from evidence edges. |
| `Accomplishment.description` | same | **Drop unique.** |
| `Note.name` / `Message.name` | generated names collide across campuses | **Drop unique**; ensure generators salt with campus/plan identifiers (MCP note generator at `notes_write.py` already uses deterministic names — verify salt). |
| `YearSuccessEvidence.year_identifier`, `CampusPlan/WGP.plan_identifier`, `Asset.asset_identifier`, `Interface/Component` identifiers | none — campus/scope **is in the key** | **Keep.** This is the correct pattern; it's why these never collide. |
| `SuccessIndicator.composite_key`, `AcademicYear.name`, `StatusLevel.status_level`, `Campus.name/abbreviation`, `ATIWorkingGroup.name`, `Dimension/Role.handle`, `UniversalDescriptor.descriptor_handle`, `Principle.handle`, `Law/…/Guideline.title` | shared systemwide reference data | **Keep** — genuinely global. |
| `Document.hash`, `StoredFile.storage_key`, `Webpage.url` | content-addressed / natural keys | **Keep** — collisions are dedupe, a feature. |
| `Vendor.name`, `OrgUnit.name` | two campuses' "Library" departments | **Change:** OrgUnit uniqueness should be (name, campus) — since neomodel lacks composite constraints, adopt an `org_identifier` (`library-sfsu`) built in `identifiers.py`, mirroring `make_asset_identifier`. Vendor stays global (vendors are external). |

Mechanics: neomodel installs constraints from class definitions — change the class properties
(`unique_index=True` → `index=True`), drop the old constraints in the same migration Cypher,
run `install_all_labels` against Aura during the Phase-2 import rehearsal.

## 3. Campus anchoring — where campus lives and doesn't

**Anchored (edge or key):** YSE (`evidence_at_campus` + key suffix), CampusPlan/WGP (key),
Asset (`asset_at_campus` + scope), Person (`works_at_campus`, ZeroOrOne), OrgUnit
(`operates_under_campus`).

**Not anchored:** Plan, Process/Project/Procedure/Service, Guidance, Tracking, InternalPolicy,
Accomplishment, Note, Document, Webpage, Message, Metric, StoredFile. Campus is derivable only
through their `is_evidence_for` → YSE edges (or the plan chain).

**Recommendation: derive, don't denormalize.** Adding campus edges to every content node would
be a large migration, would break for legitimately multi-campus content (an implementation
evidencing YSEs at two campuses is *meaningfully* shared), and buys nothing reads need. The two
consumers of campus-on-content are:

- **RBAC write-scope checks** → resolved in the sanctioned `queries/<domain>` mutation with one
  Cypher hop (`authz.assert_scope`, ADR-002 §4.3). Multi-campus content is then naturally
  writable by anyone holding scope on *any* linked campus (decision recorded in ADR-002).
- **Report filtering** → already flows through YSE traversals; no change.

**One real tenancy bug to fix (Phase 4, riding the RBAC work):** every campus-filtering Cypher
uses the optional pattern (`$campus IS NULL OR …`), and the frontend's `currentCampus` defaults
to `null` (`SettingsContext.js:22`) — a campusless request silently returns **all campuses'
data**. Under the confirmed "reads systemwide" policy this is not an authz hole, but it is a
correctness/UX trap (users see cross-campus data unintentionally) and a payload multiplier.
Fix: reads that are campus-parameterized should *require* the parameter (400 without it) except
on explicitly cross-campus endpoints (`/yses-by-campus`, trends).

## 4. Identity split (schema side — full design in ADR-002)

- Auth users: SQLite, no role/campus columns, no graph link.
- `Person`: has `email`/`employee_id` but nothing ties a login to a Person — attribution today
  is client-supplied strings (see security review F3).
- `Person.can_approve_yse` (`graph_schema.py:1555`): a **permission bit stored as an unaudited
  graph property**, read by evidence flows. Superseded by the RBAC matrix; migrated to role
  assignments in Phase 4 and no longer read.
- Edge attribution (`DocumentedByRel.added_by`, `YseProgressRel.updated_by`) stores Person
  unique_ids as strings — keep the mechanism, but populate from the **session's** person_uid.

**Rule going forward: the graph models the institution (Person = a human in the org chart);
Postgres models the platform (users, roles, audit). The only bridge is `users.person_uid`.**

## 5. The read path at 23 campuses

### 5.1 The goal-report N+1 (the one scheduled fix — Phase 4)

`GoalReportAPI` (`report.py:48-78`) → `get_goal_report`
(`queries/report/get_indicator_report.py:387-435`): fetches indicator keys, then loops
`get_indicator_report` per indicator; each fires 2 raw Cyphers plus per-implementation walks
over 7 evidence-type relationship managers; `_implementation_payload` (`:120-164`) calls
`.all()` separately on documents/webpages/notes/messages/metrics/participants/interfaces, and
`serialize_participants` (`graph_schema.py:537-559`) adds another Cypher per implementation.
**Net: hundreds of round-trips per report request**, and the frontend fetches the whole goal at
once (`services/api/get.js:44-53`). At sub-ms on-prem latency this was slow; at Aura WAN
latency it's multi-second.

**The fix pattern already exists in this codebase:** `get_all_implementations`
(`implementation/read.py:184-342`) was deliberately refactored into 7 batched apoc projections
(see its comment at `:173-183`). Port the same shape to the report: one query per *collection*,
not per *node*. The Phase-2 diff harness is the regression net (memory
`neomodel-defaults-vs-apoc-null` documents the null-vs-default traps).

Second-tier N+1s (fix only if the Phase-5 load bar flags them): per-node serialize loops in
`get_all_implementations_by_type` (`implementation/read.py:142-170`), asset reads
(`assets/read.py:31-60`, 12 managers per asset), `documents.py` GET serialize loop.

### 5.2 Endpoint inventory (unbounded reads flagged)

All under `/ati/data-api/v1` (blueprint at `app/__init__.py:110`). POST/PUT use in-body
`action` dispatch. **Live registrations only** — `evidence.py` and `api_endpoints.py` are dead
code (never imported; `endpoints/data_api/__init__.py:14` imports `evidence_campus as
evidence`), deleted in Phase 0.

| Module | Routes | Unbounded? |
|---|---|---|
| `report.py` | `/report/indicator`, `/report/goal` | **Yes — heaviest (§5.1)** |
| `evidence_campus.py` | `/evidence/<wg>/<year>`, `/evidence`, `/evidence/trends`, `/evidence/status-levels`, `/evidence/yses-by-campus/<year>` | **Yes** — whole-WG tree; yses-by-campus = all campuses |
| `implementation.py` | `/implementations`(+`?all=true`), `/implementations/plans`, `/…/accomplishments` | **Yes** |
| `individuals.py` | `/individuals` | **Yes** (all Persons; batched apoc, so payload- not query-bound) |
| `campus_plans.py` | `/campus-plans/<campus>/<year>`, `/campus-plans` | No (scoped) |
| `meeting_minutes.py`, `queries.py` | plan-/WG-scoped routes | No |
| `documents.py` | `/documents/<type>` | **Yes** + serialize N+1 |
| `indicators.py` | `/indicators/<year>` | Yes (bounded by SI count) |
| `governance.py`, `assets.py`, `interfaces.py`, `components.py`, `tools.py`, `vendors.py`, `organizational_units.py`, `descriptors.py` | collection GETs | **Yes** (assets also N+1) |
| `committees.py`, `principles.py`, `dimensions.py`, `roles.py`, `settings.py`, `ontology.py` | small/static | effectively bounded |
| `files.py` | `/files`, `/files/<key>` | N/A (security review F6/F7) |
| `asana.py` | `/asana/refresh-plans`, `/asana/subtasks/<uid>` | scoped |

**Pagination policy (deviation #3):** load-test-driven. The k6 bar (Phase 5) decides; likely
candidates are `yses-by-campus` and `implementations?all=true`. Everything else is bounded by
real-world cardinality at this scale.

### 5.3 Connection model

Per-worker init via `hasattr(db,'connection')` guard (`app/__init__.py:92-95`) — replaced in
Phase 2 with explicit init + tuned pool (driver default pool = 100/instance; size per Fargate
task) + retry/backoff for WAN Bolt errors. Prod server moves wfastcgi → waitress in the
container (Phase 1 Dockerfile).

## 6. Identifier parsing (new code, Phase 2 agent track)

`identifiers.py` has builders only; RBAC scope derivation needs the inverse. Add
`campus_from_identifier(identifier, kind)` — **kind-aware**, because position differs:

| Kind | Example | Campus position |
|---|---|---|
| YSE `year_identifier` | `2025-2026-5.2-pro-sfsu` | last segment |
| CampusPlan `plan_identifier` | `2025-2026-sfsu` | last segment |
| WGP `plan_identifier` | `2025-2026-sfsu-web` | **second-to-last** |
| Asset `asset_identifier` | `canvas-sfsu` / `canvas-systemwide` | last, may be `systemwide`/`regional`/vendor slug |

Parsed abbrevs are validated against the Campus node list — an unrecognized suffix is a hard
error, never a pass-through. Unit tests cover each shape + the rejection path.

## 7. What we deliberately did NOT change

- **No multi-tenancy, no sharding, no campus labels on content** — single shared graph stands.
- **No neomodel replacement** — the ORM's N+1 tendencies are handled by the established
  batched-apoc escape hatch where it matters.
- **No composite-key rework of existing identifiers** — they already encode campus correctly.
- **StatusLevel / description-requirement satellite nodes** untouched — shared reference data,
  low cardinality, not a scale factor.
