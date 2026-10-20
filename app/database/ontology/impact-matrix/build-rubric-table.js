// Builds rubric-core.svg, the multi-factor decision table, from the model's calibration.
// Run after any change to CALIBRATION:  node build-rubric-table.js
const path = require('path');
const M = require(path.join(__dirname, 'review-matrix.js'));
const out = path.join(__dirname, 'rubric-core.svg');
const fs = require('fs');
const C = M.CALIBRATION;
const LV = ['low', 'medium', 'high'];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const COLOR = {
  approve: ['#e3f4e8', '#14612d'], needs: ['#fdf0d5', '#7a4d00'], taap: ['#ddf1f3', '#0a5660'],
  deny: ['#fbe3e4', '#8c1d22'], hold: ['#ecebf7', '#3b3270'], factor: ['#ffffff', '#1a1a1a'], head: ['#f0efe9', '#1a1a1a'],
};
const WARN = { low: '#e3f4e8', elevated: '#fdf0d5', high: '#fbe3e4' };
const warnOf = (w) => (w >= C.taapStandard.warning.high ? 'high' : w >= C.taapStandard.warning.elevated ? 'elevated' : 'low');
const kText = (k) => (k === 6 ? 'all 6' : `${k} of 6`);
const routeNo = (id) => M.ROUTING.findIndex((r) => r.id === id) + 1;
const evText = { 0: 'any', 2: 'E1 or better', 4: 'E2 or better' };

const cols = [
  ['X', 'Exposure', 84], ['B', 'Breadth', 64], ['P', 'Pressure', 64], ['V', 'Veracity floor', 116],
  ['S01', 'S0, S1', 82], ['S2', 'S2', 96], ['S3', 'S3', 96],
  ['k', 'Minimum (TAAP standard)', 92], ['none', 'No TAAP yet', 112],
  ['below', 'TAAP below the minimum', 132], ['min', 'TAAP at the minimum', 132], ['full', 'Full TAAP', 132],
];
const FULL = M.TAAP_REQUIREMENTS.length;
const X0 = 40, Y0 = 118, HH = 46, RH = 46;
const xs = {}; let x = X0;
for (const [id, , w] of cols) { xs[id] = [x, w]; x += w; }
const W = x;

const parts = [];
const rect = (x, y, w, h, fill, stroke = '#d6d4cc') => parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}"/>`);
const text = (x, y, t, o = {}) => parts.push(`<text x="${x}" y="${y}" text-anchor="${o.anchor ?? 'middle'}" font-size="${o.size ?? 13}" font-weight="${o.weight ?? 400}" fill="${o.fill ?? '#1a1a1a'}"${o.mono ? ' font-family="Consolas, Menlo, monospace"' : ''}>${esc(t)}</text>`);
const cell = (id, row, span, kind, lines, chip) => {
  const [cx, w] = xs[id]; const y = Y0 + HH + row * RH; const h = span * RH;
  const [bg, fg] = COLOR[kind];
  rect(cx, y, w, h, bg);
  const n = lines.length + (chip ? 1 : 0);
  let ty = y + h / 2 - (n - 1) * 8 + 5;
  for (const l of lines) { text(cx + w / 2, ty, l, { fill: fg, weight: kind === 'factor' ? 400 : 600 }); ty += 16; }
  if (chip) {
    const cw = 104; parts.push(`<rect x="${cx + (w - cw) / 2}" y="${ty - 12}" width="${cw}" height="17" rx="8.5" fill="${WARN[chip]}" stroke="#bdbab0"/>`);
    text(cx + w / 2, ty + 1, `warning ${chip}`, { size: 11 });
  }
};

// Group header and column header.
const groups = [['FACTORS', 'X', 'V'], ['RISK GRADE BY SEVERITY', 'S01', 'S3'], ['TAAP REVIEW, WHEN THE RISK GRADE IS NEEDS TAAP', 'k', 'full']];
for (const [label, a, b] of groups) {
  const gx = xs[a][0]; const gw = xs[b][0] + xs[b][1] - gx;
  rect(gx, Y0 - 26, gw, 26, '#e6e4dc'); text(gx + gw / 2, Y0 - 8, label, { size: 12, weight: 700 });
}
for (const [id, label] of cols) {
  const [cx, w] = xs[id]; rect(cx, Y0, w, HH, COLOR.head[0]);
  const words = label.split(' '); const lines = []; let cur = '';
  for (const wd of words) { if ((cur + ' ' + wd).trim().length > Math.floor(w / 7.4)) { lines.push(cur.trim()); cur = wd; } else cur += ' ' + wd; }
  lines.push(cur.trim());
  let ty = Y0 + HH / 2 - (lines.length - 1) * 7 + 5;
  for (const l of lines) { text(cx + w / 2, ty, l, { size: 12, weight: 700 }); ty += 14; }
}

