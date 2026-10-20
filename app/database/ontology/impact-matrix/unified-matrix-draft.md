# Unified procurement impact matrix: working draft

Status: draft, started 2026-10-14, matrix rewritten as version 2 on 2026-10-16. For the
three SFBRN campuses (CSUEB, SFSU, SSU). Each rule in the matrix carries a decision state:
agreed by the working group, required by law or policy, proposed, or to be calibrated.
Every point where the current approaches disagree is listed in the conflict register, and
the last section states what the finished matrix must satisfy to be coherent.

## Purpose

One matrix, used the same way at all three campuses, for every ICT acquisition
regardless of how it is bought. It answers two questions in order:

1. How much does this product matter to the people who will use it? (impact)
2. Given what we know about its accessibility, what must happen before it is approved?
   (risk, and the review that follows)

It must give the same answer for the same facts, whichever reviewer applies it. It must
leave a record of the facts and the reasoning, so the determination can be checked later.

Alternate access plans (TAAPs) are out of scope for this draft. The matrix decides when
a plan is needed. How the plan is written is a separate piece of work.

## Sources combined

| Short name | Source | Form |
|---|---|---|
| CSUEB | The CSUEB VPAT Analysis Tool (`impact-matrix.md`) | Scored checklist, five dimensions |
| SFSU | SFSU "Determining Impact of a Technology Acquisition", adapted from the CSU ATI Prioritization Framework | Seven qualitative criteria per level |
| SFBRN | SFBRN "IT Accessibility Review Procedure (P2P)" v1.0, 7.13.2026 | Risk rules with a user threshold |
| SSU | SSU "Accessible Software/Web Service Procurement" page | Narrative, no thresholds |

The indicators this serves: 1.3-pro (determine impact from a matrix or criteria),
1.4-pro (decide the level of 508 evaluation), 1.12-pro (a risk-informed process for every
acquisition channel), and 8.12-pro (one process regardless of method or system).

## From the Procurement Working Group, 10/14/2026

Source: the meeting minutes "Procurement Working Group 10/14". Items are split into what
the group agreed on the call and what was raised without a decision.

### Agreed

1. **One matrix for all three campuses.** The logic of the CSUEB tool is extracted,
   agreed by the group, and used at every campus. SSU and SFSU reviewers have no formal
   tool today.
2. **The standard is WCAG 2.1 Level AA,** as the Title II rule requires. Reviewers check
   success criteria against WCAG 2.1, not 2.0. This settles C-11 for software and web
   content. (The minutes call Section 508 "not itself a law". Section 508 is a section of
   the Rehabilitation Act and binds federal agencies; California law adopts its standard,
   which incorporates WCAG 2.0 AA. The conclusion, WCAG 2.1 AA, is unaffected.)
3. **Four review outcomes:** approve, manual review, TAP, deny.
   - Manual review returns a recommendation. The reviewer who owns the requisition makes
     the decision.
   - Deny stays a real option, mainly where a small purchase has accessible alternatives,
     and must be defensible when challenged.
   - A fifth case was named: a product so inaccessible that no TAP can cover it, which
     leads to deny. The group wants the matrix, not case-by-case judgment, to decide
     between "a TAP is enough" and "deny", using factors such as how many people depend
     on the product.
4. **The TAP threshold.** A TAP is warranted when a barrier blocks completing a task, not
   when a product is merely unpleasant to use. A working alternative channel offered by
   the vendor, such as support chat that completes the same task, weighs against a TAP.
5. **"ACR", not "VPAT".** The VPAT is the blank template. The ACR is the vendor's
   completed report, and it is what gets reviewed.
6. **More kinds of evidence.** Beyond the ACR: testing by the ATI team, and live vendor
   demonstrations. Neither has been used formally; both are to be written into the
   process.
7. **Missing ACRs** already follow an agreed request template and escalation timing
   (SLA), now extended to all three campuses.
8. **Home campus first.** A reviewer helping another campus loops in that campus before
   starting a TAP, because the stakeholders and context are local.

### Raised, not decided

- **Requesters game the intake.** Some requesters report "one user" for products used by a
  whole class or department, to avoid review. Both SSU and CSUEB see this repeatedly.
  Reviewers can override an answer, which helps but does not remove the incentive.
- **Whether requesters see the impact analysis.** CSUEB now attaches it to the P2P ticket
  so the requester sees how the level was reached. The working view is that the intake
  form should not reveal the decision logic, and the completed analysis may be shown
  afterwards.
- **Content types.** The CSUEB tool was built for software. It has no rules for non-web
  documents, and the matrix should cover web pages, software, public-facing electronic
  content, official communications and non-web documents.
- **What "Partially Supports" should trigger.** Recognised as a source of inconsistency
  between reviewers and deferred.
- **Vendor remediation dates.** A tracked date by which the vendor commits to fix barriers
  belongs inside the TAP outcome; no mechanism yet.
