import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// axios v1 is ESM and CRA's Jest doesn't transform node_modules — neutralize it
// with the inline factory (see CLAUDE.md) so transitive service imports load.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
jest.mock('../../../services/api/get', () => ({ fetchCommunity: jest.fn() }));
jest.mock('../../../services/api/put', () => ({
    setPersonCommunities: jest.fn(),
    addCommunityStake: jest.fn(),
    removeCommunityStake: jest.fn(),
}));
jest.mock('../../../services/api/delete', () => ({ deleteCommunity: jest.fn() }));
jest.mock('../../../context/SettingsContext', () => ({
    useSettings: () => ({
        currentAcademicYear: '2025-2026',
        campusesLoading: false,
        campuses: [
            { name: 'San Francisco State', abbreviation: 'sfsu' },
            { name: 'Sonoma State', abbreviation: 'ssu' },
            { name: 'Cal State East Bay', abbreviation: 'csueb' },
        ],
    }),
}));

import { fetchCommunity } from '../../../services/api/get';
import { setPersonCommunities } from '../../../services/api/put';
import { UserContext } from '../../../context/UserContext';
import { DataContext } from '../../../context/DataContext';
import CommunityDetailPanel from './CommunityDetailPanel';

const COMMUNITY = {
    unique_id: 'com1',
    name: 'Alternative Media',
    description: 'Alt-media folk.',
    members: [
        {
            unique_id: 'p1', employee_id: 'e1', name: 'Pat Person', title: 'Analyst',
            host_campus: 'sfsu', campuses: [], active_campuses: ['sfsu'], note: null,
        },
        {
            unique_id: 'p2', employee_id: 'e2', name: 'Zach Member', title: 'Specialist',
            host_campus: 'csueb', campuses: ['sfsu', 'csueb'], active_campuses: ['sfsu', 'csueb'], note: null,
        },
    ],
    stakes: [],
};

// The roster mirror of the same memberships — the rebuild source. Zach also
// belongs to a SECOND community whose scoping must survive any write.
const ROSTER = [
    {
        unique_id: 'p1', employee_id: 'e1', name: 'Pat Person', title: 'Analyst', active: true,
        host_campus: 'sfsu',
        communities: [{ unique_id: 'com1', name: 'Alternative Media', note: null, campuses: [] }],
    },
    {
        unique_id: 'p2', employee_id: 'e2', name: 'Zach Member', title: 'Specialist', active: true,
        host_campus: 'csueb',
        communities: [
            { unique_id: 'com1', name: 'Alternative Media', note: null, campuses: ['sfsu', 'csueb'] },
            { unique_id: 'com2', name: 'Library', note: 'liaison', campuses: ['ssu'] },
        ],
    },
];

const renderPanel = () => render(
    <ChakraProvider>
        <UserContext.Provider value={{ individuals: ROSTER, refreshAllIndividuals: jest.fn() }}>
            <DataContext.Provider value={{ data: { indicators: [] } }}>
                <MemoryRouter initialEntries={['/ati/sfsu/ati-explorer/people/communities/com1']}>
                    <Routes>
                        <Route
                            path="/ati/:campus/ati-explorer/people/communities/:communityId"
                            element={<CommunityDetailPanel communityId="com1" />}
                        />
                    </Routes>
                </MemoryRouter>
            </DataContext.Provider>
        </UserContext.Provider>
    </ChakraProvider>,
);

describe('CommunityDetailPanel — membership campus scoping', () => {
    beforeEach(() => {
        fetchCommunity.mockResolvedValue({ status: 'success', data: { community: COMMUNITY } });
        setPersonCommunities.mockResolvedValue({});
    });

    it('renders the roster with a Campuses column: home badge for unscoped, campus badges for scoped', async () => {
        renderPanel();
        expect(await screen.findByText('Pat Person')).toBeInTheDocument();
        expect(screen.getByText('Campuses')).toBeInTheDocument();
        // Pat follows home; Zach is explicitly scoped to two campuses.
        expect(screen.getByText('home · SFSU')).toBeInTheDocument();
        const zachButton = screen.getByRole('button', { name: /edit campuses for zach member/i });
        expect(within(zachButton).getByText('sfsu')).toBeInTheDocument();
        expect(within(zachButton).getByText('csueb')).toBeInTheDocument();
    });

    it('pre-ticks home for an unscoped member; saving home+another writes the scope and carries other memberships', async () => {
        renderPanel();
        await screen.findByText('Pat Person');

        fireEvent.click(screen.getByRole('button', { name: /edit campuses for pat person/i }));
        const sfsuBox = await screen.findByRole('checkbox', { name: /san francisco state \(home\)/i });
        expect(sfsuBox).toBeChecked();

        fireEvent.click(screen.getByRole('checkbox', { name: /sonoma state/i }));
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(setPersonCommunities).toHaveBeenCalledWith('e1', [
            { community_id: 'com1', note: null, campuses: ['sfsu', 'ssu'] },
        ]));
    });

    it('Follow home campus clears to [] and other memberships survive verbatim', async () => {
        renderPanel();
        await screen.findByText('Zach Member');

        fireEvent.click(screen.getByRole('button', { name: /edit campuses for zach member/i }));
        fireEvent.click(await screen.findByRole('button', { name: /follow home campus/i }));

        await waitFor(() => expect(setPersonCommunities).toHaveBeenCalledWith('e2', [
            { community_id: 'com2', note: 'liaison', campuses: ['ssu'] },
            { community_id: 'com1', note: null, campuses: [] },
        ]));
    });
});
