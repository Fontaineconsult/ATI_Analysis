/**
 * RTL tests for the Campus Plan stat strip (design handoff v2 §2). Verifies the
 * five diagnostic tiles render from summarizeCampusPlan and that the At-Risk /
 * Stale tiles behave as toggle filters (with the neutral tiles clearing).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

import CampusPlanStatStrip from './CampusPlanStatStrip';

// One SI that is both at-risk (trajectory) and stale (very old date), so both
// diagnostic counts are 1 regardless of when the suite runs.
const PLAN = {
    working_group_plans: [
        {
            working_group: 'Web',
            prioritized_success_indicators: [
                { progress: { updates: [{ update_date: '2000-01-01', trajectory: 'at_risk' }] } },
            ],
            plans: [{ unique_id: 'x' }],
        },
        { working_group: 'Steering', prioritized_success_indicators: [], plans: [] },
    ],
};

const renderStrip = (props = {}) => render(
    <ChakraProvider>
        <CampusPlanStatStrip plan={PLAN} {...props} />
    </ChakraProvider>,
);

// A tile is a role="button" Box; find it via its (unique) label text.
const tile = (label) => screen.getByText(label).closest('[role="button"]');

describe('CampusPlanStatStrip', () => {
    it('renders all five diagnostic tiles', () => {
        renderStrip();
        ['Working Groups', 'Prioritized Indicators', 'Plans', '⚠ At-Risk', 'Stale > 30d']
            .forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    });

    it('activates the At-Risk tile as a filter when clicked', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'all', onFilterChange });

        await userEvent.click(tile('⚠ At-Risk'));
        expect(onFilterChange).toHaveBeenCalledWith('risk');
    });

    it('toggles the At-Risk filter back off when it is already active', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'risk', onFilterChange });

        await userEvent.click(tile('⚠ At-Risk'));
        expect(onFilterChange).toHaveBeenCalledWith('all');
    });

    it('activates the Stale tile as a filter when clicked', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'all', onFilterChange });

        await userEvent.click(tile('Stale > 30d'));
        expect(onFilterChange).toHaveBeenCalledWith('stale');
    });

    it('clears an active filter when a neutral tile is clicked', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'risk', onFilterChange });

        await userEvent.click(tile('Working Groups'));
        expect(onFilterChange).toHaveBeenCalledWith('all');
    });

    it('does nothing when a neutral tile is clicked with no filter active', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'all', onFilterChange });

        await userEvent.click(tile('Plans'));
        expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('marks the active filter tile with aria-pressed', () => {
        renderStrip({ activeFilter: 'risk', onFilterChange: jest.fn() });
        expect(tile('⚠ At-Risk')).toHaveAttribute('aria-pressed', 'true');
        expect(tile('Stale > 30d')).toHaveAttribute('aria-pressed', 'false');
    });
});
