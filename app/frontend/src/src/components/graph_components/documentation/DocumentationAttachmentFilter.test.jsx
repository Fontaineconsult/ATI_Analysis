/**
 * RTL tests for the "Attached to" facet.
 *
 * The behaviours worth locking down are the ones that would quietly mislead
 * rather than visibly break: a selection that stays visible when the panel is
 * shut (otherwise a filtered list looks unfiltered), a selection that survives
 * its own family disappearing (otherwise the filter becomes unremovable), and a
 * whole-family toggle that reports what it will do rather than what it did.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

import DocumentationAttachmentFilter from './DocumentationAttachmentFilter';

const facets = {
    families: [
        {
            key: 'implementations',
            label: 'Implementations',
            colorScheme: 'teal',
            total: 3,
            members: [
                { label: 'Process', text: 'Process', count: 2 },
                { label: 'Service', text: 'Service', count: 2 },
            ],
        },
        {
            key: 'governance',
            label: 'Governance',
            colorScheme: 'red',
            total: 1,
            members: [{ label: 'Law', text: 'Law', count: 1 }],
        },
    ],
};

const setup = (props = {}) => {
    const handlers = {
        onToggle: jest.fn(),
        onToggleGroup: jest.fn(),
        onClear: jest.fn(),
    };
    render(
        <ChakraProvider>
            <DocumentationAttachmentFilter facets={facets} selected={[]} {...handlers} {...props} />
        </ChakraProvider>,
    );
    return handlers;
};

const disclosure = () => screen.getByRole('button', { name: /^Attached to/ });

describe('DocumentationAttachmentFilter', () => {
    it('is one button until opened', () => {
        setup();
        expect(disclosure()).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('button', { name: /Process \(2\)/ })).not.toBeInTheDocument();
    });

    it('opens to the families the data actually holds', async () => {
        setup();
        await userEvent.click(disclosure());

        expect(disclosure()).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Implementations')).toBeInTheDocument();
        expect(screen.getByText('Governance')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Process (2)' })).toBeInTheDocument();
        // Assets has no rows, so it isn't offered.
        expect(screen.queryByText('Assets')).not.toBeInTheDocument();
    });

    it('toggles one label', async () => {
        const { onToggle } = setup();
        await userEvent.click(disclosure());
        await userEvent.click(screen.getByRole('button', { name: 'Process (2)' }));

        expect(onToggle).toHaveBeenCalledWith('Process');
    });

    it('marks a selected member pressed', async () => {
        setup({ selected: ['Process'] });
        await userEvent.click(disclosure());

        expect(screen.getByRole('button', { name: 'Process (2)' }))
            .toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Service (2)' }))
            .toHaveAttribute('aria-pressed', 'false');
    });

    it('offers the whole family with the count of RECORDS, not the sum of members', async () => {
        const { onToggleGroup } = setup();
        await userEvent.click(disclosure());

        // Process(2) + Service(2) = 4 edges but only 3 records — the family
        // control must quote the number the list will actually show.
        const all = screen.getByRole('button', { name: 'all (3)' });
        await userEvent.click(all);
        expect(onToggleGroup).toHaveBeenCalledWith(['Process', 'Service']);
    });

    it('offers to deselect once the whole family is on', async () => {
        setup({ selected: ['Process', 'Service'] });
        await userEvent.click(disclosure());

        const groupButtons = screen.getAllByRole('button', { name: /^(all \(|none$)/ });
        expect(within(groupButtons[0]).queryByText('none')).toBeTruthy();
    });

    it('keeps the selection visible while collapsed', () => {
        setup({ selected: ['Process'] });
        expect(disclosure()).toHaveAttribute('aria-expanded', 'false');
        expect(disclosure()).toHaveTextContent('Attached to (1)');
        expect(screen.getByRole('button', { name: 'Remove Process filter' })).toBeInTheDocument();
    });

    it('removes a selection from its chip', async () => {
        const { onToggle } = setup({ selected: ['Process'] });
        await userEvent.click(screen.getByRole('button', { name: 'Remove Process filter' }));
        expect(onToggle).toHaveBeenCalledWith('Process');
    });

    it('clears everything', async () => {
        const { onClear } = setup({ selected: ['Process', 'Law'] });
        await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
        expect(onClear).toHaveBeenCalled();
    });

    it('still renders a selection whose family is no longer offered', () => {
        // Switching tab can leave "attached to Law" on while nothing in the open
        // group is attached to a Law. Dropping the chip would make the filter
        // impossible to remove without editing the URL.
        setup({ facets: { families: [] }, selected: ['Law'] });
        expect(screen.getByRole('button', { name: 'Remove Law filter' })).toBeInTheDocument();
    });

    it('renders nothing when there is neither a facet nor a selection', () => {
        render(
            <ChakraProvider>
                <DocumentationAttachmentFilter facets={{ families: [] }} selected={[]} />
            </ChakraProvider>,
        );
        expect(screen.queryByRole('button', { name: /^Attached to/ })).not.toBeInTheDocument();
    });
});
