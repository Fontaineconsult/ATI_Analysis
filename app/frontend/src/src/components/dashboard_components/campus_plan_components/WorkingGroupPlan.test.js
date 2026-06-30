import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';

// axios v1 is ESM and CRA's Jest doesn't transform node_modules; neutralize it with the
// inline factory (see CLAUDE.md) so WorkingGroupPlan's transitive UserContext → services/api
// imports load under jsdom.
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));

// The embedded Queries / Meeting-Minutes panels each fetch on mount and have their own
// suites; stub them out so this suite stays focused on the WGP layout + indicators.
jest.mock('../query_components/QueriesPanel', () => ({ __esModule: true, default: () => null }));
jest.mock('../meeting_minutes_components/MeetingMinutesPanel', () => ({ __esModule: true, default: () => null }));

// Service mocks for the prioritized-indicator, progress-update, and group-lead flows.
jest.mock('../../../services/api/post', () => ({
    addPrioritizedIndicator: jest.fn(),
    removePrioritizedIndicator: jest.fn(),
    addProgressUpdate: jest.fn(),
    assignGroupLead: jest.fn(),
    unassignGroupLead: jest.fn(),
}));

import { addPrioritizedIndicator, addProgressUpdate } from '../../../services/api/post';
import WorkingGroupPlan from './WorkingGroupPlan';


// MemoryRouter wraps the render because plan cards become react-router Links,
// which require a router context to mount.
const renderWithChakra = (ui) => render(
    <ChakraProvider>
        <MemoryRouter>{ui}</MemoryRouter>
    </ChakraProvider>
);

const baseWgp = {
    plan_identifier: '2025-2026-sfsu-web',
    working_group: 'Web',
    prioritized_success_indicators: [],
    available_indicators: [],
    group_leads: [],
    plans: [],
};

beforeEach(() => {
    addPrioritizedIndicator.mockReset();
    addProgressUpdate.mockReset();
});


