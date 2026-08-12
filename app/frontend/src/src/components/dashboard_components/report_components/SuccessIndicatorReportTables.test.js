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
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

    it('exposes each indicator row as an h5 row header named by composite key', () => {
        renderTables();
        // Headings-list path to a row: h5 named by the composite key (visible
        // cell shows only the goal-local number, aria-hidden).
        const h5 = within(row('7.1-web')).getByRole('heading', { level: 5, name: '7.1-web' });
        expect(h5).toBeInTheDocument();
        // The cell is a row header, so table navigation announces it per cell.
        expect(within(row('7.1-web')).getByRole('rowheader')).toContainElement(h5);
        // Every row gets its own uniquely named heading.
        expect(within(row('7.4-web')).getByRole('heading', { level: 5, name: '7.4-web' })).toBeInTheDocument();
    });

    it('supports arrow-key navigation between and within rows', () => {
        renderTables();
        const first = row('7.1-web');
        expect(first).toHaveAttribute('tabindex', '-1');

        first.focus();
        fireEvent.keyDown(first, { key: 'ArrowDown' });
        expect(row('7.2-web')).toHaveFocus();

        fireEvent.keyDown(row('7.2-web'), { key: 'ArrowUp' });
        expect(first).toHaveFocus();

        fireEvent.keyDown(first, { key: 'End' });
        expect(row('7.4-web')).toHaveFocus();
        fireEvent.keyDown(row('7.4-web'), { key: 'Home' });
        expect(first).toHaveFocus();

        // Right from the row enters its first action button; Left walks back out.
        fireEvent.keyDown(first, { key: 'ArrowRight' });
        const firstButton = within(first).getAllByRole('button')[0];
        expect(firstButton).toHaveFocus();
        fireEvent.keyDown(firstButton, { key: 'ArrowLeft' });
        expect(first).toHaveFocus();
    });

    it('gives every action button a unique per-indicator accessible name', () => {
        renderTables();
        // Visible label first (WCAG 2.5.3 Label in Name), then the composite key,
        // so the dozens of View/Edit/Mark ready/Approve buttons on the page each
        // announce their target indicator. (ViewReportButton is mocked here; its
        // aria-label is set inside that component.)
        expect(screen.getByRole('button', { name: 'Edit 7.1-web' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Mark ready 7.1-web' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Unmark ready 7.2-web' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Approve 7.1-web' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Approved 7.3-web' })).toBeInTheDocument();
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
        // The refresh must use the WG slug — the display name 400s on /evidence.
        await waitFor(() => expect(loadSingleWorkingGroupData).toHaveBeenCalledWith('web'));
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
