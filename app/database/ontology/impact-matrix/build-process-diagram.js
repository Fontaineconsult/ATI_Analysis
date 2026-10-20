// Builds review-process.svg, the decision process from requisition intake to a final decision
// or a hold, from the model. The shared checks run down the top, ending in the Veracity loop;
// the four severity states then each carry their own lane. Run after any change to ROUTING, OUTCOMES or CALIBRATION:
//   node build-process-diagram.js
const path = require('path');
const fs = require('fs');
const M = require(path.join(__dirname, 'review-matrix.js'));
const out = path.join(__dirname, 'review-process.svg');
const C = M.CALIBRATION;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const COLOR = {
  approve: ['#e3f4e8', '#14612d'], taap: ['#ddf1f3', '#0a5660'], deny: ['#fbe3e4', '#8c1d22'],
  hold: ['#ecebf7', '#3b3270'], step: ['#ffffff', '#1a1a1a'], decision: ['#fdf7e3', '#1a1a1a'],
  start: ['#f0efe9', '#1a1a1a'], state: ['#fdf0d5', '#7a4d00'],
};
const LINE = '#6b6b6b';
const parts = [];
const text = (x, y, lines, o = {}) => {
  const size = o.size ?? 13;
  const lh = size + 4;
  const y0 = y - ((lines.length - 1) * lh) / 2;
  parts.push(`<text x="${x}" y="${y0}" text-anchor="${o.anchor ?? 'middle'}" font-size="${size}" fill="${o.fill ?? '#1a1a1a'}">`
    + lines.map((l, i) => `<tspan x="${x}" dy="${i ? lh : 0}" font-weight="${i === 0 && o.boldFirst ? 600 : 400}">${esc(l)}</tspan>`).join('')
    + '</text>');
};
/** A box centred on (cx, cy). The first line is bold. */
const box = (cx, cy, w, h, kind, lines, o = {}) => {
  const [bg, fg] = COLOR[kind];
  parts.push(`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${o.rx ?? 6}" fill="${bg}" stroke="${o.stroke ?? '#bdbab0'}" stroke-width="${o.stroke ? 1.6 : 1}"/>`);
  text(cx, cy + 4, lines, { boldFirst: true, fill: fg, size: o.size });
};
const diamond = (cx, cy, w, h, lines, size = 12) => {
  parts.push(`<polygon points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}" fill="${COLOR.decision[0]}" stroke="#bdbab0"/>`);
  text(cx, cy + 4, lines, { size });
};
/** An orthogonal arrow through the points. `label` (a string or lines) sits beside the first
 *  segment: above a horizontal one, beside the top of a vertical one. */
const arrow = (pts, label, o = {}) => {
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  parts.push(`<path d="${d}" fill="none" stroke="${LINE}" stroke-width="1.4"${o.noHead ? '' : ' marker-end="url(#head)"'}/>`);
  if (label) {
    const lines = Array.isArray(label) ? label : [label];
    const [x0, y0] = pts[0]; const [x1, y1] = pts[1];
    const horizontal = y0 === y1;
    const lx = horizontal ? (x0 + x1) / 2 : x0 + 8;
    const ly = horizontal ? y0 - 6 - (lines.length - 1) * 7.5 : y0 + 16;
    text(lx, ly, lines, { size: 11, fill: '#444444', anchor: horizontal ? 'middle' : 'start' });
  }
};

// ---- Shared checks, down the centre of the page.
const SX = 605, SW = 300, DH = 96;
const RX = 1000, RW = 330;                      // hold boxes for the shared checks
const Y = { start: 110, d2: 220, p1: 330, d3: 440, p2: 550, d4: 660, bus: 820, state: 890 };
const right = (x, w, y) => [x + w / 2, y];
const left = (x, w, y) => [x - w / 2, y];

const ROUTE_SHORT = { exception_claimed: 'Formal determination', severity_unknown: 'Evidence needed', answers_unknown: 'Information needed',
  veracity_below_floor: 'Manual review', taap_needed: 'TAAP needed' };
const routeNo = (id) => M.ROUTING.findIndex((r) => r.id === id) + 1;
const holdBox = (cx, cy, id) => {
  const r = M.ROUTING.find((x) => x.id === id);
  const title = `Route ${routeNo(id)}. ${M.HEADLINE[id]}`;
  const lines = [...(title.length > 48 ? title.split(/(?<=:) /) : [title]), `Held by ${M.HOLDERS[r.route].label}`];
  box(cx, cy, RW, lines.length * 16 + 24, 'hold', lines, { size: 12 });
};

