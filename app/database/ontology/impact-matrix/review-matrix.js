/**
 * Unified SFBRN accessibility review matrix, version 2, as a data model.
 *
 * The matrix is data: every rule carries its provenance (`state`) and the principles it
 * carries out (`grounds`, principle handles without the `principle:` prefix). The one
 * function, `evaluate`, applies the data to a purchase and returns a determination.
 * Prose source: unified-matrix-draft.md, "DRAFT matrix", version 2 (2026-10-16).
 *
 * Plain script, no dependencies. It is not an ES module because browsers refuse module
 * imports on a page opened from a local file. In a browser, load it with
 * <script src="review-matrix.js"> and use the global `ReviewMatrix`. In Node, use
 * require('./review-matrix.js').
 */

const MATRIX_VERSION = '2';

/** Where a rule comes from. Kept after adoption as provenance. */
const STATES = {
  agreed: 'Decided by the Procurement Working Group, 10/14/2026',
  required: 'Follows from law or CSU policy; the source is named on the rule',
  proposed: 'Design choice from the research',
  calibrate: 'Number or term set by the pilot',
};

const LEVELS = ['low', 'medium', 'high'];
const ROLES = ['students', 'employees', 'applicants', 'public'];

/** The nine Section 508 functional performance criteria (302.1 to 302.9). */
const FUNCTIONAL_GROUPS = [
  'without_vision', 'limited_vision', 'without_color_perception', 'without_hearing',
  'limited_hearing', 'without_speech', 'limited_manipulation', 'limited_reach_and_strength',
  'limited_language_cognitive_learning',
];

// ---------------------------------------------------------------------------------------
// Numbers the pilot sets. A recalibration bumps MATRIX_VERSION; it never edits in place.
// ---------------------------------------------------------------------------------------
const CALIBRATION = {
  state: 'calibrate',
  userCuts: [25, 250],                       // up to 25 low; 26 to 250 medium; above high
  weights: { reach: 1, stakes: 1, spread: 1, duration: 1 },
  bands: { medium: 0.25, high: 0.55 },       // share of the maximum weighted score
  acrMaxAgeMonths: 24,
  // Breadth, from 0 to 2: one step at each cut of distinct blocked task and group pairs, plus
  // one when S2 findings reach s2AddsAt.
  breadth: { blockedCuts: [2, 4], s2AddsAt: 3 },
  // S2 barriers that add up to S3. `stack` S2 findings for one group on one core task block
  // that task. At `spreadAt` exposure, S2 findings across `spreadPairs` task and group pairs
  // make the product S3.
  accumulation: { stack: 3, spreadPairs: 6, spreadAt: 'high' },
  // TAAP standard. Pressure P = rank(Exposure) + Breadth, from 0 to 4. `required[P]` is how many
  // of the six TAAP requirements a plan must meet. A plan below it is denied at P >= denyAt and
  // approved with a warning below that. The warning cuts apply to P plus the shortfall.
  taapStandard: { required: [3, 3, 4, 6, 6], denyAt: 3, warning: { elevated: 2, high: 4 } },
};

// ---------------------------------------------------------------------------------------
// Step 0. Kind of technology decides the standard.
// ---------------------------------------------------------------------------------------
const ICT_KINDS = {
  web: {
    label: 'Web content, web application, mobile app',
    standard: 'WCAG 2.1 AA',
    law: 'ADA Title II (28 CFR 35 subpart H); Section 504; Gov Code 7405',
    whenNonConforming: 'TAAP; where the plan falls short of equally effective access, a written determination by the president or designee (28 CFR 35.204)',
    state: 'required', grounds: ['conformance-to-an-external-technical-standard'],
  },
  nonweb: {
    label: 'Non-web software, hardware, kiosk',
    standard: 'Section 508 Standards (WCAG 2.0 AA content, Chapters 4 and 5, Chapter 3 FPC)',
    law: 'Section 508 through Gov Code 7405; Title II and 504 general rules',
    whenNonConforming: 'Best-meets record with market research, plus a TAAP (508 E202.7)',
    state: 'required', grounds: ['state-law-adopts-the-federal-standard'],
  },
  mixed: {
    label: 'Product with web and non-web parts',
    standard: 'WCAG 2.1 AA for the web and mobile use',
    law: 'Title II governs the web and mobile use (CSU 2026 Title II Update)',
    whenNonConforming: 'As for web',
    state: 'required', grounds: ['conformance-to-an-external-technical-standard'],
  },
};

// ---------------------------------------------------------------------------------------
// Step 1. Exposure. Sets review depth, evidence, approver and term; never the outcome alone.
// ---------------------------------------------------------------------------------------

/** A floor is one fact that sets a minimum level by itself. Floors only raise. */
const FLOORS = [
  { id: 'required_for_grade', fact: 'Required of students for coursework or a grade', min: 'high',
    state: 'proposed', grounds: ['exposure-sets-scrutiny-not-entitlement', 'equally-effective-access'] },
  { id: 'only_route_to_service', fact: 'The only route to a university service (enrollment, aid, payment, housing)', min: 'high',
    state: 'proposed', grounds: ['equally-effective-access'] },
  { id: 'campus_wide', fact: 'Campus-wide, or all sections of a course in a curriculum', min: 'high',
    state: 'proposed', grounds: ['exposure-sets-scrutiny-not-entitlement'] },
  { id: 'known_user_or_request', fact: 'A person with a disability is known to be in the user group, or an accommodation request is open', min: 'high',
    state: 'proposed', grounds: ['parallel-duties-conformance-and-accommodation'] },
  { id: 'prior_complaint', fact: 'A prior accessibility complaint about the product', min: 'high',
    state: 'proposed', grounds: ['deference-earned-through-documented-process'] },
  { id: 'job_duty_or_hiring', fact: 'Required for a job duty, or used in hiring', min: 'medium',
    state: 'proposed', grounds: ['audience-determines-governing-duty'] },
  { id: 'public', fact: 'Open to the public without single sign-on, publishes to the public, or in a public space', min: 'medium',
    state: 'proposed', grounds: ['exposure-sets-scrutiny-not-entitlement'] },
];

/**
 * Groups merge factors that describe the same fact, so nothing is counted twice.
 * A group takes the highest level among its factors.
 */
const GROUPS = [
  { id: 'reach', factors: [
    { id: 'users', numeric: true, levels: { low: 'Up to 25', medium: '26 to 250', high: 'More than 250' } },
    { id: 'scope', levels: { low: 'One department, organization or course', medium: 'Several, or a planned expansion', high: 'Campus-wide' } },
  ] },
  { id: 'stakes', factors: [
    { id: 'required_use', levels: { low: 'Optional', medium: 'Required for a few identified people for a limited task', high: 'Required for coursework, a job duty or a university service' } },
    { id: 'criticality', levels: { low: 'Optional program or service', medium: 'Important, not critical', high: 'Critical, or a core academic or business function' } },
  ] },
  { id: 'spread', factors: [
    { id: 'publishes', levels: { low: 'None', medium: 'For specific, limited audiences', high: 'For the public or a large or required audience' } },
  ] },
  { id: 'duration', factors: [
    { id: 'frequency', levels: { low: 'Occasional or one-time', medium: 'Weekly or each term', high: 'Daily or routine' } },
    { id: 'contract_length', levels: { low: 'One purchase or one year', medium: 'Two to three years', high: 'More than three years, or an enterprise agreement' } },
  ] },
].map((g) => ({ ...g, state: 'proposed', grounds: ['same-facts-same-answer'] }));

// ---------------------------------------------------------------------------------------
// Step 2. Severity (28 CFR 35.205 tests) and evidence.
// ---------------------------------------------------------------------------------------
const SEVERITY = [
  { id: 'S0', rank: 0, gsa: null, meaning: 'No effect on information, interactions, transactions or participation' },
  { id: 'S1', rank: 1, gsa: 'Minor', meaning: 'Minimal impact, demonstrated: the four 35.205 tests documented as met' },
  { id: 'S2', rank: 2, gsa: 'Major', meaning: 'A core task can be completed independently, with clearly unequal time or effort' },
  { id: 'S3', rank: 3, gsa: 'Critical', meaning: 'A core task cannot be completed independently, or only with help' },
].map((s) => ({ ...s, state: 'required', grounds: ['equally-effective-access'] }));

const EVIDENCE = [
  { id: 'E0', rank: 0, holds: 'Nothing, or marketing statements', state: 'proposed' },
  { id: 'E1-', rank: 1, holds: 'Vendor ACR that fails a quality check', state: 'proposed' },
  { id: 'E1', rank: 2, holds: 'Vendor ACR that passes every quality check', state: 'proposed' },
  { id: 'E1+', rank: 3, holds: 'E1 plus GSA issue-level supplement', state: 'proposed' },
  { id: 'E2a', rank: 4, holds: 'Live vendor demonstration of core tasks with assistive technology', state: 'agreed' },
  { id: 'E2b', rank: 4, holds: 'Third-party audit with a named method', state: 'proposed' },
  { id: 'E3', rank: 5, holds: 'ATI team testing of core tasks by a named method', state: 'agreed' },
].map((e) => ({ ...e, grounds: ['vendor-claims-require-proportionate-validation'] }));

