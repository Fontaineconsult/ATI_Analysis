# What the warning level should tell purchasers

Research memo, 2026-10-20. The question: the review matrix prints a warning level (low,
elevated, high) with every Needs TAAP risk grade, from `W = P + gap`. Only one binding source
stands behind part of it, the CSU TAAP template's Institutional Risk tiers. This memo collects
how public institutions define and communicate residual risk, and proposes what each warning
level should say.

Sources are grouped by weight. Binding on the CSU first, then federal guidance, then peer
practice, then risk-management frameworks and research. Pages that refused the fetch (CAUDIT,
UC Davis, Colorado OIT, Harvard, Michigan, the Australian DTA) are cited from search excerpts
only, and the memo says so where it leans on them.

## 1. What the CSU already says about risk

**The CSU ATI Prioritization Framework** (CSYou login) is the system's own risk model, and
SFSU and CSUB publish adaptations of it. CSUB's training slide titles it "Accessibility Risk
Assessment" and lays it out on two axes.

| Axis | High | Medium | Low |
|---|---|---|---|
| Impact | Denies access to a program/service. Impacts a critical program/service. Creates high accommodation costs. Creates significant legal exposure. No available workarounds. | Limits access to a program/service. Impacts an important but non-critical program/service. Creates moderate accommodation costs. Creates moderate legal exposure. Workarounds for some functions. | Does not limit access to a program/service. Impacts an optional program/service. Creates little or no accommodation costs. Creates little or no legal exposure. Workarounds for all functions. |
| Probability | Impacts a large audience or members of the public. Creates frequently recurring barriers. Strong likelihood of impact for persons with disabilities. | Impacts a moderately-sized audience, not public facing. Creates occasionally recurring barriers. Moderate likelihood of impact. | Impacts a small audience, not public facing. Does not create recurring barriers. Low likelihood of impact. |

The CSU Step 2 page lists the high-impact factors the same way: a large number of persons,
access may be denied, a critical program, high accommodation cost, significant legal exposure,
no known workarounds. The framework decides review depth before purchase. It is not a residual
risk rating. It matters here because it names the consequences the CSU treats as the risk:
denied access, accommodation cost on the department, legal exposure, and the absence of
workarounds. Our pressure term covers the probability axis. Our severity covers "denies" against
"limits". Our gap covers "workarounds". The matrix's warning sentence names none of the
consequences.

**The CSU TAAP Authoring Template** grades Institutional Risk by the count of the six
requirements a plan meets: all six low, one to five moderate with "staff should be prepared to
provide additional support for affected individuals", none high. The template also makes the
three signers confirm they have "evaluated the associated institutional risks and accommodation
requirements". The template's own risk rating is a property of the plan alone.

**CSU Channel Islands** scores impact numerically. A score of 35 or above is "high-risk,
high-impact" and requires ACR review, testing and an EEAAP. Below that, ITS verifies the VPAT.

## 2. Federal guidance

**Section508.gov, Accessibility Risk Management and Risk Model for ICT.** A points model, summed
across five groups, with High at 25 or more, Medium at 15 to 24, Low at 0 to 14. The groups and
the heaviest items:

- Scope of use: public users, mandatory use, known users with disabilities, platform (+5 each);
  50% or more of employees (+4); less than 14% and no mandatory use (+1).
- Impact of defects: three or more disability groups, or critical features (+5); global issue
  (+4); two or fewer groups and no critical feature (+3).
- Product history: no Section 508 contract language (+5); many pre-existing defects (+5); new
  product (+4); applicable 508 contract language (−1).
- Vendor expertise: no or deficient remediation history (+5); excellent history (0); trained
  team (−1).
- Risk mitigations: remediation over 12 months (+5); no accommodation or alternate means plan
  (+5); insufficient market research (+5); remediation over 6 months (+4); partial plan covering
  all major defects (+1); plan covers all defects (−1).

This is the closest federal analog to `W = P + gap`. Scope of use is our pressure. The alternate
means plan is our gap, scored as a mitigation that lowers the total. Two drivers the federal
model weighs heavily are absent from `W`: remediation time, and vendor remediation history.
Both are what the roadmap terms address. The page assigns no action to a rating beyond
"prioritize high-scoring ICT first" and "include an accessibility SME in high-risk
acquisitions".

**Section508.gov, ICT Accessibility and Risk Management.** A five by five likelihood by
consequence matrix with six ratings, and each rating is defined by what it asks of the agency:
Critical "requires immediate attention", Very High "relatively immediate attention", High
"attention within approximately 3 months", Moderate "within the next 6 months", Low "regular
monitoring", Very Low "monitoring on an as needed basis". Acceptance means to "Acknowledge the
risk within defined tolerance levels and document the rationale". Leadership "should
periodically review enterprise-level accessibility risks". The page does not address
communicating risk to buyers.

