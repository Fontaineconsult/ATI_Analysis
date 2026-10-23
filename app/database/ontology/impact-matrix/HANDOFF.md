# Impact matrix workstream: handoff

Written 2026-10-16 at the end of a working session, so the work can be picked up
elsewhere. Branch: `impact-matrix` (commit `d2df017`, plus this file).

## What this folder is

The SFBRN campuses (CSUEB, SFSU, SSU) are building one accessibility review matrix for
technology purchases. The Procurement Working Group met on 10/14/2026 and agreed the
starting points. Everything since then refines that into version 2.

| File | What it is |
|---|---|
| `impactform.php`, `Impactscript.js` | The old CSU East Bay "VPAT Analysis Tool" |
| `impact-matrix.md` | That tool's logic in prose. Also saved in the graph as a Note on the CSUEB tool's Service node. |
| `impact-matrix-email.html` | Outlook-ready email: the East Bay matrix, a campus comparison, and the **version 1** draft (stale) |
| `procurement-alignment-review.md` | Review of the four current approaches and TAAP documentation gaps |
| `matrix-grounding-review.md` | Research synthesis: law, enforcement, federal practice, peer universities, scoring method, mapped to principles |
| `unified-matrix-draft.md` | The working draft. "## DRAFT matrix" is **version 2**: every rule has a state (Agreed, Required, Proposed, Calibrate) and principle grounds. Later sections are version 1 reasoning; version 2 governs. |
| `unified-matrix-draft.html` | Version 2 as an Outlook-ready page with a copy button (no principle handles) |
| `review-matrix.js` | Version 2 as a plain JavaScript data model. `evaluate(review)` returns a determination; `explain(review)` writes the grade and reasoning for an email. Works in a browser (`<script src>`, global `ReviewMatrix`) and in Node (`require`). |
| `review-matrix-tester.html` | Open from disk. Form built from the model; shows the grade, the reasoning, copy-for-email, the grid and the JSON. |

## Version 2 in one paragraph

Step 0 picks the standard by kind of technology (web and mobile: WCAG 2.1 AA under Title
II; other software and hardware: Section 508 through Gov Code 7405). Step 1 rates
**exposure** (renamed from impact): the user count sets a starting level, six optional
answers score points that lower it, and seven floor facts raise it; exposure sets review depth,
evidence, approver and term, never the outcome alone. Step 2 rates **severity** S0 to S3
by the 28 CFR 35.205 tests, per role and disability group, with an evidence ladder E0 to
E3 and eight ACR report checks. Step 3 gives the outcome: approve, approve with barrier
record, TAAP, deny, or manual review (a routing rule for uncertainty). S3 is never
approve. TAAP or deny turns on whether the plan serves everyone from day one and whether
a more accessible product exists. Approver and expiry scale with exposure.

## Decisions made in the session

- Assume version 2 is adopted for modelling. The model is JavaScript only; **not** in the graph.
- Cases carry an authority: binding (applies directly to the CSU) or persuasive.
  Groundings on binding cases use grounding_kind `binding_precedent`.
- Five new principles: `exposure-sets-scrutiny-not-entitlement`,
  `vendor-claims-require-proportionate-validation`,
  `most-accessible-product-that-meets-the-need`, `duty-runs-through-contracts`,
  `same-facts-same-answer`. Two proposals were folded into existing principles instead.
- Cox, Thomas et al. and Krisper contest `prioritization-by-impact` (the method only).
- Two-tier answer to the 4.6-pro tension: a barrier record for every known barrier, a
  TAAP only for S3.
- The boundary rule flags a case for a second reviewer only when one answer moved one
  level would change the **outcome**, and the outcome still stands.

## Graph state

| Batch file (`app/database/batch/auto-assignments/`) | State |
|---|---|
| `curate_2026_10_14_deprecate_sfsu_dprc_procurement_pages.cypher` | Executed |
| `curate_2026_10_16_governance_impact_matrix_grounding.cypher` | Executed: 10 governance nodes, 15 IntellectualSource nodes, three duplicates consolidated |
| `curate_2026_10_16_principles_impact_matrix.cypher` | **Validated, not executed.** Case.authority, 5 principles, 43 groundings, 3 contested_by. All 41 quotes verified against stored source text. |

Source text was written for 32 sources on 2026-10-16. Not captured: Cox (paywalled) and
Canada's AIA (the page moved to `.../responsible-use-ai/automated-decision-making/algorithmic-impact-assessment.html`).
The Thomas et al. text is letter-spaced from its PDF and should be re-captured.

## Open question when the session ended: is S2 grounded?

Partly. S2 as a category ("task can be completed, but clearly harder") is supported by
GSA (Major), NYU (Significant), Brajnik, the CSU TAAP template and the 10/14 TAAP
threshold. That supports **no TAAP at S2**. The law does not support treating S2 as
acceptable: 35.205 excuses a nonconformance only with "substantially equivalent ...
ease of use", and Section 508 has no minimal-impact defense. S1 is grounded (it is the
documented 35.205 finding).

Recommended, **not yet applied**:

1. Every S2 approval carries a vendor fix date (today only Medium and High do).
2. "Deny if a more accessible product meets the need" applies at S1 and S2, not only S3.
3. The barrier record and the email text say the product does not conform and the
   approval is temporary.
4. Mark the S2 rule "Proposed: CSU policy (proportionality), not law".

Apply to `review-matrix.js` (GRID and `explain`), both draft files, and the tester presets.

## Other open items

- Run the principles batch (the matrix cites four principles that do not exist until it runs).
- `unified-matrix-draft.md` still says boundary means one move changes the "result"; make it "outcome".
- `impact-matrix-email.html` still holds the version 1 draft.
- Calibrate: run past reviews (the 27 TAAPs, East Bay tickets) through the tester.
- Brennon B. decision date (2022-08-04) is confirmed but not set on its Case node.
- `shapes` edges from the new principles: a later pass.

## Rules to keep

- Graph work through neo4j-cli only; writes through batch files and `run_file --execute`
  after approval; read back after every write; `raw_text` never in a batch file.
- Long source text cannot go through `--param` on Windows (argv limit); pipe the Cypher
  over stdin with the text as an escaped literal.
- Prose follows `app/database/ontology/writing-style.md`: no em dashes, one claim per sentence.
