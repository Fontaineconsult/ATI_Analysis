---
name: stakeholder-interview
description: Prep and run stakeholder interviews whose transcripts feed the ontology-ingest pipeline. Given a stakeholder/campus/topic, recons the graph (read-only) and generates a tailored one-page interview guide — known implementations, open action items from prior meetings, open Queries to settle live, and SI coverage gaps to probe — wrapped around the standing interview protocol. Triggered by "prep an interview with X", "interview guide for", "I'm meeting X about Y", "schedule prep for the Z walkthrough".
---

# Stakeholder interview — prep and protocol

Interviews are the upstream of `/ontology-ingest`: the transcript is raw input to
the graph, so the interview is run BACKWARDS from what ingest needs. Every
question frame below exists to produce S1 operational detail, resolvable
identities, and clean signal separation (is happening / will happen / needs
deciding). The output of prep is a one-page guide the interviewer can glance at
live; the output of the interview is a transcript in
`app/database/ontology/raw_transcripts/` ready for `/ontology-ingest`.

## Part 1 — Prep (generate the guide)

When the user names a stakeholder / campus / topic, recon the graph (read-only —
registry runner first, ad-hoc Bolt for the rest) and write the guide to
`app/database/ontology/interviews/<date>-<campus>-<topic-slug>.md`.

Recon, in order:

1. **Anchor**: campus abbrev, working group(s) the topic maps to, current
   AcademicYear (latest with WGPs). These pre-fill the guide header.
2. **People**: the stakeholder's Person node (title, roles, worked_on,
   implements, communities) + that campus's WG leads roster. Note anyone whose
   name came from a transcript with an as-heard flag — verify live.
   **Stakeholder communities**: for each target SI, pull the communities that
   hold a stake in it and their member rosters —
   `(si)<-[:has_stake_in]-(c:CommunityOfPractice)<-[:member_of_community]-(p)`
   (registry: `community_detail`). Those members are the interview candidates;
   list them on the guide so the interviewer knows who else works this ground.
3. **Last contact**: most recent MeetingMinutes involving this stakeholder or
   campus/WG; extract the action-items note. Unfinished items are follow-ups —
   the interview's opening business.
4. **Open Queries** under the campus's WGPs: each is a question to ask LIVE.
   Settling one in the interview is a first-class outcome (status → settled,
   answer recorded).
5. **Coverage gaps**: YSE for (campus, WG, year) with status Not Started or no
   is_evidence_for implementations — quote each SI's text. These are the
   probing targets; 3–6 max, ranked. An interview that converts one gap into an
   S1-described implementation pays for itself.
6. **Known implementations** for the campus/topic (titles + what they
   evidence): the guide lists them so the interviewer VERIFIES instead of
   re-eliciting ("last time we recorded X — still accurate? what changed?").

Guide template (keep it to one page — it is a live crib sheet, not a report):

```
# Interview: <stakeholder> — <topic>
<date> · <campus> · <working group(s)> · anchor year <YYYY-YYYY>

## Follow-ups from last contact (<date of prior minutes>)
- [ ] <unresolved action item> ...

## Open questions to settle live (existing Query nodes)
- [ ] <question> (<category>) — settling this updates the graph

## Coverage targets (SIs with weak/no evidence here)
- [ ] <key> — "<SI text>" → probe: <tailored question>

## On file — verify, don't re-elicit
- <implementation title> (evidences <keys>) — still accurate?

## Artifact wishlist
- [ ] <document/report/export they likely have>

## Protocol reminder: identity round → walkthrough → coverage sweep →
## commitments → pending decisions → artifacts → RECAP ALOUD
```

## Part 2 — The standing protocol (the repeatable method)

Six phases. The order matters: operational reality before aspirations, so the
transcript separates S1 from S2 naturally instead of interleaving them.

1. **Frame + identity round** (2 min). State for the recording: date, campus,
   topic. Have every participant say their FULL NAME, title, and department —
   ask for spellings on anything unusual. Also ask which functional community
   they sit with (library, alt media, faculty development, …) — it wires
   `member_of_community` at ingest and pre-fills future guides. When a third party comes up later,
   ask "full name? what's their role?" the first time. (Calibration: "Timothy"
   cost a DB hunt; "Zach Autry" was a mis-hearing of Oshri; "Kristen Denver"
   is still flagged as-heard.)
2. **The walkthrough** (the S1 core — give it half the time). "Walk me through
   the process start to finish, as it actually ran last term." Follow the
   thing, not the org chart: trigger → steps → who does each step (name +
   role) → what tool at each step → what record it leaves → volumes and
   numbers → how it ends. Probe the boundaries: "what happens when it goes
   wrong?", "who picks it up when you're out?". Past-tense, concrete-instance
   questions ("the last course you remediated — what happened, step by step?")
   produce evidence; present-tense generalities produce brochure copy.
3. **Coverage sweep** (the guide's targets). For each target SI, ask the
   tailored probe. Honest-status framing: "if I had to show an auditor
   evidence for <SI paraphrase>, what would you hand me?" Nothing → gap note;
   something → artifact wishlist.
4. **Commitments vs wishes**. "What are you building or changing this year?"
   Then, for each: "is that funded/approved/started, or something you want?"
   — this one follow-up is what separates a Plan (S2) from a Query/Note (S3).
   Ask who owns each commitment by name.
5. **Pending decisions**. "What are you waiting on someone else to decide?"
   and "what would you buy/change if it were your call?" — each answer is a
   Query candidate with a named decider.
6. **Artifacts + recap ALOUD** (never skip). Read back, into the recording:
   action items with owners, artifacts promised, decisions made, questions
   left open. The recap is the single highest-value passage for ingest — the
   CSUEB action-items section came almost verbatim from one.

### Question frames per ontology target

| You want a… | Ask |
|---|---|
| Process | "What happens every term without anyone having to decide it?" |
| Procedure | "If a brand-new student worker had to do this tomorrow, what would you hand them?" |
| Service | "What do people come to your team for, on demand?" |
| Guidance | "What training or reference material exists? Who maintains it?" |
| Tool (vs Asset) | "What do you use to DO the work?" vs "what are you responsible for keeping accessible?" |
| worked_on / roles | "Who specifically does that step? What would you call their role?" |
| is_evidence_for | "What record does that leave? Could you export it?" |
| Metric | "What numbers do you track? What format could you send them in?" |
| Plan | "What's committed for this year — funded, approved, or started?" |
| Query | "Who has to decide that? What would unblock it?" |

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

## Part 3 — After the interview

1. Drop the transcript in `app/database/ontology/raw_transcripts/` (keep the
   recorder's naming: `<topic> transcript_<YYYY-MM-DD>_<HH.MM.SS>.txt`).
2. Run `/ontology-ingest`. The ingest recon MUST read this interview's guide:
   its coverage targets and open queries are pre-anchored routing hints, and
   the decision manifest reports coverage against them (targets converted /
   probed-but-empty / not reached — the not-reached list seeds the NEXT guide).
3. Settle any Query nodes answered live (status, answer, date_settled) as part
   of the ingest manifest.
4. Check off delivered artifacts as they arrive — each becomes a Document
   wired per the ingest rules.
