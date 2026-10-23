# The reviewer in TLA+

`Reviewer.tla` states the review as a state machine and checks it with TLC, the TLA+ model
checker. A state is one review as the analyst has recorded it. The actions are what the
analyst, the vendor and the requesting unit can do next, among them the analyst accepting
an ACR with a report defect, with the reason noted. The outcome of a state is the rule
in `review-matrix.js`, restated in TLA+, and `conformance.js` checks every state TLC reached
against the JavaScript, so the restatement cannot drift from the model without the run
failing.

## Run

```bash
bash app/database/ontology/impact-matrix/tla/run.sh
```

The script regenerates `ReviewerData.tla` from the model's tables, runs TLC over every
state with the invariants and action properties in `Reviewer.cfg`, dumps the states, and
runs the conformance check. It takes about a minute. The run passes when TLC prints
`No error has been found` and the conformance check prints `differences: none`.

TLC comes from the TLA+ Toolbox. The script defaults to the Toolbox on this machine
(`org.lamport.tlatools_1.0.0.201302251534` under the Toolbox's `plugins` folder, TLC
version 2.05). Pass another path as the first argument, or set `TLA_TOOLS`. That TLC runs
on Java 8. The current TLC needs Java 11 or later.

## Files

| File | What it is |
|---|---|
| `Reviewer.tla` | The domain, the rule, the actions, the invariants and the action properties |
| `Reviewer.cfg` | Which claims TLC checks |
| `ReviewerData.tla` | The grid, the floors, the evidence ranks and the TAAP standard, generated. Do not edit |
| `gen-data.js` | Writes `ReviewerData.tla` from `review-matrix.js` |
| `conformance.js` | Rebuilds each dumped state as a review, runs `evaluate`, compares |
| `run.sh` | The whole pipeline |

## What is abstracted

- Exposure is its level, with a flag for open answers that could change it. The scoring
  from the seven answers is not modelled. Open answers are scored high, so answering can
  only keep or lower the level.
- Findings are the worst severity and the breadth level, limited to the pairs a set of
  findings can produce. Accumulation is folded into the severity.
- The ACR record is its three qualifications, the spot check and the analyst's acceptance
  of a report defect. The evidence E1- stands for a vendor ACR with a ticked defect. The record is canonical unless the ACR is clean, since the rule reads
  it only then.
- The TAAP is the count of requirements met, at the values that straddle each standard,
  and the exception claim. The kind of technology, bypasses and the approval conditions
  are left out, since they do not change an outcome.

The state space is 174,080 states and about 5.7 million transitions.

## What is checked

Invariants, one per claim the rubric makes: a clean ACR taken at face value never waits
for stronger evidence, and is approved with no barrier worse than S1 at every exposure;
an approval rests on confirmed evidence; nothing is approved on an ACR below face value
at medium or high; an unknown severity is never confirmed; the fallback re-rates only
when the evidence cannot be raised; at high exposure the TAAP is written on confirmed
evidence or under the fallback; the step a hold names is a step the analyst can take; a
TAAP approval meets the standard or carries a determination; an agreeing spot check
clears every floor.

Action properties, one per step: an agreeing spot check confirms the evidence; a
corrected or accepted ACR taken at face value confirms it; a demonstration, audit or full review
confirms it at every exposure; a contradiction drops the ACR to E1- and records a barrier;
stronger evidence with the same findings never changes a decision already reached, unless
it stood on the fallback; the evidence rank never falls except by a contradiction.

TLC's deadlock check covers every hold: a decision rests as a stuttering step, so any
other state with no action out is reported.

## What is not checked

The explanation prose, the rubric markdown, the Word document and the tester form. Drift
between the rule and its three written descriptions is a text review. The tester's
controls are checked by the Playwright scripts, not here.

## When the rule changes

Change `review-matrix.js`, then run the pipeline. A changed table flows through
`gen-data.js`. A changed rule needs the same change in the `Outcome` block of
`Reviewer.tla`, and the conformance check reports every state where the two disagree
until it is made. A claim that no longer holds is a decision: change the rule back, or
change the claim and say why in the rubric.
