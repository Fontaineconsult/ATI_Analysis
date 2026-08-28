import { buildCommunityReport, buildCommunityStakesReport } from './communityReport';

const DETAIL = {
    name: 'Library',
    description: 'Cross-campus library folk & friends',
    members: [
        // Home-fallback member: no explicit scope, effective = home.
        { unique_id: 'p1', name: 'Christy Stevens', title: 'Dean, J. Paul Leonard Library', host_campus: 'sfsu', campuses: [], active_campuses: ['sfsu'], note: 'dean' },
        // Explicitly scoped member, active at two campuses.
        { unique_id: 'p2', name: 'Kristin Hart', title: 'Librarian', host_campus: 'csueb', campuses: ['csueb', 'ssu'], active_campuses: ['csueb', 'ssu'], note: null },
    ],
    stakes: [
        { composite_key: '7.11-ins', success_indicator: 'Library assets <lifecycle>', note: 'own ground' },
    ],
};

describe('buildCommunityReport', () => {
    it('renders both tables with rowCount = members + stakes', () => {
        const { html, plainText, rowCount } = buildCommunityReport(DETAIL);
        expect(rowCount).toBe(3);
        expect(html).toContain('Christy Stevens');
        expect(html).toContain('7.11-ins');
        expect(html).toContain('Members (2)');
        expect(html).toContain('Indicator stakes (1)');
        // Subtitle = union of members' EFFECTIVE campuses, uppercased, sorted.
        expect(html).toContain('CSUEB, SFSU, SSU');
        // The scoped member's Campus cell joins her whole scope.
        expect(html).toContain('CSUEB, SSU');
        expect(plainText).toContain('MEMBERS (2)');
        expect(plainText).toContain('Kristin Hart — Librarian (CSUEB, SSU)');
        expect(plainText).toContain('  - 7.11-ins: Library assets <lifecycle> — own ground');
    });

    it('falls back to host_campus for pre-scoping payload shapes', () => {
        const { html } = buildCommunityReport({
            name: 'Legacy',
            members: [{ unique_id: 'p9', name: 'Old Payload', host_campus: 'sfsu', note: null }],
            stakes: [],
        });
        expect(html).toContain('SFSU');
    });

    it('HTML-escapes interpolated content', () => {
        const { html } = buildCommunityReport(DETAIL);
        expect(html).toContain('Library assets &lt;lifecycle&gt;');
        expect(html).not.toContain('Library assets <lifecycle>');
        expect(html).toContain('Cross-campus library folk &amp; friends');
    });

    it('is Outlook-safe: table layout, no style blocks or classes', () => {
        const { html } = buildCommunityReport(DETAIL);
        expect(html).toContain('<table cellpadding="0" cellspacing="0"');
        expect(html).toContain('bgcolor=');
        expect(html).not.toContain('<style');
        expect(html).not.toContain('class=');
    });

    it('handles an empty community with rowCount 0 and placeholder prose', () => {
        const { html, rowCount } = buildCommunityReport({ name: 'Empty', members: [], stakes: [] });
        expect(rowCount).toBe(0);
        expect(html).toContain('No members recorded yet.');
        expect(html).toContain('No indicator stakes recorded yet.');
    });

    it('tolerates a null detail', () => {
        expect(buildCommunityReport(null).rowCount).toBe(0);
    });
});


describe('buildCommunityStakesReport', () => {
    it('renders the stakes table only, with the review-spread link line', () => {
        const { html, plainText, rowCount } = buildCommunityStakesReport(DETAIL, {
            reviewSpreadUrl: 'https://example.edu/ati/reports/public/community/sfsu/2025-2026/abc',
        });
        expect(rowCount).toBe(1);
        expect(html).toContain('Indicator stakes (1)');
        expect(html).toContain('7.11-ins');
        expect(html).toContain('Library assets &lt;lifecycle&gt;');
        expect(html).toContain('href="https://example.edu/ati/reports/public/community/sfsu/2025-2026/abc"');
        // Stakes only — no member roster.
        expect(html).not.toContain('Members (');
        expect(html).not.toContain('Christy Stevens');
        expect(plainText).toContain('INDICATOR STAKES (1)');
        expect(plainText).toContain('Live review spread: https://example.edu/ati/reports/public/community/sfsu/2025-2026/abc');
        expect(plainText).not.toContain('MEMBERS');
    });

    it('omits the link line without a URL and stays Outlook-safe', () => {
        const { html } = buildCommunityStakesReport(DETAIL);
        expect(html).not.toContain('Live review spread');
        expect(html).toContain('<table cellpadding="0" cellspacing="0"');
        expect(html).toContain('bgcolor=');
        expect(html).not.toContain('<style');
    });

    it('reports rowCount 0 for a stakeless community', () => {
        const { rowCount, html } = buildCommunityStakesReport({ name: 'Empty', stakes: [] });
        expect(rowCount).toBe(0);
        expect(html).toContain('No indicator stakes recorded yet.');
    });
});