**GSA FY 2025 Section 508 Assessment.** Recommends "a risk-based approach that prioritizes
high-impact and high-use ICT" and reports that agencies struggle to hold vendors accountable
for nonconformant products. Half of agencies do not routinely test.

**NIST Risk Management Framework** (secondary summaries of SP 800-37 Rev. 2 and SP 800-53
RA-7, to be checked against the primary text). Risk acceptance is an explicit, documented act
by the authorizing official and is not delegable. A residual risk statement names the scenario
the controls do not prevent, the population exposed to it, and the expected consequence.
Authorization "is a decision about whether identified residual risk is acceptable", not a claim
that risk is gone.

## 3. State practice

**Minnesota IT Services, exceptions process.** A risk matrix "analyzes agency-provided data to
assign a risk level". Filing an exception means the agency will "Acknowledge that the
technology may present barriers to some users", "Accept the associated risks" and "Plan
strategies to mitigate those risks". The level "helps the agency decide whether to proceed"
and, if it proceeds, "highlights the need to take additional steps to prevent negative user
experiences". Agencies see a dashboard of every filed exception to assess overall exposure.

**Texas DIR.** Only the Executive Director grants an exception, and "any approved exception
shall include a plan for alternate methods of access for persons with disabilities".

**Washington OCIO SEC-11** (security, not accessibility). "Residual risk must be accepted by an
agency officer authorized to make risk treatment decisions." Authority can be delegated in
writing; final responsibility cannot.

**Colorado OIT** (search excerpt). Accessibility, security and contracting risk are scored
together at purchase intake, and agencies are told to plan accommodations for products that
cannot be made equitably accessible and to revisit the need over time.

## 4. Peer universities

| Institution | Risk level used for | What the level triggers | Who accepts |
|---|---|---|---|
| University of Washington | Low, Medium, High plus a score and notes, from use, access and user count | Low: provisional approval. Medium or High: ACR review, then baseline or extended testing. Failed test: exemption request. The panel weighs risk level, severity, statutory obligations, no other product, and a remediation path, and sets an expiration date | Exemption Panel; CIO for products the panel does not qualify |
| University of Arizona | Low, Medium, High | Every exception documents business justification, alternatives considered, risk assessment ("who is affected and how"), mitigation plan, remediation timeline, review date | Low: Digital Accessibility Director. Medium: unit leadership plus Director. High: Steering Committee |
| Big Ten Academic Alliance | Priority tiers from audience (1 to 50, 50 to 1,000, 1,000 or more or the public), required use, status, vendor options, accommodation requests | Medium: "serious risk footprint", an Equally Effective Alternate Access plan "may be necessary". Higher: "severe or critical risk footprint", formal requirements, an EEAA plan and a remediation timeline | Project owners, reassessed annually |
| Harvard (search excerpt) | Temporary procurement exceptions | Signed by leaders the Accessibility Steering Committee approves, who monitor progress and report back | Named leaders |
| Rochester, Oregon State | Exceptions | Dean or vice president approves before filing; a central office determines | Dean or VP |
| UC Davis (search excerpt) | High, Medium, Low | High: ACR evaluated first, signed EEAAP for noncompliant products. Medium: EEAAP or workaround case by case | Department |
| CAUDIT, Australia (search excerpt) | Low, Medium, High | Low: limited audience, occasional use, easy alternatives. Medium: alternate access plan and remediation roadmap in place | Institution |

Two patterns hold across every peer. The level decides who must sign, and the exception is
time-bound with a review date. None of them publishes a graded residual-risk label to the
purchaser after approval. The level does its work before approval, in routing and sign-off.

## 5. Risk frameworks and research on what a rating should say

**HM Treasury Orange Book.** "It is not the absolute value of an assessed risk which is
important; rather it is whether or not the risk is regarded as tolerable." Residual risk is
compared against a tolerable impact and a tolerable frequency. Reports should "indicate whether
these are within risk appetite", show trends and "support early warning indicators". "What is
considered a high level of risk at one level will be a lower level of risk to a higher level of
management", which is what makes escalation work.

**Cox, What's Wrong with Risk Matrices (Risk Analysis, 2008).** Matrices compress ranges, so
very different risks share a label, and they can rank wrongly when severity and frequency are
negatively correlated. Cox's conclusion is to use them "with caution, and only with careful
explanations of embedded judgments", as screening and communication tools.

**Budescu and colleagues on verbal probability labels.** Across 24 countries, readers pulled
verbal labels toward the middle of the scale, with large variation between people. Accuracy
improved when the words and the numbers behind them appeared together every time, not in a
separate key.

