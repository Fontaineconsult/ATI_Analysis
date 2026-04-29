import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

import WorkingGroupPlan from './WorkingGroupPlan';


const renderWithChakra = (ui) => render(<ChakraProvider>{ui}</ChakraProvider>);

const baseWgp = {
    plan_identifier: '2025-2026-sfsu-web',
    working_group: 'Web',
    prioritized_success_indicators: [],
    group_leads: [],
    plans: [],
};


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
                { unique_id: 'si1', composite_key: '1.1-web', success_indicator: 'Identify and repair inaccessible websites' },
                { unique_id: 'si2', composite_key: '2.3-web', success_indicator: 'Train developers on WCAG' },
            ],
        };
        renderWithChakra(<WorkingGroupPlan wgp={wgp} />);
        expect(screen.getByText('1.1-web')).toBeInTheDocument();
        expect(screen.getByText('Identify and repair inaccessible websites')).toBeInTheDocument();
        expect(screen.getByText('2.3-web')).toBeInTheDocument();
        expect(screen.getByText('Train developers on WCAG')).toBeInTheDocument();
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

        // First plan: shows name + status
        expect(screen.getByText('Captioning rollout')).toBeInTheDocument();
        expect(screen.getByText(/Status: In Progress/)).toBeInTheDocument();

        // Second plan: name null → falls back to description; no status row
        expect(screen.getByText('Procurement training overhaul')).toBeInTheDocument();
        expect(screen.queryByText(/Status:/i)).not.toBeNull();  // sanity: only the first one's row
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
