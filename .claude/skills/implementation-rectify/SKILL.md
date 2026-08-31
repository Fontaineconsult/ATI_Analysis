---
name: implementation-rectify
description: Audit and repair how implementations are wired — accountable communities and evidence links. Two entry points. From a Community of Practice, walk its indicator stakes and fix accountable_community coverage. From a YearSuccessEvidence, find implementations that SHOULD evidence the indicator and do not. Proposes; writes only on approval. Triggered by "rectify", "implementation-rectify", "audit community accountability", "what implementations are we missing on 7.3", "is anything unwired".
---

# Implementation rectify — find the wiring that should exist

Two questions, one skill, because both are the same defect seen from different ends:
work exists in the graph but is not connected to the thing it answers for.

- **CoP mode** — start at a Community of Practice, walk its indicator stakes, and
  fix `accountable_community` on the implementations underneath.
- **YSE mode** — start at a YearSuccessEvidence, and find implementations that
  should carry `is_evidence_for` to it but do not.

Both modes PROPOSE. Nothing is written until the user approves, because both are
judgment about meaning, not shape, and a wrong edge is worse than a missing one:
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

# Writing (both modes)

Present every bucket and STOP. On approval:

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

# Feedback

Counts per bucket, then what is worth acting on beyond the edges:

- **Ownerless work** — for most undecidable items the fix is naming an owner, not
  guessing a community. Say so rather than proposing a community anyway.
- **Stakes or indicators with no implementations at all** — a coverage gap or a
  stake that should not exist. Say which you think it is.
- **Coverage moved** — how many were wired before, how many after.
