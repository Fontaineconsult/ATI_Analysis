// Axe scans of the campus-plan page in its opened states. The route sweep scans the page
// as it first renders; these open each disclosure and dialog on a working-group card and
// scan it while open, scoped with .include() so page-level findings stay in
// a11y-routes.spec.js. Nothing here saves: dialogs are opened, scanned, and closed with
// Escape. A state the campus has no data for (no minutes, no queries) is skipped, not
// failed.
const { test, expect } = require('../fixtures/axe');
const { gotoAndSettle } = require('../helpers/app');
const { formatViolations, attachAxeResults } = require('../helpers/axe-report');
const { campusPath } = require('../routes');

async function expectNoViolations(makeAxeBuilder, testInfo, selector) {
    const results = await makeAxeBuilder().include(selector).analyze();
    await attachAxeResults(testInfo, results);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);
}

// Working-group card sections by name. Not anchored at the end: a section with a count
// carries the pill in its heading ("Web Prioritized Indicators 2").
function cardRegions(page, name) {
    return page.getByRole('region', { name: new RegExp(name) });
}

async function scanDialogOpenedBy(page, makeAxeBuilder, testInfo, trigger) {
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.first()).toBeVisible();
    await expectNoViolations(makeAxeBuilder, testInfo, '[role="dialog"]');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
}

test.describe('campus plan: opened states', () => {
    test.beforeEach(async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard/campus-plan'));
    });

    test('expanded prioritized-indicator row', async ({ page, makeAxeBuilder }, testInfo) => {
        const toggles = cardRegions(page, 'Prioritized Indicators').getByRole('button', { expanded: false });
        test.skip((await toggles.count()) === 0, 'no prioritized indicators on this campus');
        await toggles.first().click();
        await expect(page.getByRole('button', { expanded: true }).first()).toBeVisible();
        await expectNoViolations(makeAxeBuilder, testInfo, 'main');
    });

    test('all communities shown (+ more)', async ({ page, makeAxeBuilder }, testInfo) => {
        const more = cardRegions(page, 'Communities of Practice').getByRole('button', { name: /more$/ });
        test.skip((await more.count()) === 0, 'no card has more communities than the collapsed count');
        await more.first().click();
        await expect(page.getByRole('button', { name: 'Show fewer' }).first()).toBeVisible();
        await expectNoViolations(makeAxeBuilder, testInfo, 'main');
    });

    test('manage leads dialog', async ({ page, makeAxeBuilder }, testInfo) => {
        await scanDialogOpenedBy(page, makeAxeBuilder, testInfo,
            page.getByRole('button', { name: 'Manage leads' }).first());
    });

    test('add indicator dialog', async ({ page, makeAxeBuilder }, testInfo) => {
        await scanDialogOpenedBy(page, makeAxeBuilder, testInfo,
            page.getByRole('button', { name: '+ Add Indicator' }).first());
    });

    test('meeting minutes dialog', async ({ page, makeAxeBuilder }, testInfo) => {
        const rows = page.getByRole('button', { name: /^Open meeting minutes:/ });
        test.skip((await rows.count()) === 0, 'no meeting minutes on this campus');
        await scanDialogOpenedBy(page, makeAxeBuilder, testInfo, rows.first());
    });

    test('query dialog', async ({ page, makeAxeBuilder }, testInfo) => {
        const rows = page.getByRole('button', { name: /^Open query:/ });
        test.skip((await rows.count()) === 0, 'no queries on this campus');
        await scanDialogOpenedBy(page, makeAxeBuilder, testInfo, rows.first());
    });
});
