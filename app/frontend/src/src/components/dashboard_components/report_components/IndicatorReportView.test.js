/**
 * RTL tests for IndicatorReportView — the flat single-column evidence report.
 *
 * Covers the PR1 correctness pass (link resolution + previously-dropped data) and the PR2
 * redesign (prev→current pills, workflow chips, mailto, typed artifact tags, override-exempt
 * state, Print, and always-render-every-section). axios is neutralized via the inline factory.
 * No StatusLevelProvider is supplied, so the inline maturity rubric degrades to nothing.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

import IndicatorReportView from './IndicatorReportView';

const REPORT = {
    indicator: {
        composite_key: '1.2-web',
        goal_number: 1,
        goal_name: 'Accessible web presence',
        success_indicator: 'Top pages meet WCAG 2.1 AA.',
        working_group: 'Web',
        override_implementation_requirement: false,
    },
    year: '2025-2026',
    campus: { abbreviation: 'sfsu', name: 'San Francisco State University' },
    status: { status_level: 'Defined', previous_status_level: 'Initiated' },
    yse: {
        administrative_review_complete: true,
        administrative_review_completed_date: '2026-03-01',
        admin_review_description: 'Reviewed against the rubric.',
        priority_level: 'High',
        documentation_status: 'in_progress',
        worked_on_in_current_year: true,
        will_work_on_next_year: true,
        ready_for_admin_review: true,
    },
    people: {
        implementers: [{ unique_id: 'p1', name: 'Ivy Implementer', title: 'Web Lead', email: 'ivy@example.edu', roles: [{ handle: 'role:lead', name: 'Lead' }] }],
        admin_reviewers: [{ unique_id: 'r1', name: 'Rob Reviewer' }],
        admin_review_completed_by: { unique_id: 'r2', name: 'Reviewer Rita' },
    },
    admin_review_notes: [
        { unique_id: 'an1', content: 'Needs more evidence next year.', dateCreated: '2026-02-01', created_by: { unique_id: 'a1', name: 'Ann Admin' } },
    ],
    implementations: [
        {
            type: 'Process', unique_id: 'i1', title: 'Homepage audit process', description: 'Quarterly audit.',
            owner: { name: 'Owen Owner' }, accountable_working_group: 'Web', dimensions: [],
            documents: [{ unique_id: 'd1', name: 'Audit Report', file: { download_url: '/ati/data-api/v1/files/abc?name=audit.pdf', size: 2048, uploaded_date: '2026-01-02' }, file_path: null, uri_path: null }],
            webpages: [{ unique_id: 'w1', name: 'Old audit page', url: 'https://example.invalid/old', no_longer_exists: true }],
            notes: [],
            messages: [{ unique_id: 'm1', content: 'Kickoff email to the team', date_created: '2026-01-05', file: { download_url: '/ati/data-api/v1/files/msg1?name=email.eml' } }],
            metrics: [],
            participants: [{ person: { unique_id: 'p2', name: 'Pat Participant' }, role_handle: 'role:auditor', note: 'ran the manual pass' }],
            remediates_interfaces: [],
        },
    ],
    taaps: [
        {
            unique_id: 't1', title: 'Interim access plan', owner: { name: 'Tia Owner' },
            signed_by: [{ unique_id: 's1', name: 'Sam Signer' }], covers_assets: [],
            documents: [], webpages: [],
            notes: [{ unique_id: 'tn1', content: 'Signed off by the committee.', dateCreated: '2026-01-10' }],
            messages: [],
        },
    ],
    assets: [], interfaces: [],
    tools: [{ unique_id: 'tool1', title: 'Pope Tech', tool_identifier: 'pope-tech' }],
    vendors: [{ unique_id: 'v1', name: 'Acme Accessibility', sales_contact_email: 'sales@acme.test' }],
    plans: [{ unique_id: 'pl1', name: 'Remediation plan', plan_status: 'In Progress', is_key_plan: true }],
    accomplishments: [],
    notes: [],
    messages: [{ unique_id: 'ym1', content: 'Year-level status message', date_created: '2026-04-01', file: { download_url: '/ati/data-api/v1/files/yse1?name=y.pdf' } }],
    metrics: [],
};

const renderReport = (report = REPORT) => render(
    <ChakraProvider>
        <MemoryRouter>
            <IndicatorReportView report={report} />
        </MemoryRouter>
    </ChakraProvider>,
);

describe('IndicatorReportView — link resolution & dropped data (PR1)', () => {
    it('resolves an uploaded document to its file.download_url (the link bug fix)', () => {
        renderReport();
        expect(screen.getByRole('link', { name: /Audit Report/ })).toHaveAttribute('href', '/ati/data-api/v1/files/abc?name=audit.pdf');
    });

    it('renders a no-longer-existing webpage as text, never as an anchor', () => {
        renderReport();
        expect(screen.getByText(/Old audit page/)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Old audit page/ })).not.toBeInTheDocument();
    });

    it('renders implementation and YSE messages with their attachment links', () => {
        renderReport();
        expect(screen.getByText(/Kickoff email to the team/)).toBeInTheDocument();
        expect(screen.getByText(/Year-level status message/)).toBeInTheDocument();
        const hrefs = screen.getAllByRole('link', { name: /attachment/i }).map((a) => a.getAttribute('href'));
        expect(hrefs).toEqual(expect.arrayContaining(['/ati/data-api/v1/files/msg1?name=email.eml', '/ati/data-api/v1/files/yse1?name=y.pdf']));
    });

    it('renders admin_review_notes with author, the completed-by reviewer, and participation notes', () => {
        renderReport();
        expect(screen.getByText(/Needs more evidence next year\./)).toBeInTheDocument();
        expect(screen.getByText(/Ann Admin/)).toBeInTheDocument();
        expect(screen.getByText(/by Reviewer Rita/)).toBeInTheDocument();
        expect(screen.getByText(/ran the manual pass/)).toBeInTheDocument();
    });

    it('renders TAAP signatories and notes', () => {
        renderReport();
        expect(screen.getByText(/Signed: Sam Signer/)).toBeInTheDocument();
        expect(screen.getByText(/Signed off by the committee\./)).toBeInTheDocument();
    });
});

describe('IndicatorReportView — flat redesign (PR2)', () => {
    it('shows the maturity gradation ladder at the current level, plus year-over-year pills', () => {
        renderReport();
        // Full ladder (Not Started → … → Optimizing) with the current rung in its aria-label.
        expect(screen.getByRole('img', { name: /Maturity: Defined \(level \d of \d\)/i })).toBeInTheDocument();
        // Every rung label renders; the previous level appears (ladder rung + YoY pill).
        expect(screen.getByText('Not Started')).toBeInTheDocument();
        expect(screen.getByText('Optimizing')).toBeInTheDocument();
        expect(screen.getByText(/Year over year/i)).toBeInTheDocument();
        expect(screen.getAllByText('Initiated').length).toBeGreaterThanOrEqual(2);
    });

    it('renders the YSE workflow chips', () => {
        renderReport();
        expect(screen.getByText(/Priority: High/)).toBeInTheDocument();
        expect(screen.getByText(/Worked on this year/)).toBeInTheDocument();
        expect(screen.getByText(/Continuing next year/)).toBeInTheDocument();
        expect(screen.getByText(/Ready for admin review/)).toBeInTheDocument();
        expect(screen.getByText(/Docs: in_progress/)).toBeInTheDocument();
    });

    it('renders person and vendor emails as mailto links', () => {
        renderReport();
        expect(screen.getByRole('link', { name: 'ivy@example.edu' })).toHaveAttribute('href', 'mailto:ivy@example.edu');
        expect(screen.getByRole('link', { name: /sales@acme.test/ })).toHaveAttribute('href', 'mailto:sales@acme.test');
    });

    it('renders the tool identifier in the ICT footprint', () => {
        renderReport();
        expect(screen.getByText('Pope Tech')).toBeInTheDocument();
        expect(screen.getByText('pope-tech')).toBeInTheDocument();
    });

    it('labels the uploaded document with a FILE artifact tag', () => {
        renderReport();
        expect(screen.getByText('FILE')).toBeInTheDocument();
        expect(screen.getByText('GONE')).toBeInTheDocument();
    });

    it('fires window.print from the Print report button', async () => {
        const printSpy = jest.fn();
        window.print = printSpy;
        renderReport();
        await userEvent.click(screen.getByRole('button', { name: /print report/i }));
        expect(printSpy).toHaveBeenCalled();
    });

    it('shows the exempt empty state when implementation evidence is overridden', () => {
        renderReport({
            ...REPORT,
            implementations: [],
            indicator: { ...REPORT.indicator, override_implementation_requirement: true },
        });
        expect(screen.getByText(/exempt from implementation evidence/i)).toBeInTheDocument();
    });

    it('renders every section with an empty state when the report has no data', () => {
        const EMPTY = {
            indicator: REPORT.indicator, year: '2025-2026', campus: REPORT.campus,
            status: null, yse: {},
            people: { implementers: [] },
            implementations: [], taaps: [], assets: [], interfaces: [], tools: [], vendors: [],
            plans: [], accomplishments: [], notes: [], messages: [], metrics: [], admin_review_notes: [],
        };
        renderReport(EMPTY);
        [
            'Status & Administrative Review', 'People', 'Implementation Evidence',
            'ICT Footprint', 'Temporary Alternate Access Plans', 'Plans & Accomplishments',
            'Notes, Messages & Metrics',
        ].forEach((title) => {
            expect(screen.getByRole('heading', { name: new RegExp(title, 'i') })).toBeInTheDocument();
        });
        // ICT / TAAP / Plans / Notes all show the shared empty copy.
        expect(screen.getAllByText(/None recorded for this year\./).length).toBeGreaterThanOrEqual(3);
    });
});

describe('IndicatorReportView — Companion Guide', () => {
    const withCompanion = (overrides) => ({
        ...REPORT,
        indicator: { ...REPORT.indicator, ...overrides },
    });

    it('renders the Companion Guide with examples of evidence and the established-level example', () => {
        renderReport(withCompanion({
            examples_of_evidence: ['A documented adoption workflow', 'Training materials for faculty'],
            established_example: 'At the Established level, the campus operationalizes the process.',
            managed_example: null,
            optimizing_example: null,
        }));
        expect(screen.getByRole('heading', { name: /Companion Guide/i })).toBeInTheDocument();
        expect(screen.getByText('A documented adoption workflow')).toBeInTheDocument();
        expect(screen.getByText('Training materials for faculty')).toBeInTheDocument();
        expect(screen.getByText(/operationalizes the process/i)).toBeInTheDocument();
    });

    it('omits the Companion Guide when the indicator has no companion content', () => {
        renderReport(withCompanion({
            examples_of_evidence: [],
            established_example: null,
            managed_example: null,
            optimizing_example: null,
        }));
        expect(screen.queryByRole('heading', { name: /Companion Guide/i })).not.toBeInTheDocument();
    });
});
