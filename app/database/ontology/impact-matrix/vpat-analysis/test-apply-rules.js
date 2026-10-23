// Runs hand-built extractions through apply_rules.js and checks every call against the rubric.
// Each case changes one or two facts from a clean base, so a failure names the rule that broke.
// Run from this folder: node test-apply-rules.js. Writes fixtures/example.extraction.json too.
const fs = require('fs');
const path = require('path');
const M = require('../review-matrix.js');
const { analyse, report } = require('./apply_rules.js');

const TODAY = '2026-10';
const row = (criterion, name, level, conformance, remarks, remark_type, extra = {}) => ({
  table: level === 'none' ? 'Section 508 Chapter 3' : `WCAG 2.x Level ${level}`, criterion, name, level, conformance,
  conformance_raw: conformance, remarks, page: 4, remark_type, remark_reason: 'test', features_named: [],
  hedged: false, contradicts_rating: false, affected_groups: [], ...extra,
});
const supports = (criterion, name, level = 'A') => row(criterion, name, level, 'Supports',
  `Tested on the Course Home and Submit screens with NVDA and the keyboard; ${name} met.`, 'bug_report');

function base() {
  return {
    report: {
      product_name: 'MathLab Pro', product_version: '7.2', template_version: 'VPAT 2.5Rev', edition: 'WCAG',
      standards_reported: ['WCAG 2.1'], report_date: '2026-06', evaluation_date: '2026-05',
      evaluation_methods: { quote: 'Manual testing with NVDA 2025.1 and JAWS 2025 on Chrome and Firefox, plus keyboard-only testing.', page: 1 },
      assistive_technologies: ['NVDA', 'JAWS', 'keyboard only'], browsers: ['Chrome', 'Firefox'],
      interfaces_covered: ['Web application (student and instructor views)'],
      author_name: 'R. Lee', author_organization: 'Example Audits LLC', author_relationship: 'third_party',
      author_evidence: { quote: 'Evaluation performed by Example Audits LLC, an independent accessibility firm.', page: 1 },
      scope_carve_outs: [], design_intent_language: [], nonstandard_terms: [],
    },
    rows: [
      supports('1.1.1', 'Non-text Content'), supports('1.2.2', 'Captions (Prerecorded)'), supports('1.3.1', 'Info and Relationships'),
      supports('1.4.1', 'Use of Color'), supports('2.1.1', 'Keyboard'), supports('2.2.2', 'Pause, Stop, Hide'),
      supports('2.4.1', 'Bypass Blocks'), supports('2.4.3', 'Focus Order'), supports('4.1.2', 'Name, Role, Value'),
      row('1.4.3', 'Contrast (Minimum)', 'AA', 'Partially Supports',
        'On the Gradebook screen, placeholder text in the search field has a 3.1:1 contrast ratio, which users with low vision may not read.',
        'bug_report', { features_named: ['Gradebook search field'], affected_groups: ['limited_vision'] }),
      row('2.4.7', 'Focus Visible', 'AA', 'Does Not Support',
        'The equation editor toolbar shows no focus indicator, so keyboard users cannot tell which button is selected.',
        'bug_report', { features_named: ['equation editor toolbar'], affected_groups: ['limited_manipulation', 'limited_vision'] }),
    ],
    reading_notes: [],
  };
}
const clone = (x) => JSON.parse(JSON.stringify(x));
const opts = (o = {}) => ({ kind: 'web', interfaces: ['web application'], release: '2026-01', version: null, today: TODAY, ...o });

