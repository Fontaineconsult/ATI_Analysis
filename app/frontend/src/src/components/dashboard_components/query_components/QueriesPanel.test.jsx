import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// axios v1 is ESM and CRA's Jest doesn't transform node_modules — neutralize it with the
// inline factory (see CLAUDE.md) so QueryForm/QueryDetail's service imports load.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

jest.mock('../../../context/SettingsContext', () => ({
    useSettings: () => ({
        vocab: {
            query_statuses: { open: 'Open', in_progress: 'In Progress', settled: 'Settled' },
            query_categories: { policy_decision: 'Policy Decision' },
        },
    }),
}));
// Bare jest.fn()s — CRA sets resetMocks:true, so implementations must be set per test.
jest.mock('../../../services/api/get', () => ({
    fetchQueryPanelForPlan: jest.fn(),
    fetchQueryPanelForWorkingGroup: jest.fn(),
}));
jest.mock('../../../services/api/delete', () => ({ deleteQuery: jest.fn() }));

import { fetchQueryPanelForPlan } from '../../../services/api/get';
import QueriesPanel from './QueriesPanel';

const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe('QueriesPanel', () => {
    it('loads and lists a plan\'s queries with badges, stat chips, and a create button', async () => {
        fetchQueryPanelForPlan.mockResolvedValue({
            data: {
                exists: true,
                working_group: 'Web',
                working_group_plan_identifier: '2025-2026-sfsu-web',
                candidate_evidence: [],
                queries: [
                    {
                        unique_id: 'q1',
                        question: 'Adopt the new VPAT workflow?',
                        category: 'policy_decision',
                        status: 'open',
                        date_raised: '2026-06-01',
                        addresses_evidence: [],
                        notes: [],
                        raised_by: { name: 'Alex Lead' },
                    },
                ],
            },
        });

        renderWithChakra(<QueriesPanel workingGroupPlanIdentifier="2025-2026-sfsu-web" />);

        expect(await screen.findByText('Adopt the new VPAT workflow?')).toBeInTheDocument();
        expect(screen.getByText('Policy Decision')).toBeInTheDocument();
        expect(screen.getByText('Open')).toBeInTheDocument();        // status badge
        expect(screen.getByText(/1 open/)).toBeInTheDocument();      // stat chip
        expect(screen.getByText('Alex Lead')).toBeInTheDocument();   // raised-by
        expect(screen.getByRole('button', { name: /new question/i })).toBeInTheDocument();
    });

    it('shows the empty-plan message when no campus plan exists yet', async () => {
        fetchQueryPanelForPlan.mockResolvedValue({
            data: { exists: false, queries: [], candidate_evidence: [] },
        });
        renderWithChakra(<QueriesPanel workingGroupPlanIdentifier="2025-2026-zzz-web" />);
        expect(await screen.findByText(/no campus plan for this year yet/i)).toBeInTheDocument();
    });
});
