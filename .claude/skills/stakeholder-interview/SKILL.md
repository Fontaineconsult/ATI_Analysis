---
name: stakeholder-interview
description: Prep and run stakeholder interviews whose transcripts feed the ontology-ingest pipeline. Given a stakeholder/campus/topic, recons the graph (read-only) and generates a tailored interview guide built around the maturity bar — each target indicator's companion guide (or the generic Status Level rubric when none is authored) decomposed into its elements, with the question and the artifact that would evidence each one. Triggered by "prep an interview with X", "interview guide for", "I'm meeting X about Y", "schedule prep for the Z walkthrough".
---

# Stakeholder interview — prep and protocol

Interviews are the upstream of `/ontology-ingest`: the transcript is raw input to
the graph, so the interview is run BACKWARDS from what ingest needs. Every
question frame below exists to produce S1 operational detail, resolvable
identities, and clean signal separation (is happening / will happen / needs
deciding).

**The interview is aimed at a bar.** For each indicator in scope, that bar is the
SI's own **companion guide** — `established_example`, `managed_example`,
`optimizing_example`, `examples_of_evidence` — and where none is authored, the
generic six-level **Status Level rubric** (procedures / resources / documentation
/ documentation-evidence). The working goal is to collect enough, in ontology
terms, to earn **Established**: a standard practice, formally assigned, documented,
and producing records.

**The bar also governs restraint.** Established is earned, never conceded to a
confident description. If the evidence collected does not match the companion
guide element for element, the interview's output is the honest level plus the
named missing element — not a rounded-up status. Collect ambitiously, grade
conservatively.

The output of prep is a guide the interviewer can glance at live; the output of the
interview is a transcript in `app/database/ontology/raw_transcripts/` ready for
`/ontology-ingest`, and after that a defensible `/maturity-status-reviewer` pass.

## Part 1 — Prep (generate the guide)

When the user names a stakeholder / campus / topic, recon the graph (read-only —
registry runner first, ad-hoc Bolt for the rest) and write the guide to
`app/database/ontology/interviews/<date>-<campus>-<topic-slug>.md`.

Recon, in order:

1. **Anchor**: campus abbrev, working group(s) the topic maps to, and the
   **reporting year** — the year the campus is currently evidencing, which is
   usually NOT the latest rolled year. Ask if ambiguous; grading a rolled-forward
   year against a bar produces false gaps, because rollover carries status
   without always carrying evidence links. These pre-fill the guide header.
2. **People**: the stakeholder's Person node (title, roles, worked_on, implements,
   communities) + that campus's WG leads roster. Note anyone whose name came from
   a transcript with an as-heard flag — verify live. Note title conflicts between
   a Person node and any role/position node describing the same job; both go in
   the identity round.
   **Stakeholder communities**: for each target SI, pull the communities that hold
   a stake in it and their member rosters —
   `(si)<-[:has_stake_in]-(c:CommunityOfPractice)<-[:member_of_community]-(p)`
   (registry: `community_detail`). Those members are the interview candidates;
   list them on the guide so the interviewer knows who else works this ground.
3. **Last contact**: most recent MeetingMinutes involving this stakeholder or
   campus/WG; extract the action-items note. Unfinished items are follow-ups —
   the interview's opening business.
4. **Open Queries** under the campus's WGPs: each is a question to ask LIVE.
   Settling one in the interview is a first-class outcome (status → settled,
   answer recorded).
5. **The bar — pull it before choosing targets.** One rubric pull, then one
   evidence+companion pull per candidate YSE:

   ```
   python -m app.database.cypher_runner.run_query --query status_level_rubric
   python -m app.database.cypher_runner.run_query --query yse_maturity_evidence \
       --param year_identifier=<year>-<composite_key>-<campus>
   ```

   `yse_maturity_evidence` returns both sides at once: the SI text, its companion
   bars, the current status, and every implementation / document / note / metric /
   plan already wired. Read the companion guide FIRST and the evidence second —
   the bar decides what counts as a gap, not the other way round.
6. **Rank the targets by distance to Established** — 3 to 6, no more. Rank by lift,
   not by weakness: an indicator two elements short of the bar where one artifact
   closes both outranks a Not Started indicator nobody in the room owns. Promote a
   target when any of these is true:
   - one named artifact would close every open element (the cheapest win — say so);
   - the people in the room are the only ones who can answer it;
   - a peer campus is materially ahead on the same indicator (concrete, non-abstract
     pressure — name the campus and its level);
   - the current status rests on **retired** implementations, **deprecated** documents,
     or annotations with `include_in_report=false` — evidence the grader discards.
     A status resting on discarded evidence is a reporting exposure, not a gap.
   Exclude indicators whose `introduced_in_year` is later than the anchor year, and
   indicators flagged `removed` — they have no YSE to evidence and asking about them
   wastes the room. Say in the guide that they were excluded and why.
