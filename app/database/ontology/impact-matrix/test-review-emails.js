// Runs representative review states through review-emails.js and checks that the right
// messages apply, that each renders without an empty field, and that the prose keeps to
// the writing style (no em dash). Run: node test-review-emails.js
const M = require('./review-matrix.js');
const E = require('./review-emails.js');

const answers = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { requester: v, reviewer: null }]));
const ALL = { users: 10, scope: 'low', required_use: 'low', criticality: 'low', publishes: 'low', frequency: 'medium', contract_length: 'low' };
const BIG = { users: 3000, scope: 'high', required_use: 'high', criticality: 'high', publishes: 'medium', frequency: 'high', contract_length: 'medium' };
const monthsAgo = (n) => { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0, 7); };
const base = (over) => ({ ictKind: 'web', floors: [], bypasses: [], answers: answers(ALL), findings: [], evidence: 'E0',
  acr: { spotCheck: 'none', defects: [] }, validation: 'open', moreAccessibleProductExists: false,
  taap: { exists: false, meets: {}, exception: 'none' }, ...over });
const S3 = [{ role: 'students', group: 'without_vision', essentialFunction: 'Submit homework', severity: 'S3' }];
const S2 = [{ role: 'employees', group: 'limited_manipulation', essentialFunction: 'Approve a timesheet', severity: 'S2' }];
const meets = (n) => Object.fromEntries(M.TAAP_REQUIREMENTS.map((r, i) => [r.id, i < n]));
const trusted = { issued: monthsAgo(3), author: 'outside', authorName: 'Example Audits LLC', remarks: 'bug_report', spotCheck: 'none', defects: [] };

const CASES = {
  hold1_no_evidence: [base({ answers: answers({ ...BIG, publishes: null }) }), ['evidence_request', 'supplier_request']],
  hold2_no_users: [base({ answers: answers({ ...ALL, users: null }), evidence: 'E1', acr: trusted }), ['answers_request']],
  hold3_spot_check: [base({ answers: answers(BIG), evidence: 'E1', acr: { issued: monthsAgo(3), author: 'vendor', remarks: 'restated', spotCheck: 'none', defects: [] } }), ['spot_check_assignment']],
  hold3_failed_check: [base({ answers: answers(BIG), evidence: 'E1', acr: { ...trusted, defects: ['no_methods', 'missing_interface'] } }), ['supplier_correction', 'demonstration_request']],
  hold3_contradicted: [base({ answers: answers(BIG), evidence: 'E1', acr: { ...trusted, spotCheck: 'contradicts', spotCheckNote: 'NVDA on the upload step' }, findings: S2 }), ['demonstration_request']],
  hold4_taap: [base({ answers: answers(BIG), evidence: 'E1', acr: trusted, findings: S3 }), ['taap_request']],
  hold5_referral: [base({ answers: answers(BIG), evidence: 'E1', acr: trusted, findings: S3, taap: { exists: true, meets: meets(2), exception: 'claimed' } }), ['determination_referral']],
  approve_s0: [base({ evidence: 'E1', acr: trusted }), ['approval_notice']],
  approve_low_s2: [base({ evidence: 'E1', acr: trusted, findings: S2 }), ['approval_notice']],
  approve_with_taap: [base({ answers: answers(BIG), evidence: 'E1', acr: trusted, findings: S3, taap: { exists: true, meets: meets(6), exception: 'none' } }), ['taap_approval']],
  deny_below_standard: [base({ answers: answers(BIG), evidence: 'E1', acr: trusted, findings: S3, taap: { exists: true, meets: meets(2), exception: 'none' } }), ['denial_notice']],
  deny_more_accessible: [base({ answers: answers(BIG), evidence: 'E1', acr: trusted, findings: S3, moreAccessibleProductExists: true }), ['denial_notice']],
  accommodation: [base({ bypasses: ['accommodation_purchase'] }), ['approval_notice']],
  fallback: [base({ answers: answers(BIG), evidence: 'E1', acr: { issued: monthsAgo(3), author: 'vendor', remarks: 'restated', spotCheck: 'none', defects: [] }, validation: 'unavailable' }), ['taap_request']],
};

