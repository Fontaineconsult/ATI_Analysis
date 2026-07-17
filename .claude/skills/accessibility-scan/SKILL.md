---
name: accessibility-scan
description: Run the axe accessibility sweep over every app page, aggregate the violations into a per-component worklist, fix them at the token/component level, and re-verify until the suite is green. Use when WAVE/axe/a lighthouse audit reports accessibility errors, after any UI change, or on request like "run an accessibility scan", "fix the axe errors", "WAVE is reporting errors".
---

# accessibility-scan

Repeatable procedure to scan → aggregate → fix → verify accessibility across the whole
frontend, using the Playwright + axe suite in `e2e/`. This encodes the workflow that took
the app from 858 violation nodes to 0 (2026-07); follow it rather than improvising.

Companion docs: `claude_files/design-sense.md` §2/§6/§6.1 (token rules + APG widget map),
`claude_files/a11y-apg-second-pass-plan.md` (keyboard contracts), `e2e/BASELINE-2026-07-16.md`
(fix log with worked examples).

## Prerequisites

- Neo4j reachable per `app/.env.development`; server's `AUTH_ENFORCED` off (dev default).
- Both servers are auto-launched by Playwright's `webServer` config (Flask via
  `.venv314\Scripts\python.exe run.py`, CRA via `npm start`) — or reused if running.
- New pages MUST be in `e2e/routes.js` before they can be scanned. If the task mentions a
  page not in the manifest, add it first (name + path under the right area group).

## Step 1 — Sweep and health-check

```bash
cd e2e
npx playwright test --reporter=list > full-run.txt 2>&1; echo "exit: $?"
tail -5 full-run.txt
```

**Two hard rules, both learned the painful way:**

1. **Never pipe `npx playwright test` through `tail`/`grep` and read the pipe's exit code**
   — the pipe masks Playwright's failure code. Redirect to a file, echo `$?`, then read
   the file.
2. **Axe passing means nothing unless smoke passes in the same run.** A compile error
   blanks the app and axe scans the empty/error page as trivially clean, while the
   interactive specs (smoke/navigation/keyboard) time out or skip. If `smoke.spec.js`
   fails or keyboard specs unexpectedly skip, the app is broken — fix compilation first
   (check the CRA terminal output or load http://localhost:3000/ati in a browser), then
   re-sweep. Suspiciously fast scans (~2s/route) are the same smell.

If everything is green and the report still disagrees with WAVE, jump to "WAVE parity".

## Step 2 — Aggregate into a worklist

Re-run the failing scope with the JSON reporter and aggregate. Dedupe by
normalized HTML signature — the count tells you it's ONE component rendered N times, which
is what makes 500-node totals tractable:

```bash
cd e2e
PLAYWRIGHT_JSON_OUTPUT_NAME=results.json npx playwright test tests/a11y-routes.spec.js tests/a11y-overlays.spec.js --reporter=json > /dev/null 2>&1
node -e "
const fs = require('fs');
const report = JSON.parse(fs.readFileSync('results.json', 'utf8'));
const byRule = {};
function walk(suite) {
    (suite.specs || []).forEach(spec => spec.tests.forEach(t => t.results.forEach(r => (r.attachments || []).forEach(a => {
        if (a.name !== 'axe-results.json' || !a.body) return;
        const axe = JSON.parse(Buffer.from(a.body, 'base64').toString('utf8'));
        (axe.violations || []).forEach(v => {
            byRule[v.id] = byRule[v.id] || [];
            v.nodes.forEach(n => byRule[v.id].push({ route: spec.title, target: n.target.join(' '), html: n.html.slice(0, 300), summary: (n.failureSummary || '').slice(0, 300) }));
        });
    }))));
    (suite.suites || []).forEach(walk);
}
report.suites.forEach(walk);
const out = [];
for (const [rule, nodes] of Object.entries(byRule)) {
    out.push('='.repeat(80), 'RULE: ' + rule + '  (' + nodes.length + ' nodes)');
    const byHtml = {};
    nodes.forEach(n => {
        const key = n.html.replace(/css-[a-z0-9]+/g, 'css-X').slice(0, 160);
        byHtml[key] = byHtml[key] || { count: 0, routes: new Set(), sample: n };
        byHtml[key].count++; byHtml[key].routes.add(n.route);
    });
    Object.values(byHtml).sort((a, b) => b.count - a.count).forEach(g => {
        out.push('--- x' + g.count + ' on [' + [...g.routes].join('; ') + ']', '  html: ' + g.sample.html, '  target: ' + g.sample.target, '  why: ' + g.sample.summary.replace(/\n/g, ' '));
    });
}
fs.writeFileSync('axe-worklist.txt', out.join('\n'));
console.log('worklist written:', Object.keys(byRule).map(r => r + '=' + byRule[r].length).join(', '));
"
rm -f results.json
```

Read `e2e/axe-worklist.txt` and locate each deduped signature's component (grep for its
visible text or a distinctive prop). Delete the worklist file when done.

