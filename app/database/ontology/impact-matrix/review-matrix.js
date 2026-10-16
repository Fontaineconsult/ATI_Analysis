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
  expiryYears: { low: 3, medium: 2, high: 1 },
  highExposureFixWithinMonths: 12,
};

// ---------------------------------------------------------------------------------------
// Step 0. Kind of technology decides the standard.
// ---------------------------------------------------------------------------------------
const ICT_KINDS = {
  web: {
    label: 'Web content, web application, mobile app',
    standard: 'WCAG 2.1 AA',
    law: 'ADA Title II (28 CFR 35 subpart H); Section 504; Gov Code 7405',
    whenNonConforming: 'TAAP plus a written determination by the president or designee (28 CFR 35.204)',
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

/** Lowest evidence rank that can support Approve, by exposure. An S1 finding needs rank 4. */
const EVIDENCE_LIMITS = {
  approveMinRank: { low: 0, medium: 2, high: 4 },
  s1MinRank: 4,
  state: 'proposed', grounds: ['vendor-claims-require-proportionate-validation'],
};

// ---------------------------------------------------------------------------------------
// Step 3. Outcomes, routing, grid, and the rules that hold in every cell.
// ---------------------------------------------------------------------------------------
const OUTCOMES = {
  approve: { label: 'Approve', state: 'agreed' },
  approve_with_barrier_record: { label: 'Approve with barrier record', state: 'proposed',
    holds: 'Notice where users meet the product; vendor fix dates in the contract; a review date',
    grounds: ['time-bound-alternative-when-not-conformant', 'notice-as-part-of-access'] },
  taap: { label: 'TAAP', state: 'agreed', grounds: ['proportionate-remedy'] },
  deny: { label: 'Deny', state: 'agreed', grounds: ['most-accessible-product-that-meets-the-need'] },
  manual_review: { label: 'Manual review', state: 'agreed',
    holds: 'Routes uncertainty; returns a recommendation; the requisition owner decides' },
};

/** Checked in order before the grid. The first that applies sets the route. */
const ROUTING = [
  { id: 'exception_claimed', route: 'president_or_designee', state: 'required',
    text: 'A claim that conforming costs too much or changes the program (28 CFR 35.164, 35.204)', grounds: ['bounded-duty-burden-limits'] },
  { id: 'severity_unknown', route: 'request_evidence', state: 'proposed',
    text: 'No ACR, demonstration or testing. At High exposure, treated as S3 and provisional.' },
  { id: 'answers_unknown', route: 'request_information', state: 'proposed',
    text: 'Unknown answers change the exposure band' },
  { id: 'evidence_below_limit', route: 'manual_review', state: 'proposed',
    text: 'Evidence is below the limit for the exposure level' },
];

/** Not a route: when one answer moved one level would change the outcome, the outcome
 *  stands and `requires` gains 'second_reviewer'. */
const BOUNDARY_RULE = { id: 'boundary', requires: 'second_reviewer', state: 'proposed',
  grounds: ['same-facts-same-answer'] };

/**
 * The grid: exposure by worst severity. 'taap_or_deny' is resolved by `resolveS3`.
 * `requires` lists conditions the approval carries.
 */
const GRID = {
  low: {
    S0: { outcome: 'approve' },
    S1: { outcome: 'approve_with_barrier_record' },
    S2: { outcome: 'approve_with_barrier_record' },
    S3: { outcome: 'taap_or_deny' },
  },
  medium: {
    S0: { outcome: 'approve' },
    S1: { outcome: 'approve_with_barrier_record' },
    S2: { outcome: 'approve_with_barrier_record', requires: ['vendor_fix_date'] },
    S3: { outcome: 'taap_or_deny' },
  },
  high: {
    S0: { outcome: 'approve', requires: ['evidence_e2'] },
    S1: { outcome: 'approve_with_barrier_record', requires: ['evidence_e2'] },
    S2: { outcome: 'approve_with_barrier_record', requires: ['evidence_e2', 'vendor_fix_within_12_months'] },
    S3: { outcome: 'taap_or_deny', requires: ['serves_everyone_from_day_one', 'exception_record'] },
  },
};

/** A TAAP passes every test, or it is not a TAAP. */
const TAAP_TESTS = [
  'access_from_first_day', 'same_information_interactions_functions', 'independent_use',
  'same_setting_where_possible', 'named_owner_steps_response_time', 'users_told_and_can_report',
  'vendor_fix_dates', 'reason_better_product_not_chosen',
].map((id) => ({ id, state: 'required', grounds: ['equally-effective-access', 'time-bound-alternative-when-not-conformant'] }));

const APPROVERS = {
  low: 'ATI coordinator',
  medium: 'ATI coordinator and department head',
  high: 'Division vice president or designee',
  state: 'proposed', grounds: ['shared-responsibility-requiring-coordination', 'closest-to-capacity'],
};

const CONTRACT_TERMS = [
  { id: 'gp_clause_45', text: 'CSU General Provisions for IT Acquisitions, clause 45', appliesTo: 'all', state: 'required' },
  { id: 'complaint_resolution', text: 'Vendor responds to and resolves accessibility complaints (Gov Code 7405(b))', appliesTo: 'all', state: 'required' },
  { id: 'warranty', text: 'Conformance warranty; no loss on upgrade or configuration; right to test before acceptance', appliesTo: 'barriers', state: 'proposed' },
  { id: 'fix_windows', text: 'Acknowledge defects in 7 days; fix critical defects in 30 to 90 days or give an interim accommodation', appliesTo: 'barriers', state: 'proposed' },
  { id: 'roadmap', text: 'Dated remediation roadmap; termination without penalty after a missed window', appliesTo: 'barriers', state: 'proposed' },
];

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
 * @property {boolean} [moreAccessibleProductExists]
 * @property {boolean} [taapPassesAllTests]
 * @property {boolean} [servesEveryoneFromDayOne]
 * @property {boolean} [exceptionClaimed]
 *
 * @typedef {Object} Determination What `evaluate` returns and the record keeps.
 * @property {string} matrixVersion
 * @property {Object} standard
 * @property {{level: Level, floorsApplied: string[], groupLevels: Object<string, Level>,
 *             scorePct: number, unknownCount: number, boundary: boolean}} exposure
 * @property {string} severity     'S0'..'S3', or 'S?' when unknown
 * @property {string} evidence
 * @property {string} outcome      key of OUTCOMES
 * @property {string|null} route   id from ROUTING, when one applied
 * @property {string[]} requires   conditions the approval carries
 * @property {string|null} approver
 * @property {number|null} expiresInYears
 * @property {string[]} contractTerms
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

  // Exposure levels reachable by moving one group one level. A floor holds its minimum.
  const neighbors = new Set();
  for (const g of GROUPS) {
    for (const d of [-1, 1]) {
      const r = rank(groupLevels[g.id]) + d;
      if (r < 0 || r > 2) continue;
      const moved = maxLevel([floor, band(scoreGroups({ ...groupLevels, [g.id]: LEVELS[r] }))]);
      if (moved !== level) neighbors.add(moved);
    }
  }

  return { level, floorsApplied: floorsApplied.map((f) => f.id), groupLevels,
    scorePct: Math.round(scorePct * 100), unknownCount, unknownsMatter, neighbors: [...neighbors],
    boundary: false };
}

/** Worst severity across all roles' core paths, or 'S?' with no findings and no evidence. */
function worstSeverity(review) {
  if (!review.findings.length) return review.evidence === 'E0' ? 'S?' : 'S0';
  return review.findings.reduce((w, f) => (Number(f.severity[1]) > Number(w[1]) ? f.severity : w), 'S0');
}

function resolveS3(review, level) {
  if (review.moreAccessibleProductExists) return 'deny';
  if (!review.taapPassesAllTests) return 'deny';
  if (level === 'high' && !review.servesEveryoneFromDayOne) return 'deny';
  return 'taap';
}

/**
 * Apply the matrix to one review.
 * @param {Review} review
 * @returns {Determination}
 */
function evaluate(review) {
  const exp = exposure(review);
  let severity = worstSeverity(review);
  const ev = EVIDENCE.find((e) => e.id === review.evidence);
  const base = { matrixVersion: MATRIX_VERSION, standard: ICT_KINDS[review.ictKind],
    exposure: exp, severity, evidence: ev.id, requires: [], approver: null, expiresInYears: null, contractTerms: [] };

  const routed = (route) => ({ ...base, outcome: 'manual_review', route });
  if (review.exceptionClaimed) return routed('exception_claimed');
  if (severity === 'S?') {
    if (exp.level !== 'high') return routed('severity_unknown');
    severity = 'S3';                         // provisional until evidence arrives
    base.severity = 'S3 (provisional)';
  }
  if (exp.unknownsMatter) return routed('answers_unknown');
  const approving = ['S0', 'S1', 'S2'].includes(severity);
  const minRank = severity === 'S1' ? Math.max(EVIDENCE_LIMITS.s1MinRank, EVIDENCE_LIMITS.approveMinRank[exp.level])
    : EVIDENCE_LIMITS.approveMinRank[exp.level];
  if (approving && ev.rank < minRank) return routed('evidence_below_limit');

  const decide = (level) => {
    const c = GRID[level][severity];
    return c.outcome === 'taap_or_deny' ? resolveS3(review, level) : c.outcome;
  };
  const cell = GRID[exp.level][severity];
  const outcome = decide(exp.level);
  // Boundary: one answer moved one level would change the outcome. The outcome stands,
  // and a second reviewer confirms it.
  exp.boundary = exp.neighbors.some((l) => decide(l) !== outcome);
  const withBarriers = outcome === 'approve_with_barrier_record' || outcome === 'taap';
  return {
    ...base,
    outcome,
    route: null,
    requires: [...(outcome === 'deny' ? [] : cell.requires ?? []), ...(exp.boundary ? ['second_reviewer'] : [])],
    approver: withBarriers ? APPROVERS[exp.level] : null,
    expiresInYears: outcome === 'deny' ? null : CALIBRATION.expiryYears[exp.level],
    contractTerms: CONTRACT_TERMS.filter((t) => t.appliesTo === 'all' || withBarriers).map((t) => t.id),
  };
}

// ---------------------------------------------------------------------------------------
// Plain-language grading, for the requester. Written to the project writing style: plain
// words, one claim per sentence, no em dashes.
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
  web: 'As a web or mobile product, it is reviewed against WCAG 2.1 AA under ADA Title II.',
  nonweb: 'As non-web software or hardware, it is reviewed against the Section 508 Standards, which California law applies to the CSU.',
  mixed: 'Its web and mobile parts are reviewed against WCAG 2.1 AA under ADA Title II.',
};
const BECAUSE = {
  required_for_grade: 'it is required of students for coursework or a grade',
  only_route_to_service: 'it is the only route to a university service',
  campus_wide: 'it is used campus-wide or in all sections of a course',
  known_user_or_request: 'a person with a disability is known to be among its users, or an accommodation request is open',
  prior_complaint: 'there has been an accessibility complaint about it',
  job_duty_or_hiring: 'it is required for a job duty or used in hiring',
  public: 'it is open to the public',
};
const GROUP_PHRASE = {
  reach: 'reach (how many people, how widely)',
  stakes: 'stakes (required use, criticality)',
  spread: 'spread (content it publishes)',
  duration: 'duration (how often, how long)',
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
const NEEDS = {
  evidence_e2: 'The vendor\'s accessibility claims are confirmed by a live demonstration, a third-party audit or ATI testing.',
  vendor_fix_date: 'The contract states a date by which the vendor fixes the barriers found.',
  vendor_fix_within_12_months: 'The contract states a date, within 12 months, by which the vendor fixes the barriers found.',
  serves_everyone_from_day_one: 'The alternate access plan serves every affected person from the first day of use.',
  exception_record: 'A written determination by the president or a designee (web and mobile), or a best-meets record with market research (other technology), is on file.',
  second_reviewer: 'A second reviewer confirms the result, because one answer moved one level would change it.',
};
const HEADLINE = {
  exception_claimed: 'Referred for a formal determination',
  severity_unknown: 'On hold: accessibility evidence needed',
  answers_unknown: 'On hold: more information needed',
  evidence_below_limit: 'Manual review: stronger evidence needed',
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Lowercase the first letter, unless the word is an acronym (ATI, CSU).
const lower = (s) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const list = (items) => (items.length < 2 ? items.join('')
  : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const evidenceName = (minRank) => (minRank >= 4
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
  const grade = `Exposure ${cap(e.level)} | ${sev === 'S?' ? 'Barriers unknown' : `${cap(SEVERITY_WORD[sev])} (${sev})`} | Evidence ${ev.id}`;

  // How we graded it
  const how = [];
  how.push(`Standard: ${KIND_PHRASE[review.ictKind]}`);
  const floors = FLOORS.filter((f) => e.floorsApplied.includes(f.id));
  const groupText = GROUPS.map((g) => `${GROUP_PHRASE[g.id]} ${e.groupLevels[g.id]}`).join('; ');
  how.push(floors.length
    ? `Exposure is ${e.level} because ${list(floors.map((f) => BECAUSE[f.id]))}. Its use otherwise rates: ${groupText}.`
    : `Exposure is ${e.level}, based on its use: ${groupText}. That is ${e.scorePct} percent of the maximum score.`);
  const unknown = Object.keys(ASK).filter((k) => { const a = review.answers[k]; return !a || (a.reviewer ?? a.requester) == null; });
  if (unknown.length) how.push(`We did not have ${list(unknown.map((k) => ASK[k]))}, so ${unknown.length === 1 ? 'that answer was' : 'those answers were'} counted at the highest level.`);
  const overridden = Object.keys(ASK).filter((k) => { const a = review.answers[k]; return a && a.reviewer != null && a.requester != null && a.reviewer !== a.requester; });
  if (overridden.length) how.push(`The reviewer changed the answer for ${list(overridden.map((k) =>
    `${ASK[k]} (requester: ${review.answers[k].requester}; reviewer: ${review.answers[k].reviewer})`))}.`);
  const worst = review.findings.filter((f) => f.severity === sev);
  if (sev === 'S?') how.push('Barriers: we have no accessibility evidence yet, so the barriers are unknown.');
  else if (!review.findings.length) how.push('Barriers: none found on any user\'s path.');
  else {
    const effect = { S1: 'meet minor barriers in', S2: 'need clearly more time or effort to complete', S3: 'cannot independently complete' }[sev];
    const who = worst.map((f) => `${ROLE_WORD[f.role]} ${WHO[f.group]} ${effect} ${f.coreTask ? `"${f.coreTask}"` : 'a core task'}`);
    how.push(`Barriers: the most serious is ${SEVERITY_WORD[sev]} (${sev}). ${cap(list(who))}.`);
    const others = review.findings.length - worst.length;
    if (others) how.push(`${others} less serious ${others === 1 ? 'barrier was' : 'barriers were'} also found.`);
  }
  how.push(`Evidence: ${EVIDENCE_PHRASE[ev.id]} (${ev.id}).`);

  // Why this result
  const why = [];
  const minRank = sev === 'S1' ? Math.max(EVIDENCE_LIMITS.s1MinRank, EVIDENCE_LIMITS.approveMinRank[e.level]) : EVIDENCE_LIMITS.approveMinRank[e.level];
  switch (d.route) {
    case 'exception_claimed':
      why.push('A claim was made that making the product accessible would cost too much or change the program.');
      why.push('Only the president or a designee with budget authority can decide that, in writing, after considering all the resources available to the program (28 CFR 35.164 and 35.204).');
      why.push('The request goes to them, and the review resumes with their written decision.');
      break;
    case 'severity_unknown':
      why.push('We cannot grade the product\'s accessibility without evidence.');
      why.push('Please ask the vendor for a current Accessibility Conformance Report on the WCAG edition, or arrange a live demonstration of the main tasks with assistive technology.');
      break;
    case 'answers_unknown':
      why.push('The answers we are missing could change the exposure level, and with it the review the product needs.');
      why.push(`Please tell us ${list(unknown.map((k) => ASK[k]))}.`);
      break;
    case 'evidence_below_limit':
      why.push(`At ${e.level} exposure, approval needs ${evidenceName(minRank)}.`);
      why.push(`The evidence we have is ${EVIDENCE_PHRASE[ev.id]} (${ev.id}).`);
      why.push('The request stays in manual review until stronger evidence is in hand.');
      break;
    default:
      if (d.outcome === 'approve') {
        why.push('No barriers were found on any user\'s path, so the product is approved.');
      } else if (d.outcome === 'approve_with_barrier_record') {
        why.push('The barriers found make some tasks harder, but they do not stop anyone completing a task.');
        why.push('An alternate access plan is therefore not needed.');
        why.push('The product is approved with a barrier record: users are told about the barriers where they use the product, and the vendor commits in the contract to dates for fixing them.');
      } else if (d.outcome === 'taap') {
        why.push('A barrier stops some users from completing a core task, so the product cannot be approved as it is.');
        why.push('An alternate access plan has been confirmed that gives the same access, independently, from the first day of use.');
        why.push('The plan is temporary. It manages access while the vendor fixes the product, and it does not make the product compliant.');
      } else if (d.outcome === 'deny') {
        why.push('A barrier stops some users from completing a core task, so the product cannot be approved as it is.');
        if (review.moreAccessibleProductExists) why.push('A more accessible product meets the same need, and the university is required to choose the most accessible product that meets its requirements.');
        else if (!review.taapPassesAllTests) why.push('No alternate access plan has been found that gives the same access, independently and on time, so a plan cannot cover the barrier.');
        else why.push(`At ${e.level} exposure, the plan would have to serve every affected person from the first day of use, and the proposed plan cannot.`);
        why.push('You may ask for reconsideration through your campus process. A different product, or a vendor fix, would allow a new review.');
      }
  }

  // What happens next
  const next = [];
  if (!d.route && d.outcome !== 'deny') {
    for (const r of d.requires) next.push(`Condition: ${lower(NEEDS[r] ?? r)}`);
    if (d.approver) next.push(`Approval rests with the ${lower(d.approver)}.`);
    if (d.expiresInYears) next.push(`This decision lasts ${d.expiresInYears} year${d.expiresInYears === 1 ? '' : 's'}. It is reviewed sooner if the product is renewed, a major new version arrives, who uses it changes, or a complaint is made.`);
    if (d.contractTerms.length) {
      const extra = d.contractTerms.includes('warranty')
        ? ', plus a conformance warranty, set windows for fixing defects, and a dated remediation roadmap' : '';
      next.push(`The contract carries the CSU accessibility terms (General Provisions clause 45, and the vendor's duty to resolve accessibility complaints)${extra}.`);
    }
  }
  next.push('Anyone who meets a barrier in this product can still ask for an individual accommodation.');

  const sections = [
    { heading: 'How we graded it', lines: how, bullets: true },
    { heading: 'Why this result', lines: why },
    { heading: 'What happens next', lines: next, bullets: true },
  ];
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
  GROUPS, SEVERITY, EVIDENCE, ACR_CHECKS, EVIDENCE_LIMITS, OUTCOMES, ROUTING, BOUNDARY_RULE,
  GRID, TAAP_TESTS, APPROVERS, CONTRACT_TERMS, WHO, exposure, worstSeverity, evaluate, explain,
};

if (typeof module !== 'undefined' && module.exports) module.exports = ReviewMatrix;
else globalThis.ReviewMatrix = ReviewMatrix;
