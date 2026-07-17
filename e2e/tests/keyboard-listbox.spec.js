// APG Listbox keyboard contracts (second pass, package C) — the behaviors the
// shared useListboxNavigation hook guarantees: single tab stop, arrow-key
// traversal, Enter/Space to select, focus-move ≠ selection.
const { test, expect } = require('../fixtures/axe');
const { gotoAndSettle } = require('../helpers/app');
const { campusPath } = require('../routes');

// Assert the roving-tabindex contract for one listbox: exactly one option is a
// tab stop, ArrowDown moves focus without selecting, Enter selects.
async function assertListboxContract(page, listbox) {
    const options = listbox.getByRole('option');
    const count = await options.count();
    test.skip(count < 2, 'needs at least two options to exercise traversal');

    // Exactly one option in the tab order.
    const tabStops = await options.evaluateAll(
        (els) => els.filter((el) => el.tabIndex === 0).length,
    );
    expect(tabStops).toBe(1);

    // Select the first option by mouse to anchor the state.
    await options.nth(0).click();
    await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');

    // Arrowing moves focus but must NOT change selection.
    await options.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toBeFocused();
    await expect(options.nth(0)).toHaveAttribute('aria-selected', 'true');

    // Enter selects the focused option.
    await page.keyboard.press('Enter');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');

    // Home jumps back to the first option.
    await page.keyboard.press('Home');
    await expect(options.nth(0)).toBeFocused();
}

test.describe('listbox keyboard contracts', () => {
    test('success indicators (goal view)', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/dashboard/web/goal/1'));
        await assertListboxContract(
            page,
            page.getByRole('listbox', { name: 'Success indicators' }),
        );
    });

    test('people (explorer)', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/ati-explorer/people'));
        await assertListboxContract(page, page.getByRole('listbox', { name: 'People' }));
    });

    test('principles (explorer)', async ({ page }) => {
        await gotoAndSettle(page, campusPath('/ati-explorer/principles'));
        await assertListboxContract(page, page.getByRole('listbox', { name: 'Principles' }));
    });
});

test.describe('no mouse-only interactive elements', () => {
    // Everything claiming role="button" must be keyboard-reachable: either a
    // real <button> or tabIndex >= 0. Guards the campus-plan tiles/rows and any
    // future clickable-Box regressions (design-sense §6.1 failure mode 1).
    for (const route of ['/dashboard/campus-plan', '/dashboard/web/goal/1']) {
        test(`role=button elements are focusable on ${route}`, async ({ page }) => {
            await gotoAndSettle(page, campusPath(route));
            const unreachable = await page.$$eval('[role="button"]', (els) =>
                els
                    .filter((el) => el.tagName !== 'BUTTON' && el.tabIndex < 0)
                    .map((el) => el.getAttribute('aria-label') || el.textContent.slice(0, 60)),
            );
            expect(unreachable, `mouse-only role=button elements: ${unreachable.join(' | ')}`).toEqual([]);
        });
    }
});