box(SX, Y.start, SW, 60, 'start', ['Requisition intake', 'exposure answers, findings, evidence on file'], { rx: 30 });
diamond(SX, Y.d2, SW, DH, ['Accessibility evidence', 'on file?'], 13);
box(SX, Y.p1, SW, 60, 'step', ['Rate Exposure', 'floors and answers; unknown answers map to high']);
diamond(SX, Y.d3, SW, DH, ['Unknown answers raise', 'the Exposure level?'], 13);
box(SX, Y.p2, SW, 60, 'step', ['Severity from the findings, as a minimum', 'impact on the essential function, never the ACR label']);
diamond(SX, Y.d4, SW, DH, ['Evidence at the Veracity floor', 'for this Exposure and Severity?', '(S1 always E2 or better)'], 12);
holdBox(RX, Y.d2, 'severity_unknown');
holdBox(RX, Y.d3, 'answers_unknown');

arrow([[SX, Y.start + 30], [SX, Y.d2 - DH / 2]]);
arrow([right(SX, SW, Y.d2), [RX - RW / 2, Y.d2]], 'no');
arrow([[SX, Y.d2 + DH / 2], [SX, Y.p1 - 30]], 'yes');
arrow([[SX, Y.p1 + 30], [SX, Y.d3 - DH / 2]]);
arrow([right(SX, SW, Y.d3), [RX - RW / 2, Y.d3]], 'yes');
arrow([[SX, Y.d3 + DH / 2], [SX, Y.p2 - 30]], 'no');
arrow([[SX, Y.p2 + 30], [SX, Y.d4 - DH / 2]]);

// The Veracity loop. Below the floor, the ATI review team raises the evidence and the review
// resumes at the Severity step; when the evidence cannot be raised, the fallback joins the S3 lane.
const FX = COL_S3 = 1010;
diamond(RX, Y.d4, SW, DH, ['Can the evidence be raised?', 'a demonstration, or ATI testing'], 12);
arrow([right(SX, SW, Y.d4), [RX - SW / 2, Y.d4]], 'no');
holdBox(RX, 540, 'veracity_below_floor');
arrow([[RX, Y.d4 - DH / 2], [RX, 568]], 'yes');
arrow([[RX - RW / 2, 540], [SX + SW / 2, 540]]);
text(795, 560, ['resumes with', 'new findings'], { size: 10, fill: '#444444' });
box(FX, 760, SW, 56, 'step', ['Fallback: S3 (provisional)', 'barriers found as a minimum; Breadth as found,', 'or 2 with no evidence at all'], { size: 11 });
arrow([[RX, Y.d4 + DH / 2], [RX, 732]], 'no');
arrow([[FX, 788], [FX, Y.bus]], null, { noHead: true });
arrow([[SX, Y.d4 + DH / 2], [SX, Y.bus]], 'yes', { noHead: true });

// ---- Severity lanes. One column per state; the bus from the severity step feeds them.
const COL = { S0: 200, S1: 470, S2: 740, S3: 1010 };
const CW = 230, CH = 96;                        // lane diamond size
const R = { 1: 1010, 2: 1160, 3: 1310, 4: 1460, 5: 1610, 6: 1760 };
const YF = 1950;                                // final decisions; clears the route 5 hang
const sev = (id) => M.SEVERITY.find((s) => s.id === id);

parts.push(`<path d="M${COL.S0},${Y.bus} L${COL.S3},${Y.bus}" fill="none" stroke="${LINE}" stroke-width="1.4"/>`);
for (const x of Object.values(COL)) arrow([[x, Y.bus], [x, Y.state - 35]]);

box(COL.S0, Y.state, CW, 70, 'state', ['S0. No barrier', 'No effect on information,', 'interactions or participation'], { size: 12, stroke: COLOR.state[1] });
box(COL.S1, Y.state, CW, 70, 'state', [`S1. ${sev('S1').gsa ? 'Minor' : 'Minor'} barrier`, 'Minimal impact, meeting the', 'four tests of 28 CFR 35.205'], { size: 12, stroke: COLOR.state[1] });
box(COL.S2, Y.state, CW, 70, 'state', ['S2. Major barrier', 'An essential function is performed independently,', 'with clearly unequal effort'], { size: 12, stroke: COLOR.state[1] });
box(COL.S3, Y.state, CW, 70, 'state', ['S3. Critical barrier', 'An essential function cannot be performed', 'independently; incl. accumulated, fallback'], { size: 11, stroke: COLOR.state[1] });

