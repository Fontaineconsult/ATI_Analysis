---
name: implementation-rectify
description: Audit and repair how implementations are wired — accountable communities, evidence links, and the sources behind them. Three entry points. From a Community of Practice, walk its indicator stakes and fix accountable_community coverage. From a YearSuccessEvidence, find implementations that SHOULD evidence the indicator and do not. From the /implementations context, take a whole set: refresh its Source Text, find members that describe the same work, sweep the hosts it already cites for pages and downloadable files it does not. Proposes; writes only on approval. Triggered by "rectify", "implementation-rectify", "audit community accountability", "what implementations are we missing on 7.3", "is anything unwired", "check this set for overlap", "sweep the sites we already cite".
---

# Implementation rectify — find the wiring that should exist

Three questions, one skill, because all three are the same defect seen from
different ends: something exists — work, a page, a file — and is not connected to
the thing it answers for.

- **CoP mode** — start at a Community of Practice, walk its indicator stakes, and
  fix `accountable_community` on the implementations underneath.
- **YSE mode** — start at a YearSuccessEvidence, and find implementations that
  should carry `is_evidence_for` to it but do not.
- **Corpus mode** — start at the `/implementations` context with a whole set,
  refresh the Source Text behind it, then read the set against itself for members
  that describe the same work, and against the hosts it already cites for pages and
  downloadable files it does not.

Every mode PROPOSES. Nothing is written until the user approves, because all three
are judgment about meaning, not shape, and a wrong edge is worse than a missing one:
an unwired implementation is an honest gap, a wrongly wired one is a false claim
about evidence that a maturity review will then grade.

---

# CoP mode — accountable community coverage

**A stake is not ownership.** A community holding a stake in an indicator does NOT
make it accountable for every implementation evidencing that indicator. Faculty
Development has a stake in `7.5-ins`; the Accessible Media Quick Converter under it
is DPRC's, and `accountable_community = Alternative Media` is correct. Assigning by
stake alone overwrites true accountability with a guess.

## Walk out

```cypher
MATCH (c:CommunityOfPractice {unique_id: $cop})-[:has_stake_in]->(si:SuccessIndicator)
MATCH (i)-[:is_evidence_for]->(y:YearSuccessEvidence)-[:tracks]->(si)
MATCH (y)-[:evidence_in_year]->(:AcademicYear {name: $year})
MATCH (y)-[:evidence_at_campus]->(cam:Campus)
OPTIONAL MATCH (i)-[:accountable_community]->(ac:CommunityOfPractice)
OPTIONAL MATCH (i)-[:owned_by]->(o:Person)-[:member_of_community]->(oc:CommunityOfPractice)
RETURN labels(i)[0] AS type, i.title, i.unique_id, coalesce(i.retired,false) AS retired,
       collect(DISTINCT si.composite_key) AS stakes,
       collect(DISTINCT cam.abbreviation) AS campuses,
       collect(DISTINCT ac.name) AS accountable,
       collect(DISTINCT o.name) AS owners,
       collect(DISTINCT oc.name) AS owner_communities
ORDER BY retired, i.title
```

Communities are campus-agnostic, so the walk fans across campuses. Pull the
community's `description` and member roster too — the description is the practice
area the rubric tests against.

## Five buckets

| Bucket | Condition | Action |
|---|---|---|
| **Correct** | already this community | confirm |
| **Elsewhere** | a DIFFERENT community | **leave alone**, report why it is plausible. Flag as wrong only if that community's practice area plainly does not cover the work — and propose, never rewrite |
| **Assignable** | unassigned + a signal below | propose |
| **Belongs elsewhere** | unassigned but plainly another unit's practice | propose THAT community |
| **Undecidable** | unassigned, no owner, no unit named anywhere | report. **Do not guess** |

Retired implementations are listed separately and never assigned.

## Signals, strongest first

