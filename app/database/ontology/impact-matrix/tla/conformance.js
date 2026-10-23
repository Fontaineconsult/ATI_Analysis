// Checks every state TLC reached against review-matrix.js. TLC writes the states with
// -dump; this script rebuilds each one as a review, runs evaluate(), and compares the
// outcome, the evidence level, confirmation and the severity in force with what the spec
// derived. Any difference is a place where the spec and the model disagree.
// Run: node app/database/ontology/impact-matrix/tla/conformance.js <dump file>
const fs = require('fs');
const path = require('path');
const M = require(path.join(__dirname, '..', 'review-matrix.js'));

const REVIEW_DATE = '2026-10-22';
const ANSWERS = {
  low: { users: 10, scope: 'low', required_use: 'low', criticality: 'low', publishes: 'low', frequency: 'medium', contract_length: 'low' },
  medium: { users: 100, scope: 'medium', required_use: 'medium', criticality: 'medium', publishes: 'low', frequency: 'medium', contract_length: 'medium' },
  high: { users: 400, scope: 'medium', required_use: 'high', criticality: 'high', publishes: 'low', frequency: 'high', contract_length: 'medium' },
};
// An answer set with the user count missing, which holds the review. The level is high
// until the user count sets the start.
const OPEN_ANSWERS = {
  high: { users: null, scope: 'low', required_use: 'low', criticality: 'low', publishes: 'low', frequency: 'low', contract_length: 'low' },
};
const ans = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, { requester: v }]));

function monthsAgo(n) {
  const [y, m] = REVIEW_DATE.split('-').map(Number);
  const total = y * 12 + (m - 1) - n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}
const ISSUED = { out: monthsAgo(30), unknown: undefined, raised: monthsAgo(6), lowered: monthsAgo(18) };

function findingsFor(findings, sev, breadth) {
  if (findings === 'none') return [];
  const f = (severity, n) => ({ role: 'students', group: 'without_vision', essentialFunction: `Function ${n}`, severity });
  if (sev === 'S0') return [f('S0', 1)];
  if (sev === 'S1') return [f('S1', 1)];
  if (sev === 'S2') return breadth === 0 ? [f('S2', 1)] : [f('S2', 1), f('S2', 2), f('S2', 3)];
  const n = { 0: 1, 1: 2, 2: 4 }[breadth];
  return Array.from({ length: n }, (_, i) => f('S3', i + 1));
}

function reviewFor(s) {
  const met = Number(s.met);
  return {
    ictKind: 'web', floors: [],
    answers: ans(s.answersOpen === 'TRUE' ? OPEN_ANSWERS[s.level] : ANSWERS[s.level]),
    findings: findingsFor(s.findings, s.sev, Number(s.breadth)),
    // The spec's E1- is a report defect the analyst ticked on a recorded vendor ACR.
    evidence: s.ev === 'E1-' ? 'E1' : s.ev,
    acr: { issued: ISSUED[s.age], defects: s.ev === 'E1-' ? ['no_methods'] : [], author: s.author === 'raised' ? 'outside' : 'vendor',
      remarks: s.remarks === 'raised' ? 'bug_report' : s.remarks === 'named' ? 'feature_named' : 'restated', spotCheck: s.spot, accepted: s.accepted === 'TRUE' },
    validation: s.validation,
    reviewDate: REVIEW_DATE,
    moreAccessibleProductExists: s.moreAcc === 'TRUE',
    taap: s.taapOnFile === 'TRUE'
      ? { exists: true, meets: Object.fromEntries(M.TAAP_REQUIREMENTS.map((r, i) => [r.id, i < met])), exception: s.exception }
      : { exists: false, meets: {} },
  };
}

function jsOutcome(d) {
  if (d.outcome === 'on_hold') return `hold_${d.hold}`;
  if (d.outcome === 'deny') return `deny_${d.denyReason}`;
  if (d.outcome === 'approve_with_taap') return d.exception ? 'approve_with_taap_exception' : 'approve_with_taap';
  return d.outcome;
}

function* states(file) {
  let cur = null;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const head = /^State (\d+):/.exec(line);
    if (head) { if (cur) yield cur; cur = { _n: head[1] }; continue; }
    const kv = /^(?:\/\\ )?(\w+) = (.*)$/.exec(line.trim());
    if (kv && cur) cur[kv[1]] = kv[2].replace(/^"|"$/g, '');
  }
  if (cur) yield cur;
}

const file = process.argv[2] || path.join(__dirname, 'Reviewer.dump');
let n = 0; const diffs = [];
for (const s of states(file)) {
  n += 1;
  const review = reviewFor(s);
  const d = M.evaluate(review);
  const got = { out: jsOutcome(d), lvl: d.evidence, conf: String(d.veracity.confirmed).toUpperCase(), sev1: d.severity.replace(' (provisional)', '') };
  const want = { out: s.out, lvl: s.lvl, conf: s.conf, sev1: s.sev1 };
  // The spec does not separate an exposure hold from the level check, so the level is
  // compared only when the answers are settled.
  if (s.answersOpen === 'FALSE' && d.exposure.level !== s.level) diffs.push({ state: s, field: 'level', want: s.level, got: d.exposure.level });
  // On hold 2 the model returns before the floor and the fallback are computed, so only the
  // outcome and the evidence level are compared there.
  const fields = s.out === 'hold_answers_unknown' ? ['out', 'lvl'] : Object.keys(want);
  for (const k of fields) if (want[k] !== got[k]) diffs.push({ state: s, field: k, want: want[k], got: got[k] });
}
const byField = {};
for (const x of diffs) byField[x.field] = (byField[x.field] ?? 0) + 1;
if (diffs.length) console.log('differences by field:', JSON.stringify(byField));
console.log(`states checked: ${n}`);
if (diffs.length) {
  console.log(`differences: ${diffs.length}`);
  for (const x of diffs.slice(0, 20)) {
    const { _n, out, lvl, conf, sev1, ...rest } = x.state;
    console.log(`state ${_n} ${x.field}: spec ${x.want}, model ${x.got}`, JSON.stringify(rest));
  }
  process.exit(1);
}
console.log('differences: none');