- **Looking back.** Re-review past TAP decisions to converge reviewer judgment ("putting
  our pendulum in the middle"), and separately check that issued TAPs are working in
  practice. A lack of complaints is not evidence that an alternative works.
- **Who meets the barrier.** In the Gradescope case, the barriers sit mostly on the
  faculty-facing side, not the student-facing side. The level of response depends on
  which users meet the barrier, not only on how many users the product has.

### What this changes in the draft

- **Stage 3 outcomes** map to the four agreed outcomes: "Approve" and "approve with
  barriers noted" are approve; "validate the claims" and "reviewer decides" are manual
  review; "Plan" is TAP; "look for a more accessible alternative product" becomes an
  explicit choice between TAP and deny, decided by the matrix.
- **Stage 2 evidence quality** gains vendor live demonstrations at E2 and ATI team testing
  at E3.
- **Stage 2 severity** is judged per user role, so a barrier on a faculty-only screen and a
  barrier on the student path are rated separately against the people who meet each.
  S2 and S3 follow the agreed threshold: S3 means a task cannot be completed and no
  working alternative channel exists.
- **Stage 1 needs a content-type dimension** (software, web page, public-facing electronic
  content, official communication, non-web document), because the rules differ by type.
- **Stage 1 answers must be checkable.** Where possible the matrix relies on facts the
  reviewer can confirm from the requisition (license quantity, course use, whether access
  is behind single sign-on) rather than the requester's estimate alone. The record keeps
  both the requester's answer and the reviewer's, so an override is visible.
- **"VPAT" becomes "ACR"** wherever the draft means the vendor's completed report.

## DRAFT matrix

Version 2, 2026-10-16. Rewritten from the working group meeting of 10/14/2026, the
grounding review (`matrix-grounding-review.md`) and the governance and principles added to
the graph on 2026-10-16. For discussion. Every rule carries a decision state, so a reader
can see which rules are fixed and which are still choices.

| State | Meaning |
|---|---|
| **Agreed** | Decided by the Procurement Working Group on 10/14/2026. |
| **Required** | Follows from law or CSU policy. The matrix cannot choose otherwise. The source is named. |
| **Proposed** | A design choice recommended from the research. The working group has not decided it. |
| **Calibrate** | A number or term to be set by the pilot. No principle or law picks it. |

The Grounds column names the principles each rule carries out, by handle without the
`principle:` prefix.

### Step 0. Kind of technology and governing standard

The reviewer records what is being bought before rating anything. The kind of
technology sets the standard and the evidence that can count.

| Kind | Governing law | Standard | When it cannot conform | State |
|---|---|---|---|---|
| Web content, web application, mobile app | Title II (28 CFR 35 subpart H); Section 504; Gov Code 7405 | WCAG 2.1 AA | A TAAP stands only with a written determination by the president or designee (28 CFR 35.204) | Standard **Agreed**; law **Required** |
| Non-web software, hardware, kiosk | Section 508 through Gov Code 7405; Title II and 504 general rules | 508 Standards: WCAG 2.0 AA for content, Chapters 4 and 5, Chapter 3 functional performance criteria | Best-meets record (508 E202.7) with market research, plus a TAAP | **Required** |
| A product with both (for example a desktop client and a web portal) | Title II governs the web and mobile use | WCAG 2.1 AA for that use | As for web | **Required** (CSU 2026 Title II Update) |

- Each interface is reviewed on its own: public, student, instructor, administrative,
  and each platform (web, iOS, Android). **Required** (CSU procurement Step 2 asks for
  ACRs covering every interface). Grounds: `duty-runs-through-contracts`.
- An alternate version of web content is acceptable only where direct access is not
  possible for technical or legal reasons. **Required** (28 CFR 35.202). Grounds:
  `program-viewed-in-its-entirety`.

### Step 1. Exposure

Renamed from "impact". **Proposed.** In 28 CFR 35.205, "impact" means the effect of a
barrier on a person. This step measures how widely and how necessarily a product is used,
which is a different quantity.

**What exposure decides.** Exposure sets how deep the review goes, how strong the
evidence must be, who approves an exception, and how long it lasts. It never decides
whether access is owed, and it never produces an outcome alone. **Required** (Title II and
Section 504 set no threshold of users or exposure; OCR's 2011 FAQ applies the duty to
pilots and to classes with no student known to have a disability). Grounds:
`exposure-sets-scrutiny-not-entitlement`, `program-accessibility-as-proactive-duty`.

#### Floors

A floor is a single fact that sets a minimum level by itself. Floors are applied first.
They only raise the level. Each is written as a fact a reviewer can confirm.

| Fact | Minimum level | State | Grounds |
|---|---|---|---|
| Required of students for coursework or a grade | High | Proposed | `exposure-sets-scrutiny-not-entitlement`, `equally-effective-access` |
| The only route to a university service (enrollment, financial aid, payment, housing) | High | Proposed | `equally-effective-access` |
| Campus-wide, or all sections of a course in a curriculum | High | Proposed | `exposure-sets-scrutiny-not-entitlement` |
| A person with a disability is known to be in the user group, or an accommodation request about the product is open | High | Proposed | `parallel-duties-conformance-and-accommodation` |
| A prior accessibility complaint about the product | High | Proposed | `deference-earned-through-documented-process` |
| Required for a job duty, or used in hiring (an applicant portal counts as public) | Medium | Proposed | `audience-determines-governing-duty` |
| Open to the public without single sign-on, publishes content to the public, or sits in a public space such as an open kiosk | Medium | Proposed | `exposure-sets-scrutiny-not-entitlement` |

Knowing that no person with a disability is in the user group never lowers the level.
**Required** (OCR 2011 FAQ).

#### Groups

Products that no floor sets to High are placed by four groups. Each group combines
factors that describe the same fact, so nothing is counted twice. A group takes the
highest level among its factors.

| Group | Factor | Low | Medium | High |
|---|---|---|---|---|
| Reach | Users (confirmed count, all groups) | Up to 25 | 26 to 250 | More than 250 |
| | Scope | One department, organization or course | Several, or a planned expansion | Campus-wide (also a floor) |
| Stakes | Required use | Optional | Required for a few identified people for a limited task | Required for coursework, a job duty or a university service (also floors) |
| | Program criticality | Optional program or service | Important, not critical | Critical, or a core academic or business function |
| Spread | Content it publishes | None | For specific, limited audiences | For the public or a large or required audience |
| Duration | Frequency of use | Occasional or one-time | Recurring, such as weekly or each term | Daily or routine |
| | Contract length | Single purchase or one year | Two to three years | More than three years, or an enterprise agreement |

- Merging factors into groups. **Proposed.** Grounds: `same-facts-same-answer` (the
  multi-criteria manual forbids counting one effect twice).
- User cut points (25 and 250). **Calibrate.** The previous draft used 5 and 25, far
  below every peer model. The required-use floors catch small required cases.
- Group weights, set by swing weighting with reviewers from each campus. **Calibrate.**
- Reading the score. Each group scores Low 0, Medium 1, High 2. The weighted total is
  read as a percent of the possible total. **Proposed.** Bands: Low under 25 percent,
  Medium 25 to under 55 percent, High 55 percent and above. **Calibrate.**
- A decision table runs beside the points in the pilot: High if any floor applies or two
  groups are High; Low if every group is Low except at most one Medium; Medium otherwise.
  The one that agrees better with the expert panel is kept. **Proposed.** Grounds:
  `same-facts-same-answer`.
- No likelihood axis. Exposure is not multiplied by a probability of harm. **Proposed.**
  Grounds: `prioritization-by-impact`, as contested by Cox, Thomas et al. and Krisper.

#### How answers are handled

- The requester's answer and the reviewer's answer are both recorded, so an override is
  visible. A reviewer may raise a level with a reason. Lowering a level needs a second
  approver. **Proposed** (raised 10/14: requesters report "one user" for class-wide
  products). Grounds: `same-facts-same-answer`, `deference-earned-through-documented-process`.
- An answer nobody can give is scored twice, once as High and once left out. If the two
  results fall in different bands, the outcome is "request information". Every record
  carries the count of unknowns. **Proposed.** Rating unknowns high follows from the
  institution's burden of proof. **Required** (28 CFR 35.164, 35.205). Grounds:
  `deference-earned-through-documented-process`.
- A product bought solely as one person's accommodation goes to the accommodation
  process, and its compatibility with the person's other tools is checked. **Proposed**
  (the SFBRN procedure does this today). Grounds:
  `parallel-duties-conformance-and-accommodation`.
- Left out of exposure: negative points for Low answers, data sensitivity, and cost.
  Data sensitivity belongs to the security review. Cost is not a basis for an exception
  (CSU reads high cost alone as no undue burden). **Proposed.**

### Step 2. Barrier severity and evidence

#### Severity

Severity is judged by what a person can do, using the tests in 28 CFR 35.205: the same
information, interactions and transactions, with substantially equivalent timeliness,
privacy, independence and ease of use. The WCAG criterion is the evidence, not the
verdict. **Required** (35.205; CSU Defenses page). Grounds: `equally-effective-access`,
`conformance-to-an-external-technical-standard` (as contested by Treviranus and Floe:
conformance is not proof of access).

| Level | Definition | GSA vendor label |
|---|---|---|
| S0 | No effect on information, interactions, transactions or participation. Equal timeliness, privacy, independence and ease of use. | none |
| S1 | Minimal impact, demonstrated. The four 35.205 tests are documented as met. | Minor |
| S2 | An essential function can be performed independently, with clearly unequal time or effort. | Major |
| S3 | A person in that role cannot perform an essential function independently, or only with another person's help. | Critical |

- The TAAP threshold is a barrier that blocks an essential function, which is S3. **Agreed.** Grounds:
  `proportionate-remedy`.
- A vendor's alternative channel weighs against a TAAP. **Agreed, narrowed by law.** The
  channel counts only when it is equally effective: it performs the same function, at the
  same time, independently and privately. A channel that needs staff to perform the
  function for the person counts as assistance and leaves the severity at S3.
  **Required** (35.205; CSU reads minimal impact as failing when users must rely on
  assistance, alternate processes or workarounds). Grounds: `equally-effective-access`.
- An alternative method inside the product that gives equal or greater access is
  equivalent facilitation and can support S0 or S1. **Required** (28 CFR 35.203).
- "Not a core feature" is not enough for S1. S1 needs the documented 35.205 finding.
  **Required** (the institution bears the burden of showing minimal impact).
- Severity is rated per role (students, employees, applicants, the public) and per
  functional group (the nine 508 functional performance criteria). The worst cell sets
  the role's severity. **Proposed** (raised 10/14: in Gradescope the barriers sit on the
  faculty side). Grounds: `audience-determines-governing-duty`.