1. **Owner is a member of this community** — `(i)-[:owned_by]->(p)-[:member_of_community]->(c)`. Sufficient alone.
2. **Participants are members** — same edge via `worked_on`. Weaker.
3. **Title or description names the community's unit** — CEETL, CTET, DSS. Test against the community's own description, not intuition about its name.
4. **Attached documentation names the unit** — a page called "Office of Faculty Development" is real evidence for an ownerless node.
5. **Sibling consistency** — near-identical work at another campus already carries this community. Supporting only.

Signals 3–5 alone: propose with the reasoning shown so the user can veto.

---

# YSE mode — missing evidence links

Given `<year>-<composite_key>-<campus>`, find live implementations that plausibly
evidence this indicator and are not wired to it. Read the SI text first and
decompose it: 7.3-ins is *"create, distribute, and update EXAMPLES of accessible
instructional materials"* — the object is examples, so templates, samples,
exemplars and checklists are on-subject and a remediation pipeline is not.

## Four candidate searches

1. **Cross-campus peer** — what other campuses wire to the SAME composite_key. If
   SSU wires two templates to 7.3-ins and SFSU wires none, ask what SFSU's template
   is. The strongest signal, because it is the same indicator read by other people.
2. **Sibling indicator** — implementations at this campus on other indicators under
   the SAME goal. Evidence often lands on one sibling and not the others.
3. **Subject match** — title/description (and `raw_text`, where /get-source-text has
   filled it) against the SI's decomposed nouns and verbs.
4. **Orphans** — live implementations with no `is_evidence_for` at all. Rare and
   always worth reporting: work nobody has connected to anything.

## Rating a candidate

Propose a `strength` with every link, because an unrated edge is a claim without a
qualifier and the report renders it as such:

- **3 Full** — directly and completely addresses the indicator's requirement
- **2 Partial** — addresses some requirements, not all
- **1 Indirect** — helps without directly addressing it
- **0** — do not propose the link at all; say why it looked like a candidate and was rejected

Set `control` when the source supports it: `external` when the campus relies on a
practice it does not run (SFBRN, the CO, a vendor), `internal` otherwise.

**Reject loudly.** A candidate that surfaced from a search and failed the subject
test is worth one line in the report — it tells the user the search ran and what it
caught, and stops the same false positive being re-proposed next run.

---

# Corpus mode — a set read against itself and against its sources

Entry is the `/implementations` context, so the unit is a set, not a node: every
implementation of a type (`/implementations/Service`), a campus inventory, a
community's or a working group's, or an explicit list the user names.

Three questions that only a set can answer:

1. Does the graph hold what the sources actually say? (**refresh**)
2. Do two members describe the same work? (**overlap**)
3. Do the hosts already cited hold pages and files no member cites? (**sweep**)

## Step 0 — Bound the set, and say how big it is

```
# a campus inventory, with each node's description, indicators, and webpage URLs
run_query --query implementations_for_campus --param campus_abbreviation=sfsu

# a subject slice across types
run_query --query search_implementations --param search_text="captioning"

# the same set, with source-text readability and accountability already joined on
run_query --query corpus_source_text_status --param implementation_label=Guidance --param campus_abbreviation=csueb
run_query --query corpus_accountability_coverage --param implementation_label=Guidance --param campus_abbreviation=csueb
```

`implementations_for_campus` is the best opening read because it returns the
descriptions and the webpage URLs together, which is exactly the input steps 2 and 3
need. Retired members are listed and then excluded from every proposal.

Each member costs a fetch per documented page plus a share of the host sweep. State
the member count and the host count before starting and let the user cut the scope,
rather than discovering at item 30 that they meant six nodes.

## Step 1 — Refresh the Source Text (delegate, do not reimplement)

Run `/get-source-text` over the set. That skill owns the fetching contract: the four
failure modes, the PDF path, and the rule that a write passes `unique_id` and
`raw_text` and nothing else, because every other argument on `update_webpage`
reassigns an association.

Two things this mode adds to it:

- **A corpus run is the ask** for members with no mirror, so fetch those. For members
  that already have one, list the capture date and re-fetch only on the user's word.
  Overwriting a good mirror with a login wall is how this does damage.
