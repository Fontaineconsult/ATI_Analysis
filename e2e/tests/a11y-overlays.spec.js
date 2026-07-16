// Axe scans of open-state UI: axe only sees rendered DOM, so menus and
// dialogs must be scanned while open. Scans are scoped to the overlay via
// .include() so page-level issues stay in a11y-routes.spec.js, not here.
const { test, expect } = require('../fixtures/axe');
const { gotoAndSettle } = require('../helpers/app');
const { formatViolations, attachAxeResults } = require('../helpers/axe-report');
const { campusPath } = require('../routes');

// Chakra Menu portals render into the body; scope the scan to the popup.
async function scanOpenMenu(page, makeAxeBuilder, testInfo, buttonName) {
    await page.getByRole('button', { name: buttonName }).click();
    const menu = page.getByRole('menu');
    await expect(menu.first()).toBeVisible();

    const results = await makeAxeBuilder().include('[role="menu"]').analyze();
    await attachAxeResults(testInfo, results);
    expect(results.violations, formatViolations(results.violations)).toEqual([]);

    await page.keyboard.press('Escape');
}

test.describe('header overlays', () => {
    test.beforeEach(async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard'));
    });

    test('campus selector menu', async ({ page, makeAxeBuilder }, testInfo) => {
        // The campus button carries the current campus display name; match on
        // the chevron-bearing header buttons by position instead of text.
        const headerButtons = page
            .getByRole('navigation', { name: 'Main Navigation' })
            .getByRole('button', { expanded: false });
        await headerButtons.nth(0).click();
        const menu = page.getByRole('menu');
        await expect(menu.first()).toBeVisible();

        const results = await makeAxeBuilder().include('[role="menu"]').analyze();
        await attachAxeResults(testInfo, results);
        expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });

    test('year selector menu', async ({ page, makeAxeBuilder }, testInfo) => {
        const headerButtons = page
            .getByRole('navigation', { name: 'Main Navigation' })
            .getByRole('button', { expanded: false });
        await headerButtons.nth(1).click();
        const menu = page.getByRole('menu');
        await expect(menu.first()).toBeVisible();

        const results = await makeAxeBuilder().include('[role="menu"]').analyze();
        await attachAxeResults(testInfo, results);
        expect(results.violations, formatViolations(results.violations)).toEqual([]);
    });

    test('person selector menu', async ({ page, makeAxeBuilder }, testInfo) => {
        await scanOpenMenu(page, makeAxeBuilder, testInfo, 'Select person');
    });
});
