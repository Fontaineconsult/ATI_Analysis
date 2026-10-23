/**
 * Apply the SFBRN review rubric to an ACR extraction.
 *
 * Reads <acr>.extraction.json from extract_acr.py, runs the twelve report checks and the three
 * qualifications of ../rubric-core.md section 5, and calls `acrLevel` from ../review-matrix.js
 * for the evidence level. Writes <acr>.review.json, the ACR record the tester loads, and
 * <acr>.review.md, the report the analyst reads.
 *
 *   node apply_rules.js <acr>.extraction.json --kind web|nonweb|mixed
 *        [--interfaces "web app, iOS app"] [--release YYYY-MM] [--today YYYY-MM]
 *
 * Every check returns fail, pass or analyst. Analyst means the extraction cannot settle the
 * check without a fact only the requisition holds, such as the interfaces being bought.
 * Prose follows ../../writing-style.md.
 */
const fs = require('fs');
const path = require('path');
const M = require('../review-matrix.js');

/**
 * Rules the rubric states in words only. Each is a proposal for the pilot to calibrate, and
 * the report names the one it applied.
 */
const CONFIG = {
  state: 'calibrate',
  // The bare-Supports check names complex criteria without a list. These are the eight
  // critical criteria of the SFBRN VPAT Review Process, plus 4.1.2 Name, Role, Value.
  complexCriteria: ['1.1.1', '1.2.2', '1.3.1', '1.4.1', '2.1.1', '2.2.2', '2.4.1', '2.4.3', '4.1.2'],
  // A remark repeated on this many rows or more counts as repeated text.
  repeatAt: 3,
  // Not Applicable on this many Level A and AA rows draws a process flag for the analyst.
  manyNotApplicable: 10,
  // The SFBRN VPAT Review Process rejects templates older than this.
  minTemplate: 2.5,
};

const ADMISSIONS = ['Partially Supports', 'Does Not Support'];
const WEAK_REMARKS = ['blank', 'restated', 'generic'];
// The rubric's hedge words. The model's `hedged` flag catches the rest, such as typically.
const HEDGE = /\b(some|most|generally)\b/i;
const isWcagAorAA = (r) => (r.level === 'A' || r.level === 'AA') && /^\d\.\d+\.\d+$/.test(r.criterion);
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const monthsBetween = (from, to) => {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
};
const cite = (r) => ({ criterion: r.criterion, page: r.page, quote: r.remarks || `(blank, rated ${r.conformance_raw})` });
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** Words of an interface name, for a loose match between what is bought and what is covered. */
const words = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !['app', 'the', 'and', 'for'].includes(w));
const covers = (covered, bought) => covered.some((c) => {
  const a = words(c);
  const b = words(bought);
  return b.length ? b.some((w) => a.includes(w)) : norm(c) === norm(bought);
});

