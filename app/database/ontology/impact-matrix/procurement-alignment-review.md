# Procurement impact and TAAP alignment review

Prepared 2026-10-14 from the knowledge graph. This compares the CSUEB impact matrix
(`impact-matrix.md` in this folder) with every procurement implementation in the graph,
their source text, the 27 TAAP records, the TAAP template, and the companion bars for
the procurement success indicators. It is read-only: nothing in the graph was changed.

## What was read

- 56 implementations evidencing a procurement YSE in 2025-2026 or 2026-2027, at CSUEB,
  SFSU and SSU. 29 of them are TAAPs (27 distinct TAAP records, linked twice where they
  evidence both 4.6-pro and 8.10-pro).
- Source text for the impact and review documents: SFSU "Determining Impact of a
  Technology Acquisition" and "Accessible Procurement Process", CSUEB "About ICT
  Purchases", SSU "Accessible Procurement", the SFBRN "IT Accessibility Review Procedure
  (P2P)" v1.0 dated 7.13.2026, the SSU TAAP blank template (form 3.2 051225), and the
  CSUEB EAP.
- The 27 TAAP nodes, field by field.
- Status and companion bars for 1.3-pro, 1.4-pro, 1.12-pro, 4.6-pro, 8.9-pro, 8.10-pro
  and 8.12-pro.
- The principles (`principles_context`).

Pages with no Source Text, so read from title only: the CSUEB VPAT Analysis form itself
(an internal URL), SFSU "Equally Effective Alternate Access Plan (EEAAP)", SFSU
"Procurement of Accessible Technology", the SSU VPAT Guide (Appendix C), and the CSUEB
ATI procurement index.

## Summary

1. **The impact matrix is the answer to 1.3-pro.** The indicator reads "Developed a
   process to determine impact based on the impact matrix/criteria." The graph records
   the matrix as the "CSUEB VPAT Analysis Tool" (Service), evidencing 1.3-pro at CSUEB.
2. **The three campuses use three impact schemes, and the SFBRN procedure that now
   serves all three is a fourth.** They agree on direction and disagree on criteria,
   thresholds and the decision rule. 8.12-pro asks for one consistent process "regardless
   of procurement method or system used", and 1.12-pro asks for a "risk-informed"
   process. Both are Not Started at all three campuses.
3. **The impact determination leaves no record in the graph or on the TAAP.** The
   reviewer's level lives in a P2P comment. The TAAP template has no section for it. The
   1.3-pro Established bar requires that "completed risk assessments are attached to
   purchase documentation and used to prioritize Section 508 evaluations and TAAP
   development." Nothing in the graph can show that today.
4. **"Risk" means two different things.** The SFBRN procedure uses "risk" for the
   pre-purchase impact level that decides whether a TAAP is needed. The TAAP form uses
   "Institutional Risk" for the residual risk after the alternative is written, derived
   from the six-requirement count. The impact matrix and SFSU use "impact" for the first
   meaning. The TAAP has no field for the first meaning at all.
5. **TAAPs are not reaching the offices that carry the accommodation duty.** 25 of 27
   TAAPs are non-equal alternatives, which by the form's own wording "may still require
   supplemental assistance for users". Only 1 of 27 records a copy to Disability
   Services, 1 to Human Resources, and 1 to the IT Help Desk.

## The four impact schemes

| | CSUEB impact matrix | SFSU "Determining Impact" | SFBRN review procedure (P2P) | SSU public page |
|---|---|---|---|---|
| Term | Impact | Impact | Risk | Risk |
| Source | Local tool | CSU ATI Prioritization Framework (cited) | SFBRN procedure v1.0 | SSU IT |
| Levels | Low, Medium, High | Low, Medium, High | Low, Medium, High | Low, then EEAAP |
| User threshold | 21+ users is High | "large audience" | more than 25 users is High | "no hard number" |
| Decision rule | Additive score; four High selections reach High | Guideline; the page says DPRC determines, which is out of date | Any one High factor makes High | Judgment, "err on the side of caution" |
| Medium | Computed | Reviewer's discretion (the page still names DPRC) | Discretion and precedent | Not defined |
| Outcome of High | Follow-up questions | In-depth review and testing | TAAP required before approval | EEAAP |
| Record kept | Printed form, P2P comment | Not stated | P2P comment, canned language | Not stated |

### Criteria each scheme uses

| Criterion | Matrix | SFSU | SFBRN | Notes |
|---|---|---|---|---|
| Number of users | yes | yes | yes | Thresholds differ: 21 and 25. |
| Public facing | yes | yes | yes | |
| Critical program or service | yes, as row headings | yes | yes | |
| Required for coursework | yes | no | yes | |
| Required for employment | yes | no | yes | Matrix and SFBRN agree; SFSU omits it. |
| Access denied or limited | yes | yes | no | SFBRN folds this into the VPAT review instead. |
| Legal exposure | yes | yes | no | |
| Publishes content (authoring) | yes | no | no | Only the matrix catches tools that create content others must use. |
| Rollout scope and location | yes | no | no | |
| Research use | yes | no | yes, as a use | |
| Accommodation cost | no | yes | no | |
| How often the barrier recurs | no | yes | no | |
| Likelihood of affecting people with disabilities | no | yes | no | |
| VPAT quality or conformance | no | no | yes | SFBRN lets a strong VPAT lower the level. |
| Product is itself an accommodation | no | no | yes | |

