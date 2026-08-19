---
name: ontology-ingest
description: Use when turning source material (meeting transcripts, documents, emails, notes) into graph nodes — deciding WHICH ontology target each fact maps to (Note vs Plan vs Query vs Concern vs Implementation vs Person vs Tool...) and whether the SIGNAL is strong enough to justify each node and edge. Triggered by "ingest this transcript", "graph this meeting", "turn this into cypher", "add this to the graph", "which node should this be", or any raw_transcripts analysis.
---

# Ontology ingest — routing and signal strength

Turn source material into an idempotent batch Cypher file. Two judgments dominate:
**routing** (which element a statement maps to) and **signal strength** (whether it
justifies that element at all). When in doubt route DOWN, toward Note — a fact filed
as a Note is recoverable; a fabricated Process pollutes the evidence chain.

## Step 0 — Recon (read-only)

Never route from the source alone. Prefer the registry runner
(`run_query --list` to discover; `yse_catalog_for_year` resolves mentions to
year_identifiers; `notes_for_yse` / `notes_for_implementation` check for existing
annotations); fall back to ad-hoc read-only Bolt.

1. **Reference data**: campuses, AcademicYears, ATIWorkingGroups, Role handles,
   Dimension handles, Tools, Vendors, Assets, Interfaces.
2. **Anchors**: WorkingGroupPlans for the target year/campus/WG; SuccessIndicator
   composite keys + text; the YSE `year_identifier`s that actually exist.
3. **Dedup**: existing MeetingMinutes (by date/title), implementations evidencing the
   target YSEs, Plans/Notes/Queries/Concerns near the topic, and **Person resolution**.
4. **The open questions — pull before routing.** Both are intake instruments:

   ```cypher
   MATCH (q:Query)-[:raised_under_plan]->(wgp:WorkingGroupPlan)
   WHERE wgp.plan_identifier CONTAINS $campus AND q.status = 'open'
   OPTIONAL MATCH (q)-[:addresses_evidence]->(y:YearSuccessEvidence)
   RETURN q.unique_id, q.question, q.detail, q.category, collect(y.year_identifier)
   ```

   Read the source WITH that list in hand — a transcript states the fact, it never
   announces "this answers your open question". Then the **interview guide**, if
   `app/database/ontology/interviews/` holds one (see /stakeholder-interview): its
   bar-element tables are the intake checklist. Walk the source against those rows,
   not just the topic — a fact filling a named bar element is evidence; the same fact
   routed generically is an unremarkable Note.

Everything is read-only until the gate clears: **no Cypher is written or executed
until the decision manifest has been presented and approved.**

## Person identity resolution (before creating anyone)

Transcripts garble names — ASR wrote "Zach Autry" for **Zach Oshri**; first-name-only
"Timothy" resolved to **Tim Hensel** via campus + WG-lead context. Order:

1. Exact name match.
2. First name + campus + role context (WGP `has_group_lead`, `works_at_campus`, dept).
3. Unresolved AND load-bearing (owns work being modeled) → create, flag **"name as
   heard — verify"** in the file header AND the report.
4. Unresolved and peripheral → Note prose only, no node.

**Departed people who own no current work get NO node** (calibration: Kristen Denver,
Doug Ferguson) — Note prose only. Create an inactive Person (`active = false`,
context in `ati_role`) only when edges must reach them, e.g. they authored evidence.

## Signal strength

| Tier | Signal |
|---|---|
| **S1 Operational first-person** | The person who runs the work describes it as current practice ("we do all the PDFs") |
| **S2 Committed intent** | The would-be owner states they are doing / will do it ("we're working on getting the contracts set up") |
| **S3 Recommendation / open decision** | A proposal awaiting authority, or an unresolved question ("I've recommended we buy Verbit") |
| **S4 Secondhand / contextual** | Absent parties, history, environment ("she left in April of 25") |
| **S5 Garbled / speculative** | Unclear referent, ASR noise, musing ("maybe in Trello or something") |

## Routing table

Minimum signal is a floor; weaker signal routes to a DIFFERENT row, never to a
degraded version of the same node.