**ANSI Z535.4 signal words.** Each word has one fixed meaning. DANGER: a hazard that "will
result in death or serious injury". WARNING: "could result in death or serious injury".
CAUTION: "could result in minor or moderate injury". The word is chosen from severity and
probability together, and from the greatest hazard present.

**UK Infrastructure and Projects Authority delivery confidence.** Each colour is a sentence
about feasibility and manageability. Red: "successful delivery appears unachievable", with
issues that "do not appear to be manageable or resolvable". Amber: feasible, with significant
issues that management attention can resolve.

## 6. What this says about our warning level

1. **The gap term has a source. The pressure term does not.** The template grades plans by
   count met. Scaling that by audience is the matrix's own, with the federal risk model as the
   nearest precedent. The docx grounding should say exactly that.
2. **Severity is missing from `W`.** The CSU framework, the Step 2 page and the federal model all
   rank "denies access" above "limits access". At Needs TAAP, an S3 blocked function and an S2
   slowed function at the same pressure and gap read the same warning. The sentence, at least,
   should say which it is.
3. **Remediation is missing from `W`.** The federal model's heaviest items are remediation time
   and vendor history. The TAAP is valid only while the vendor remediates. The warning should
   tie to the roadmap milestones, which the approval already requires.
4. **Inputs are not consequences.** The current sentence says "exposure and barrier reach set a
   strict standard" and "the plan is N requirements short of a full TAAP". Every source frames
   residual risk by consequence: who cannot do what without staff help, what the department
   carries, what legal duty continues. NIST's residual risk statement is the model: scenario,
   exposed population, expected consequence.
5. **Each label needs a fixed sentence.** Section508.gov, ANSI and the IPA define every rating
   by what it means and what it asks. Budescu says print the numbers with the word every time.
   The tester already shows pressure and gap. The email should too.
6. **The level should name who acknowledges it.** Every peer maps the level to a signer. The
   TAAP already has three signers and the exception has the president. The high warning can
   point at the Dean or Division Vice President signature as the acknowledgement of residual
   risk, and the record can say so.
7. **Tolerance, not magnitude.** The binding minimum is the tolerance line. The warning reports
   how far above the line the approval sits and why. It never lowers the line.
8. **Keep the aggregate in view.** Minnesota's dashboard of exceptions is the strongest argument
   for a graded label. A count of high-warning approvals in force is a campus-level indicator
   that a per-review Approve or Deny cannot give.

## 7. Proposed meaning of each level

Each level keeps its cut and gains a definition, a consequence statement and an action. The
numbers stay in the sentence.

| Level | Cut | What it tells the purchaser | What the purchaser does |
|---|---|---|---|
| Low | `W < 2` | A small or optional audience, and a plan that covers equally effective access. Residual risk is the ordinary risk of a temporary plan. | Annual TAAP review. |
| Elevated | `2 ≤ W < 4` | Either the audience is large or required, or the plan leaves named requirements uncovered. The department carries support for those requirements until the vendor's roadmap closes the barriers. | The Dean or Division Vice President signs knowing the named requirements are uncovered. Review at the first roadmap milestone or 12 months, whichever is first. |
| High | `W ≥ 4` | A large or required audience depends on staff support for access the plan does not provide, or on a full plan at the highest exposure. People in the named groups cannot perform the named functions without that support. The Title II duty continues and rests on the department's capacity and the vendor's remediation. | Weigh the more accessible product before buying. The Dean or Division Vice President acknowledges the residual risk in the TAAP. Review at the first roadmap milestone. |

The warning sentence in the email follows the NIST shape: the scenario (which functions, for
whom, rest on the plan's support rather than the product), the population (the audience the
pressure counts), and the consequence (what the department carries and what duty continues).
The sentence names severity: "cannot perform" for S3, "can perform only with clearly more
effort" for S2.

The name stays "warning level". The template's "Institutional Risk" is a different measure and
the memo recommends never printing that phrase for ours.

## Sources

CSU and campuses

