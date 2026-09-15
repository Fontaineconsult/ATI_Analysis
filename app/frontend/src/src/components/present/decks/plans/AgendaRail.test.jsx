/**
 * The agenda rail: counter, grouping, keyboard selection, and the collapsed strip.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import AgendaRail from './AgendaRail';

const PLANS = [
    { unique_id: 'p1', name: 'Overdue plan', plan_status: 'In Progress', workingGroup: 'web', tasks_open: 3, tasks_overdue: 2 },
    { unique_id: 'p2', name: 'Stalled plan', plan_status: 'In Progress', workingGroup: 'web', tasks_open: 0, no_next_step: true },
    { unique_id: 'p3', name: 'Library plan', plan_status: 'In Progress', workingGroup: 'instructional-materials', tasks_open: 1 },
];

const renderRail = (props = {}) => render(
    <ChakraProvider>
        <AgendaRail plans={PLANS} selectedId="p2" onSelect={jest.fn()} onToggle={jest.fn()} {...props} />
    </ChakraProvider>,
);

describe('AgendaRail', () => {
    it('shows the position counter and groups by working group', () => {
        renderRail();
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
        expect(screen.getByRole('listbox', { name: 'Web plans' })).toBeInTheDocument();
        expect(screen.getByRole('listbox', { name: 'Instructional Materials plans' })).toBeInTheDocument();
    });

    it('spells out the flags in text', () => {
        renderRail();
        expect(screen.getByText('2 overdue')).toBeInTheDocument();
        expect(screen.getByText('no next step')).toBeInTheDocument();
    });

    it('selects with Enter', async () => {
        const onSelect = jest.fn();
        renderRail({ onSelect });
        const row = screen.getByRole('option', { name: /library plan/i });
        row.focus();
        await userEvent.keyboard('{Enter}');
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ unique_id: 'p3' }));
    });

    it('offers a toggle per campus, tags rows when several are shown, and keeps the last one on', async () => {
        const onToggleCampus = jest.fn();
        const campusOptions = [
            { abbreviation: 'sfsu', name: 'San Francisco State University' },
            { abbreviation: 'ssu', name: 'Sonoma State University' },
            { abbreviation: 'csueb', name: 'Cal State East Bay' },
        ];
        const plans = PLANS.map((p, i) => ({ ...p, campuses: i === 0 ? ['sfsu', 'ssu'] : ['sfsu'] }));
        renderRail({ plans, campusOptions, selectedCampuses: ['sfsu', 'ssu'], onToggleCampus });
        const group = screen.getByRole('group', { name: 'Campuses shown' });
        expect(within(group).getByRole('button', { name: 'sfsu' })).toHaveAttribute('aria-pressed', 'true');
        expect(within(group).getByRole('button', { name: 'csueb' })).toHaveAttribute('aria-pressed', 'false');
        await userEvent.click(within(group).getByRole('button', { name: 'csueb' }));
        expect(onToggleCampus).toHaveBeenCalledWith('csueb');
        expect(screen.getByLabelText('Campuses: sfsu, ssu')).toBeInTheDocument();

        // Down to one campus, that one stays visibly on (the shell ignores the toggle).
        renderRail({ plans, campusOptions, selectedCampuses: ['ssu'], onToggleCampus });
        const groups = screen.getAllByRole('group', { name: 'Campuses shown' });
        const lastOn = within(groups[1]).getByRole('button', { name: 'ssu' });
        expect(lastOn).toHaveAttribute('aria-pressed', 'true');
        expect(lastOn).toHaveAttribute('title', expect.stringContaining('at least one campus stays on'));
    });

    it('collapses to numbered buttons that still select', async () => {
        const onSelect = jest.fn();
        renderRail({ collapsed: true, onSelect });
        const third = screen.getByRole('button', { name: '3. Library plan' });
        await userEvent.click(third);
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ unique_id: 'p3' }));
        expect(screen.getByRole('button', { name: '2. Stalled plan' })).toHaveAttribute('aria-current', 'true');
    });
});