/** Any failed check drops an ACR to E1-. */
const ACR_CHECKS = [
  { id: 'wrong_edition', text: 'Reports WCAG 2.0 only (508 edition) for a web or mobile product' },
  { id: 'no_date_or_version', text: 'No month and year, no product version, or a different version' },
  { id: 'stale', text: 'Older than CALIBRATION.acrMaxAgeMonths or the last major release' },
  { id: 'no_methods', text: 'No evaluation methods named' },
  { id: 'no_remarks', text: '"Partially Supports" or "Does Not Support" without remarks' },
  { id: 'all_supports', text: 'Only "Supports" throughout, or on complex criteria without remarks' },
  { id: 'not_evaluated', text: '"Not Evaluated" outside the AAA table' },
  { id: 'missing_interface', text: 'Does not cover every interface or platform being bought' },
].map((c) => ({ ...c, state: 'proposed' }));

/**
 * The Veracity floor: the lowest evidence rank on which Severity is confirmed and the risk
 * grade read. It rises with exposure, and an S1 finding always needs rank 4, because minimal
 * impact is shown by demonstration rather than assumed. Every severity carries the floor.
 */
const EVIDENCE_LIMITS = {
  floor: { low: 0, medium: 2, high: 4 },
  s1Floor: 4,
  state: 'proposed', grounds: ['vendor-claims-require-proportionate-validation'],
};
const veracityFloor = (level, severity) => (severity === 'S1'
  ? Math.max(EVIDENCE_LIMITS.s1Floor, EVIDENCE_LIMITS.floor[level]) : EVIDENCE_LIMITS.floor[level]);

// ---------------------------------------------------------------------------------------
// Step 3. Outcomes, routing, grid, and the rules that hold in every cell.
// ---------------------------------------------------------------------------------------
/** The two risk grades the grid gives. Needs TAAP is a grade, never a final decision. */
const RISK_GRADES = { approve: 'Approve', needs_taap: 'Needs TAAP' };

/** The three final decisions, plus the hold state every route produces. */
const OUTCOMES = {
  // S0, S1, and S2 at Low exposure. No TAAP: the template asks for one only when barriers
  // prevent essential functions. A Low S2 approval carries S2_CAVEATS.
  approve: { label: 'Approve', state: 'agreed' },
  // A TAAP at or above the standard, or below it when the pressure is under denyAt or the
  // barriers are S2. A plan below the standard carries a warning.
  approve_with_taap: { label: 'Approve with TAAP', state: 'agreed', grounds: ['proportionate-remedy'] },
  // A deny is a procurement decision, not a TAAP result. The TAAP review is one finding behind it.
  deny: { label: 'Deny', state: 'agreed', grounds: ['vendor-leverage-procurement-as-accessibility-lever'] },
  // No decision yet. `route` names the ROUTING entry, and HOLDERS names who holds the review.
  on_hold: { label: 'On hold', state: 'proposed' },
};

/** Who holds a routed review, by the `route` destination on each ROUTING entry. */
const HOLDERS = {
  president_or_designee: { label: 'the president or a designee with budget authority',
    holds: 'Makes the written determination; the remedy step resumes on receipt' },
  request_evidence: { label: 'the requesting unit',
    holds: 'Obtains the vendor evidence; the review resumes on receipt' },
  request_information: { label: 'the requesting unit',
    holds: 'Answers the open exposure questions; the review resumes on receipt' },
  manual_review: { label: 'the ATI review team',
    holds: 'Raises the evidence with the requesting unit and the vendor, then re-rates Severity; the review resumes at the Severity step, under the fallback when the evidence cannot be raised' },
  request_taap: { label: 'the requesting unit',
    holds: 'Writes the TAAP to the TAAP standard; the remedy step resumes on receipt' },
};

/**
 * Routes 1 to 3 are checked in order before the grid, and the first that applies sets the
 * route. Route 3 is a loop: it resumes at the Severity step with the new findings, or under
 * the fallback when the evidence cannot be raised. Routes 4 and 5 come from the remedy step.
 */
const ROUTING = [
  { id: 'severity_unknown', route: 'request_evidence', state: 'proposed',
    text: 'No ACR, demonstration or testing' },
  { id: 'answers_unknown', route: 'request_information', state: 'proposed',
    text: 'Unknown answers change the exposure band' },
  { id: 'veracity_below_floor', route: 'manual_review', state: 'proposed',
    text: 'The evidence is below the Veracity floor for the exposure level and the severity, and it can still be raised' },
  { id: 'taap_needed', route: 'request_taap', state: 'proposed',
    text: 'The risk grade is Needs TAAP and no TAAP is on file' },
  // The exception is a defence against one required action, here the TAAP standard. It is
  // claimed only where the plan falls below the standard at high pressure, never at intake.
  { id: 'exception_claimed', route: 'president_or_designee', state: 'required',
    text: 'The TAAP falls below the standard at high pressure, and the requesting unit claims that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164, 35.204)',
    grounds: ['bounded-duty-burden-limits'] },
];

/**
 * The grid: exposure by worst severity. It gives the risk grade, a RISK_GRADES key.
 * `resolveTaap` settles Needs TAAP from the TAAP section against the TAAP standard.
 * `requires` lists conditions the approval carries.
 */
const GRID = {
  low: {
    S0: { grade: 'approve' },
    S1: { grade: 'approve' },
    S2: { grade: 'approve' },
    S3: { grade: 'needs_taap' },
  },
  medium: {
    S0: { grade: 'approve' },
    S1: { grade: 'approve' },
    S2: { grade: 'needs_taap' },
    S3: { grade: 'needs_taap' },
  },
  high: {
    S0: { grade: 'approve' },
    S1: { grade: 'approve' },
    S2: { grade: 'needs_taap' },
    S3: { grade: 'needs_taap', requires: ['serves_everyone_from_day_one', 'best_meets_record'] },
  },
};

/** Approval conditions that apply to some kinds of technology only. */
const NEEDS_ICT = { best_meets_record: ['nonweb', 'mixed'] };

/**
 * The Requirements Checklist of the CSU TAAP Authoring Template, quoted. A plan is equally
 * effective only when it meets all six. `failed` words each one for a denial.
 */
const TAAP_REQUIREMENTS = [
  { id: 'same_information', text: 'Allows access to the same information, engagement, and services',
    failed: 'it does not give access to the same information, engagement and services' },
  { id: 'same_availability', text: 'Offers the same availability as the primary solution',
    failed: 'it is not available when the product is' },
  { id: 'independent', text: 'Can be accessed independently without additional assistance',
    failed: 'it cannot be used without another person\'s help' },
  { id: 'no_disparate_burden', text: 'Does not result in disparate burden or impact on the user',
    failed: 'it puts a burden on the user that others do not carry' },
  { id: 'equivalent_ease', text: 'Has substantially equivalent ease of use',
    failed: 'it is not substantially as easy to use' },
  { id: 'protects_privacy', text: 'Protects the privacy of the individuals affected',
    failed: 'it does not protect the privacy of the people affected' },
].map((r) => ({ ...r, state: 'required', source: 'CSU TAAP Authoring Template, Requirements Checklist',
  grounds: ['equally-effective-access'] }));

/**
 * Caveats a Low exposure S2 approval carries instead of a TAAP. Open: the group sets them, and
 * each one needs a binding rule behind it before it goes in.
 */
const S2_CAVEATS = [];

const taapMet = (taap) => TAAP_REQUIREMENTS.filter((r) => taap?.meets?.[r.id] === true).length;

/** The TAAP's own terms, from the CSU TAAP Authoring Template. They do not vary by exposure. */
const TAAP_TERMS = {
  // "reviewed and updated annually or when renewing the ICT". Never extended.
  reviewMonths: 12,
  signers: ['Department Chair/Manager', 'Dean/Division Vice President', 'ADA Compliance Officer'],
  state: 'required', source: 'CSU TAAP Authoring Template, Administrative Approval and Annual Review',
};

/** Exposure levels at which barriers that do not block a task still need a vendor roadmap.
 *  The CSU Vendor Accessibility Roadmap covers medium- and high-impact products. Every
 *  TAAP needs one, because a TAAP is valid only while the vendor remediates. */
const ROADMAP_LEVELS = ['medium', 'high'];

/**
 * The accessibility terms for the PO or contract. Step 4 of the CSU ATI Procurement Process
 * lists them as what the terms "usually include". Complaint resolution is state law.
 */
