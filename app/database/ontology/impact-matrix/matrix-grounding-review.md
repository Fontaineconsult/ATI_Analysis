# Grounding review for the unified impact matrix

This review tests the draft matrix in `unified-matrix-draft.md` against law, enforcement
history, federal procurement practice, peer universities, scoring method, and the
graph's own Principle nodes. It states what each source requires and what the matrix
should change. Nothing here is adopted. It was compiled on 2026-10-16 from six research
passes:

1. Law: ADA Title II and the 2024 web rule, Section 504, the Revised 508 Standards,
   California statutes, CSU policy.
2. Enforcement: OCR and DOJ resolution agreements, consent decrees and court rulings
   about technology purchases, 2010 to 2026.
3. Federal practice: Section508.gov acquisition guidance, the ACR template, testing
   methods.
4. Peer universities: about 20 institutions, 15 with published criteria.
5. Scoring method: risk-matrix research, multi-criteria decision analysis, rater
   agreement, and Canada's Algorithmic Impact Assessment.
6. The graph: procurement success indicators, governance text, campus source text,
   the 27 TAAP records, and the 22 Principle nodes.

Quotes from regulations were read on Cornell LII and the Federal Register inspection
copy because eCFR blocked automated reads. Check wording against eCFR before quoting it
in a policy document.

## What the research settles

These findings hold across several sources. Each one changes the draft.

1. **Impact does not decide whether access is owed.** Title II, Section 504 and CSU
   policy contain no user-count, criticality or exposure threshold. No resolution
   agreement or ruling excused an inaccessible product because few people used it or
   use was optional. The Kindle cases were pilots of a few dozen devices. Louisiana
   Tech was one instructor's choice of courseware. OCR's 2011 FAQ says planning applies
   when no affected student is enrolled. Impact can set how deep the review goes, how
   strong the evidence must be, and who signs. It cannot make an inaccessible product
   acceptable.
2. **The word "impact" already has a legal meaning.** In 28 CFR 35.205, minimal impact
   means a defect does not affect a person's ability to use the content. It measures
   the effect of a barrier on a user, not how widely a product is used. The draft's
   Stage 1 uses the word for the second meaning.
3. **An alternative is equally effective only when it meets every condition.** The
   conditions are same information, same interactions, same transactions, same time,
   privacy, independence, ease of use, and an integrated setting (35.130, 35.160,
   35.205, 34 CFR 104.4, EO 1111, the 2010 Dear Colleague Letter). An alternative that
   needs a helper fails independence. An alternative that arrives later fails timing.
   An alternative with fewer functions fails the 2011 FAQ test.
4. **A TAAP is not compliance.** TAAP template 3.3 says so. Under 35.202 a conforming
   alternate version is allowed only where technical or legal limits make direct
   access impossible. For web and mobile content, a TAAP alone leaves the campus out
   of conformance unless a 35.204 written determination stands behind it.
5. **Undue burden and fundamental alteration belong to the head of the entity or a
   designee, in writing.** The university carries the burden of proof. CSU reads "all
   resources" as the whole entity's resources and says high cost alone is not enough.
   The Miami consent decree limited the designee to someone with budget authority.
6. **When nothing on the market conforms, buy the product that comes closest and still
   provide alternative access.** This is Section 508's best-meets exception (E202.7),
   the Miami decree (paragraph 50), and the CSU process goal "purchase the most
   accessible product that meets the business needs." Deny fits best when a more
   accessible product meets the need.
7. **Vendor ACRs are claims, and the buyer must check them.** GSA's own 2025 assessment
   calls vendor ACRs "inconsistent or unreliable." Louisiana Tech required testing
   results. Payan v. LACCD required assessment before acquisition. Indicator 1.8-pro
   asks for a process to validate conformance claims.
8. **The Title II deadline is April 26, 2027.** DOJ's interim final rule of 2026-04-20
   moved it from April 24, 2026 and changed nothing else. CSU's own Title II page uses
   the new date. TAAP form 3.2 and the 2024 CSU memo still carry the old one. The HHS
   Section 504 web deadline moved to May 11, 2027.
