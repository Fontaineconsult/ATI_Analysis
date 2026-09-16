---
name: ontology-extract
description: Use when pulling information OUT of the graph to feed an external project (another repo, a Claude project, a report, a website, a grant, a dashboard, an agent). Decides WHICH ontology elements answer the consumer's need, how STRONG each graph claim is before it is handed outward, how to phrase it for the reader, and whether to deliver a static context packet or a live feed (registry query + MCP tool) the consumer re-pulls itself. The inverse of /ontology-ingest. Triggered by "pull this from the graph for X", "build a context packet", "what does the graph know about Y for the Z project", "feed the graph into", "export the ontology for", "give the other project the campus evidence".
---

# Ontology extract: selection, evidence grade, and delivery

Turn a consumer's need into something it can use, sourced only from the graph.
Two judgments dominate: **selection** (which ontology element answers the need)
and **evidence grade** (whether the graph's claim is strong enough to state
outward as a fact). When in doubt grade DOWN, toward attributed or absent. A fact
handed out as weaker than it is costs a follow-up question. A Note handed out as
a fact puts the team's name on one person's recollection.

/ontology-ingest routes facts INTO the graph and gates on signal strength. This
skill routes facts OUT and gates on evidence grade. Everything here is read-only
against the graph. The skill writes files, and it may add a `read` query to the
registry. It never writes a node or an edge.

## Step 0: Take the brief

Never extract from the request alone. Pin down five things before recon, and
state any you had to assume:

| Question | Why it changes the work |
|---|---|
| **Consumer** | Another repo, a Claude project with its own CLAUDE.md, a document, a public page, an agent. A repo wants identifiers it can call back with. A page wants prose with no internal vocabulary. |
| **The question the consumer is answering** | Selection keys off the question, not the topic. "What does SSU do about captioning" and "how mature is SSU captioning" pull different elements. |
| **Reader register** | Executive, practitioner, someone being asked for something, or a machine. The writing style's register section decides the shape. A machine reader keeps the internal vocabulary; every human reader loses it. |
| **Form** | Markdown context file, JSON, CSV, email-body HTML. Default: Markdown with a JSON sidecar when the consumer is code. |
| **Refresh mode** | **Snapshot** (a dated file) or **live feed** (a registry query the consumer re-runs, exposed as an MCP tool). A consumer that will ask again next month gets a feed. |

Scope anchors come with the brief or get resolved in recon: campus, academic
year, working group, success indicator, community of practice, person.

## Step 1: Recon (read-only)

### 0. PULL THE ONTOLOGY FIRST: mandatory, before anything else

The graph describes itself. `UniversalDescriptor` nodes define every node type,
field, field value and relationship type. Read them before selecting, before
writing a query, and before trusting a property name. This is the same rule
/ontology-ingest carries, and the failure is the same in reverse: a MATCH on
`AcademicYear {academic_year_name: ...}` binds nothing, and the export then
reports an absence that is a typo.

```cypher
MATCH (d:UniversalDescriptor) WHERE d.target_label IN $labels
RETURN d.descriptor_kind, d.descriptor_handle, d.target_field, d.description_full
```

When the consumer's question is about the ontology itself ("what is a Concern",
"what fields does an implementation have"), the descriptors are the deliverable,
not the recon. The MCP server already serves them as `ontology_overview`,
`describe_node_type` and the `ati-graph://ontology` resource.

### 1. Discover before writing Cypher

`python -m app.database.cypher_runner.run_query --list` first. Most questions
have a registry query already, and a registry query is the only thing that can
become a live feed. The ones that carry most extracts:

| Need | Registry query |
|---|---|
| resolve a year's YSEs to `year_identifier` | `yse_catalog_for_year` |
| everything a campus operates | `implementations_for_campus` |
| what one indicator has at one campus | `yse_maturity_evidence`, `yse_bar_coverage` |
| the rubric a status was graded against | `status_level_rubric` |
| who does the work | `people_in_working_group`, `community_detail`, `people_assigned_to_yse_for_year` |
| what is open after a meeting | `meeting_followup_table`, `overdue_followups` |
| the ICT a unit answers for | `stewarded_ict_for_yse` |
| what a page or document actually says | `source_text_candidates_for_implementation` (then read `raw_text`) |