/** A hold terminal hung off one side of a lane diamond at row y. */
const hang = (x, y, id, label = 'no', side = -1) => {
  arrow([[x + side * CW / 2, y], [x + side * 70, y], [x + side * 70, y + 50]], label);
  box(x + side * 70, y + 70, 126, 40, 'hold', [`Route ${routeNo(id)}`, ROUTE_SHORT[id]], { size: 11 });
};
const down = (x, from, to, label) => arrow([[x, from], [x, to]], label);

// S0: Approve.
down(COL.S0, Y.state + 35, YF - 38, 'Approve');

// S1: Approve, with roadmap terms at medium or high Exposure.
down(COL.S1, Y.state + 35, YF - 38, ['Approve; roadmap terms at', 'medium or high Exposure']);

// S2: accumulation, Exposure, then TAAP or Approve. Denied only for a TAAP that meets none of the six.
diamond(COL.S2, R[1], CW, CH, ['S2 accumulation?', `${C.accumulation.stack}+ stacked on one pair, or`, `${C.accumulation.spreadPairs}+ pairs at high Exposure`]);
down(COL.S2, Y.state + 35, R[1] - CH / 2);
arrow([right(COL.S2, CW, R[1]), [875, R[1]], [875, Y.state], [COL.S3 - CW / 2, Y.state]]);
text(880, R[1] - 60, ['yes:', 'S3 (accumulated)'], { size: 11, fill: '#444444', anchor: 'start' });
diamond(COL.S2, R[2], CW, CH, ['Exposure?']);
down(COL.S2, R[1] + CH / 2, R[2] - CH / 2, 'no');
arrow([left(COL.S2, CW, R[2]), [520, R[2]], [520, YF - 38]], ['low:', 'Approve']);
diamond(COL.S2, R[3], CW, CH, ['TAAP on file?']);
down(COL.S2, R[2] + CH / 2, R[3] - CH / 2, ['medium or high:', 'Needs TAAP']);
hang(COL.S2, R[3], 'taap_needed');
diamond(COL.S2, R[4], CW, CH, ['TAAP meets none', 'of the six?']);
down(COL.S2, R[3] + CH / 2, R[4] - CH / 2, 'yes');
arrow([left(COL.S2, CW, R[4]), [COL.S2 - 70, R[4]], [COL.S2 - 70, R[4] + 50]], 'yes');
box(COL.S2 - 70, R[4] + 70, 126, 40, 'deny', ['Deny', 'no alternative access'], { size: 11 });
down(COL.S2, R[4] + CH / 2, YF - 38, ['no; below the standard', 'never denied, warning']);

// S3: Needs TAAP at every Exposure. The only lane that can end in Deny.
diamond(COL.S3, R[1], CW, CH, ['A more accessible product', 'meets the same need?']);
down(COL.S3, Y.state + 35, R[1] - CH / 2, 'Needs TAAP');
arrow([right(COL.S3, CW, R[1]), [1160, R[1]], [1160, YF - 60], [1060, YF - 60]], 'yes', { noHead: true });
diamond(COL.S3, R[2], CW, CH, ['TAAP on file?']);
down(COL.S3, R[1] + CH / 2, R[2] - CH / 2, 'no');
hang(COL.S3, R[2], 'taap_needed');
diamond(COL.S3, R[3], CW, CH, ['TAAP meets', 'the standard?']);
down(COL.S3, R[2] + CH / 2, R[3] - CH / 2, 'yes');
arrow([left(COL.S3, CW, R[3]), [870, R[3]], [870, YF - 38]], 'yes');
diamond(COL.S3, R[4], CW, CH, ['TAAP meets none', 'of the six?']);
down(COL.S3, R[3] + CH / 2, R[4] - CH / 2, 'no');
arrow([right(COL.S3, CW, R[4]), [1160, R[4]]], 'yes', { noHead: true });
diamond(COL.S3, R[5], CW, CH, ['Below the standard', `at pressure ${C.taapStandard.denyAt} or more?`]);
down(COL.S3, R[4] + CH / 2, R[5] - CH / 2, 'no');
arrow([left(COL.S3, CW, R[5]), [870, R[5]]], null, { noHead: true });
text(876, R[5] + 40, ['no, approved', 'under a warning'], { size: 11, fill: '#444444', anchor: 'start' });
diamond(COL.S3, R[6], CW, CH, ['Undue burden or', 'fundamental alteration', 'determination?']);
down(COL.S3, R[5] + CH / 2, R[6] - CH / 2, 'yes');
arrow([left(COL.S3, CW, R[6]), [870, R[6]]], null, { noHead: true });
text(876, R[6] + 40, ['on file: Non-Equal', 'Alternative, high warning'], { size: 11, fill: '#444444', anchor: 'start' });
hang(COL.S3, R[6], 'exception_claimed', 'claimed', 1);
arrow([[COL.S3, R[6] + CH / 2], [COL.S3, YF - 60], [1060, YF - 60], [1060, YF - 38]], 'none');