- [CSU ATI, Step 2 Review information](https://ati.calstate.edu/ati-priority-areas/procurement/procurement-process-overview/step-2-review-information)
- [SFSU, Determining Impact of a Technology Acquisition](https://access.sfsu.edu/ati/procurement/impact) (adapted from the CSU ATI Prioritization Framework)
- [CSUB, Procurement of Accessible ICT training, 2021](https://www.csub.edu/ati/_files/Procurement-of-Accessible-ICT-Training-2021.pdf)
- [CSU Channel Islands, IT Procurement Impact Assessment Scoring](https://www.csuci.edu/office-departments/ati/sla/impact-assessment-scoring.html)

Federal

- [Section508.gov, Accessibility Risk Management and Risk Model for ICT](https://www.section508.gov/blog/Accessibility-risk-management-and-model/)
- [Section508.gov, ICT Accessibility and Risk Management](https://www.section508.gov/manage/governance/ict-accessibility-and-risk-management/)
- [GSA, FY 2025 Section 508 Assessment, findings](https://www.section508.gov/manage/section-508-assessment/2025/findings/)
- [Section508.gov, Define Accessibility Criteria in Contracts](https://www.section508.gov/buy/define-accessibility-criteria/)
- [NIST SP 800-53 RA-7 Risk Response, summary](https://www.upguard.com/compliance/nist-sp-800-53/ra/ra-7)
- [Writing a risk acceptance record the accepting executive can sign](https://www.scworld.com/tech-explainer/writing-a-risk-acceptance-record-the-accepting-executive-can-sign)
- [DOJ, Fact Sheet on the Title II web rule](https://www.ada.gov/resources/2024-03-08-web-rule/)
- [OCR Resolution Agreement, University of Phoenix](https://www2.ed.gov/about/offices/list/ocr/docs/investigations/more/08152040-b.pdf)

States

- [Minnesota IT Services, Updating Minnesota's Accessibility Exceptions Process, Part 2](https://mn.gov/mnit/media/blog/index.jsp?id=38-669671)
- [Texas DIR, EIR Accessibility Requirements, Exceptions, and Exemptions](http://dir.texas.gov/electronic-information-resources-eir-accessibility/eir-accessibility-roles-and-responsibilities/eir)
- [Washington OCIO, SEC-11 Risk Management Policy](https://watech.wa.gov/sites/default/files/2024-09/SEC-11%20Risk%20Management%20Policy.pdf)
- [Colorado OIT, Accessibility Solution Evaluation](https://oit.colorado.gov/standards-policies-guides/guide-to-accessible-web-services/procurement-toolkit/accessibility)

Universities

- [University of Washington, Digital Product Accessibility Reviews](https://www.washington.edu/accesstech/policy-resources/procurement/digital-product-accessibility-reviews/)
- [University of Arizona, Accessible Procurement Process](https://accessibility.arizona.edu/procurement/accessible-procurement-process)
- [Big Ten Academic Alliance, Accessibility Prioritization Guide](https://btaa.org/technology/itaccessibility/prioritization-guide)
- [Harvard, Digital Accessibility Policy Procedures](https://accessibility.huit.harvard.edu/digital-accessibility-policy-procedures)
- [University of Rochester, Digital Accessibility Policy Exceptions](https://www.rochester.edu/digital-accessibility/policy-exceptions/)
- [Oregon State, Policy 08-020 Digital Accessibility](https://policy.oregonstate.edu/sites/policy.oregonstate.edu/files/08-020%20Digital%20Access%20102125.pdf)
- [UC Davis, Accessible Software Procurement Guide](https://accessibility.ucdavis.edu/digital/procurement)
- [University of Illinois System, EIT Accessibility Guidelines](https://www.vpaa.uillinois.edu/resources/policies/electronic_information_technology_accessibility_po/eit_accessibility_guidelines)
- [CAUDIT, Accessible IT Procurement, Risks](https://www.caudit.edu.au/accessible-it-procurement/guide/risks)

Frameworks and research

- [HM Treasury, The Orange Book, 2023](https://assets.publishing.service.gov.uk/media/6453acadc33b460012f5e6b8/HMT_Orange_Book_May_2023.pdf) and [2004 edition](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/191513/The_Orange_Book.pdf)
- [Cox, What's Wrong with Risk Matrices?, Risk Analysis 2008](https://onlinelibrary.wiley.com/doi/10.1111/j.1539-6924.2008.01030.x)
- [Budescu et al., interpretation of IPCC probabilistic statements](https://researchportalplus.anu.edu.au/en/publications/the-interpretation-of-ipcc-probabilistic-statements-around-the-wo/)
- [Judgment and Decision Making, 2021, words and numbers together](https://dlab.sauder.ubc.ca/sjdm/journal/20/200930/jdm200930.html)
- [ANSI Z535 safety headers](https://www.safetysign.com/safety-header) and [signal word guidance](https://www.ecmag.com/magazine/articles/article-detail/codes-standards-signal-words)
- [IPA delivery confidence ratings, as reported](https://civilserviceworld.com/articles/news/number-top-government-projects-given-red-delivery-warning-halves-year) and [Australian DTA, DCA ratings explained](https://www.digital.gov.au/initiatives/digital-project-research-series/assessing-delivery-confidence-of-digital-projects/dca-ratings-explained)
- [ISO 31000 overview](https://en.wikipedia.org/wiki/ISO_31000)