- **Unread members stay unread.** A member whose pages 403 or 404 goes into steps 2
  and 3 marked unread, and every finding that touches it says so. Overlap and
  coverage claims made from titles alone are guesses, and in a report they read
  exactly like claims made from text.

## Step 2 — Overlap

**Overlap is not automatically a defect.** Three kinds, one of which is:

| Kind | Example | Verdict |
|---|---|---|
| **Cross-campus parallel** | SFSU and SSU each run a captioning request service | Correct. Campuses are separate practice. Never merge across campuses. |
| **Deliberate layering** | a Guidance that explains the Procedure beneath it | Correct where the types differ and each carries its own sources. Report the pair so the relation is on the record. |
| **Same work, same campus, two nodes** | two Services at one campus whose pages are the same intake form | The defect. Propose consolidation. |

Signals that two members are the same work, strongest first:

1. **Shared documentation** — the same Webpage or Document `unique_id` on both, or
   two Webpage nodes carrying the same URL. Strongest, because someone already
   treated one source as covering both. `corpus_shared_documentation` returns these
   directly, including the pairs where the other side is outside the set.
2. **Same source text** — mirrors that name the same service, form, office or owner.
   Compare `raw_text`, not titles: differently named nodes routinely quote the same
   page, and identically named nodes routinely do not.
3. **Same owner and same subject** — `owned_by` matches and the descriptions
   decompose to the same nouns and verbs.
4. **Identical evidence footprint** — the same YSEs at the same campus. Supporting
   only; sibling work legitimately shares indicators.

Title similarity alone is not a signal. Report it as a naming question.

**Do not merge and do not retire on your own reading.** There is no merge action, and
consolidation drops what the loser holds: evidence links with their strength and
control, documentation year curation, participants, annotations. Report the pair, say
which node holds the richer wiring, and name what the other one holds that the keeper
does not. The user decides. If they do, the order is: relink documentation and
evidence onto the keeper, read back, then retire the other with a note naming the
keeper. Never delete.

### Thin members

The fetch also exposes the inverse of overlap: a member whose description says less
than its own source text does. Propose a rewritten description where the mirror
supports a fuller one, one member at a time and never as a batch. Descriptions follow
the writing style, and the source text is quoted material, so a description is
written from it rather than pasted out of it.

## Step 3 — Domain sweep

For each distinct host across the set's live webpages, look for pages on that host
that cover the same subject and that no member cites.

This is the step that runs away, so it runs on stated limits:

- **Same host only.** A link off the host is a finding to name, not a page to fetch.
  If a campus keeps its accessibility content on a second host, report the host and
  ask before extending the sweep to it.
- **Two hops from a cited page.** Links on pages already mirrored, and links on
  those. Past that it stops being nearby and becomes a crawl.
- **Subject test before proposal.** A page qualifies only if it names the same
  service, policy or process as a member. An index page that merely links to it is
  navigation. Say you saw it and rejected it.
- **A stated cap per host.** Report pages examined alongside pages proposed, and stop
  at the cap rather than exhausting a site.

Rate every candidate the way YSE mode rates an evidence link, and for the same
reason, that an unrated proposal reads as an unqualified claim:

- **3 Full** — the page is the implementation's own documentation
- **2 Partial** — it covers part of it: a form, a schedule, an FAQ, a contact page
- **1 Indirect** — it mentions the work inside a wider subject
- **0** — do not propose it; give it one line saying what caught it and why it failed

A candidate already in the graph under a different implementation is not a duplicate.
Documentation legitimately serves more than one implementation, so the proposal there
is `assign_documentation_to_implementation` on the existing node, not a second Webpage
carrying the same URL. Check the URL against the graph before proposing a create, with
`corpus_host_urls_in_graph --param host_fragment=<host>`.

## Step 4 — Downloadable files

Report every downloadable file seen on a scanned page: `.pdf`, `.doc(x)`, `.ppt(x)`,
`.xls(x)`, `.csv`, and any link marked as a download whatever its extension.

