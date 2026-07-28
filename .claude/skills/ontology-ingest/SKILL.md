---
name: ontology-ingest
description: Use when turning source material (meeting transcripts, documents, emails, notes) into graph nodes — deciding WHICH ontology target each fact maps to (Note vs Plan vs Query vs Implementation vs Person vs Tool...) and whether the SIGNAL is strong enough to justify each node and edge. Triggered by "ingest this transcript", "graph this meeting", "turn this into cypher", "add this to the graph", "which node should this be", or any raw_transcripts analysis.
---

# Ontology ingest — routing and signal strength

Turn unstructured source material into an idempotent batch Cypher file. Two judgments
dominate everything: **routing** (which ontology element a statement maps to) and
**signal strength** (whether the statement is strong enough to justify that element at
all). When in doubt, route DOWN the ladder (toward Note) — a fact filed as a Note is
recoverable; a fabricated Process pollutes the evidence chain.

## Step 0 — Recon before anything (read-only)

Never route from the source alone. Recon first — prefer the curated registry runner
(`python -m app.database.cypher_runner.run_query --list` to discover; e.g.
`yse_catalog_for_year` resolves transcript mentions to YSE year_identifiers,
`notes_for_yse` / `notes_for_implementation` check for existing annotations), and
fall back to ad-hoc read-only Bolt queries for anything the registry lacks:

1. **Reference data**: campuses (`abbreviation`), AcademicYears, ATIWorkingGroups,
   Role handles, Dimension handles, Tools, Vendors, Assets, Interfaces.
2. **Anchors**: the `WorkingGroupPlan`s for the target year/campus/WG; the
   SuccessIndicator composite keys + text for the target WG; the YSE
   `year_identifier`s that actually exist.
3. **Dedup**: existing MeetingMinutes (by date/title), existing implementations
   evidencing the target YSE family, existing Plans/Notes/Queries near the topic,
   and — critically — **Person resolution** (see below).

Everything against the live DB is read-only until the gate clears: **no Cypher is
written or executed until the decision manifest (see "Verify before commit" below)
has been presented and approved.**

## Person identity resolution (do this before creating anyone)

Transcripts garble names (ASR wrote "Zach Autry"; the graph had **Zach Oshri**; a
first-name-only "Timothy" resolved to existing **Tim Hensel** via campus + WG-lead
context). Resolution order:

1. Exact name match in Person nodes.
2. First name + campus + role/title context (check WGP `has_group_lead` rosters,
   `works_at_campus`, department membership).
3. If unresolved AND the person is load-bearing (they own work being modeled): create,
   flag **"name as heard — verify"** in the file header AND in your report.
4. If unresolved and peripheral: keep them in Note prose only; no node.

**Departed/historical people who own no current work get NO Person node** — they are
referenced in Note prose only (calibration: Kristen Denver, 2026-07-24 ingest — user
decision). Create an inactive Person (`active = false`, departure context in
`ati_role`) only when the graph must wire edges to them, e.g. they authored evidence
or held assignments still live in the target year.

## The signal-strength scale

Grade every candidate fact before routing it:

| Tier | Signal | Example from calibration ingest |
|------|--------|--------------------------------|
| **S1 — Operational first-person** | The person who runs the work describes it as existing, current practice ("we do all the PDFs", "we build a SNOW ticket for that remediation") | SSU SNOW-ticketed remediation workflow |
| **S2 — Committed intent** | The would-be owner states they are doing / will do it ("I'm working on getting them a certificate program", "we're working on getting the contracts set up") | Certification pathway; captioning vendor contract |
| **S3 — Recommendation / open decision** | A proposal awaiting someone else's authority, or an unresolved question ("I've strongly made a recommendation that we should [buy Verbit]", "should we take this course and copy it to a shell?") | Verbit site-license Query; live-vs-shell Query |
| **S4 — Secondhand / contextual** | About absent parties, history, or environment ("she left in April of 25", "we lost three or four people") | Staffing-history Note |
| **S5 — Garbled / speculative** | Unclear referent, ASR noise, idle musing ("Director Armstrong", "maybe in Trello or something") | Omit, or as-heard flag inside a Note |

## Routing table — which goes where

Minimum signal is a floor; a weaker signal routes to the row below it, not to a
degraded version of the same node.

