import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// axios v1 is ESM and CRA's Jest doesn't transform node_modules — neutralize it with the
// inline factory (see CLAUDE.md) so the transitive service imports load.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
jest.mock('../../../services/api/get', () => ({ fetchQueryPanelForPlan: jest.fn() }));
jest.mock('../../../services/api/delete', () => ({ deleteQuery: jest.fn() }));
jest.mock('../../../context/SettingsContext', () => ({ useSettings: () => ({ vocab: {} }) }));
// The list is what's under test; the modals bring their own context requirements.
jest.mock('../query_components/QueryForm', () => ({ __esModule: true, default: () => null }));
jest.mock('../query_components/QueryDetail', () => ({ __esModule: true, default: () => null }));

import { fetchQueryPanelForPlan } from '../../../services/api/get';
import WgQueriesSection from './WgQueriesSection';

const QUERIES = Array.from({ length: 12 }, (_, i) => ({
    unique_id: `q${i}`,
    question: `Question number ${i}`,
    status: 'open',
    category: 'information_gap',
}));

const renderSection = () => render(
    <ChakraProvider>
        <WgQueriesSection workingGroupPlanIdentifier="2025-2026-csueb-ins" />
    </ChakraProvider>,
);

describe('WgQueriesSection', () => {
    beforeEach(() => {
        fetchQueryPanelForPlan.mockResolvedValue({
            data: { exists: true, queries: QUERIES },
        });
    });

    it('caps the list height and scrolls, matching WgMinutesSection', async () => {
        // A working group with a long question backlog otherwise stretches its
        // card past every sibling and breaks the row. 300px is the same cap the
        // minutes list uses; the two are meant to stay equal.
        renderSection();
        const firstRow = await screen.findByText('Question number 0');
        const list = firstRow.closest('[class*="chakra-stack"]');
        expect(list).toHaveStyle({ maxHeight: '300px', overflowY: 'auto' });
    });

    it('renders every query inside the scroll container rather than truncating', async () => {
        renderSection();
        expect(await screen.findByText('Question number 0')).toBeInTheDocument();
        expect(screen.getByText('Question number 11')).toBeInTheDocument();
    });

    it('shows the empty state without a scroll container', async () => {
        fetchQueryPanelForPlan.mockResolvedValue({ data: { exists: true, queries: [] } });
        renderSection();
        expect(await screen.findByText(/no questions yet/i)).toBeInTheDocument();
    });
});