const CASES = [
  ['clean outside-firm ACR with bug-report remarks', (x) => x, {}, { level: 'E1+', defects: [], remarks: 'raised', author: 'outside', leads: 2 }],
  ['vendor staff, bug-report remarks, recent', (x) => { x.report.author_relationship = 'vendor_staff'; x.report.author_organization = 'MathLab Inc.'; }, {},
    { level: 'E1+', defects: [], author: 'vendor' }],
  ['vendor staff, more than a year old', (x) => { x.report.author_relationship = 'vendor_staff'; x.report.evaluation_date = '2025-06'; x.report.report_date = '2025-06'; }, { release: '2025-01' },
    { level: 'E1', defects: [] }],
  ['older than 24 months', (x) => { x.report.evaluation_date = '2024-06'; x.report.report_date = '2024-06'; }, { release: null },
    { level: 'E1-', check: { stale: 'fail' } }],
  ['evaluated before the last major release', (x) => x, { release: '2026-08' }, { level: 'E1-', check: { stale: 'fail' } }],
  ['WCAG 2.0 only for a web product', (x) => { x.report.standards_reported = ['WCAG 2.0', 'Revised Section 508']; }, {},
    { level: 'E1-', defects: ['wrong_edition'] }],
  ['WCAG 2.0 only for a non-web product passes the edition check', (x) => { x.report.standards_reported = ['Revised Section 508']; }, { kind: 'nonweb' },
    { level: 'E1+', check: { wrong_edition: 'pass' } }],
  ['no version', (x) => { x.report.product_version = null; }, {}, { level: 'E1-', defects: ['no_date_or_version'] }],
  ['no methods', (x) => { x.report.evaluation_methods = null; x.report.author_relationship = 'vendor_staff'; }, {},
    { level: 'E1-', defects: ['no_methods'], author: 'vendor' }],
  ['one browser and one screen reader', (x) => { x.report.assistive_technologies = ['NVDA', 'keyboard only']; x.report.browsers = ['Chrome']; }, {},
    { level: 'E1-', defects: ['single_browser_at'] }],
  ['Not Evaluated on a Level A row', (x) => { x.rows.push(row('2.5.3', 'Label in Name', 'A', 'Not Evaluated', '', 'blank')); }, {},
    { level: 'E1-', check: { not_evaluated: 'fail' } }],
  ['purchase includes an interface the report does not cover', (x) => x, { interfaces: ['web application', 'iOS app'] },
    { level: 'E1-', defects: ['missing_interface'] }],
  ['interfaces not given leaves the check to the analyst', (x) => x, { interfaces: [] },
    { level: 'E1+', check: { missing_interface: 'analyst' } }],
  ['scope carve-out', (x) => { x.report.scope_carve_outs = [{ quote: 'The administrator console was not evaluated.', page: 2 }]; }, {},
    { level: 'E1-', defects: ['carve_outs'] }],
  ['feature-named remarks: clean but not at face value', (x) => { x.rows[9].remark_type = 'feature_named'; x.rows[9].remarks = 'Some contrast issues in the gradebook.'; x.rows[9].hedged = false; }, {},
    { level: 'E1', defects: [], remarks: 'named' }],
  ['a blank admission lowers the remarks and opens the remarks checks', (x) => { x.rows[10].remarks = ''; x.rows[10].remark_type = 'blank'; x.rows[10].features_named = []; }, {},
    { level: 'E1-', remarks: 'lowered', defects: ['no_remarks'] }],
  ['restated Supports on a complex criterion', (x) => { x.rows[4].remarks = 'All functionality is operable through a keyboard interface.'; x.rows[4].remark_type = 'restated'; }, {},
    { level: 'E1-', remarks: 'lowered', defects: ['bare_supports'] }],
  ['a contradiction does not count while the remarks read like a bug report', (x) => { x.rows[0].contradicts_rating = true; }, {},
    { level: 'E1+', check: { contradicts_rating: 'closed' } }],
  ['a repeated remark lowers the remarks', (x) => { for (const i of [9, 10]) { x.rows[i].remarks = 'See roadmap.'; x.rows[i].remark_type = 'generic'; } x.rows.push(row('3.3.2', 'Labels or Instructions', 'A', 'Partially Supports', 'See roadmap.', 'generic')); }, {},
    { level: 'E1', remarks: 'lowered' }],
  ['a generic sentence on a complex Supports row does not show the work', (x) => { x.rows[6].remarks = 'No issues were identified for this criterion during the audit within the evaluated scope.'; x.rows[6].remark_type = 'generic'; }, {},
    { level: 'E1-', remarks: 'lowered', defects: ['bare_supports'] }],
  ['the same sentence on three Supports rows lowers the remarks', (x) => { const b = 'No issues were identified for this criterion.'; x.rows.push(row('1.3.2', 'Meaningful Sequence', 'A', 'Supports', b, 'generic'), row('1.3.3', 'Sensory Characteristics', 'A', 'Supports', b, 'generic'), row('2.1.2', 'No Keyboard Trap', 'A', 'Supports', b, 'generic')); }, {},
    { level: 'E1', remarks: 'lowered', defects: [] }],
  ['the same reason on many Not Applicable rows does not count as repeated', (x) => { for (const c of ['402.1', '402.2', '402.3', '403.1']) x.rows.push(row(c, 'Hardware', 'none', 'Not Applicable', 'This hardware criterion does not apply.', 'generic')); }, {},
    { level: 'E1+', remarks: 'raised' }],
  ['pre-2.5 template and a nonstandard term raise process flags only', (x) => { x.report.template_version = 'VPAT 2.4'; x.report.nonstandard_terms = ['Supports with Exceptions']; }, {},
    { level: 'E1+', flags: ['VPAT 2.4', 'Supports with Exceptions'] }],
];

