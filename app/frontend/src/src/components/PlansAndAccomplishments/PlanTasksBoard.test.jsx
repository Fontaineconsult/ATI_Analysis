/**
 * The cross-plan Tasks tab: owner filter, open-only default, overdue accent,
 * complete-in-place, and the plan link on every row.
 */
jest.mock('../../services/api/get', () => ({
    __esModule: true,
    fetchPlansTasks: jest.fn(),
}));
jest.mock('../../services/api/put', () => ({
    __esModule: true,
    setPlanSubtaskCompleted: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlanTasksBoard from './PlanTasksBoard';
import { fetchPlansTasks } from '../../services/api/get';
import { setPlanSubtaskCompleted } from '../../services/api/put';

const TASKS = [
    {
        unique_id: 'u1', asana_gid: 't-overdue', name: 'Chase the export',
        completed: false, task_status: 'In Progress', due_on: '2020-01-01',
        overdue: true, assigned_to: { unique_id: 'per-1', name: 'Sara Marquez' },
        assignee_name: 'Sara Marquez', plan: { unique_id: 'pl-1', name: 'Buyer training' },
    },
    {
        unique_id: 'u2', asana_gid: 't-open', name: 'Draft the memo',
        completed: false, task_status: 'Not Started', due_on: null,
        overdue: false, assigned_to: null, assignee_name: null,
        plan: { unique_id: 'pl-2', name: 'Campus communication' },
    },
    {
        unique_id: 'u3', asana_gid: 't-done', name: 'Old finished thing',
        completed: true, task_status: 'Completed', due_on: null,
        overdue: false, assigned_to: null, assignee_name: null,
        plan: { unique_id: 'pl-1', name: 'Buyer training' },
    },
];

const renderBoard = () => render(
    <ChakraProvider>
        <MemoryRouter initialEntries={['/ssu/ati-explorer/plans']}>
            <Routes>
                <Route path="/:campus/ati-explorer/plans"
                       element={<PlanTasksBoard year="2025-2026" />} />
            </Routes>
        </MemoryRouter>
    </ChakraProvider>,
);

beforeEach(() => {
    fetchPlansTasks.mockResolvedValue({ data: { tasks: TASKS } });
    setPlanSubtaskCompleted.mockResolvedValue({});
});

describe('PlanTasksBoard', () => {
    it('shows open tasks by default, with overdue marked and counted', async () => {
        renderBoard();
        expect(await screen.findByText('Chase the export')).toBeInTheDocument();
        expect(screen.getByText('Draft the memo')).toBeInTheDocument();
        expect(screen.queryByText('Old finished thing')).not.toBeInTheDocument();
        expect(screen.getByText('Overdue')).toBeInTheDocument();
        expect(screen.getByText(/2 tasks · 1 overdue/)).toBeInTheDocument();
    });

    it('widens to completed tasks on demand', async () => {
        renderBoard();
        await screen.findByText('Chase the export');
        await userEvent.click(screen.getByRole('button', { name: /open only/i }));
        expect(screen.getByText('Old finished thing')).toBeInTheDocument();
    });

    it('filters by owner, including Unassigned', async () => {
        renderBoard();
        await screen.findByText('Chase the export');

        await userEvent.selectOptions(screen.getByLabelText('Filter by owner'), 'per-1');
        expect(screen.getByText('Chase the export')).toBeInTheDocument();
        expect(screen.queryByText('Draft the memo')).not.toBeInTheDocument();

        await userEvent.selectOptions(screen.getByLabelText('Filter by owner'), '__unassigned__');
        expect(screen.getByText('Draft the memo')).toBeInTheDocument();
        expect(screen.queryByText('Chase the export')).not.toBeInTheDocument();
    });

    it('completes a task in place against its own plan', async () => {
        renderBoard();
        await userEvent.click(
            await screen.findByRole('checkbox', { name: /complete: chase the export/i }),
        );
        await waitFor(() =>
            expect(setPlanSubtaskCompleted).toHaveBeenCalledWith('pl-1', 't-overdue', true));
        await waitFor(() => expect(fetchPlansTasks).toHaveBeenCalledTimes(2));
    });

    it('links every row to its plan', async () => {
        renderBoard();
        const link = await screen.findByRole('link', { name: 'Buyer training' });
        expect(link).toHaveAttribute('href', '/ssu/ati-explorer/plans/pl-1');
    });
});
