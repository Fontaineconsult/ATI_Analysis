// Shared axe fixture (Playwright's recommended pattern): specs import `test`
// and `expect` from here and call `makeAxeBuilder()` for a consistently
// configured scanner.
//
// Rule set: WCAG 2.0/2.1 A + AA — the bar the ATI itself holds campuses to
// (Section 508 / WCAG 2.1 AA). Best-practice rules are excluded so failures
// always map to a normative requirement; add 'best-practice' locally when
// hunting for polish items.
const base = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// Deep mode: AXE_EXTRA_TAGS=best-practice npx playwright test …
// adds axe's best-practice rules (heading-order, landmark uniqueness, region)
// — the layer where WAVE-style "alerts" live beyond the WCAG A/AA errors.
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'].concat(
    process.env.AXE_EXTRA_TAGS ? process.env.AXE_EXTRA_TAGS.split(',') : [],
);

const test = base.test.extend({
    makeAxeBuilder: async ({ page }, use) => {
        const makeAxeBuilder = () =>
            new AxeBuilder({ page })
                .withTags(AXE_TAGS)
                // CRA dev-only overlay iframe — not part of the app.
                .exclude('#webpack-dev-server-client-overlay');
        await use(makeAxeBuilder);
    },
});

module.exports = { test, expect: base.expect, AXE_TAGS };
