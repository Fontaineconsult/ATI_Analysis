---
name: maturity-status-reviewer
description: Use when asked to review, recommend, or sanity-check the CMM maturity status of a success indicator's evidence — comparing the six-level Status Level rubric (and the SI's own companion bars) against the implementations, documentation, and annotations actually in the graph. Triggered by "review the status level", "what maturity level should X be", "recommend a status for 7.11", "is this really Established", or as pre-work before marking evidence ready for administrative review.
---

# Maturity Status reviewer — rubric vs evidence

Recommend a defensible CMM status for one YearSuccessEvidence by grading what the
graph actually holds against the Status Level rubric. The output is a
RECOMMENDATION with citations and gaps — **never a status change**. `status_is`
moves only through the dashboard's admin-review workflow (same rule as
ontology-ingest); on explicit request the recommendation can be filed as admin
reviewer feedback, which is an annotation, not a status write.

## Step 0 — Resolve the target (read-only throughout)

The unit of review is one YSE: `<year>-<composite_key>-<campus>` (e.g.
`2025-2026-7.11-ins-sfsu`). Year defaults to the REPORTING year (the app
default, not the latest rolled year) unless the user names one; campus is
required — never grade a cross-campus blend. Verify the node exists before
grading; a missing YSE ends the review ("no evidence exists for this
indicator/year/campus"), it is never invented.

## Step 1 — Load the ontology FIRST, then the evidence (registry, one shot each)

The order is the method: read the standard before the evidence, or the review
anchors on what exists and rationalizes a bar around it. The first two pulls are
the ontology — the generic rubric and this indicator's own bar — and are fully
digested before any evidence is read. Only then pull what the campus actually has.

```
# The ontology — what is being graded against
python -m app.database.cypher_runner.run_query --query status_level_rubric
python -m app.database.cypher_runner.run_query --query yse_bar_coverage --param year_identifier=<yid>

# The evidence — what the campus holds
python -m app.database.cypher_runner.run_query --query yse_maturity_evidence --param year_identifier=<yid>
python -m app.database.cypher_runner.run_query --query stewarded_ict_for_yse --param year_identifier=<yid>
```

Anything these do not answer is one `neo4j-cli query '...' --format toon` away.
That is the only other read path from a terminal; no Python that opens a driver.

- **The bar**: six levels × three dimensions — procedures / resources /
  documentation (+ documentation-evidence per level). PLUS the SI's own
  companion bar, now decomposed into **EvidenceRequirement** nodes — one per
  bar element, addressable by handle. `established_example` /
  `managed_example` / `optimizing_example` remain on the SI as the authored
  source; the requirement nodes are what to grade against, because an evidence
  link can point at them. `examples_of_evidence` is still prose (not yet
  decomposed) — read it, but nothing can claim it.
- **The evidence**: current status + review flags, implementations (type,
  description, strength, control, **satisfies claims**, retired, owners,
  participants with role handles, active documents/webpages), report-included
  notes/messages/metrics, plans, recommendations, and **prior admin review
  notes** (authored, dated). The prior review is where THIS review starts:
  check what the last cycle flagged and whether it moved — including a
  previous filing of this very skill, which reads as a baseline to confirm,
  advance, or overturn with reasons, never to silently re-derive.
- **The coverage** (`yse_bar_coverage`): the same bar inverted —
  requirement-first, each marked satisfied or not and by which implementations.
  This is the instrument the review is now built around: it states what the
  indicator ASKS FOR, so a bare row is a named gap in the guide's own words
  rather than an absence you had to notice.

## Step 2 — Decompose the SI scope

The indicator text defines the SCOPE the practice must cover (7.11:
*acquiring, converting, digitizing, creating, maintaining* library assets).
List the scope verbs/areas, then map each implementation onto them. A "standard
practice" (Established) must cover the scope — strong evidence on one slice
plus silence on another is a coverage hole, not an average.

The third pull (`stewarded_ict_for_yse`) is the coverage instrument for the
OUTPUT side: the responsible unit's §508 asset register, each asset marked
whether this indicator's work remediates it. Portfolio assets with no work
wired are concrete Output-bar questions ("records demonstrating assets are
consistently accessible" — for WHICH systems?) and often just missing
`remediates` wiring rather than missing practice — say which you think it is.

## Step 2b — Grade the bar, requirement by requirement

`yse_bar_coverage` turns the companion bar into a checklist. Walk it before
grading dimensions: each requirement is a specific thing the indicator asks for,
and the coverage row says whether anyone claims to answer it.

**A claim is an assertion, not proof.** `satisfies` records what a curator
asserted; it is not evidence that the requirement is met. Verify every claim
against what the claiming implementation actually holds — its type, description,
`rationale` on that link, active documentation, owners. The rationale is the
argument to test: read it before the ticks, because a stated reason can be
confirmed or refuted, where a bare tick can only be guessed at. Four verdicts
per requirement:

| Verdict | Condition | Effect on the grade |
|---|---|---|
| **Met** | claimed, and the claiming work plausibly delivers it | counts |
| **Overclaimed** | claimed, but the work does not deliver it | does NOT count, and is a finding in its own right — a wrong claim is worse than none, because the coverage view then reports a gap as closed |
| **Unclaimed but met** | nothing claims it, yet an implementation on this YSE plainly delivers it | counts, and recommend the claim be recorded — missing wiring, not missing practice |
| **Bare** | nothing claims it and nothing delivers it | a named gap, quoted from the bar |

The Overclaimed and Unclaimed-but-met rows are the ones worth the reader's time.
Both are invisible in the report itself — it renders claims at face value — so
surfacing them is work only a review can do.

### Position and Budget claims are a smell

`implementation_evidenced=false` marks the Position and Budget requirements:
they are answered by role holdings, position descriptions and allocation
records, not by an implementation. So an implementation claiming one is a
**probable overclaim** and gets checked first. A published statement, a
procedure or a training page does not establish that responsibility is formally
assigned or that staff time is funded — those need a `holds_role` with
`in_position_description=true`, an org fact, or a budget document.

Grade Position and Budget from that evidence instead, and say so plainly rather
than reading the claim as coverage. If nothing in the graph speaks to them,
they are unevidenced — which is a normal, honest finding, not a defect in the
work.

## Step 3 — Grade each dimension, conservatively

Evidence weights (strongest first):

1. **Implementation + active linked documentation** — documented operating
   practice. This is the only thing that can carry Procedures/Documentation at
   Established+ ("complete and fully reflects the standard practice").
2. **Implementation without documentation** — practice exists; documentation
   dimension unmet at that point.
3. **Strength ratings on `is_evidence_for`** (0–3) qualify how well the LINK
   addresses THIS indicator — a strength-1 link is peripheral evidence even if
   the implementation is mature.
3a. **`satisfies` claims on `is_evidence_for`** — WHICH bar requirements the
   link asserts it answers. Verified per Step 2b, never taken at face value.
   A verified claim is the most precise evidence available, because it ties a
   specific piece of work to a specific sentence of the bar.
3a-ii. **`rationale` on `is_evidence_for`** — the curator's prose on HOW this
   work answers THIS indicator. Read it FIRST when judging a claim: it is the
   argument being made, and a claim is much easier to confirm or refute against
   a stated reason than against a bare tick. Per-link, so the same
   implementation carries a different rationale on each indicator it evidences —
   never read one link's rationale as covering another. A rationale is still an
   assertion: it can be well-argued and still describe work the graph does not
   hold. Where it names artifacts, check they exist. A link with a rationale
   that contradicts its `satisfies` ticks (argues Procedures, ticks Position) is
   a finding — usually the ticks are wrong, since prose is written deliberately
   and checkboxes get swept.
3b. **Control flag on `is_evidence_for`** (`internal` / `external` / unset) —
   the FORMAL boundary statement, read before inferring boundaries from notes.
   An `external` link says the evidence owners rely on a practice they don't
   directly control (another unit, SFBRN, the CO, a vendor): grade their
   INTERFACE to it (hand-off exists, records kept, escalation path), never the
   far practice's internals — and list the far practice's weaknesses under
   cross-boundary dependencies. `internal` links grade normally. Unset links
   on obviously-shared processes are themselves a finding ("mark the control
   flag").
4. **Notes/messages** — attested context. They establish that practice exists
   or (critically) that it does NOT ("no substantive VPAT review" beats a
   procedure document's implication). Adverse testimony in notes caps the
   grade; favorable testimony without a wired implementation does not raise it.
5. **Metrics** — the Managed bar's "measures of success" needs actual Metric
   nodes or documented milestone data, not numbers spoken in passing.
6. **Plans** — intent only. Plans NEVER advance a grade; they name the gap
   they would close.
7. **Excluded**: retired implementations, deprecated documents/webpages,
   annotations with `include_in_report=false`.

### Responsibility boundaries — whose gap is it? (calibration: 7.11, 2026-08-11)

Before letting adverse testimony cap a grade, ask WHOSE practice the gap
belongs to. An SI grades the practice of the unit/area it describes; a
weakness owned by a DIFFERENT process is a **cross-boundary dependency**, not
a fault of the graded practice:

- The graph states boundaries formally: an `is_evidence_for` link with
  `control='external'` IS the declaration that this duty is discharged by a
  practice the owners don't control. Read the flag first; fall back to
  routing-by-subject only for unflagged concerns.
- Route the concern to its owning process: subject → composite-key family /
  responsible working group (purchasing & vendor conformance → the `pro`
  family; systemwide services → the Chancellor's Office). Known SFBRN
  boundary: **vendor conformance (VPAT/ACR) review belongs to the SFBRN
  Procurement process and, once live, the CO centralized review** — unit-level
  SIs (library, departments) are never dinged for not performing expert
  conformance review themselves.
- What IS gradeable at the boundary is the unit's **interface** to the owning
  process: the hand-off exists, records are kept (e.g. VPATs on file), issues
  escalate along the path. A missing interface caps; a weak far side does not.
- Cross-boundary weaknesses still get REPORTED — in their own output section,
  with a suggested routing (usually: file a note on the owning family's YSE) —
  so the systemic gap lands on the right desk instead of vanishing.

Dimension notes:
- **Resources at Established** requires *allocated* — named owners/participants
  operating the work is de-facto allocation; "formally assigned and documented"
  (the usual SI Position bar) additionally wants role holdings with
  `in_position_description=true` or equivalent documented assignment.
- **Managed** additionally needs tracking procedures + collected success data
  (milestones/measures). Look for Tracking implementations and Metric nodes.
- **Optimizing** needs regular administrative reviews analyzing that data —
  admin-review records, not just good practice.

A level is EARNED only when every dimension meets that level's bar across the
SI scope. Recommend the highest earned level. Bias: this codebase's culture
sets status "deliberately conservatively — a claim about reality you can
defend." When torn between two levels, recommend the lower and list exactly
what would defend the higher.

## Step 4 — The recommendation block (the deliverable)

The deliverable is the ROUTE to the next level, not a verdict with a gap list
appended. A campus reader acts on it without knowing the graph exists.

### Two hard rules on the output

**At most three recommendations.** Consolidate by the dimension each one
unblocks: one for Procedures, one for Resources, one for Documentation, and
fewer when a dimension is already met. Related fixes belong INSIDE one
recommendation as sentences, never split into their own numbered items. When
more than three things are wrong, the least important are CUT, not appended.
A reader acts on three and ignores nine.

**No internal system vocabulary.** Node labels, relationship names, property
names, registry query names, skill names and year identifiers stay out of the
block. Say what the reader would say:

| Not this | This |
|---|---|
| the YSE, year_identifier | the indicator, the entry for this year |
| implementation node, is_evidence_for | the item, listed as evidence |
| strength 3, control flag unset | rated as strong evidence, no boundary stated |
| satisfies claim, rationale | a written reason explaining how it answers the indicator |
| raw_text not captured, run /get-source-text | the page content has never been saved, capture the page |
| holds_role, in_position_description=true | the position description names the work |
| Metric nodes, Tracking implementation | counts and measures, the tracking tool |
| retired=false, no_longer_exists | still listed, the page no longer exists |
| wire it to, unwired | list it as evidence for, not listed anywhere |

Rubric words (Defined, Established, Managed, procedures, resources,
documentation, campus plan) are the Chancellor's Office's own vocabulary and go
in as written. So do product names the campus uses (Canvas, UDOIT, Ally,
Grackle) and the real titles of policies, pages, workshops and people.

### Shape

```
## Maturity review: indicator <key>, <campus>, <year>
Indicator <key>: "<verbatim indicator text>"
Current status: <level> · What the evidence supports today: <level> · Confidence: high/med/low

<One paragraph: how wide the gap is, what already counts toward it, and how
many changes close it. Name the strongest evidence by its real title.>

### Recommendations to reach <next level>
**1. <imperative sentence>.**
<What that level of the bar asks for. What is present. What is missing, each
fix its own sentence, each traceable to something the reader can open.>
**2. …**  **3. …**

### What these <n> will not reach
<The level above, and why it stays out of reach. One paragraph.>
<Any standing judgment the user should be able to overrule, including a
weakness routed to another area, as prose rather than as a fourth
recommendation. Say who filed it and invite the correction.>

<Closing: nothing has been changed, then the offers.>
```

The dimension-by-dimension grading from Step 3 still happens, and its findings
surface INSIDE the recommendation that acts on them. Print a separate
Procedures / Resources / Documentation breakdown only when the user asks for
the full grading, or when the recommendation count drops below three and the
reasoning would otherwise be invisible.

Cite items by their real titles so the user can open them and disagree.
Findings trace to something in the graph, never to impression. If the user then
wants the review on record, three offers (each only on explicit approval,
attributed to the current user; the endpoint names below are for the operator
and never appear in the block):

1. File the block as admin reviewer feedback (POST `add_admin_reviewer_note`).
2. File each recommendation as a **Recommendation** (POST `add_recommendation`,
   the imperative sentence as `recommendation`, the closing condition as
   `detail`). This is the durable home for improvement tracking: recommendations
   carry a lifecycle (open → addressed / dismissed with resolution) and surface
   in the review window and the report, so next cycle's review starts by
   checking THIS cycle's recommendations.
3. Correct the `satisfies` claims the review found wrong: drop overclaims,
   record unclaimed-but-met (PUT `set_evidence_satisfies`, full-replace). This
   is the one write that makes the NEXT review cheaper, because the coverage
   view starts truthful.

Never touch `status_is`, `ready_for_admin_review`, or the approve flow from
this skill.

## Step 5 — The Evidence Summary (a separate artifact, and it is public)

The recommendation block above is internal. The **Evidence Summary** is the
reviewer's own paragraph on the indicator, stored as `admin_review_description`
on the YSE, and the public report renders it under that heading. Anyone reading
the campus's published report sees it. Write it whenever the review is being put
on record, and never write it as a condensed version of Step 4.

### What it is for

**An executive reading one indicator.** A provost, a vice president, a
Chancellor's Office reviewer. Someone who will not open the implementations
underneath and who needs to leave the paragraph able to describe the campus's
position in a meeting. The report lists every implementation, document and
recommendation below it. This is the paragraph that tells them what it adds up
to.

That audience sets the register. Write it as institutional prose, not as
narrative. "There is one way to do this at East Bay, and faculty can look it up"
is the wrong voice however clean it reads: an executive summary opens with the
assessment, not with a scene.

### Structure

Three moves, in this order:

1. **The assessment, in one sentence.** What the campus has, named as a whole.
   "CSU East Bay has a developed and interconnected program supporting faculty in
   making their Canvas courses accessible." This is the sentence they repeat.
2. **How, in four to six sentences.** The named things that make the claim true:
   the policy, the program, the instructions, the support, the automation, the
   reinforcement. Enough that the picture is concrete and the first sentence is
   earned.
3. **Why this level, in one or two sentences.** Say what the campus reached and
   name what holds it there. An executive's next question is always "so what is
   missing", and answering it in the summary is cheaper than a meeting.

### Hard limits

**Six to eight sentences.** Break into paragraphs where the move changes, and
the break before "why this level" is usually worth taking. No headings, no
bullets.

**Paint the shape, do not list the parts.** A reader should finish able to say
what the campus does and why that adds up to the level. Facts in a row do not do
that, and the report already holds the parts.

### What stays out

Everything the report shows elsewhere, and everything Step 4 exists to carry:

- Strength ratings, control flags, item counts, and any per-item detail. The
  report lists the items. Naming three of eight and rating them repeats the list
  badly.
- Recommendations, blocking gaps, next steps, and what would raise the level.
  Those are Recommendation nodes and the review block.
- The apparatus of the grade: dimension names, bar language, the rubric's own
  wording, the case for the level argued point by point. The summary should make
  the level obvious, not defend it. One clause naming what the campus has reached
  and one naming what holds it there does that work; a paragraph of reasoning
  turns the summary into a second review.
- Any contradiction the review has not settled. Two campus sources disagreeing
  about a date is a question for the owner, not published text. Report it in
  Step 4 and leave it out here.
- Internal vocabulary of every kind, per the writing style's own rule.

### What earns its place

The shape of the practice. Which instrument states the obligation, which one
carries the operating program, which one holds the instructions people follow.
What runs underneath the documentation. Who operates it. A limit that a reader
would otherwise assume away, stated as a fact rather than as a gap to close.

### Register

Present tense, institutional, plain. Follow
`app/database/ontology/writing-style.md` throughout. Five of its rules decide
whether eight sentences read as a briefing or as a catalogue:

- **Name who acts.** Units and people run this work. Write them as the subject,
  and keep the faculty member visible as the person it happens to.
- **Do not stack nouns**, and do not let documents do abstract work. A page that
  "states the obligation" or "carries the program" is a noun stack with a verb
  dropped in. Say what it requires of someone.
- **Stop compounding.** Sentence after sentence of "X, and Y" joins everything at
  the same strength, and the reader loses which pairs matter.
- **Keep list items the same shape**, or drop the list and write the sentence.
- **Definitions before uses.** An executive does not know what UDOIT is. One
  clause of gloss where it first appears costs less than losing them.

The failure mode is a flat middle: six facts of similar length and construction,
each true, adding to nothing.

### Worked example (2025-2026-4.3-ins-csueb, 2026-09-09)

> CSU East Bay has a developed and interconnected program supporting faculty in
> making their Canvas courses accessible. Academic Senate policy CIC 47 requires
> instructors to design their courses to current WCAG standards, and the Online
> Campus converts that requirement into a two-year readiness program with
> scheduled phases, a course materials checklist for the current year, and a
> workshop series each term. Faculty follow the ScreenSteps guide library for
> step-by-step instructions, including running the UDOIT accessibility checker to
> score their own course and correct what it identifies. Where faculty cannot
> remediate their own content, a student assistant does it for them, either
> working in the live course or returning remediated files. A nightly service
> enables Verbit captioning on every new Canvas course shell, so course video is
> captioned without anyone requesting it. Accessibility Services publishes the
> term deadlines faculty work to, and the Office of Faculty Development teaches
> the same material at Back to the Bay each August.
>
> The indicator sits at Established because this is a single standard practice,
> documented in each of those places and running without individual intervention
> rather than depending on who is asked. It has not reached Managed because
> staffing is thin: five people across four units carry the work, and only the
> ATI Coordinator's position description reflects it.

Eight sentences. The first is the one an executive repeats. The next five earn
it by naming the policy, the program, the instructions, the human backstop and
the automation, so the claim of "interconnected" is visible rather than asserted.
The last two answer the question that always comes next. UDOIT is glossed on
first use. The Title II date contradiction found in the same review is absent,
because it is unresolved.

Three earlier drafts failed in ways worth keeping. The first made a document the
subject of every sentence: accurate, and nobody was in it. The second put people
back in but joined every clause with "and" at the same length, so it read as a
list of true things and never said why any of it reached Established. The third
fixed the rhythm by going narrative, opening "There is one way to do this at East
Bay", which reads well and is the wrong voice for a provost.

## Calibration example (2026-08-11): 2025-2026-7.11-ins-sfsu

Current Defined; recommended **HOLD at Defined (high confidence)**. Two rounds
of calibration, both instructive:

1. First pass capped the grade on "no substantive review of vendor VPATs"
   (Ya Wang, explicit). **User correction**: vendor conformance review is the
   SFBRN Procurement process's (and soon the CO's) job — a real systemic
   weakness, but not the Library's fault. Regraded as a cross-boundary
   dependency; the Library's acquiring INTERFACE is actually solid (documented
   acquisitions procedure, VPATs on file, vendor-escalation path under
   Electronic Resources). This is where the responsibility-boundary rule
   above came from.
2. Verdict still HOLD, on the IN-scope gaps: the intake/triage practice is
   attested but undocumented and untracked (the node's own "what is absent"
   list), Position formalization is unevidenced (no PD-flagged role
   holdings), and BATV digitization sat at ~80% (operating, not yet
   standard). Established becomes arguable when intake is documented+counted,
   responsibility lands in position descriptions, and digitization reaches
   steady state.
3. Round 3 (after the control flag + footprint landed): the boundary became
   FORMAL — "SFBRN CSUBuy IT Accessibility Review Procedure" wired as
   external evidence at strength 3 turned round 1's grade-capper into a
   resolved, documented reliance; the acquiring verb flipped to covered. The
   footprint instrument then exposed the Output-bar reality: five portfolio
   assets, none remediated on this indicator — with BATV→Quartex judged
   missing-wiring rather than missing-practice. Verdict held at Defined on
   the surviving in-scope gaps (intake documentation/telemetry, PD
   formalization, Output records). The lesson: formal edges replace prose
   inference round by round; the review gets sharper as the model does.

## Calibration example (2026-09-09): 2025-2026-4.3-ins-csueb

Current Established; the evidence supported **Defined (medium confidence)**.
The grading was never contested. Both corrections were about the OUTPUT, and
they are why the two hard rules above exist:

1. The first block ran nine recommendations across five headed sections, each
   gap its own numbered item. **User correction**: cut to three and combine.
   The consolidation is not cosmetic. Grouping by the dimension each one
   unblocks (adoption date + the missing check + the empty guidelines item all
   sit under Procedures) is what turns a defect list into a route, and it
   forces the ranking that a nine-item list dodges. Items 8 and 9 were cut on
   the same pass, which cost the reader nothing.
2. The block cited nodes, properties and edge names throughout. **User
   correction**: no internal system vocabulary. The audience is a campus
   reader deciding whether to fund a position, not a curator of the graph.
   "The page content has never been saved" says the same thing as "raw_text is
   null" and survives being pasted into an email.

Substance worth keeping: an indicator with no companion bar and no requirement
nodes falls back to the generic rubric, and the review says so rather than
inventing a bar. A formal policy with no approval or effective date recorded
reads as a committee action request, which is what held Procedures at Defined
while the policy itself was strong enough to carry the guidelines clause. And
a strength-3 item with no description, no owner and a dead link is worse than
no item at all, because the report renders it as coverage.

## Prose style

**All prose here follows `app/database/ontology/writing-style.md`** (the project writing style): no marketing vocabulary, no em dashes, one claim per sentence, name the relation instead of gesturing at it, no throat-clearing. Quoted material and success-indicator text are exempt and go in verbatim.