9. **The standard depends on the kind of technology.** CSU's guidance assigns web
   content and mobile apps to Title II (WCAG 2.1 AA). It assigns non-web software,
   hardware and kiosks to Section 508 through Government Code 7405 (WCAG 2.0 AA,
   Chapters 4 and 5, and the Chapter 3 functional performance criteria). The working
   group's WCAG 2.1 AA decision is right for web and mobile and incomplete for
   hardware.

## Changes to the model

### Stage 0 (new): kind of technology and governing standard

The reviewer records the kind of technology before rating anything: web content,
mobile app, non-web software, hardware or kiosk, electronic document, or a service that
delivers one of these. The kind sets the standard and the evidence that can count.

| Kind | Governing law | Standard | Path when it cannot conform |
|---|---|---|---|
| Web content, mobile app | Title II subpart H; 504; 7405 | WCAG 2.1 AA | 35.204 written determination, plus a TAAP |
| Non-web software, hardware, kiosk | 504 and Title II general rules; 508 via 7405 | 508 Chapters 4 and 5, WCAG 2.0 AA for content, Chapter 3 functional criteria | Best meets (E202.7) with market research, plus a TAAP |
| Both (for example a desktop client and a web portal) | Title II governs the web and mobile use | WCAG 2.1 AA for that use | As for web |

Each interface is reviewed on its own. CSU asks for one ACR per interface (public,
administrative). The Grubhub ACR covered iOS only, and web and Android needed their own.

### Stage 1: rename it and rebuild the scoring

**Rename Stage 1 "Exposure"** (or "Review priority"). This keeps it from being read as
the 35.205 meaning of impact. The matrix states that Stage 1 sets review depth, evidence
required, approver and urgency, and never sets the outcome alone.

**Floors first, points second.** Every well-specified peer model reaches its key
results through category rules, not arithmetic. Scoring research supports the same
design: a floor is a "hurdle" in the UK government's multi-criteria manual, a "veto" in
ELECTRE, and a severity override in the 2019 automotive failure-analysis handbook. Floors
only raise the level. Each floor is written as a fact a reviewer can confirm and is tied
to a legal reason.

Proposed floors:

| Fact | Minimum level | Reason |
|---|---|---|
| Required of students for coursework or a grade | High | Illinois, Ohio State; 504 academic programs; Payan |
| The only route to a university service (enrollment, aid, payment, housing) | High | 35.205 transactions test; CSU "access may be denied" |
| Required for a job duty, or used in hiring | Medium | Title I and FEHA; applicant portals count as public |
| Open to the public, or publishes content to the public | Medium | 35.200; every peer model |
| Campus-wide, or all sections of a course | High | Reach |
| A person with a disability is known to be in the user group, or an accommodation request is open | High | UC Davis; makes the barrier concrete |
| A prior accessibility complaint about the product | High | Michigan |

Knowing that no user with a disability is enrolled never lowers the level (2011 FAQ).

**Points place the products no floor catches.** Four corrections to the earlier sketch:

1. **Merge overlapping factors into groups and score each group once.** Counting one
   fact twice was the East Bay tool's main flaw. The test is whether a rater looks at
   factor X when scoring factor Y. If so, merge them. Proposed groups:
   - Reach: user count and scope.
   - Stakes: required use and program criticality.
   - Spread: content it publishes, and authoring tools whose output reaches others.
   - Duration: frequency of use and contract length.
   Each group takes the highest level among its members.
2. **Derive weights by swing weighting, not by direct rating.** Ask reviewers from each
   campus which group, moved from Low to High, changes the decision most. That group
   gets 100 and the others a share of it. Record the session.
3. **Raise the user cuts.** The draft's 1-5 / 6-25 / more than 25 sits far below every
   peer (Michigan 50/500, UC Davis 100/1,000, Ohio State 500/10,000). With the
   required-use floor in place, small required cases are already caught. A starting
   point to calibrate: up to 25, 26 to 250, more than 250.
4. **Report unknowns instead of hiding them.** Score twice: unknowns as High, and known
   facts only. If the two land in different bands, the result is "request information."
   Every record carries the count of unknowns.