**Report, never auto-attach.** A file on a campus page may be a policy the graph
already holds, a governance item rather than documentation, a form belonging to
another unit, or a superseded copy of something current.

Per file: the page it was found on, the link text, the URL, the extension, and whether
a Document already exists with that `uri_path`. The same PDF linked from three pages
is one Document, so resolve that before proposing anything.

Approved files become Documents by `uri_path`, the external URL. Do not upload them.
The file-storage path is for files the user hands us; mirroring someone else's site
into our storage is a different decision and not this skill's to make. Once the
Document exists, `/get-source-text` fills its `raw_text`, extracting PDFs with `pypdf`
per that skill.

---

# Where the artifacts go (all modes)

Every mode produces two kinds of artifact, and both are project files. **Neither goes in
a scratchpad or a temp directory.** These are ETL: the record of what was changed in the
graph and how, and they are reviewed and committed like any other code.

## The writes go in a batch Cypher file

`app/database/batch/auto-assignments/<prefix>_<YYYY_MM_DD>_<slug>.cypher`, `curate_` for a
rectify pass (`ingest_` is for new source material, which this is not). One file per run:

```
python -m app.database.cypher_runner.run_file <file>            # EXPLAIN-validate
python -m app.database.cypher_runner.run_file <file> --execute  # validate, then run
```

Write it before running anything, present it as the proposal, and execute it on approval.
The file IS the proposal, so a bucket the user vetoes is deleted from it rather than
skipped at run time.

Follow the existing files: a header block giving the date, WHY the pass ran, what the
searches found, and a numbered section list; then one section per bucket. Say in the
header what the run deliberately did NOT do and why, because next year's reader cannot
tell a considered omission from an oversight.

Make it idempotent. `MERGE` on the natural key (`url` for a Webpage, `uri_path` for a
Document) and put content in `ON CREATE SET`, so a re-run is a no-op and a fresh database
reproduces the same state:

```cypher
MERGE (w:Webpage {url: "..."})
ON CREATE SET w.unique_id = replace(randomUUID(), "-", ""),
              w.name = "...", w.description = "...", w.include_in_report = true;

MATCH (i {unique_id: "..."})
MATCH (w:Webpage {url: "..."})
MERGE (i)-[r:is_documented_by]->(w)
ON CREATE SET r.added_date = date("YYYY-MM-DD");
```

A node created from raw Cypher gets no `unique_id` unless you set one, so set it
`ON CREATE` every time. Execution reports `nodes created=N, relationships created=N`,
which is the read-back: a second run of a good file creates nothing.

**`raw_text` never goes in a batch file.** `raw_text_captured` is stamped by
`queries/documentation/update.py`, and raw Cypher bypasses it, leaving a mirror with no
capture date. Source Text is filled through `/get-source-text` and its update path, and
the batch file's header records that it was done there.

## The reads go in the query registry

A recon query worth running twice belongs in
`app/database/cypher_runner/query_registry.yaml`, not in a loose file:

```
python -m app.database.cypher_runner.run_query --list
python -m app.database.cypher_runner.run_query --query <name> --param k=v [--table]
```

Corpus mode's four are already there, all taking `implementation_label` (a label such as
`Guidance`, or `''` for every implementation type) and `campus_abbreviation`:

| Query | Step |
|---|---|
| `implementations_for_campus` | 0 — bound the set; descriptions and webpage URLs in one read |
| `corpus_source_text_status` | 1 — readability, per documentation item, with capture dates |
| `corpus_shared_documentation` | 2 — signal 1, documentation cited by more than one implementation |
| `corpus_host_urls_in_graph` | 3 — what a host already has in the graph, before proposing a create |
| `corpus_accountability_coverage` | feedback — community, owner, owner's communities, description length |

An ad-hoc read runs through `neo4j-cli query`, never through Python that opens a driver.
Add a query rather than running an ad-hoc read whenever the same question will be asked of
the next set. `run_query --validate` checks the registry after an edit.

---

# Writing (all modes)

