/**
 * Selecting a record must not clear the filters.
 *
 * Every filter in this area lives in the query string — the diagnostic filter,
 * the type chips, the attachment facet, the sort and the search box — which is
 * what makes a filtered view shareable. The consequence is that ANY navigate
 * which rebuilds the path without carrying `location.search` silently clears all
 * of them at once. Selecting a row did exactly that: the record opened
 * correctly and the list underneath reset to unfiltered, with the facet button
 * popping back out.
 *
 * These assert on the URL rather than on rendered chips, because the URL is the
 * state. If it survives, everything downstream does.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

jest.mock('../../services/api/get', () => ({
    fetchDocumentationIndex: jest.fn(),
    fetchDocumentationItem: jest.fn(),
}));
jest.mock('../../services/api/put', () => ({ updateDocumentationRecord: jest.fn() }));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import DocumentationMasterContainer from './DocumentationMasterContainer';
import { DataContext } from '../../context/DataContext';
import { createResourceStore } from '../../context/resourceStore';
import * as api from '../../services/api/get';

const record = (over = {}) => ({
    doc_type: 'documents',
    unique_id: 'd1',
    title: 'Alpha document',
    name: 'Alpha document',
    uri_path: 'https://sfsu.edu/alpha',
    include_in_report: true,
    include_in_report_set: true,
    depreciated: false,
    has_location: true,
    // Shared (parent_count > 1) so the `filter=shared` case below has something
    // to match; the attachment facet is what separates the two records.
    reference_count: 2,
    parent_count: 2,
    integrity: [],
    referenced_by: [{ rel_type: 'is_documented_by', parent_label: 'Process', parent_id: 'p1', parent_title: 'A process' }],
    reference_labels: ['Process'],
    rel_types: ['is_documented_by'],
    ...over,
});

const items = [
    record(),
    record({
        unique_id: 'd2',
        title: 'Beta document',
        name: 'Beta document',
        referenced_by: [{ rel_type: 'is_sourced_from', parent_label: 'Law', parent_id: 'l1', parent_title: 'A law' }],
        reference_labels: ['Law'],
    }),
];

let currentLocation;
function LocationProbe() {
    currentLocation = useLocation();
    return null;
}

const renderArea = (initialPath) => {
    const store = createResourceStore();
    return render(
        <ChakraProvider>
            <DataContext.Provider
                value={{
                    peekResource: (k) => store.peek(k),
                    getOrFetchResource: (k, f) => store.getOrFetch(k, f),
                    invalidateResource: () => {},
                    invalidateResourcePrefix: () => {},
                    resourceVersion: 0,
                }}
            >
                <MemoryRouter initialEntries={[initialPath]}>
                    <LocationProbe />
                    <Routes>
                        <Route
                            path="/:campus/ati-explorer/documentation/:docGroup"
                            element={<DocumentationMasterContainer />}
                        />
                        <Route
                            path="/:campus/ati-explorer/documentation/:docGroup/:docType/:docId"
                            element={<DocumentationMasterContainer />}
                        />
                    </Routes>
                </MemoryRouter>
            </DataContext.Provider>
        </ChakraProvider>,
    );
};

beforeEach(() => {
    jest.clearAllMocks();
    api.fetchDocumentationIndex.mockResolvedValue({
        data: { items, meta: { types: ['documents'], type_capabilities: {} } },
    });
    api.fetchDocumentationItem.mockResolvedValue({ data: record() });
});

describe('selecting a record keeps the filters', () => {
    it('carries the attachment facet through the selection', async () => {
        renderArea('/sfsu/ati-explorer/documentation/artifacts?attached=Process');
        await screen.findByText('Alpha document');

        // The facet is applied: only the Process-attached record is listed.
        expect(screen.queryByText('Beta document')).not.toBeInTheDocument();

        await userEvent.click(screen.getByText('Alpha document'));

        await waitFor(() => expect(currentLocation.pathname).toContain('/documents/d1'));
        expect(currentLocation.search).toBe('?attached=Process');
        // And the list is still narrowed.
        expect(screen.queryByText('Beta document')).not.toBeInTheDocument();
    });

    it('carries every other filter too', async () => {
        renderArea(
            '/sfsu/ati-explorer/documentation/artifacts'
            + '?filter=shared&type=documents&attached=Process&sort=locator&q=Alpha',
        );
        await screen.findByText('Alpha document');

        await userEvent.click(screen.getByText('Alpha document'));

        await waitFor(() => expect(currentLocation.pathname).toContain('/documents/d1'));
        const params = new URLSearchParams(currentLocation.search);
        expect(params.get('filter')).toBe('shared');
        expect(params.get('type')).toBe('documents');
        expect(params.get('attached')).toBe('Process');
        expect(params.get('sort')).toBe('locator');
        expect(params.get('q')).toBe('Alpha');
    });

    it('leaves the URL clean when there were no filters', async () => {
        renderArea('/sfsu/ati-explorer/documentation/artifacts');
        await screen.findByText('Alpha document');

        await userEvent.click(screen.getByText('Alpha document'));

        await waitFor(() => expect(currentLocation.pathname).toContain('/documents/d1'));
        expect(currentLocation.search).toBe('');
    });
});