const STEP_4 = 'CSU ATI Procurement Process, Step 4';
const CONTRACT_TERMS = [
  { id: 'gp_clause_45', text: 'CSU General Provisions for IT Acquisitions, clause 45', appliesTo: 'all', source: STEP_4 },
  { id: 'complaint_resolution', text: 'the vendor responds to and resolves accessibility complaints (Gov Code 7405(b))', appliesTo: 'all', source: 'Gov Code 7405(b)' },
  { id: 'acr_updates', text: 'the vendor updates its ACR and other accessibility documentation regularly, such as each year or after a major release', appliesTo: 'all', source: STEP_4 },
  // The vendor's own statement, distinct from the campus-written TAAP statement below.
  { id: 'accessibility_statement', text: 'the vendor publishes its own accessibility statement for the product, as the CSU recommends', appliesTo: 'all', source: `${STEP_4}; Step 3` },
  { id: 'roadmap_milestones', text: 'the Vendor Accessibility Roadmap, with a contractual commitment to meet its milestones', appliesTo: 'roadmap', source: STEP_4 },
  { id: 'roadmap_demonstration', text: 'a vendor demonstration that validates the ACR claims and the progress on the roadmap', appliesTo: 'roadmap', source: STEP_4 },
].map((t) => ({ ...t, state: 'required' }));

/**
 * The product-specific accessibility statement that the campus writes as part of every TAAP.
 * Quoted from the TAAP Authoring Template. It is not the vendor's statement above.
 */
const TAAP_STATEMENT = {
  includes: [
    'known barriers in the product interface',
    'the impacted disability groups',
    'a reference to the TAAP',
    'a disclaimer that unknown barriers may remain',
    'a contact for further accessibility assistance',
  ],
  postedAt: 'wherever the product is available and in use, including course syllabi where applicable',
  state: 'required', source: 'CSU TAAP Authoring Template, Product Specific Accessibility Statement',
};

// ---------------------------------------------------------------------------------------
// The legal and policy basis for each outcome and route, in plain words for the requester.
// Only rules that bind us belong here: federal and California law, and CSU policy. Federal
// guidance, settlements, court cases elsewhere, peer practice and working group decisions
// are not grounding. Where no binding rule supports the matrix, the text says so. `ict` and `severity` narrow an
// entry to the cases it covers. Sources: matrix-grounding-review.md, unified-matrix-draft.md.
// ---------------------------------------------------------------------------------------
const AUTHORITY_KINDS = {
  federal_law: 'Federal law',
  federal_standard: 'Federal standard, applied by California law',
  state_law: 'California law',
  csu_policy: 'CSU policy',
};
const WEB = ['web', 'mixed'];

// The procurement process never relies on accommodation. An accommodation starts with one
// person's request and an interactive process (EO 1111). TAAP support is different: the
// asset owner gives it, on the terms the TAAP sets in advance, to anyone who needs it.
const TAAP_SUPPORT = [
  { cite: 'Section 508 Standards, E202.7.2 Alternative Means (36 CFR 1194)', kind: 'federal_standard',
    says: 'Where fully conforming technology is not available, the agency "shall provide individuals with disabilities access to and use of information and data by an alternative means that meets identified needs". The duty is the institution\'s, and it is planned before anyone asks.' },
  { cite: 'CSU ATI Procurement Process, Step 3', kind: 'csu_policy',
    says: 'The TAAP sets out how the campus will provide equally effective alternate access "in a timely manner, for anyone that later reports a problem accessing the product". A user reports a problem. They do not have to request an accommodation.' },
  { cite: 'CSU TAAP Authoring Template, Proposed Alternative', kind: 'csu_policy',
    says: 'The TAAP describes the resources and personnel the alternative needs, names the responsible department, and lists the contacts who assist users and when they are available. The department using the product covers the cost.' },
  { cite: 'CSU Executive Order 1111, sections IV.C.4, V.B and VI.B', kind: 'csu_policy',
    says: 'An accommodation comes from an interactive process with one student or employee, in response to that person\'s request. The CSU strives for Universal Design that "will reduce the need for, and costs associated with, individual accommodations for inaccessible technology products". The procurement review does not count on accommodations to provide access.' },
];
const CONTRACT_DUTY = { cite: 'Gov Code 7405(b); CSU General Provisions for IT Acquisitions, clause 45', kind: 'state_law',
  says: 'A vendor that sells technology to the CSU must respond to and resolve accessibility complaints. The contract carries the CSU accessibility terms.' };
const ROADMAP_DUTY = { cite: 'CSU ATI Procurement Process, Steps 3 and 4; CSU Vendor Accessibility Roadmap', kind: 'csu_policy',
  says: 'When the CSU acquires a medium- or high-impact product with identified barriers, the vendor "must demonstrate a commitment to accessibility remediation". The vendor completes an Accessibility Roadmap: each barrier, its status, and a timeline to fix it "in a reasonable and defined period of time". The contract commits the vendor to the roadmap\'s milestones, and a vendor demonstration checks the progress.' };
const RENEWAL = { cite: 'CSU Vendor Accessibility Roadmap, Background; CSU ATI Procurement Process, Step 4', kind: 'csu_policy',
  says: 'The vendor furnishes and updates its accessibility conformance documentation during acquisition and at renewal.' };

