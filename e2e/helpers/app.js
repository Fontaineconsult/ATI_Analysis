// Navigation helpers for the ATI app under test.

/**
 * Navigate to a path and wait until the page has settled enough to scan:
 * network quiet, no full-page Chakra spinners, <main> present.
 *
 * Settling is best-effort — a page stuck on a background-update spinner is
 * still scanned (axe sees what a user sees), so a slow query never turns an
 * a11y spec into a timeout mystery.
 */
async function gotoAndSettle(page, path) {
    await page.goto(path);
    await page.waitForLoadState('networkidle', { timeout: 45_000 }).catch(() => {});
    // Wait for spinners to clear (data views show Spinner while loading).
    await page
        .waitForFunction(
            () => document.querySelectorAll('.chakra-spinner').length === 0,
            { timeout: 30_000 },
        )
        .catch(() => {});
    await page.locator('main, #root').first().waitFor({ state: 'visible', timeout: 10_000 });
}

module.exports = { gotoAndSettle };
