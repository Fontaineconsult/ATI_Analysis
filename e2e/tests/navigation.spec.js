// Wayfinding contracts from the APG second pass (packages A + B):
// skip link, focus-on-navigate, document.title, aria-current, and the
// route-driven section switchers. These are the keyboard behaviors axe
// cannot check — this spec is their regression net.
const { test, expect } = require('../fixtures/axe');
const { gotoAndSettle } = require('../helpers/app');
const { CAMPUS, campusPath } = require('../routes');

test.describe('skip link', () => {
    test('is the first tab stop and moves focus to main', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard'));

        await page.keyboard.press('Tab');
        const first = page.locator(':focus');
        await expect(first).toHaveText('Skip to main content');

        await page.keyboard.press('Enter');
        await expect
            .poll(() => page.evaluate(() => document.activeElement?.id))
            .toBe('main-content');
    });
});

test.describe('page titles and focus on navigation', () => {
    test('document.title names the current page', async ({ page }) => {
        // /dashboard client-redirects to /dashboard/reports (Dashboard.js), so
        // both land on the View Reports title.
        await gotoAndSettle(page, campusPath('/dashboard'));
        await expect(page).toHaveTitle(/Dashboard · View Reports — SFBRN Evidence Graph/);

        await gotoAndSettle(page, campusPath('/dashboard/campus-plan'));
        await expect(page).toHaveTitle(/Dashboard · Campus Plan — SFBRN Evidence Graph/);

        await gotoAndSettle(page, campusPath('/about/glossary'));
        await expect(page).toHaveTitle(/About · Glossary — SFBRN Evidence Graph/);
    });

    test('page-level navigation moves focus to main', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard'));
        await page
            .getByRole('navigation', { name: 'Section navigation' })
            .getByRole('link', { name: 'Campus Plan' })
            .click();
        await expect(page).toHaveURL(/campus-plan/);
        await expect
            .poll(() => page.evaluate(() => document.activeElement?.id))
            .toBe('main-content');
    });

    test('in-area navigation does NOT steal focus (settings section switch)', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard/settings/status-levels'));
        // Switching sections inside the same area keeps the page identity
        // (campus/dashboard/settings) — focus must stay on the clicked link,
        // not jump to main.
        const membersLink = page
            .getByRole('navigation', { name: 'Settings sections' })
            .getByRole('link', { name: 'Members' });
        await membersLink.click();
        await expect(page).toHaveURL(/settings\/members/);
        await expect
            .poll(() => page.evaluate(() => document.activeElement?.id))
            .not.toBe('main-content');
    });
});

test.describe('aria-current', () => {
    test('top nav marks the active area', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard'));
        const topNav = page.getByRole('navigation', { name: 'Main Navigation' });
        await expect(topNav.locator('[aria-current="page"]')).toHaveText('Dashboard');
    });

    test('SubNavbar marks the active section across deep routes', async ({ page }) => {
        // Prefix matching: goal 2 of the Web group still marks "Web" current.
        await gotoAndSettle(page, campusPath('/dashboard/web/goal/2'));
        const subNav = page.getByRole('navigation', { name: 'Section navigation' });
        await expect(subNav.locator('[aria-current="page"]')).toHaveText(/Web/);

        await gotoAndSettle(page, campusPath('/dashboard/settings/status-levels'));
        await expect(subNav.locator('[aria-current="page"]')).toHaveText('Settings');
    });
});

test.describe('route-driven section switchers', () => {
    test('settings sections are deep-linkable with aria-current', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard/settings/status-levels'));
        const settingsNav = page.getByRole('navigation', { name: 'Settings sections' });
        await expect(settingsNav.locator('[aria-current="page"]')).toHaveText('Status Levels');

        // Clicking another section navigates (URL changes) and moves aria-current.
        await settingsNav.getByRole('link', { name: 'Members' }).click();
        await expect(page).toHaveURL(/settings\/members/);
        await expect(settingsNav.locator('[aria-current="page"]')).toHaveText('Members');
    });

    test('assets tabs write the URL and deep links select the tab', async ({ page }) => {
        // The assets area loads nine datasets; under full-suite worker
        // contention the default budget is too tight.
        test.slow();
        await gotoAndSettle(page, campusPath('/ati-explorer/assets'));
        await page.getByRole('tab', { name: 'TAAPs' }).click();
        await expect(page).toHaveURL(new RegExp(`/ati/${CAMPUS}/ati-explorer/assets/taaps`));

        await gotoAndSettle(page, campusPath('/ati-explorer/assets/vendors'));
        await expect(page.getByRole('tab', { name: 'Vendors' })).toHaveAttribute('aria-selected', 'true');
    });
});