| Target | Minimum signal | Test |
|--------|---------------|------|
| **Implementation** (Process / Procedure / Service / Guidance / Project / InternalPolicy) | **S1 only** | The work EXISTS and operates today. Never create an implementation from intent ("we're going to start doing files" is a Plan, not a Process). |
| **Plan** | S2 | Future/ongoing work with commitment language from its owner. `plan_status`: "In Progress" if started, else "Not Started". Wishes without an owner are S3 → Query or Note. |
| **Query** (pending question) | S3 | A decision someone still has to make. Recommendations awaiting authority = `resource_request`; unresolved method choices = `technical_clarification`. Once decided, it would be settled — if the source shows the decision already made, it's a Note (or a Plan), not a Query. |
| **Note** | S1–S4 | The default sink: history, status color, tooling gaps, metrics-in-passing, action items, anything factual that isn't standing work, commitment, or open decision. |
| **MeetingMinutes** | per meeting | One per meeting. CHECK FOR AN EXISTING NODE first (same date/topic — the 2026-07-24 Sonoma meeting was already ingested). Enrich the existing node via `has_note`; don't duplicate. |
| **Person** | resolved identity | See resolution protocol above. |
| **Tool** | S1 use | An instrument the work USES (Equidox, SNOW, Panopto, JAWS). Named-but-unused products ("we're not using Abbey") stay in Note prose until adopted — except when a Plan commits to adoption, which justifies the Tool node the Plan references. |
| **Asset** | steward known | A thing whose accessibility must be MAINTAINED. Usually already exists (canvas-lms-<campus>); rarely created from a transcript. Same product can be Tool and Asset. |
| **Interface** | never from transcript alone | 4-coordinate identity is a deliberate modeling act. Link existing interfaces (`remediates_interface`); don't mint new ones mid-ingest. |
| **Metric** | artifact in hand | Only when the actual file/number set exists as a deliverable. Numbers spoken in passing ("862 courses", "mid-high 80s") are Note/description content. A promised export is a Plan. |
| **Accomplishment** | S1 + completed | A finished, claimable outcome. Rare in conversational sources. |
| **StatusLevel changes** | never | Never move a YSE's `status_is` from source ingest. Status changes go through the admin-review workflow. |

### Implementation sub-routing (all require S1)

- Repeatable workflow with no endpoint → **Process** (the remediation pipeline)
- Documented step-by-step method → **Procedure** (PDF remediation via Equidox)
- Standing on-demand capability/team → **Service** (the student remediation team)
- Advisory/training material → **Guidance** (the Canvas remediation manual)
- Time-bound effort with an end state → **Project**
- Institutional mandate → **InternalPolicy**

Title convention: suffix the operating unit — "Canvas Course Remediation (CTET)",
"Accessible Content Remediation (DSS)".

## Edge-wiring strength

Edges assert harder claims than nodes; grade them separately.

