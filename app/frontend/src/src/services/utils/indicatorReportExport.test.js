/**
 * Unit tests for the single-indicator report export builder (pure). Verifies the HTML + plain
 * text carry the report's information as copy-pasteable tables with resolved links.
 */
import { buildIndicatorReport } from './indicatorReportExport';

const ORIGIN = 'https://ati.example';

const REPORT = {
    indicator: { composite_key: '1.2-web', goal_number: 1, goal_name: 'Accessible web presence', success_indicator: 'Top pages meet WCAG 2.1 AA.', working_group: 'Web', override_implementation_requirement: false },
    year: '2025-2026',
    campus: { abbreviation: 'sfsu', name: 'San Francisco State University' },
    status: { status_level: 'Defined', previous_status_level: 'Initiated' },
    yse: { administrative_review_complete: true, administrative_review_completed_date: '2026-03-01', priority_level: 'High', worked_on_in_current_year: true },
    people: {
        implementers: [{ unique_id: 'p1', name: 'Ivy Implementer', title: 'Web Lead', email: 'ivy@example.edu', roles: [{ handle: 'role:lead', name: 'Lead' }] }],
        admin_reviewers: [{ unique_id: 'r1', name: 'Rob Reviewer' }],
        admin_review_completed_by: { unique_id: 'r2', name: 'Reviewer Rita' },
    },
    admin_review_notes: [{ unique_id: 'an1', content: 'Needs more evidence.', dateCreated: '2026-02-01', created_by: { name: 'Ann Admin' } }],
    implementations: [{
        type: 'Process', unique_id: 'i1', title: 'Homepage audit', description: 'Quarterly audit.',
        owner: { name: 'Owen Owner' }, accountable_working_group: 'Web', dimensions: [],
        documents: [{ unique_id: 'd1', name: 'Audit Report', file: { download_url: '/ati/data-api/v1/files/abc?name=audit.pdf' } }],
        webpages: [{ unique_id: 'w1', name: 'Old page', url: 'https://x.invalid', no_longer_exists: true }],
        notes: [], messages: [{ unique_id: 'm1', content: 'Kickoff', date_created: '2026-01-05', file: { download_url: '/ati/data-api/v1/files/msg1' } }],
        metrics: [], participants: [{ person: { name: 'Pat Participant' }, role_handle: 'role:auditor', note: 'manual pass' }], remediates_interfaces: [],
    }],
    taaps: [{ unique_id: 't1', title: 'Interim access', owner: { name: 'Tia' }, signed_by: [{ unique_id: 's1', name: 'Sam Signer' }], covers_assets: [], documents: [], webpages: [], notes: [], messages: [] }],
    assets: [], interfaces: [],
    tools: [{ unique_id: 'tool1', title: 'Pope Tech', tool_identifier: 'pope-tech' }],
    vendors: [{ unique_id: 'v1', name: 'Acme', sales_contact_email: 'sales@acme.test' }],
    plans: [{ unique_id: 'pl1', name: 'Remediation plan', plan_status: 'In Progress', is_key_plan: true }],
    accomplishments: [],
    notes: [], messages: [], metrics: [],
};

describe('buildIndicatorReport', () => {
    const { html, plainText } = buildIndicatorReport(REPORT, { origin: ORIGIN });

    it('produces an HTML table document with the indicator identity', () => {
        expect(html).toContain('<table');
        expect(html).toContain('1.2-web');
        expect(html).toContain('Top pages meet WCAG 2.1 AA.');
    });

    it('resolves uploaded documents to an absolute download URL', () => {
        expect(html).toContain(`${ORIGIN}/ati/data-api/v1/files/abc?name=audit.pdf`);
        expect(html).toContain('FILE');
    });

    it('links people and vendor emails as mailto', () => {
        expect(html).toContain('mailto:ivy@example.edu');
        expect(html).toContain('mailto:sales@acme.test');
    });

    it('carries the prev→current status, chips, and admin review', () => {
        expect(html).toContain('Initiated');
        expect(html).toContain('Defined');
        expect(html).toContain('Priority');
        expect(html).toContain('Reviewer Rita');
        expect(html).toContain('Needs more evidence.');
    });

    it('includes implementations (with deep link), ICT tools, TAAP signatories, and plans', () => {
        expect(html).toContain(`${ORIGIN}/ati/sfsu/ati-explorer/implementations/Process/i1`);
        expect(html).toContain('pope-tech');
        expect(html).toContain('Sam Signer');
        expect(html).toContain('Remediation plan');
    });

    it('marks a no-longer-existing webpage as GONE, not a link', () => {
        expect(html).toContain('GONE');
        expect(html).not.toContain('href="https://x.invalid"');
    });

    it('produces a plain-text fallback with the same sections', () => {
        expect(plainText).toContain('1.2-web');
        expect(plainText).toContain('IMPLEMENTATION EVIDENCE');
        expect(plainText).toContain('ivy@example.edu');
        expect(plainText).toContain('Pope Tech');
    });

    it('returns empty strings for a missing report', () => {
        expect(buildIndicatorReport(null)).toEqual({ html: '', plainText: '' });
    });
});

describe('buildIndicatorReport — retired implementations', () => {
    const retiredReport = {
        ...REPORT,
        implementations: [{
            ...REPORT.implementations[0],
            retired: true,
            retired_date: '2026-06-30',
        }],
    };
    const { html, plainText } = buildIndicatorReport(retiredReport, { origin: ORIGIN });

    it('flags retired implementations in the HTML export', () => {
        expect(html).toContain('RETIRED 2026-06-30');
    });

    it('flags retired implementations in the plain-text export', () => {
        expect(plainText).toContain('(RETIRED 2026-06-30)');
    });
});

describe('buildIndicatorReport — evidence strength', () => {
    const ratedReport = {
        ...REPORT,
        implementations: [{ ...REPORT.implementations[0], strength: 2 }],
    };
    const { html, plainText } = buildIndicatorReport(ratedReport, { origin: ORIGIN });

    it('flags the strength in the HTML export', () => {
        expect(html).toContain('STRENGTH 2 — Partial');
    });

    it('flags the strength in the plain-text export', () => {
        expect(plainText).toContain('[Strength 2 — Partial]');
    });

    it('omits the strength tag for unrated links', () => {
        const { html: h2, plainText: t2 } = buildIndicatorReport(REPORT, { origin: ORIGIN });
        expect(h2).not.toContain('STRENGTH');
        expect(t2).not.toContain('[Strength');
    });
});

describe('buildIndicatorReport — all implementations retired', () => {
    const allRetiredReport = {
        ...REPORT,
        implementations: [{ ...REPORT.implementations[0], retired: true, retired_date: '2026-06-30' }],
    };
    const { html, plainText } = buildIndicatorReport(allRetiredReport, { origin: ORIGIN });

    it('warns in the HTML export when every implementation is retired', () => {
        expect(html).toContain('All implementations linked to this indicator are retired');
    });

    it('warns in the plain-text export when every implementation is retired', () => {
        expect(plainText).toContain('ALL IMPLEMENTATIONS RETIRED');
    });

    it('does not warn when at least one implementation is active', () => {
        const { html: h2, plainText: t2 } = buildIndicatorReport(REPORT, { origin: ORIGIN });
        expect(h2).not.toContain('All implementations linked');
        expect(t2).not.toContain('ALL IMPLEMENTATIONS RETIRED');
    });
});
