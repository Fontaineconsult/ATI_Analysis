/**
 * The assets area had no tests at all, and it was just moved off eleven local
 * useState/useEffect loaders onto the shared resource store. This suite guards
 * exactly what that change can break, and nothing else — it is not an attempt to
 * cover a 700-line container.
 *
 * Three properties:
 *   1. Every read still happens, once, on arrival.
 *   2. Leaving the area and coming back does NOT refetch. That is the whole
 *      point of the move; before it, all eleven fired again on every visit.
 *   3. A mutation still refreshes. Caching a list without invalidating it on
 *      write trades a redundant request for a stale screen, which is worse.
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
    fetchAllAssets: jest.fn(),
    fetchElevationSignalAssets: jest.fn(),
    fetchAllTaaps: jest.fn(),
    fetchTaapsDueForReview: jest.fn(),
    fetchVendorsList: jest.fn(),
    fetchAllInterfaces: jest.fn(),
    fetchUncoveredInterfaces: jest.fn(),
    fetchAllImplementations: jest.fn(),
    fetchAllTools: jest.fn(),
    fetchAllComponents: jest.fn(),
    fetchAllGovernance: jest.fn(),
    fetchAssetDetail: jest.fn(),
    fetchVendors: jest.fn(),
}));

import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import AssetsMasterContainer from './AssetsMasterContainer';
import { DataContext } from '../../context/DataContext';
import { SettingsContext } from '../../context/SettingsContext';
import { UserContext } from '../../context/UserContext';
import { createResourceStore } from '../../context/resourceStore';
import * as api from '../../services/api/get';

const items = (list) => ({ data: { items: list } });

const ALL_READS = [
    'fetchAllAssets', 'fetchElevationSignalAssets', 'fetchAllTaaps',
    'fetchTaapsDueForReview', 'fetchVendorsList', 'fetchAllInterfaces',
    'fetchUncoveredInterfaces', 'fetchAllImplementations', 'fetchAllTools',
    'fetchAllComponents', 'fetchAllGovernance',
];

function primeApi() {
    api.fetchAllAssets.mockResolvedValue(items([
        { asset_identifier: 'a-1', title: 'Learning Platform', scope: 'campus' },
    ]));
    api.fetchElevationSignalAssets.mockResolvedValue(items([{ asset_identifier: 'a-1' }]));
    api.fetchAllTaaps.mockResolvedValue(items([{ title: 'TAAP One' }]));
    api.fetchTaapsDueForReview.mockResolvedValue(items([{ title: 'TAAP One' }]));
    api.fetchVendorsList.mockResolvedValue(items([{ name: 'Acme' }]));
    api.fetchAllInterfaces.mockResolvedValue(items([{ interface_identifier: 'i-1', title: 'Portal' }]));
    api.fetchUncoveredInterfaces.mockResolvedValue(items([{ interface_identifier: 'i-1' }]));
    api.fetchAllTools.mockResolvedValue(items([{ tool_identifier: 't-1', title: 'Checker' }]));
    api.fetchAllComponents.mockResolvedValue(items([{ component_identifier: 'c-1', title: 'Nav' }]));
    api.fetchAllImplementations.mockResolvedValue({
        data: { Process: [{ unique_id: 'p1', title: 'Remediation Process' }] },
    });
    api.fetchAllGovernance.mockResolvedValue({
        data: [
            { unique_id: 'g1', title: 'WCAG 2.1', type: 'guideline' },
            { unique_id: 'g2', title: 'Section 508', type: 'law' },
        ],
    });
    api.fetchAssetDetail.mockResolvedValue({ data: null });
    api.fetchVendors.mockResolvedValue({ data: [] });
}

/** One store for the whole test, as the real provider holds one for the session. */
function makeHarness() {
    const store = createResourceStore();
    const listeners = new Set();
    let version = 0;

    const Harness = ({ children }) => {
        const [v, setV] = useState(version);
        listeners.add(setV);
        const dataValue = {
            peekResource: (k) => store.peek(k),
            getOrFetchResource: (k, f) => store.getOrFetch(k, f),
            invalidateResource: (k) => {
                store.invalidate(k);
                version += 1;
                listeners.forEach((set) => set(version));
            },
            invalidateResourcePrefix: (prefix) => {
                store.invalidatePrefix(prefix);
                version += 1;
                listeners.forEach((set) => set(version));
            },
            resourceVersion: v,
        };
        return (
            <ChakraProvider>
                <SettingsContext.Provider value={{ campuses: [], currentCampus: 'sfsu' }}>
                    <UserContext.Provider value={{ individuals: [] }}>
                        <DataContext.Provider value={dataValue}>
                            <MemoryRouter initialEntries={['/sfsu/ati-explorer/assets']}>
                                <Routes>
                                    <Route path="/:campus/ati-explorer/assets" element={children} />
                                </Routes>
                            </MemoryRouter>
                        </DataContext.Provider>
                    </UserContext.Provider>
                </SettingsContext.Provider>
            </ChakraProvider>
        );
    };
    return { Harness, store };
}

