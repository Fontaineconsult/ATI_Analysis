/**
 * The filter bar's job is to stop a narrowed report from reading as missing data.
 * Filters reach it from three places — the tiles up the page, the control row just
 * above, and a pasted link — so it must state all of them together.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import ReportFilterBar from './ReportFilterBar';

const EMPTY = { attention: [], status: [], trend: [], q: '' };

const setup = (state = {}, props = {}) => {
    const handlers = {
        onToggleAttention: jest.fn(),
        onToggleStatus: jest.fn(),
        onToggleTrend: jest.fn(),
        onSearch: jest.fn(),
        onClear: jest.fn(),
    };
    render(
        <ChakraProvider>
            <ReportFilterBar
                state={{ ...EMPTY, ...state }}
                shown={1}
                total={122}
                {...handlers}
                {...props}
            />
        </ChakraProvider>,
    );
    return handlers;
};

it('renders nothing when no filter is active — a clean report gets no chrome', () => {
    setup();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
});

it('states what was narrowed to, so the report is not mistaken for missing data', () => {
    setup({ attention: ['ready-for-review'] });
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/of 122 indicators/)).toBeInTheDocument();
});

it('is a live region, so the new count is announced after a toggle', () => {
    setup({ attention: ['ready-for-review'] });
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
});

describe('chips, one per active filter across every facet', () => {
    it('shows an attention filter by its tile label', async () => {
        const { onToggleAttention } = setup({ attention: ['unassigned'] });
        await userEvent.click(screen.getByRole('button', { name: 'Remove filter: ⚠ Unassigned' }));
        expect(onToggleAttention).toHaveBeenCalledWith('unassigned');
    });

    it('shows a status filter, labelled as such', async () => {
        const { onToggleStatus } = setup({ status: ['Defined'] });
        await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Status: Defined' }));
        expect(onToggleStatus).toHaveBeenCalledWith('Defined');
    });

    it('shows a trend filter using its human label, not its key', async () => {
        const { onToggleTrend } = setup({ trend: ['unknown'] });
        await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Trend: No trend data' }));
        expect(onToggleTrend).toHaveBeenCalledWith('unknown');
    });

    it('shows the search term in quotes and clears it on removal', async () => {
        const { onSearch } = setup({ q: 'captioning' });
        await userEvent.click(screen.getByRole('button', { name: /Remove filter: “captioning”/ }));
        expect(onSearch).toHaveBeenCalledWith('');
    });

    it('shows every facet at once', () => {
        setup({ attention: ['unassigned'], status: ['Defined'], trend: ['declining'], q: 'web' });
        expect(screen.getAllByRole('button', { name: /Remove filter/ })).toHaveLength(4);
    });

    it('skips an unknown attention key instead of rendering a blank chip', () => {
        setup({ attention: ['ready-for-review', 'nonsense'] });
        expect(screen.getAllByRole('button', { name: /Remove filter/ })).toHaveLength(1);
    });
});

it('clears everything at once', async () => {
    const { onClear } = setup({ status: ['Defined'] });
    await userEvent.click(screen.getByRole('button', { name: /Clear all/ }));
    expect(onClear).toHaveBeenCalled();
});

it('says so when the narrowing produced nothing, rather than showing "0 of 122"', () => {
    setup({ attention: ['ready-for-review'] }, { shown: 0 });
    expect(screen.getByText(/No indicators match this filter/)).toBeInTheDocument();
});

it('explains the combination rule only when more than one filter is active', () => {
    setup({ attention: ['ready-for-review'] });
    expect(screen.queryByText(/must match every filter shown/)).not.toBeInTheDocument();
});

it('names both rules when several filters are combined', () => {
    setup({ status: ['Defined', 'Managed'] }, { shown: 0 });
    expect(screen.getByText(/must match every filter shown/)).toBeInTheDocument();
    expect(screen.getByText(/Within Status or Trend, any of the chosen values counts/)).toBeInTheDocument();
    expect(screen.getByText(/No indicators match all of these filters/)).toBeInTheDocument();
});