- Essential functions are listed per role before anyone tests, and each is judged as a complete
  process: a barrier at any step affects the whole function. **Proposed** (WCAG-EM 2.0).
- A failure of WCAG 1.4.2, 2.1.2, 2.2.2 or 2.3.1 is at least S2 wherever it occurs, and
  S3 when it traps the user or risks harm, such as a keyboard trap or flashing content.
  **Required** (WCAG conformance requirement 5, non-interference).
- "Partially Supports" is never S0. It is S1 or S2 by whether an essential function is touched,
  and S3 when an essential function is blocked. **Proposed** (deferred on 10/14 as a source of
  inconsistency).

#### Evidence

"ACR", not "VPAT". **Agreed.** ATI team testing and live vendor demonstrations count as
evidence. **Agreed.**

| Level | What it holds | State |
|---|---|---|
| E0 | Nothing, or marketing statements | Proposed |
| E1- | A vendor ACR that fails a quality check below | Proposed |
| E1 | A vendor ACR that passes every quality check | Proposed |
| E1+ | E1 plus GSA's issue-level supplement (severity, affected group, workaround) | Proposed |
| E2a | A live vendor demonstration of each role's essential functions with assistive technology | Agreed (demonstrations); level Proposed |
| E2b | A third-party audit that names its method (Trusted Tester, ICT Testing Baseline, WCAG-EM) | Proposed |
| E3 | ATI team testing of each role's essential functions by a named method | Agreed (ATI testing); level Proposed |

Grounds for the ladder: `vendor-claims-require-proportionate-validation`,
`same-facts-same-answer`.

ACR quality checks. A failure drops the ACR to E1-. **Proposed.**

1. The edition reports WCAG 2.0 only (the 508 edition) for a web or mobile product.
   Require the WCAG or International edition, which follows from the agreed standard.
2. No month and year, no product version, or a different version from the one bought.
3. Older than two years or than the last major release. Age limit **Calibrate.**
4. No evaluation methods: no split of manual, automated and assistive technology
   testing, no tools named.