Write ad-hoc Cypher only for the gap, and if the consumer will ask again, put it
in the registry (see Delivery). Never interpolate values into Cypher; pass params.

### 2. Bind-check every anchor before believing a zero

`run_query` returns rows or nothing, and nothing has two meanings. Before
reporting that the graph holds no implementations for 7.11 at CSUEB, count the
anchors: the campus node, the AcademicYear node, the SuccessIndicator, the YSE.
If an anchor count is zero, the query was wrong. Only when every anchor binds and
the target query returns nothing is the absence real, and a real absence is a
finding the manifest reports under **Absences**.

### 3. Standing filters

- **Year**: the CURRENT REPORTING year unless the brief says otherwise, not the
  latest rolled AcademicYear. 2026-2027 was rolled on 2026-07-28 while reporting
  continued on 2025-2026. Say which year the packet describes in its header.
- **Sentinel years**: `9999-9999` and `9998-9998` are test data and sort above
  real years. Filter `name STARTS WITH '20'` when defaulting to latest.
- **YSE is per campus**: `year_identifier` ends in the campus abbreviation.
  Year-over-year and cross-campus queries must be campus-scoped or they cartesian.
- **Dead rows**: filter `removed`, `depreciated`, `no_longer_exists`, `retired`,
  `abandoned`, and Plans with `plan_status` Abandoned, unless the consumer asked
  for history. Say in the header that they were filtered.
- **Unsent FollowUps and unstamped minutes** are work in progress, not record.
  Exclude unless the consumer is the person doing that work.

## Evidence grade

What backs the claim once it leaves the graph. Grade every fact before it goes
in the packet.

| Grade | What backs it | How it leaves |
|---|---|---|
| **G1 Source text in hand** | `raw_text` on a Document, Webpage, or governance node; success indicator text; a node title or identifier | Stated as fact. Quote it when the wording matters. |
| **G2 Administered fact** | A `status_is` set through admin review; `plan_status`; `holds_role` with `in_position_description = true`; roster flags; `is_evidence_for.control` and `.satisfies`; edge dates | Stated as fact, with the date where one exists. |
| **G3 Curated description** | Implementation description, Plan description, Recommendation and Concern detail, community and role descriptions. Authored by the team as standing definitions. | Stated as fact in the team's voice. Not quoted. |
| **G4 Attested** | Note content, MeetingMinutes summaries, InterviewGuide findings, anything an ingest filed as heard. One person's account on one date. | Attributed: who said it and when. Never stated bare. |
| **G5 Derived or inferred** | Anything computed across nodes (a coverage gap, "no implementation evidences this"), a governance node's `description` summary, a title read without its `raw_text`, a search hit that matched on a word | A question or a labelled absence for a human reader. A flagged field for a machine reader. |

Rules that follow from the table:

- **Never upgrade.** A Note does not become a G3 fact because it says what the
  consumer wants. If the packet needs the fact stated bare, the graph needs the
  description edited first, and that is an /ontology-ingest job.
- **Governance is G1 or nothing.** Never reason from a governance node's
  `description`. Read `raw_text` or report that the text is not mirrored. The
  2026-08-05 session produced a materially wrong reading of a procurement
  procedure by summarising a summary.
- **Status is administered, not observed.** A StatusLevel reached through admin
  review is G2. One the reviewer skill recommended but nobody set is G5 and
  stays in the graph's own words as a recommendation.
- **Titles are not content.** An implementation whose pages carry no `raw_text`
  is known by its description (G3) and its page titles (G5). Say which.
- **Absence needs a bind-check.** "The graph holds nothing on X" is G5 until the
  anchors are counted, then it is a G2 fact about the graph, never a fact about
  the campus. The campus may do the work and nobody has ingested it.

## Selection table

The inverse of the routing table. Given the question, this is the element that
answers it and the edge that reaches it. A weaker answer routes to a DIFFERENT
row, never to a degraded version of the same element.