**Run a decision table beside the points during the pilot.** For example: High if any
floor applies or two groups are High; Low if every group is Low except at most one
Medium; otherwise Medium. Keep whichever agrees better with the expert panel.

**Drop:** negative points for Low answers (no peer uses them); physical setting as an
impact factor (it belongs to Stage 0); data sensitivity and cost (peers keep both out
of accessibility impact; UT Austin says cost is not a valid exception basis).

### Stage 2: severity, defined by what the user can do

**Define each level with the 35.205 tests.**

| Level | Definition | GSA vendor label |
|---|---|---|
| S0 | No effect on information, interactions, transactions or participation, with equal timeliness, privacy, independence and ease of use | none |
| S1 | Minimal impact, demonstrated: the four 35.205 tests are documented as met | Minor |
| S2 | A core task can be completed independently, with clearly unequal time or effort | Major |
| S3 | A user in that role cannot complete a core task independently, or only with another person's help | Critical |

Five rules go with the scale:

1. **"Not a core feature" is not enough for S1.** S1 requires the documented 35.205
   finding. The university carries that burden.
2. **Split the draft's "working alternative channel."** An alternative method inside
   the product that gives equal or greater access is equivalent facilitation under
   35.203 and can count toward S0 or S1. A channel outside the product (phone, email,
   staff help) is a mitigation that belongs in a TAAP. It leaves the product's severity
   where it is.
3. **Non-interference failures are at least S2 anywhere.** WCAG conformance
   requirement 5 applies criteria 1.4.2, 2.1.2, 2.2.2 and 2.3.1 to all content, because
   these failures block the rest of the page. A keyboard trap or flashing content is S3.
4. **Core tasks are listed per role before anyone tests.** This follows WCAG-EM 2.0:
   essential functionality is "functionality that, if removed, fundamentally changes
   the use or purpose." A core task is judged as a complete process. A barrier at any
   step affects the whole task.
5. **Rate severity per role and per functional group.** The roles are students,
   employees, applicants and the public. The groups are the nine 508 functional
   performance criteria: without vision, limited vision, without color perception,
   without hearing, limited hearing, without speech, limited manipulation, limited
   reach and strength, limited language or cognitive ability. EN 301 549 Annex B maps
   each requirement to the groups it affects. The worst cell sets the severity for that
   role. The WCAG criterion is the evidence, and the functional group is the impact.
   The TAAP form already records affected groups. The GSA Issue Detail Supplement asks
   vendors for the same field.

**Move S? out of the grid.** An unknown is not a point on the severity scale, and
keeping it as a column breaks the ordering the grid depends on. S? becomes a routing
rule: request evidence. At High exposure it is treated as S3, labeled provisional,
until evidence arrives.

### Evidence

| Level | What it holds |
|---|---|
| E0 | Nothing, or marketing statements |
| E1- | A vendor ACR that fails a quality check below |
| E1 | A vendor ACR that passes every quality check |
| E1+ | E1 plus GSA's Supplemental Accessibility Report (methods) and Issue Detail Supplement (severity, affected groups, workarounds) |
| E2a | A live vendor demonstration of each role's core tasks with assistive technology, against the SFSU demonstration checklist |
| E2b | A third-party audit that names its method (Trusted Tester, ICT Testing Baseline, or WCAG-EM with its sample) |
| E3 | ATI team testing of each role's core tasks by a named method, recorded with the Section508.gov test-report elements |

ACR quality checks. A failure drops the ACR to E1-:

1. The template is not VPAT 2.5 Rev, or is the 508 edition. The 508 edition reports
   WCAG 2.0 only. For web and mobile, require the WCAG or International edition.
2. No month and year, no product version, or a version other than the one being bought.
3. Older than two years, or older than the last major release. This is peer practice:
   Berkeley 12 to 18 months, Fullerton 2 years. No federal rule sets an age.
4. No evaluation methods: no split of manual, automated and assistive technology
   testing, and no tools named.
5. "Partially Supports" or "Does Not Support" without remarks.
6. Only "Supports" throughout, or on complex criteria (1.3.1, 2.1.1, 4.1.2, 1.4.10)
   without remarks. The SFSU Quick Guide calls an all-Supports ACR a red flag.