5. "Partially Supports" or "Does Not Support" without remarks.
6. Only "Supports" throughout, or on complex criteria without remarks.
7. "Not Evaluated" outside the AAA table.
8. The ACR does not cover every interface or platform being bought.

Evidence limits the outcome. **Proposed.** Grounds:
`vendor-claims-require-proportionate-validation`.

- E0 or E1- never supports Approve at Medium or High exposure.
- E1 never supports Approve at High exposure.
- An S1 finding needs E2 or better.

### Step 3. Outcome

#### The outcomes

The four agreed outcomes are approve, manual review, TAAP and deny. **Agreed.** This draft
gives approve two forms.

| Outcome | Meaning | State |
|---|---|---|
| Approve | No known barrier on any role's path | Agreed |
| Approve with barrier record | Known S1 or S2 barriers. The record holds notice to users where they meet the product, the vendor's remediation commitment with dates in the contract, and a review date. | Proposed (two-tier answer to the 4.6-pro tension, below) |
| TAAP | S3 on an essential function, with an alternative that meets every TAAP test below | Agreed |
| Deny | S3 where a TAAP cannot meet its tests, or a more accessible product meets the need | Agreed |
| Manual review | Not an answer about the barrier. It routes uncertainty: unknown severity, evidence below the limit, a boundary score, or a claimed exception. It returns a recommendation, and the reviewer who owns the requisition decides. | Agreed (recommendation only); routing role Proposed |

**The 4.6-pro tension.** Indicator 4.6-pro's Established bar and the ATI policy call for a
plan whenever a product with known barriers is approved. The CSU TAAP template and the
agreed threshold reserve a TAAP for blocking barriers. The barrier record satisfies the
first without stretching the TAAP. **Proposed.** Grounds:
`time-bound-alternative-when-not-conformant`, `proportionate-remedy`,
`notice-as-part-of-access`.

#### Routing before the grid

| Condition | Route | State |
|---|---|---|
| Severity unknown (no ACR, demonstration or testing) | Request evidence. At High exposure, treat as S3, marked provisional, until evidence arrives. | Proposed |
| Evidence below the limit for the exposure level | Manual review | Proposed |
| One answer moved one level would change the result | Second reviewer | Proposed |
| A claim that conforming is too costly or would change the program | To the president or a designee with budget authority, in writing | Required (28 CFR 35.164, 35.204) |
| The reviewer is helping another campus | Bring in the home campus before starting a TAAP | Agreed |

#### The grid

Rows are exposure. Columns are the worst severity on any role's essential functions.

| Exposure | S0 | S1 | S2 | S3 |
|---|---|---|---|---|
| **Low** | Approve | Approve with barrier record | Approve with barrier record | TAAP. Deny if a more accessible product meets the need. |
| **Medium** | Approve | Approve with barrier record | Approve with barrier record; vendor remediation date required | TAAP. Deny if a more accessible product meets the need. |
| **High** | Approve once claims are validated (E2 or better) | Approve with barrier record (E2 or better) | Approve with barrier record (E2 or better); vendor remediation date within one year | TAAP only if the plan serves every affected person from the first day of use, with a 35.204 determination (web) or a best-meets record (non-web). Otherwise deny. |

How the grid answers the agreed questions:

- Exposure enters the choice between TAAP and deny through the plan's feasibility. An
  alternative that must reach every affected person from the first day is harder to
  provide at High exposure, so more High cases end in deny. **Agreed** (the group wanted
  the matrix, using how many people depend on the product, to decide TAAP or deny).
  Grounds: `equally-effective-access`, `bounded-duty-burden-limits`.
- S3 on an essential function is never Approve, at any exposure. **Proposed.** Grounds:
  `program-accessibility-as-proactive-duty`, `exposure-sets-scrutiny-not-entitlement`.
- Deny is chosen when a more accessible product meets the need, at any exposure. Where
  nothing on the market conforms, the path is a best-meets record and a TAAP.
  **Required** for non-web technology (508 E202.7; CSU procurement Step 1). Grounds:
  `most-accessible-product-that-meets-the-need`, `universal-design-over-accommodation`.
- S2 never requires a TAAP, because it does not block an essential function. Exposure raises the
  evidence and the vendor commitment instead. **Agreed** (the TAAP threshold).

#### Rules that hold in every cell

- **A TAAP passes every test, or it is not a TAAP.** It gives access from the first day
  of use; gives the same information, interactions and functions; allows independent use
  where the product does, in the same setting where possible; names an owner, the steps,
  the response time, how users learn of it and how they report a barrier; carries the
  vendor's remediation commitment with dates; and states why a more accessible product
  was not chosen. **Required** (28 CFR 35.130, 35.160; 34 CFR 104.4; EO 1111). Grounds:
  `equally-effective-access`, `time-bound-alternative-when-not-conformant`.
- **A TAAP respects each person's request.** Each person's own request for an aid gets
  primary consideration, and a person may decline an accommodation. **Required** (28 CFR
  35.160(b)(2), 35.130(e)). Grounds: `parallel-duties-conformance-and-accommodation`.
- **A TAAP is not compliance.** **Required** (TAAP template 3.3; 28 CFR 35.202). Grounds:
  `time-bound-alternative-when-not-conformant`.
- **A denial gives its reasons.** It states the findings, the threshold applied, and the
  campus route to reconsideration. **Required** (CSU procurement Step 3). Grounds:
  `deference-earned-through-documented-process`.
- **Approval never ends the accommodation duty.** A person who meets a barrier in an
  approved product is still accommodated. **Required** (28 CFR 35.160). Grounds:
  `parallel-duties-conformance-and-accommodation`.
- **Notice where users meet the product.** Every barrier record and TAAP tells users of
  the barrier, the way around it and a named contact, and tells the offices that support
  them. **Proposed.** Grounds: `notice-as-part-of-access`.

