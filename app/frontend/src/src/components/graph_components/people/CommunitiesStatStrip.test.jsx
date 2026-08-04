/**
 * RTL tests for the Communities stat strip: four tiles render, the empty-
 * communities tile toggles the list filter, the neutral tile clears it, and
 * the informational tiles are not buttons.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

import CommunitiesStatStrip from './CommunitiesStatStrip';

const renderStrip = (props = {}) => render(
    <ChakraProvider>
        <CommunitiesStatStrip total={19} peopleInCommunity={11} emptyCommunities={4} peopleInNone={7} {...props} />
    </ChakraProvider>,
);

const tile = (label) => screen.getByText(label).closest('[role="button"]');

describe('CommunitiesStatStrip', () => {
    it('renders all four diagnostic tiles with their counts', () => {
        renderStrip();
        ['Communities', 'In a community', '⚠ Empty communities', '⚠ People in none']
            .forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
        expect(screen.getByText('19')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('activates the empty-communities tile as a filter when clicked', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'all', onFilterChange });

        await userEvent.click(tile('⚠ Empty communities'));
        expect(onFilterChange).toHaveBeenCalledWith('empty');
    });

    it('toggles the filter back off when clicked while active', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'empty', onFilterChange });

        await userEvent.click(tile('⚠ Empty communities'));
        expect(onFilterChange).toHaveBeenCalledWith('all');
    });

    it('clears an active filter from the neutral Communities tile', async () => {
        const onFilterChange = jest.fn();
        renderStrip({ activeFilter: 'empty', onFilterChange });

        await userEvent.click(tile('Communities'));
        expect(onFilterChange).toHaveBeenCalledWith('all');
    });

    it('marks the active filter tile with aria-pressed', () => {
        renderStrip({ activeFilter: 'empty', onFilterChange: jest.fn() });
        expect(tile('⚠ Empty communities')).toHaveAttribute('aria-pressed', 'true');
    });

    it('renders the informational tiles as non-interactive', () => {
        renderStrip({ onFilterChange: jest.fn() });
        expect(screen.getByText('In a community').closest('[role="button"]')).toBeNull();
        expect(screen.getByText('⚠ People in none').closest('[role="button"]')).toBeNull();
    });
});
