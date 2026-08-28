import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
jest.mock('../../../services/api/get', () => ({ fetchMinutesPanelForPlan: jest.fn() }));
jest.mock('../../../services/api/delete', () => ({ deleteMeetingMinutes: jest.fn() }));
// The list is what's under test — the modals bring their own context requirements.
jest.mock('../meeting_minutes_components/MeetingMinutesForm', () => ({ __esModule: true, default: () => null }));
jest.mock('../meeting_minutes_components/MeetingMinutesDetail', () => ({ __esModule: true, default: () => null }));

import { fetchMinutesPanelForPlan } from '../../../services/api/get';
import WgMinutesSection from './WgMinutesSection';

const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

describe('WgMinutesSection', () => {
    it('rows carry the ingest badge, community badges, and participant badges', async () => {
        fetchMinutesPanelForPlan.mockResolvedValue({
            data: {
                exists: true,
                working_group: 'Web',
                minutes: [
                    {
                        unique_id: 'm1',
                        title: 'Web WG — March',
                        meeting_date: '2026-03-14',
                        documents: [], webpages: [], notes: [],
                        ontology_ingested: true,
                        pertains_to_communities: [{ unique_id: 'c1', name: 'Alternative Media' }],
                        participants: [{ unique_id: 'p1', name: 'Pat Person' }],
                    },
                    {
                        unique_id: 'm2',
                        title: 'Web WG — April',
                        documents: [], webpages: [], notes: [],
                        ontology_ingested: false,
                    },
                ],
            },
        });

        renderWithChakra(<WgMinutesSection workingGroupPlanIdentifier="2025-2026-sfsu-web" workingGroupName="Web" accentColor="teal.500" />);

        expect(await screen.findByText('Web WG — March')).toBeInTheDocument();
        expect(screen.getByText('ingested')).toBeInTheDocument();
        expect(screen.getByText('not ingested')).toBeInTheDocument();
        expect(screen.getByText('Alternative Media')).toBeInTheDocument();
        expect(screen.getByText('Pat Person')).toBeInTheDocument();

        // Opening a record repeats the same badge line in the modal header.
        fireEvent.click(screen.getByRole('button', { name: /open meeting minutes: web wg — march/i }));
        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText('ingested')).toBeInTheDocument();
        expect(within(dialog).getByText('Alternative Media')).toBeInTheDocument();
        expect(within(dialog).getByText('Pat Person')).toBeInTheDocument();
    });

    it('shows the empty message when the plan has no minutes', async () => {
        fetchMinutesPanelForPlan.mockResolvedValue({ data: { exists: true, minutes: [] } });
        renderWithChakra(<WgMinutesSection workingGroupPlanIdentifier="2025-2026-sfsu-web" workingGroupName="Web" accentColor="teal.500" />);
        expect(await screen.findByText(/no meeting minutes yet/i)).toBeInTheDocument();
    });
});
