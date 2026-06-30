import React from 'react';
import { render, screen } from '@testing-library/react';
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
jest.mock('../../../services/api/get', () => ({ fetchMinutesPanelForPlan: jest.fn() }));
jest.mock('../../../services/api/delete', () => ({ deleteMeetingMinutes: jest.fn() }));

import { fetchMinutesPanelForPlan } from '../../../services/api/get';
import MeetingMinutesPanel from './MeetingMinutesPanel';

const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

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
});