const AUTHORITY = {
  approve: [
    { cite: '28 CFR 35.200', kind: 'federal_law', ict: WEB,
      says: 'Web content and mobile apps that a public university provides, directly or through a vendor, must conform to WCAG 2.1 AA.' },
    { cite: 'Gov Code 7405 and 11135', kind: 'state_law', ict: ['nonweb'],
      says: 'California applies the Section 508 Standards to the technology state entities buy. The CSU follows them for software and hardware.' },
    { cite: 'CSU ATI Procurement Process', kind: 'csu_policy',
      says: 'The CSU buys the most accessible product that meets the business need.' },
    // Known barriers that do not block a task. The TAAP line comes from the template's own
    // instructions. The EEAAP clause of the ATI Policy (2024) is deprecated for this tool.
    { cite: 'CSU TAAP Authoring Template, instructions', kind: 'csu_policy', severity: ['S1', 'S2'],
      says: 'A TAAP is needed only when barriers are "severe enough to prevent users from performing essential functions". Failures "that do not prohibit core functionality do not require this process."' },
    { cite: '28 CFR 35.205', kind: 'federal_law', ict: WEB, severity: ['S1'],
      says: 'A nonconformance counts as compliant only when its impact is so small that people with disabilities still get the same information, interactions and transactions. They must get them with substantially equivalent timeliness, privacy, independence and ease of use. The university must be able to show this, so an S1 finding needs strong evidence.' },
    { cite: '28 CFR 35.205', kind: 'federal_law', ict: WEB, severity: ['S2'],
      says: 'An S2 barrier makes a task clearly harder, so it does not meet the minimal-impact test. The law does not excuse it, and the product does not conform.' },
    { cite: 'Section 508 Standards, E202.7 (36 CFR 1194)', kind: 'federal_standard', ict: ['nonweb'], severity: ['S1', 'S2'],
      says: 'Section 508 has no minimal-impact exception. A product that does not conform is acceptable only when no conforming product meets the need, and the record shows the market research.' },
    { ...ROADMAP_DUTY, severity: ['S1', 'S2'], exposure: ROADMAP_LEVELS },
    CONTRACT_DUTY,
    RENEWAL,
  ],
  approve_with_taap: [
    { cite: 'CSU TAAP Authoring Template, instructions', kind: 'csu_policy', severity: ['S3'],
      says: 'A TAAP is needed when barriers are "severe enough to prevent users from performing essential functions".' },
    // Broad S2: no single barrier blocks a task, but together they are more than minimal impact.
    { cite: '28 CFR 35.205', kind: 'federal_law', ict: WEB, severity: ['S2'],
      says: 'A nonconformance is excused only when its impact is so minimal that people with disabilities still get the same information, interactions and transactions, with substantially equivalent timeliness, privacy, independence and ease of use. At Medium or High exposure, barriers that make tasks clearly harder reach too many people for the impact to be minimal, even though none blocks a task.' },
    { cite: 'CSU Executive Order 1111, section IV', kind: 'csu_policy', severity: ['S2'],
      says: '"Accessible" means equal information, interactions and services "in an equally effective and equally integrated manner, with substantially equivalent ease of use." Technology access "must provide comparable functionality, affordability, and timeliness."' },
    { cite: 'CSU TAAP Authoring Template, Requirements Checklist', kind: 'csu_policy',
      says: 'To qualify as an equally effective alternative, the plan must meet all six requirements.' },
    { cite: 'CSU TAAP Authoring Template, Process Outcome and Institutional Risk', kind: 'csu_policy',
      says: 'The template sorts a plan by how many of the six requirements it meets. All six is Equally Effective, with low institutional risk. One to five is a Non-Equal Alternative with moderate risk, where "staff should be prepared to provide additional support for affected individuals." None is a need for individualized accommodation, with high risk. The template sets these risk levels, and the matrix sets how many requirements a plan must meet at each exposure. No rule sets those counts.' },
    ...TAAP_SUPPORT,
    { cite: 'CSU TAAP Authoring Template, Administrative Approval', kind: 'csu_policy',
      says: 'The TAAP is signed by the Department Chair or Manager, the Dean or Division Vice President, and the ADA Compliance Officer. Each signer confirms they have "evaluated the associated institutional risks and accommodation requirements" and found the plan "an acceptable interim solution."' },
    { cite: 'CSU TAAP Authoring Template, Product Specific Accessibility Statement', kind: 'csu_policy',
      says: 'The TAAP includes "a concise accessibility statement tailored specifically to this product (not your general campus-wide accessibility statement)". The statement lists known barriers, impacted disability groups and the alternative, and it is posted "wherever the product is available and in use."' },
    { cite: 'CSU TAAP Authoring Template, Annual Review', kind: 'csu_policy',
      says: 'A TAAP is temporary. It "must be reviewed and updated annually or when renewing the ICT".' },
    { cite: 'CSU TAAP Authoring Template, If the Vendor Fails to Meet Compliance Requirements', kind: 'csu_policy',
      says: 'A TAAP stays valid only while the vendor is actively remediating. If a review finds no measurable progress, the TAAP is no longer valid. Keeping the product then needs a formal risk memo signed by executive leadership, repeated every year, and the template strongly discourages it.' },
    { cite: 'CSU ATI Procurement Process, Step 3; CSU TAAP Authoring Template, Referenced Documentation', kind: 'csu_policy',
      says: 'When an acquisition with barriers is approved, the ATI reviewer obtains an Accessibility Roadmap from the vendor and creates the TAAP. The roadmap is "a specific plan by the Vendor to remediate identified accessibility gaps in a reasonable and defined period of time", and the TAAP links to it.' },
    { ...ROADMAP_DUTY, exposure: ROADMAP_LEVELS },
    { cite: '28 CFR 35.204', kind: 'federal_law', ict: WEB,
      says: 'Web content or a mobile app may fall short of WCAG 2.1 AA only where conforming would be an undue burden or a fundamental alteration. The head of the university or a designee decides that in writing. The university must still give access to the greatest extent it can.' },
    { cite: 'Section 508 Standards, E202.7 (36 CFR 1194)', kind: 'federal_standard', ict: ['nonweb'],
      says: 'When no conforming product meets the need, the CSU buys the product that best meets the standard and documents why. It provides the information and functions to people with disabilities by an alternative means.' },
    { cite: '28 CFR 35.130(b)(1); 34 CFR 104.4(b)', kind: 'federal_law',
      says: 'An aid or service given to people with disabilities must be as effective as what others get. An alternative with fewer functions does not meet this. The law does not scale with exposure, so a plan that meets fewer than six requirements is a risk the signers accept, not a compliant result.' },
    { cite: '28 CFR 35.160(b)(2)', kind: 'federal_law',
      says: 'An alternative must be timely, protect privacy and allow independent use.' },
    { cite: '28 CFR 35.130(e)', kind: 'federal_law',
      says: 'A person may decline the alternative.' },
    { cite: 'CSU Executive Order 1111', kind: 'csu_policy',
      says: 'CSU policy requires equally effective access for people with disabilities.' },
    CONTRACT_DUTY,
  ],
  // Deny is the procurement lever ("Procurement as an accessibility lever"). The principle
  // holds a denial to product-specific findings, a stated threshold and a path to approval.
  deny: [
    { cite: 'CSU Accessible Technology Initiative Policy (2024)', kind: 'csu_policy',
      says: '"The CSU seeks to improve product accessibility through partnerships and by leveraging the procurement process." Campus procurement must follow Section 508 requirements for all acquired technology.' },
    { cite: 'CSU ATI Procurement Process, Step 3', kind: 'csu_policy',
      says: 'The ATI reviewer approves or denies the acquisition based on the review findings. A denial is recorded with a detailed rationale, and each campus provides a way to request reconsideration.' },
    { cite: 'Gov Code 7405', kind: 'state_law',
      says: 'California applies the Section 508 Standards when the CSU procures technology.' },
    { cite: '28 CFR 35.130(b)(1); 34 CFR 104.4(b)(1)', kind: 'federal_law',
      says: 'A university may not give people with disabilities an aid, benefit or service that is unequal to, or less effective than, what others get.' },
    { cite: '28 CFR 35.130(b)(3)', kind: 'federal_law',
      says: 'A university may not use methods of administration that have the effect of discriminating on the basis of disability. Requiring a product that some users cannot use can have that effect.' },
    { cite: 'Section 508 Standards, E202.7; CSU ATI Procurement Process', kind: 'csu_policy', reason: ['more_accessible_product'],
      says: 'When a more accessible product meets the need, the CSU chooses it.' },
    { cite: 'CSU TAAP Authoring Template, Process Outcome and Administrative Approval', kind: 'csu_policy', reason: ['taap_below_standard'],
      says: 'A plan that meets fewer than six requirements is a Non-Equal Alternative with moderate institutional risk, and the signers must accept that risk. At high exposure, or where the barriers block many tasks, the matrix does not ask them to: the plan must meet the TAAP standard or the request is denied, unless the president or a designee determines in writing that equally effective access would be an undue burden or a fundamental alteration. The standard is the matrix\'s, stated in the denial, not a number in any rule.' },
    { cite: 'CSU TAAP Authoring Template, Process Outcome', kind: 'csu_policy', reason: ['no_alternative'],
      says: 'A plan that meets none of the six requirements is "unable to provide alternative means of access", and the template calls it a high risk to the institution. Access would then depend entirely on individual accommodation.' },
    { cite: 'CSU Executive Order 1111, section IV.C.4', kind: 'csu_policy', reason: ['no_alternative'],
      says: 'The CSU strives for Universal Design that "will reduce the need for, and costs associated with, individual accommodations for inaccessible technology products." The procurement review does not approve a product whose access rests on accommodation.' },
  ],
  // Routes. Manual review is not an answer about the barrier, so each route has its own basis.
  exception_claimed: [
    { cite: '28 CFR 35.164 and 35.204', kind: 'federal_law', ict: WEB,
      says: 'Only the head of the university or a designee may decide that conforming is an undue burden or a fundamental alteration. The decision is in writing and considers all resources available to the program. The university carries the burden of proof, and it must still give access to the maximum extent possible.' },
    { cite: '28 CFR 35.164', kind: 'federal_law', ict: ['nonweb'],
      says: 'Only the head of the university or a designee may decide that an access duty is an undue burden or a fundamental alteration. The decision is in writing and considers all resources available to the program.' },
    { cite: 'Section 508 Standards, E202.6 (36 CFR 1194)', kind: 'federal_standard', ict: ['nonweb'],
      says: 'An undue-burden claim is documented. The information and functions are still provided by an alternative means.' },
    { cite: 'CSU guidance on Title II defenses', kind: 'csu_policy',
      says: 'The CSU reads "all resources" as the resources of the whole university. High cost alone is not enough.' },
  ],
  severity_unknown: [
    { cite: 'CSU ATI Procurement Process, Step 2', kind: 'csu_policy',
      says: 'The CSU asks for a current Accessibility Conformance Report for each interface before it buys.' },
  ],
  answers_unknown: [
    { cite: 'CSU ATI Procurement Process', kind: 'csu_policy',
      says: 'The depth of review depends on how the product will be used. The review cannot be sized without those facts.' },
  ],
  veracity_below_floor: [
    { cite: 'CSU ATI success indicator 1.8-pro', kind: 'csu_policy',
      says: 'Each campus has a process to validate vendors\' conformance claims.' },
    { cite: 'CSU ATI Procurement Process, Step 3', kind: 'csu_policy',
      says: 'The ATI reviewer approves or denies the acquisition based on the review findings. The findings are confirmed before the decision is made.' },
  ],
};

// Before a TAAP is on file (route 4), the case is held to the rules the TAAP must meet.
AUTHORITY.taap_needed = AUTHORITY.approve_with_taap;

/** The entries that bear on one determination. */
function authorityFor(key, ictKind, severity, denyReason = null, level = null) {
  return (AUTHORITY[key] ?? []).filter((a) =>
    (!a.ict || a.ict.includes(ictKind)) && (!a.severity || a.severity.includes(severity))
    && (!a.reason || a.reason.includes(denyReason)) && (!a.exposure || a.exposure.includes(level)));
}

/** How far the barriers reach together: blocked task and group pairs, and S2 findings. */
const pairKey = (f) => `${f.coreTask || f.role}|${f.group}`;

/**
 * S2 barriers that add up to S3. A user finishes a task only by passing every barrier on it,
 * so S2 barriers stacked on one task block it. At high exposure, S2 barriers spread across
 * most of the product are more than minimal impact taken together.
 */
function accumulation(review, level) {
  const c = CALIBRATION.accumulation;
  const counts = {};
  for (const f of review.findings.filter((x) => x.severity === 'S2')) counts[pairKey(f)] = (counts[pairKey(f)] ?? 0) + 1;
  const stacked = Object.entries(counts).filter(([, n]) => n >= c.stack).map(([k, n]) => {
    const [task, group] = k.split('|');
    return { task, group, count: n };
  });
  const spreadPairs = Object.keys(counts).length;
  const spread = level === c.spreadAt && spreadPairs >= c.spreadPairs;
  return { stacked, spreadPairs, escalated: stacked.length ? 'stacked' : spread ? 'spread' : null };
}

