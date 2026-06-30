/**
 * RTL tests for CampusPlanContainer.
 *
 * Mocks the service layer (fetchCampusPlan / createCampusPlan) and the
 * SettingsContext hook so the component renders in isolation, no HTTP, no
 * router, no app-level providers other than ChakraProvider.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';

// axios v1 is ESM and CRA's Jest doesn't transform node_modules; the inline
// factory (see CLAUDE.md) neutralizes it so the WorkingGroupPlan children's
// transitive auth/services imports load under jsdom.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

// The embedded Queries / Meeting-Minutes panels each fetch on mount and have
// their own suites; stub them so this suite stays focused on the container.
jest.mock('../query_components/QueriesPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../meeting_minutes_components/MeetingMinutesPanel', () => ({ __esModule: true, default: () => null }));

jest.mock('../../../services/api/get', () => ({
    fetchCampusPlan: jest.fn(),
}));
jest.mock('../../../services/api/post', () => ({
    createCampusPlan: jest.fn(),
}));
jest.mock('../../../context/SettingsContext', () => ({
    useSettings: () => ({
        currentCampus: 'sfsu',
        currentAcademicYear: '2025-2026',
    }),
}));

import { fetchCampusPlan } from '../../../services/api/get';
import { createCampusPlan } from '../../../services/api/post';
import CampusPlanContainer from './CampusPlanContainer';


const PLAN_FIXTURE = {
    plan_identifier: '2025-2026-sfsu',
    academic_year: '2025-2026',
    campus: { abbreviation: 'sfsu', name: 'San Francisco State University' },
    executive_summary: null,
    executive_sponsors: [
        { unique_id: 's1', name: 'Dana Sponsor', title: 'VP, IT' },
    ],
    presidents_report: null,
    working_group_plans: [
        {
            plan_identifier: '2025-2026-sfsu-web',
            working_group: 'Web',
            prioritized_success_indicators: [],
            available_indicators: [],
            group_leads: [],
            plans: [],
        },
        {
            plan_identifier: '2025-2026-sfsu-pro',
            working_group: 'Procurement',
            prioritized_success_indicators: [
                { unique_id: 'si1', composite_key: '5.2-pro', success_indicator: 'ICT procurement processes', companion_plans: [], progress: { yse_identifier: null, update_count: 0, latest: null } },
                { unique_id: 'si2', composite_key: '8.1-pro', success_indicator: 'EEAAP coverage', companion_plans: [], progress: { yse_identifier: null, update_count: 0, latest: null } },
            ],
            available_indicators: [],
            group_leads: [{ unique_id: 'p1', name: 'Lee Lead', title: 'Buyer' }],
            plans: [],
        },
        {
            plan_identifier: '2025-2026-sfsu-ins',
            working_group: 'Instructional Materials',
            prioritized_success_indicators: [],
            available_indicators: [],
            group_leads: [],
            plans: [],
        },
    ],
};

// MemoryRouter is needed because the rendered WorkingGroupPlan children wrap
// plan cards in react-router Links, which require a router context.
const renderWithChakra = (ui) => render(
    <ChakraProvider>
        <MemoryRouter>{ui}</MemoryRouter>
    </ChakraProvider>
);

beforeEach(() => {
    fetchCampusPlan.mockReset();
    createCampusPlan.mockReset();
});


describe('CampusPlanContainer', () => {
    it('shows a loading spinner while the fetch is in flight', () => {
        // Never-resolving promise keeps it in loading state.
        fetchCampusPlan.mockReturnValueOnce(new Promise(() => {}));
        renderWithChakra(<CampusPlanContainer />);
        expect(screen.getByText(/loading campus plan/i)).toBeInTheDocument();
    });

    it('renders the parent plan, sponsors, presidents-report state, and the working group tabs', async () => {
        fetchCampusPlan.mockResolvedValueOnce({ status: 'success', data: PLAN_FIXTURE });
        renderWithChakra(<CampusPlanContainer />);

        // Heading + identifier
        expect(await screen.findByRole('heading', { name: /^campus plan$/i })).toBeInTheDocument();
        expect(screen.getByText('2025-2026-sfsu')).toBeInTheDocument();

        // Executive Sponsors render with name + title
        expect(screen.getByRole('heading', { name: /executive sponsors/i })).toBeInTheDocument();
        expect(screen.getByText('Dana Sponsor')).toBeInTheDocument();
        expect(screen.getByText(/VP, IT/)).toBeInTheDocument();

        // President's Report empty-state copy
        expect(screen.getByText(/no president's report yet/i)).toBeInTheDocument();

        // All three working groups render as tabs.
        expect(screen.getByRole('tab', { name: /Web/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Procurement/ })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Instructional Materials/ })).toBeInTheDocument();

        // Web is the first (default) tab — its panel and heading render.
        expect(screen.getByRole('heading', { name: 'Web' })).toBeInTheDocument();

        // Switching to Procurement lazily mounts its panel: indicators + lead.
        await userEvent.click(screen.getByRole('tab', { name: /Procurement/ }));
        expect(await screen.findByText('ICT procurement processes')).toBeInTheDocument();
        expect(screen.getByText('Lee Lead')).toBeInTheDocument();
    });

    it('renders a download link when presidents_report is present', async () => {
        const withReport = {
            ...PLAN_FIXTURE,
            presidents_report: {
                hash: 'abc123',
                name: 'sfsu-2025-2026-president-summary.pdf',
                uri_path: 'https://example.invalid/reports/sfsu-2025-2026.pdf',
                file_path: null,
            },
        };
        fetchCampusPlan.mockResolvedValueOnce({ status: 'success', data: withReport });
        renderWithChakra(<CampusPlanContainer />);

        const link = await screen.findByRole('link', { name: /sfsu-2025-2026-president-summary\.pdf/ });
        expect(link).toHaveAttribute('href', 'https://example.invalid/reports/sfsu-2025-2026.pdf');
    });

    it('shows the Create Plan button when the GET returns 404', async () => {
        const err = new Error('Request failed with status code 404');
        err.response = { status: 404 };
        fetchCampusPlan.mockRejectedValueOnce(err);

        renderWithChakra(<CampusPlanContainer />);

        const createButton = await screen.findByRole('button', { name: /create campus plan/i });
        expect(createButton).toBeInTheDocument();
        expect(screen.getByText(/no plan exists yet for sfsu in 2025-2026/i)).toBeInTheDocument();
    });

    it('shows a generic error message for non-404 failures', async () => {
        fetchCampusPlan.mockRejectedValueOnce(new Error('Network unreachable'));
        renderWithChakra(<CampusPlanContainer />);

        expect(await screen.findByText(/error: network unreachable/i)).toBeInTheDocument();
    });

    it('clicking Create Plan POSTs and re-fetches, then renders the new plan', async () => {
        // First fetch: 404. Then create succeeds. Then second fetch returns the plan.
        const notFoundErr = new Error('not found');
        notFoundErr.response = { status: 404 };
        fetchCampusPlan
            .mockRejectedValueOnce(notFoundErr)
            .mockResolvedValueOnce({ status: 'success', data: PLAN_FIXTURE });
        createCampusPlan.mockResolvedValueOnce({
            status: 'success',
            data: { plan_identifier: '2025-2026-sfsu' },
        });

        renderWithChakra(<CampusPlanContainer />);

        const createButton = await screen.findByRole('button', { name: /create campus plan/i });
        await userEvent.click(createButton);

        await waitFor(() =>
            expect(createCampusPlan).toHaveBeenCalledWith('sfsu', '2025-2026')
        );
        expect(await screen.findByRole('heading', { name: 'Web' })).toBeInTheDocument();
        expect(fetchCampusPlan).toHaveBeenCalledTimes(2);
    });
});