### Where the matrix is ahead

- **Authoring and publishing.** It is the only scheme that asks whether the product
  publishes material others will use. An authoring tool with a small user count can
  still produce inaccessible content at scale. This bears on
  `principle:universal-design-over-accommodation`.
- **Employment and coursework kept apart.** The matrix separates them, which matches
  `principle:audience-determines-governing-duty`: Title I governs employees and
  applicants, Title II governs students and the public. SFSU's criteria do not mention
  either.
- **Follow-up questions tied to selections.** The matrix turns each finding into the
  question the requester must answer. That is the record the 1.3-pro Output bar asks for,
  if it were kept.

### Where the matrix falls short

- **The additive score does not track severity.** "Denies access" adds the same 16 points
  as any other High selection. "Required for academic purposes" on its own leaves a
  product at Low. Under the SFBRN rule either one makes the product High. The SFBRN rule
  is closer to `principle:proportionate-remedy` and `principle:equally-effective-access`:
  the weight should follow the barrier and the audience, not the count of boxes.
- **It ignores the VPAT.** The matrix rates exposure only. SFBRN combines exposure with
  what the conformance report shows, which is what decides whether a TAAP is needed.
- **It lacks three of SFSU's Prioritization Framework criteria:** accommodation cost,
  how often the barrier recurs, and likelihood of affecting people with disabilities.
- **It has the logic faults listed in `impact-matrix.md`.** The research override does
  not hold, and 2-20 users shows as Low in the printed matrix.

## TAAP documentation

### The template (form 3.2 051225)

1. **No record of why the TAAP was triggered.** The form starts at product information
   and known barriers. It has no place for audience, user count, required use, public
   exposure or the impact level. The trigger lives only in the P2P comment. A reviewer
   reading a signed TAAP a year later cannot see what scale of use it was approved for,
   although the SFBRN low-risk approval language ties approval to "___ maximum users".
2. **Three grades from one count.** Process Outcome, Institutional Risk and Accommodation
   Requirements are all derived from how many of the six legal requirements are met.
   They add no independent information. The Accommodation Requirement mapping is also
   hard to defend: HIGH reads "accommodations required for all users" when zero criteria
   are met, which conflates the plan's quality with the number of affected users.
3. **A copy-paste defect in the Requirements Checklist.** After the six legal
   requirements, the checklist repeats "Saved the document in the ATI Systemwide ACR
   Repository" and "Other" from the distribution section.
4. **Referenced documentation is not captured in the graph.** The form asks for links to
   the ACR, vendor demonstration results, testing results and the vendor roadmap. The
   TAAP node has no fields for them and no edges to them. Only the signed copy is linked.
   The annual review clause depends on these, because it asks whether the vendor made
   "measurable progress", which needs the roadmap to measure against.
5. **The Title II notice overstates scope.** It reads "Title II of the ADA requires all
   ICT ... to be fully accessible." The 2024 Title II rule covers web content and mobile
   apps. The notice's §35.205 reasoning is sound. The first sentence should be checked
   against the Title II rule text before the next template revision.
6. **The name is still in flux.** The form says "Formerly, EEAAP". 4.6-pro and the SSU
   public page still say EEAAP. The SFBRN canned language once calls it a "Technology
   Accessibility Assessment Plan". One name should be used everywhere a requester sees it.
7. **Signers disagree across sources.** The template and the SFBRN procedure route two
   signatures: department chair or manager, and dean or division vice president. The SSU
   public page says the requestor, the Accessibility Services Analyst and IT Leadership
   sign. Neither version has the accessibility reviewer sign, so the record does not show
   who made the accessibility determination.

### The 27 TAAP records

| Finding | Count |
|---|---|
| TAAPs by campus | SSU 25, SFSU 2, CSUEB 0 |
| Non-equal alternative (1-5 requirements met) | 25 |
| Equally effective (all six met) | 2 |
| Signed / awaiting signature / draft | 23 / 2 / 2 |
| Copy sent to Disability Services | 1 |
| Copy sent to Human Resources (ADA coordinators) | 1 |
| Copy sent to IT Help Desk | 1 |
| Statement posted in syllabi | 8 |
| Statement posted where the product is accessed | 26 |
| Saved to the systemwide ACR repository | 23 |
| No review date | 3 (Opendorse, Pearson Revel, Atrium Campus One Card) |
| Review date passed | 3 (Humanity 2026-08-18 and Procare Essentials 2026-08-05, both still "signed"; Vector Solutions Education LMS 2026-07-31, still "draft") |
| No effective date | 9 |
| Vendor contact recorded | 12 |
| No affected user groups checked | 6 |