const callCounts = () => Object.fromEntries(ALL_READS.map((n) => [n, api[n].mock.calls.length]));

describe('AssetsMasterContainer — reads through the shared store', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        primeApi();
    });

    it('performs every read exactly once on arrival', async () => {
        const { Harness } = makeHarness();
        render(<Harness><AssetsMasterContainer /></Harness>);

        await waitFor(() => expect(screen.getByText('Learning Platform')).toBeInTheDocument());
        await waitFor(() => ALL_READS.forEach((n) => expect(api[n]).toHaveBeenCalledTimes(1)));
    });

    /** The defect the migration exists to fix. */
    it('does not refetch anything when the area is left and re-entered', async () => {
        const { Harness } = makeHarness();

        const first = render(<Harness><AssetsMasterContainer /></Harness>);
        await waitFor(() => expect(screen.getByText('Learning Platform')).toBeInTheDocument());
        const afterFirstVisit = callCounts();
        first.unmount();

        render(<Harness><AssetsMasterContainer /></Harness>);
        await waitFor(() => expect(screen.getByText('Learning Platform')).toBeInTheDocument());

        expect(callCounts()).toEqual(afterFirstVisit);
    });

    it('serves the second visit from the cache with no loading state', async () => {
        const { Harness } = makeHarness();

        const first = render(<Harness><AssetsMasterContainer /></Harness>);
        await waitFor(() => expect(screen.getByText('Learning Platform')).toBeInTheDocument());
        first.unmount();

        // Present in the very first paint, not after a spinner settles.
        render(<Harness><AssetsMasterContainer /></Harness>);
        expect(screen.getByText('Learning Platform')).toBeInTheDocument();
    });

    it('refetches a namespace after it is invalidated, and only that namespace', async () => {
        const { Harness, store } = makeHarness();
        render(<Harness><AssetsMasterContainer /></Harness>);
        await waitFor(() => expect(screen.getByText('Learning Platform')).toBeInTheDocument());

        const before = callCounts();
        store.invalidatePrefix('assets:');

        // Re-entering now refetches the asset reads and nothing else — this is
        // what a save/delete handler triggers.
        const again = render(<Harness><AssetsMasterContainer /></Harness>);
        await waitFor(() => expect(api.fetchAllAssets).toHaveBeenCalledTimes(before.fetchAllAssets + 1));

        expect(api.fetchElevationSignalAssets)
            .toHaveBeenCalledTimes(before.fetchElevationSignalAssets + 1);
        expect(api.fetchAllTools).toHaveBeenCalledTimes(before.fetchAllTools);
        expect(api.fetchVendorsList).toHaveBeenCalledTimes(before.fetchVendorsList);
        again.unmount();
    });

    it('keys the two vendor endpoints separately', async () => {
        // Both are read on this screen: the container lists vendors from /vendors,
        // and the asset panel loads vendor CANDIDATES from
        // /organizational-units?type=vendors. Different endpoints, different
        // response shapes — sharing a key would hand one caller the other's
        // payload, so they must be two entries and two requests.
        const { Harness, store } = makeHarness();
        render(<Harness><AssetsMasterContainer /></Harness>);
        await waitFor(() => expect(api.fetchVendorsList).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(api.fetchVendors).toHaveBeenCalledTimes(1));

        expect(store.has('vendors:list')).toBe(true);
        expect(store.has('orgunits:vendors')).toBe(true);
        expect(store.peek('vendors:list')).not.toEqual(store.peek('orgunits:vendors'));
    });

    it('derives the guideline picker from the shared governance read', async () => {
        const { Harness, store } = makeHarness();
        render(<Harness><AssetsMasterContainer /></Harness>);
        await waitFor(() => expect(api.fetchAllGovernance).toHaveBeenCalledTimes(1));

        // The same key the governance area uses, so the two share one request.
        expect(store.has('governance:all')).toBe(true);
    });
});
