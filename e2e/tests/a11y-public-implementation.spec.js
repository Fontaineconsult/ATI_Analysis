// Public implementation page — discovered dynamically (UUIDs can't live in the
// static route manifest): follow the first cross-link from the public indicator
// report, verify it's the real SSR page, and axe-scan it.
const { test, expect } = require('../fixtures/axe');
const { formatViolations, attachAxeResults } = require('../helpers/axe-report');

test('public implementation page (via cross-link) is axe-clean', async ({ page, makeAxeBuilder }, testInfo) => {
    await page.goto('/ati/reports/public/sfsu/2025-2026/web/1/1');
    await expect(page.locator('#root')).toHaveCount(0);

    const implLink = page.locator('a[href^="/ati/reports/public/implementation/"]').first();
    await expect(implLink, 'public report should cross-link an implementation').toBeVisible();
    await implLink.click();

    await expect(page.locator('#root')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Evidence For/ })).toBeVisible();

    const results = await makeAxeBuilder().analyze();
    await attachAxeResults(testInfo, results);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
});