**Distribution is the largest gap.** 24 of the 25 non-equal plans were not sent to
Disability Services. The form says these plans may need supplemental assistance, and
that office provides it. `principle:parallel-duties-conformance-and-accommodation` holds
that a plan does not discharge the duty to accommodate.
`principle:notice-as-part-of-access` holds that a remedy the affected person cannot find
is not a remedy. A student who hits a barrier contacts Disability Services, which has no
copy of the plan.

**Overdue plans are not changing status.** Two signed plans are past review with no move
to "under review" or "expired". The `taaps_due_for_review` query finds them. Nothing acts
on it.

**CSUEB has no TAAPs in the graph.** Its own EAP process is retired and the SFBRN process
replaced it, but no CSUEB plan has been imported. 8.10-pro (EEAAPs completed) is Not
Started at CSUEB, and 4.6-pro fell from Established to Defined in 2026-2027.

## What the indicators show

| Indicator | Asks for | Status 2026-2027 | Graph evidence | Gap |
|---|---|---|---|---|
| 1.3-pro | Determine impact from a matrix or criteria | CSUEB Established, SFSU Established, SSU Managed | CSUEB matrix; SFSU impact page (on the retired SFSU process and on VPAT/ACR Guidances); SFBRN procedure | The Output bar needs assessments attached to purchase records. None are recorded. |
| 1.4-pro | Decide the level of 508 evaluation | CSUEB Established, SFSU Defined, SSU Managed | One live implementation (CSUEB). SFSU's are retired; SSU has none. | SSU is graded Managed with no live evidence. |
| 1.12-pro | A risk-informed process for every acquisition channel | Not Started at all three | None | The SFBRN procedure answers part of this and is not linked. |
| 4.6-pro | When an alternate access plan is required, roles, distribution | CSUEB Defined, SFSU Established, SSU Managed | SFBRN TAAP Authoring Process; 27 TAAPs | The distribution strategy the indicator names is the weakest part of the records. |
| 8.9-pro | Number of ICT reviews | CSUEB Not Started, SFSU Managed, SSU Established | No implementation | Low-risk approvals leave no record in the graph, so reviews cannot be counted from it. |
| 8.10-pro | Number of EEAAPs completed | CSUEB Not Started, SFSU Managed, SSU Established | 27 TAAPs | CSUEB has none. |
| 8.12-pro | One process regardless of method or system | Not Started at all three | None | Four schemes in use. |

## Recommendations

In order of effect.

1. **Adopt one impact rubric across the three campuses, recorded as an ontology element.**
   Start from the SFBRN procedure, since it is the process in use. Take from the matrix
   the publishing and authoring dimension and the employment and coursework split. Take
   from SFSU the accommodation cost and recurrence criteria. Use a rule where a single
   High factor in access, required use or public exposure makes the product High, instead
   of an additive score. Settle the user threshold: 21 or 25. This answers 1.3-pro,
   1.12-pro and 8.12-pro together.
2. **Record each impact determination, not only TAAPs.** An ICT review record per
   requisition: the product, the requesting unit, the audience, the user count, the
   required-use answers, the level, and the outcome (approved low, approved with TAAP,
   declined). This is the record the 1.3-pro and 1.12-pro Output bars and the 8.9-pro
   count need. A TAAP then links to the review that triggered it.
3. **Add a "Basis for this plan" section to the TAAP template,** carrying the impact
   level and the facts behind it: audience, user count, required use, public exposure.
   Approval should state the scale it covers, as the low-risk approval language already
   does.
4. **Make Disability Services and HR distribution required for every non-equal plan,**
   and record it. Consider requiring it for every plan, since a statement posted at the
   product does not reach the office that handles the accommodation request.
5. **Fix the template defects:** the duplicated checklist items, the three grades derived
   from one count, the Title II scope sentence, and the name. Add the accessibility
   reviewer as a signer, or record the reviewer on the plan.
6. **Capture referenced documentation on the TAAP node,** as edges to the ACR, roadmap
   and testing results, so the annual review can measure vendor progress.
7. **Act on review dates.** Move overdue plans to "under review" or "expired" on a
   schedule, using `taaps_due_for_review`. Humanity and Procare Essentials are overdue now.

## Graph curation found along the way

These are proposals only.

- Import CSUEB's TAAPs, or record that none exist, so 8.10-pro is not silently empty.
- Fill the three missing review dates from the signed forms, and settle the six plans
  with no affected user groups against their PDFs.
- Link the SFBRN IT Accessibility Review Procedure to 1.4-pro, 1.12-pro and 8.12-pro at
  all three campuses. Its text answers part of each.
- Re-check SSU's Managed grades on 1.3-pro and 1.4-pro against their live evidence. 1.4-pro
  has no live implementation at SSU.
- Capture Source Text for the SFSU EEAAP page, the SFSU procurement landing page and the
  SSU VPAT Guide with `/get-source-text`. The CSUEB VPAT Analysis form is internal and
  needs a manual paste, or a link to `impact-matrix.md` instead.
- The four "Humanity" TAAPs for SSU share a title. Confirm they are four requesting units
  and not duplicates. One of them carries the open Nish Malik identity question from the
  people-schema work.