#### Approver and term

Who approves and how long a determination lasts scale with exposure. **Proposed.**
Grounds: `shared-responsibility-requiring-coordination`, `closest-to-capacity`,
`time-bound-alternative-when-not-conformant`.

| Exposure | Approves a barrier record or TAAP | Determination expires |
|---|---|---|
| Low | ATI coordinator | 3 years |
| Medium | ATI coordinator and department head | 2 years |
| High | Division vice president or designee | 1 year |

- The terms. **Calibrate.**
- A renewal, a major new version, a change in who uses the product or how, or a
  complaint calls for a new determination before the term ends. **Proposed.**
- A TAAP is reviewed at least once a year at renewal. **Required** (CSU TAAP guidance).
- Who signs, and through which system, may differ by campus. The levels, thresholds and
  outcomes may not. **Proposed.** Grounds: `local-adaptation-flexibility`.

#### Contract terms

| Term | Applies to | State |
|---|---|---|
| CSU General Provisions for IT Acquisitions, clause 45 | Every approval | Required (CSU procurement Step 4) |
| The vendor responds to and resolves accessibility complaints | Every approval | Required (Gov Code 7405(b)) |
| Conformance warranty; no loss of conformance on upgrade or configuration; right to test before acceptance | Barrier records and TAAPs | Proposed |
| Acknowledge a reported defect within 7 days; fix critical defects within 30 to 90 days or provide an interim accommodation | Barrier records and TAAPs | Proposed; day counts **Calibrate** |
| A dated remediation roadmap; termination without penalty after a missed window | Barrier records and TAAPs | Proposed |

Grounds: `vendor-leverage-procurement-as-accessibility-lever`, `duty-runs-through-contracts`.

### Step 4. The record

Every determination records the following, including low-exposure approvals. **Required**
for the 1.3-pro and 1.12-pro output bars; the list is **Proposed**. Grounds:
`deference-earned-through-documented-process`, `same-facts-same-answer`.

- Kind of technology, interfaces and platforms, and the governing standard.
- Each exposure fact as the requester answered it and as the reviewer confirmed it; any
  floor that applied; the group scores; the count of unknowns.
- Essential functions per role; severity per role and functional group.
- Evidence level; ACR date, edition and version; the quality checks it failed.
- Products compared, and the best-meets basis where used.
- Outcome; contract terms included; approver name and title; date.
- Expiry date and review triggers.
- The matrix version used.

A TAAP links back to the determination that required it. Records are counted for
8.9-pro (reviews) and 8.10-pro (plans).

### What changed from version 1

- "Impact" became "Exposure", and exposure no longer decides an outcome alone.
- A Step 0 picks the standard by kind of technology.
- "Highest level wins" became floors first, then four merged groups.
- User cuts moved from 5 and 25 to 25 and 250, marked Calibrate.
- Severity is defined by the 35.205 tests. S? left the grid and became a routing rule.
- The vendor alternative channel counts only when it is equally effective.
- The evidence ladder gained E1-, E1+ and two E2 forms, with eight ACR quality checks.
- Approve gained a second form, the barrier record. S3 is never Approve.
- TAAP or deny turns on whether the plan can serve every affected person from the
  first day, and on whether a more accessible product exists.
- Approver and expiry scale with exposure. Contract terms follow the outcome.

The sections below, from "Principles that constrain the design" to the conflict register,
record the reasoning behind version 1. Where they differ from version 2, version 2
governs.

## Principles that constrain the design

- `principle:prioritization-by-impact`: review effort goes where the impact is greatest.
  This is the reason the matrix exists.
- `principle:proportionate-remedy`: the weight of the response follows the severity of
  the barrier. The matrix must therefore see the barrier, not only the audience.
- `principle:audience-determines-governing-duty`: students and the public fall under
  Title II and Section 504; employees and applicants under Title I and Section 504. The
  matrix records who the users are, because that decides which duty applies.
- `principle:equally-effective-access`: required use removes the user's choice, so a
  barrier in a required product denies the same result to the person who meets it.
- `principle:conformance-to-an-external-technical-standard`: barriers are judged against
  the published standard, not against a reviewer's sense of "accessible enough".
- `principle:deference-earned-through-documented-process`: a determination is defensible
  only when the record shows what was considered. The matrix must keep its inputs and
  reasoning.
- `principle:vendor-leverage-procurement-as-accessibility-lever`: the review is also the
  point where the institution asks the vendor for evidence and commitments.

## The risk problem

The four sources use "impact" and "risk" for different things, and one of them merges two
separate quantities into one level. This is the main source of inconsistency, so the draft
separates them before defining anything else.

### What each source means

- **CSUEB** uses "impact" for how much the product matters: audience, access, legal
  exposure, use and location. It does not read the VPAT. Barrier information enters only
  through the Access row, which the reviewer answers from the VPAT by hand.
- **SFSU** uses "impact" for the same idea, but its criteria also include accommodation
  cost, how often barriers recur, and the likelihood of affecting people with
  disabilities. Those three depend on the barriers, so SFSU's "impact" already mixes in
  some barrier severity.
- **SFBRN** uses "risk" and decides it from user count, required use, public exposure and
  critical function. It also lets "a current VPAT demonstrating strong accessibility"
  make a product low risk. So SFBRN's single level combines audience and conformance
  evidence.
- **SSU** uses "risk" based mainly on user count, with "no hard number".
- **The TAAP form** uses "Institutional Risk" for something else again: the risk that
  remains after an alternative is written, graded from the six legal requirements. It is
  named here only so it is not confused with the two quantities below.

### Why merging them causes errors

A single level that combines "how much it matters" with "how accessible it looks" has
three faults.

1. **The evidence lowers the scrutiny of itself.** A VPAT is a vendor's self-report.
   1.8-pro asks campuses to validate those claims. If a strong VPAT lowers the level, a
   high-exposure product with a favourable self-report gets less validation, which is the
   case where validation matters most.
