/**
 * RTL tests for the People stat strip. Verifies the four diagnostic tiles
 * render and that the Approvers / No-working-group / Not-in-PD tiles behave as
 * toggle filters (with the neutral Active People tile clearing).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

import PeopleStatStrip from './PeopleStatStrip';

const renderStrip = (props = {}) => render(
    <ChakraProvider>
        <PeopleStatStrip total={12} approvers={3} noWorkingGroup={2} roleNotInPd={1} {...props} />
    </ChakraProvider>,
);

// A tile is a role="button" Box; find it via its (unique) label text.
const tile = (label) => screen.getByText(label).closest('[role="button"]');

describe('PeopleStatStrip', () => {
    it('renders all four diagnostic tiles with their counts', () => {
        renderStrip();
        ['Active People', 'Approvers', '⚠ No working group', '⚠ Role not in PD']
            .forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('activates the Approvers tile as a filter when clicked', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'all', onFilterChange });

        await userEvent.click(tile('Approvers'));
        expect(onFilterChange).toHaveBeenCalledWith('approvers');
    });

    it('toggles an active filter back off when its tile is clicked again', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'noWorkingGroup', onFilterChange });

        await userEvent.click(tile('⚠ No working group'));
        expect(onFilterChange).toHaveBeenCalledWith('all');
    });

    it('activates the Role-not-in-PD tile as a filter when clicked', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'all', onFilterChange });

        await userEvent.click(tile('⚠ Role not in PD'));
        expect(onFilterChange).toHaveBeenCalledWith('roleNotInPd');
    });

    it('clears an active filter when the neutral tile is clicked', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'approvers', onFilterChange });

        await userEvent.click(tile('Active People'));
        expect(onFilterChange).toHaveBeenCalledWith('all');
    });

    it('does nothing when the neutral tile is clicked with no filter active', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'all', onFilterChange });

        await userEvent.click(tile('Active People'));
        expect(onFilterChange).not.toHaveBeenCalled();
    });

    it('marks the active filter tile with aria-pressed', () => {
        renderStrip({ activeFilter: 'approvers', onFilterChange: jest.fn() });
        expect(tile('Approvers')).toHaveAttribute('aria-pressed', 'true');
        expect(tile('⚠ Role not in PD')).toHaveAttribute('aria-pressed', 'false');
    });

    it('renders ellipses while loading', () => {
        renderStrip({ loading: true });
        expect(screen.getAllByText('…').length).toBe(4);
    });
});
