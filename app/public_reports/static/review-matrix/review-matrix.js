/**
 * Unified SFBRN accessibility review matrix, version 3, as a data model.
 *
 * The matrix is data: every rule carries its provenance (`state`) and the principles it
 * carries out (`grounds`, principle handles without the `principle:` prefix). The one
 * function, `evaluate`, applies the data to a purchase and returns a determination.
 * Prose source: rubric-core.md, version 3.
 *
 * Plain script, no dependencies. It is not an ES module because browsers refuse module
 * imports on a page opened from a local file. In a browser, load it with
 * <script src="review-matrix.js"> and use the global `ReviewMatrix`. In Node, use
 * require('./review-matrix.js').
 */

const MATRIX_VERSION = '3';

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
  // The user count sets the starting Exposure and the lowest level the other answers can reach.
  userTiers: [
    { upTo: 25, start: 'low', lowest: 'low' },
    { upTo: 250, start: 'medium', lowest: 'low' },
    { upTo: 2500, start: 'high', lowest: 'low' },
    { upTo: Infinity, start: 'high', lowest: 'medium' },
  ],
  // Each other answer scores its weight times its rank (low 0, medium 1, high 2). A blank scores as high.
  answerWeights: { scope: 1, required_use: 1, criticality: 1, publishes: 1, frequency: 0.5, contract_length: 0.5 },
  answerBands: { medium: 2.5, high: 5.5 },   // points, out of a maximum of 10
  acrMaxAgeMonths: 24,
  // An ACR dated within this many months, and after the product's last major release, raises
  // confidence in its Supports rows. Older lowers it. Beyond acrMaxAgeMonths the report is stale, a report defect.
  acrRecentMonths: 12,
  // Breadth, from 0 to 2: one step at each cut of distinct blocked function and group pairs, plus
  // one when S2 findings reach s2AddsAt.
  breadth: { blockedCuts: [2, 4], s2AddsAt: 3 },
  // S2 barriers that add up to S3. `stack` S2 findings for one group on one essential function block
  // that function. At `spreadAt` exposure, S2 findings across `spreadPairs` function and group pairs
  // make the product S3.
  accumulation: { stack: 3, spreadPairs: 6, spreadAt: 'high' },
  // TAAP standard. Pressure P = rank(Exposure) + Breadth, from 0 to 4. `required[P]` is how many
  // of the six TAAP requirements a plan must meet. A plan below it is denied at every pressure,
  // unless a written undue burden or fundamental alteration determination is on file. The
  // warning cuts apply to P plus the gap to a full TAAP. The gap follows the TAAP template's
  // Institutional Risk tiers, which grade a plan by the requirements it meets. The pressure
  // term and the cuts are the matrix's, with the Section508.gov risk model as the nearest
  // precedent. WARNING_LEVELS states what each level means.
  taapStandard: { required: [3, 3, 4, 6, 6], warning: { elevated: 2, high: 4 } },
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
 * A bypass is one fact that ends the review at intake. An accommodation purchase carries out
 * the interactive process between one person with a disability and the campus (EO 1111), and
 * that process settled what the person needs. The audience is that person, so the four
 * factors are not rated. The approval is limited to the accommodation.
 */
const BYPASSES = [
  { id: 'accommodation_purchase', fact: 'Purchased as an accommodation for one named person with a disability', outcome: 'approve',
    state: 'proposed', grounds: ['parallel-duties-conformance-and-accommodation'] },
];

/**
 * Groups merge factors that describe the same fact, so nothing is counted twice.
 * A group takes the highest level among its factors.
 */