let failures = 0;
const fail = (name, msg) => { failures += 1; console.log(`FAIL ${name}: ${msg}`); };
for (const [name, mutate, o, want] of CASES) {
  const x = clone(base());
  mutate(x);
  const a = analyse(x, opts(o));
  // The level must be the one the matrix itself gives for the record.
  if (M.acrLevel('E1', a.record, TODAY).level !== a.level.level) fail(name, 'level differs from acrLevel on the same record');
  if (want.level && a.level.level !== want.level) fail(name, `level ${a.level.level}, wanted ${want.level}`);
  if (want.defects) for (const d of want.defects) if (!a.record.defects.includes(d) && !(d === 'stale' && a.level.stale)) fail(name, `defect ${d} missing; got ${a.record.defects.join(', ') || 'none'}`);
  if (want.defects && !want.defects.length && a.record.defects.length) fail(name, `wanted no defects, got ${a.record.defects.join(', ')}`);
  if (want.check) for (const [id, r] of Object.entries(want.check)) if (a.checks[id].result !== r) fail(name, `${id} ${a.checks[id].result}, wanted ${r}`);
  if (want.remarks && a.qualifications.remarks.value !== want.remarks) fail(name, `remarks ${a.qualifications.remarks.value}, wanted ${want.remarks}`);
  if (want.author && a.record.author !== want.author) fail(name, `author ${a.record.author}, wanted ${want.author}`);
  if (want.leads != null && a.leads.length !== want.leads) fail(name, `${a.leads.length} leads, wanted ${want.leads}`);
  if (want.flags) for (const f of want.flags) if (!a.flags.some((x) => x.includes(f))) fail(name, `no flag mentioning ${f}`);
  // The report renders and keeps to the style rules the project enforces mechanically.
  const md = report(a);
  for (const bad of ['undefined', 'NaN', '[object', '—']) if (md.includes(bad)) fail(name, `report contains ${JSON.stringify(bad)}`);
  console.log(`${a.level.level.padEnd(4)} ${name}`);
}

fs.mkdirSync(path.join(__dirname, 'fixtures'), { recursive: true });
const example = base();
example._source = { file: 'example (hand-built)', model: 'none', request_id: null, input_tokens: 0, output_tokens: 0 };
fs.writeFileSync(path.join(__dirname, 'fixtures', 'example.extraction.json'), JSON.stringify(example, null, 2));

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
