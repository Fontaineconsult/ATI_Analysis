// Builds the two page-width process figures for the rubric document, from the model:
//   review-process-checks.svg   intake through the shared checks to the risk grade
//   review-process-remedy.svg   the remedy step, from Alternate access required to a final decision
// They carry no title, legend or footer; the document's captions and Holds table do that.
// Run after any change to HOLDS, OUTCOMES or CALIBRATION:
//   node build-process-figures.js
const path = require('path');
const fs = require('fs');
const M = require(path.join(__dirname, 'review-matrix.js'));
const { COLOR, makeCanvas } = require(path.join(__dirname, 'diagram-lib.js'));
const C = M.CALIBRATION;
const holdNo = (id) => M.HOLDS.findIndex((h) => h.id === id) + 1;
const holdOf = (id) => M.HOLDS.find((h) => h.id === id);
const holdLines = (id) => [`Hold ${holdNo(id)}, for ${holdOf(id).waits}`, `Held by ${M.HOLDERS[holdOf(id).holder].label}`];
const kText = (k) => (k === 6 ? 'all 6' : `${k} of 6`);

// ---- Figure 1. The shared checks, down the left; holds and the Veracity loop on the right.
// A bus down the far right carries the no-evidence case to the same "can it be raised" check,
// because the model falls back from no evidence at all once the ATI review team records that
// none can be obtained.
{
  const { text, box, diamond, arrow, svg } = makeCanvas();
  const W = 900;
  const SX = 250, SW = 300, DH = 96;
  const HX = 630, HW = 270, BUS = 800;
  const Y = { start: 50, d0: 140, d1: 240, p1: 340, d2: 435, p2: 535, d3: 645, fb: 755, grade: 855, end: 970 };
  const hold = (y, id) => { const l = holdLines(id); box(HX, y, HW, l.length * 16 + 24, 'hold', l, { size: 12 }); };

  box(SX, Y.start, SW, 56, 'start', ['Requisition intake', 'exposure answers, findings, evidence on file'], { rx: 28 });
  diamond(SX, Y.d0, SW, DH, ['Purchased as an accommodation', 'for one named person?'], 13);
  box(HX, Y.d0, HW, 56, 'approve', ['Approve at intake', 'limited to the accommodation; nothing rated'], { size: 12, stroke: COLOR.approve[1] });
  diamond(SX, Y.d1, SW, DH, ['Accessibility evidence', 'on file?'], 13);
  box(SX, Y.p1, SW, 56, 'step', ['Rate Exposure', 'floors and answers; unknown answers map to high']);
  diamond(SX, Y.d2, SW, DH, ['Unknown answers raise', 'the Exposure level?'], 13);
  box(SX, Y.p2, SW, 72, 'step', ['Rate Severity from the findings, as a minimum', 'task impact of the worst barrier, never the ACR label',
    `${C.accumulation.stack} S2 on one pair, or ${C.accumulation.spreadPairs} pairs at high Exposure, rate S3`], { size: 11 });
  diamond(SX, Y.d3, SW, 100, ['Evidence at the Veracity floor', 'for this Exposure and Severity?', '(S1 always E2 or better)'], 12);
  box(SX, Y.grade, SW, 72, 'step', ['Risk grade', 'from the Exposure level and the Severity',
    'Breadth (0 to 2) is rated here for the TAAP standard'], { size: 11 });
  box(SX, Y.end, SW, 60, 'approve', ['No alternate access required', 'S0 and S1 at every Exposure; S2 at low'], { size: 12, stroke: COLOR.approve[1] });
  box(HX, Y.end, HW, 60, 'taap', ['Alternate access required', 'S2 at medium or high; S3', 'continues in Figure 2'], { size: 12, stroke: COLOR.taap[1] });

  hold(Y.d1, 'severity_unknown');
  hold(Y.d2, 'answers_unknown');
  hold(Y.p2, 'veracity_below_floor');
  diamond(HX, Y.d3, SW, 100, ['Can the evidence be raised?', 'a demonstration or ATI testing;', 'the ATI review team records a no'], 11);
  box(HX, Y.fb, HW, 56, 'step', ['Fallback: S3 (provisional)', 'barriers found as a minimum; Breadth as found,', 'or 2 with no evidence at all'], { size: 11 });

  arrow([[SX, Y.start + 28], [SX, Y.d0 - DH / 2]]);
  arrow([[SX + SW / 2, Y.d0], [HX - HW / 2, Y.d0]], 'yes');
  arrow([[SX, Y.d0 + DH / 2], [SX, Y.d1 - DH / 2]], 'no');
  arrow([[SX + SW / 2, Y.d1], [HX - HW / 2, Y.d1]], 'no');
  arrow([[SX, Y.d1 + DH / 2], [SX, Y.p1 - 28]], 'yes');
  arrow([[SX, Y.p1 + 28], [SX, Y.d2 - DH / 2]]);
  arrow([[SX + SW / 2, Y.d2], [HX - HW / 2, Y.d2]], 'yes');
  arrow([[SX, Y.d2 + DH / 2], [SX, Y.p2 - 36]], 'no');
  arrow([[SX, Y.p2 + 36], [SX, Y.d3 - 50]]);
  arrow([[SX + SW / 2, Y.d3], [HX - SW / 2, Y.d3]], 'no');
  arrow([[HX, Y.d3 - 50], [HX, Y.p2 + 36]]);
  text(HX + 10, Y.d3 - 50 - 8, ['yes'], { size: 11, fill: '#444444', anchor: 'start' });
  arrow([[HX - HW / 2, Y.p2], [SX + SW / 2, Y.p2]]);
  text((HX - HW / 2 + SX + SW / 2) / 2, Y.p2 + 22, ['resumes with', 'the new findings'], { size: 10, fill: '#444444' });
  // The no-evidence case: from hold 1 along the bus to the "can it be raised" check.
  arrow([[HX + HW / 2, Y.d1], [BUS, Y.d1], [BUS, Y.d3], [HX + SW / 2, Y.d3]]);
  text(BUS + 8, (Y.d1 + Y.d3) / 2, ['no evidence', 'can be', 'obtained'], { size: 10, fill: '#444444', anchor: 'start' });
  arrow([[HX, Y.d3 + 50], [HX, Y.fb - 28]], 'no');
  arrow([[HX, Y.fb + 28], [HX, Y.grade - 48], [SX, Y.grade - 48]], null, { noHead: true });
  arrow([[SX, Y.d3 + 50], [SX, Y.grade - 36]], 'yes');
  arrow([[SX, Y.grade + 36], [SX, Y.end - 30]], 'No alternate access required');
  arrow([[SX + SW / 2, Y.grade], [HX, Y.grade], [HX, Y.end - 30]], 'Alternate access required');

  fs.writeFileSync(path.join(__dirname, 'review-process-checks.svg'), svg(W, Y.end + 60,
    'Review process, part 1: the shared checks',
    'From requisition intake through the evidence, Exposure and Veracity checks to the risk grade. An accommodation purchase is approved at intake. Holds 1 to 3 pause the review, hold 3 resumes at the Severity step, and the fallback joins the S3 path when the ATI review team records that the evidence cannot be raised, including when none is on file at all.'));
}