// Body: one row per Exposure and Breadth.
let row = 0;
for (const X of LV) {
  const r0 = row;
  cell('X', r0, 3, 'factor', [X]);
  cell('V', r0, 3, 'factor', [evText[M.EVIDENCE_LIMITS.floor[X]]]);
  cell('S2', r0, 3, X === 'low' ? 'approve' : 'needs', [X === 'low' ? 'Approve' : 'Needs TAAP']);
  for (let B = 0; B <= 2; B++, row++) {
    const P = LV.indexOf(X) + B;
    const k = C.taapStandard.required[P];
    cell('B', row, 1, 'factor', [String(B)]);
    cell('P', row, 1, 'factor', [String(P)]);
    cell('k', row, 1, 'factor', [kText(k)]);
    cell('none', row, 1, 'hold', [`On hold, route ${routeNo('taap_needed')}`], warnOf(P));
    cell('below', row, 1, 'deny', ['Deny']);
    // At the minimum means meeting it while short of all six; where the minimum is all six,
    // such a plan is below it.
    if (k === FULL) cell('min', row, 1, 'deny', ['Deny']);
    else cell('min', row, 1, 'taap', ['Approve with TAAP'], warnOf(P + FULL - k));
    cell('full', row, 1, 'taap', ['Approve with TAAP'], warnOf(P));
  }
}
cell('S01', 0, 9, 'approve', ['Approve']);
cell('S3', 0, 9, 'needs', ['Needs TAAP']);
// Heavier rules between Exposure bands.
for (const r of [3, 6]) {
  const yy = Y0 + HH + r * RH;
  for (const [a, b] of [[X0, xs.S01[0]], [xs.S2[0], xs.S3[0]], [xs.k[0], W]]) {
    parts.push(`<line x1="${a}" y1="${yy}" x2="${b}" y2="${yy}" stroke="#6b6b6b" stroke-width="1.6"/>`);
  }
}
parts.push(`<rect x="${X0}" y="${Y0 - 26}" width="${W - X0}" height="${26 + HH + 9 * RH}" fill="none" stroke="#6b6b6b" stroke-width="1.4"/>`);

// Notes under the table.
const ny = Y0 + HH + 9 * RH + 34;
const notes = M.rubricNotes();   // shared with the tester's matrix
// Long notes wrap at a word boundary, with the continuation indented under the text.
const MAX = Math.floor((W - X0) / 7.2);
const lines = [];
notes.forEach((n, i) => {
  let cur = `${i + 1}.  `;
  for (const word of n.split(' ')) {
    if ((cur + word).length > MAX) { lines.push(cur.trimEnd()); cur = '     '; }
    cur += word + ' ';
  }
  lines.push(cur.trimEnd());
});
lines.forEach((l, i) => text(X0, ny + i * 21, l, { anchor: 'start', size: 13 }));
const H = ny + lines.length * 21 + 20;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W + 40} ${H}" width="${W + 40}" height="${H}" role="img" aria-labelledby="t d" font-family="Segoe UI, system-ui, -apple-system, Helvetica, Arial, sans-serif">
  <title id="t">SFBRN review rubric, version 2, decision table</title>
  <desc id="d">Rows partition reviews by Exposure and Breadth. Columns give the Veracity floor, the risk grade by Severity, the TAAP standard, and the final decision and warning level for each TAAP state.</desc>
  <rect width="${W + 40}" height="${H}" fill="#fafaf8"/>
  <text x="${X0}" y="44" font-size="22" font-weight="700" fill="#1a1a1a">SFBRN review rubric, version 2</text>
  <text x="${X0}" y="68" font-size="13" fill="#444">The final decision as a function of Exposure, Breadth, Severity, Veracity and TAAP status. Generated from review-matrix.js.</text>
  ${parts.join('\n  ')}
</svg>
`;
fs.writeFileSync(out, svg);
console.log('wrote', out, W + 40, 'x', H);