function analyse(ex, opts) {
  const rep = ex.report;
  const rows = ex.rows || [];
  const today = opts.today;
  const issued = rep.evaluation_date || rep.report_date || null;
  const checks = {};
  const set = (id, result, why, evidence = []) => { checks[id] = { result, why, evidence }; };

  // ---- the document checks
  if (!opts.kind) set('wrong_edition', 'analyst', 'The kind of technology was not given, so the edition the report needs is unknown.');
  else if (opts.kind === 'nonweb') set('wrong_edition', 'pass', 'A non-web product is reviewed against the Section 508 Standards, which any edition covers.');
  else {
    const current = rep.standards_reported.some((s) => s === 'WCAG 2.1' || s === 'WCAG 2.2');
    set('wrong_edition', current ? 'pass' : 'fail', current
      ? `The report covers ${list(rep.standards_reported)}.`
      : `A ${opts.kind === 'web' ? 'web or mobile' : 'mixed'} product needs WCAG 2.1, and the report covers ${rep.standards_reported.length ? list(rep.standards_reported) : 'no named standard'}.`);
  }

  const missingFront = [!rep.report_date && !rep.evaluation_date ? 'no date' : null, !rep.product_version ? 'no product version' : null].filter(Boolean);
  if (missingFront.length) set('no_date_or_version', 'fail', `The report names ${list(missingFront)}.`);
  else if (opts.version && !norm(rep.product_version).includes(norm(opts.version))) {
    set('no_date_or_version', 'fail', `The report evaluated version ${rep.product_version}, and the purchase is version ${opts.version}.`);
  } else set('no_date_or_version', 'pass', `The report is dated ${issued} for version ${rep.product_version}.`);

  if (!issued) set('stale', 'analyst', 'The report gives no date, so its age is unknown. The date check above already fails.');
  else {
    const months = monthsBetween(issued, today);
    const beforeRelease = opts.release && issued < opts.release;
    if (months > M.CALIBRATION.acrMaxAgeMonths) set('stale', 'fail', `The evaluation is ${months} months old, past the limit of ${M.CALIBRATION.acrMaxAgeMonths}.`);
    else if (beforeRelease) set('stale', 'fail', `The evaluation (${issued}) predates the last major release (${opts.release}).`);
    else {
      const age = months < 1 ? 'less than a month old' : `${months} ${months === 1 ? 'month' : 'months'} old`;
      set('stale', opts.release ? 'pass' : 'analyst', opts.release
        ? `The evaluation is ${age} and follows the last major release.`
        : `The evaluation is ${age}. The month of the last major release was not given, so the analyst checks it.`);
    }
  }

  set('no_methods', rep.evaluation_methods ? 'pass' : 'fail',
    rep.evaluation_methods ? 'The report describes its evaluation methods.' : 'The report names no evaluation method.',
    rep.evaluation_methods ? [rep.evaluation_methods] : []);

  const screenReaders = rep.assistive_technologies.filter((a) => !/keyboard/i.test(a));
  const narrow = screenReaders.length <= 1 && rep.browsers.length <= 1;
  set('single_browser_at', narrow ? 'fail' : 'pass', narrow
    ? `The report names ${screenReaders.length ? `one assistive technology (${screenReaders[0]})` : 'no assistive technology'} and ${rep.browsers.length ? `one browser (${rep.browsers[0]})` : 'no browser'}.`
    : `The report names ${list(screenReaders) || 'keyboard testing'} and ${list(rep.browsers) || 'no browser'}.`);

  const notEvaluated = rows.filter((r) => isWcagAorAA(r) && r.conformance === 'Not Evaluated');
  const bareNA = rows.filter((r) => r.conformance === 'Not Applicable' && r.remark_type === 'blank');
  set('not_evaluated', notEvaluated.length || bareNA.length ? 'fail' : 'pass',
    notEvaluated.length || bareNA.length
      ? [notEvaluated.length ? `${notEvaluated.length} Level A or AA ${notEvaluated.length === 1 ? 'row reads' : 'rows read'} Not Evaluated` : null,
        bareNA.length ? `${bareNA.length} Not Applicable ${bareNA.length === 1 ? 'row gives' : 'rows give'} no reason` : null].filter(Boolean).join(', and ') + '.'
      : 'Every Level A and AA row carries a rating, and every Not Applicable row gives a reason.',
    [...notEvaluated, ...bareNA].map(cite));

  if (!opts.interfaces.length) {
    set('missing_interface', 'analyst', `The interfaces being bought were not given. The report covers ${list(rep.interfaces_covered) || 'no named interface'}.`);
  } else {
    const missing = opts.interfaces.filter((i) => !covers(rep.interfaces_covered, i));
    set('missing_interface', missing.length ? 'fail' : 'pass', missing.length
      ? `The purchase includes ${list(missing)}, which the report does not cover. It covers ${list(rep.interfaces_covered) || 'no named interface'}.`
      : `The report covers every interface in the purchase: ${list(opts.interfaces)}.`);
  }

  set('carve_outs', rep.scope_carve_outs.length ? 'fail' : 'pass',
    rep.scope_carve_outs.length ? `The notes exclude part of the product in ${rep.scope_carve_outs.length} ${rep.scope_carve_outs.length === 1 ? 'place' : 'places'}.` : 'The notes exclude no part of the product.',
    rep.scope_carve_outs);

  // ---- the remarks qualification, which decides whether the remarks checks count
  const admissions = rows.filter((r) => ADMISSIONS.includes(r.conformance));
  const complexSupports = rows.filter((r) => r.conformance === 'Supports' && CONFIG.complexCriteria.includes(r.criterion));
  // Repeated text counts across every rated row except Not Applicable, whose reasons repeat
  // by design ("this hardware criterion does not apply"), and Level AAA, which the review skips.
  const rated = rows.filter((r) => r.conformance !== 'Not Applicable' && r.level !== 'AAA');
  const counted = {};
  for (const r of rated) if (r.remarks.trim()) counted[norm(r.remarks)] = (counted[norm(r.remarks)] || 0) + 1;
  const repeatedText = new Set(Object.keys(counted).filter((k) => counted[k] >= CONFIG.repeatAt));
  const repeated = rated.filter((r) => repeatedText.has(norm(r.remarks)));
  const weakAdmissions = admissions.filter((r) => WEAK_REMARKS.includes(r.remark_type) || r.hedged || repeatedText.has(norm(r.remarks)));
  // A Supports remark on a complex criterion shows the work only when it names where, or the
  // method. A generic sentence such as "No issues were identified" does not.
  const bareComplex = complexSupports.filter((r) => WEAK_REMARKS.includes(r.remark_type));
  const allBugReports = admissions.every((r) => r.remark_type === 'bug_report') && complexSupports.every((r) => r.remark_type === 'bug_report');
  const remarks = weakAdmissions.length || bareComplex.length || repeated.length ? 'lowered' : allBugReports ? 'raised' : 'named';
  const remarksWhy = {
    lowered: [
      weakAdmissions.length ? `${weakAdmissions.length} of ${admissions.length} admissions ${weakAdmissions.length === 1 ? 'is' : 'are'} blank, restated, generic, hedged or repeated` : null,
      bareComplex.length ? `${bareComplex.length} Supports ${bareComplex.length === 1 ? 'row' : 'rows'} on complex criteria show no work` : null,
      repeated.length && !weakAdmissions.length ? `${repeated.length} rated rows repeat the same remark, such as "${repeated[0].remarks.replace(/\.$/, '')}"` : null,
    ].filter(Boolean).join(', and ') + '.',
    raised: admissions.length
      ? `All ${admissions.length} admissions read like a bug report, and every Supports row on a complex criterion gives an example or the method.`
      : 'The report admits no failure, and every Supports row on a complex criterion gives an example or the method.',
    named: 'The admissions name the features with issues, but not all of them say where, how or who.',
  }[remarks];

  // ---- the remarks checks. They count as report defects only when the remarks are lowered,
  // as in the tester, since remarks at or above the floor have already shown the work.
  const open = remarks === 'lowered';
  const remarkCheck = (id, failing, failWhy, passWhy) => set(id,
    failing.length ? (open ? 'fail' : 'closed') : 'pass',
    failing.length ? `${failWhy(failing.length)}${open ? '' : ' The check does not count, because the remarks read at or above the floor.'}` : passWhy,
    failing.map(cite));
  remarkCheck('no_remarks', admissions.filter((r) => r.remark_type === 'blank'),
    (n) => `${n} ${n === 1 ? 'admission has' : 'admissions have'} no remark.`, 'Every admission has a remark.');
  remarkCheck('bare_supports', bareComplex,
    (n) => `${n} Supports ${n === 1 ? 'row' : 'rows'} on complex criteria ${n === 1 ? 'gives' : 'give'} no example or method.`, 'Every Supports row on a complex criterion shows the work.');
  remarkCheck('contradicts_rating', rows.filter((r) => r.contradicts_rating),
    (n) => `${n} ${n === 1 ? 'remark describes' : 'remarks describe'} a result its rating does not match.`, 'No remark contradicts its rating.');
  remarkCheck('hedge_words', rows.filter((r) => r.hedged || HEDGE.test(r.remarks)),
    (n) => `${n} ${n === 1 ? 'remark hedges' : 'remarks hedge'} with some, most, generally or similar.`, 'No remark hedges.');

  // ---- the author qualification
  const outside = rep.author_relationship === 'third_party' && Boolean(rep.author_organization) && Boolean(rep.evaluation_methods);
  const author = outside ? 'outside' : 'vendor';
  const authorWhy = outside
    ? `A named outside firm wrote it: ${rep.author_organization}.`
    : rep.author_relationship === 'third_party'
      ? 'The report names an outside evaluator, but not the firm or the method, so it counts as the vendor\'s own.'
      : rep.author_relationship === 'vendor_staff' ? 'The vendor\'s own staff wrote it.' : 'The report names no author.';

  // ---- the ACR record, in the tester's shape, and the level from the matrix itself
  const defects = Object.entries(checks).filter(([id, c]) => c.result === 'fail' && id !== 'stale').map(([id]) => id);
  const record = {
    issued: issued || undefined,
    lastMajorRelease: opts.release || undefined,
    author,
    authorName: outside ? [rep.author_organization, rep.evaluation_methods?.quote?.slice(0, 120)].filter(Boolean).join(', ') : undefined,
    remarks: { raised: 'bug_report', named: 'feature_named', lowered: 'restated' }[remarks],
    defects,
    spotCheck: 'none',
    accepted: false,
  };
  const level = M.acrLevel('E1', record, today);

  // ---- leads: the admissions an analyst places on essential functions
  const leads = admissions.map((r) => ({
    criterion: r.criterion, name: r.name, level: r.level, table: r.table, conformance: r.conformance,
    page: r.page, remarks: r.remarks, remarkType: r.remark_type, features: r.features_named,
    suggestedGroups: r.affected_groups,
    placeable: (r.remark_type === 'bug_report' || r.remark_type === 'feature_named') && r.features_named.length > 0,
  }));

  // ---- the SFBRN process flags the matrix has no check for
  const flags = [];
  const tv = parseFloat((rep.template_version || '').replace(/[^0-9.]/g, ''));
  if (!rep.template_version) flags.push('The report names no VPAT template version. The SFBRN process rejects templates older than VPAT 2.5.');
  else if (tv < CONFIG.minTemplate) flags.push(`The report uses VPAT ${rep.template_version}. The SFBRN process rejects templates older than VPAT 2.5.`);
  if (rep.nonstandard_terms.length) flags.push(`The report uses conformance terms outside the template's five: ${list(rep.nonstandard_terms.map((t) => `"${t}"`))}.`);
  if (rep.design_intent_language.length) flags.push(`The report claims intent rather than behaviour in ${rep.design_intent_language.length} ${rep.design_intent_language.length === 1 ? 'place' : 'places'}, such as "${rep.design_intent_language[0].quote}".`);
  const wcagRows = rows.filter(isWcagAorAA);
  const wcagRated = wcagRows.filter((r) => r.conformance !== 'Not Applicable');
  if (wcagRated.length && wcagRated.every((r) => r.conformance === 'Supports')) flags.push('The report rates every applicable Level A and AA criterion Supports. A clean report is the case the spot check exists for.');
  if (!rep.browsers.length) flags.push('The report names no browser. The SFBRN heading checks look for named browsers and operating systems.');
  const na = wcagRows.filter((r) => r.conformance === 'Not Applicable');
  if (na.length >= CONFIG.manyNotApplicable) flags.push(`The report rates ${na.length} Level A and AA criteria Not Applicable. Check each against features the product has.`);
  if (wcagRows.length && wcagRows.length < 50) flags.push(`The extraction found ${wcagRows.length} WCAG Level A and AA rows. WCAG 2.1 has 50, so the analyst checks for rows the report or the extraction missed.`);

  return {
    matrixVersion: M.MATRIX_VERSION, today, kind: opts.kind || null, source: ex._source || null,
    product: { name: rep.product_name, version: rep.product_version },
    record, evidence: 'E1', level,
    checks, qualifications: {
      age: { value: level.age, months: level.months, why: issued ? `Evaluated ${issued}.` : 'No date.' },
      author: { value: author, why: authorWhy, evidence: rep.author_evidence ? [rep.author_evidence] : [] },
      remarks: { value: remarks, why: remarksWhy, counts: { admissions: admissions.length, weak: weakAdmissions.length, bareComplex: bareComplex.length, repeated: repeated.length } },
    },
    leads, flags, readingNotes: ex.reading_notes || [], config: CONFIG,
  };
}