7. "Not Evaluated" outside the AAA table.
8. The ACR does not cover every interface or platform being bought.

Evidence limits the outcome:

- E0 or E1- never supports Approve at Medium or High exposure.
- E1 never supports Approve at High exposure.
- A 35.205 minimal-impact finding needs E2 or better.

### Stage 3: outcomes

**Separate what is known from what is uncertain.** Manual review means "not sure yet."
TAAP and Deny answer a known barrier. Mixing them on one axis breaks the grid's
ordering. The grid orders known outcomes as Approve, Approve with conditions, TAAP,
Deny. Uncertainty routes to Manual review: S?, weak evidence, a boundary score, or a
claimed exception.

**Rules that hold in every cell:**

1. **S3 on a core task is never Approve, at any exposure level.** One student blocked
   from a required task is a denial of access whatever the user count.
2. **Approve** requires S0, a documented 35.205 finding (S1), or a documented 35.203
   equivalent facilitation, with evidence at the level exposure requires.
3. **Approve with conditions** (new, from Tufts and University of Washington) covers
   S1 and S2 at Low and Medium exposure, where the vendor commits in the contract to
   fix named defects by a date. It is distinct from a TAAP, in which the university
   provides the access.
4. **TAAP** is valid only when the plan:
   - gives access on the first day of use;
   - gives the same information, interactions and functions;
   - allows independent use where the product does, in the same setting where possible;
   - names an owner, the steps, the response time, how users learn of it, and how they
     report a barrier;
   - carries the vendor's remediation commitment with dates, and an end or review date;
   - states why a more accessible product was not chosen.
   It also gives primary consideration to what each person asks for (35.160), and a
   person may decline it (35.130(e)). For web and mobile content, a TAAP stands only
   with a 35.204 written determination. For non-web technology, it stands with a
   best-meets record.
5. **Deny** applies when a TAAP cannot meet the first-day and same-function tests for
   a required use, or when a more accessible product meets the need. The record states
   the rationale and the reconsideration path (CSU Step 3).
6. **Burden claims leave the reviewer.** A claim that conforming is too costly or would
   change the program goes to the president or a designee with budget authority, in
   writing, with the resources considered. The reviewer's output is a recommendation.

**Who approves and how long an exception lasts scale with exposure** (Arizona, Ohio
State, Illinois, Texas A&M):

| Exposure | Approver of an exception | TAAP or exception expires |
|---|---|---|
| Low | ATI coordinator | 3 years |
| Medium | ATI coordinator and department head | 2 years |
| High | Executive sponsor (division VP or designee) | 1 year |

Renewal, a major version, a change of users or use, or a complaint triggers review
first if it comes sooner. Renewal requires a new evaluation.

**Contract terms follow the outcome.** Every approval carries the CSU General
Provisions accessibility clause and Government Code 7405(b)'s complaint-resolution duty.
Conditional approvals and TAAPs add: conformance warranty; acknowledgment of a reported
defect within 7 days; critical defects fixed within 30 to 90 days or an interim
accommodation; a dated roadmap; no loss of conformance on upgrade or configuration; the
right to test before acceptance; and termination without penalty after a missed
remediation window.

### The record

Every determination records:

- kind of technology, interfaces, and governing standard;
- each exposure fact as the requester answered it and as the reviewer confirmed it;
- which floor applied, the group scores, and the count of unknowns;
- core tasks per role, and severity per role and functional group;
- evidence level, ACR date and edition, and the checks it failed;
- products compared, and the best-meets basis where used;
- outcome, contract terms included, approver name and title, and date;
- expiry and review triggers;
- the version of the matrix used.

A TAAP links back to the determination that required it. Today no TAAP field records
exposure, user count, required use or the matrix outcome. Records must be countable for
8.9-pro (reviews) and 8.10-pro (plans), and must exist for low-exposure approvals too
(1.12-pro, 8.11-pro).

## By principle

What each Principle node asks of the matrix, and what the research adds.

