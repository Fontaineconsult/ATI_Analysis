/**
 * The approval workspace at /:campus/dashboard/reports/approve/:wg/:goal/:indicator.
 *
 * Ported from ApprovalMasterContainer.test.js when approval stopped being a modal. The
 * approver gating and concern filtering below are the same contracts that file locked —
 * they had to survive the move — plus the decision signals the page added.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
jest.mock('../../../services/api/put', () => ({
    assignApprover: jest.fn(),
    withdrawApproval: jest.fn(),
}));
jest.mock('../../../services/api/get', () => ({
    fetchGoalReport: jest.fn(),
    fetchPrimaryData: jest.fn(),
}));
jest.mock('../../graph_components/indicators/StatusLevelDetails', () => ({ __esModule: true, default: () => null }));
jest.mock('./AdminSummaryForm', () => ({ __esModule: true, default: () => <div data-testid="admin-summary" /> }));
jest.mock('./AdminFeedbackForm', () => ({ __esModule: true, default: () => <div data-testid="admin-feedback" /> }));
jest.mock('../../../context/SettingsContext', () => {
    const ReactLib = require('react');
    return {
        SettingsContext: ReactLib.createContext({ currentAcademicYear: '2025-2026' }),
        useSettings: () => ({ currentWorkingGroup: 'Web' }),
    };
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserContext } from '../../../context/UserContext';
import { DataContext } from '../../../context/DataContext';
import { SettingsContext } from '../../../context/SettingsContext';
import { assignApprover, withdrawApproval } from '../../../services/api/put';
import { fetchPrimaryData } from '../../../services/api/get';
import ApprovalPage from './ApprovalPage';

const YID = '2025-2026-1.19-web-ssu';

const evidence = (overrides = {}, extra = {}) => ({
    evidence: {
        properties: {
            year_identifier: YID,
            administrative_review_complete: false,
            ready_for_admin_review: true,
            admin_review_description: '',
            ...overrides,
        },
    },
    statusLevel: { properties: {} },
    adminReviewNotes: [],
    ...extra,
});

// Shaped as the working-group payload the page fetches.
const dataFor = (ev) => ({
    web: {
        goals: [{
            goal: { properties: { goal_number: 1 } },
            indicators: [{
                indicator: { properties: { composite_key: '1.19-web' } },
                evidences: [ev],
            }],
        }],
    },
});

const REPORT = {
    indicator: { success_indicator: 'Publish accessibility statements.' },
    implementations: [
        { unique_id: 'i1', title: 'Statement', type: 'Guidance', strength: 2, retired: false },
        { unique_id: 'i2', title: 'Routing', type: 'Process', strength: null, retired: false },
    ],
    evidence_coverage: {
        summary: { total: 4, satisfied: 2, scored_total: 2, scored_satisfied: 0 },
        requirements: [
            {
                handle: 'evidence:1.19-web:established:1', level: 'established', seq: 1,
                element: 'Position', requirement: 'Responsibility is formally assigned.',
                satisfied: true, implementation_evidenced: false,
                satisfied_by: [{ title: 'Statement', type: 'Guidance', unique_id: 'i1', strength: 2, rationale: 'Routes users to support.', retired: false }],
            },
            {
                handle: 'evidence:1.19-web:established:2', level: 'established', seq: 2,
                element: 'Budget', requirement: 'Allocations exist for staff time.',
                satisfied: false, implementation_evidenced: false, satisfied_by: [],
            },
            {
                handle: 'evidence:1.19-web:established:3', level: 'established', seq: 3,
                element: 'Procedures', requirement: 'A documented procedure exists.',
                satisfied: false, implementation_evidenced: true, satisfied_by: [],
            },
            {
                handle: 'evidence:1.19-web:established:4', level: 'established', seq: 4,
                element: 'Output', requirement: 'A collection is maintained.',
                satisfied: false, implementation_evidenced: true, satisfied_by: [],
            },
        ],
    },
};

// Overrides let a test express arriving cold (no working-group data) or with an empty
// report cache — the two states the happy-path harness cannot reach.
const renderPage = (user, ev = evidence(), report = REPORT, overrides = {}) => {
    // The page fetches its own working-group payload for the campus in the URL rather than
    // reading DataContext, so the harness resolves that fetch instead of seeding context.
    const { wgPayload, ...ctx } = overrides;
    fetchPrimaryData.mockResolvedValue({ data: wgPayload === undefined ? dataFor(ev).web : wgPayload });
    return render(
    <ChakraProvider>
        <SettingsContext.Provider value={{ currentAcademicYear: '2025-2026' }}>
            <UserContext.Provider value={{ user }}>
                <DataContext.Provider value={{
                    dataVersion: 1,
                    loadSingleWorkingGroupData: jest.fn(),
                    getCachedReport: () => ({ indicators: { '1.19-web': report } }),
                    getOrFetchReport: jest.fn(),
                    ...ctx,
                }}>
                    <MemoryRouter initialEntries={['/ssu/dashboard/reports/approve/web/1/19']}>
                        <Routes>
                            <Route
                                path="/:campus/dashboard/reports/approve/:workingGroup/:goalNumber/:indicatorNumber"
                                element={<ApprovalPage />}
                            />
                        </Routes>
                    </MemoryRouter>
                </DataContext.Provider>
            </UserContext.Provider>
        </SettingsContext.Provider>
    </ChakraProvider>
    );
};

// The page fetches its own working-group payload, so content is asynchronous. Tests that
// assert on content wait for the sticky action bar, which only renders once loaded.
const renderLoaded = async (...args) => {
    renderPage(...args);
    await screen.findByRole('button', { name: /approve indicator|^approved$/i });
};

const APPROVER = { employee_id: 'e2', name: 'Has Flag', can_approve_yse: true };
const NON_APPROVER = { employee_id: 'e1', name: 'No Flag', can_approve_yse: false };

describe('ApprovalPage — approver gating (ported from the modal)', () => {
    beforeEach(() => { assignApprover.mockReset(); withdrawApproval.mockReset(); });

    it('disables Approve for a user without the Approver flag', async () => {
        await renderLoaded(NON_APPROVER);
        expect(screen.getByRole('button', { name: /approve indicator/i })).toBeDisabled();
    });

    it('enables Approve for a flagged approver and submits as them', async () => {
        assignApprover.mockResolvedValue({ status: 'success' });
        await renderLoaded(APPROVER);

        const button = screen.getByRole('button', { name: /approve indicator/i });
        expect(button).toBeEnabled();
        await userEvent.click(button);
        await waitFor(() => expect(assignApprover).toHaveBeenCalledWith('e2', YID));
    });

    it('shows Approved and stays disabled once the review is complete', async () => {
        await renderLoaded(APPROVER, evidence({ administrative_review_complete: true }));
        expect(screen.getByRole('button', { name: /^approved$/i })).toBeDisabled();
    });

    it('offers Withdraw Approval to a flagged approver on a completed review', async () => {
        withdrawApproval.mockResolvedValue({ status: 'success' });
        await renderLoaded(APPROVER, evidence({ administrative_review_complete: true }));

        await userEvent.click(screen.getByRole('button', { name: /withdraw approval/i }));
        await waitFor(() => expect(withdrawApproval).toHaveBeenCalledWith('e2', YID));
    });

    it('hides Withdraw Approval from non-approvers', async () => {
        await renderLoaded(NON_APPROVER, evidence({ administrative_review_complete: true }));
        expect(screen.queryByRole('button', { name: /withdraw approval/i })).toBeNull();
    });
});

describe('ApprovalPage — concern filtering (ported from the modal)', () => {
    const concern = (unique_id, status, text) => ({
        concern: { properties: { unique_id, status, concern: text } },
        raised_by: null, became_recommendation: null, became_plan: null,
    });

    it('hides converted concerns but keeps open and dismissed ones', async () => {
        await renderLoaded(NON_APPROVER, evidence({}, {
            concerns: [
                concern('c1', 'open', 'No 504 coordinator'),
                concern('c2', 'converted', 'Became a recommendation already'),
                concern('c3', 'dismissed', 'Not an accessibility matter'),
            ],
        }));

        expect(screen.getByText('No 504 coordinator')).toBeInTheDocument();
        expect(screen.queryByText('Became a recommendation already')).toBeNull();
        expect(screen.getByText('Not an accessibility matter')).toBeInTheDocument();
    });
});

describe('ApprovalPage — the evidence itself', () => {
    it('renders the report content, not a summary of it', async () => {
        // An approver decides against the implementations and documentation, so the page
        // has to carry them. Same component the report page uses, so the two cannot drift.
        await renderLoaded(NON_APPROVER);
        expect(screen.getAllByText('Statement').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Routing').length).toBeGreaterThan(0);
    });

    it('still links to the standalone report', async () => {
        await renderLoaded(NON_APPROVER);
        expect(screen.getByRole('link', { name: /open standalone report/i }))
            .toHaveAttribute('href', '/ssu/dashboard/reports/web/1/19');
    });

    it('shows the coverage table once, not twice', async () => {
        // Both the page and the embedded report head their coverage "Companion bar
        // coverage". The report's is suppressed, so exactly one survives — the review-lens
        // one, which is the only version carrying rationale and claim flags.
        await renderLoaded(NON_APPROVER);
        expect(screen.getAllByText('Companion bar coverage')).toHaveLength(1);
    });

    it('carries the review-comment surfaces', async () => {
        await renderLoaded(NON_APPROVER);
        expect(screen.getByTestId('admin-summary')).toBeInTheDocument();
        expect(screen.getByTestId('admin-feedback')).toBeInTheDocument();
    });

    it('leads with the evidence summary', async () => {
        // It is the reviewer own account of the year — what they are here to write, and
        // what another reader wants before anything else.
        await renderLoaded(NON_APPROVER);
        const html = document.body.innerHTML;
        expect(html.indexOf('Evidence summary')).toBeGreaterThan(-1);
        expect(html.indexOf('Evidence summary')).toBeLessThan(html.indexOf('Companion bar coverage'));
    });

    it('shows the level rubric only in the collapsible section', async () => {
        // The report renders the same rubric under "Expected evidence at"; suppressed here
        // so the collapsible Maturity status is the only copy.
        await renderLoaded(NON_APPROVER);
        expect(screen.queryByText(/Expected evidence at/i)).toBeNull();
        expect(screen.getByRole('button', { name: /maturity status/i })).toBeInTheDocument();
    });
});

describe('ApprovalPage — the coverage table', () => {
    it('shows the rationale argued for each claim', async () => {
        await renderLoaded(NON_APPROVER);
        expect(screen.getByText('Routes users to support.')).toBeInTheDocument();
    });

    it('marks a requirement nothing answers as bare', async () => {
        await renderLoaded(NON_APPROVER);
        expect(screen.getAllByText('Bare').length).toBe(2);
    });

    it('leaves an unclaimed Position or Budget requirement uncounted, not bare', async () => {
        // Bare would report a gap against work that was never the right kind of evidence.
        await renderLoaded(NON_APPROVER);
        expect(screen.getByText('Not counted')).toBeInTheDocument();
    });

    it('no longer second-guesses a claim on those elements', async () => {
        // The page used to flag a Position/Budget claim as one to check. Removed — a
        // claimed requirement now simply reads as satisfied.
        await renderLoaded(NON_APPROVER);
        expect(screen.queryByText(/check claim/i)).toBeNull();
        expect(screen.getByText('Satisfied')).toBeInTheDocument();
    });

    it('degrades to a plain message when the indicator has no companion bar', async () => {
        await renderLoaded(NON_APPROVER, evidence(), {
            ...REPORT,
            evidence_coverage: { summary: {}, requirements: [] },
        });
        expect(screen.getByText(/no companion-bar requirements are authored/i)).toBeInTheDocument();
    });
});

describe('ApprovalPage — layout', () => {
    it('hoists plans and accomplishments above the evidence', async () => {
        await renderLoaded(NON_APPROVER);
        const html = document.body.innerHTML;
        expect(html.indexOf('Plans &amp; Accomplishments')).toBeGreaterThan(-1);
        expect(html.indexOf('Plans &amp; Accomplishments')).toBeLessThan(html.indexOf('>Evidence<'));
    });

    it('renders plans once, not once here and again inside the report', async () => {
        await renderLoaded(NON_APPROVER);
        expect(screen.getAllByText('Plans & Accomplishments')).toHaveLength(1);
    });

    it('collapses the maturity rubric behind a disclosure', async () => {
        await renderLoaded(NON_APPROVER);
        const trigger = screen.getByRole('button', { name: /maturity status/i });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
});


describe('ApprovalPage — arriving cold', () => {
    // A linkable page is reachable without visiting anything first: pasted, bookmarked,
    // or after a refresh. The modal it replaced could assume its working group was already
    // loaded, because you could only open it from a page that had loaded it.
    it('fetches the working group for the campus in the URL, not the settings campus', async () => {
        // The report is fetched for the URL campus. Reading the mutable side from context —
        // which follows the settings picker — put two campuses on one page.
        await renderLoaded(NON_APPROVER);
        await waitFor(() =>
            expect(fetchPrimaryData).toHaveBeenCalledWith('web', '2025-2026', 'ssu'));
    });

    it('shows a spinner rather than claiming the evidence does not exist', () => {
        renderPage(NON_APPROVER, evidence(), REPORT, { wgPayload: null });
        expect(screen.getByText(/loading approval workspace/i)).toBeInTheDocument();
        expect(screen.queryByText(/no evidence found/i)).toBeNull();
    });

    it('fetches the report when the cache is empty', async () => {
        const getOrFetchReport = jest.fn().mockResolvedValue({
            indicators: { '1.19-web': REPORT },
        });
        await renderLoaded(NON_APPROVER, evidence(), REPORT, {
            getCachedReport: () => null,
            getOrFetchReport,
        });

        await waitFor(() => expect(getOrFetchReport).toHaveBeenCalled());
        await waitFor(() =>
            expect(screen.getByText('A documented procedure exists.')).toBeInTheDocument());
    });

    it('does not claim the bar is unauthored when the report simply is not there', async () => {
        // A cached goal that lacks this indicator. "No bar was written" and "the report
        // did not load" are different claims, and only the first belongs to the reviewer.
        await renderLoaded(NON_APPROVER, evidence(), REPORT, {
            getCachedReport: () => ({ indicators: {} }),
        });

        expect(screen.getByText(/coverage is unavailable/i)).toBeInTheDocument();
        expect(screen.queryByText(/no companion-bar requirements are authored/i)).toBeNull();
        // The review tools must survive a missing report — they read different data.
        expect(screen.getByTestId('admin-feedback')).toBeInTheDocument();
    });
});