// ---------------------------------------------------------------------------------------
// The report the analyst reads.
// ---------------------------------------------------------------------------------------
const LEVEL_WORDS = {
  'E1-': 'below face value, because of a report defect',
  E1: 'clean, but not yet taken at face value, so the analyst runs the spot check next',
  'E1+': 'clean and taken at face value',
  E3a: 'confirmed by the analyst\'s spot check',
};
const RESULT_WORD = { fail: 'Fails', pass: 'Passes', analyst: 'Analyst decides', closed: 'Does not count' };

function report(a) {
  const q = (e) => `> ${e.quote.replace(/\n+/g, ' ')}${e.page ? ` (page ${e.page})` : ''}${e.criterion ? ` [${e.criterion}]` : ''}`;
  const lines = [];
  lines.push(`# ACR analysis: ${a.product.name || 'unnamed product'}${a.product.version ? ` ${a.product.version}` : ''}`, '');
  lines.push(`The rubric rates this ACR ${a.level.level}, ${LEVEL_WORDS[a.level.level]}. The analyst confirms each call below before the rating goes into the review.`, '');
  const analyst = Object.entries(a.checks).filter(([, c]) => c.result === 'analyst');
  if (analyst.length) {
    lines.push(`The extraction cannot settle ${analyst.length === 1 ? 'one check, which the analyst decides' : `${analyst.length} checks, which the analyst decides`}.`, '');
    for (const [id, c] of analyst) lines.push(`- ${M.ACR_CHECKS.find((x) => x.id === id).text}. ${c.why}`);
    lines.push('');
  }

  lines.push('## Report checks', '');
  for (const scope of ['document', 'remarks']) {
    lines.push(`### ${scope === 'document' ? 'Document checks' : 'Remarks checks'}`, '');
    for (const c of M.ACR_CHECKS.filter((x) => x.scope === scope)) {
      const r = a.checks[c.id];
      lines.push(`- **${RESULT_WORD[r.result]}. ${c.text}.** ${r.why}`);
      for (const e of r.evidence.slice(0, 5)) lines.push(`  ${q(e)}`);
      if (r.evidence.length > 5) lines.push(`  (${r.evidence.length - 5} more in the review record)`);
    }
    lines.push('');
  }

  lines.push('## Qualifications', '');
  const qa = a.qualifications;
  const ago = qa.age.months == null ? '' : qa.age.months < 1 ? ' Less than a month old.' : ` ${qa.age.months} ${qa.age.months === 1 ? 'month' : 'months'} old on ${a.today}.`;
  lines.push(`- **Age: ${qa.age.value}.** ${qa.age.why}${ago}`);
  lines.push(`- **Author: ${qa.author.value === 'outside' ? 'raised' : 'lowered'}.** ${qa.author.why}`);
  for (const e of qa.author.evidence) lines.push(`  ${q(e)}`);
  lines.push(`- **Remarks: ${qa.remarks.value}.** ${qa.remarks.why}`, '');

  lines.push('## Leads', '');
  if (!a.leads.length) lines.push('The report admits no failure. The analyst places no lead.', '');
  else {
    lines.push(`The report admits ${a.leads.length} ${a.leads.length === 1 ? 'failure' : 'failures'}. Each becomes a finding once the analyst places it on an essential function and rates its severity. The rating in the report does not set severity.`, '');
    for (const l of a.leads) {
      lines.push(`- **${l.criterion} ${l.name}, ${l.conformance}.** ${l.placeable ? `Names ${list(l.features.map((f) => `"${f}"`))}.` : 'Names no feature, so the analyst cannot place this lead from the remark.'}${l.suggestedGroups.length ? ` Affects users ${list(l.suggestedGroups.map((g) => M.WHO[g]))}.` : ''}`);
      lines.push(`  > ${(l.remarks || '(blank)').replace(/\n+/g, ' ')}${l.page ? ` (page ${l.page})` : ''}`);
    }
    lines.push('');
  }

  if (a.flags.length) {
    lines.push('## SFBRN process flags', '', 'The SFBRN VPAT Review Process raises these. The matrix has no check for them, so they do not move the rating.', '');
    for (const f of a.flags) lines.push(`- ${f}`);
    lines.push('');
  }
  if (a.readingNotes.length) {
    lines.push('## What the extraction could not read', '');
    for (const n of a.readingNotes) lines.push(`- ${n}`);
    lines.push('');
  }
  lines.push('## Rules applied', '');
  lines.push(`- Complex criteria for the bare-Supports check: ${a.config.complexCriteria.join(', ')}.`);
  lines.push(`- A remark repeated on ${a.config.repeatAt} or more rated rows counts as repeated. Not Applicable and Level AAA rows do not count.`);
  lines.push('- A Supports remark on a complex criterion shows the work when it names where it was checked or the method. A blank, restated or generic remark does not.');
  lines.push('- Remarks rate raised when every admission reads like a bug report, lowered when any admission is blank, restated, generic, hedged or repeated, and named otherwise.');
  lines.push(`- These rules are proposals for the pilot to calibrate. Matrix version ${a.matrixVersion}, run on ${a.today}${a.source ? `, extraction by ${a.source.model}` : ''}.`);
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { kind: null, interfaces: [], release: null, version: null, today: new Date().toISOString().slice(0, 7) };
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--kind') opts.kind = argv[++i];
    else if (a === '--interfaces') opts.interfaces = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--release') opts.release = argv[++i];
    else if (a === '--version') opts.version = argv[++i];
    else if (a === '--today') opts.today = argv[++i];
    else files.push(a);
  }
  if (opts.kind && !['web', 'nonweb', 'mixed'].includes(opts.kind)) throw new Error('--kind is web, nonweb or mixed');
  return { opts, files };
}

if (require.main === module) {
  const { opts, files } = parseArgs(process.argv.slice(2));
  if (!files.length) { console.error('usage: node apply_rules.js <acr>.extraction.json --kind web|nonweb|mixed [--interfaces "..."] [--release YYYY-MM] [--today YYYY-MM]'); process.exit(2); }
  for (const file of files) {
    const ex = JSON.parse(fs.readFileSync(file, 'utf8'));
    const a = analyse(ex, opts);
    const base = file.replace(/\.extraction\.json$/, '');
    fs.writeFileSync(`${base}.review.json`, JSON.stringify(a, null, 2));
    fs.writeFileSync(`${base}.review.md`, report(a));
    console.log(`${path.basename(base)}: ${a.level.level}, ${a.record.defects.length} report ${a.record.defects.length === 1 ? 'defect' : 'defects'}, ${a.leads.length} ${a.leads.length === 1 ? 'lead' : 'leads'}`);
  }
}

module.exports = { analyse, report, CONFIG };