// ---- Final decisions.
box(335, YF, 400, 76, 'approve', ['Approve', 'standard contract terms; roadmap terms under R;', 'a new review at renewal'], { size: 12, stroke: COLOR.approve[1] });
box(800, YF, 300, 76, 'taap', ['Approve with TAAP', 'TAAP statement, three signers, roadmap;', `${M.TAAP_TERMS.reviewMonths}-month term or until renewal`], { size: 12, stroke: COLOR.taap[1] });
box(1060, YF, 180, 76, 'deny', ['Deny', 'reasons, TAAP standard,', 'path to a new review'], { size: 12, stroke: COLOR.deny[1] });

// ---- Legend and the hold key.
const LY = YF + 80;
const legend = [['start', 'Intake'], ['decision', 'Decision'], ['step', 'Shared step'], ['state', 'Severity state'], ['hold', 'Hold'], ['approve', 'Approve'], ['taap', 'Approve with TAAP'], ['deny', 'Deny']];
let lx = 40;
for (const [kind, label] of legend) {
  parts.push(`<rect x="${lx}" y="${LY - 9}" width="16" height="16" fill="${COLOR[kind][0]}" stroke="#bdbab0"/>`);
  text(lx + 22, LY + 4, [label], { anchor: 'start', size: 12 });
  lx += 22 + label.length * 7 + 26;
}
const resumes = {
  severity_unknown: 'the evidence check', answers_unknown: 'the Exposure check',
  veracity_below_floor: 'the Severity step, with the new findings',
  taap_needed: 'the TAAP check', exception_claimed: 'the determination check',
};
let ky = LY + 36;
text(40, ky, ['Holds. Each one is held by a named party until the condition the route names is met.'], { anchor: 'start', size: 12, boldFirst: true });
M.ROUTING.forEach((r, i) => {
  ky += 20;
  text(40, ky, [`Route ${i + 1}. ${M.HEADLINE[r.id]}`], { anchor: 'start', size: 12 });
  text(500, ky, [`Held by ${M.HOLDERS[r.route].label}`], { anchor: 'start', size: 12 });
  text(830, ky, [`Resumes at ${resumes[r.id]}`], { anchor: 'start', size: 12 });
});
text(40, ky + 36, ['Routes 1 to 3 are checked in that order before the risk grade. Route 3 loops until the evidence meets the floor or cannot be raised.',
  `Routes 4 and 5 come from the TAAP checks. Generated from review-matrix.js, matrix version ${M.MATRIX_VERSION}.`], { anchor: 'start', size: 12, fill: '#444444' });

const W = 1200, H = ky + 66;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d" font-family="Segoe UI, system-ui, -apple-system, Helvetica, Arial, sans-serif">
  <title id="t">SFBRN accessibility review, decision process</title>
  <desc id="d">The review path from requisition intake through the evidence, Exposure and Veracity checks to the severity state, then one lane per severity (S0 to S3) through its TAAP checks to Approve, Approve with TAAP or Deny, with five holds each held by a named party.</desc>
  <defs><marker id="head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${LINE}"/></marker></defs>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <text x="40" y="34" font-size="20" font-weight="700">SFBRN accessibility review, decision process</text>
  <text x="40" y="54" font-size="12" fill="#444444">Shared checks, then one lane per severity state. Each lane ends in a final decision or a hold.</text>
  ${parts.join('\n  ')}
</svg>
`;
fs.writeFileSync(out, svg);
console.log('wrote', out, W, 'x', H);
