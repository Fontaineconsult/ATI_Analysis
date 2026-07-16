// Smoke: the app boots, routes resolve, and the shell renders.
// If these fail, a11y results are meaningless — fix the harness first.
const { test, expect } = require('../fixtures/axe');
const { gotoAndSettle } = require('../helpers/app');
const { CAMPUS, campusPath } = require('../routes');

test.describe('app shell', () => {
    test('root redirects to the default campus dashboard', async ({ page }) => {
        await page.goto('/ati/');
        await expect(page).toHaveURL(new RegExp(`/ati/sfsu/dashboard`));
    });

    test('auth gate is transparent (AUTH_ENFORCED off for e2e)', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard'));
        // If the login screen is showing, the server has AUTH_ENFORCED on —
        // the suite assumes the dev default (off).
        await expect(
            page.getByRole('navigation', { name: 'Main Navigation' }),
            'Login gate appears to be active. Run the suite with AUTH_ENFORCED off.',
        ).toBeVisible();
    });

    test('header nav and section nav render', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard'));
        await expect(page.getByRole('navigation', { name: 'Main Navigation' })).toBeVisible();
        await expect(page.getByRole('navigation', { name: 'Section navigation' })).toBeVisible();
    });

    test('about pages render without data', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/about/overview'));
        await expect(page.locator('main')).toBeVisible();
    });

    test('explorer redirects to implementations', async ({ page }) => {
        await page.goto(campusPath('/ati-explorer'));
        await expect(page).toHaveURL(new RegExp(`/ati/${CAMPUS}/ati-explorer/implementations`));
    });
});