2. **The level changes when the evidence changes, although the use did not.** A
   campus-wide required product is high impact whether or not the vendor has sent a VPAT.
   Under a merged level it moves from low to high the day a VPAT arrives that is worse
   than expected.
3. **The same product rates differently at different campuses** depending on which
   reviewer has seen which document, which is the inconsistency 8.12-pro asks campuses to
   remove.

### Proposal: three named quantities

| Quantity | Question | Known when | Inputs |
|---|---|---|---|
| **Impact** | How much does this product matter to the people who use it? | At intake, before any VPAT | Audience, scale, required use, criticality, public exposure, content it publishes, scope |
| **Barrier severity** | How accessible is it, and how sure are we? | After the conformance review | ACR or VPAT findings, whether barriers hit core functions, whether the claims were validated |
| **Risk** | What must happen before approval? | After both | Impact combined with barrier severity |

Impact decides how hard to look (1.4-pro). Risk decides what happens (approve, approve
with conditions, require an alternate access plan, or seek another product). The TAAP's
"Institutional Risk" stays a property of the plan and is not part of this matrix.

## Stage 1: impact

### Dimensions

Each dimension is rated Low, Medium or High. Where a source has no equivalent, the cell
says so. Conflicts are numbered and resolved in the register.

#### I-1. Audience (who uses it)

Multi-select: students, faculty or staff (employees), applicants, the public, a named
individual. Not leveled by itself. It sets the governing duty and feeds I-2 and I-5.

| Sources | CSUEB: faculty, staff, students, public counted separately. SFBRN: "students, faculty, staff, and/or the public". SFSU, SSU: implied. |
|---|---|

#### I-2. Number of users

| Level | Proposal | CSUEB | SFBRN | SFSU | SSU |
|---|---|---|---|---|---|
| Low | One person, or a small fixed group (proposed: up to 5) | 0-1 users | 25 or fewer | "small audience" | few users |
| Medium | Up to the High threshold | 2-20 users | not defined | "moderately-sized audience" | not defined |
| High | Above the threshold (see C-1) | 21+ users | more than 25 | "large audience" | "hundreds of students" as an example |

Count every person who must use the product, across all groups. "Not sure" is a valid
answer and is handled by the unknowns rule below.

#### I-3. Required use

| Level | Criterion | Sources |
|---|---|---|
| Low | Optional. Nobody is required to use it for work, study or a service. | CSUEB "use is optional", SFBRN "optional and not required" |
| Medium | Required for a limited, short-term purpose for a small number of identified people | CSUEB "consideration for required academic purposes (if the requirement timeline is short and student users are low)" |
| High | Required to complete coursework, perform job duties, apply for a position, or receive a university service | CSUEB "required for academic purposes"; SFBRN "required for employees, faculty, or students to perform their job duties or complete coursework" |

See C-3 on where employment belongs.

#### I-4. Criticality of the program or service

| Level | Criterion | Sources |
|---|---|---|
| Low | Supports an optional program or service | CSUEB, SFSU |
| Medium | Supports an important but non-critical program or service | CSUEB, SFSU |
| High | Supports a critical program or service, or a core academic or business function | CSUEB, SFSU; SFBRN "critical university business function or academic program" |

#### I-5. Public exposure

| Level | Criterion | Sources |
|---|---|---|
| Low | Used only by university personnel or enrolled students in non-public settings | CSUEB "non public facing" |
| Medium | Has a public-facing component, or is used in semi-public settings such as service offices | CSUEB "public facing component", "semi-public" |
| High | Used by or available to the public | All four |

CSUEB counts public exposure three times, in Audience, Legal exposure and Location. Here
it is one dimension (C-6).

#### I-6. Content the product publishes

| Level | Criterion | Sources |
|---|---|---|
| Low | Publishes or distributes no content | CSUEB |
| Medium | Creates or distributes content used by specific, limited audiences | CSUEB |
| High | Creates or distributes content for the public, or for a large or required audience | CSUEB |

Only CSUEB has this dimension. It is kept because an authoring tool can be used by a few
people and still produce material many people must use. The accessibility of that output
is a separate duty from the accessibility of the tool's own interface.

#### I-7. Scope of deployment

| Level | Criterion | Sources |
|---|---|---|
| Low | One department, organization or course, or one-time instruction | CSUEB |
| Medium | Several departments, organizations or courses, or may be rolled out to a larger audience | CSUEB |
| High | Campus-wide, all sections of a course that is part of a curriculum, or planned campus-wide rollout | CSUEB; SFSU "as usage of a product expands on campus, the determination of impact will change" |

Planned rollout is rated at its planned extent, not its pilot extent (C-8).

#### I-8. Physical setting (hardware, kiosks, shared equipment)

| Level | Criterion | Sources |
|---|---|---|
| Low | Office or restricted area | CSUEB |
| Medium | Classroom, lab, service office | CSUEB |
| High | Public space such as a learning commons, or a kiosk open to anyone | CSUEB |

Applies only when the product has a physical presence. Rated "not applicable" otherwise.

#### I-9. Frequency of use

| Level | Criterion | Sources |
|---|---|---|
| Low | Occasional or one-time use | SFSU "does not create recurring barriers" (adapted) |
| Medium | Recurring, such as weekly or each term | SFSU "occasionally-recurring" |
| High | Daily, or part of a routine task | SFSU "frequently-recurring" |

SFSU frames this as how often barriers recur. Barriers recur when the product is used
often, so the exposure part is how often it is used. That part belongs in Stage 1, and
the barrier part belongs in Stage 2 (C-9).

### Factors that are not dimensions

These appear in the sources as criteria but are derived from other answers or belong to
Stage 2. They are listed so nothing is lost.