// ---- Figure 2. The remedy step: one chain of checks, with Deny exits on the left and
// Approve with TAAP exits on the right. S3-only checks are marked.
{
  const { text, box, diamond, arrow, svg } = makeCanvas();
  const W = 820;
  const RX = 330, RW = 300, CH = 96;
  const BL = 100, BR = 560;                       // the Deny bus and the Approve with TAAP bus
  const Y = { start: 50, d4: 150, d5: 260, d6: 445, d7: 595, d9: 735, end: 935 };
  const hang = (y, id, label, side, lines) => {
    const x = RX + side * 112;                  // the box clears the main line and the buses
    arrow([[RX + side * RW / 2, y], [x, y], [x, y + 40]], label);
    const holder = M.HOLDERS[holdOf(id).holder].label.split(' with ');   // the long holder wraps
    const all = [`Hold ${holdNo(id)}, for ${holdOf(id).waits}`, `Held by ${holder[0]}`, ...(holder[1] ? [`with ${holder[1]}`] : []), ...lines];
    box(x, y + 40 + (all.length * 15 + 16) / 2, 215, all.length * 15 + 16, 'hold', all, { size: 11 });
  };
  const req = C.taapStandard.required;
  const minimum = `${kText(req[0])} at pressure 0 or 1, ${kText(req[2])} at 2, ${kText(req[3])} at 3 or more`;

  box(RX, Y.start, RW, 56, 'taap', ['Alternate access required', 'from the risk grade (Figure 1)'], { size: 12, stroke: COLOR.taap[1] });
  diamond(RX, Y.d4, RW, CH, ['A more accessible product', 'meets the same need?', '(S3 only)']);
  diamond(RX, Y.d5, RW, CH, ['TAAP on file?']);
  diamond(RX, Y.d6, RW + 60, 120, ['TAAP meets the minimum?', 'pressure = Exposure rank + Breadth', minimum], 11);
  diamond(RX, Y.d7, RW, CH, ['TAAP meets none', 'of the six?']);
  diamond(RX, Y.d9, RW, CH, ['Undue burden or', 'fundamental alteration', 'determination?']);
  box(BL, Y.end, 150, 60, 'deny', ['Deny', 'reasons, standard,', 'path to a new review'], { size: 12, stroke: COLOR.deny[1] });
  box(RX + 30, Y.end, 300, 76, 'taap', ['Approve with TAAP', 'statement, three signers, roadmap;', `${M.TAAP_TERMS.reviewMonths}-month term or until renewal;`,
    'warning level from pressure and the gap'], { size: 12, stroke: COLOR.taap[1] });

  arrow([[RX, Y.start + 28], [RX, Y.d4 - CH / 2]]);
  arrow([[RX - RW / 2, Y.d4], [BL, Y.d4], [BL, Y.end - 30]], 'yes');
  arrow([[RX, Y.d4 + CH / 2], [RX, Y.d5 - CH / 2]], 'no');
  hang(Y.d5, 'taap_needed', 'no', -1, ['Resumes at this check with the TAAP;', 'carries the minimum and the warning']);
  arrow([[RX, Y.d5 + CH / 2], [RX, Y.d6 - 60]], 'yes');
  arrow([[RX + (RW + 60) / 2, Y.d6], [BR, Y.d6], [BR, Y.end], [RX + 180, Y.end]], 'yes');
  arrow([[RX, Y.d6 + 60], [RX, Y.d7 - CH / 2]], 'no');
  arrow([[RX - RW / 2, Y.d7], [BL, Y.d7]], 'yes', { noHead: true });
  arrow([[RX, Y.d7 + CH / 2], [RX, Y.d9 - CH / 2]], 'no: below the minimum');
  arrow([[RX - RW / 2, Y.d9], [BL, Y.d9]], 'none', { noHead: true });
  hang(Y.d9, 'exception_claimed', 'claimed', 1, ['Resumes at this check', 'with the determination']);
  arrow([[RX, Y.d9 + CH / 2], [RX, Y.end - 38]]);
  text(RX - 8, Y.d9 + CH / 2 + 28, ['on file:', 'high warning'], { size: 11, fill: '#444444', anchor: 'end' });

  fs.writeFileSync(path.join(__dirname, 'review-process-remedy.svg'), svg(W, Y.end + 70,
    'Review process, part 2: the remedy step',
    'From an Alternate access required risk grade through the more-accessible-product, TAAP on file, TAAP minimum, meets-none and determination checks to Deny or Approve with TAAP, with holds 4 and 5 hanging off the checks they resume at.'));
}
console.log('wrote review-process-checks.svg and review-process-remedy.svg');