| The consumer asks | Element | Reach it by | Grade ceiling |
|---|---|---|---|
| what the campus DOES about X | Implementation (Process/Procedure/Service/Guidance/Project/InternalPolicy/TAAP) | `is_evidence_for` from the YSE; `is_documented_by` to its pages | G3, G1 where pages carry `raw_text` |
| what the work is required to achieve | SuccessIndicator text, its companion bars | `tracks` from the YSE; `yse_bar_coverage` | G1, quoted verbatim |
| how mature X is | StatusLevel via `status_is`, plus the bar coverage | `yse_maturity_evidence` | G2 for the level; G5 for any reading of why |
| who does or owns the work | Person via `worked_on`, `implements`, `holds_role`, `owned_by`; OrgUnit via `operates_under_campus` | `community_detail`, `people_assigned_to_yse_for_year` | G2. Contact details are PII: see Withheld. |
| who is accountable as a community | CommunityOfPractice via `accountable_community` and `has_stake_in` | `communities_by_working_group` | G2. A stake is not ownership; say which edge you read. |
| what is open, pending, unresolved | Query (`status = open`, `answerable_by`), Concern, Recommendation, Plan (`plan_status`) | `meeting_followup_table`; `raised_under_plan` | G3 for the ask; G4 for how it arose |
| what authority requires this | Law/Directive/ExternalPolicy/Memo/Guideline via `informs` to Goal | `governance_informing_goals` | G1 from `raw_text` only. `informs` has zero edges today (backlog item 1): report the gap, do not route around it with a shortcut. |
| what was said or decided | MeetingMinutes, Note | `has_note` on the YSE and the minutes | G4, always attributed |
| what tools, assets, interfaces are involved | Tool via `uses_tool`; Asset via stewardship edges and `remediates`; Interface | `stewarded_ict_for_yse` | G2 for the edge; G5 for derived footprints (say derived) |
| what the terms mean | UniversalDescriptor | `ontology_overview`, `describe_node_type` | G1: the graph is the authority on itself |
| what was chased and what came back | FollowUp via `includes_query` and friends | `overdue_followups` | G2 for sent; drafts are withheld |
| a number | Metric node, or a count you ran | registry query | G2 for a Metric with the artifact; G5 for a count, and a count states its query |

### Problem-shaped questions: answer from the resolution path, not the severity

| The consumer asks | Answer with |
|---|---|
| what is wrong with X | Concerns on the YSE (no path), stated as the team's standing view (G3), plus who raised them (G4) |
| what should change | Recommendations (G3), with `answerable_by` or the named next mover |
| what is being done about it | Plans with `plan_status` and their done-condition (G3) |
| who decides | Queries with `answerable_by` (G2 for the edge) |

Do not synthesise a fix the graph does not hold. If the graph has a Concern and
no Recommendation, the export says the path to resolution is not recorded.

## Translation

**All prose follows `app/database/ontology/writing-style.md`.** Three rules
from it do most of the work here:

- **Internal vocabulary stays inside.** Grades, signal tiers, node labels, edge
  names and `unique_id`s are how the system thinks. A human reader gets the
  fact in their own terms. A machine reader gets them all, in the sidecar.
- **Register decides the shape.** An executive opens on the assessment they can
  repeat. A practitioner opens on the change or the ask. Someone being asked
  gets an imperative with an actor named.
- **An inference from the record is a question.** Every G5 item for a human
  reader is written as a question or a labelled absence, never as a statement.

Success indicator text is quoted, not paraphrased. Node titles and identifiers
stay as they are. Product names are glossed once for a reader outside the work.
A G4 item names its source: "Cheryl Ho said on 2026-09-03 that...". A G3 item
does not name a source, because the team authored it.

No em dashes.

## Verify before emit: the extraction manifest (required gate)

After selection but BEFORE any file is written or any registry entry added,
present every decision and STOP. The user is reviewing judgment, not layout.
Lead with WHY. Omit empty sections except where noted.

