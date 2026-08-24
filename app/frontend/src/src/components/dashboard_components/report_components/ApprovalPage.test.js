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
jest.mock('../../../services/api/get', () => ({ fetchGoalReport: jest.fn() }));
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

// Shaped as the working-group payload the page reads evidence out of.
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

const renderPage = (user, ev = evidence(), report = REPORT) => render(
    <ChakraProvider>
        <SettingsContext.Provider value={{ currentAcademicYear: '2025-2026' }}>
            <UserContext.Provider value={{ user }}>
                <DataContext.Provider value={{
                    data: dataFor(ev),
                    loadSingleWorkingGroupData: jest.fn(),
                    getCachedReport: () => ({ indicators: { '1.19-web': report } }),
                    getOrFetchReport: jest.fn(),
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

const APPROVER = { employee_id: 'e2', name: 'Has Flag', can_approve_yse: true };
const NON_APPROVER = { employee_id: 'e1', name: 'No Flag', can_approve_yse: false };

describe('ApprovalPage — approver gating (ported from the modal)', () => {
    beforeEach(() => { assignApprover.mockReset(); withdrawApproval.mockReset(); });

    it('disables Approve for a user without the Approver flag', () => {
        renderPage(NON_APPROVER);
        expect(screen.getByRole('button', { name: /approve indicator/i })).toBeDisabled();
    });

    it('enables Approve for a flagged approver and submits as them', async () => {
        assignApprover.mockResolvedValue({ status: 'success' });
        renderPage(APPROVER);

        const button = screen.getByRole('button', { name: /approve indicator/i });
        expect(button).toBeEnabled();
        await userEvent.click(button);
        await waitFor(() => expect(assignApprover).toHaveBeenCalledWith('e2', YID));
    });

    it('shows Approved and stays disabled once the review is complete', () => {
        renderPage(APPROVER, evidence({ administrative_review_complete: true }));
        expect(screen.getByRole('button', { name: /^approved$/i })).toBeDisabled();
    });

    it('offers Withdraw Approval to a flagged approver on a completed review', async () => {
        withdrawApproval.mockResolvedValue({ status: 'success' });
        renderPage(APPROVER, evidence({ administrative_review_complete: true }));

        await userEvent.click(screen.getByRole('button', { name: /withdraw approval/i }));
        await waitFor(() => expect(withdrawApproval).toHaveBeenCalledWith('e2', YID));
    });

    it('hides Withdraw Approval from non-approvers', () => {
        renderPage(NON_APPROVER, evidence({ administrative_review_complete: true }));
        expect(screen.queryByRole('button', { name: /withdraw approval/i })).toBeNull();
    });
});

describe('ApprovalPage — concern filtering (ported from the modal)', () => {
    const concern = (unique_id, status, text) => ({
        concern: { properties: { unique_id, status, concern: text } },
        raised_by: null, became_recommendation: null, became_plan: null,
    });

    it('hides converted concerns but keeps open and dismissed ones', () => {
        renderPage(NON_APPROVER, evidence({}, {
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

describe('ApprovalPage — the report is linked, not embedded', () => {
    it('offers a link to the full report rather than rendering one', () => {
        renderPage(NON_APPROVER);
        expect(screen.getByRole('link', { name: /open full report/i }))
            .toHaveAttribute('href', '/ssu/dashboard/reports/web/1/19');
    });

    it('carries the review-comment surfaces', () => {
        renderPage(NON_APPROVER);
        expect(screen.getByTestId('admin-summary')).toBeInTheDocument();
        expect(screen.getByTestId('admin-feedback')).toBeInTheDocument();
    });
});

describe('ApprovalPage — decision signals', () => {
    it('scores coverage excluding Position and Budget', () => {
        renderPage(NON_APPROVER);
        expect(screen.getByText('0 / 2')).toBeInTheDocument();
    });

    it('counts a claim on a non-implementation-evidenced element as one to check', () => {
        // The Position row is claimed by an implementation, which is the overclaim shape.
        renderPage(NON_APPROVER);
        expect(screen.getByText(/1 claim to check before approving/i)).toBeInTheDocument();
        expect(screen.getByText('⚠ Check claim')).toBeInTheDocument();
    });

    it('surfaces unrated evidence links', () => {
        renderPage(NON_APPROVER);
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('shows the rationale behind a claim, and flags a claim without one', () => {
        renderPage(NON_APPROVER);
        expect(screen.getByText('Routes users to support.')).toBeInTheDocument();
    });

    it('degrades to a plain message when the indicator has no companion bar', () => {
        renderPage(NON_APPROVER, evidence(), {
            ...REPORT,
            evidence_coverage: { summary: {}, requirements: [] },
        });
        expect(screen.getByText(/no companion-bar requirements are authored/i)).toBeInTheDocument();
        expect(screen.getByText('No bar')).toBeInTheDocument();
    });
});
