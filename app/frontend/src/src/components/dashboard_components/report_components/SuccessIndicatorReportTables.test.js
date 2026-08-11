/**
 * Report tables — both approval-flow steps inline plus the review-state wash:
 * step one (mark/unmark ready) acts directly from the row; step two (approve)
 * still opens the review modal; rows carry the yellow/green edge wash.
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
    setReadyForReview: jest.fn(),
}));
jest.mock('../../functional_components/ViewReportButton', () => ({
    __esModule: true,
    default: () => <button type="button">View</button>,
}));

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { DataContext } from '../../../context/DataContext';
import { setReadyForReview } from '../../../services/api/put';
import SuccessIndicatorReportTables from './SuccessIndicatorReportTables';

const indicatorWrapper = (key, evidenceProps, evidenceTypes = []) => ({
    indicator: {
        id: `id-${key}`,
        properties: { composite_key: key, success_indicator: `Indicator ${key}` },
    },
    evidences: [{
        evidence: { properties: { year_identifier: `2025-2026-${key}-sfsu`, ...evidenceProps } },
        statusLevel: { properties: { status_level: 'Defined', status_value: 2 } },
        adminReviewers: [],
        persons: [],
        evidenceTypes,
        has_notes: [], has_messages: [], has_metrics: [], plans: [],
    }],
});

const DATA = {
    web: {
        workingGroup: 'Web',
        goals: [{
            goal: { id: 'g7', properties: { goal_number: 7, name: 'Web goal', goal: 'desc' } },
            indicators: [
                indicatorWrapper('7.1-web', { ready_for_admin_review: false, administrative_review_complete: false }),
                indicatorWrapper('7.2-web', { ready_for_admin_review: true, administrative_review_complete: false }),
                indicatorWrapper('7.3-web', { ready_for_admin_review: true, administrative_review_complete: true }),
                indicatorWrapper('7.4-web', {}, [
                    { type: 'Procedure', control: 'external', evidenceType: { properties: { unique_id: 'x1', title: 'CSUBuy Review' } }, docs: [], webs: [], notes: [], msgs: [], metrics: [] },
                    { type: 'Process', control: 'internal', evidenceType: { properties: { unique_id: 'x2', title: 'Local Process' } }, docs: [], webs: [], notes: [], msgs: [], metrics: [] },
                ]),
            ],
        }],
    },
};

const loadSingleWorkingGroupData = jest.fn();

const renderTables = () =>
    render(
        <ChakraProvider>
            <MemoryRouter>
                <DataContext.Provider value={{ loadSingleWorkingGroupData }}>
                    <SuccessIndicatorReportTables
                        data={DATA}
                        campus="sfsu"
                        navigate={jest.fn()}
                        openApprovalModal={jest.fn()}
                    />
                </DataContext.Provider>
            </MemoryRouter>
        </ChakraProvider>
    );

const row = (key) => document.getElementById(key);

describe('SuccessIndicatorReportTables review flow', () => {
    beforeEach(() => {
        setReadyForReview.mockReset();
        loadSingleWorkingGroupData.mockReset();
    });

    it('washes rows by review state', () => {
        renderTables();
        expect(row('7.1-web').className).not.toContain('review-wash');
        expect(row('7.2-web').className).toContain('review-wash--ready');
        expect(row('7.3-web').className).toContain('review-wash--approved');
    });

    it('flags indicators whose evidence relies on externally controlled practices', () => {
        renderTables();
        expect(within(row('7.4-web')).getByText('External ×1')).toBeInTheDocument();
        expect(within(row('7.1-web')).queryByText(/External ×/)).toBeNull();
    });

    it('flags implementations with no documentation at all (docs+webpages only)', () => {
        renderTables();
        // 7.4's two evidenceTypes carry zero docs/webpages -> undocumented ×2.
        expect(within(row('7.4-web')).getByText('⚠ Undocumented ×2')).toBeInTheDocument();
        // Rows with no implementations at all get the missing-impl state, not this flag.
        expect(within(row('7.1-web')).queryByText(/Undocumented ×/)).toBeNull();
    });

    it('offers Mark ready / Unmark ready per state, none once approved', () => {
        renderTables();
        expect(within(row('7.1-web')).getByRole('button', { name: /mark ready/i })).toBeInTheDocument();
        expect(within(row('7.2-web')).getByRole('button', { name: /unmark ready/i })).toBeInTheDocument();
        expect(within(row('7.3-web')).queryByRole('button', { name: /ready/i })).toBeNull();
        // Approved row's approve button is the disabled 'Approved'.
        expect(within(row('7.3-web')).getByRole('button', { name: /approved/i })).toBeDisabled();
    });

    it('marks ready inline and refreshes the working group', async () => {
        setReadyForReview.mockResolvedValue({ status: 'success' });
        renderTables();

        await userEvent.click(within(row('7.1-web')).getByRole('button', { name: /mark ready/i }));

        await waitFor(() =>
            expect(setReadyForReview).toHaveBeenCalledWith('2025-2026-7.1-web-sfsu', true)
        );
        await waitFor(() => expect(loadSingleWorkingGroupData).toHaveBeenCalledWith('Web'));
    });

    it('withdraws the ready mark inline', async () => {
        setReadyForReview.mockResolvedValue({ status: 'success' });
        renderTables();

        await userEvent.click(within(row('7.2-web')).getByRole('button', { name: /unmark ready/i }));

        await waitFor(() =>
            expect(setReadyForReview).toHaveBeenCalledWith('2025-2026-7.2-web-sfsu', false)
        );
    });
});