| Principle | What it asks of the matrix | Research that bears on it |
|---|---|---|
| `program-accessibility-as-proactive-duty` | Exposure never makes an inaccessible product acceptable; access is planned before deployment | 2011 FAQ; Kindle pilots; Payan "before acquisition" |
| `equally-effective-access` | A TAAP passes all conditions or it is not equally effective | 35.205 four tests; 104.4(b)(2); EO 1111; Louisiana Tech "at the same time" |
| `proportionate-remedy` | Formal plans for barriers that block essential functions | TAAP template; CSU TAAP page; conflicts with 4.6-pro (see below) |
| `time-bound-alternative-when-not-conformant` | Every TAAP has an end or review date, and expiry scales | Ohio State, Illinois, Texas A&M; TAAP 3.3 annual review |
| `parallel-duties-conformance-and-accommodation` | Approval never ends the individual accommodation duty | 35.160; ADA.gov "case-by-case" note |
| `bounded-duty-burden-limits` | Burden claims are the head's or a designee's, in writing | 35.204; Miami paragraph 63; CSU defenses page |
| `deference-earned-through-documented-process` | The record list; reasons recorded for every Deny and TAAP | Section508.gov Play 8 decision file; Arizona's six items |
| `notice-as-part-of-access` | Approve-with-barriers and TAAPs require notice where users meet the product | TAAP data: no statement links to a plan; Disability Services reached once in 27 |
| `audience-determines-governing-duty` | Severity rated per role; hiring and HR tools named | Title I for employees and applicants; the law pass did not cover Title I in depth |
| `conformance-to-an-external-technical-standard` | Stage 0 picks the standard by kind of technology | CSU 508 versus Title II guidance |
| `state-law-adopts-the-federal-standard` | 508 through 7405 for non-web technology | 7405(a) and (b); 11135 names CSU |
| `program-viewed-in-its-entirety` | Alternate versions only where direct access is impossible, for web and mobile | 35.202 |
| `closest-to-capacity` | Remediation by the vendor in the contract; the university pays for accommodation when it deploys a non-conformant product | Contract terms; Miami paragraph 50(d)(4) |
| `vendor-leverage-procurement-as-accessibility-lever` | Contract terms follow the outcome; a deny gives findings and a path to approval | Section508.gov model clauses; HECVAT ITAC-07 and ITAC-14 |
| `universal-design-over-accommodation` | Prefer the most accessible product; Deny when a better one meets the need | E202.7; CSU process goal |
| `prioritization-by-impact` | Exposure sets review depth and urgency, not the outcome | CSU 2021 memo; Section508.gov risk-based testing |
| `local-adaptation-flexibility` | One set of thresholds for all three campuses | Same facts, same answer |
| `shared-responsibility-requiring-coordination` | Named roles for reviewer, approver, plan owner, distributor | Signer disagreement across sources |
| `federal-funding-reaches-every-operation` | Every channel gets the same review | 1.12-pro; 9/16 minutes on items bypassing review |

Principles with no bearing on procurement review: `capability-maturity-over-binary-compliance`,
`continuous-sustained-remediation`, `institution-wide-responsibility`.

### Proposed new Principle nodes

The research supports seven principles the graph does not hold. Each is proposed, not
written. Grounding names the Governance or IntellectualSource nodes it would derive from,
some of which may need creating.

1. **`exposure-sets-scrutiny-not-entitlement`.** How widely a product is used decides
   how closely it is reviewed and who signs. It does not decide whether people with
   disabilities are owed access. Grounding: 2011 OCR FAQ; Kindle resolutions; 35.130;
   CSU 2021 memo.
2. **`vendor-claims-require-proportionate-validation`.** A vendor's conformance report
   is a claim, and the strength of evidence required rises with exposure. Grounding:
   Section508.gov "Understand claims"; Louisiana Tech; Payan; 1.8-pro.
3. **`most-accessible-product-that-meets-the-need`.** The university selects the most
   accessible product that meets the business need, and buys a non-conforming product
   only when none conforms. Grounding: E202.7; Miami decree; CSU ATI Procurement
   Process.
4. **`duty-runs-through-contracts`.** Technology a vendor provides under contract or
   license is the university's own for accessibility purposes. Grounding: 35.200(a);
   104.4(b)(1); Youngstown State; ADA.gov First Steps.
