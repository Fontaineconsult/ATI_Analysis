/**
 * The plans list as a task tracker: attention-first ordering, per-plan task
 * chips, and listbox semantics with keyboard selection.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import PlansList from './PlansList';

const PLANS = [
    {
        unique_id: 'pl-quiet', name: 'Quiet plan', plan_status: 'In Progress',
        workingGroup: 'web', tasks_total: 3, tasks_open: 1, tasks_overdue: 0,
        tasks_unassigned_open: 0, no_next_step: false,
    },
    {
        unique_id: 'pl-overdue', name: 'Overdue plan', plan_status: 'In Progress',
        workingGroup: 'web', tasks_total: 4, tasks_open: 3, tasks_overdue: 2,
        tasks_unassigned_open: 1, no_next_step: false,
    },
    {
        unique_id: 'pl-stalled', name: 'Stalled plan', plan_status: 'In Progress',
        workingGroup: 'web', tasks_total: 2, tasks_open: 0, tasks_overdue: 0,
        tasks_unassigned_open: 0, no_next_step: true,
    },
];

const renderList = (props = {}) => render(
    <ChakraProvider>
        <PlansList plans={PLANS} selectedId={null} onSelect={jest.fn()} {...props} />
    </ChakraProvider>,
);

// Only the listbox rows: the sort <Select> also exposes role=option entries.
const rowNames = () => screen.getAllByRole('listbox')
    .flatMap((lb) => within(lb).queryAllByRole('option'))
    .map((o) => o.querySelector('p')?.textContent);

describe('PlansList', () => {
    it('leads with what needs attention: overdue, then stalled, then busy', () => {
        renderList();
        expect(rowNames()).toEqual(['Overdue plan', 'Stalled plan', 'Quiet plan']);
    });

    it('wears the task chips: open counts, overdue, no next step, unowned', () => {
        renderList();
        expect(screen.getByText('3 open of 4')).toBeInTheDocument();
        expect(screen.getByText('2 overdue')).toBeInTheDocument();
        expect(screen.getByText('no next step')).toBeInTheDocument();
        expect(screen.getByText('1 unowned')).toBeInTheDocument();
    });

    it('selects with the keyboard, not just the mouse', async () => {
        const onSelect = jest.fn();
        renderList({ onSelect });
        const row = screen.getByRole('option', { name: /stalled plan/i });
        row.focus();
        await userEvent.keyboard('{Enter}');
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ unique_id: 'pl-stalled' }));
    });

    it('marks the selected row for assistive tech', () => {
        renderList({ selectedId: 'pl-overdue' });
        expect(screen.getByRole('option', { name: /overdue plan/i }))
            .toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('option', { name: /quiet plan/i }))
            .toHaveAttribute('aria-selected', 'false');
    });

    it('still narrows to In Progress by default and can widen', async () => {
        const done = {
            unique_id: 'pl-done', name: 'Finished plan', plan_status: 'Completed',
            workingGroup: 'web', tasks_total: 1, tasks_open: 0, tasks_overdue: 0,
            tasks_unassigned_open: 0, no_next_step: false,
        };
        renderList({ plans: [...PLANS, done] });
        expect(screen.queryByText('Finished plan')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: /in progress only/i }));
        expect(screen.getByText('Finished plan')).toBeInTheDocument();
    });
});