```
## Brief             consumer, question, reader register, form, refresh mode,
                     and every assumption made in Step 0
## Anchors           year / campus / WG / SI / community resolved, and why;
                     the bind-check counts
## Sources           each registry query + params, each ad-hoc query in full,
                     each descriptor set read; which ad-hoc queries become
                     registry entries and their proposed names
## Facts             per item: the node(s) by unique_id, the grade, and the
                     sentence or field it becomes
## Attributed        every G4 item: who, when, which minutes or note
## Questions         every G5 item for a human reader, phrased as it will appear
## Absences          what the brief asked for that the graph does not hold,
                     with the anchor counts that make the absence real.
                     ALWAYS PRESENT, even if "none".
## Withheld          PII, unsent drafts, sentinel data, retired and abandoned
                     rows, items graded too low to state, and why for each
## Staleness         oldest raw_text_captured, latest ingest stamp on the minutes
                     read, the date the packet describes
## Refresh recipe    snapshot: none. Live feed: the registry names and params the
                     consumer will call, and the MCP tool names they map to
```

On approval: write the packet, add any registry entries, validate. Any deviation
forced by validation or a late finding: stop and re-present the delta first.

### Withholding rules, non-negotiable

- **Personal data needs its own approval.** `Person.email`, phone, and anything
  from `holds_role.pd_description` do not leave the graph unless the brief asked
  for a roster and the user approved that section of the manifest by name.
  Names and titles of people acting in their ATI role are fine.
- **Test data never leaves.** Anything under the sentinel years, and any node
  whose identifier starts with one.
- **Drafts never leave.** A FollowUp without `date_sent`; minutes without
  `ontology_ingested`; a status the reviewer recommended and nobody set.
- **Credentials never leave.** The packet's refresh recipe names queries and
  tools, never a connection string.

## Delivery

### Snapshot

One file per extract at
`app/database/ontology/exports/<date>-<consumer-slug>-<topic-slug>.md`, nowhere
else. A JSON sidecar of the same stem when the consumer is code. The header
block carries, in this order: the date generated, the year the packet describes,
the anchors, the filters applied, the queries run with their params, the grade
legend if the reader is a machine, and the refresh recipe. The body follows the
reader register. The sidecar carries `unique_id` on every item so the consumer
can call back into the graph, plus the grade and the source query per item.

### Live feed

When the consumer will ask again, the deliverable is a query it can re-run:

1. Add the query to `app/database/cypher_runner/query_registry.yaml` with
   `mode: read`, a `category` that already exists, a description that says what
   question it answers and which params it takes, and every value as a `$param`.
   Copy the shape of `yse_maturity_evidence` for a compound read.
2. `python -m app.database.cypher_runner.run_query --validate`, then run it once
   with real params and check the rows against the manifest's Facts.
3. It is now an MCP tool of the same name on next server start. Tell the
   consumer the endpoint (`mcp-campus-hosting.md` in the mcp package: the campus
   URL for hosted, `claude mcp add ati-graph ...` for local) and, if the
   consumer's tool surface should be narrow, the `ATI_MCP_CATEGORIES` value that
   exposes only what it needs.
4. Write a short consumer-side note (in the snapshot file, or in the consumer
   project's own CLAUDE.md if the user points you there) that maps each question
   the consumer asks to the tool and params that answer it, and that names the
   grade ceiling of each tool's rows so the consumer's agent does not upgrade a
   Note either.

The feed is read-only by construction: the hosted server has no auth and
`ATI_MCP_ALLOW_WRITE` stays unset. Do not propose a write tool for a consumer.

### Email body

When the consumer is a person and the form is email, follow the report_export
pattern: inline-styled HTML that survives a paste into Gmail or Outlook, plus a
plain-text fallback, both in the snapshot file. No attachments by default.

## Post-run report

Counts of facts by grade, **verified against the manifest, not assumed**; the
absences and what would fill them (usually an interview or an ingest); the
withheld items; the oldest source-text date the packet rests on; a pointer to the
saved file; and, for a live feed, the registry names added and the
`--validate` result. If a G5 question in the packet could be settled by a
`/get-source-text` fetch or a `/stakeholder-interview`, say which.