function breadth(review, stacked = []) {
  const c = CALIBRATION.breadth;
  const blocked = new Set([...review.findings.filter((f) => f.severity === 'S3').map(pairKey),
    ...stacked.map((s) => `${s.task}|${s.group}`)]).size;
  const harder = review.findings.filter((f) => f.severity === 'S2').length;
  const level = Math.min(2, (blocked >= c.blockedCuts[1] ? 2 : blocked >= c.blockedCuts[0] ? 1 : 0)
    + (harder >= c.s2AddsAt ? 1 : 0));
  return { level, blocked, harder };
}

/**
 * The TAAP standard: how many of the six requirements a plan must meet, set by the pressure of
 * exposure and breadth. The warning rises with the pressure and with any shortfall. Before a
 * TAAP is on file the shortfall is unknown, and the warning reflects the pressure alone.
 */
function taapStandard(review, level, breadthLevel) {
  const c = CALIBRATION.taapStandard;
  const pressure = rank(level) + breadthLevel;
  const required = c.required[pressure];
  const met = review.taap?.exists ? taapMet(review.taap) : null;
  const shortfall = met == null ? null : Math.max(0, required - met);
  const w = pressure + (shortfall ?? 0);
  const warning = w >= c.warning.high ? 'high' : w >= c.warning.elevated ? 'elevated' : 'low';
  return { pressure, required, met, shortfall, warning, denyAt: c.denyAt, state: 'calibrate' };
}

// ---------------------------------------------------------------------------------------
// The record.
// ---------------------------------------------------------------------------------------

/**
 * @typedef {'low'|'medium'|'high'} Level
 *
 * @typedef {Object} Answer        One exposure fact. Both values are kept so overrides show.
 * @property {Level|number|null} requester
 * @property {Level|number|null} [reviewer]
 * @property {string} [overrideReason]
 *
 * @typedef {Object} Finding       One barrier, per role and functional group.
 * @property {string} role         one of ROLES
 * @property {string} group        one of FUNCTIONAL_GROUPS
 * @property {string} coreTask
 * @property {'S0'|'S1'|'S2'|'S3'} severity
 * @property {string[]} [wcag]     success criteria, as evidence
 *
 * @typedef {Object} Review        What the reviewer supplies.
 * @property {keyof ICT_KINDS} ictKind
 * @property {string[]} floors     ids from FLOORS that are true
 * @property {Object<string, Answer>} answers   keyed by factor id
 * @property {Finding[]} findings
 * @property {string} evidence     id from EVIDENCE
 * @property {'open'|'unavailable'} [validation]  whether the evidence can still be raised. The ATI
 *           review team records 'unavailable' when no demonstration is offered and it has no test
 *           access; the review then proceeds under the fallback
 * @property {boolean} [moreAccessibleProductExists]
 * @property {string} [taap.exception]  'none', 'claimed' or 'determined': an undue burden or fundamental
 *           alteration claim by the requesting unit, or the written determination on file
 * @property {{exists: boolean, meets: Object<string, boolean>}} [taap]  the TAAP section;
 *           `meets` is keyed by TAAP_REQUIREMENTS id
 *
 * @typedef {Object} Determination What `evaluate` returns and the record keeps.
 * @property {string} matrixVersion
 * @property {Object} standard
 * @property {{level: Level, floorsApplied: string[], groupLevels: Object<string, Level>,
 *             scorePct: number, unknownCount: number}} exposure
 * @property {string} severity     'S0'..'S3', 'S?' when unknown, 'S3 (accumulated)' or 'S3 (provisional)'
 * @property {boolean} fallback    the evidence cannot be raised to the floor, so Severity is S3
 *           (provisional) with the barriers found as a minimum
 * @property {string} evidence
 * @property {string} outcome      key of OUTCOMES; 'on_hold' whenever `route` is set
 * @property {string|null} route   id from ROUTING, when one applied
 * @property {string[]} requires   conditions the approval carries
 * @property {string|null} approver  the TAAP signers, when a TAAP is involved
 * @property {{months: number, contract: Level|null}|null} taapReview  when the TAAP is
 *           reviewed: every `months`, or at renewal if sooner; `contract` is the contract length
 * @property {{level: number, blocked: number, harder: number}} breadth
 * @property {{pressure: number, required: number, met: number|null, shortfall: number|null,
 *             warning: 'low'|'elevated'|'high', denyAt: number}|null} taapStandard
 *           set whenever the risk grade is Needs TAAP, including on route 4
 * @property {boolean} taapOnFile
 * @property {boolean} exception    the plan is approved under a written determination (28 CFR 35.204)
 * @property {string[]} caveats     S2_CAVEATS ids a Low exposure S2 approval carries
 * @property {boolean} roadmap      the vendor completes the CSU Vendor Accessibility Roadmap
 * @property {string[]} contractTerms
 * @property {string|null} denyReason  'more_accessible_product', 'no_alternative' or 'taap_below_standard'
 * @property {string[]} taapUnmet       TAAP_REQUIREMENTS ids the TAAP does not meet
 * @property {{cite: string, kind: string, says: string}[]} authority  the legal and policy basis
 */

const rank = (level) => LEVELS.indexOf(level);
const maxLevel = (levels) => levels.reduce((a, b) => (rank(b) > rank(a) ? b : a), 'low');

function factorLevel(factor, answer) {
  const value = answer ? (answer.reviewer ?? answer.requester) : null;
  if (value == null) return null;
  if (!factor.numeric) return value;
  const [lo, hi] = CALIBRATION.userCuts;
  return value <= lo ? 'low' : value <= hi ? 'medium' : 'high';
}

function scoreGroups(groupLevels) {
  const total = GROUPS.reduce((s, g) => s + CALIBRATION.weights[g.id] * rank(groupLevels[g.id]), 0);
  const max = GROUPS.reduce((s, g) => s + CALIBRATION.weights[g.id] * 2, 0);
  return total / max;
}

function band(pct) {
  return pct >= CALIBRATION.bands.high ? 'high' : pct >= CALIBRATION.bands.medium ? 'medium' : 'low';
}

/** Exposure from floors and groups. Unknowns are scored high and counted. */
function exposure(review) {
  const floorsApplied = FLOORS.filter((f) => review.floors.includes(f.id));
  let unknownCount = 0;
  const groupLevels = {};
  const knownLevels = {};
  for (const g of GROUPS) {
    const levels = g.factors.map((f) => factorLevel(f, review.answers[f.id]));
    unknownCount += levels.filter((l) => l == null).length;
    groupLevels[g.id] = maxLevel(levels.map((l) => l ?? 'high'));
    knownLevels[g.id] = maxLevel(levels.filter((l) => l != null));
  }
  const scorePct = scoreGroups(groupLevels);
  const floor = maxLevel(floorsApplied.map((f) => f.min));
  const level = maxLevel([floor, band(scorePct)]);
  const unknownsMatter = band(scoreGroups(knownLevels)) !== band(scorePct) && rank(floor) < rank(band(scorePct));

  return { level, floorsApplied: floorsApplied.map((f) => f.id), groupLevels,
    scorePct: Math.round(scorePct * 100), unknownCount, unknownsMatter };
}

/** Worst severity across all roles' core paths, or 'S?' with no findings and no evidence. */
function worstSeverity(review) {
  if (!review.findings.length) return review.evidence === 'E0' ? 'S?' : 'S0';
  return review.findings.reduce((w, f) => (Number(f.severity[1]) > Number(w[1]) ? f.severity : w), 'S0');
}

/**
 * Settle a Needs TAAP risk grade. Returns [outcome, reason, basis]: the deny reason for a Deny,
 * the route id for on_hold, and basis 'exception' when a written determination carries the plan.
 */
function resolveTaap(review, severity, std) {
  // At S3 the CSU buys the more accessible product, even when a TAAP could be written.
  if (severity === 'S3' && review.moreAccessibleProductExists) return ['deny', 'more_accessible_product', null];
  if (!review.taap?.exists) return ['on_hold', 'taap_needed', null];
  if (std.shortfall === 0 || severity === 'S2') return ['approve_with_taap', null, null];   // S2 is never denied
  // A plan that meets nothing leaves access to individual accommodation. No determination
  // rescues it, because the law still requires some other action to the maximum extent possible.
  if (std.met === 0) return ['deny', 'no_alternative', null];
  if (std.pressure < std.denyAt) return ['approve_with_taap', null, null];   // the signers accept the shortfall
  // Below the standard at high pressure, a Non-Equal Alternative is lawful only under a written
  // undue burden or fundamental alteration determination (28 CFR 35.204; 508 E202.6).
  const exception = review.taap.exception ?? 'none';
  if (exception === 'determined') return ['approve_with_taap', null, 'exception'];
  if (exception === 'claimed') return ['on_hold', 'exception_claimed', null];
  return ['deny', 'taap_below_standard', null];
}

/**
 * Apply the matrix to one review.
 * @param {Review} review
 * @returns {Determination}
 */
