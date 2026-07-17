// Route-wide axe sweep: every statically-addressable page, scanned at
// WCAG 2.0/2.1 A+AA after the page settles. One test per route so failures
// are per-page and the sweep parallelizes.
const { test, expect } = require('../fixtures/axe');
const { gotoAndSettle } = require('../helpers/app');
const { formatViolations, attachAxeResults } = require('../helpers/axe-report');
const { ROUTES } = require('../routes');

test.describe('axe sweep', () => {
    for (const route of ROUTES) {
        test(route.name, async ({ page, makeAxeBuilder }, testInfo) => {
            await gotoAndSettle(page, route.path);

            const results = await makeAxeBuilder().analyze();
            await attachAxeResults(testInfo, results);

            expect(results.violations, formatViolations(results.violations)).toEqual([]);
        });
    }
});