| Target | Min | Test |
|---|---|---|
| **Implementation** (Process/Procedure/Service/Guidance/Project/InternalPolicy) | S1 | The work EXISTS and operates today. Never from intent. |
| **Plan** | S2 | Future/ongoing work with commitment language from its owner. `plan_status` "In Progress" if started, else "Not Started". |
| **Query** | S3 | A decision someone must make, WITH a decider. Awaiting authority = `resource_request`; method choice = `technical_clarification`. Already decided → Note or Plan. |
| **Concern** | S1–S3 | A problem with NO path to resolution — no owner, no decider, no agreed change. Anchors to a YSE (`has_concern`). Converting to a Recommendation or Plan later is a first-class outcome; the `became_*` edge keeps provenance. |
| **Recommendation** | S2–S3 | A stated improvement — the path IS "make this change". If nobody said what should change, it is a Concern. |
| **Note** | S1–S4 | Default sink: history, background, status colour, tooling gaps, metrics-in-passing, action items. |
| **MeetingMinutes** | per meeting | One per meeting. CHECK FOR AN EXISTING NODE first; enrich via `has_note`, don't duplicate. |
| **Person** | resolved | See above. |
| **Tool** | S1 use | An instrument the work USES. Named-but-unused stays in Note prose unless a Plan commits to adoption. |
| **Asset** | steward known | A thing whose accessibility must be MAINTAINED. Usually already exists; rarely created from a transcript. |
| **Interface** | never from transcript | 4-coordinate identity is a deliberate modeling act. Link existing ones only. |
| **Metric** | artifact in hand | Only when the file/number set exists. Numbers in passing are description content; a promised export is a Plan. |
| **CommunityOfPractice / member_of_community** | S1 self-ID or roster | Check `list_communities` first — near-miss names resolve to the existing node. |
| **has_stake_in** | S1/S2 subject-matter | One or two best SIs; don't spray a community across a family. |
| **Accomplishment** | S1 + completed | A finished, claimable outcome. |
| **StatusLevel** | never | Status moves only through admin review. |

### Problem-shaped facts — route on the resolution, not the severity

| The source shows a problem, and… | Target |
|---|---|
| nobody has said what would fix it | **Concern** |
| someone named the change to make | **Recommendation** |
| a decision is pending with a named decider | **Query** |
| someone committed to doing something | **Plan** |
| it is context, not something to act on | **Note** |

Calibration: *"there's no 504/ADA Coordinator on campus"* = Concern. *"we should
reinstate the syllabus statement as required"* = Recommendation. *"I'm pushing the
provost to reissue the policy"* = Plan. Never upgrade a Concern by inventing the fix
yourself — the empty resolution path is the fact being recorded.

### Writing Recommendation and Concern detail

State the thing. Do not narrate the meeting. Four or five plain sentences, each
asserting one condition that should hold.

- `Recommendation.detail` = what closing it looks like, and who owes the next move.
- `Concern.detail` = why no path exists yet.
- Everything else — history, how the ask arose, who said what, why you routed it this
  way — is a **Note** on the same YSE. Never repeat it in the detail.

No "Agreed with X on <date>" openers, no numbered lists, no date stamps, no pointer
back to the notes: the node already carries its own date and author, and the reader
sees both records side by side. Both fields render on the public report, where the
reader wants the ask, not the archive. A detail that opens with context is a Note
wearing the wrong label.

### Implementation sub-routing (all S1)

Repeatable workflow, no endpoint → **Process** · documented step-by-step method →
**Procedure** · standing on-demand capability → **Service** · advisory/training
material → **Guidance** · time-bound with an end state → **Project** · institutional
mandate → **InternalPolicy**. Title suffixes the operating unit: "Canvas Course
Remediation (CTET)".

## Edge-wiring strength

Edges assert harder claims than nodes; grade them separately.