Present every bucket and finding and STOP.

For a whole set, the artifact IS the proposal: write the batch Cypher file described
above, show it, and execute it on approval. The API calls below are the single-node
path — one edit the user asked for by name, or a repair while the batch file is being
drafted. Reaching for them to loop over a set is the mistake; a loop leaves no reviewable
record of what changed.

On approval:

```
PUT /ati/data-api/v1/implementations
{ "action": "assign_accountable_community",
  "implementation_type": "<Type>", "implementation_unique_id": "<uid>",
  "community": "<name or unique_id>" }
```

Evidence links are two calls. `assign_implementation_to_yse` takes `strength` inline;
`control` is a separate call, and it keys on `unique_id` where the assign keys on
`implementation_title` — an easy mismatch to write:

```
{ "action": "assign_implementation_to_yse",
  "year_success_identifier": "...", "implementation_type": "...",
  "implementation_title": "...", "strength": 2 }

{ "action": "set_evidence_control",
  "year_success_identifier": "...", "implementation_type": "...",
  "unique_id": "...", "control": "internal" }
```

`set_evidence_strength` exists for changing a rating on an existing link, and takes
`unique_id` like control does. An unrated link renders in the report as an
unqualified claim, so set strength in the same run rather than leaving it for later.
Confirm by read-back.

All seven implementation types carry `accountable_community` (the four doing types
plus Guidance, InternalPolicy, Tracking); TAAP does not. Never touch
`accountable_working_group` — narrower edge, different meaning, four types only.
Never touch `status_is`.

## Corpus mode calls

New page, created and linked in one call:

```
POST /ati/data-api/v1/documents
{ "action": "add_webpage",
  "webpage_dict": { "name": "...", "url": "...", "description": "..." },
  "implementation_id": "<uid>", "implementation_type": "<Type>",
  "academic_year": "<year>", "include_in_year": true }
```

A page already in the graph is linked, not recreated:

```
PUT /ati/data-api/v1/implementations
{ "action": "assign_documentation_to_implementation",
  "implementation_id": "<uid>", "implementation_type": "<Type>",
  "documentation_type": "webpage", "documentation_id": "<uid>",
  "academic_year": "<year>", "include_in_year": true }
```

`documentation_type` is lowercase (`webpage`, `document`, `note`, `message`) where
`implementation_type` is the class name (`Service`, `Guidance`). Mixing the two cases
is a 400 from the type validation, not a silent no-op.

A downloadable file is the same POST with `add_document` and
`document_dict: { "name": "...", "uri_path": "<external URL>" }`. Leave `file_path`
and `storage_key` alone; they belong to uploads.

A rewritten description, one at a time:

```
PUT /ati/data-api/v1/implementations
{ "action": "update_implementation", "implementation_type": "<Type>",
  "unique_id": "<uid>", "description": "..." }
```

`title` and `description` are independent and an omitted one is left alone, so send
only the field you changed.

Consolidation runs only on the user's decision, and relinking comes first:

```
{ "action": "retire_implementation", "implementation_type": "<Type>",
  "unique_id": "<uid>", "retired": true,
  "retired_note": "Consolidated into <keeper title> (<keeper uid>)" }
```

# Feedback

Counts per bucket, then what is worth acting on beyond the edges:

- **Ownerless work** — for most undecidable items the fix is naming an owner, not
  guessing a community. Say so rather than proposing a community anyway.
- **Stakes or indicators with no implementations at all** — a coverage gap or a
  stake that should not exist. Say which you think it is.
- **Coverage moved** — how many were wired before, how many after.

Corpus runs report three more things, because the run is only auditable if its own
reach is on the record:

- **Readability** — how many members the set could actually be read from, and which
  went unread with the reason. Every downstream finding inherits this number.
- **Overlap by kind** — the cross-campus and layered pairs counted separately from
  the same-campus duplicates, so a large pair count does not read as a large defect
  count.
- **Sweep reach** — per host: pages examined, pages proposed, pages rejected, files
  found, and how many of those files the graph already held.
