// Writes the rendered Definitions section of review-matrix-tester.html to a JSON file, and
// rasterizes the two rubric SVGs beside it, so other builders can reuse the prose and the
// figures without re-implementing the tester's rendering.
//   node dump-definitions.js <playwright module path> <out dir>
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.argv[2]);
const outDir = process.argv[3];
const here = (f) => 'file:///' + path.join(__dirname, f).replace(/\\/g, '/');
const SVGS = [['review-process-checks.svg', 820, 925], ['review-process-remedy.svg', 820, 920], ['rubric-core.svg', 1282, 926]];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(here('review-matrix-tester.html'));
  const html = await p.innerHTML('#defsBody');
  const version = await p.innerText('#version');
  await p.close();
  for (const [f, width, height] of SVGS) {
    const s = await b.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await s.goto(here(f));
    await s.screenshot({ path: path.join(outDir, f.replace('.svg', '.png')) });
    await s.close();
  }
  await b.close();
  if (errs.length) throw new Error(errs.join('\n'));
  fs.writeFileSync(path.join(outDir, 'defs.json'), JSON.stringify({ version, html }));
  console.log('wrote', outDir, html.length, 'chars,', SVGS.length, 'figures');
})();