- **`is_evidence_for`** (impl → YSE): requires the implementation at S1 AND an
  on-subject SI match (read the SI text pulled in recon; don't wire by vibes). If the
  mapping is plausible-but-uncertain, attach a `has_note` to the YSE instead — a note
  is an observation, evidence is a claim.
- **`furthers_yse`** (Plan → YSE): the plan, if executed, would clearly advance that
  SI. One or two best matches; don't spray.
- **`worked_on {role_handle, note, added_date}`** (Person → impl): only for people who
  demonstrably do/direct the work. MERGE with `role_handle` inside the pattern
  (multi-role support). Pick the `role:` handle from the seeded Role set.
- **`implements`** (Person → YSE): the person is accountable for that evidence area
  (e.g. WG lead describing their own program).
- **`holds_role`**: capacity evidenced by the source; record PD status honestly
  (`in_position_description=false` + `pd_description` explaining the informal absorb).
- **`owned_by`**: custodial — who maintains the record/work, exactly one usually.
- **`uses_tool` / `remediates`**: S1 use/coverage as described by the operator.
- **`addresses_evidence`** (Query → YSE): the YSE the answer would unblock.

## Anchoring rules

- **Year**: anchor to the latest AcademicYear whose WGPs exist (a July meeting still
  anchors to the just-ended AY until the rollover has run). Confirm the WGP
  `plan_identifier` (`<year>-<campus>-<wg>`) exists in recon.
- **Campus**: each fact anchors to the campus whose program it describes — a
  multi-campus meeting splits into per-campus nodes (SSU process vs SFSU process),
  wired to that campus's YSE (`...-ins-ssu` vs `...-ins-sfsu`).
- **Working group**: subject matter → composite-key family. Course/instructional
  content = `ins`; public web = `web`; purchasing/contracts = `pro`.
- **Cross-campus/SFBRN work**: anchor under the convening campus's WGP (usually sfsu)
  and say so in the description.

## Verify before commit — the decision manifest (required gate)

After routing but BEFORE writing any Cypher, present the full set of decisions to the
user as a review manifest and STOP. Nothing is created or run until they approve.
Every decision appears under a clear heading with its reasoning and signal grade —
the user is reviewing judgment, not syntax, so lead with WHY, not with Cypher.

Manifest structure (omit empty sections):

```
## Anchors
Year / campus / working-group plan targets, and why (which WGPs and YSE families
exist per recon; how multi-campus content splits).

## Identity resolutions
Each person: transcript name → resolved node (or "create new"), the evidence for the
match, active/inactive, and any as-heard flags needing verification.

## Implementations
Per node: type chosen (Process/Procedure/Service/Guidance/...), signal tier with the
supporting quote fragment, sub-routing reasoning (why Process and not Service),
owner, participants + role handles, dimension, tools, remediation targets.

## Evidence wiring
Every is_evidence_for / furthers_yse / implements edge: which SI (quote its text
from recon) and why the work is on-subject. Flag any downgraded-to-note mappings.

## Plans
Per plan: WGP anchor, plan_status with the commitment language that justifies it,
furthers_yse mapping.

## Queries
Per query: category, the open decision, who raised it, which YSE it addresses.

## Notes
Per note: name, what it captures, which YSE + minutes it attaches to.

## Tools / Assets / Vendors
New nodes vs existing links, and the S1-use evidence for each new Tool.

## Down-routed and omitted
Everything that was heard but routed weaker (S2 wish → Note) or dropped (S5), with
one line of reasoning each — this is where the user checks calibration.
```

On approval: write the Cypher, EXPLAIN-validate every statement, then execute —
approval of the manifest authorizes the run. If validation or a late recon finding
forces ANY deviation from the approved manifest, stop and re-present the delta
before executing. If the user amends decisions, update the manifest and re-confirm
only the changed sections.

## Mechanical conventions (non-negotiable)

- MERGE on each label's unique key: `Person.name`, impl `.title`, `Note.name`,
  `Tool.tool_identifier`, `Plan` by `name` (description is the indexed field but too
  long to key a MERGE; keep names unique and campus-prefixed: "SSU: ...").
- Every `ON CREATE` sets `unique_id = randomUUID()` plus the neomodel defaults the
  API expects (`Person.active/can_approve_yse/non_committee_member_active`,
  `Note.include_in_report`, `Plan.is_key_plan/is_campus_plan/abandoned`,
  `Query.status`).
- Note naming: `<slug>-<mon>-<year>-yse:<year_identifier>-<8hex>` (or `-mm-<uid8>-`
  for minutes-only notes). Attach `has_note` to BOTH the YSE and the MeetingMinutes;
  `created_by` → the ingesting user's Person node.
- Dates as `date('YYYY-MM-DD')`. Prose strings double-quoted (apostrophe-safe);
  statements end `;` at end-of-line only (validator splits on that).
- File goes to `app/database/batch/auto-assignments/ingest_<date>_<topic>.cypher`
  — ALL Cypher produced by this skill saves to that folder, nowhere else — with a
  header documenting: source path, recon findings, identity mappings, as-heard
  flags, and every judgment call from the approved manifest.
- Validate and execute ONLY through the standalone runner (never ad-hoc scripts):
  `python -m app.database.cypher_runner.run_file <file>` (EXPLAIN-validates all
  statements, read-only), then `... run_file <file> --execute` to run. The runner
  sources its connection from the config gateway and reports per-statement write
  counters; a zero-write re-run confirms idempotence.

## Post-run report

After execution: counts created vs enriched per category (verified by read-back
query, not assumed), any statements that merged onto existing nodes unexpectedly,
unresolved identities still needing verification, and a pointer to the saved
.cypher file and its manifest.
