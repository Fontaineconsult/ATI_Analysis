/**
 * The report's filter controls. The behaviour worth pinning: the search box is
 * debounced (so typing does not re-render the report per character), it adopts
 * external changes without fighting the typist, and the menus are multi-select.
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import ReportFilterPanel from './ReportFilterPanel';

const EMPTY = { attention: [], status: [], trend: [], community: [], q: '' };

const setup = (state = {}, props = {}) => {
    const handlers = {
        onToggleStatus: jest.fn(),
        onToggleTrend: jest.fn(),
        onToggleCommunity: jest.fn(),
        onSearch: jest.fn(),
        onClear: jest.fn(),
    };
    const utils = render(
        <ChakraProvider>
            <ReportFilterPanel
                state={{ ...EMPTY, ...state }}
                hasAnyFilter={false}
                {...handlers}
                {...props}
            />
        </ChakraProvider>,
    );
    return { ...utils, ...handlers };
};

const searchBox = () => screen.getByLabelText('Search indicators by description or ID');

describe('search', () => {
    it('debounces, so the report is not refiltered on every keystroke', async () => {
        const { onSearch } = setup();
        await userEvent.type(searchBox(), 'cap');
        expect(onSearch).not.toHaveBeenCalled();
        await waitFor(() => expect(onSearch).toHaveBeenCalledWith('cap'));
        expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('seeds from the URL state, so a shared link shows its own search term', () => {
        setup({ q: 'captioning' });
        expect(searchBox()).toHaveValue('captioning');
    });

    it('adopts an external change — Back, or Clear all — without the user retyping', () => {
        const { rerender } = setup({ q: 'captioning' });
        rerender(
            <ChakraProvider>
                <ReportFilterPanel
                    state={{ ...EMPTY, q: '' }}
                    hasAnyFilter={false}
                    onToggleStatus={jest.fn()} onToggleTrend={jest.fn()}
                    onSearch={jest.fn()} onClear={jest.fn()}
                />
            </ChakraProvider>,
        );
        expect(searchBox()).toHaveValue('');
    });

    it('offers a clear button only once there is something to clear', async () => {
        const { onSearch } = setup();
        expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

        await userEvent.type(searchBox(), 'x');
        // Let the term commit first — clearing before the debounce fires is a net
        // no-op by design, and would commit nothing to assert on.
        await waitFor(() => expect(onSearch).toHaveBeenCalledWith('x'));

        await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
        expect(searchBox()).toHaveValue('');
        await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith(''));
    });

    it('commits nothing when a term is typed and cleared before it settles', async () => {
        const { onSearch } = setup();
        await userEvent.type(searchBox(), 'x');
        await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

        // The URL never held the term, so there is nothing to undo.
        await new Promise((r) => setTimeout(r, 400));
        expect(onSearch).not.toHaveBeenCalled();
    });
});

describe('status and trend menus', () => {
    it('opens the status menu with every maturity rung plus the off-ladder bucket', async () => {
        setup();
        await userEvent.click(screen.getByRole('button', { name: /^Status/ }));
        const menu = await screen.findByRole('menu');
        const items = within(menu).getAllByRole('menuitemcheckbox');
        expect(items.map((i) => i.textContent)).toEqual([
            'Not Started', 'Initiated', 'Defined', 'Established', 'Managed', 'Optimizing', 'No evidence',
        ]);
    });

    it('reports the status it was clicked for', async () => {
        const { onToggleStatus } = setup();
        await userEvent.click(screen.getByRole('button', { name: /^Status/ }));
        await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Defined' }));
        expect(onToggleStatus).toHaveBeenCalledWith('Defined');
    });

    it('shows selected values as checked, and counts them on the trigger', async () => {
        setup({ status: ['Defined', 'Managed'] });
        expect(screen.getByRole('button', { name: 'Status (2)' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Status (2)' }));
        expect(await screen.findByRole('menuitemcheckbox', { name: 'Defined' })).toBeChecked();
        expect(screen.getByRole('menuitemcheckbox', { name: 'Initiated' })).not.toBeChecked();
    });

    it('offers trend by human label, not by key', async () => {
        const { onToggleTrend } = setup();
        await userEvent.click(screen.getByRole('button', { name: /^Trend/ }));
        const menu = await screen.findByRole('menu');
        expect(within(menu).getAllByRole('menuitemcheckbox').map((i) => i.textContent))
            .toEqual(['Improving', 'Static', 'Declining', 'No trend data']);

        await userEvent.click(within(menu).getByRole('menuitemcheckbox', { name: 'No trend data' }));
        expect(onToggleTrend).toHaveBeenCalledWith('unknown');
    });
});

describe('clear', () => {
    it('is offered only when something is filtering', () => {
        setup();
        expect(screen.queryByRole('button', { name: /Clear all filters/ })).not.toBeInTheDocument();
        expect(screen.getByText('Showing all indicators')).toBeInTheDocument();
    });

    it('clears when there is something to clear', async () => {
        const { onClear } = setup({ status: ['Defined'] }, { hasAnyFilter: true });
        await userEvent.click(screen.getByRole('button', { name: /Clear all filters/ }));
        expect(onClear).toHaveBeenCalled();
    });
});

describe('community menu', () => {
    it('is absent when the data carries no communities', () => {
        setup();
        expect(screen.queryByRole('button', { name: /^Community/ })).not.toBeInTheDocument();
    });

    it('offers the communities present in the data', async () => {
        const { onToggleStatus } = setup({}, { communityOptions: ['Library', 'Procurement'] });
        await userEvent.click(screen.getByRole('button', { name: /^Community/ }));
        const menu = await screen.findByRole('menu');
        expect(within(menu).getAllByRole('menuitemcheckbox').map((i) => i.textContent))
            .toEqual(['Library', 'Procurement']);
        expect(onToggleStatus).not.toHaveBeenCalled();
    });

    it('reports the community it was clicked for', async () => {
        const onToggleCommunity = jest.fn();
        setup({}, { communityOptions: ['Library'], onToggleCommunity });
        await userEvent.click(screen.getByRole('button', { name: /^Community/ }));
        await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Library' }));
        expect(onToggleCommunity).toHaveBeenCalledWith('Library');
    });

    it('counts the selection on the trigger', () => {
        setup({ community: ['Library', 'Procurement'] }, { communityOptions: ['Library', 'Procurement'] });
        expect(screen.getByRole('button', { name: 'Community (2)' })).toBeInTheDocument();
    });
});