| Source criterion | Where it goes | Why |
|---|---|---|
| Legal exposure (CSUEB, SFSU) | Derived from I-1, I-3 and I-5 | It restates audience, required use and public exposure. Rating it separately counts the same facts twice (C-5). |
| Access: does not limit, limits, denies (CSUEB, SFSU) | Stage 2, barrier severity | It is a finding from the conformance review, not a fact about use. |
| Accommodation cost (SFSU) | Stage 2, consequence | It depends on the barriers and the number of people who meet them. |
| Likelihood of impact on persons with disabilities (SFSU) | Stage 2 | It depends on which functions carry barriers. |
| Strong VPAT (SFBRN) | Stage 2 | See "The risk problem". |
| Research use (CSUEB, SFBRN) | Rated through I-2 and I-3 like any other use | See C-7. |

### Special paths

These cases skip or modify the matrix. Each must still be recorded.

| Case | Proposal | Sources and conflict |
|---|---|---|
| The product is assistive technology bought as an individual accommodation | Route through the accommodation process. Check compatibility with the person's other tools. Record the determination as "individual accommodation". | SFBRN low risk, "purchased solely as an individual accommodation". |
| Renewal with no change in scope, users or version | Carry the previous determination forward if it is less than one year old. Re-run the matrix otherwise. | CSUEB rates any renewal without scope change as Low (C-10). |
| Pre-approved product list | Allowed only where the list itself was built with this matrix and is reviewed yearly. | SFSU pre-approved list with IT Security. |
| Systemwide contracts and master agreements | The CO review covers the vendor's evidence. The campus still rates impact for its own use. | 1.9-pro. |
| Free tools, P-card, auxiliary, LTI integrations, products students must buy | Same matrix. The channel never changes the level. | 1.12-pro, 8.12-pro. |

### Combination rule

**Proposal: the highest level wins.**

- Impact is High if any dimension is High.
- Impact is Medium if any dimension is Medium and none is High.
- Impact is Low only if every applicable dimension is Low.

The reviewer may raise the level and must record why. The reviewer may not lower it.
Lowering a level is a policy exception and needs a second approver.

This replaces CSUEB's additive score (C-2). It matches SFBRN's rule that one High factor
makes a product high risk. It is easy to explain to a requester and gives the same answer
for the same facts.

The known cost is that more products rate High. That cost is limited because High impact
means "review fully", not "require a plan". Whether a plan is needed is decided in
Stage 3 from the barriers.

### Unknown answers

A dimension the requester cannot answer is rated at the higher of the plausible levels,
and the matrix generates the question to ask. The determination is marked provisional
until every question is answered. CSUEB does this for "21+ users, not sure", which marks
both Medium and High. SFBRN asks the requester before deciding.

## Stage 2: barrier severity

Rated from the conformance evidence, after Stage 1 has set how deeply to look.

### Evidence quality

| Level | Evidence |
|---|---|
| E0 | No ACR, VPAT or equivalent documentation. Accessibility unknown. |
| E1 | Vendor self-report (VPAT or ACR) not validated |
| E2 | Self-report checked against a demonstration, testing, or a third-party audit |
| E3 | Independently tested by the campus or the CSU |

### Severity

| Level | Finding |
|---|---|
| S0 | Supports all applicable criteria |
| S1 | "Partially supports" or "does not support" on criteria that do not affect core functions |
| S2 | Barriers that make a core function harder but still possible to complete independently |
| S3 | Barriers that prevent a core function for at least one disability group |
| S? | Unknown, because the evidence is E0 |

"Core function" means a task the user must complete to get the product's benefit. The
reviewer names the core functions in the record. CSUEB's Access row maps here: "does not
limit" is S0 or S1, "limits" is S2, "denies" is S3.

The standard is WCAG 2.1 Level AA for software and web content, with the Section 508
functional performance criteria for hardware and closed products (C-11).

## Stage 3: risk and the required response

**Proposal.** Rows are impact; columns are barrier severity. Each cell is the required
response. "Plan" means an alternate access plan is required before approval. The plan's
content is out of scope here.

| Impact | S0 supports | S1 non-core | S2 core, harder | S3 core, blocked | S? unknown |
|---|---|---|---|---|---|
| **Low** | Approve | Approve | Approve, note barriers | Approve, notify requester of barriers and how to get help | Approve. Request an ACR if more than one person will use it. |
| **Medium** | Approve | Approve, note barriers | Reviewer decides, with reasons recorded | Plan | Request an ACR. Plan if none is provided. |
| **High** | Validate the claims (E2 or higher), then approve | Validate, then approve with barriers noted | Plan | Plan; look for a more accessible alternative product | Plan; look for a more accessible alternative product |

The Medium and S2 cell is the only place for reviewer discretion. SFBRN and SFSU both
leave the whole Medium band to discretion; this narrows it to one cell and requires a
recorded reason, so the same facts produce the same answer.

## What every determination records

For `principle:deference-earned-through-documented-process`, and for the 1.3-pro and
1.12-pro output bars:

- The product, vendor, version, requesting unit, requisition or ticket, channel, and date.
- Each Stage 1 answer, and the resulting impact level.
- Any level raised by the reviewer, with the reason.
- The evidence quality level and the documents behind it.
- The severity level and the core functions it was judged against.
- The Stage 3 response.
- The reviewer.
- When the determination must be redone: at renewal, on a change of scope or user count,
  or after one year.

## Conflict register