const GROUPS = [
  { id: 'reach', factors: [
    { id: 'users', numeric: true, levels: { low: 'Up to 25', medium: '26 to 250', high: 'More than 250' } },
    { id: 'scope', levels: { low: 'One research group, lab, department, organization or course', medium: 'Several, or a planned expansion', high: 'Campus-wide' } },
  ] },
  { id: 'stakes', factors: [
    { id: 'required_use', levels: { low: 'Optional', medium: 'Required for a few identified people for a limited task', high: 'Required for coursework, a job duty or a university service' } },
    { id: 'criticality', levels: { low: 'Optional program or service, or research use by one group', medium: 'Important, not critical', high: 'Critical, or a core academic or business function' } },
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
  { id: 'S2', rank: 2, gsa: 'Major', meaning: 'An essential function can be performed independently, with clearly unequal time or effort' },
  { id: 'S3', rank: 3, gsa: 'Critical', meaning: 'An essential function cannot be performed independently, or only with help' },
].map((s) => ({ ...s, state: 'required', grounds: ['equally-effective-access'] }));

/**
 * The evidence levels. A vendor ACR has two halves with different credibility. Its admissions,
 * the "Partially Supports" and "Does Not Support" rows, are credible at any rank, because a
 * vendor has no reason to invent a barrier. Its denials, the "Supports" rows, are the vendor
 * grading itself, and the Veracity floor binds those alone. The three E1 levels grade an ACR's
 * denials. The analyst records the vendor ACR (E1) and ticks the report checks it fails. A
 * failed check is a report defect and makes the base E1- unless the analyst accepts it. `acrLevel`
 * decides whether a clean ACR is taken at face value (E1+). It is when its remarks read like a bug
 * report and it is not both old and by the vendor's own staff. A clean ACR not yet taken at face value (E1) takes the
 * analyst's spot check first. E1+ is derived, never recorded. The review takes most ACRs at face
 * value, and the verification steps are for the ones that give a reason not to.
 *
 * ATI testing comes in two forms. The spot check (E3a) is the analyst's own pass over the
 * essential functions with a screen reader and the keyboard, done on top of a clean ACR. It
 * is derived from the ACR record and ranks with a demonstration or an audit. The full manual
 * review (E3b) is the ATI coordinator's evaluation of the product by a named method.
 */
const EVIDENCE = [
  { id: 'E0', rank: 0, holds: 'Nothing, or marketing statements', state: 'proposed' },
  // E1- is derived: from a report defect the analyst ticks (`acr.defects`), from a stale date,
  // or from a contradicting spot check. Older records that carry E1- as the base still evaluate.
  { id: 'E1-', rank: 1, holds: 'Vendor ACR with a report defect the analyst did not accept, or one the ATI spot check contradicted', state: 'proposed', derived: true },
  { id: 'E1', rank: 2, holds: 'Clean vendor ACR not yet taken at face value, because its remarks fall short of a bug report or it is both more than a year old and by the vendor\'s own staff', record: 'Vendor ACR', state: 'proposed' },
  { id: 'E1+', rank: 3, holds: 'Clean vendor ACR taken at face value, because its remarks read like a bug report and it is not both more than a year old and by the vendor\'s own staff', state: 'proposed', derived: true },
  { id: 'E2a', rank: 4, holds: 'Live vendor demonstration of essential functions with assistive technology', state: 'agreed' },
  { id: 'E2b', rank: 4, holds: 'Third-party audit with a named method', state: 'proposed' },
  { id: 'E3a', rank: 4, holds: 'ATI spot check by the analyst: essential functions exercised with a screen reader and the keyboard, agreeing with a clean vendor ACR', state: 'proposed', derived: true },
  { id: 'E3b', rank: 5, holds: 'ATI full manual review by the ATI coordinator, by a named method', state: 'agreed' },
].map((e) => ({ ...e, grounds: ['vendor-claims-require-proportionate-validation'] }));
const ACR_LEVELS = ['E1-', 'E1', 'E1+'];
/** Evidence ids from earlier records, mapped to the current id. */
const LEGACY_EVIDENCE = { E3: 'E3b' };

/**
 * The report checks rate the ACR. A failed check is a report defect and drops the ACR to E1-,
 * unless the analyst accepts the ACR with the defect noted. The document checks rate the
 * report's front matter and scope and apply to every ACR. The remarks checks rate the Remarks
 * column and apply when the remarks fall short of a bug report. The stale check is read from
 * the dates, and the analyst ticks the others. A barrier the product has is a finding.
 */
const ACR_CHECKS = [
  { id: 'wrong_edition', scope: 'document', text: 'Reports WCAG 2.0 only (508 edition) for a web or mobile product' },
  { id: 'no_date_or_version', scope: 'document', text: 'No month and year, no product version, or a different version' },
  { id: 'stale', scope: 'document', text: `Older than ${CALIBRATION.acrMaxAgeMonths} months or the last major release` },
  { id: 'no_methods', scope: 'document', text: 'No evaluation methods named' },
  { id: 'single_browser_at', scope: 'document', text: 'Tested on one browser and one screen reader only' },
  { id: 'not_evaluated', scope: 'document', text: '"Not Evaluated" outside the AAA table, or "Not Applicable" without a reason' },
  { id: 'missing_interface', scope: 'document', text: 'Does not cover every interface or platform being bought' },
  { id: 'carve_outs', scope: 'document', text: 'Scope carve-outs in the notes that exclude part of the product' },
  { id: 'no_remarks', scope: 'remarks', text: '"Partially Supports" or "Does Not Support" without remarks' },
  { id: 'bare_supports', scope: 'remarks', text: '"Supports" on complex criteria without remarks that show the work' },
  { id: 'contradicts_rating', scope: 'remarks', text: 'A remark describes a failure under a "Supports" rating' },
  { id: 'hedge_words', scope: 'remarks', text: 'Remarks hedge with "some", "most" or "generally"' },
].map((c) => ({ ...c, state: 'proposed' }));

/**
 * The three qualifications an analyst reads off a clean ACR, and the spot check. Each
 * qualification is raised or lowered. The remarks decide: a clean ACR whose findings read like
 * a bug report is taken at face value (E1+), because that shows the evaluation was done, which
 * is the best evidence on paper for its Supports rows (MN.IT, "most VPATs should look like a
 * bug list"; the GSA issue-level supplement names the fields). Age and author come off the
 * front page and lower it only together. An ACR more than a year old by the vendor's own staff
 * is not taken at face value even with good remarks. The spot check, the analyst's own pass over the
 * essential functions with a screen reader and the keyboard, is ATI testing in its own right.
 * When it agrees with a clean ACR the evidence is E3a, which ranks with a demonstration or an
 * audit and clears every floor. When it contradicts the ACR the ACR drops to E1-, and the
 * barriers the spot check finds are recorded as findings.
 */
const ACR_QUALIFICATIONS = {
  // The date is the evaluation date in the ACR's methods section, or the report date when the
  // methods name none. A major release changes the first version component, or carries the
  // vendor's own major label. An unknown release date neither raises nor lowers.
  age: {
    raised: `Evaluated within the last ${CALIBRATION.acrRecentMonths} months, and after the product's last major release where that release is known`,
    lowered: `Evaluated more than ${CALIBRATION.acrRecentMonths} months ago`,
    out: `Older than ${CALIBRATION.acrMaxAgeMonths} months or before the last major release (the stale check)`,
  },
  // An outside firm is any firm other than the vendor. Its name and method print in the
  // determination.
  author: {
    raised: 'A named outside firm, with the method named',
    lowered: 'The vendor\'s own staff, or no author named',
  },
  // Remarks are read off the conformance tables, and the qualification has three values. The
  // full form is the GSA issue-level supplement's (the page, screen, component or workflow,
  // the user group, the workaround), which raises. The floor is the VPAT 2.5 instruction that
  // a remark identify the functions or features with issues, which neither raises nor lowers.
  // Below the floor the remarks lower, and the remarks checks open.
  remarks: {
    raised: 'The remarks read like a bug report. Each "Partially Supports" and "Does Not Support" row names the page, screen, component or workflow affected, how it falls short and who is affected, and the "Supports" rows on complex criteria give an example or the method',
    named: 'The remarks name the feature or function with issues, but not where it is, how it falls short or who is affected. The analyst does not take the ACR at face value and runs the spot check next',
    lowered: 'The remarks are blank, restate the criterion, repeat the same text across rows or hedge with "some", "most" or "generally", so the analyst cannot place a barrier on an essential function',
  },
  // The spot check applies to an ACR with no report defect, or one the analyst accepted. It
  // cannot cure a report defect on its own.
  spotCheck: {
    agrees: 'At least one essential function exercised with a screen reader and the keyboard, and nothing found that the ACR does not report. The evidence is E3a, the spot check\'s own rank, which clears every floor',
    contradicts: 'The spot check finds a barrier the ACR reports as Supports. The ACR drops to E1-',
  },
  state: 'calibrate', grounds: ['vendor-claims-require-proportionate-validation', 'report-quality-and-product-accessibility-are-separate-measures'],
};

/**
 * What raises evidence below the Veracity floor, read off the evidence in hand. A clean ACR
 * not yet taken at face value takes the analyst's spot check first. A contradicted or failing ACR has no trusted Supports
 * rows left to check, so the ATI coordinator's full manual review or a vendor demonstration
 * supplies the evidence. With no ACR at all, the vendor supplies one, or the same two steps do.
 */
const RAISE = {
  spot_check: { label: 'the analyst\'s spot check',
    text: 'The analyst exercises the essential functions with a screen reader and the keyboard. If the spot check agrees with the ACR, the evidence is E3a and the review proceeds. If it finds a barrier the ACR denies, the analyst records the barrier as a finding, and the ATI coordinator\'s full manual review or a vendor demonstration re-rates the product.' },
  review_contradicted: { label: 'a full manual review or a demonstration',
    text: 'The spot check found a barrier the ACR reports as Supports, so the ACR\'s Supports rows are no longer trusted and a second spot check cannot restore them. The ATI coordinator\'s full manual review, or a vendor demonstration of the essential functions with assistive technology, re-rates the product.' },
  review_failed_check: { label: 'a corrected or accepted ACR, a full manual review or a demonstration',
    text: 'The ACR has a report defect, which a spot check cannot cure. The vendor corrects the ACR, or the analyst accepts it with the defect and the reason noted, or the ATI coordinator\'s full manual review or a vendor demonstration of the essential functions with assistive technology supplies the evidence.' },
  vendor_evidence: { label: 'vendor evidence, a full manual review or a demonstration',
    text: 'No ACR is on file. The vendor supplies a current ACR, or the ATI coordinator\'s full manual review or a vendor demonstration of the essential functions with assistive technology supplies the evidence.' },
};
/** The RAISE key for an ACR record from `acrLevel`, or for no ACR. */
function raiseStep(acr) {
  if (!acr) return 'vendor_evidence';
  if (!acr.clean) return 'review_failed_check';
  return acr.spotCheck === 'contradicts' ? 'review_contradicted' : 'spot_check';
}

/** Whole months from one YYYY-MM (or YYYY-MM-DD) to another. */
const monthsBetween = (from, to) => {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
};

/**
 * The ACR's level from its base, its three qualifications and the spot check. `acr` is the
 * review's ACR record: issued (the evaluation date) and lastMajorRelease as YYYY-MM, author
 * 'outside' or 'vendor', remarks 'bug_report', 'feature_named' or 'restated', spotCheck 'none', 'agrees' or
 * 'contradicts'. `today` is the review
 * date. `defects` lists the report checks the analyst ticked, by `ACR_CHECKS` id. The
 * qualifications and the spot check apply to a clean ACR only: one with no report defect, or
 * one the analyst accepted with the defects noted (`accepted`, `acceptedNote`). A report defect
 * is otherwise cured by the vendor, not by a spot check. Acceptance never cures a stale report.
 * A base of E1- on an older record counts as a defect. A clean ACR is trusted, E1+, when its
 * remarks read like a bug report and it is not both more than a year old and by the vendor's
 * own staff. A date left blank is unknown and neither raises nor lowers. An agreeing spot check
 * makes the evidence E3a, since the analyst looked at the product itself. A version 2 record
 * with base E1+ is trusted as recorded.
 * @returns {{level: string, trusted: boolean, age: 'raised'|'lowered'|'unknown'|'out', author: 'raised'|'lowered', remarks: 'raised'|'lowered', months: number|null, spotCheck: string, stale: boolean, clean: boolean, defects: string[], defective: boolean, accepted: boolean, acceptedNote: string|null}}
 */
function acrLevel(base, acr = {}, today = new Date().toISOString().slice(0, 7)) {
  const months = acr.issued ? monthsBetween(acr.issued, today) : null;
  const beforeRelease = Boolean(acr.issued && acr.lastMajorRelease && acr.issued < acr.lastMajorRelease);
  const stale = beforeRelease || (months != null && months > CALIBRATION.acrMaxAgeMonths);
  const age = stale ? 'out' : months == null ? 'unknown' : months <= CALIBRATION.acrRecentMonths ? 'raised' : 'lowered';
  const author = acr.author === 'outside' ? 'raised' : 'lowered';
  const remarks = acr.remarks === 'bug_report' ? 'raised' : acr.remarks === 'feature_named' ? 'named' : 'lowered';
  const ticked = (acr.defects || []).filter((id) => id !== 'stale' && ACR_CHECKS.some((c) => c.id === id));
  const defects = stale ? ['stale', ...ticked] : ticked;
  const defective = base === 'E1-' || ticked.length > 0;
  const accepted = defective && Boolean(acr.accepted);
  const clean = ACR_LEVELS.includes(base) && (!defective || accepted) && !stale;
  const spotCheck = clean ? (acr.spotCheck ?? 'none') : 'none';
  const trusted = clean && (base === 'E1+' || (remarks === 'raised' && !(age === 'lowered' && author === 'lowered')));
  const level = !clean ? 'E1-' : spotCheck === 'contradicts' ? 'E1-' : spotCheck === 'agrees' ? 'E3a' : trusted ? 'E1+' : 'E1';
  return { level, trusted, age, author, remarks, months, spotCheck, stale, clean, defects, defective, accepted,
    acceptedNote: accepted ? (acr.acceptedNote || null) : null,
    authorName: acr.authorName || null, spotCheckNote: acr.spotCheckNote || null };
}

/**
 * The Veracity floor: the lowest evidence rank at which the vendor's denials are confirmed.
 * It is any evidence at low exposure and a clean ACR taken at face value at medium and high.
 * Severity does not move it.
 * The floor binds every risk grade at high exposure, and at low and medium exposure a risk grade
 * that rests on the denials, "No alternate access required". At low and medium a grade of
 * "Alternate access required" rests on the barriers found, which are credible at any rank, so
 * the review proceeds on them with the TAAP standard provisional until the evidence reaches the
 * floor. At high exposure the TAAP's scope rests on the denials too, since a denied barrier gets
 * no alternative, so the review raises the evidence before the TAAP is written.
 */
const EVIDENCE_LIMITS = {
  // Rank 3 is a clean ACR taken at face value, so at medium and high the floor asks only that
  // the ACR give no reason for doubt. Severity does not move the floor. An S1 rating rests on
  // a remark or evidence that names the function and the impact, which a trusted ACR's
  // bug-report remark does.
  floor: { low: 0, medium: 3, high: 3 },
  state: 'proposed', grounds: ['vendor-claims-require-proportionate-validation'],
};
const veracityFloor = (level) => EVIDENCE_LIMITS.floor[level];

// ---------------------------------------------------------------------------------------
// Step 3. Outcomes, routing, grid, and the rules that hold in every cell.
// ---------------------------------------------------------------------------------------
/** The two risk grades the grid gives: whether equally effective alternate access is owed for this
 *  purchase (28 CFR 35.150 and 35.130(b)(1); Section 508 E202.7.2). Neither is a final decision. */
const RISK_GRADES = { approve: 'No alternate access required', needs_taap: 'Alternate access required' };

/** The three final decisions, plus the hold state. */
const OUTCOMES = {
  // S0, S1, and S2 at Low exposure. No TAAP: the template asks for one only when barriers
  // prevent essential functions. A Low S2 approval carries S2_CAVEATS.
  approve: { label: 'Approve', state: 'agreed' },
  // A TAAP at or above the standard, or below it only under a written undue burden or
  // fundamental alteration determination, as a Non-Equal Alternative under a warning.
  approve_with_taap: { label: 'Approve with TAAP', state: 'agreed', grounds: ['proportionate-remedy'] },
  // A deny is a procurement decision, not a TAAP result. The TAAP review is one finding behind it.
  deny: { label: 'Deny', state: 'agreed', grounds: ['vendor-leverage-procurement-as-accessibility-lever'] },
  // No decision yet. `hold` names the HOLDS entry, and HOLDERS names who holds the review.
  on_hold: { label: 'On hold', state: 'proposed' },
};

/** Who holds a held review, by the `holder` key on each HOLDS entry. */
const HOLDERS = {
  president_or_designee: { label: 'the president or a designee with budget authority',
    holds: 'Makes the written determination. The remedy step resumes on receipt' },
  request_evidence: { label: 'the requester',
    holds: 'Obtains the vendor evidence. The review resumes on receipt' },
  request_information: { label: 'the requester',
    holds: 'Answers the open exposure questions. The review resumes on receipt' },
  manual_review: { label: 'the ATI review team',
    holds: 'Raises the evidence, by the analyst\'s spot check of a clean ACR not yet taken at face value, with the requester and the vendor through a demonstration, or by the ATI coordinator\'s full manual review, then re-rates Severity. The review resumes at the Severity step, or proceeds under the fallback when the evidence cannot be raised' },
  // TAAP authoring is collaborative. The SFBRN Procurement team drafts the plan with the
  // requester, because the requester's team provides the support the plan promises.
  request_taap: { label: 'the SFBRN Procurement team with the requester',
    holds: 'Drafts the TAAP together to the TAAP standard. The remedy step resumes when the signed plan is on file' },
};

/**
 * The five holds. Each is named by what the review waits for (`waits`), and `holder` names
 * the HOLDERS entry whose action releases it. Holds 1 to 3 are checked in order before the
 * grid, and the first that applies holds the review. Hold 3 resumes at the Severity step with
 * the new findings, or the review proceeds under the fallback when the evidence cannot be
 * raised. Holds 4 and 5 arise in the remedy step.
 */
const HOLDS = [
  { id: 'severity_unknown', waits: 'accessibility evidence', holder: 'request_evidence', state: 'proposed',
    text: 'No ACR, demonstration or testing' },
  { id: 'answers_unknown', waits: 'exposure answers', holder: 'request_information', state: 'proposed',
    text: 'The user count is missing' },
  { id: 'veracity_below_floor', waits: 'stronger evidence', holder: 'manual_review', state: 'proposed',
    text: 'The evidence is below the Veracity floor for the exposure level, the floor binds, because the exposure is high or the risk grade rests on the vendor\'s Supports rows, and the ATI review team can still raise the evidence' },
  { id: 'taap_needed', waits: 'a TAAP', holder: 'request_taap', state: 'proposed',
    text: 'The risk grade is Alternate access required and no TAAP is on file' },
  // The exception is a defence against one required action, here the TAAP standard. It is
  // claimed only where the plan falls below the standard, never at intake.
  { id: 'exception_claimed', waits: 'a written determination', holder: 'president_or_designee', state: 'required',
    text: 'The TAAP falls below the standard, and the requester claims that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164, 35.204)',
    grounds: ['bounded-duty-burden-limits'] },
];

/**
 * The grid: exposure by worst severity. It gives the risk grade, a RISK_GRADES key.
 * `resolveTaap` settles Alternate access required from the TAAP section against the TAAP standard.
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

/** Exposure levels at which barriers that do not block an essential function still need a vendor roadmap.
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
// The legal and policy basis for each outcome and hold, in plain words for the requester.
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
  // The accommodation purchase. The interactive process, not the procurement review, settles
  // what one person needs, and the purchase carries that settlement out.
  accommodation_purchase: [
    { cite: 'CSU Executive Order 1111, sections V.B and VI.B', kind: 'csu_policy',
      says: 'An accommodation comes from an interactive process between one student or employee and the campus, in response to that person\'s request. That process settles what the person needs, and the purchase carries it out.' },
    { cite: '28 CFR 35.130(b)(7); 29 CFR 1630.2(o)', kind: 'federal_law',
      says: 'A public entity makes reasonable modifications for a person with a disability, and an employer provides reasonable accommodation to a qualified employee. A purchase made under those duties serves the named person, so the review of the product for a general audience does not apply.' },
    CONTRACT_DUTY,
  ],
  approve: [
    { cite: '28 CFR 35.200', kind: 'federal_law', ict: WEB,
      says: 'Web content and mobile apps that a public university provides, directly or through a vendor, must conform to WCAG 2.1 AA.' },
    { cite: 'Gov Code 7405 and 11135', kind: 'state_law', ict: ['nonweb'],
      says: 'California applies the Section 508 Standards to the technology state entities buy. The CSU follows them for software and hardware.' },
    { cite: 'CSU ATI Procurement Process', kind: 'csu_policy',
      says: 'The CSU buys the most accessible product that meets the business need.' },
    // Known barriers that do not block an essential function. The TAAP line comes from the template's own
    // instructions. The EEAAP clause of the ATI Policy (2024) is deprecated for this tool.
    { cite: 'CSU TAAP Authoring Template, instructions', kind: 'csu_policy', severity: ['S1', 'S2'],
      says: 'A TAAP is needed only when barriers are "severe enough to prevent users from performing essential functions". Failures "that do not prohibit core functionality do not require this process."' },
    { cite: '28 CFR 35.205', kind: 'federal_law', ict: WEB, severity: ['S1'],
      says: 'A nonconformance counts as compliant only when its impact is so small that people with disabilities still get the same information, interactions and transactions. They must get them with substantially equivalent timeliness, privacy, independence and ease of use. The university must be able to show this, so an S1 rating rests on a remark or evidence that names the function and the impact.' },
    { cite: '28 CFR 35.205', kind: 'federal_law', ict: WEB, severity: ['S2'],
      says: 'An S2 barrier makes an essential function clearly harder to perform, so it does not meet the minimal-impact test. The law does not excuse it, and the product does not conform.' },
    { cite: 'Section 508 Standards, E202.7 (36 CFR 1194)', kind: 'federal_standard', ict: ['nonweb'], severity: ['S1', 'S2'],
      says: 'Section 508 has no minimal-impact exception. A product that does not conform is acceptable only when no conforming product meets the need, and the record shows the market research.' },
    { ...ROADMAP_DUTY, severity: ['S1', 'S2'], exposure: ROADMAP_LEVELS },
    CONTRACT_DUTY,
    RENEWAL,
  ],
  approve_with_taap: [
    { cite: 'CSU TAAP Authoring Template, instructions', kind: 'csu_policy', severity: ['S3'],
      says: 'A TAAP is needed when barriers are "severe enough to prevent users from performing essential functions".' },
    // Broad S2: no single barrier blocks a function, but together they are more than minimal impact.
    { cite: '28 CFR 35.205', kind: 'federal_law', ict: WEB, severity: ['S2'],
      says: 'A nonconformance is excused only when its impact is so minimal that people with disabilities still get the same information, interactions and transactions, with substantially equivalent timeliness, privacy, independence and ease of use. At Medium or High exposure, barriers that make essential functions clearly harder to perform reach too many people for the impact to be minimal, even though none blocks a function.' },
    { cite: 'CSU Executive Order 1111, section IV', kind: 'csu_policy', severity: ['S2'],
      says: '"Accessible" means equal information, interactions and services "in an equally effective and equally integrated manner, with substantially equivalent ease of use." Technology access "must provide comparable functionality, affordability, and timeliness."' },
    { cite: 'CSU TAAP Authoring Template, Requirements Checklist', kind: 'csu_policy',
      says: 'To qualify as an equally effective alternative, the plan must meet all six requirements.' },
    { cite: 'CSU TAAP Authoring Template, Process Outcome and Institutional Risk', kind: 'csu_policy',
      says: 'The template sorts a plan by how many of the six requirements it meets. All six is Equally Effective, with low institutional risk. One to five is a Non-Equal Alternative with moderate risk, where "staff should be prepared to provide additional support for affected individuals." None is a need for individualized accommodation, with high risk. The template sets these risk levels, and the matrix sets how many requirements a plan must meet at each exposure. No rule sets those counts.' },
    ...TAAP_SUPPORT,
    { cite: 'CSU TAAP Authoring Template, Administrative Approval', kind: 'csu_policy',
      says: 'The TAAP is signed by the Department Chair or Manager, the Dean or Division Vice President, and the ADA Compliance Officer. Each signer confirms they have "evaluated the associated institutional risks and accommodation requirements" and found the plan "an acceptable interim solution." The warning level tells the signers, by consequence, what they accept.' },
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
      says: 'An aid or service given to people with disabilities must be as effective as what others get. An alternative with fewer functions does not meet this. The law does not scale with exposure, so a plan that meets fewer than six requirements is a Non-Equal Alternative, not a compliant result.' },
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
      says: 'A plan that meets fewer than six requirements is a Non-Equal Alternative with moderate institutional risk, and the signers would have to accept that risk. The matrix does not ask them to: the plan must meet the TAAP standard or the request is denied, unless the president or a designee determines in writing that equally effective access would be an undue burden or a fundamental alteration. The standard is the matrix\'s, stated in the denial, not a number in any rule.' },
    { cite: 'CSU TAAP Authoring Template, Process Outcome', kind: 'csu_policy', reason: ['no_alternative'],
      says: 'A plan that meets none of the six requirements is "unable to provide alternative means of access", and the template calls it a high risk to the institution. Access would then depend entirely on individual accommodation.' },
    { cite: 'CSU Executive Order 1111, section IV.C.4', kind: 'csu_policy', reason: ['no_alternative'],
      says: 'The CSU strives for Universal Design that "will reduce the need for, and costs associated with, individual accommodations for inaccessible technology products." The procurement review does not approve a product whose access rests on accommodation.' },
  ],
  // Holds. A hold is not an answer about the barrier, so each hold has its own basis.
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
      says: 'The depth of review depends on how the product will be used. The review cannot be sized without the user count.' },
  ],
  veracity_below_floor: [
    { cite: 'CSU ATI success indicator 1.8-pro', kind: 'csu_policy',
      says: 'Each campus has a process to validate vendors\' conformance claims.' },
    { cite: 'CSU ATI Procurement Process, Step 3', kind: 'csu_policy',
      says: 'The ATI reviewer approves or denies the acquisition based on the review findings. The matrix confirms the vendor\'s claim of no barrier before an approval rests on it, and confirms the barriers found at the first TAAP review.' },
  ],
};

// Before a TAAP is on file (hold 4), the case is held to the rules the TAAP must meet.
AUTHORITY.taap_needed = AUTHORITY.approve_with_taap;

/** The entries that bear on one determination. */
function authorityFor(key, ictKind, severity, denyReason = null, level = null) {
  return (AUTHORITY[key] ?? []).filter((a) =>
    (!a.ict || a.ict.includes(ictKind)) && (!a.severity || a.severity.includes(severity))
    && (!a.reason || a.reason.includes(denyReason)) && (!a.exposure || a.exposure.includes(level)));
}

/** How far the barriers reach together: blocked function and group pairs, and S2 findings. */
const pairKey = (f) => `${f.essentialFunction || f.role}|${f.group}`;

/**
 * S2 barriers that add up to S3. A user performs a function only by passing every barrier on it,
 * so S2 barriers stacked on one function block it. At high exposure, S2 barriers spread across
 * most of the product are more than minimal impact taken together.
 */
function accumulation(review, level) {
  const c = CALIBRATION.accumulation;
  const counts = {};
  for (const f of review.findings.filter((x) => x.severity === 'S2')) counts[pairKey(f)] = (counts[pairKey(f)] ?? 0) + 1;
  const stacked = Object.entries(counts).filter(([, n]) => n >= c.stack).map(([k, n]) => {
    const [essentialFunction, group] = k.split('|');
    return { essentialFunction, group, count: n };
  });
  const spreadPairs = Object.keys(counts).length;
  const spread = level === c.spreadAt && spreadPairs >= c.spreadPairs;
  return { stacked, spreadPairs, escalated: stacked.length ? 'stacked' : spread ? 'spread' : null };
}

function breadth(review, stacked = []) {
  const c = CALIBRATION.breadth;
  const blocked = new Set([...review.findings.filter((f) => f.severity === 'S3').map(pairKey),
    ...stacked.map((s) => `${s.essentialFunction}|${s.group}`)]).size;
  const harder = review.findings.filter((f) => f.severity === 'S2').length;
  const level = Math.min(2, (blocked >= c.blockedCuts[1] ? 2 : blocked >= c.blockedCuts[0] ? 1 : 0)
    + (harder >= c.s2AddsAt ? 1 : 0));
  return { level, blocked, harder };
}

/**
 * The TAAP standard: the minimum number of the six requirements a plan must meet, set by the
 * pressure of exposure and breadth. A plan below it is denied. The warning rises with the
 * pressure and with the gap to a full TAAP, so a plan at the minimum is approved under a
 * warning, and a full plan at high exposure still carries one from pressure alone. Before a
 * TAAP is on file the gap is unknown, and the warning reflects the pressure alone.
 */
function taapStandard(review, level, breadthLevel) {
  const c = CALIBRATION.taapStandard;
  const pressure = rank(level) + breadthLevel;
  const required = c.required[pressure];
  const met = review.taap?.exists ? taapMet(review.taap) : null;
  const shortfall = met == null ? null : Math.max(0, required - met);   // against the minimum
  const gap = met == null ? null : TAAP_REQUIREMENTS.length - met;        // against a full TAAP
  const w = pressure + (gap ?? 0);
  const warning = w >= c.warning.high ? 'high' : w >= c.warning.elevated ? 'elevated' : 'low';
  return { pressure, required, met, shortfall, gap, warning, state: 'calibrate' };
}

/**
 * What each warning level tells the purchaser, and what follows from it. The cuts are
 * CALIBRATION's. The meanings follow the principle that residual risk is stated by
 * consequence and owned by a named officer: the sentence names who depends on the plan,
 * what the department carries, and who acknowledges it. The level never moves the TAAP
 * standard, which is the tolerance line.
 */
const WARNING_LEVELS = {
  low: {
    label: 'Low',
    means: 'A small or optional audience, and a plan that covers equally effective access. The residual risk is the ordinary risk of a temporary plan.',
    action: 'The ATI review team reviews the TAAP annually.',
  },
  elevated: {
    label: 'Elevated',
    means: 'Either the audience is large or required, or the plan leaves named requirements uncovered. The department carries support for those requirements until the vendor\'s roadmap closes the barriers.',
    action: 'The Dean or Division Vice President signs knowing what the plan leaves to staff support and to the vendor\'s roadmap. The ATI review team reviews the TAAP at the first roadmap milestone or at 12 months, whichever comes first.',
  },
  high: {
    label: 'High',
    means: 'A large or required audience depends on staff support for access the plan does not provide, or on a full plan at the highest exposure. The Title II duty continues and rests on the department\'s capacity and the vendor\'s remediation.',
    action: 'Weigh the more accessible product before buying. The Dean or Division Vice President acknowledges the residual risk in the TAAP. The ATI review team reviews the TAAP at the first roadmap milestone.',
  },
  state: 'proposed', grounds: ['residual-risk-stated-and-owned', 'time-bound-alternative-when-not-conformant'],
};

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
 * @property {string} essentialFunction
 * @property {'S0'|'S1'|'S2'|'S3'} severity
 * @property {string[]} [wcag]     success criteria, as evidence
 *
 * @typedef {Object} Review        What the reviewer supplies.
 * @property {keyof ICT_KINDS} ictKind
 * @property {string[]} floors     ids from FLOORS that are true
 * @property {string[]} [bypasses] ids from BYPASSES that are true
 * @property {Object<string, Answer>} answers   keyed by factor id
 * @property {Finding[]} findings
 * @property {string} [evidenceNote] who supplied a demonstration, audit or full manual review, the method and the date;
 *           printed in the determination when the evidence is not an ACR
 * @property {string} evidence     id from EVIDENCE, as recorded: E0, E1-, E1, E2a, E2b or E3b. E1+ and
 *           E3a are derived by `acrLevel` from the ACR record and never recorded. E3 from an earlier record reads as E3b
 * @property {{issued?: string, lastMajorRelease?: string, author?: 'outside'|'vendor', authorName?: string,
 *             remarks?: 'bug_report'|'feature_named'|'restated', spotCheck?: 'none'|'agrees'|'contradicts', spotCheckNote?: string,
 *             defects?: string[], accepted?: boolean, acceptedNote?: string}} [acr]
 *           the ACR's front page and the spot check, read when evidence is E1 or E1-. `issued` is the
 *           evaluation date, YYYY-MM. `spotCheckNote` records the functions covered and the assistive technology used
 * @property {string} [reviewDate]  YYYY-MM-DD; today when omitted. Sets the ACR's age and is stamped on the determination
 * @property {'open'|'unavailable'} [validation]  whether the evidence can still be raised. The ATI
 *           review team records 'unavailable' when no demonstration is offered and it has no test
 *           access; the review then proceeds under the fallback
 * @property {boolean} [moreAccessibleProductExists]
 * @property {string} [taap.exception]  'none', 'claimed' or 'determined': an undue burden or fundamental
 *           alteration claim by the requester, or the written determination on file
 * @property {{exists: boolean, meets: Object<string, boolean>}} [taap]  the TAAP section;
 *           `meets` is keyed by TAAP_REQUIREMENTS id
 *
 * @typedef {Object} Determination What `evaluate` returns and the record keeps.
 * @property {string} matrixVersion
 * @property {Object} standard
 * @property {{level: Level, floorsApplied: string[], usersValue: number|null, start: Level, lowest: Level,
 *             answerLevels: Object<string, Level>, points: number, maxPoints: number, answerBand: Level,
 *             lowered: Level, unknownCount: number, unknownsMatter: boolean}} exposure
 * @property {string} severity     'S0'..'S3', 'S?' when unknown, 'S3 (accumulated)' or 'S3 (provisional)'
 * @property {boolean} fallback    the evidence cannot be raised to the floor, so Severity is S3
 *           (provisional) with the barriers found as a minimum
 * @property {string} evidence     the level after `acrLevel`
 * @property {{rank: number, floor: number, binds: boolean, confirmed: boolean, acr: Object|null,
 *             raise: {by: string, label: string, text: string}|null}} veracity
 *           `raise` names the step that lifts evidence below the floor, from RAISE, and is null when confirmed;
 *           `binds` at high exposure, or when the risk grade rests on the vendor's Supports rows; `confirmed` when the
 *           rank meets the floor; `acr` is the `acrLevel` result for an ACR
 * @property {string} outcome      key of OUTCOMES; 'on_hold' whenever `hold` is set
 * @property {string|null} hold    id from HOLDS, when one applied
 * @property {string|null} bypass  id from BYPASSES, when one ended the review at intake
 * @property {string[]} requires   conditions the approval carries
 * @property {string|null} approver  the TAAP signers, when a TAAP is involved
 * @property {{months: number, contract: Level|null}|null} taapReview  when the TAAP is
 *           reviewed: every `months`, or at renewal if sooner; `contract` is the contract length
 * @property {{level: number, blocked: number, harder: number}} breadth
 * @property {{pressure: number, required: number, met: number|null, shortfall: number|null,
 *             gap: number|null, warning: 'low'|'elevated'|'high'}|null} taapStandard
 *           `shortfall` counts against the minimum and decides a denial; `gap` counts against
 *           a full TAAP and sets the warning
 *           set whenever the risk grade is Alternate access required, including on hold 4
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
const minLevel = (a, b) => (rank(b) < rank(a) ? b : a);
/** The user count tier: its start level and the lowest level the other answers can reach. */
const userTier = (n) => CALIBRATION.userTiers.find((t) => n <= t.upTo);

function factorLevel(factor, answer) {
  const value = answer ? (answer.reviewer ?? answer.requester) : null;
  if (value == null) return null;
  if (!factor.numeric) return value;
  return userTier(value).start;
}

/** The six answers other than the user count. */
const ANSWER_FACTORS = GROUPS.flatMap((g) => g.factors).filter((f) => !f.numeric);
const MAX_POINTS = 2 * ANSWER_FACTORS.reduce((s, f) => s + CALIBRATION.answerWeights[f.id], 0);

function answerBand(points) {
  return points >= CALIBRATION.answerBands.high ? 'high' : points >= CALIBRATION.answerBands.medium ? 'medium' : 'low';
}

/**
 * Exposure from the user count, the other answers and the floors. The user count is required,
 * and the review holds without it. It sets the starting level and the lowest level the other
 * answers can reach. The other six answers are optional and score points, with a blank scored
 * as high, so an answer entered can only keep or lower the level. A floor fact then raises it.
 */
function exposure(review) {
  const floorsApplied = FLOORS.filter((f) => review.floors.includes(f.id));
  const users = review.answers?.users;
  const usersValue = users ? (users.reviewer ?? users.requester) ?? null : null;
  const unknownsMatter = usersValue == null;
  const tier = unknownsMatter ? { start: 'high', lowest: 'high' } : userTier(usersValue);
  let unknownCount = unknownsMatter ? 1 : 0;
  let points = 0;
  const answerLevels = {};
  for (const f of ANSWER_FACTORS) {
    const l = factorLevel(f, review.answers[f.id]);
    if (l == null) unknownCount++;
    answerLevels[f.id] = l ?? 'high';
    points += CALIBRATION.answerWeights[f.id] * rank(answerLevels[f.id]);
  }
  const bandLevel = answerBand(points);
  const lowered = maxLevel([minLevel(tier.start, bandLevel), tier.lowest]);
  const floor = maxLevel(floorsApplied.map((f) => f.min));
  const level = maxLevel([floor, lowered]);

  return { level, floorsApplied: floorsApplied.map((f) => f.id), usersValue, start: tier.start, lowest: tier.lowest,
    answerLevels, points, maxPoints: MAX_POINTS, answerBand: bandLevel, lowered, unknownCount, unknownsMatter };
}

/** Worst severity across all roles' essential functions, or 'S?' with no findings and no evidence. */
function worstSeverity(review) {
  if (!review.findings.length) return review.evidence === 'E0' ? 'S?' : 'S0';
  return review.findings.reduce((w, f) => (Number(f.severity[1]) > Number(w[1]) ? f.severity : w), 'S0');
}

/**
 * Settle an Alternate access required risk grade. Returns [outcome, reason, basis]: the deny reason for a Deny,
 * the hold id for on_hold, and basis 'exception' when a written determination carries the plan.
 */
function resolveTaap(review, severity, std) {
  // At S3 the CSU buys the more accessible product, even when a TAAP could be written.
  if (severity === 'S3' && review.moreAccessibleProductExists) return ['deny', 'more_accessible_product', null];
  if (!review.taap?.exists) return ['on_hold', 'taap_needed', null];
  if (std.shortfall === 0) return ['approve_with_taap', null, null];
  // A plan that meets nothing is no TAAP, at any severity. It leaves access to individual
  // accommodation, and no determination rescues it, because the law still requires some other
  // action to the maximum extent possible.
  if (std.met === 0) return ['deny', 'no_alternative', null];
  // Below the standard, at any severity and pressure, a Non-Equal Alternative is lawful only
  // under a written undue burden or fundamental alteration determination (28 CFR 35.204;
  // 508 E202.6). The shortfall is recorded in the denial and the hold, never accepted.
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
  // An ACR's level comes from its record; every other level is as recorded.
  const reviewDate = (review.reviewDate ?? new Date().toISOString()).slice(0, 10);
  const acr = ACR_LEVELS.includes(review.evidence) ? acrLevel(review.evidence, review.acr, reviewDate.slice(0, 7)) : null;
  const ev = EVIDENCE.find((e) => e.id === (acr ? acr.level : (LEGACY_EVIDENCE[review.evidence] ?? review.evidence)));
  const base = { matrixVersion: MATRIX_VERSION, reviewDate, standard: ICT_KINDS[review.ictKind],
    exposure: exp, severity, evidence: ev.id, veracity: { rank: ev.rank, floor: 0, binds: false, confirmed: true, acr },
    breadth: breadth(review), accumulation: null, fallback: false, requires: [], approver: null,
    taapReview: null, taapStandard: null, roadmap: false, contractTerms: [], bypass: null };

  // The accommodation purchase ends the review at intake. Nothing below is rated.
  const bypass = BYPASSES.find((b) => review.bypasses?.includes(b.id));
  if (bypass) {
    return { ...base, outcome: bypass.outcome, hold: null, bypass: bypass.id, requires: ['accommodation_scope'],
      exception: false, taapOnFile: false, caveats: [], denyReason: null, taapUnmet: [],
      contractTerms: CONTRACT_TERMS.filter((t) => t.appliesTo === 'all').map((t) => t.id),
      authority: authorityFor(bypass.id, review.ictKind, severity) };
  }

  const holdFor = (hold) => ({ ...base, outcome: 'on_hold', hold,
    authority: authorityFor(hold, review.ictKind, severity) });
  if (unknownSeverity && !unavailable) {
    // Hold 1 waits for vendor evidence, and the raising step is the same as for no ACR.
    base.veracity = { ...base.veracity, confirmed: false, raise: { by: 'vendor_evidence', ...RAISE.vendor_evidence } };
    return holdFor('severity_unknown');
  }
  const acc = accumulation(review, exp.level);
  base.accumulation = acc;
  // With no evidence at all, the barriers are assumed to reach widely, as unknown answers are.
  base.breadth = unknownSeverity ? { level: 2, blocked: 0, harder: 0, assumed: true } : breadth(review, acc.stacked);
  if (severity === 'S2' && acc.escalated) {
    severity = 'S3';                         // S2 barriers that add up to a blocked function
    base.severity = 'S3 (accumulated)';
  }
  if (exp.unknownsMatter) return holdFor('answers_unknown');
  // The Veracity floor binds every risk grade at high exposure, and at low and medium a risk
  // grade that rests on the vendor's denials, "No alternate access required". Below it, the ATI
  // review team raises the evidence and the review resumes here (hold 3). At low and medium a
  // grade of "Alternate access required" rests on the barriers found, which are credible at any
  // rank, so the review proceeds on them with the standard provisional. At high the TAAP's scope
  // rests on the denials too, so the evidence is raised before the TAAP is written.
  const floor = veracityFloor(exp.level);
  const binds = unknownSeverity || exp.level === 'high' || GRID[exp.level][severity].grade === 'approve';
  const confirmed = !unknownSeverity && ev.rank >= floor;
  const by = raiseStep(acr);
  base.veracity = { ...base.veracity, floor, binds, confirmed, raise: confirmed ? null : { by, ...RAISE[by] } };
  if (unknownSeverity || (binds && ev.rank < floor)) {
    if (!unavailable) return holdFor('veracity_below_floor');
    // The fallback. Unproven conformance is treated as hiding a blocking barrier, so the TAAP
    // is the remedy. The barriers found stay as a minimum, and Breadth stays as found.
    severity = 'S3';
    base.severity = 'S3 (provisional)';
    base.fallback = true;
  }

  const cell = GRID[exp.level][severity];
  const std = cell.grade === 'needs_taap' ? taapStandard(review, exp.level, base.breadth.level) : null;
  // The standard may rise when evidence arrives: under the fallback, and whenever the
  // vendor's denials are unconfirmed, since the barriers found are then a minimum.
  if (std) std.provisional = base.fallback || !base.veracity.confirmed;
  // Deny stands on the evidence in hand: weak evidence can hide barriers but not invent them,
  // so the pressure and the standard computed from the findings on file are minimums.
  const [outcome, reason, basis] = std ? resolveTaap(review, severity, std) : [cell.grade, null, null];
  const denyReason = outcome === 'deny' ? reason : null;
  const held = outcome === 'on_hold';        // a TAAP hold: no TAAP on file, or a claim referred
  const withTaap = held || outcome === 'approve_with_taap';
  const roadmap = withTaap || (outcome === 'approve' && severity !== 'S0' && ROADMAP_LEVELS.includes(exp.level));
  const taapUnmet = review.taap?.exists
    ? TAAP_REQUIREMENTS.filter((r) => review.taap.meets?.[r.id] !== true).map((r) => r.id) : [];
  const contractFactor = GROUPS.flatMap((g) => g.factors).find((f) => f.id === 'contract_length');
  return {
    ...base,
    outcome,
    hold: held ? reason : null,
    requires: outcome === 'deny' ? [] : [
      ...(cell.requires ?? []).filter((r) => !NEEDS_ICT[r] || NEEDS_ICT[r].includes(review.ictKind)),
      ...(basis === 'exception' ? ['exception_record'] : []),
      ...(std?.provisional ? ['validation_at_review'] : []),
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
/** How the user count and the other answers reached the answers' level, as one sentence without a capital. */
function answersPhrase(e) {
  const tiers = CALIBRATION.userTiers;
  const below = tiers[tiers.indexOf(userTier(e.usersValue)) - 1];
  const effect = rank(e.answerBand) >= rank(e.start) ? `so it stays ${e.start}`
    : e.lowered === e.answerBand ? `so they lower it to ${e.lowered}`
    : `so they lower it to ${e.lowered}, the lowest level for more than ${below.upTo} users`;
  return `the user count of ${e.usersValue} starts Exposure at ${e.start}, and the other answers score ${e.points} of ${e.maxPoints} points, which is ${e.answerBand}, ${effect}`;
}
const EVIDENCE_PHRASE = {
  E0: 'no accessibility evidence',
  'E1-': 'a vendor ACR with a report defect we did not accept, or one our spot check contradicted',
  E1: 'a vendor ACR with no report defect, not yet taken at face value',
  'E1+': 'a vendor ACR with no report defect, taken at face value',
  E2a: 'a live vendor demonstration of the essential functions with assistive technology',
  E2b: 'a third-party audit with a named test method',
  E3a: 'a vendor ACR with no report defect, confirmed by our own spot check of the essential functions',
  E3b: 'a full manual review by the ATI team',
};
/** The evidence phrase, reading "a report defect we accepted" for an ACR the analyst accepted. */
function evidencePhrase(id, acr) {
  const phrase = EVIDENCE_PHRASE[id];
  return acr && acr.accepted ? phrase.replace('with no report defect', 'with a report defect we accepted') : phrase;
}
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
  accommodation_scope: 'The approval covers the accommodation it serves only. Use of the product beyond the named person returns it to review.',
};
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
/**
 * The warning sentence, in the shape of a residual risk statement: the level with the numbers
 * behind it, who depends on the plan and for what, the audience the pressure counts, what the
 * department carries, and what the signer does. WARNING_LEVELS holds each level's action.
 */
function warningText(d, review) {
  const std = d.taapStandard;
  const level = WARNING_LEVELS[std.warning];
  const sev = d.severity.slice(0, 2);
  const e = d.exposure;
  const lines = [`The warning level is ${std.warning}: pressure ${std.pressure} of 4${std.gap == null ? ', with no TAAP on file yet' : std.gap === 0 ? ', and the plan is a full TAAP' : `, and the plan is ${plural(std.gap, 'requirement')} short of a full TAAP`}.`];
  const worst = review.findings.filter((f) => f.severity === sev);
  const who = worst.length ? list([...new Set(worst.map((f) => `${ROLE_WORD[f.role]} ${WHO[f.group]}`))]) : 'users with disabilities';
  const fns = [...new Set(worst.map((f) => f.essentialFunction).filter(Boolean))];
  const what = fns.length ? list(fns.map((f) => `"${f}"`)) : 'the essential functions';
  const audience = `${e.level} exposure${d.breadth.level ? `, with barriers that reach ${d.breadth.level === 2 ? 'widely' : 'several functions or groups'}` : ''}`;
  if (d.fallback) lines.push(`The review treats the unproven barriers as blocking, so it takes ${who} to depend on the plan for ${what}, at ${audience}.`);
  else if (sev === 'S3') lines.push(`${cap(who)} cannot perform ${what} without the plan's support, at ${audience}.`);
  else lines.push(`${cap(who)} can perform ${what} only with clearly more time or effort, so the plan carries equal access, at ${audience}.`);
  if (std.gap) lines.push(`Until the vendor's roadmap closes the barriers, the department carries the support for the ${plural(std.gap, 'requirement')} the plan leaves uncovered, and the duty of equally effective access continues.`);
  else if (std.gap === 0) lines.push(std.warning === 'low' ? 'The plan covers all six requirements, so the residual risk is the ordinary risk of a temporary plan.' : 'The plan covers all six requirements. The warning stands on the audience alone, which depends on a temporary plan while the vendor remediates.');
  else lines.push('The gap is unknown until a TAAP is on file, so the warning stands on pressure alone and rises with each requirement the plan misses.');
  if (std.met != null) lines.push(level.action);
  return lines.join(' ');
}
const DENY_BECAUSE = {
  more_accessible_product: 'a more accessible product meets the same need',
  no_alternative: 'the TAAP on file meets none of the six requirements',
  taap_below_standard: 'the TAAP on file falls below the standard for this exposure',
};
/** The result heading the requester reads for each hold. */
const HEADLINE = Object.fromEntries(HOLDS.map((h) => [h.id, `On hold for ${h.waits}`]));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Lowercase the first letter, unless the word is an acronym (ATI, CSU).
const lower = (s) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const list = (items) => (items.length < 2 ? items.join('')
  : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const evidenceName = (floor) => (floor >= 4
  ? 'our own spot check, a live demonstration, a third-party audit or a full manual review by the ATI team (E2 or better)'
  : floor >= 3 ? 'a vendor ACR with no report defect, taken at face value, or our spot check (E1+ or better)'
    : 'a vendor ACR with no report defect (E1 or better)');
const QUALIFICATION_PHRASE = {
  age: { raised: 'evaluated within the last year and after the last major release', lowered: 'evaluated more than a year ago', unknown: 'of unrecorded date', out: 'too old to count' },
  author: { raised: 'written by a named outside firm', lowered: 'written by the vendor or by no named author' },
  remarks: { raised: 'its remarks read like a bug report, naming where each barrier is and who it affects', named: 'its remarks name the feature with issues but not where it is or how it falls short', lowered: 'its remarks are blank, restate the criteria, repeat across rows or hedge' },
};
/** The ticked report checks, named in lower case, for the requester. */
const defectList = (acr) => list((acr.defects || []).map((id) => ACR_CHECKS.find((c) => c.id === id)).filter(Boolean).map((c) => lower(c.text)));
/** How the ACR earned its level, for the requester. */
function acrPhrase(acr) {
  const named = defectList(acr);
  if (acr.stale) return 'The ACR is older than our limit or predates the product\'s last major release, so we do not rely on its Supports rows until the vendor supplies a current report.';
  if (!acr.clean) return `The ACR fails our report check${named ? ` (${named})` : ''}, so we do not rely on its Supports rows until the vendor corrects the report or we accept the defect with the reason noted.`;
  const accepted = acr.accepted ? `The ACR fails our report check${named ? ` (${named})` : ''}, and we accepted the defect${acr.acceptedNote ? ` because ${lower(acr.acceptedNote)}` : ''}. ` : '';
  const by = acr.author === 'raised' && acr.authorName ? ` (${acr.authorName})` : '';
  const trust = acr.spotCheck !== 'none' ? '' : acr.trusted ? '. We take it at face value' : '. We do not take it at face value yet';
  const q = `The ACR was ${QUALIFICATION_PHRASE.age[acr.age]} and ${QUALIFICATION_PHRASE.author[acr.author]}${by}, and ${QUALIFICATION_PHRASE.remarks[acr.remarks]}${trust}`;
  const note = acr.spotCheckNote ? ` (${acr.spotCheckNote})` : '';
  const spot = { none: '', agrees: `, and our spot check of the essential functions${note} agrees with it`, contradicts: `, and our spot check${note} found a barrier it reports as Supports` }[acr.spotCheck];
  return `${accepted}${q}${spot}.`;
}

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
  const headline = d.hold ? HEADLINE[d.hold] : OUTCOMES[d.outcome].label;
  const sevLabel = d.severity.replace(' (', ', ').replace(')', '');   // "S3, provisional"
  const grade = d.bypass ? 'Accommodation purchase | The review rates none of the four factors'
    : `Exposure ${e.unknownsMatter ? 'Unknown' : cap(e.level)} | ${sev === 'S?' ? 'Barriers unknown' : `${cap(SEVERITY_WORD[sev])} (${sevLabel})`} | Evidence ${ev.id}`;
  const finish = (how, why, next) => {
    const sections = [
      { heading: 'How we graded it', lines: how, bullets: true },
      { heading: 'Why this result', lines: why },
      { heading: 'What happens next', lines: next, bullets: true },
    ].filter((s) => s.lines.length);
    if (d.authority?.length) sections.push({ heading: 'The rules behind this result', bullets: true,
      lines: d.authority.map((a) => `${a.cite} (${AUTHORITY_KINDS[a.kind]}). ${a.says}`) });
    const about = [product !== 'This product' ? product : null, ctx.vendor?.trim() ? `vendor: ${ctx.vendor.trim()}` : null,
      ctx.unit?.trim() ? `requested by ${ctx.unit.trim()}` : null].filter(Boolean).join(', ');
    const footer = `Graded with the SFBRN accessibility review matrix, version ${MATRIX_VERSION}, on ${ctx.date ?? d.reviewDate}.`;

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
};

  if (d.bypass) {
    const b = BYPASSES.find((x) => x.id === d.bypass);
    return finish(
      [`${product} is ${lower(b.fact)}.`,
        'The interactive process between that person and the campus settled what the person needs, and this purchase carries it out.',
        'The review of the product for a general audience does not apply, so the review rates none of Exposure, Severity, Breadth and Veracity.'],
      ['The purchase carries out an accommodation the campus has agreed to, so the review approves it.'],
      [NEEDS.accommodation_scope,
        'The contract includes the CSU accessibility terms below.',
        ...CONTRACT_TERMS.filter((x) => d.contractTerms.includes(x.id)).map((t) => `${cap(t.text)}.`)]);
  }

  // How we graded it
  const how = [];
  how.push(KIND_PHRASE[review.ictKind]);
  const floors = FLOORS.filter((f) => e.floorsApplied.includes(f.id));
  how.push(e.unknownsMatter ? 'Exposure is not yet rated, because the user count is missing.' : floors.length
    ? `Exposure is ${e.level} because ${list(floors.map((f) => BECAUSE[f.id]))}, ${floors.length > 1 ? 'facts that each set' : 'a fact that sets'} a minimum exposure on ${floors.length > 1 ? 'their' : 'its'} own. Apart from ${floors.length > 1 ? 'those facts' : 'that fact'}, ${answersPhrase(e)}.`
    : `${cap(answersPhrase(e))}.`);
  const unknown = Object.keys(ASK).filter((k) => { const a = review.answers[k]; return !a || (a.reviewer ?? a.requester) == null; });
  if (unknown.length) how.push(`${unknown.length === 1 ? 'The answer on' : 'Answers on'} ${list(unknown.map((k) => ANSWER_NAME[k]))} ${unknown.length === 1 ? 'is missing and maps' : 'are missing and map'} to the highest level.`);
  const overridden = Object.keys(ASK).filter((k) => { const a = review.answers[k]; return a && a.reviewer != null && a.requester != null && a.reviewer !== a.requester; });
  if (overridden.length) how.push(`The reviewer changed the answer for ${list(overridden.map((k) =>
    `${ANSWER_NAME[k]} (requester answer ${review.answers[k].requester}, reviewer answer ${review.answers[k].reviewer})`))}.`);
  const worst = review.findings.filter((f) => f.severity === sev);
  const acc = d.accumulation;
  if (sev === 'S?') how.push('No accessibility evidence exists yet, so the barriers are unknown.');
  else if (d.fallback) how.push(d.breadth.assumed
    ? 'The ATI review team cannot obtain accessibility evidence, so the review treats the product as S3 with wide barrier reach.'
    : `The ATI review team cannot raise the evidence to the Veracity floor for this exposure, so the review treats the product as S3, ${review.findings.length ? 'with the barriers found as a minimum' : 'because no one has verified the ACR\'s claim of no barriers'}.`);
  else if (!review.findings.length) how.push('No barriers appear on any user path.');
  else if (d.severity.includes('accumulated')) {
    how.push('No single barrier stops a user, but the S2 barriers, which make essential functions clearly harder to perform, add up to a critical barrier (S3).');
    if (acc.stacked.length) {
      how.push(`${cap(list(acc.stacked.map((s) => `users ${WHO[s.group]} meet ${s.count} such barriers on "${s.essentialFunction}"`)))}. A user performs a function only by passing every barrier on it, so ${CALIBRATION.accumulation.stack} or more S2 barriers on one function block that function.`);
    } else {
      how.push(`At high exposure, S2 barriers cover ${acc.spreadPairs} pairs of essential function and user group, at or above the critical threshold of ${CALIBRATION.accumulation.spreadPairs} pairs.`);
    }
  } else {
    const effect = { S1: 'meet minor barriers in', S2: 'need clearly more time or effort to perform', S3: 'cannot independently perform' }[sev];
    const who = worst.map((f) => `${ROLE_WORD[f.role]} ${WHO[f.group]} ${effect} ${f.essentialFunction ? `"${f.essentialFunction}"` : 'an essential function'}`);
    how.push(`The most serious finding is ${SEVERITY_WORD[sev]} (${sev}). ${cap(list(who))}.`);
    const others = review.findings.length - worst.length;
    if (others) how.push(`The review also found ${plural(others, 'less serious barrier')}.`);
  }
  const evidenceBy = review.evidenceNote && !d.veracity.acr ? `, ${review.evidenceNote}` : '';
  how.push(ev.id === 'E0' ? 'No accessibility evidence is on file (E0).' : `The evidence on file is ${evidencePhrase(ev.id, d.veracity.acr)} (${ev.id})${evidenceBy}.`);
  if (d.veracity.acr) how.push(acrPhrase(d.veracity.acr));
  if (!d.hold && !d.fallback && !d.veracity.confirmed && sev !== 'S?') {
    how.push(`The result rests on the barriers the vendor reports, which count at any evidence level. The vendor's claim of no barrier elsewhere needs ${evidenceName(d.veracity.floor)} at ${e.level} exposure, so the barriers found are a minimum.`);
  }

  // Why this result
  const why = [];
  const pending = d.hold === 'taap_needed';
  const referred = d.hold === 'exception_claimed';
  const floor = veracityFloor(e.level);
  switch (d.hold) {
    case 'severity_unknown':
      why.push('An accessibility grade requires evidence, and none is on file.');
      why.push('Please ask the vendor for a current Accessibility Conformance Report on the WCAG edition, or arrange a live demonstration of the essential functions with assistive technology.');
      break;
    case 'answers_unknown':
      why.push('The user count sets the reach of the product, which sets the depth of review, so the review needs it before it rates anything. The other answers are optional, and a blank counts as high.');
      why.push(`Please tell us ${list(unknown.map((k) => ASK[k]))}.`);
      break;
    case 'veracity_below_floor': {
      why.push(`At ${e.level} exposure, ${sev === 'S0' ? 'the vendor\'s claim of no barriers' : `a finding of ${SEVERITY_WORD[sev]} (${sev})`} needs ${evidenceName(floor)} before the review proceeds, because a vendor's report is a claim about its own product.`);
      why.push(`The evidence on file is ${evidencePhrase(ev.id, d.veracity.acr)} (${ev.id}).`);
      why.push(d.veracity.raise.text);
      why.push('If the ATI review team cannot raise the evidence, the review treats the product as having a critical barrier (S3) and requires an alternate access plan (TAAP).');
      break;
    }
    case 'taap_needed':
    case 'exception_claimed':
    default:
      if (d.outcome === 'approve' && sev === 'S0') {
        why.push('No barriers appear on any user path, so the review approves the product.');
      } else if (d.outcome === 'approve' && sev === 'S1') {
        why.push('The barriers found make some essential functions harder to perform without preventing them.');
        why.push('The CSU TAAP template requires an alternate access plan (TAAP) only for barriers that prevent essential functions. The review approves the product without a TAAP.');
      } else if (d.outcome === 'approve') {
        why.push('The barriers found make some essential functions clearly harder to perform without preventing them.');
        why.push('At low exposure, the review approves the product without an alternate access plan (TAAP).');
        why.push('The product still fails the standard, and the law excuses no barrier this serious.');
      } else if (pending || referred || d.outcome === 'approve_with_taap' || d.outcome === 'deny') {
        const std = d.taapStandard;
        const approved = d.outcome === 'approve_with_taap';
        if (sev === 'S2') {
          why.push('The barriers found make some essential functions clearly harder to perform without preventing them.');
          why.push(`At ${e.level} exposure, the audience is too large for a minimal impact on access, so ${approved ? 'the review approves the product with' : 'the product needs'} an alternate access plan (TAAP).`);
        } else {
          why.push(`${d.severity.includes('accumulated') ? 'Together, the barriers stop' : 'A barrier stops'} some users from performing an essential function, so the review ${approved ? 'approves the product only with' : 'cannot approve the product without'} an alternate access plan (TAAP).`);
        }
        const unmet = TAAP_REQUIREMENTS.filter((r) => d.taapUnmet.includes(r.id));
        const need = std ? (std.required === 6 ? 'all six' : `at least ${std.required} of the six`) : '';
        const scale = d.breadth.level ? `at ${e.level} exposure, with barriers that reach ${d.breadth.level === 2 ? 'widely' : 'several functions or groups'}` : `at ${e.level} exposure`;
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
              ? 'The ATI review team cannot obtain accessibility evidence, so the review assumes wide barrier reach and the strictest standard.'
              : 'The ATI review team cannot raise the evidence to the Veracity floor, so the barriers found are a minimum and the standard may rise when evidence arrives.');
          } else if (std.provisional) {
            why.push('The vendor\'s claim of no barrier elsewhere is unconfirmed at this exposure, so the barriers found are a minimum and the standard may rise when evidence arrives.');
          }
          if (!d.taapOnFile) {
            why.push('No TAAP is on file yet.');
            why.push('A TAAP below that standard leads to a denial, unless the president or a designee determines in writing that equally effective access would be an undue burden or a fundamental alteration. The review denies a TAAP that meets none of the six requirements even then.');
          } else {
            why.push(std.shortfall
              ? `The TAAP on file meets ${std.met} of the six, ${plural(std.shortfall, 'requirement')} short of the standard.`
              : `The TAAP on file meets ${std.met === 6 ? 'all six, a full TAAP' : `${std.met} of the six, which meets the minimum of ${std.required} but is ${plural(std.gap, 'requirement')} short of a full TAAP`}.`);
            if (unmet.length) why.push(`The plan falls short where ${list(unmet.map((r) => r.failed))}.`);
            if (d.denyReason === 'taap_below_standard') {
              why.push('Signer acceptance of a below-standard plan is not available at any exposure.');
              why.push('The requester may ask the president or a designee for a written determination that equally effective access would be an undue burden or a fundamental alteration (28 CFR 35.164 and 35.204). With that determination on file, the review can approve the plan as a Non-Equal Alternative.');
            } else if (referred) {
              why.push('Signer acceptance of a below-standard plan is not available, and the requester claims that equally effective access would be an undue burden or a fundamental alteration.');
              why.push('That determination belongs to the president or a designee, in writing, after a review of all resources available to the program (28 CFR 35.164 and 35.204). High cost alone does not establish an undue burden.');
            } else if (d.exception) {
              why.push('A written determination by the president or a designee is on file that equally effective access would be an undue burden or a fundamental alteration, so the review approves the plan as a Non-Equal Alternative under 28 CFR 35.204.');
              why.push('The university must still provide access to the maximum extent possible, through the named department support for each missed requirement.');
            } else if (unmet.length) {
              why.push('The plan is therefore a Non-Equal Alternative, with named department support required for each missed requirement.');
            }
          }
          if (d.outcome !== 'deny') why.push(warningText(d, review));
          if (pending) why.push('The review holds until the SFBRN Procurement team and the requester have a signed TAAP on file.');
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
    next.push('First, check whether a more accessible product meets the same need. If one does, the review denies the request without a TAAP, because the CSU buys the most accessible product that meets the need.');
  }
  if (pending) {
    next.push(`${sev === 'S3' && std.warning !== 'low' ? 'If none does, the' : 'Next, the'} SFBRN Procurement team works with the requester to draft a TAAP on the CSU TAAP template. It must meet ${std.required === 6 ? 'all six requirements below' : `at least ${std.required} of the six requirements below`}.`);
    for (const r of TAAP_REQUIREMENTS) next.push(`${r.text}.`);
  }
  if (pending || d.outcome === 'approve_with_taap') {
    next.push('The TAAP names the responsible department, its support offering and the user contacts for problem reports. A problem report starts that support, with no accommodation request needed.');
    if (std && std.required < 6) next.push('For each missed requirement, the plan names the covering support, its provider and its response time.');
    next.push(`The TAAP includes a product-specific accessibility statement, written by the campus, with ${list(TAAP_STATEMENT.includes)}. The campus posts the statement ${TAAP_STATEMENT.postedAt}. It is separate from the vendor's own accessibility statement.`);
  }
  if (referred) next.push('The review resumes on receipt of the written determination. A determination that equally effective access would be an undue burden or a fundamental alteration lists the support that remains for each missed requirement.');
  if ((!d.hold || pending) && d.outcome !== 'deny') {
    for (const c of S2_CAVEATS.filter((x) => d.caveats.includes(x.id))) next.push(cap(c.text));
    for (const r of d.requires) next.push(r === 'validation_at_review' ? NEEDS[r] : `${pending ? 'The TAAP must also show that' : 'The approval requires that'} ${lower(NEEDS[r] ?? r)}`);
    if (d.roadmap) next.push('The vendor completes the CSU Vendor Accessibility Roadmap, with status, remediation timeline and workarounds for each barrier found.');
    if (d.approver) next.push(`${cap(d.approver)} sign the ${pending ? 'finished ' : ''}TAAP.`);
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

  return finish(how, why, next);
}

/**
 * The notes under the tester's copy of the rubric table. rubric-core.svg carries the table
 * alone, and the rubric document's definitions carry the rules.
 */
function rubricNotes() {
  const T = CALIBRATION.taapStandard;
  const acc = CALIBRATION.accumulation;
  const holdNo = (id) => HOLDS.findIndex((h) => h.id === id) + 1;
  return [
    'The TAAP standard is the minimum count of the six CSU TAAP requirements a plan must meet, scaled by P, the sum of the Exposure rank and Breadth. A full TAAP meets all six.',
    `The warning level derives from W = P + gap, the gap being the requirements short of a full TAAP, elevated from ${T.warning.elevated} and high from ${T.warning.high}. A full TAAP at high Exposure still carries a warning, from pressure alone. Each level carries a fixed meaning and action, stated in the Warning level definition.`,
    `No TAAP on file maps to hold ${holdNo('taap_needed')}, on hold for a TAAP, which carries the TAAP standard and the warning.`,
    `Below the standard, a written undue burden or fundamental alteration determination maps to Approve with TAAP as a Non-Equal Alternative, and a claim maps to hold ${holdNo('exception_claimed')}, on hold for a written determination.`,
    'The review denies a TAAP below the minimum at any severity and pressure, states the shortfall in the denial, and denies a plan that meets none of the six even under the exception. It approves a plan at the minimum under a warning; where the minimum is all six, only a full TAAP is at it.',
    `S2 escalates to S3 at ${acc.stack} S2 barriers stacked on one function for one user group, or at high Exposure with S2 barriers across ${acc.spreadPairs} function and group pairs.`,
    'At S3, a more accessible product that meets the same need maps to Deny.',
    `The Veracity floor column binds every risk grade at high Exposure, and at low and medium a No alternate access required grade, which rests on the vendor's Supports rows. At medium and high the floor is a clean ACR taken at face value (E1+), so most ACRs clear it. Evidence below the floor maps to hold ${holdNo('veracity_below_floor')}, where the ATI review team raises the evidence and re-rates Severity. At low and medium an Alternate access required grade rests on the barriers found and proceeds at any evidence level, with the TAAP standard provisional below the floor.`,
    'When the ATI review team cannot raise the evidence, the review proceeds at S3 (provisional) with the barriers found as a minimum, and Breadth 2 with no evidence at all.',
  ];
}

const ReviewMatrix = {
  MATRIX_VERSION, STATES, LEVELS, ROLES, FUNCTIONAL_GROUPS, CALIBRATION, ICT_KINDS, FLOORS, BYPASSES,
  GROUPS, SEVERITY, EVIDENCE, ACR_LEVELS, ACR_CHECKS, ACR_QUALIFICATIONS, acrLevel, RAISE, raiseStep, EVIDENCE_LIMITS, veracityFloor, RISK_GRADES, OUTCOMES, HOLDERS, HOLDS,
  GRID, TAAP_REQUIREMENTS, S2_CAVEATS, TAAP_TERMS, TAAP_STATEMENT, ROADMAP_LEVELS, CONTRACT_TERMS, accumulation, breadth, taapStandard, WARNING_LEVELS, AUTHORITY_KINDS, AUTHORITY, WHO, HEADLINE, exposure, worstSeverity, evaluate, explain, rubricNotes,
};

if (typeof module !== 'undefined' && module.exports) module.exports = ReviewMatrix;
else globalThis.ReviewMatrix = ReviewMatrix;