const ctx = { product: 'FormBuilder', vendor: 'Example Forms Inc.', unit: 'Facilities', requester: 'Dana', requisition: 'R-10492', signer: 'Sam Reviewer', date: '2026-10-23' };
let failures = 0;
const fail = (msg) => { failures += 1; console.log('FAIL', msg); };
for (const [name, [review, expected]] of Object.entries(CASES)) {
  const d = M.evaluate(review);
  const ex = M.explain(review, d, ctx);
  const ts = E.templates(review, d, ex, ctx);
  const ids = ts.map((t) => t.id);
  const specific = ids.filter((id) => !['requisition_comment', 'full_determination'].includes(id));
  if (JSON.stringify(specific) !== JSON.stringify(expected)) fail(`${name}: expected ${expected.join(', ')}, got ${specific.join(', ') || 'none'}`);
  if (!ids.includes('requisition_comment') || !ids.includes('full_determination')) fail(`${name}: the two general messages are missing`);
  if (!ts[0]?.recommended) fail(`${name}: no recommended message`);
  for (const t of ts) {
    for (const bad of ['undefined', 'null', 'NaN', '[object', '—']) if (t.text.includes(bad)) fail(`${name}/${t.id}: text contains ${JSON.stringify(bad)}`);
    if (!t.html.includes('<p')) fail(`${name}/${t.id}: no HTML body`);
    if (t.toKey !== 'record' && !t.subject) fail(`${name}/${t.id}: no subject`);
    if (t.text.includes('Dana') && !t.greeting?.includes('Dana')) fail(`${name}/${t.id}: requester name outside the greeting`);
    if (['unit', 'supplier', 'signers', 'president'].includes(t.toKey) && t.id !== 'full_determination') {
      // Lowercase vendor only: the CSU Vendor Accessibility Roadmap keeps its title.
      for (const term of [/\bExposure\b/, /\bE[0-3][ab+-]?\b/, /\bS[0-3]\b/, /\bVeracity\b/, /\bof 10 points\b/, /\bvendor\b/]) {
        if (term.test(t.text)) fail(`${name}/${t.id}: internal term ${term} in a stakeholder message`);
      }
    }
  }
  // The reasoning toggle removes the determination's sections from the templates that carry them.
  const bare = E.templates(review, d, ex, ctx, { reasoning: false });
  for (const t of bare) {
    if (t.id === 'full_determination' || t.id === 'requisition_comment') continue;
    for (const hd of E.REASONING_HEADINGS) if (t.text.split('\n').includes(hd)) fail(`${name}/${t.id}: reasoning heading "${hd}" survives the toggle`);
  }
  // Blank context prints placeholders, never empty slots.
  const blank = E.templates(review, d, M.explain(review, d, {}), {});
  for (const t of blank) {
    if (t.toKey === 'record') continue;
    if (!t.placeholders.includes('[Your name]')) fail(`${name}/${t.id}: no signature placeholder with blank context`);
  }
  console.log(`${name.padEnd(22)} ${d.hold ? `hold ${d.hold}` : d.outcome}  ->  ${ids.join(', ')}`);
}

// Print one message in full for a read-through.
const sample = process.argv[2];
if (sample) {
  const [name, id] = sample.split('/');
  const [review] = CASES[name];
  const d = M.evaluate(review);
  const ex = M.explain(review, d, ctx);
  const t = E.templates(review, d, ex, ctx).find((x) => x.id === id);
  console.log('\n' + '='.repeat(78) + '\n' + (t ? t.text : `no template ${id} for ${name}`) + '\n' + '='.repeat(78));
  console.log('placeholders:', t?.placeholders.join(', ') || 'none');
}

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
