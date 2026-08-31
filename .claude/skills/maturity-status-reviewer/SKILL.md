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

```
## Maturity review — <yid>
Current: <level>   Recommended: <level>   Verdict: HOLD | RAISE | LOWER   Confidence: high/med/low

Scope coverage        <verb/area>: <implementation(s) or GAP> …
Bar coverage          <met>/<gradeable> requirements met. One line per row that
                      is NOT plainly met: Bare (quote the requirement),
                      Overclaimed (what claims it, why it doesn't deliver),
                      Unclaimed-but-met (what delivers it, record the claim).
                      Position/Budget graded from role holdings and allocation
                      records, never from a claim. Note links carrying claims
                      with NO rationale — an unexplained claim is the hardest
                      kind to review and the easiest to get wrong.
Procedures            <level earned> — findings w/ node citations
Resources             <level earned> — owners/roles/PD status
Documentation         <level earned> — active docs vs the practice
Blocking gaps to <next level>   1… 2… 3…  (each: what evidence would close it)
Adverse testimony     IN-SCOPE notes that cap the grade, quoted briefly
Cross-boundary dependencies   weaknesses owned by another process (which one,
                      and the suggested routing) — reported, never capping
```

Cite graph nodes by name/title so the user can click through and disagree.
Findings must trace to nodes — no vibes. If the user then wants the review on
record, two offers (both only on explicit approval, attributed to the current
user):
1. File the block as admin reviewer feedback (POST `add_admin_reviewer_note`).
2. File each BLOCKING GAP as a **Recommendation** (POST `add_recommendation` —
   one per gap, the imperative sentence as `recommendation`, the
   what-closing-it-looks-like line as `detail`). This is the durable home for
   improvement tracking: recommendations carry a lifecycle (open → addressed /
   dismissed with resolution) and surface in the review window and the report,
   so next cycle's review starts by checking THIS cycle's recommendations.
3. Correct the `satisfies` claims the review found wrong — drop overclaims,
   record unclaimed-but-met (PUT `set_evidence_satisfies`, full-replace). This
   is the one write that makes the NEXT review cheaper, because the coverage
   view starts truthful. Still only on explicit approval.
Never touch `status_is`, `ready_for_admin_review`, or the approve flow from
this skill.

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
