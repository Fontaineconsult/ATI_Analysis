/**
 * Approve-button gating in the Administrative Review modal: the Approver flag
 * (can_approve_yse, set in Settings → Members) must gate the button — before
 * this, any selected user could approve (the backend now 403s as the backstop).
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
jest.mock('../../services/api/put', () => ({
    assignApprover: jest.fn(),
    withdrawApproval: jest.fn(),
}));
jest.mock('../../services/report_constructor', () => ({
    GenerateReportComponent: ({ singleColumn }) => (
        <div data-testid="report" data-single-column={String(!!singleColumn)} />
    ),
}));
jest.mock('../graph_components/indicators/StatusLevelDetails', () => ({ __esModule: true, default: () => null }));
jest.mock('../dashboard_components/report_components/SingleReportMasterContainer', () => ({ __esModule: true, default: () => null }));
jest.mock('../dashboard_components/report_components/AdminSummaryForm', () => ({ __esModule: true, default: () => null }));
jest.mock('../dashboard_components/report_components/AdminFeedbackForm', () => ({ __esModule: true, default: () => null }));
jest.mock('../../context/SettingsContext', () => ({
    useSettings: () => ({ currentWorkingGroup: 'Web' }),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserContext } from '../../context/UserContext';
import { DataContext } from '../../context/DataContext';
import { assignApprover, withdrawApproval } from '../../services/api/put';
import ApprovalMasterContainer from './ApprovalMasterContainer';

const evidenceData = (overrides = {}) => ({
    evidence: {
        properties: {
            year_identifier: '2025-2026-7.11-ins-sfsu',
            administrative_review_complete: false,
            admin_review_description: '',
            ...overrides,
        },
    },
    statusLevel: { properties: {} },
    adminReviewNotes: [],
});

const renderWithUser = (user, evidence = evidenceData()) =>
    render(
        <UserContext.Provider value={{ user }}>
            <DataContext.Provider value={{ data: {}, loadSingleWorkingGroupData: jest.fn() }}>
                <ApprovalMasterContainer evidenceData={evidence} />
            </DataContext.Provider>
        </UserContext.Provider>
    );

describe('ApprovalMasterContainer approver gating', () => {
    beforeEach(() => assignApprover.mockReset());

    it('disables Approve for a user without the Approver flag', () => {
        renderWithUser({ employee_id: 'e1', name: 'No Flag', can_approve_yse: false });

        const button = screen.getByRole('button', { name: /approve indicator/i });
        expect(button).toBeDisabled();
    });

    it('embeds the report in single-column mode (viewport-responsive row crushes in the modal)', () => {
        renderWithUser({ employee_id: 'e1', name: 'No Flag', can_approve_yse: false });

        expect(screen.getByTestId('report')).toHaveAttribute('data-single-column', 'true');
    });

    it('enables Approve for a flagged approver and submits as them', async () => {
        assignApprover.mockResolvedValue({ status: 'success' });
        renderWithUser({ employee_id: 'e2', name: 'Has Flag', can_approve_yse: true });

        const button = screen.getByRole('button', { name: /approve indicator/i });
        expect(button).toBeEnabled();

        await userEvent.click(button);
        await waitFor(() =>
            expect(assignApprover).toHaveBeenCalledWith('e2', '2025-2026-7.11-ins-sfsu')
        );
    });

    it('shows Approved and stays disabled once the review is complete', () => {
        renderWithUser(
            { employee_id: 'e2', name: 'Has Flag', can_approve_yse: true },
            evidenceData({ administrative_review_complete: true })
        );

        const button = screen.getByRole('button', { name: /^approved/i });
        expect(button).toBeDisabled();
    });

    it('offers Withdraw Approval to a flagged approver on a completed review', async () => {
        withdrawApproval.mockResolvedValue({ status: 'success' });
        renderWithUser(
            { employee_id: 'e2', name: 'Has Flag', can_approve_yse: true },
            evidenceData({ administrative_review_complete: true })
        );

        const withdraw = screen.getByRole('button', { name: /withdraw approval/i });
        await userEvent.click(withdraw);
        await waitFor(() =>
            expect(withdrawApproval).toHaveBeenCalledWith('e2', '2025-2026-7.11-ins-sfsu')
        );
    });

    it('hides Withdraw Approval from non-approvers', () => {
        renderWithUser(
            { employee_id: 'e1', name: 'No Flag', can_approve_yse: false },
            evidenceData({ administrative_review_complete: true })
        );

        expect(screen.queryByRole('button', { name: /withdraw approval/i })).toBeNull();
    });
});

// The review window is a decision surface: a reviewer is deciding what still needs
// work. A CONVERTED concern has already become a recommendation or a plan, and that
// thing is rendered on the same page — showing the concern too is the same item
// twice. The full record, converted items included, stays on the Annotations tab.
describe('ApprovalMasterContainer concern filtering', () => {
    const concern = (unique_id, status, text) => ({
        concern: { properties: { unique_id, status, concern: text } },
        raised_by: null,
        became_recommendation: null,
        became_plan: null,
    });

    const withConcerns = (concerns) => ({ ...evidenceData(), concerns });

    it('hides converted concerns but keeps open and dismissed ones', () => {
        renderWithUser(
            { employee_id: 'e1', name: 'No Flag', can_approve_yse: false },
            withConcerns([
                concern('c1', 'open', 'No 504 coordinator'),
                concern('c2', 'converted', 'Became a recommendation already'),
                concern('c3', 'dismissed', 'Not an accessibility matter'),
            ])
        );

        expect(screen.getByText('No 504 coordinator')).toBeInTheDocument();
        expect(screen.queryByText('Became a recommendation already')).toBeNull();
        expect(screen.getByText('Not an accessibility matter')).toBeInTheDocument();
    });

    it('shows the empty state when every concern is converted', () => {
        renderWithUser(
            { employee_id: 'e1', name: 'No Flag', can_approve_yse: false },
            withConcerns([concern('c1', 'converted', 'Answered already')])
        );

        expect(screen.queryByText('Answered already')).toBeNull();
        expect(screen.getByText(/no concerns recorded for this indicator/i)).toBeInTheDocument();
    });
});
