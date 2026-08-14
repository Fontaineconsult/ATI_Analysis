/**
 * The filter bar's job is to stop a narrowed report from reading as missing data.
 * These tests are about what it says, not how it looks.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import ReportFilterBar from './ReportFilterBar';

const setup = (props = {}) => {
    const handlers = { onRemove: jest.fn(), onClear: jest.fn() };
    render(
        <ChakraProvider>
            <ReportFilterBar
                activeFilters={['ready-for-review']}
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
    render(
        <ChakraProvider>
            <ReportFilterBar activeFilters={[]} shown={122} total={122} onRemove={jest.fn()} onClear={jest.fn()} />
        </ChakraProvider>,
    );
    // ChakraProvider itself emits style nodes, so assert on the bar's own landmark.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
});

it('states what was narrowed to, so the report is not mistaken for missing data', () => {
    setup();
    expect(screen.getByText(/Showing/)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/of 122 indicators/)).toBeInTheDocument();
});

it('is a live region, so the new count is announced after a toggle', () => {
    setup();
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
});

it('offers each active filter as its own removable chip', async () => {
    const { onRemove } = setup({ activeFilters: ['unassigned', 'ready-for-review'] });
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: ⚠ Unassigned' }));
    expect(onRemove).toHaveBeenCalledWith('unassigned');
});

it('clears everything at once', async () => {
    const { onClear } = setup();
    await userEvent.click(screen.getByRole('button', { name: /Clear all/ }));
    expect(onClear).toHaveBeenCalled();
});

it('says so when the narrowing produced nothing, rather than showing "0 of 122"', () => {
    setup({ shown: 0 });
    expect(screen.getByText(/No indicators match this filter/)).toBeInTheDocument();
});

it('names the AND rule only when more than one filter is active', () => {
    setup();
    expect(screen.queryByText(/must match every active filter/)).not.toBeInTheDocument();

    setup({ activeFilters: ['unassigned', 'ready-for-review'], shown: 0 });
    expect(screen.getByText(/must match every active filter/)).toBeInTheDocument();
    expect(screen.getByText(/No indicators match all of these filters/)).toBeInTheDocument();
});

it('skips an unknown filter key instead of rendering a blank chip', () => {
    setup({ activeFilters: ['ready-for-review', 'nonsense'] });
    expect(screen.getAllByRole('button', { name: /Remove filter/ })).toHaveLength(1);
});