function evaluate(review) {
  const exp = exposure(review);
  let severity = worstSeverity(review);
  const unknownSeverity = severity === 'S?';
  const unavailable = review.validation === 'unavailable';
  const ev = EVIDENCE.find((e) => e.id === review.evidence);
  const base = { matrixVersion: MATRIX_VERSION, standard: ICT_KINDS[review.ictKind],
    exposure: exp, severity, evidence: ev.id, breadth: breadth(review), accumulation: null, fallback: false, requires: [], approver: null,
    taapReview: null, taapStandard: null, roadmap: false, contractTerms: [] };

  const routed = (route) => ({ ...base, outcome: 'on_hold', route,
    authority: authorityFor(route, review.ictKind, severity) });
  if (unknownSeverity && !unavailable) return routed('severity_unknown');
  const acc = accumulation(review, exp.level);
  base.accumulation = acc;
  // With no evidence at all, the barriers are assumed to reach widely, as unknown answers are.
  base.breadth = unknownSeverity ? { level: 2, blocked: 0, harder: 0, assumed: true } : breadth(review, acc.stacked);
  if (severity === 'S2' && acc.escalated) {
    severity = 'S3';                         // S2 barriers that add up to a blocked task
    base.severity = 'S3 (accumulated)';
  }
  if (exp.unknownsMatter) return routed('answers_unknown');
  // Severity read from the evidence on file is a minimum until the evidence meets the floor.
  // Below it, the ATI review team raises the evidence and the review resumes here (route 3).
  if (unknownSeverity || ev.rank < veracityFloor(exp.level, severity)) {
    if (!unavailable) return routed('veracity_below_floor');
    // The fallback. Unproven conformance is treated as hiding a blocking barrier, so the TAAP
    // is the remedy. The barriers found stay as a minimum, and Breadth stays as found.
    severity = 'S3';
    base.severity = 'S3 (provisional)';
    base.fallback = true;
  }

  const cell = GRID[exp.level][severity];
  const std = cell.grade === 'needs_taap' ? taapStandard(review, exp.level, base.breadth.level) : null;
  if (std) std.provisional = base.fallback;   // the standard may rise when evidence arrives
  // Deny stands on the evidence in hand: weak evidence can hide barriers but not invent them,
  // so the pressure and the standard computed from the findings on file are minimums.
  const [outcome, reason, basis] = std ? resolveTaap(review, severity, std) : [cell.grade, null, null];
  const denyReason = outcome === 'deny' ? reason : null;
  const held = outcome === 'on_hold';        // a TAAP route: no TAAP on file, or a claim referred
  const withTaap = held || outcome === 'approve_with_taap';
  const roadmap = withTaap || (outcome === 'approve' && severity !== 'S0' && ROADMAP_LEVELS.includes(exp.level));
  const taapUnmet = review.taap?.exists
    ? TAAP_REQUIREMENTS.filter((r) => review.taap.meets?.[r.id] !== true).map((r) => r.id) : [];
  const contractFactor = GROUPS.flatMap((g) => g.factors).find((f) => f.id === 'contract_length');
  return {
    ...base,
    outcome,
    route: held ? reason : null,
    requires: outcome === 'deny' ? [] : [
      ...(cell.requires ?? []).filter((r) => !NEEDS_ICT[r] || NEEDS_ICT[r].includes(review.ictKind)),
      ...(basis === 'exception' ? ['exception_record'] : []),
      ...(base.fallback ? ['validation_at_review'] : []),
    ],
    exception: basis === 'exception',
    approver: withTaap ? list(TAAP_TERMS.signers.map((s) => `the ${s.replace('/', ' or ')}`)) : null,
    taapReview: withTaap
      ? { months: TAAP_TERMS.reviewMonths, contract: factorLevel(contractFactor, review.answers.contract_length) } : null,
    taapStandard: std,
    taapOnFile: Boolean(review.taap?.exists),
    caveats: outcome === 'approve' && severity === 'S2' ? S2_CAVEATS.map((c) => c.id) : [],
    roadmap,
    contractTerms: outcome === 'deny' ? []
      : CONTRACT_TERMS.filter((t) => t.appliesTo === 'all' || roadmap).map((t) => t.id),
    denyReason,
    taapUnmet,
    authority: authorityFor(held ? reason : outcome, review.ictKind, severity, denyReason, exp.level),
  };
}