| # | Conflict | Sources | Direction in this draft |
|---|---|---|---|
| C-1 | The High user threshold | CSUEB 21+; SFBRN more than 25; SFSU and SSU none | One number for all three campuses. Version 2: 25 and 250, to calibrate in the pilot. |
| C-2 | How levels combine | CSUEB additive score (four High selections reach High); SFBRN any one High factor; SFSU and SSU judgment | Version 2: floors first, then four merged groups scored as a percent of the maximum, piloted beside a decision table; reviewer may raise but not lower |
| C-3 | Where required-for-employment sits | CSUEB Medium; SFBRN High | High. Required use removes choice for employees and applicants as it does for students. |
| C-4 | Whether a strong VPAT lowers the level | SFBRN yes; CSUEB and SFSU no | No. Conformance evidence is Stage 2 and cannot lower impact. |
| C-5 | Legal exposure as a rated dimension | CSUEB and SFSU rate it; SFBRN does not | Derive it from audience, required use and public exposure |
| C-6 | Public exposure counted more than once | CSUEB counts it in three rows | One dimension (I-5) |
| C-7 | Research use | CSUEB forces Low unless required for academics, then Medium; SFBRN lists research as a use | No override. Rate research like any use through users and required use. |
| C-8 | Pilot versus planned rollout | CSUEB rates rollout plans; SFSU says impact changes as use expands; SFBRN does not address it | Rate at the planned extent, and redo the determination when scope grows |
| C-9 | Barrier recurrence and accommodation cost | SFSU treats them as impact; others omit them | Frequency of use is impact (I-9). Recurrence of barriers and cost are Stage 2. |
| C-10 | Renewals | CSUEB rates renewal without scope change as Low | Carry the previous determination forward for up to one year; otherwise re-run |
| C-11 | Which standard | SFBRN: WCAG 2.1 AA ("SSU requires 2.1 AA"); the Section 508 standard incorporates WCAG 2.0 AA; the 2024 Title II rule adopts WCAG 2.1 AA for web content and mobile apps | WCAG 2.1 AA across the three campuses, confirmed by the working group 10/14/2026, plus 508 functional performance criteria for hardware |
| C-12 | When a VPAT is required | SFSU: not for Low, required for Medium and High; SFBRN: ask when more than one user; CSUEB: required for academic use, more than one user, or the public | Version 2: requested for every software purchase, as the April 2026 SFBRN email template says the CSU requires. A missing ACR routes to "request evidence", and at High exposure the product is treated as S3 until evidence arrives. |
| C-13 | What happens at Medium | SFSU: reviewer's discretion (the SFSU page still names DPRC, which no longer does this work); SFBRN: discretion and precedent; CSUEB: computed | Version 2: a fixed response in every cell. Manual review handles uncertainty as a routing rule, not as a band of the grid. |
| C-14 | Terms | "Impact" (CSUEB, SFSU), "risk" (SFBRN, SSU), "institutional risk" (TAAP) | Impact, barrier severity and risk as defined above. Institutional risk stays with the TAAP. |
| C-15 | The Low user band | CSUEB 0-1; SFBRN up to 25 | One person or a small fixed group; size to be agreed with C-1 |

## What coherence requires

The finished matrix is coherent when all of the following hold. They are the tests every
later decision about this draft should be checked against.

### The matrix itself

1. **Same facts, same answer.** Two reviewers at two campuses who are given the same facts
   reach the same level and the same response. Every threshold is a stated number, and
   every rule is written down.
2. **Every term is defined once and used one way.** "User", "required", "public", "core
   function", "impact", "barrier severity" and "risk" each have a single definition, and
   that definition is the same in the matrix, the procedure, the intake form, the public
   pages and the graph.
3. **Each fact is counted once.** A fact that drives several conclusions, such as public
   exposure, is asked once and its effects are derived. No dimension restates another.
4. **Exposure and evidence stay separate.** Facts about use set the impact. Conformance
   evidence sets barrier severity. Evidence never lowers the scrutiny applied to itself.
5. **The weight follows the barrier and the people.** A barrier that blocks a core
   function for one disability group in a required or public product outweighs any number
   of minor findings. The rule cannot be satisfied by counting boxes.
6. **Unknowns are explicit.** A missing answer produces a question and a provisional
   level, never a silent default to Low.
7. **Discretion is bounded and recorded.** Where judgment is allowed, the matrix says
   where, and the record says what was decided and why.

### Its place in the process

8. **Every acquisition channel uses it.** Competitive bids, P-cards, auxiliaries, free
   tools, LTI integrations, products students must buy, and systemwide contracts all pass
   through the same matrix. The channel never changes the level.
9. **Intake asks what the matrix needs.** The questions on the purchase request match the
   Stage 1 dimensions one for one, so the reviewer is not reconstructing facts from
   comments.
10. **A determination is a record with a lifespan.** It states when it must be redone:
    at renewal, when users or scope grow, or after a fixed period. A product that spreads
    across campus is re-rated, not grandfathered.
11. **The response follows from the level.** Each combination of impact and severity has
    one response, so what happens next (approve, validate, plan, or seek an alternative) is
    predictable to the requester before they submit.
12. **Downstream documents inherit the determination.** Whatever plan or approval follows
    carries the level and the facts it was based on, so a reader later can see the scale
    of use that was approved.

### Its grounding

13. **It applies the governing duties as they are.** Who the users are decides which law
    governs. The technical standard is the published one the law adopts, applied at the
    version that law names.
14. **It answers the indicators it exists for.** 1.3-pro (impact from a matrix), 1.4-pro
    (level of evaluation), 1.8-pro (validating claims), 1.12-pro (risk-informed, every
    channel), 8.9-pro (number of reviews) and 8.12-pro (one process regardless of system).
    Each of their Established bars should be satisfiable from the records the matrix
    produces.
15. **It traces to the principles.** Each rule can be pointed at the principle it serves,
    and a rule that serves none is a candidate for removal.

### Keeping it coherent

16. **One source of truth.** The matrix is defined in one place, the ontology, and every
    campus page, form and procedure is generated from or checked against it. Three
    campus copies drifting apart is how the current four schemes came about.
17. **It is tested against real cases.** Past requests from each campus, including the 27
    TAAPs, are run through it before adoption. Where its answer differs from the decision
    that was made, either the matrix or the past decision is wrong, and the difference is
    recorded.
18. **Changes are versioned.** Each determination records the matrix version it used, so
    a later revision does not silently change the meaning of past decisions.
