import { buildReadyForReviewReport } from './readyForReviewReport';

// One indicator wrapper in the compound-query shape getIndicatorSummary reads.
const ind = (ck, text, { status, ready = false, complete = false, reviewers = [], summary } = {}) => ({
    indicator: { properties: { composite_key: ck, success_indicator: text } },
    evidences: [{
        evidence: { properties: {
            year_identifier: `2025-2026-${ck}-csueb`,
            ready_for_admin_review: ready,
            administrative_review_complete: complete,
            ...(summary !== undefined ? { admin_review_description: summary } : {}),
        } },
        statusLevel: status ? { properties: { status_level: status } } : undefined,
        adminReviewers: reviewers,
    }],
});

const wgData = {
    workingGroup: 'Instructional Materials',
    goals: [
        { goal: { properties: { goal_number: 6 } }, indicators: [
            ind('6.9-ins', 'Develop EEAAPs <LTI>', { status: 'Defined', ready: true,
                summary: 'Plans cover <three> LTIs.\n\nIt sits at Defined.' }),
            ind('6.5-ins', 'Course redesign', { status: 'Defined', ready: false }),
            ind('6.7-ins', 'Scheduled evaluation', { status: 'Defined', ready: true, complete: true }),
        ] },
        { goal: { properties: { goal_number: 1 } }, indicators: [
            ind('1.6-ins', 'Adoption reports', { status: 'Initiated', ready: true }),
            ind('1.2-ins', 'Adoption process', { ready: true, summary: 'No Review' }),
        ] },
    ],
};

const opts = { campus: 'csueb', slug: 'instructional-materials', name: 'Instructional Materials', year: '2025-2026', origin: 'http://localhost:3000' };

describe('buildReadyForReviewReport', () => {
    it('lists only indicators marked ready and not yet approved, in goal then indicator order', () => {
        const { plainText, rowCount } = buildReadyForReviewReport(wgData, opts);
        expect(rowCount).toBe(3);
        const order = ['1.2-ins', '1.6-ins', '6.9-ins'].map((k) => plainText.indexOf(`\n${k} `));
        expect(order.every((i) => i > 0)).toBe(true);
        expect(order).toEqual([...order].sort((a, b) => a - b));
        expect(plainText).not.toContain('6.5-ins');
        expect(plainText).not.toContain('6.7-ins');
    });

    it('carries status and the review page URL for each row', () => {
        const { html, plainText } = buildReadyForReviewReport(wgData, opts);
        expect(plainText).toContain('Status: Initiated');
        expect(plainText).toContain('Status: No status');
        expect(plainText).toContain('Review: http://localhost:3000/ati/csueb/dashboard/reports/approve/instructional-materials/6/9?focus=review');
        expect(html).toContain('href="http://localhost:3000/ati/csueb/dashboard/reports/approve/instructional-materials/1/6?focus=review"');
        expect(html).toContain('Instructional Materials indicators ready for review · CSUEB · 2025-2026');
    });

    it('carries the Evidence Summary, with a placeholder when there is none', () => {
        const { html, plainText } = buildReadyForReviewReport(wgData, opts);
        expect(html).toContain('>Evidence Summary</th>');
        // escaped, with line breaks kept in the HTML and flattened in plain text
        expect(html).toContain('Plans cover &lt;three&gt; LTIs.<br/><br/>It sits at Defined.');
        expect(plainText).toContain('Evidence Summary: Plans cover <three> LTIs. It sits at Defined.');
        // 1.6-ins has no summary; 1.2-ins carries the approval page's 'No Review' seed
        expect(plainText.match(/Evidence Summary: No summary yet/g)).toHaveLength(2);
        expect(html).not.toContain('No Review');
    });

    it('escapes interpolated content', () => {
        const { html } = buildReadyForReviewReport(wgData, opts);
        expect(html).toContain('Develop EEAAPs &lt;LTI&gt;');
        expect(html).not.toContain('<LTI>');
    });

    it('treats an approval by a reviewer as approved', () => {
        const data = { goals: [{ indicators: [ind('9.2-ins', 'Plan review', { ready: true, reviewers: [{}] })] }] };
        expect(buildReadyForReviewReport(data, opts).rowCount).toBe(0);
    });

    it('returns zero rows for a missing working group', () => {
        expect(buildReadyForReviewReport(undefined, opts).rowCount).toBe(0);
    });
});
