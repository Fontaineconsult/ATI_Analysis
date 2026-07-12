/**
 * RTL smoke test for IndicatorReportView — PR1 correctness pass.
 *
 * Focus: the link-resolution fix (uploaded files link via file.download_url) and the
 * previously-dropped data that PR1 now renders (implementation messages, admin_review_notes
 * with author, admin_review_completed_by, participation notes, TAAP signatories/notes).
 *
 * `status` is null in the fixture so the (still-present) EvidenceQualityPanel right rail —
 * which needs StatusLevelContext — isn't rendered; PR2 removes it. axios is neutralized via
 * the inline factory (CLAUDE.md) so transitive service imports load.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
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
    },
    year: '2025-2026',
    campus: { abbreviation: 'sfsu', name: 'San Francisco State University' },
    status: null, // keep EvidenceQualityPanel (needs StatusLevelContext) out of this test
    yse: {
        administrative_review_complete: true,
        administrative_review_completed_date: '2026-03-01',
        admin_review_description: 'Reviewed against the rubric.',
    },
    people: {
        implementers: [{ unique_id: 'p1', name: 'Ivy Implementer', title: 'Web Lead', roles: [{ handle: 'role:lead', name: 'Lead' }] }],
        admin_reviewers: [{ unique_id: 'r1', name: 'Rob Reviewer' }],
        admin_review_completed_by: { unique_id: 'r2', name: 'Reviewer Rita' },
    },
    admin_review_notes: [
        { unique_id: 'an1', content: 'Needs more evidence next year.', dateCreated: '2026-02-01', created_by: { unique_id: 'a1', name: 'Ann Admin' } },
    ],
    implementations: [
        {
            type: 'Process',
            unique_id: 'i1',
            title: 'Homepage audit process',
            description: 'Quarterly audit.',
            owner: { name: 'Owen Owner' },
            accountable_working_group: 'Web',
            dimensions: [],
            documents: [
                // Uploaded (managed) file: link lives ONLY at file.download_url — the bug fix.
                { unique_id: 'd1', name: 'Audit Report', file: { download_url: '/ati/data-api/v1/files/abc?name=audit.pdf' }, file_path: null, uri_path: null },
            ],
            webpages: [
                { unique_id: 'w1', name: 'Old audit page', url: 'https://example.invalid/old', no_longer_exists: true },
            ],
            notes: [],
            messages: [
                { unique_id: 'm1', content: 'Kickoff email to the team', date_created: '2026-01-05', file: { download_url: '/ati/data-api/v1/files/msg1?name=email.eml' } },
            ],
            metrics: [],
            participants: [
                { person: { unique_id: 'p2', name: 'Pat Participant' }, role_handle: 'role:auditor', note: 'ran the manual pass' },
            ],
            remediates_interfaces: [],
        },
    ],
    taaps: [
        {
            unique_id: 't1',
            title: 'Interim access plan',
            owner: { name: 'Tia Owner' },
            signed_by: [{ unique_id: 's1', name: 'Sam Signer' }],
            covers_assets: [],
            documents: [],
            webpages: [],
            notes: [{ unique_id: 'tn1', content: 'Signed off by the committee.', dateCreated: '2026-01-10' }],
            messages: [],
        },
    ],
    assets: [], interfaces: [], tools: [], vendors: [],
    plans: [], accomplishments: [],
    notes: [],
    messages: [
        { unique_id: 'ym1', content: 'Year-level status message', date_created: '2026-04-01', file: { download_url: '/ati/data-api/v1/files/yse1?name=y.pdf' } },
    ],
    metrics: [],
};

const renderReport = (report = REPORT) => render(
    <ChakraProvider>
        <MemoryRouter>
            <IndicatorReportView report={report} />
        </MemoryRouter>
    </ChakraProvider>,
);

describe('IndicatorReportView (PR1 correctness)', () => {
    it('resolves an uploaded document to its file.download_url (the link bug fix)', () => {
        renderReport();
        const link = screen.getByRole('link', { name: /Audit Report/ });
        expect(link).toHaveAttribute('href', '/ati/data-api/v1/files/abc?name=audit.pdf');
    });

    it('renders a no-longer-existing webpage as text, never as an anchor', () => {
        renderReport();
        expect(screen.getByText(/Old audit page/)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Old audit page/ })).not.toBeInTheDocument();
    });

    it('renders implementation-level messages with their attachment link', () => {
        renderReport();
        expect(screen.getByText(/Kickoff email to the team/)).toBeInTheDocument();
        const attachments = screen.getAllByRole('link', { name: /attachment/i });
        expect(attachments.some((a) => a.getAttribute('href') === '/ati/data-api/v1/files/msg1?name=email.eml')).toBe(true);
    });

    it('renders admin_review_notes with author and the completed-by reviewer', () => {
        renderReport();
        expect(screen.getByText(/Needs more evidence next year\./)).toBeInTheDocument();
        expect(screen.getByText(/Ann Admin/)).toBeInTheDocument();
        expect(screen.getByText(/by Reviewer Rita/)).toBeInTheDocument();
    });

    it('renders participation notes under the implementation team', () => {
        renderReport();
        expect(screen.getByText(/ran the manual pass/)).toBeInTheDocument();
    });

    it('renders TAAP signatories and notes', () => {
        renderReport();
        expect(screen.getByText(/Signed: Sam Signer/)).toBeInTheDocument();
        expect(screen.getByText(/Signed off by the committee\./)).toBeInTheDocument();
    });

    it('renders YSE-level messages with their attachment link', () => {
        renderReport();
        expect(screen.getByText(/Year-level status message/)).toBeInTheDocument();
        const attachments = screen.getAllByRole('link', { name: /attachment/i });
        expect(attachments.some((a) => a.getAttribute('href') === '/ati/data-api/v1/files/yse1?name=y.pdf')).toBe(true);
    });
});
