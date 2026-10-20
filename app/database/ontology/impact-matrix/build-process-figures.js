// Builds the two page-width process figures for the rubric document, from the model:
//   review-process-checks.svg   intake through the shared checks to the risk grade
//   review-process-remedy.svg   the remedy step, from Needs TAAP to a final decision
// They carry no title, legend or footer; the document's captions and Routes table do that.
// Run after any change to ROUTING, OUTCOMES or CALIBRATION:
//   node build-process-figures.js
const path = require('path');
const fs = require('fs');
const M = require(path.join(__dirname, 'review-matrix.js'));
const { COLOR, makeCanvas } = require(path.join(__dirname, 'diagram-lib.js'));
const C = M.CALIBRATION;
const routeNo = (id) => M.ROUTING.findIndex((r) => r.id === id) + 1;
const holdLines = (id) => {
  const r = M.ROUTING.find((x) => x.id === id);
  const title = `Route ${routeNo(id)}. ${M.HEADLINE[id]}`;
  return [...(title.length > 40 ? title.split(/(?<=:) /) : [title]), `Held by ${M.HOLDERS[r.route].label}`];
};
const W = 820;

// ---- Figure 1. The shared checks, down the left; holds and the Veracity loop on the right.
{
  const { text, box, diamond, arrow, svg } = makeCanvas();
  const SX = 250, SW = 300, DH = 96;
  const HX = 630, HW = 270;
  const Y = { start: 50, d1: 140, p1: 240, d2: 335, p2: 435, d3: 540, fb: 650, grade: 750, end: 865 };
  const hold = (y, id) => { const l = holdLines(id); box(HX, y, HW, l.length * 16 + 24, 'hold', l, { size: 12 }); };

  box(SX, Y.start, SW, 56, 'start', ['Requisition intake', 'exposure answers, findings, evidence on file'], { rx: 28 });
  diamond(SX, Y.d1, SW, DH, ['Accessibility evidence', 'on file?'], 13);
  box(SX, Y.p1, SW, 56, 'step', ['Rate Exposure', 'floors and answers; unknown answers map to high']);
  diamond(SX, Y.d2, SW, DH, ['Unknown answers raise', 'the Exposure level?'], 13);
  box(SX, Y.p2, SW, 60, 'step', ['Rate Severity from the findings, as a minimum', 'task impact of the worst barrier, never the ACR label'], { size: 12 });
  diamond(SX, Y.d3, SW, 100, ['Evidence at the Veracity floor', 'for this Exposure and Severity?', '(S1 always E2 or better)'], 12);
  box(SX, Y.grade, SW, 60, 'step', ['Risk grade', 'from the Exposure level and the Severity']);
  box(SX, Y.end, SW, 60, 'approve', ['Approve', 'S0 and S1 at every Exposure; S2 at low'], { size: 12, stroke: COLOR.approve[1] });
  box(HX, Y.end, HW, 60, 'taap', ['Needs TAAP', 'S2 at medium or high; S3', 'continues in Figure 2'], { size: 12, stroke: COLOR.taap[1] });

  hold(Y.d1, 'severity_unknown');
  hold(Y.d2, 'answers_unknown');
  hold(Y.p2, 'veracity_below_floor');
  diamond(HX, Y.d3, SW, DH, ['Can the evidence be raised?', 'a demonstration, or ATI testing'], 12);
  box(HX, Y.fb, HW, 56, 'step', ['Fallback: S3 (provisional)', 'barriers found as a minimum; Breadth as found,', 'or 2 with no evidence at all'], { size: 11 });

  arrow([[SX, Y.start + 28], [SX, Y.d1 - DH / 2]]);
  arrow([[SX + SW / 2, Y.d1], [HX - HW / 2, Y.d1]], 'no');
  arrow([[SX, Y.d1 + DH / 2], [SX, Y.p1 - 28]], 'yes');
  arrow([[SX, Y.p1 + 28], [SX, Y.d2 - DH / 2]]);
  arrow([[SX + SW / 2, Y.d2], [HX - HW / 2, Y.d2]], 'yes');
  arrow([[SX, Y.d2 + DH / 2], [SX, Y.p2 - 30]], 'no');
  arrow([[SX, Y.p2 + 30], [SX, Y.d3 - 50]]);
  arrow([[SX + SW / 2, Y.d3], [HX - SW / 2, Y.d3]], 'no');
  arrow([[HX, Y.d3 - DH / 2], [HX, Y.p2 + 36]]);
  text(HX + 10, Y.d3 - DH / 2 - 8, ['yes'], { size: 11, fill: '#444444', anchor: 'start' });
  arrow([[HX - HW / 2, Y.p2], [SX + SW / 2, Y.p2]]);
  text((HX - HW / 2 + SX + SW / 2) / 2, Y.p2 + 22, ['resumes with', 'the new findings'], { size: 10, fill: '#444444' });
  arrow([[HX, Y.d3 + DH / 2], [HX, Y.fb - 28]], 'no');
  arrow([[HX, Y.fb + 28], [HX, Y.grade - 45], [SX, Y.grade - 45]], null, { noHead: true });
  arrow([[SX, Y.d3 + 50], [SX, Y.grade - 30]], 'yes');
  arrow([[SX, Y.grade + 30], [SX, Y.end - 30]], 'Approve');
  arrow([[SX + SW / 2, Y.grade], [HX, Y.grade], [HX, Y.end - 30]], 'Needs TAAP');

  fs.writeFileSync(path.join(__dirname, 'review-process-checks.svg'), svg(W, Y.end + 60,
    'Review process, part 1: the shared checks',
    'From requisition intake through the evidence, Exposure and Veracity checks to the risk grade. Routes 1 to 3 hold the review, route 3 loops back to the Severity step, and the fallback joins the S3 path when the evidence cannot be raised.'));
}

