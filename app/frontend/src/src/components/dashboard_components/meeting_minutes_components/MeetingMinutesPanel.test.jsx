import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// axios v1 is ESM and CRA's Jest doesn't transform node_modules — neutralize it with the
// inline factory (see CLAUDE.md) so the transitive service imports (auth/post/put) load.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
// Bare jest.fn() — CRA sets resetMocks:true, so set the implementation per test.
jest.mock('../../../services/api/get', () => ({
    fetchMinutesPanelForPlan: jest.fn(),
    fetchAllCommunities: jest.fn(),
}));
jest.mock('../../../services/api/delete', () => ({ deleteMeetingMinutes: jest.fn() }));
jest.mock('../../../services/api/post', () => ({ createMeetingMinutes: jest.fn() }));

import { fetchAllCommunities, fetchMinutesPanelForPlan } from '../../../services/api/get';
import { createMeetingMinutes } from '../../../services/api/post';
import { UserContext } from '../../../context/UserContext';
import MeetingMinutesPanel from './MeetingMinutesPanel';
import MeetingMinutesForm from './MeetingMinutesForm';

const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

// The form consumes UserContext (individuals for the pickers); provide a minimal value.
const USER_CTX = {
    user: null,
    individuals: [{ unique_id: 'p1', name: 'Pat Person', title: 'Analyst', active: true }],
};
const renderWithUser = (ui) => render(
    <ChakraProvider><UserContext.Provider value={USER_CTX}>{ui}</UserContext.Provider></ChakraProvider>,
);

describe('MeetingMinutesPanel', () => {
    it('loads and lists a plan\'s meeting records with an Add button', async () => {
        fetchMinutesPanelForPlan.mockResolvedValue({
            data: {
                exists: true,
                working_group: 'Web',
                working_group_plan_identifier: '2025-2026-sfsu-web',
                minutes: [
                    {
                        unique_id: 'm1',
                        title: 'Web WG — March',
                        meeting_date: '2026-03-14',
                        content: '# Notes',
                        documents: [],
                        webpages: [],
                        notes: [],
                        recorded_by: { name: 'Alex Lead' },
                    },
                ],
            },
        });

        renderWithChakra(<MeetingMinutesPanel workingGroupPlanIdentifier="2025-2026-sfsu-web" />);

        expect(await screen.findByText('Web WG — March')).toBeInTheDocument();
        expect(screen.getByText('2026-03-14')).toBeInTheDocument();
        expect(screen.getByText('Alex Lead')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add minutes/i })).toBeInTheDocument();
    });

    it('shows the empty-plan message when no campus plan exists yet', async () => {
        fetchMinutesPanelForPlan.mockResolvedValue({ data: { exists: false, minutes: [] } });
        renderWithChakra(<MeetingMinutesPanel workingGroupPlanIdentifier="2025-2026-zzz-web" />);
        expect(await screen.findByText(/no campus plan for this year yet/i)).toBeInTheDocument();
    });

    it('create modal assigns participants and pertinent communities on save', async () => {
        fetchMinutesPanelForPlan.mockResolvedValue({
            data: { exists: true, working_group: 'Web', working_group_plan_identifier: '2025-2026-sfsu-web', minutes: [] },
        });
        fetchAllCommunities.mockResolvedValue({ data: [{ unique_id: 'c1', name: 'Alternative Media' }] });
        createMeetingMinutes.mockResolvedValue({});

        renderWithUser(<MeetingMinutesPanel workingGroupPlanIdentifier="2025-2026-sfsu-web" />);
        // The Add button renders disabled while the panel loads — wait for the loaded state.
        await screen.findByText(/no meeting minutes yet/i);
        fireEvent.click(screen.getByRole('button', { name: /add minutes/i }));

        expect(await screen.findByText('Participants')).toBeInTheDocument();
        expect(screen.getByText('Pertains to communities of practice')).toBeInTheDocument();

        // Pick each select by the option it holds (order-independent).
        const selectHolding = (optionName) => screen.getAllByRole('combobox')
            .find((s) => within(s).queryByRole('option', { name: optionName }));
        const personSelect = selectHolding('Pat Person — Analyst');
        fireEvent.change(personSelect, { target: { value: 'p1' } });
        const communitySelect = await waitFor(() => {
            const s = selectHolding('Alternative Media');
            expect(s).toBeTruthy();
            return s;
        });
        fireEvent.change(communitySelect, { target: { value: 'c1' } });

        // Both selections render as removable tags (community label fills in async).
        expect(await screen.findByRole('button', { name: /remove pat person/i })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: /remove alternative media/i })).toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText(/web wg — march 14/i), { target: { value: 'Wired minutes' } });
        fireEvent.click(screen.getByRole('button', { name: 'Record' }));

        await waitFor(() => expect(createMeetingMinutes).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Wired minutes',
            participant_unique_ids: ['p1'],
            pertains_to_community_unique_ids: ['c1'],
        })));
    });

    it('edit modal preselects assignments and shows the ontology-ingest stamp', async () => {
        fetchAllCommunities.mockResolvedValue({ data: [{ unique_id: 'c1', name: 'Alternative Media' }] });
        renderWithUser(
            <MeetingMinutesForm
                isOpen
                onClose={() => {}}
                mode="edit"
                initial={{
                    unique_id: 'm1',
                    title: 'Web WG — March',
                    participants: [{ unique_id: 'p1', name: 'Pat Person' }],
                    pertains_to_communities: [{ unique_id: 'c1', name: 'Alternative Media' }],
                    ontology_ingested: true,
                    ontology_ingest_date: '2026-08-20',
                    ontology_ingest_note: 'created 2 Processes, 1 Note',
                }}
            />,
        );

        expect(await screen.findByRole('button', { name: /remove pat person/i })).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: /remove alternative media/i })).toBeInTheDocument();
        expect(screen.getByText('Ontology ingest')).toBeInTheDocument();
        expect(screen.getByText('ingested')).toBeInTheDocument();
        expect(screen.getByText(/Ingested 2026-08-20\./)).toBeInTheDocument();
        expect(screen.getByText(/created 2 Processes, 1 Note/)).toBeInTheDocument();
    });

    it('not-ingested minutes say so in the edit modal', async () => {
        fetchAllCommunities.mockResolvedValue({ data: [] });
        renderWithUser(
            <MeetingMinutesForm
                isOpen onClose={() => {}} mode="edit"
                initial={{ unique_id: 'm1', title: 'Fresh minutes', ontology_ingested: false }}
            />,
        );
        expect(await screen.findByText('not ingested')).toBeInTheDocument();
        expect(screen.getByText(/untapped source material/i)).toBeInTheDocument();
    });
});