## Step 3 — Fix (the cookbook)

Fix at the highest level that owns the problem: **theme/token → shared component →
per-instance**. Never exclude an axe rule; exclusions need a written justification.

| Rule | The fix in this codebase |
|---|---|
| `color-contrast` | **gray.600 is the floor for text grays** (design-sense §2) — never reintroduce `gray.400`/`gray.500` text. Solid/outline Badge+Button shades are handled by `theme.js` (`SOLID_AA_SHADE`, `TEXT_AA_SHADE`, `BADGE_OUTLINE_AA_SHADE`) — use `colorScheme`, don't hand-set bg/text hexes. Status colors: `getStatusColor()` is **non-text fills only**; text uses `getStatusTextColor()` over `getStatusBackgroundColor()` tints (`services/utils/statusColors.js`). Never mute a row with `opacity` — restyle with bg + italic + gray.600 instead (see SuccessIndicators.js removed-rows). Chakra `Stat` label/helpText are theme-fixed; don't override lighter. |
| `label` / `select-name` | `aria-label` on the control, made unique with the row's business key: `` aria-label={`Status — ${indicator.composite_key}`} ``. A Chakra `Select` `placeholder` renders as an `<option>` and is NOT a name. `title` is unreliable — use aria-label. |
| `aria-prohibited-attr` | `aria-label` sits on a `span`/`div` with no role. Give it a role that accepts naming (`role="note"` for the HelpTip pattern) or use a real element (design-sense §6.1). |
| `nested-interactive` | A `role="button"` container with focusable children. Remove the container role; move the disclosure semantics (`aria-expanded` + name) onto a real inner button (see `IndicatorRow.jsx`). |
| `scrollable-region-focusable` | Preferred: make the content focusable (listbox roving tabindex via `hooks/useListboxNavigation.js`). Fallback for static content: `tabIndex={0} role="region" aria-label` + focus ring (see `VocabTable`). |
| `aria-required-children` | Empty listbox (no `option` children). Make the role conditional: `role={hasRows ? 'listbox' : undefined}` (see VendorList/TaapList `hasRows` pattern). |
| Clickable `Box`/`Flex` findings | Real `button`, or `role="button" tabIndex={0}` + Enter/Space `onKeyDown` + `_focusVisible` ring + descriptive `aria-label` (see WgQueriesSection rows, CampusPlanStatStrip tiles). |

New widget? Check its APG pattern in the design-sense §6.1 table first — the fix is
usually "implement the pattern", not "silence the rule".

## Step 4 — Verify and close out

1. Targeted re-scan while iterating: `npx playwright test tests/a11y-routes.spec.js --grep "<route name>"`.
2. Full gate (BOTH must be green, exit codes read from `$?` not a pipe):
   - `cd e2e && npx playwright test` — the axe sweep AND smoke/navigation/keyboard specs.
   - `cd app/frontend/src && CI=true npx react-scripts test --watchAll=false` — Jest.
3. If you used a scripted codemod (node/sed replace), **grep for duplicate imports and
   verify each intended replacement landed** — silent exact-match misses and doubled
   imports have both happened; a doubled import is a compile break that makes axe
   green-on-blank (Step 1 rule 2).
4. Record what changed: append to the fix log in `e2e/BASELINE-*.md`; if a new token rule
   emerged, encode it in `claude_files/design-sense.md` so it's the contract, not tribal
   knowledge.

## WAVE parity

WAVE and axe overlap on WCAG A/AA errors but WAVE also surfaces "alerts" that axe files
under best-practice rules, and WAVE scans **the DOM you're looking at** (including open
modals/menus — states the route sweep never renders).

When WAVE reports something the green suite doesn't:

1. **Deep mode:** `AXE_EXTRA_TAGS=best-practice npx playwright test tests/a11y-routes.spec.js`
   — adds heading-order, landmark-uniqueness, region, etc. Triage those findings with the
   same cookbook (they're real, just not A/AA violations). Don't add best-practice to the
   default gate unless it's green.
2. **State coverage:** if WAVE was run with a modal/menu/accordion open, that state needs
   its own scan — extend `tests/a11y-overlays.spec.js` with a test that opens that exact
   UI and scans scoped via `.include()`.
3. **Genuinely WAVE-only items** (redundant links, redundant title text, very-small text,
   suspicious alt text, AAA contrast): judge against design-sense; fix what's real,
   document the deliberate exceptions in the baseline file.
4. WAVE contrast math is the same WCAG formula — a contrast disagreement means a different
   rendered state (hover, opacity, gradient) or different page, not a different standard.