// ---------------------------------------------------------------------------------------
// Plain-language grading, for the requester. Prose follows writing-style.md. Asks name the
// requester as the actor; descriptions of the review state use domain terms.
// ---------------------------------------------------------------------------------------
/** How each functional group reads after a role: "students who are blind". */
const WHO = {
  without_vision: 'who are blind',
  limited_vision: 'with low vision',
  without_color_perception: 'who cannot perceive color',
  without_hearing: 'who are deaf',
  limited_hearing: 'who are hard of hearing',
  without_speech: 'who do not use speech',
  limited_manipulation: 'with limited use of their hands',
  limited_reach_and_strength: 'with limited reach or strength',
  limited_language_cognitive_learning: 'with language, cognitive or learning disabilities',
};
const ROLE_WORD = { students: 'students', employees: 'employees', applicants: 'applicants', public: 'members of the public' };
const SEVERITY_WORD = { S0: 'no barriers found', S1: 'a minor barrier', S2: 'a major barrier', S3: 'a critical barrier' };
const KIND_PHRASE = {
  web: 'The review standard for a web or mobile product is WCAG 2.1 AA, under ADA Title II.',
  nonweb: 'The review standard for non-web software or hardware is the Section 508 Standards, which California law applies to the CSU.',
  mixed: 'The review standard for the web and mobile parts is WCAG 2.1 AA, under ADA Title II.',
};
const BECAUSE = {
  required_for_grade: 'the product is required of students for coursework or a grade',
  only_route_to_service: 'the product is the only route to a university service',
  campus_wide: 'the product is in campus-wide use or in all sections of a course',
  known_user_or_request: 'a person with a disability is a known user, or an accommodation request is open',
  prior_complaint: 'the product has a prior accessibility complaint',
  job_duty_or_hiring: 'the product is required for a job duty or used in hiring',
  public: 'the product is open to the public',
};
const GROUP_PHRASE = {
  reach: 'reach (audience size and deployment scope)',
  stakes: 'stakes (required use and criticality)',
  spread: 'spread (published content)',
  duration: 'duration (frequency of use and contract length)',
};
const EVIDENCE_PHRASE = {
  E0: 'no accessibility evidence',
  'E1-': 'a vendor ACR that fails one of our quality checks',
  E1: 'a vendor ACR that passes our quality checks',
  'E1+': 'a vendor ACR with the GSA issue-level supplement',
  E2a: 'a live vendor demonstration of the main tasks with assistive technology',
  E2b: 'a third-party audit with a named test method',
  E3: 'testing by the ATI team',
};
const ASK = {
  users: 'how many people will use it',
  scope: 'how widely it will be deployed',
  required_use: 'whether anyone is required to use it',
  criticality: 'how critical the program or service is',
  publishes: 'whether it publishes content, and for whom',
  frequency: 'how often it will be used',
  contract_length: 'the length of the contract',
};
/** The name of each exposure answer, for statements about the answer rather than asks. */
const ANSWER_NAME = {
  users: 'user count',
  scope: 'deployment scope',
  required_use: 'required use',
  criticality: 'criticality',
  publishes: 'published content',
  frequency: 'frequency of use',
  contract_length: 'contract length',
};
const NEEDS = {
  serves_everyone_from_day_one: 'The alternate access plan serves every affected person from the first day of use.',
  best_meets_record: 'A best-meets record with market research is on file (Section 508 E202.7).',
  exception_record: 'A written determination by the president or a designee is on file that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164, 35.204), listing the support that remains for each missed requirement.',
  validation_at_review: 'The first TAAP review re-rates Severity on evidence at the Veracity floor, which the vendor demonstration under the roadmap terms supplies.',
};
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/** The warning sentence, built from what raised it: pressure, shortfall, or both. */
function warningText(std) {
  if (std.warning === 'low') return 'The warning level is low.';
  const causes = [];
  if (std.pressure >= CALIBRATION.taapStandard.warning.elevated) causes.push('exposure and barrier reach set a strict standard');
  if (std.shortfall) causes.push(`the plan is ${plural(std.shortfall, 'requirement')} short of the standard`);
  const lines = [`The warning level is ${std.warning}, because ${causes.join(', and ')}.`];
  if (std.warning === 'high' && !std.shortfall) {
    lines.push('A TAAP that meets the standard manages the barriers without removing them. Weigh that risk before buying. A more accessible product would avoid the risk.');
  }
  return lines.join(' ');
}
const DENY_BECAUSE = {
  more_accessible_product: 'a more accessible product meets the same need',
  no_alternative: 'the TAAP on file meets none of the six requirements',
  taap_below_standard: 'the TAAP on file falls below the standard for this exposure',
};
const HEADLINE = {
  exception_claimed: 'Referred for a formal determination',
  severity_unknown: 'On hold: accessibility evidence needed',
  answers_unknown: 'On hold: more information needed',
  veracity_below_floor: 'Manual review: stronger evidence needed',
  taap_needed: 'On hold: TAAP needed',
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Lowercase the first letter, unless the word is an acronym (ATI, CSU).
const lower = (s) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const list = (items) => (items.length < 2 ? items.join('')
  : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const evidenceName = (floor) => (floor >= 4
  ? 'a live demonstration, a third-party audit or ATI testing (E2 or better)'
  : 'a vendor ACR that passes our quality checks (E1 or better)');

/**
 * The grade and its reasoning, ready to paste into an email.
 * @param {Review} review
 * @param {Determination} [d]  the result of evaluate(review); computed when omitted
 * @param {{product?: string, vendor?: string, unit?: string, date?: string}} [ctx]
 * @returns {{headline: string, grade: string, sections: {heading: string, lines: string[], bullets?: boolean}[], text: string, html: string}}
 */
function explain(review, d = evaluate(review), ctx = {}) {
  const product = ctx.product?.trim() || 'This product';
  const kind = ICT_KINDS[review.ictKind];
  const e = d.exposure;
  const sev = d.severity.slice(0, 2);
  const ev = EVIDENCE.find((x) => x.id === d.evidence);
  const headline = d.route ? HEADLINE[d.route] : OUTCOMES[d.outcome].label;
  const sevLabel = d.severity.replace(' (', ', ').replace(')', '');   // "S3, provisional"
  const grade = `Exposure ${cap(e.level)} | ${sev === 'S?' ? 'Barriers unknown' : `${cap(SEVERITY_WORD[sev])} (${sevLabel})`} | Evidence ${ev.id}`;

  // How we graded it
  const how = [];
  how.push(KIND_PHRASE[review.ictKind]);
  const floors = FLOORS.filter((f) => e.floorsApplied.includes(f.id));
  const groupText = GROUPS.map((g) => `${GROUP_PHRASE[g.id]} ${e.groupLevels[g.id]}`).join('; ');
  how.push(floors.length
    ? `Exposure is ${e.level} because ${list(floors.map((f) => BECAUSE[f.id]))}, ${floors.length > 1 ? 'facts that each set' : 'a fact that sets'} a minimum exposure on ${floors.length > 1 ? 'their' : 'its'} own. Apart from ${floors.length > 1 ? 'those facts' : 'that fact'}, the exposure groups rate ${groupText}.`
    : `Exposure is ${e.level}, at ${e.scorePct} percent of the maximum score. The exposure groups rate ${groupText}.`);
  const unknown = Object.keys(ASK).filter((k) => { const a = review.answers[k]; return !a || (a.reviewer ?? a.requester) == null; });
  if (unknown.length) how.push(`${unknown.length === 1 ? 'The answer on' : 'Answers on'} ${list(unknown.map((k) => ANSWER_NAME[k]))} ${unknown.length === 1 ? 'is missing and maps' : 'are missing and map'} to the highest level.`);
  const overridden = Object.keys(ASK).filter((k) => { const a = review.answers[k]; return a && a.reviewer != null && a.requester != null && a.reviewer !== a.requester; });
  if (overridden.length) how.push(`The reviewer changed the answer for ${list(overridden.map((k) =>
    `${ANSWER_NAME[k]} (requester answer ${review.answers[k].requester}, reviewer answer ${review.answers[k].reviewer})`))}.`);
  const worst = review.findings.filter((f) => f.severity === sev);
  const acc = d.accumulation;
  if (sev === 'S?') how.push('No accessibility evidence exists yet, so the barriers are unknown.');
  else if (d.fallback) how.push(d.breadth.assumed
    ? 'No accessibility evidence can be obtained, so the review treats the product as S3 with wide barrier reach.'
    : `The evidence cannot be raised to the Veracity floor for this exposure, so the review treats the product as S3, ${review.findings.length ? 'with the barriers found as a minimum' : 'because the ACR claim of no barriers is unverified'}.`);
  else if (!review.findings.length) how.push('No barriers appear on any user path.');
  else if (d.severity.includes('accumulated')) {
    how.push('No single barrier stops a user, but the S2 barriers, which make tasks clearly harder, add up to a critical barrier (S3).');
    if (acc.stacked.length) {
      how.push(`${cap(list(acc.stacked.map((s) => `users ${WHO[s.group]} meet ${s.count} such barriers on "${s.task}"`)))}. Task completion is conditional on every barrier on the task, so ${CALIBRATION.accumulation.stack} or more S2 barriers on one task block that task.`);
    } else {
      how.push(`At high exposure, S2 barriers cover ${acc.spreadPairs} pairs of task and user group, at or above the critical threshold of ${CALIBRATION.accumulation.spreadPairs} pairs.`);
    }
  } else {
    const effect = { S1: 'meet minor barriers in', S2: 'need clearly more time or effort to complete', S3: 'cannot independently complete' }[sev];
    const who = worst.map((f) => `${ROLE_WORD[f.role]} ${WHO[f.group]} ${effect} ${f.coreTask ? `"${f.coreTask}"` : 'a core task'}`);
    how.push(`The most serious finding is ${SEVERITY_WORD[sev]} (${sev}). ${cap(list(who))}.`);
    const others = review.findings.length - worst.length;
    if (others) how.push(`The review also found ${plural(others, 'less serious barrier')}.`);
  }
  how.push(ev.id === 'E0' ? 'No accessibility evidence is on file (E0).' : `The evidence on file is ${EVIDENCE_PHRASE[ev.id]} (${ev.id}).`);

  // Why this result
  const why = [];
  const pending = d.route === 'taap_needed';
  const referred = d.route === 'exception_claimed';
  const floor = veracityFloor(e.level, sev);
  switch (d.route) {
    case 'severity_unknown':
      why.push('An accessibility grade requires evidence, and none is on file.');
      why.push('Please ask the vendor for a current Accessibility Conformance Report on the WCAG edition, or arrange a live demonstration of the main tasks with assistive technology.');
      break;
    case 'answers_unknown':
      why.push('The missing answers could change the exposure level, which sets the depth of review.');
      why.push(`Please tell us ${list(unknown.map((k) => ASK[k]))}.`);
      break;
    case 'veracity_below_floor':
      why.push(`At ${e.level} exposure, ${sev === 'S0' ? 'a finding of no barriers' : `a finding of ${SEVERITY_WORD[sev]} (${sev})`} needs ${evidenceName(floor)} before the review proceeds.`);
      why.push(`The evidence on file is ${EVIDENCE_PHRASE[ev.id]} (${ev.id}).`);
      why.push('The ATI review team raises the evidence with you and the vendor, through a live demonstration of the main tasks with assistive technology or its own testing, and then re-rates the barriers.');
      why.push('If the evidence cannot be raised, the review treats the product as having a critical barrier (S3) and requires an alternate access plan (TAAP).');
      break;
    case 'taap_needed':
    case 'exception_claimed':
    default:
      if (d.outcome === 'approve' && sev === 'S0') {
        why.push('No barriers appear on any user path, so the product is approved.');
      } else if (d.outcome === 'approve' && sev === 'S1') {
        why.push('The barriers found make some tasks harder without stopping task completion.');
        why.push('The CSU TAAP template requires an alternate access plan (TAAP) only for barriers that prevent essential functions. The product is approved without a TAAP.');
      } else if (d.outcome === 'approve') {
        why.push('The barriers found make some tasks clearly harder without stopping task completion.');
        why.push('At low exposure, the product is approved without an alternate access plan (TAAP).');
        why.push('The product still fails the standard, and the law excuses no barrier this serious.');
      } else if (pending || referred || d.outcome === 'approve_with_taap' || d.outcome === 'deny') {
        const std = d.taapStandard;
        const approved = d.outcome === 'approve_with_taap';
        if (sev === 'S2') {
          why.push('The barriers found make some tasks clearly harder without stopping task completion.');
          why.push(`At ${e.level} exposure, the audience is too large for a minimal impact on access, so the product ${approved ? 'is approved with' : 'needs'} an alternate access plan (TAAP).`);
        } else {
          why.push(`${d.severity.includes('accumulated') ? 'Together, the barriers stop' : 'A barrier stops'} some users from completing a core task, so the product ${approved ? 'is approved only with' : 'cannot be approved without'} an alternate access plan (TAAP).`);
        }
        const unmet = TAAP_REQUIREMENTS.filter((r) => d.taapUnmet.includes(r.id));
        const need = std ? (std.required === 6 ? 'all six' : `at least ${std.required} of the six`) : '';
        const scale = d.breadth.level ? `at ${e.level} exposure, with barriers that reach ${d.breadth.level === 2 ? 'widely' : 'several tasks or groups'}` : `at ${e.level} exposure`;
        if (d.denyReason === 'more_accessible_product') {
          why.push('A more accessible product meets the same need, and the university must buy the most accessible product that meets its requirements.');
          why.push('An alternate access plan for this product would not change that requirement.');
        } else if (d.denyReason === 'no_alternative') {
          why.push('The TAAP on file meets none of the six CSU requirements, so it gives no alternative access.');
          why.push('Access would then rest entirely on individual accommodation, which is no basis for procurement approval.');
        } else if (std) {
          why.push(`For this product, ${scale}, a TAAP must meet ${need} CSU requirements for equally effective access.`);
          if (d.fallback) {
            why.push(d.breadth.assumed
              ? 'No accessibility evidence can be obtained, so the review assumes wide barrier reach and the strictest standard.'
              : 'The evidence cannot be raised to the Veracity floor, so the barriers found are a minimum and the standard may rise when evidence arrives.');
          }
          if (!d.taapOnFile) {
            why.push('No TAAP is on file yet.');
            if (sev === 'S2' || std.pressure < std.denyAt) {
              why.push('A TAAP below that standard can still gain approval, with named support for each missed requirement and signer acceptance of the shortfall risk.');
            } else {
              why.push('At this exposure, a TAAP below that standard leads to a denial.');
            }
          } else {
            why.push(std.shortfall
              ? `The TAAP on file meets ${std.met} of the six, ${plural(std.shortfall, 'requirement')} short of the standard.`
              : `The TAAP on file meets ${std.met === 6 ? 'all six' : `${std.met} of the six`}, which meets the standard.`);
            if (unmet.length) why.push(`The plan falls short where ${list(unmet.map((r) => r.failed))}.`);
            if (d.denyReason === 'taap_below_standard') {
              why.push('At this exposure, signer acceptance of a below-standard plan is not available.');
              why.push('The requesting unit may ask the president or a designee for a written determination that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164 and 35.204). With that determination on file, the plan can be approved as a Non-Equal Alternative.');
            } else if (referred) {
              why.push('At this exposure, signer acceptance of a below-standard plan is not available, and the requesting unit claims that equally effective access would be an undue burden or a fundamental alteration.');
              why.push('That determination belongs to the president or a designee, in writing, after a review of all resources available to the program (28 CFR 35.164 and 35.204). High cost alone does not establish an undue burden.');
            } else if (d.exception) {
              why.push('A written determination by the president or a designee is on file that equally effective access would be an undue burden or a fundamental alteration, so the plan is approved as a Non-Equal Alternative under 28 CFR 35.204.');
              why.push('The university must still provide access to the maximum extent possible, through the named department support for each missed requirement.');
            } else if (unmet.length) {
              why.push('The plan is therefore a Non-Equal Alternative, with named department support required for each missed requirement.');
            }
          }
          if (d.outcome !== 'deny') why.push(warningText(std));
          if (pending) why.push('The review holds with the requesting unit until a TAAP is on file.');
          if (referred) why.push('The review holds with the president or a designee until the written determination is on file.');
        }
        if (approved) why.push('The plan is temporary. It manages access during vendor remediation without making the product compliant.');
        if (d.outcome === 'deny') {
          why.push('The denial is a procurement decision, based on the findings above.');
          why.push('You may ask for reconsideration through your campus process.');
          why.push(d.denyReason === 'more_accessible_product'
            ? 'A vendor fix that removes the blocking barrier would allow a new review.'
            : `A TAAP that meets ${need} requirements, a vendor fix that removes the blocking barrier, or a different product would allow a new review.`);
        }
      }
  }

  // What happens next
  const next = [];
  const std = d.taapStandard;
  if (pending && sev === 'S3' && std.warning !== 'low') {
    next.push('First, check whether a more accessible product meets the same need. If one does, the request is denied without a TAAP, because the CSU buys the most accessible product that meets the need.');
  }
  if (pending) {
    next.push(`${sev === 'S3' && std.warning !== 'low' ? 'If none does, complete' : 'Next, complete'} a TAAP on the CSU TAAP template. It must meet ${std.required === 6 ? 'all six requirements below' : `at least ${std.required} of the six requirements below`}.`);
    for (const r of TAAP_REQUIREMENTS) next.push(`${r.text}.`);
  }
  if (pending || d.outcome === 'approve_with_taap') {
    next.push('The TAAP names the responsible department, its support offering and the user contacts for problem reports. A problem report starts that support, with no accommodation request needed.');
    if (std && std.required < 6) next.push('For each missed requirement, the plan names the covering support, its provider and its response time.');
    next.push(`The TAAP includes a product-specific accessibility statement, written by the campus, with ${list(TAAP_STATEMENT.includes)}. The statement is posted ${TAAP_STATEMENT.postedAt}. It is separate from the vendor's own accessibility statement.`);
  }
  if (referred) next.push('The review resumes on receipt of the written determination. A determination that equally effective access would be an undue burden or a fundamental alteration lists the support that remains for each missed requirement.');
  if ((!d.route || pending) && d.outcome !== 'deny') {
    for (const c of S2_CAVEATS.filter((x) => d.caveats.includes(x.id))) next.push(cap(c.text));
    for (const r of d.requires) next.push(r === 'validation_at_review' ? NEEDS[r] : `${pending ? 'The TAAP must also show that' : 'The approval requires that'} ${lower(NEEDS[r] ?? r)}`);
    if (d.roadmap) next.push('The vendor completes the CSU Vendor Accessibility Roadmap, with status, remediation timeline and workarounds for each barrier found.');
    if (d.approver) next.push(`${pending ? 'The finished TAAP is signed' : 'The TAAP is signed'} by ${d.approver}.`);
    if (d.taapReview) {
      next.push('The TAAP runs one year, or until contract renewal if renewal comes first.');
      const multiYear = d.taapReview.contract === 'medium' || d.taapReview.contract === 'high';
      if (multiYear || d.taapReview.contract == null) {
        next.push(multiYear
          ? 'The contract runs more than a year, so the TAAP requires annual review and renewal across the term.'
          : 'A contract longer than a year requires annual review and renewal of the TAAP across the term.');
        next.push('Each review requires measurable vendor progress on the roadmap. Without that progress the TAAP lapses, and retention of the product requires a risk memo signed by executive leadership.');
        next.push('The roadmap\'s dates should fall inside the contract term, so each review has a milestone to check.');
      }
    } else {
      next.push('The approval covers this purchase only. Renewal requires updated vendor accessibility documentation and a new review.');
    }
    if (d.contractTerms.length) {
      next.push('The contract includes the CSU accessibility terms below.');
      for (const t of CONTRACT_TERMS.filter((x) => d.contractTerms.includes(x.id))) next.push(`${cap(t.text)}.`);
    }
  }

  const sections = [
    { heading: 'How we graded it', lines: how, bullets: true },
    { heading: 'Why this result', lines: why },
    { heading: 'What happens next', lines: next, bullets: true },
  ].filter((s) => s.lines.length);
  if (d.authority?.length) sections.push({ heading: 'The rules behind this result', bullets: true,
    lines: d.authority.map((a) => `${a.cite} (${AUTHORITY_KINDS[a.kind]}). ${a.says}`) });
  const about = [product !== 'This product' ? product : null, ctx.vendor?.trim() ? `vendor: ${ctx.vendor.trim()}` : null,
    ctx.unit?.trim() ? `requested by ${ctx.unit.trim()}` : null].filter(Boolean).join(', ');
  const footer = `Graded with the SFBRN accessibility review matrix, version ${MATRIX_VERSION}${ctx.date ? `, on ${ctx.date}` : ''}.`;

  const text = [
    `Accessibility review${about ? `: ${about}` : ''}`,
    `Result: ${headline}`,
    grade,
    '',
    ...sections.flatMap((s) => [s.heading, ...s.lines.map((l) => (s.bullets ? `- ${l}` : l)), '']),
    footer,
  ].join('\n');

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const P = 'margin:0 0 8px 0;font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.4;color:#1a1a1a;';
  const html = [
    `<p style="${P}"><strong>Accessibility review${about ? `: ${esc(about)}` : ''}</strong></p>`,
    `<p style="${P}font-size:13pt;"><strong>Result: ${esc(headline)}</strong></p>`,
    `<p style="${P}color:#444444;">${esc(grade)}</p>`,
    ...sections.map((s) => `<p style="${P}margin-top:12px;"><strong>${esc(s.heading)}</strong></p>` + (s.bullets
      ? `<ul style="margin:0 0 8px 20px;padding:0;">${s.lines.map((l) => `<li style="${P}margin-bottom:4px;">${esc(l)}</li>`).join('')}</ul>`
      : s.lines.map((l) => `<p style="${P}">${esc(l)}</p>`).join(''))),
    `<p style="${P}color:#444444;font-size:10pt;margin-top:12px;">${esc(footer)}</p>`,
  ].join('\n');

  return { headline, grade, sections, text, html };
}

const ReviewMatrix = {
  MATRIX_VERSION, STATES, LEVELS, ROLES, FUNCTIONAL_GROUPS, CALIBRATION, ICT_KINDS, FLOORS,
  GROUPS, SEVERITY, EVIDENCE, ACR_CHECKS, EVIDENCE_LIMITS, veracityFloor, RISK_GRADES, OUTCOMES, HOLDERS, ROUTING,
  GRID, TAAP_REQUIREMENTS, S2_CAVEATS, TAAP_TERMS, TAAP_STATEMENT, ROADMAP_LEVELS, CONTRACT_TERMS, accumulation, breadth, taapStandard, AUTHORITY_KINDS, AUTHORITY, WHO, HEADLINE, exposure, worstSeverity, evaluate, explain,
};

if (typeof module !== 'undefined' && module.exports) module.exports = ReviewMatrix;
else globalThis.ReviewMatrix = ReviewMatrix;