- **`is_evidence_for`**: implementation at S1 AND an on-subject SI match (read the SI
  text from recon; don't wire by vibes). Plausible-but-uncertain → `has_note` instead.
  Set `control` when attested: `'external'` when the owners rely on a practice they
  don't control, `'internal'` when they operate it. Relative to THIS YSE.
- **`furthers_yse`** (Plan): one or two best matches; don't spray.
- **`worked_on {role_handle, note, added_date}`**: only people who demonstrably do the
  work. MERGE with `role_handle` inside the pattern. Handles from the seeded Role set.
- **`implements`** (Person → YSE): accountable for that evidence area.
- **`holds_role`**: record PD status honestly (`in_position_description=false` +
  `pd_description` when informally absorbed).
- **`owned_by`**: custodial, usually exactly one.
- **`uses_tool` / `remediates`**: S1 use as described by the operator.
- **`addresses_evidence`** (Query → YSE): the YSE the answer would unblock.

## Anchoring

- **Year**: the CURRENT REPORTING year — the app's working default, NOT the latest
  rolled AcademicYear. Rollover scaffolds next year early while reporting continues
  (2026-2027 rolled 2026-07-28; reporting stayed 2025-2026). Confirm the WGP exists.
- **Campus**: each fact anchors to the campus whose program it describes; multi-campus
  meetings split into per-campus nodes.
- **Working group**: instructional content = `ins`, public web = `web`,
  purchasing/contracts = `pro`.
- **Cross-campus/SFBRN work**: anchor under the convening campus's WGP (usually sfsu).

## Verify before commit — the decision manifest (required gate)

After routing but BEFORE any Cypher, present every decision and STOP. The user is
reviewing judgment, not syntax — lead with WHY. Omit empty sections except where noted.

```
## Anchors               year / campus / WGP targets, and why
## Identity resolutions  name → node (or "create new"), evidence, as-heard flags
## Implementations       type + signal tier + quote, sub-routing reasoning, owner,
                         participants + role handles, tools, remediation targets
## Evidence wiring       every is_evidence_for / furthers_yse / implements: which SI
                         (quote it) and why on-subject; flag downgraded-to-note
## Plans                 WGP anchor, plan_status + the commitment language, furthers_yse
## Questions settled     each open Query the source ANSWERS + the answer text. Settle
                         them in this ingest. ALWAYS PRESENT, even if "none of N".
## Queries               category, the open decision, who raised it, which YSE
## Concerns              the issue, its YSE, who raised it, and why it is a Concern
                         rather than a Recommendation or Plan — i.e. what the source
                         does NOT say about resolving it
## Guide coverage        per bar element: converted / probed-but-empty / not reached
## Notes                 name, what it captures, which YSE + minutes
## Tools / Assets        new vs existing, S1-use evidence for each new Tool
## Down-routed, omitted  what was heard but routed weaker or dropped, one line each
```

On approval: write the Cypher, EXPLAIN-validate, execute. Any deviation forced by
validation or a late finding → stop and re-present the delta first.

## Mechanical conventions (non-negotiable)

- MERGE on each label's unique key: `Person.name`, impl `.title`, `Note.name`,
  `Tool.tool_identifier`, `Plan` by `name` (keep names unique, campus-prefixed).
- Department / College MERGE with BOTH labels: `MERGE (d:Department:OrgUnit {name:…})`.
  A single-label node 500s every neomodel read of that class.
- **Concern** has no natural unique key. MERGE on the `has_concern` pattern with the
  concern text, or guard with an existence check — never blind CREATE.
- Every `ON CREATE` sets `unique_id = randomUUID()` plus neomodel defaults
  (`Person.active/can_approve_yse/non_committee_member_active`, `Note.include_in_report`,
  `Plan.is_key_plan/is_campus_plan/abandoned`, `Query.status`, `Concern.status`).
- Note naming `<slug>-<mon>-<year>-yse:<year_identifier>-<8hex>`; attach `has_note` to
  BOTH the YSE and the MeetingMinutes; `created_by` → the ingesting user.
- Dates as `date('YYYY-MM-DD')`. Prose double-quoted (apostrophe-safe); statements end
  `;` at end-of-line only (the validator splits on that).
- File → `app/database/batch/auto-assignments/ingest_<date>_<topic>.cypher`, nowhere
  else, with a header carrying source, recon findings, identity mappings, as-heard
  flags, and every judgment call from the approved manifest.
- **Stamp the source minutes**: last statement sets `ontology_ingested = true`,
  `ontology_ingest_date`, and `ontology_ingest_note` (counts summary) on every
  MeetingMinutes the ingest anchored to. An already-stamped node means enrich, not
  re-create.
- Validate and execute ONLY through the runner, never ad-hoc scripts:
  `run_file <file>` then `run_file <file> --execute`. A zero-write re-run confirms
  idempotence.

## Post-run report

Counts created vs enriched per category, **verified by read-back query, not assumed**;
any unexpected merges; unresolved identities still needing verification; a pointer to
the saved .cypher file. Confirm by read-back that the minutes carry
`ontology_ingested = true` with the counts summary — the stamp is not optional.