7. **Known implementations** for the campus/topic (titles + what they evidence, plus
   owners, `retired`, `accountable_community`, and linked documents): the guide lists
   them so the interviewer VERIFIES instead of re-eliciting ("last time we recorded X
   — still accurate? what changed?").

### Decomposing the bar into questions (the core of prep)

The SI's `established_example` is normally written as four named elements —
**Position / Budget / Procedures / Output**. Split it on those headings and treat
each as a separate, separately-evidenced claim. When `established_example` is None,
use the generic Established row from `status_level_rubric` and its dimensions —
**Procedures / Resources / Documentation / Documentation-evidence** — which map onto
the same four ideas. `examples_of_evidence` is the artifact menu: it names what proof
for THIS indicator looks like, so it becomes the artifact wishlist rather than
generic wishing.

For every element, the guide carries three things: what the graph holds today, the
question that would settle it, and the artifact that would evidence it.

| Bar element | Ontology target | Ask |
|---|---|---|
| **Position** (responsibility assigned) | `Person` + `owned_by` / `implements` / role holding with `in_position_description` | "Whose job is this, by name and title? Is it written into their position description, or is it goodwill?" |
| **Budget** (resources allocated) | notes/annotations on the YSE; funded `Plan`; staffing counts | "What is funded for this — staff time, licenses, student assistants? Allocated, or identified and waiting?" |
| **Procedures** (consistent and formal) | `Process` / `Procedure` / `Service` / `Guidance` implementation | "If a brand-new hire had to run this tomorrow, what would you hand them?" |
| **Documentation** (complete, stored, communicated) | `Document` / `Webpage` via `is_documented_by` | "Where does that document live, and who on campus has been told it exists?" |
| **Output** (records the practice produces) | `Document`, `Tracking`, `Metric` | "What record does each run leave? Could you export a year of them?" |
| **Managed**, if in reach | `Metric` nodes + `Tracking` | "What number do you track, how often, and who looks at it?" |

Two rules that keep the ledger honest:

- **A description is not a procedure, and a procedure is not documentation.** Hearing
  the process narrated fluently evidences Procedures at best. Established
  Documentation needs a stored artifact you can link. Ask for the link in the room.
- **Plans never count.** A plan names the gap it would close. If the answer to a bar
  element is "we're going to," the element is unmet and the answer is a Plan node.

Guide template — the bar block is the spine; everything else supports it:

```
# Interview: <stakeholder> — <topic>
<date> · <campus> · <working group(s)> · reporting year <YYYY-YYYY>

## Follow-ups from last contact (<date of prior minutes>)
- [ ] <unresolved action item> ...

## Open questions to settle live (existing Query nodes)
- [ ] <question> (<category>) — settling this updates the graph

## Targets — ranked by distance to Established

### <key> — current <status>  →  Established needs 4 of 4
"<SI text>"
Bar source: companion guide | generic rubric (no companion authored)

| Element | On file today | Ask | Would evidence it |
|---|---|---|---|
| Position | <owner/implements, or NONE> | <question> | <artifact> |
| Budget | <what's known> | <question> | <artifact> |
| Procedures | <implementation(s), note retired ones> | <question> | <artifact> |
| Output | <docs/metrics, or NONE> | <question> | <artifact> |

Verdict to reach live: <what would have to be true>. Do not claim Established on
<the element most likely to be talked past>.

## On file — verify, don't re-elicit
- <implementation title> (evidences <keys>; owner <name>; retired? docs?) — still accurate?

## Artifact wishlist  (sourced from examples_of_evidence, not invented)
- [ ] <artifact> → closes <key>/<element>

## Excluded from targets this year
- <key> — introduced_in_year <YYYY-YYYY> / removed — no YSE at this anchor

## Protocol reminder: identity round → walkthrough → BAR SWEEP → commitments →
## pending decisions → artifacts → RECAP ALOUD
```

## Part 2 — The standing protocol (the repeatable method)

Six phases. The order matters: operational reality before aspirations, so the
transcript separates S1 from S2 naturally instead of interleaving them.

1. **Frame + identity round** (2 min). State for the recording: date, campus,
   topic. Have every participant say their FULL NAME, title, and department —
   ask for spellings on anything unusual. Also ask which functional community
   they sit with (library, alt media, faculty development, …) — it wires
   `member_of_community` at ingest and pre-fills future guides. When a third party
   comes up later, ask "full name? what's their role?" the first time.
   (Calibration: "Timothy" cost a DB hunt; "Zach Autry" was a mis-hearing of
   Oshri; "Kristen Denver" is still flagged as-heard.)
2. **The walkthrough** (the S1 core — give it half the time). "Walk me through
   the process start to finish, as it actually ran last term." Follow the thing,
   not the org chart: trigger → steps → who does each step (name + role) → what
   tool at each step → what record it leaves → volumes and numbers → how it ends.
   Probe the boundaries: "what happens when it goes wrong?", "who picks it up when
   you're out?". Past-tense, concrete-instance questions ("the last course you
   remediated — what happened, step by step?") produce evidence; present-tense
   generalities produce brochure copy.
3. **The bar sweep** (the guide's target blocks). Walk each target, element by
   element, in the guide's order. Two framings do the work:
   - **Auditor framing** for Output and Documentation: "if I had to show an
     auditor evidence for <SI paraphrase>, what would you hand me?"
   - **Successor framing** for Procedures and Position: "if you left tomorrow,
     what would your replacement inherit — and whose job description says this?"
   Say the level out loud and negotiate it in the room: *"That gets Procedures to
   Established. Documentation is still the draft on your desktop, so the indicator
   holds at Defined until that's stored and announced — agree?"* Getting the
   stakeholder to agree to the honest level on the recording is worth more than a
   flattering one, and it converts the gap into their action item rather than ours.
4. **Commitments vs wishes**. "What are you building or changing this year?" Then,
   for each: "is that funded/approved/started, or something you want?" — this one
   follow-up is what separates a Plan (S2) from a Query/Note (S3). Ask who owns
   each commitment by name.
5. **Pending decisions**. "What are you waiting on someone else to decide?" and
   "what would you buy/change if it were your call?" — each answer is a Query
   candidate with a named decider.
6. **Artifacts + recap ALOUD** (never skip). Read back, into the recording: action
   items with owners, artifacts promised, decisions made, questions left open, and
   **per target indicator, what is now evidenced and what is still missing for
   Established**. The recap is the single highest-value passage for ingest — the
   CSUEB action-items section came almost verbatim from one.

### Do not manufacture Established

The interview collects; it does not grade, and it never writes status. `status_is`
moves only through the dashboard's admin-review workflow — same rule as
`/ontology-ingest` and `/maturity-status-reviewer`.

Four failure modes to refuse in the room, because each produces a status the next
audit will strip:

- **Fluency mistaken for formality.** A process described well is a common practice
  (Defined). Formal means written down, stored, and communicated.
- **Intent mistaken for allocation.** "We're hiring for that" is Resources
  identified, not allocated.
- **Testimony mistaken for records.** Remembered volumes are not Output. Adverse
  testimony, though, is decisive on its own: "there's no real review" caps the
  grade whatever the documents imply.
- **Discarded evidence counted anyway.** Retired implementations, deprecated
  documents, and `include_in_report=false` notes are invisible to the grader.
  If a target's current status rests on them, say so in the room — that is a
  reporting exposure to fix, not a level to defend.

When the answer is short of the bar, the deliverable is the named element plus the
artifact that would close it. That is a better interview outcome than a level,
because it is next year's work order.

### Question frames per ontology target

| You want a… | Ask |
|---|---|
| Process | "What happens every term without anyone having to decide it?" |
| Procedure | "If a brand-new student worker had to do this tomorrow, what would you hand them?" |
| Service | "What do people come to your team for, on demand?" |
| Guidance | "What training or reference material exists? Who maintains it?" |
| Tool (vs Asset) | "What do you use to DO the work?" vs "what are you responsible for keeping accessible?" |
| worked_on / roles | "Who specifically does that step? What would you call their role?" |
| owned_by | "If this breaks, whose phone rings?" |
| is_evidence_for | "What record does that leave? Could you export it?" |
| Document / Webpage | "Is that written down anywhere I could link to?" |
| Metric | "What numbers do you track? What format could you send them in?" |
| Plan | "What's committed for this year — funded, approved, or started?" |
| Query | "Who has to decide that? What would unblock it?" |
| retired / superseded | "Is that still how it works, or did something replace it?" |

### Transcript hygiene (verbal habits that make ingest accurate)

- **Voice-tag for the record**: "Action item for me: …", "Open question: …",
  "Decision made: …", "For the record, the tool is called …". (The Sonoma
  "note for you, AI" habit — formalized.)
- **Say the campus** when the conversation moves between institutions —
  multi-campus content splits into per-campus nodes at ingest.
- **Repeat numbers with units and context** ("fifty-three percent adoption,
  three weeks before term").
- **Spell proper nouns once**: people, products, systems.
- **Name uncertainty out loud**: "you're not certain the policy passed — I'll
  record that as an open question." Uncertainty spoken becomes a Query;
  uncertainty unspoken becomes a wrong node.
- **Say the bar element when you hear it met**: "that's the Output piece" — the
  tag survives into the transcript and routes the fact at ingest.

## Part 3 — After the interview

1. Drop the transcript in `app/database/ontology/raw_transcripts/` (keep the
   recorder's naming: `<topic> transcript_<YYYY-MM-DD>_<HH.MM.SS>.txt`).
2. Run `/ontology-ingest`. The ingest recon MUST read this interview's guide: its
   target blocks and open queries are pre-anchored routing hints, and the decision
   manifest reports coverage against them **element by element** — which bar
   elements are now evidenced, which were probed and came back empty, which were
   not reached. The not-reached list seeds the NEXT guide.
3. Settle any Query nodes answered live (status, answer, date_settled) as part of
   the ingest manifest.
4. Check off delivered artifacts as they arrive — each becomes a Document wired per
   the ingest rules. An artifact promised but never delivered leaves its bar element
   unmet; carry it forward rather than quietly dropping it.
5. Run `/maturity-status-reviewer` on each target YSE once ingest has landed. The
   interview supplies the evidence; that skill decides the level and files the
   blocking gaps as Recommendations. If the review lands lower than the room hoped,
   that is the process working — the guide's next edition starts from its gap list.
