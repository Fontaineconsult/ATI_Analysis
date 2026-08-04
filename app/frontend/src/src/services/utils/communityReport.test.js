import { buildCommunityReport } from './communityReport';

const DETAIL = {
    name: 'Library',
    description: 'Cross-campus library folk & friends',
    members: [
        { unique_id: 'p1', name: 'Christy Stevens', title: 'Dean, J. Paul Leonard Library', host_campus: 'sfsu', note: 'dean' },
        { unique_id: 'p2', name: 'Kristin Hart', title: 'Librarian', host_campus: 'csueb', note: null },
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
        // Campuses from the roster, uppercased, in the subtitle.
        expect(html).toContain('CSUEB, SFSU');
        expect(plainText).toContain('MEMBERS (2)');
        expect(plainText).toContain('  - 7.11-ins: Library assets <lifecycle> — own ground');
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