5. **`denial-carries-reasons-and-a-path`.** A denial states its findings, the threshold
   it applied and the route to approval or reconsideration. Grounding: CSU Step 3;
   `vendor-leverage` description.
6. **`determinations-expire`.** A determination holds for a stated term and is redone
   on renewal, a major version, or a change of users or use. Grounding: Ohio State;
   Illinois; Texas A&M; TAAP 3.3 annual review.
7. **`same-facts-same-answer`.** Two reviewers given the same facts reach the same
   result, and the rubric is tested for that. Grounding: rater-agreement literature
   (Krippendorff 2004); DCLG multi-criteria manual; `local-adaptation-flexibility`.

## Conflicts in our own sources

These need a decision before the matrix can be consistent.

1. **4.6-pro against the TAAP template.** The 4.6-pro Established bar requires a TAAP
   "whenever a product with known accessibility barriers is approved for use." The 2024
   ATI Policy says plans are created for products "not fully Section 508 compliant."
   The CSU TAAP template and TAAP page say a TAAP is "not required for minor
   accessibility failures." `proportionate-remedy` follows the template. Recommended:
   follow the template for when a TAAP is required, and meet 4.6-pro's intent by
   recording every approval with known barriers, with notice and the vendor's
   commitments. That still falls short of the bar's literal wording, so the gap should
   be named in the 4.6-pro evidence.
2. **The SFBRN procedure ties a TAAP to exposure alone.** Procedure v1.0 (7/13/2026)
   says "High-risk products typically require a TAAP." The research supports tying a
   TAAP to severity, with exposure setting evidence and approver. Adopting the matrix
   means revising the procedure.
3. **Dates.** TAAP form 3.2 and the 2024 CSU memo give April 24, 2026 for Title II. The
   current date is April 26, 2027. Notice text and templates need the new date.
4. **TAAP version.** All 27 records use form 3.2. CSU publishes 3.3, which adds vendor
   notification, executive acknowledgment and annual review.
5. **Signers.** The template in the graph lists three signers. The SFBRN procedure and
   the SSU form list two. The SSU page lists requestor, analyst and IT leadership. The
   reviewer signs none of them. 35.204 requires the head or a designee for any burden
   claim.
6. **ACR for every software purchase.** The April 2026 SFBRN email template says CSU
   requires a current VPAT or ACR on all software purchases. The draft's Low row does
   not require one.
7. **CSU's TAAP page misstates 35.205.** It says alternative access lets an institution
   "remain compliant." The rule's text and CSU's own defenses page say the opposite.
8. **SFSU sources are retired.** The draft cites SFSU pages that are now deprecated.
   The live CSU Step 2 and TAAP pages carry the same criteria.
9. **CSU's own "high impact" list mixes exposure and barriers.** It includes "access
   may be denied" and "no known workarounds." Indicator 1.4-pro lists "accessibility
   risk" as an input to the evaluation level. The matrix keeps the stages apart and
   lets evidence and severity, not exposure, decide the outcome. It should say so
   where it cites those sources.

## Calibration before adoption

No published accessibility procurement matrix has been tested against outcomes. Our
pilot will be the only evidence the model has.

1. **Case set.** 40 past reviews across the three campuses, at least 10 each judged Low,
   Medium and High, and at least 8 known blockers. The 27 TAAPs and the East Bay
   tickets are the starting pool.
2. **Reference.** A panel of three experienced reviewers, one per campus, gives a
   holistic outcome without the tool, then agrees a consensus.
3. **Independent scoring.** Three raters score Stages 0 to 2 with the tool, without
   discussion.