// ---- Figure 2. The remedy step: one chain of checks, with Deny exits on the left and
// Approve with TAAP exits on the right. S3-only checks are marked.
{
  const { text, box, diamond, arrow, svg } = makeCanvas();
  const RX = 330, RW = 300, CH = 96;
  const BL = 100, BR = 560;                       // the Deny bus and the Approve with TAAP bus
  const Y = { start: 50, d4: 150, d5: 260, d6: 390, d7: 530, d8: 640, d9: 750, end: 930 };
  const hang = (y, id, label, side) => {
    const x = RX + side * 80;
    arrow([[RX + side * RW / 2, y], [x, y], [x, y + 40]], label);
    box(x, y + 58, 126, 36, 'hold', [`Route ${routeNo(id)}`, { severity_unknown: '', taap_needed: 'TAAP needed', exception_claimed: 'formal determination' }[id]], { size: 11 });
  };

  box(RX, Y.start, RW, 56, 'taap', ['Needs TAAP', 'from the risk grade (Figure 1)'], { size: 12, stroke: COLOR.taap[1] });
  diamond(RX, Y.d4, RW, CH, ['A more accessible product', 'meets the same need?', '(S3 only)']);
  diamond(RX, Y.d5, RW, CH, ['TAAP on file?']);
  diamond(RX, Y.d6, RW, CH, ['TAAP meets', 'the standard?']);
  diamond(RX, Y.d7, RW, CH, ['TAAP meets none', 'of the six?']);
  diamond(RX, Y.d8, RW, CH, ['Below the standard', `at pressure ${C.taapStandard.denyAt} or more?`, '(S3 only)']);
  diamond(RX, Y.d9, RW, CH, ['Undue burden or', 'fundamental alteration', 'determination?']);
  box(BL, Y.end, 150, 60, 'deny', ['Deny', 'reasons, standard,', 'path to a new review'], { size: 12, stroke: COLOR.deny[1] });
  box(RX + 30, Y.end, 300, 60, 'taap', ['Approve with TAAP', 'statement, three signers, roadmap;', `${M.TAAP_TERMS.reviewMonths}-month term or until renewal`], { size: 12, stroke: COLOR.taap[1] });

  arrow([[RX, Y.start + 28], [RX, Y.d4 - CH / 2]]);
  arrow([[RX - RW / 2, Y.d4], [BL, Y.d4], [BL, Y.end - 30]], 'yes');
  arrow([[RX, Y.d4 + CH / 2], [RX, Y.d5 - CH / 2]], 'no');
  hang(Y.d5, 'taap_needed', 'no', -1);
  arrow([[RX, Y.d5 + CH / 2], [RX, Y.d6 - CH / 2]], 'yes');
  arrow([[RX + RW / 2, Y.d6], [BR, Y.d6], [BR, Y.end], [RX + 180, Y.end]], 'yes');
  arrow([[RX, Y.d6 + CH / 2], [RX, Y.d7 - CH / 2]], 'no');
  arrow([[RX - RW / 2, Y.d7], [BL, Y.d7]], 'yes', { noHead: true });
  arrow([[RX, Y.d7 + CH / 2], [RX, Y.d8 - CH / 2]], 'no (S2: approved under a warning)');
  arrow([[RX + RW / 2, Y.d8], [BR, Y.d8]], ['no: approved', 'under a warning'], { noHead: true });
  arrow([[RX, Y.d8 + CH / 2], [RX, Y.d9 - CH / 2]], 'yes');
  arrow([[RX - RW / 2, Y.d9], [BL, Y.d9]], 'none', { noHead: true });
  hang(Y.d9, 'exception_claimed', 'claimed', 1);
  arrow([[RX, Y.d9 + CH / 2], [RX, Y.end - 30]]);
  text(RX - 8, Y.d9 + CH / 2 + 28, ['on file:', 'high warning'], { size: 11, fill: '#444444', anchor: 'end' });

  fs.writeFileSync(path.join(__dirname, 'review-process-remedy.svg'), svg(W, Y.end + 60,
    'Review process, part 2: the remedy step',
    'From a Needs TAAP risk grade through the more-accessible-product, TAAP on file, TAAP standard, meets-none, below-standard and determination checks to Deny or Approve with TAAP, with routes 4 and 5 as holds.'));
}
console.log('wrote review-process-checks.svg and review-process-remedy.svg');
