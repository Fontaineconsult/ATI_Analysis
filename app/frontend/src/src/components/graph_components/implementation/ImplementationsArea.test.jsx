/**
 * The area had no tests. These pin every filter it offers against the reported
 * symptom — "filter, then click an item, and the filter resets" — because there
 * are four separate controls and they fail differently:
 *
 *   category buttons    selectedType, in the area, re-derived from the URL
 *   search box          local state inside ImplementationList
 *   Show all Campuses   in the area, NOT in the URL
 *   Show retired        in the area, NOT in the URL
 *
 * The two toggles are the fragile ones: they live only in component state, so
 * anything that remounts the area loses them silently. The category survives a
 * remount because its initial state reads the URL; the search box and the
 * toggles do not.
 *
 * Rendered under StrictMode, like the app, so a double-invoked effect that
 * re-applied the deep link would show up here.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import ImplementationsArea from './ImplementationsArea';
import { DataContext } from '../../../context/DataContext';

jest.mock('../../../hooks/useDescriptors', () => ({
    useDescriptors: () => ({ descriptors: [], getNodeTypeDefinition: () => null }),
}));
jest.mock('../../functional_components/DescriptorHelp', () => ({
    HelpTip: () => null,
}));
jest.mock('./ImplementationDetailPanel', () => ({
    __esModule: true,
    default: ({ implementation }) => (
        <div data-testid="detail">{implementation ? implementation.title : 'none'}</div>
    ),
}));
jest.mock('./CreateImplementation', () => ({ __esModule: true, default: () => null }));

const impl = (id, type, title) => ({
    unique_id: id,
    type,
    title,
    campuses: ['sfsu'],
    is_evidence_for: [],
    owned_by: [],
    retired: false,
});

const implementations = {
    Process: [impl('p1', 'Process', 'Alpha process'), impl('p2', 'Process', 'Beta process')],
    Service: [impl('s1', 'Service', 'Gamma service')],
    Guidance: [impl('g1', 'Guidance', 'Delta guidance')],
    Project: [],
    Procedure: [],
    InternalPolicy: [],
    Tracking: [],
};

const renderArea = (initialPath = '/sfsu/ati-explorer/implementations') => render(
    <React.StrictMode>
    <ChakraProvider>
        <DataContext.Provider
            value={{
                data: { implementations },
                loading: false,
                updating: false,
                refreshImplementations: jest.fn(),
            }}
        >
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route
                        path="/:campus/ati-explorer/implementations"
                        element={<ImplementationsArea />}
                    />
                    <Route
                        path="/:campus/ati-explorer/implementations/:implementationType"
                        element={<ImplementationsArea />}
                    />
                    <Route
                        path="/:campus/ati-explorer/implementations/:implementationType/:implementationId"
                        element={<ImplementationsArea />}
                    />
                </Routes>
            </MemoryRouter>
        </DataContext.Provider>
    </ChakraProvider>
    </React.StrictMode>,
);

const categoryButton = (name) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('ImplementationsArea — the category filter survives a selection', () => {
    it('filters to a category on click', async () => {
        renderArea();
        expect(screen.getByText('Gamma service')).toBeInTheDocument();

        await userEvent.click(categoryButton('Process'));

        // Narrowed to Process: the Service row is gone.
        await waitFor(() => expect(screen.queryByText('Gamma service')).not.toBeInTheDocument());
        expect(screen.getByText('Alpha process')).toBeInTheDocument();
    });

    /** The reported bug. */
    it('stays on the category after selecting an item from the filtered list', async () => {
        renderArea();
        await userEvent.click(categoryButton('Process'));
        await waitFor(() => expect(screen.queryByText('Gamma service')).not.toBeInTheDocument());

        await userEvent.click(screen.getByText('Alpha process'));

        // The detail panel updates...
        await waitFor(() => expect(screen.getByTestId('detail')).toHaveTextContent('Alpha process'));
        // ...and the list must STILL be filtered to Process.
        expect(screen.queryByText('Gamma service')).not.toBeInTheDocument();
        expect(screen.getByText('Beta process')).toBeInTheDocument();
    });

    it('keeps the campus and retired toggles across a selection', async () => {
        renderArea();
        const allCampuses = screen.getByRole('button', { name: /Show all Campuses/i });
        const retired = screen.getByRole('button', { name: /Show retired/i });

        await userEvent.click(allCampuses);
        await userEvent.click(retired);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Show all Campuses/i }))
                .toHaveAttribute('aria-pressed', 'true');
            expect(screen.getByRole('button', { name: /Show retired/i }))
                .toHaveAttribute('aria-pressed', 'true');
        });

        await userEvent.click(screen.getByText('Alpha process'));
        await waitFor(() => expect(screen.getByTestId('detail')).toHaveTextContent('Alpha process'));

        expect(screen.getByRole('button', { name: /Show all Campuses/i }))
            .toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: /Show retired/i }))
            .toHaveAttribute('aria-pressed', 'true');
    });

    /** The search box lives inside ImplementationList, so it only survives if the
     *  area is not remounted by the route change a selection causes. */
    it('keeps the search text after selecting an item', async () => {
        renderArea();
        const search = screen.getByPlaceholderText(/search/i);
        await userEvent.type(search, 'Alpha');
        await waitFor(() => expect(screen.queryByText('Beta process')).not.toBeInTheDocument());

        await userEvent.click(screen.getByText('Alpha process'));
        await waitFor(() => expect(screen.getByTestId('detail')).toHaveTextContent('Alpha process'));

        expect(screen.getByPlaceholderText(/search/i)).toHaveValue('Alpha');
        expect(screen.queryByText('Beta process')).not.toBeInTheDocument();
    });

    it('honours a category deep link', async () => {
        renderArea('/sfsu/ati-explorer/implementations/Guidance');
        await waitFor(() => expect(screen.getByText('Delta guidance')).toBeInTheDocument());
        expect(screen.queryByText('Alpha process')).not.toBeInTheDocument();
    });
});
