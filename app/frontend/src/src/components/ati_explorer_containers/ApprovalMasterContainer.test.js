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
}));
jest.mock('../../services/report_constructor', () => ({
    GenerateReportComponent: () => <div data-testid="report" />,
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
import { assignApprover } from '../../services/api/put';
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

        const button = screen.getByRole('button', { name: /approved/i });
        expect(button).toBeDisabled();
    });
});
