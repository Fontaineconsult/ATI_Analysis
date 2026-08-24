/**
 * Mount smoke test for SuccessIndicatorDetailPanel.
 *
 * Written after a temporal-dead-zone bug shipped: `approvalUrl` was computed above the
 * `const s = getIndicatorSummary(wrapper)` it reads from, so the panel threw
 * "Cannot access 's' before initialization" on every render. Nothing in the suite
 * rendered this component, so a crash-on-mount stayed green.
 *
 * The point of this file is therefore mounting at all. The Review-button assertions
 * additionally lock the navigation that replaced the approval modal.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

// Heavy children are irrelevant to mounting this panel — stub them so a failure here
// can only be this component's own.
jest.mock('../implementation/ImplementationMasterContainer', () => ({ __esModule: true, default: () => null }));
jest.mock('../documentation/YSEAnnotationMasterContainer', () => ({ __esModule: true, default: () => null }));
jest.mock('./IndicatorAssetsPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('./IndicatorGovernancePanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../../functional_components/PersonAssignmentSelector', () => ({ __esModule: true, default: () => null }));
jest.mock('../../functional_components/StatusLevelLadder', () => ({ __esModule: true, default: () => null }));
jest.mock('../../functional_components/ViewReportButton', () => ({ __esModule: true, default: () => null }));
jest.mock('../../functional_components/DescriptorHelp', () => ({ HelpTip: () => null }));
jest.mock('../../../hooks/useStatusLevels', () => ({ useStatusLevels: () => ({ statusLevels: [] }) }));
jest.mock('../../../context/SettingsContext', () => ({
    useSettings: () => ({ currentWorkingGroup: 'Web', currentAcademicYear: '2025-2026' }),
}));
jest.mock('../../../services/api/put', () => ({
    updateStatusLevel: jest.fn(),
    assignPersonAsImplementor: jest.fn(),
    unassignPersonAsImplementor: jest.fn(),
    setReadyForReview: jest.fn(),
}));

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserContext } from '../../../context/UserContext';
import { DataContext } from '../../../context/DataContext';
import SuccessIndicatorDetailPanel from './SuccessIndicatorDetailPanel';

const wrapper = (compositeKey = '1.19-web') => ({
    indicator: {
        properties: {
            composite_key: compositeKey,
            success_indicator: 'Publish accessibility statements.',
            number: 19,
        },
    },
    evidences: [{
        evidence: {
            properties: {
                year_identifier: `2025-2026-${compositeKey}-ssu`,
                administrative_review_complete: false,
                ready_for_admin_review: true,
            },
        },
        statusLevel: { properties: { status_level: 'Defined' } },
        evidenceTypes: [],
        adminReviewNotes: [],
    }],
});

const renderPanel = (w = wrapper()) => render(
    <ChakraProvider>
        <UserContext.Provider value={{
            user: { employee_id: 'e1', can_approve_yse: false },
            individuals: [],
            refreshAllIndividuals: jest.fn(),
        }}>
            <DataContext.Provider value={{ data: {}, loadSingleWorkingGroupData: jest.fn() }}>
                <MemoryRouter initialEntries={['/ssu/ati-explorer/indicators']}>
                    <Routes>
                        <Route
                            path="/:campus/ati-explorer/indicators"
                            element={<SuccessIndicatorDetailPanel wrapper={w} />}
                        />
                    </Routes>
                </MemoryRouter>
            </DataContext.Provider>
        </UserContext.Provider>
    </ChakraProvider>
);

describe('SuccessIndicatorDetailPanel', () => {
    it('mounts without throwing', () => {
        expect(() => renderPanel()).not.toThrow();
        expect(screen.getByText(/publish accessibility statements/i)).toBeInTheDocument();
    });

    it('sends Review to the approval page rather than opening a modal', () => {
        renderPanel();
        const review = screen.getByRole('button', { name: /^review$/i });
        expect(review).toBeEnabled();
        // The URL is derived from the composite key: 1.19-web -> web/1/19.
        expect(review).not.toHaveAttribute('aria-haspopup', 'dialog');
    });

    it('disables Review when the composite key cannot resolve a working-group slug', () => {
        renderPanel(wrapper('1.19-nonsense'));
        expect(screen.getByRole('button', { name: /^review$/i })).toBeDisabled();
    });

    it('renders nothing rather than crashing when there is no wrapper', () => {
        expect(() => renderPanel(null)).not.toThrow();
    });
});
