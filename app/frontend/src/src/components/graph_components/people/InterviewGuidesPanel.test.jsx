import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
jest.mock('../../../services/api/get', () => ({
    fetchInterviewGuidesForCampusYear: jest.fn(),
    fetchAllCommunities: jest.fn(),
    fetchYsesByCampusForYear: jest.fn(),
}));
jest.mock('../../../services/api/delete', () => ({ deleteInterviewGuide: jest.fn() }));
jest.mock('../../../context/SettingsContext', () => ({
    useSettings: () => ({ currentAcademicYear: '2025-2026' }),
}));
// The edit form pulls UserContext + put services; it opens only on Edit.
jest.mock('./InterviewGuideForm', () => ({ __esModule: true, default: () => null }));

import {
    fetchAllCommunities, fetchInterviewGuidesForCampusYear, fetchYsesByCampusForYear,
} from '../../../services/api/get';
import InterviewGuidesPanel, { guideClosure } from './InterviewGuidesPanel';

const GUIDES = [
    {
        unique_id: 'g1',
        title: 'Prep: Library alternative-access process',
        meeting_date: '2026-08-07',
        content: '# The guide body',
        prepared_for: [{ unique_id: 'p1', name: 'Christy Stevens' }],
        targets: [{ year_identifier: '2025-2026-7.11-ins-sfsu', composite_key: '7.11-ins' }],
        pertains_to_communities: [{ unique_id: 'c1', name: 'Library' }],
        working_groups: ['Instructional Materials'],
        resulted_in: { unique_id: 'mm1', title: 'Library minutes', meeting_date: '2026-08-07' },
    },
    {
        unique_id: 'g2',
        title: 'Prep: overdue meeting',
        meeting_date: '2000-01-01',
        prepared_for: [], targets: [], pertains_to_communities: [],
        resulted_in: null,
    },
    {
        unique_id: 'g3',
        title: 'Prep: future meeting',
        meeting_date: '2099-01-01',
        prepared_for: [], targets: [], pertains_to_communities: [],
        resulted_in: null,
    },
];

const renderPanel = () => render(
    <ChakraProvider>
        <MemoryRouter initialEntries={['/ati/sfsu/ati-explorer/people/interview-guides']}>
            <Routes>
                <Route path="/ati/:campus/ati-explorer/people/interview-guides" element={<InterviewGuidesPanel />} />
            </Routes>
        </MemoryRouter>
    </ChakraProvider>,
);

describe('guideClosure', () => {
    it('held with minutes, unclosed past date, upcoming otherwise', () => {
        expect(guideClosure({ resulted_in: { unique_id: 'x' } })).toBe('held');
        expect(guideClosure({ resulted_in: null, meeting_date: '2000-01-01' })).toBe('unclosed');
        expect(guideClosure({ resulted_in: null, meeting_date: '2099-01-01' })).toBe('upcoming');
        expect(guideClosure({ resulted_in: null, meeting_date: null })).toBe('upcoming');
    });
});

describe('InterviewGuidesPanel', () => {
    beforeEach(() => {
        fetchInterviewGuidesForCampusYear.mockResolvedValue({
            status: 'success',
            data: { campus_abbrev: 'sfsu', academic_year: '2025-2026', guides: GUIDES, minutes_candidates: [] },
        });
        fetchAllCommunities.mockResolvedValue({ data: { items: [] } });
        fetchYsesByCampusForYear.mockResolvedValue({ data: { campuses: [] } });
    });

    it('lists guides with closure state, targets, communities, and people', async () => {
        renderPanel();
        expect(await screen.findByText('Prep: Library alternative-access process')).toBeInTheDocument();
        expect(screen.getByText('held')).toBeInTheDocument();
        expect(screen.getByText('unclosed')).toBeInTheDocument();
        expect(screen.getByText('upcoming')).toBeInTheDocument();
        expect(screen.getByText('7.11-ins')).toBeInTheDocument();
        expect(screen.getByText('Library')).toBeInTheDocument();
        expect(screen.getByText('Christy Stevens')).toBeInTheDocument();
    });

    it('opens the read modal with the Markdown body and the closure pairing', async () => {
        renderPanel();
        fireEvent.click(await screen.findByRole('button', { name: /open interview guide: prep: library/i }));
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('The guide body');
        expect(dialog).toHaveTextContent('Library minutes');
        expect(dialog).toHaveTextContent('Instructional Materials');
    });

    it('shows the empty state when the campus/year has no guides', async () => {
        fetchInterviewGuidesForCampusYear.mockResolvedValue({
            status: 'success', data: { guides: [], minutes_candidates: [] },
        });
        renderPanel();
        expect(await screen.findByText(/no interview guides for this campus and year yet/i)).toBeInTheDocument();
    });
});
