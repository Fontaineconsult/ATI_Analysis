/**
 * RTL tests for the v2 single-page CampusPlanContainer.
 *
 * Isolation strategy:
 *  - Service layer mocked: fetchCampusPlan (get) drives the whole page;
 *    createCampusPlan (post) drives the 404 → create flow. The remaining post
 *    mutators are bare jest.fn()s (only fired on interaction, never on render).
 *  - SettingsContext mocked to a fixed campus/year and a small campus list.
 *  - The two self-loading footer sections (Queries / Meeting Minutes) are stubbed
 *    so this test doesn't pull in their independent fetch machinery — they have
 *    their own suites (QueriesPanel / MeetingMinutesPanel).
 *  - axios is neutralized with the inline factory (CLAUDE.md) so any transitively
 *    imported service module loads without the ESM SyntaxError.
 *  - No DataProvider is rendered: useCampusPlans degrades to a direct-fetch
 *    no-cache path, which is exactly what we want to exercise here.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

jest.mock('../../../services/api/get', () => ({
    fetchCampusPlan: jest.fn(),
}));
jest.mock('../../../services/api/post', () => ({
    createCampusPlan: jest.fn(),
    assignExecutiveSponsor: jest.fn(),
    unassignExecutiveSponsor: jest.fn(),
    updateCampusPlanSummary: jest.fn(),
    assignGroupLead: jest.fn(),
    unassignGroupLead: jest.fn(),
    addProgressUpdate: jest.fn(),
    addPrioritizedIndicator: jest.fn(),
}));
jest.mock('../../../context/SettingsContext', () => ({
    useSettings: () => ({
        currentCampus: 'sfsu',
        currentAcademicYear: '2025-2026',
        campuses: [
            { abbreviation: 'sfsu', name: 'San Francisco State University' },
            { abbreviation: 'sjsu', name: 'San José State University' },
        ],
    }),
}));
// The footer sections self-load queries/minutes — irrelevant to the shell test.
jest.mock('./WgQueriesSection', () => ({ __esModule: true, default: () => null }));
jest.mock('./WgMinutesSection', () => ({ __esModule: true, default: () => null }));

import { fetchCampusPlan } from '../../../services/api/get';
import { createCampusPlan } from '../../../services/api/post';
import CampusPlanContainer from './CampusPlanContainer';


const wgp = (identifier, working_group, extra = {}) => ({
    plan_identifier: identifier,
    working_group,
    prioritized_success_indicators: [],
    available_indicators: [],
    group_leads: [],
    plans: [],
    ...extra,
});

const priorSi = (unique_id, composite_key, success_indicator) => ({
    unique_id,
    composite_key,
    success_indicator,
    status_level: null,
    previous_status_level: null,
    companion_plans: [],
    progress: { yse_identifier: null, update_count: 0, updates: [] },
});

// Four working-group plans, including an empty Steering — the coordination group
// that carries no indicators but still gets a card.
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
        wgp('2025-2026-sfsu-web', 'Web'),
        wgp('2025-2026-sfsu-pro', 'Procurement', {
            prioritized_success_indicators: [
                priorSi('si1', '5.2-pro', 'ICT procurement processes'),
                priorSi('si2', '8.1-pro', 'EEAAP coverage'),
            ],
            group_leads: [{ unique_id: 'p1', name: 'Lee Lead', title: 'Buyer' }],
        }),
        wgp('2025-2026-sfsu-ins', 'Instructional Materials'),
        wgp('2025-2026-sfsu-ste', 'Steering'),
    ],
};

const renderPage = () => render(
    <ChakraProvider>
        <MemoryRouter>
            <CampusPlanContainer />
        </MemoryRouter>
    </ChakraProvider>,
);

beforeEach(() => {
    fetchCampusPlan.mockReset();
    createCampusPlan.mockReset();
});


describe('CampusPlanContainer (v2 single-page shell)', () => {
    it('shows a loading spinner while the fetch is in flight', () => {
        fetchCampusPlan.mockReturnValueOnce(new Promise(() => {})); // never resolves
        renderPage();
        expect(screen.getByText(/loading campus plan/i)).toBeInTheDocument();
    });

    it('renders the plan header, sponsors, presidents-report empty state, and four working-group cards', async () => {
        fetchCampusPlan.mockResolvedValueOnce({ status: 'success', data: PLAN_FIXTURE });
        renderPage();

        // Title + plan identifier.
        expect(await screen.findByRole('heading', { name: /^campus plan$/i })).toBeInTheDocument();
        expect(screen.getByText('2025-2026-sfsu')).toBeInTheDocument();

        // Executive Sponsors card (title is a Card heading) with name + title.
        expect(screen.getByRole('heading', { name: /executive sponsors/i })).toBeInTheDocument();
        expect(screen.getByText('Dana Sponsor')).toBeInTheDocument();
        expect(screen.getByText(/VP, IT/)).toBeInTheDocument();

        // President's Report empty-state copy is the v2 "Not uploaded for {year}."
        expect(screen.getByText(/not uploaded for 2025-2026/i)).toBeInTheDocument();

        // All four working groups render — names are Text, not headings (v2).
        ['Steering', 'Web', 'Instructional Materials', 'Procurement'].forEach((name) => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });

        // Procurement's indicators render via IndicatorRow, plus its lead.
        expect(screen.getByText('ICT procurement processes')).toBeInTheDocument();
        expect(screen.getByText('EEAAP coverage')).toBeInTheDocument();
        expect(screen.getByText('Lee Lead')).toBeInTheDocument();
    });

    it('renders working-group cards in the canonical Steering-first order', async () => {
        fetchCampusPlan.mockResolvedValueOnce({ status: 'success', data: PLAN_FIXTURE });
        renderPage();

        await screen.findByRole('heading', { name: /^campus plan$/i });

        // Each card emits a "Prioritized Indicators (n)" label — one per card.
        const cardLabels = screen.getAllByText(/prioritized indicators \(/i);
        expect(cardLabels).toHaveLength(4);
        // Steering (empty) leads; Procurement (the indicator-bearing group) trails.
        expect(cardLabels[0].textContent).toMatch(/\(0\)/);   // Steering
        expect(cardLabels[3].textContent).toMatch(/\(2\)/);   // Procurement
    });

    it('shows the empty-indicator state for the Steering card', async () => {
        fetchCampusPlan.mockResolvedValueOnce({ status: 'success', data: PLAN_FIXTURE });
        renderPage();

        await screen.findByText('Steering');
        // Web, Instructional Materials, and Steering are all empty here.
        expect(screen.getAllByText(/no indicators prioritized yet/i).length).toBeGreaterThanOrEqual(1);
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
        renderPage();

        const link = await screen.findByRole('link', { name: /sfsu-2025-2026-president-summary\.pdf/ });
        expect(link).toHaveAttribute('href', 'https://example.invalid/reports/sfsu-2025-2026.pdf');
    });

    it('shows the Create Campus Plan button when the GET returns 404', async () => {
        const err = new Error('Request failed with status code 404');
        err.response = { status: 404 };
        fetchCampusPlan.mockRejectedValueOnce(err);

        renderPage();

        expect(await screen.findByRole('button', { name: /create campus plan/i })).toBeInTheDocument();
        expect(screen.getByText(/no plan exists yet for sfsu in 2025-2026/i)).toBeInTheDocument();
    });

    it('shows a generic error message for non-404 failures', async () => {
        fetchCampusPlan.mockRejectedValueOnce(new Error('Network unreachable'));
        renderPage();

        expect(await screen.findByText(/error: network unreachable/i)).toBeInTheDocument();
    });

    it('clicking Create Campus Plan POSTs and re-fetches, then renders the new plan', async () => {
        const notFoundErr = new Error('not found');
        notFoundErr.response = { status: 404 };
        fetchCampusPlan
            .mockRejectedValueOnce(notFoundErr)
            .mockResolvedValueOnce({ status: 'success', data: PLAN_FIXTURE });
        createCampusPlan.mockResolvedValueOnce({
            status: 'success',
            data: { plan_identifier: '2025-2026-sfsu' },
        });

        renderPage();

        const createButton = await screen.findByRole('button', { name: /create campus plan/i });
        await userEvent.click(createButton);

        await waitFor(() => expect(createCampusPlan).toHaveBeenCalledWith('sfsu', '2025-2026'));
        // The re-fetched plan renders — Steering (and every other) card is present.
        expect(await screen.findByText('Steering')).toBeInTheDocument();
        expect(fetchCampusPlan).toHaveBeenCalledTimes(2);
    });
});