describe('WorkingGroupPlan', () => {
    it('renders the working group name and identifier', () => {
        renderWithChakra(<WorkingGroupPlan wgp={baseWgp} />);
        expect(screen.getByRole('heading', { name: 'Web' })).toBeInTheDocument();
        expect(screen.getByText('2025-2026-sfsu-web')).toBeInTheDocument();
    });

    it('shows empty-state copy for indicators, leads, and plans when none are attached', () => {
        renderWithChakra(<WorkingGroupPlan wgp={baseWgp} />);
        expect(screen.getByText(/none selected/i)).toBeInTheDocument();
        expect(screen.getByText(/no leads assigned/i)).toBeInTheDocument();
        expect(screen.getByText(/no campus-plan plans yet/i)).toBeInTheDocument();
    });

    it('wraps each plan card in a link to /<campus>/ati-explorer/plans/<unique_id>', () => {
        const wgp = {
            ...baseWgp,
            plans: [
                {
                    unique_id: 'plan-uuid-abc',
                    name: 'Captioning rollout',
                    description: 'fallback',
                    plan_status: 'In Progress',
                    abandoned: false,
                    is_campus_plan: true,
                    academic_year: '2025-2026',
                    completed_year: null,
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} campusAbbrev="sfsu" />);

        const link = screen.getByRole('link', { name: /captioning rollout/i });
        expect(link).toHaveAttribute('href', '/sfsu/ati-explorer/plans/plan-uuid-abc');
    });

    it('collapses and re-expands the plans list when its header is clicked', async () => {
        const wgp = {
            ...baseWgp,
            plans: [
                {
                    unique_id: 'p1',
                    name: 'Captioning rollout',
                    description: 'desc',
                    plan_status: 'In Progress',
                    abandoned: false,
                    is_campus_plan: true,
                    academic_year: '2025-2026',
                    completed_year: null,
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} campusAbbrev="sfsu" />);

        // Default: expanded — aria-label says "Collapse" and aria-expanded=true.
        const expandedHeader = screen.getByRole('button', { name: /collapse plan details/i });
        expect(expandedHeader).toHaveAttribute('aria-expanded', 'true');

        // Click → header relabels to "Expand" and aria-expanded=false.
        // (Chakra's Collapse uses framer-motion; under jsdom the exit animation
        // doesn't fire, so we assert the user-facing state via aria, not by
        // querying for child visibility.)
        await userEvent.click(expandedHeader);
        const collapsedHeader = screen.getByRole('button', { name: /expand plan details/i });
        expect(collapsedHeader).toHaveAttribute('aria-expanded', 'false');

        // Click again → back to expanded.
        await userEvent.click(collapsedHeader);
        expect(
            screen.getByRole('button', { name: /collapse plan details/i })
        ).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders the plan card without a link when campusAbbrev is missing', () => {
        const wgp = {
            ...baseWgp,
            plans: [
                {
                    unique_id: 'plan-uuid-abc',
                    name: 'Captioning rollout',
                    description: 'fallback',
                    plan_status: null,
                    abandoned: false,
                    is_campus_plan: true,
                    academic_year: null,
                    completed_year: null,
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);
        // Plan content still renders, but no link wraps it.
        expect(screen.getByText('Captioning rollout')).toBeInTheDocument();
        expect(screen.queryByRole('link')).toBeNull();
    });

    it('renders the academic_year and completed_year on a plan card', () => {
        const wgp = {
            ...baseWgp,
            plans: [
                {
                    unique_id: 'p1',
                    name: 'Active plan',
                    description: 'Active plan',
                    plan_status: 'In Progress',
                    abandoned: false,
                    is_campus_plan: true,
                    academic_year: '2024-2025',
                    completed_year: null,
                },
                {
                    unique_id: 'p2',
                    name: 'Closed plan',
                    description: 'Closed plan',
                    plan_status: 'Complete',
                    abandoned: false,
                    is_campus_plan: true,
                    academic_year: '2023-2024',
                    completed_year: '2024-2025',
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);

        // Active plan: just the year, no "completed" suffix.
        expect(screen.getByText('2024-2025')).toBeInTheDocument();
        // Closed plan: year + completed-year suffix on the same line.
        expect(screen.getByText(/2023-2024 · completed 2024-2025/)).toBeInTheDocument();
    });

    it('renders prioritized indicators with composite_key + indicator text', () => {
        const wgp = {
            ...baseWgp,
            prioritized_success_indicators: [
                { unique_id: 'si1', composite_key: '1.1-web', success_indicator: 'Identify and repair inaccessible websites', companion_plans: [] },
                { unique_id: 'si2', composite_key: '2.3-web', success_indicator: 'Train developers on WCAG', companion_plans: [] },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);
        expect(screen.getByText('1.1-web')).toBeInTheDocument();
        expect(screen.getByText('Identify and repair inaccessible websites')).toBeInTheDocument();
        expect(screen.getByText('2.3-web')).toBeInTheDocument();
        expect(screen.getByText('Train developers on WCAG')).toBeInTheDocument();
    });

    it('renders the previous → current status progression on prioritized indicators', () => {
        const wgp = {
            ...baseWgp,
            prioritized_success_indicators: [
                {
                    unique_id: 'si1',
                    composite_key: '1.1-web',
                    success_indicator: 'Repair sites',
                    companion_plans: [],
                    progress: { yse_identifier: '2025-2026-1.1-web-sfsu', update_count: 0, updates: [] },
                    status_level: 'Defined',
                    previous_status_level: 'Initiated',
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);
        expect(screen.getByText('Initiated')).toBeInTheDocument();
        expect(screen.getByText('Defined')).toBeInTheDocument();
        expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('shows trajectory + all progress updates stacked under the indicator', () => {
        const wgp = {
            ...baseWgp,
            prioritized_success_indicators: [
                {
                    unique_id: 'si1',
                    composite_key: '1.1-web',
                    success_indicator: 'Captioning',
                    companion_plans: [],
                    progress: {
                        yse_identifier: '2025-2026-1.1-web-sfsu',
                        update_count: 3,
                        // Newest first.
                        updates: [
                            { update_date: '2026-02-03', trajectory: 'improving', note: 'Audit complete',  author_name: 'Dana Sponsor' },
                            { update_date: '2026-01-15', trajectory: 'on_track',  note: 'Backlog started', author_name: 'Dana Sponsor' },
                            { update_date: '2025-12-10', trajectory: 'stagnant',  note: 'Funding stuck',   author_name: null },
                        ],
                    },
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);

        // Pill on the row uses the latest (first) update's trajectory.
        // Same label also appears on the timeline entry, so assert "at least one".
        expect(screen.getAllByText('Improving').length).toBeGreaterThanOrEqual(1);

        // All three updates render in the timeline.
        expect(screen.getByText(/Audit complete/)).toBeInTheDocument();
        expect(screen.getByText(/Backlog started/)).toBeInTheDocument();
        expect(screen.getByText(/Funding stuck/)).toBeInTheDocument();

        // Dates render too.
        expect(screen.getByText('2026-02-03')).toBeInTheDocument();
        expect(screen.getByText('2025-12-10')).toBeInTheDocument();
    });

    it('renders a View button per prioritized indicator linking to the evidence page', () => {
        const wgp = {
            ...baseWgp,
            prioritized_success_indicators: [
                {
                    unique_id: 'si-ins',
                    composite_key: '1.1-ins',
                    success_indicator: 'Timely IM adoption',
                    companion_plans: [],
                    progress: { yse_identifier: null, update_count: 0, updates: [] },
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} campusAbbrev="sfsu" />);

        // composite_key 1.1-ins → suffix "ins" → "instructional-materials"; goal=1, indicator=1
        const viewLink = screen.getByRole('link', { name: /^View$/ });
        expect(viewLink).toHaveAttribute(
            'href',
            '/sfsu/dashboard/reports/instructional-materials/1/1'
        );
    });

    it('renders a Log button only when the indicator has a yse_identifier', () => {
        const wgp = {
            ...baseWgp,
            prioritized_success_indicators: [
                {
                    unique_id: 'si1',
                    composite_key: '1.1-web',
                    success_indicator: 'Has YSE',
                    companion_plans: [],
                    progress: { yse_identifier: '2025-2026-1.1-web-sfsu', update_count: 0, updates: [] },
                },
                {
                    unique_id: 'si2',
                    composite_key: '2.3-web',
                    success_indicator: 'No YSE',
                    companion_plans: [],
                    progress: { yse_identifier: null, update_count: 0, updates: [] },
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);
        // One Log button (for the indicator with a YSE), not two.
        expect(screen.getAllByRole('button', { name: /^Log$/ }).length).toBe(1);
    });

    it('opens the progress modal when Log is clicked and submits a ProgressUpdate', async () => {
        addProgressUpdate.mockResolvedValueOnce({ status: 'success' });
        const onProgressAdded = jest.fn().mockResolvedValue();
        const wgp = {
            ...baseWgp,
            prioritized_success_indicators: [
                {
                    unique_id: 'si1',
                    composite_key: '1.1-web',
                    success_indicator: 'Captioning',
                    companion_plans: [],
                    progress: { yse_identifier: '2025-2026-1.1-web-sfsu', update_count: 0, updates: [] },
                },
            ],
        };
        renderWithChakra(
            <WorkingGroupPlan wgp={wgp} onProgressAdded={onProgressAdded} currentUserUniqueId="u-42" />
        );

        await userEvent.click(screen.getByRole('button', { name: /^Log$/ }));

        // Modal opens — confirmed by the indicator label appearing inside it
        // (the heading text "Log progress" also appears on the submit button,
        // so checking by the unique indicator label avoids the ambiguity).
        expect(screen.getByText(/1\.1-web — Captioning/)).toBeInTheDocument();

        // Fill the form. Chakra's FormControl/FormLabel wiring under jsdom
        // doesn't always associate label→input cleanly, so we query by
        // placeholder (textarea) and by role (select) instead of label text.
        await userEvent.type(
            screen.getByPlaceholderText(/what changed since the last update/i),
            'Started backlog audit'
        );
        await userEvent.selectOptions(screen.getByRole('combobox'), 'improving');

        // Submit — there's a "Log progress" button in the footer
        const submitButtons = screen.getAllByRole('button', { name: /^Log progress$/ });
        await userEvent.click(submitButtons[submitButtons.length - 1]);

        await waitFor(() => expect(addProgressUpdate).toHaveBeenCalledWith(
            '2025-2026-sfsu-web',
            '2025-2026-1.1-web-sfsu',
            { note: 'Started backlog audit', trajectory: 'improving', authorUniqueId: 'u-42' }
        ));
        await waitFor(() => expect(onProgressAdded).toHaveBeenCalledTimes(1));
    });

    it('no longer renders the companion-plan count on indicator rows (it lives in the Plans panel)', () => {
        const wgp = {
            ...baseWgp,
            prioritized_success_indicators: [
                {
                    unique_id: 'si1',
                    composite_key: '1.1-web',
                    success_indicator: 'Captioning',
                    companion_plans: [
                        { unique_id: 'p1', name: 'Plan A' },
                    ],
                },
                {
                    unique_id: 'si2',
                    composite_key: '2.3-web',
                    success_indicator: 'Training',
                    companion_plans: [
                        { unique_id: 'p2', name: 'Plan B' },
                        { unique_id: 'p3', name: 'Plan C' },
                    ],
                },
                {
                    unique_id: 'si3',
                    composite_key: '3.1-web',
                    success_indicator: 'Audit',
                    companion_plans: [],
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);
        // Indicators still render…
        expect(screen.getByText('Captioning')).toBeInTheDocument();
        expect(screen.getByText('Training')).toBeInTheDocument();
        // …but the per-row companion-plan count was removed (redundant with the Plans panel).
        expect(screen.queryByText('1 plan')).toBeNull();
        expect(screen.queryByText('2 plans')).toBeNull();
        expect(screen.queryByText(/no plan yet/i)).toBeNull();
    });

    it('renders group leads with name + optional title', () => {
        const wgp = {
            ...baseWgp,
            group_leads: [
                { unique_id: 'p1', name: 'Alex Lead', title: 'Web Accessibility Lead' },
                { unique_id: 'p2', name: 'Casey Member', title: null },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);
        expect(screen.getByText('Alex Lead')).toBeInTheDocument();
        expect(screen.getByText(/Web Accessibility Lead/)).toBeInTheDocument();
        expect(screen.getByText('Casey Member')).toBeInTheDocument();
    });

    it('renders each attached plan with its name and status', () => {
        const wgp = {
            ...baseWgp,
            plans: [
                {
                    unique_id: 'p1',
                    name: 'Captioning rollout',
                    description: 'fallback desc',
                    plan_status: 'In Progress',
                    abandoned: false,
                    is_campus_plan: true,
                },
                {
                    unique_id: 'p2',
                    name: null,
                    description: 'Procurement training overhaul',
                    plan_status: null,
                    abandoned: false,
                    is_campus_plan: true,
                },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);

        // First plan: name + its status badge ("In Progress", not the old "Status: …" row).
        expect(screen.getByText('Captioning rollout')).toBeInTheDocument();
        expect(screen.getByText('In Progress')).toBeInTheDocument();

        // Second plan: name null → falls back to description; null status → "Not Started" badge.
        expect(screen.getByText('Procurement training overhaul')).toBeInTheDocument();
        expect(screen.getByText('Not Started')).toBeInTheDocument();
    });

    it('renders the + Add Indicator button next to the Prioritized Indicators heading', () => {
        renderWithChakra(<WorkingGroupPlan wgp={baseWgp} />);
        expect(
            screen.getByRole('button', { name: /\+ Add Indicator/i })
        ).toBeInTheDocument();
    });

    it('opens the indicator selector modal when + Add Indicator is clicked', async () => {
        const wgp = {
            ...baseWgp,
            available_indicators: [
                { unique_id: 'si1', composite_key: '1.1-web', success_indicator: 'Repair inaccessible websites', removed: false, status_level: 'Established', previous_status_level: 'Defined' },
                { unique_id: 'si2', composite_key: '2.3-web', success_indicator: 'Train developers', removed: false, status_level: null, previous_status_level: null },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);

        await userEvent.click(screen.getByRole('button', { name: /\+ Add Indicator/i }));

        // Modal heading (Chakra renders ModalHeader as <header>, not a real heading role)
        expect(screen.getByText(/add prioritized indicator — web/i)).toBeInTheDocument();
        // Both indicators rendered as rows
        expect(screen.getByText('1.1-web')).toBeInTheDocument();
        expect(screen.getByText('Repair inaccessible websites')).toBeInTheDocument();
        // Status progression pills surface on the modal rows too
        expect(screen.getByText('Defined')).toBeInTheDocument();
        expect(screen.getByText('Established')).toBeInTheDocument();
    });

    it('shows "Prioritized" badge for indicators already on the WGP', async () => {
        const wgp = {
            ...baseWgp,
            prioritized_success_indicators: [
                { unique_id: 'si1', composite_key: '1.1-web', success_indicator: 'Repair', companion_plans: [] },
            ],
            available_indicators: [
                { unique_id: 'si1', composite_key: '1.1-web', success_indicator: 'Repair', removed: false },
                { unique_id: 'si2', composite_key: '2.3-web', success_indicator: 'Train', removed: false },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);

        await userEvent.click(screen.getByRole('button', { name: /\+ Add Indicator/i }));

        // Already-prioritized row shows the badge instead of an Add button.
        expect(screen.getByText(/^Prioritized$/)).toBeInTheDocument();
        // The other row still has an Add button.
        const addButtons = screen.getAllByRole('button', { name: /^Add$/ });
        expect(addButtons.length).toBe(1);
    });

    it('calls addPrioritizedIndicator + onIndicatorAdded when clicking Add in the modal', async () => {
        addPrioritizedIndicator.mockResolvedValueOnce({ status: 'success' });
        const onIndicatorAdded = jest.fn().mockResolvedValue();
        const wgp = {
            ...baseWgp,
            available_indicators: [
                { unique_id: 'si1', composite_key: '1.1-web', success_indicator: 'Repair', removed: false },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} onIndicatorAdded={onIndicatorAdded} />);

        await userEvent.click(screen.getByRole('button', { name: /\+ Add Indicator/i }));
        await userEvent.click(screen.getByRole('button', { name: /^Add$/ }));

        await waitFor(() =>
            expect(addPrioritizedIndicator).toHaveBeenCalledWith('2025-2026-sfsu-web', '1.1-web')
        );
        await waitFor(() => expect(onIndicatorAdded).toHaveBeenCalledTimes(1));
    });

    it('renders nothing when wgp is missing', () => {
        renderWithChakra(<WorkingGroupPlan wgp={null} />);
        // ChakraProvider injects an env sentinel span as the container's first
        // child, so we can't compare container.firstChild to null. Instead
        // assert that no actual component content rendered.
        expect(screen.queryAllByRole('heading')).toHaveLength(0);
        expect(screen.queryByText(/no campus-plan plans yet/i)).toBeNull();
    });
});