4. **Agreement targets** (Krippendorff's ordinal alpha): 0.80 for the exposure level,
   0.67 for severity, 0.70 for the outcome. Rewrite any factor's anchors that score
   below 0.67.
5. **Validity.** No case the panel called TAAP or Deny may come out more lenient from
   the tool. Over-calls stay under about 20 percent so the review queue does not flood.
6. **Hold out.** Set thresholds on 25 cases, freeze them, and test on the other 15.
7. **Sensitivity.** Flag a case as "boundary" when moving one answer one level changes
   the result. If more than about 30 percent of cases are boundary cases, the bands are
   too narrow.
8. **Every year.** Re-run on 10 to 15 new cases and track how often reviewers depart
   from the grid and why.

## Uncertainties

- DOJ said it may propose changes to the rule's substance. No proposal had appeared by
  2026-10-16.
- Government Code 7405 does not name CSU. Coverage rests on CSU's statement and on
  7405(b)'s cross-reference to 11135, which does name CSU.
- Title I and FEHA duties for employee-only tools were not researched in depth.
- No regulator has approved or criticized a tiered intake review as such. Tiering is
  defensible only for setting review depth, evidence and approver.
- The weights, cut points and expiry terms above are design choices to calibrate. No
  source prescribes them.
- Several peer pages and the CSU Prioritization Framework could not be read in full.

## Sources

**Law and regulation.** 28 CFR 35.104, 35.130, 35.160, 35.164, 35.200 to 35.205
(law.cornell.edu/cfr/text/28/); DOJ interim final rule 2026-07663 (federalregister.gov,
2026-04-20); 34 CFR 104.4, 104.44; 45 CFR 84.84 and HHS rule 2026-09266; 36 CFR 1194
Appendix A E202 to E205 and Chapter 3 (access-board.gov/ict); Cal. Gov. Code 7405,
11135; Cal. Ed. Code 67302; CSU EO 1111 (2018); CSU ATI memos of 2021-03-08 and
2024-08-26; ati.calstate.edu Title II update pages, defenses page, 508 versus Title II
page, procurement Steps 2 to 4, TAAP page.

**Enforcement.** Arizona State (2010), Case Western, Pace and Reed (2010), ED/DOJ Dear
Colleague Letter (2010) and FAQ (2011), Penn State (2011), South Carolina Technical
College System (2013), Louisiana Tech (2013), University of Montana (2014), University
of Cincinnati (2014), Youngstown State (2014), U.S. v. Miami University consent decree
(2016), the 2016 to 2018 OCR web agreements, NAD v. Harvard (2019), NAD v. MIT (2020),
Payan v. LACCD (9th Cir. 2021 and 2026).

**Federal practice.** section508.gov: Buy, Understand claims, Request accessibility
information, ACR Issue Detail Supplement, Understanding Section 508 exceptions,
Technology Accessibility Playbook Play 8, Testing lifecycle, Elements of a test report,
2025 assessment findings, Accessibility risk management model; ITI VPAT 2.5 Rev; ICT
Testing Baseline; Trusted Tester; W3C WCAG 2.1 conformance requirements; WCAG-EM 2.0
(2026); EN 301 549 Annex B; European Accessibility Act Annex VI.

**Peer universities.** Michigan, UC Davis, Ohio State, Illinois, Arizona, University of
Washington, Tufts, Texas A&M, UT Austin, Minnesota, UW-Madison, Virginia Tech, NC State,
UC Berkeley, Stanford, CU Boulder, CSU Channel Islands, Fullerton, Bakersfield, San
Bernardino; HECVAT 4.

**Scoring method.** Cox (2008) on risk matrices; Thomas, Bratvold and Bickel (2014);
Krisper (2021); DCLG, Multi-criteria analysis: a manual (2009); Cinelli et al. (2014) on
ELECTRE; AIAG-VDA FMEA Handbook (2019); WP29/EDPB DPIA guidance (WP248); NYU severity
scale; Brajnik's Barrier Walkthrough and reliability studies; Treasury Board of Canada,
Algorithmic Impact Assessment and Directive on Automated Decision-Making.

**Graph.** Success indicators 1.3, 1.4, 1.8, 1.12, 4.6, 8.9 to 8.12-pro and their
EvidenceRequirement bars; CSU ATI Policy (2024); CSU ATI Procurement Process; TAAP
Authoring Template; SFBRN CSUBuy IT Accessibility Review Procedure v1.0; SFBRN TAAP
Authoring Process; campus procurement pages; 27 TAAP records; the 22 Principle nodes;
Procurement Working Group minutes of 9/16, 10/1 and 10/14/2026.
