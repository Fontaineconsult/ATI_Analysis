/**
 * A task row opens into its details, saves only what changed, and the
 * checkbox completes without opening.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import TaskRow from './TaskRow';
import { setPlanSubtaskAssignee, setPlanSubtaskStatus, updatePlanSubtask } from '../../../../services/api/put';

// jest.mock is hoisted above the imports, so the module import receives the mock.
jest.mock('../../../../services/api/put', () => ({
    updatePlanSubtask: jest.fn(),
    setPlanSubtaskAssignee: jest.fn(),
    setPlanSubtaskStatus: jest.fn(),
}));

const SUB = {
    asana_gid: 'g1', name: 'Recruit Sonoma lead', notes: 'Ask the library first.',
    completed: false, due_on: '2026-09-09', task_status: 'In Progress', resolution_note: '',
    assigned_to: null, assignee_name: null, permalink_url: 'https://app.asana.com/x',
};
const PEOPLE = [{ unique_id: 'per1', name: 'Frank Lee' }];

const renderRow = (props = {}) => {
    const onToggle = jest.fn();
    const onSaved = jest.fn().mockResolvedValue();
    const onError = jest.fn();
    render(
        <ChakraProvider>
            <TaskRow planUniqueId="p1" sub={SUB} people={PEOPLE} today="2026-09-14"
                     busy={false} onToggle={onToggle} onSaved={onSaved} onError={onError} {...props} />
        </ChakraProvider>,
    );
    return { onToggle, onSaved, onError };
};

beforeEach(() => {
    updatePlanSubtask.mockResolvedValue({});
    setPlanSubtaskAssignee.mockResolvedValue({});
    setPlanSubtaskStatus.mockResolvedValue({});
});

describe('TaskRow', () => {
    it('reads as a row with the flags spelled out, and opens on click', async () => {
        renderRow();
        expect(screen.getByText('UNOWNED')).toBeInTheDocument();
        expect(screen.getByText('OVERDUE, due 2026-09-09')).toBeInTheDocument();
        const trigger = screen.getByRole('button', { name: /open details: recruit sonoma lead/i });
        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await userEvent.click(trigger);
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByLabelText('Task description')).toHaveValue('Ask the library first.');
        expect(screen.getByRole('link', { name: /open in asana/i })).toBeInTheDocument();
    });

    it('the checkbox completes without opening the row', async () => {
        const { onToggle } = renderRow();
        await userEvent.click(screen.getByRole('checkbox', { name: /complete: recruit sonoma lead/i }));
        expect(onToggle).toHaveBeenCalledWith(SUB);
        expect(screen.getByRole('button', { name: /open details/i })).toHaveAttribute('aria-expanded', 'false');
    });

    it('saves only the properties that changed', async () => {
        const { onSaved } = renderRow();
        await userEvent.click(screen.getByRole('button', { name: /open details/i }));
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
        await userEvent.selectOptions(screen.getByLabelText('Task owner'), 'per1');
        await userEvent.selectOptions(screen.getByLabelText('Task status'), 'On Hold');
        await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
        await waitFor(() => expect(onSaved).toHaveBeenCalled());
        expect(updatePlanSubtask).not.toHaveBeenCalled();
        expect(setPlanSubtaskAssignee).toHaveBeenCalledWith('p1', 'g1', 'per1');
        expect(setPlanSubtaskStatus).toHaveBeenCalledWith('p1', 'g1', { status: 'On Hold' });
    });

    it('edits name and description through the Asana-first write', async () => {
        renderRow();
        await userEvent.click(screen.getByRole('button', { name: /open details/i }));
        const name = screen.getByLabelText('Task name');
        await userEvent.clear(name);
        await userEvent.type(name, 'Recruit the Sonoma lead');
        await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
        await waitFor(() => expect(updatePlanSubtask).toHaveBeenCalledWith('p1', 'g1', {
            name: 'Recruit the Sonoma lead', notes: 'Ask the library first.', dueOn: '2026-09-09',
        }));
        expect(setPlanSubtaskAssignee).not.toHaveBeenCalled();
    });

    it('reports a failed save and keeps the row open', async () => {
        updatePlanSubtask.mockRejectedValue(new Error('Asana said no'));
        const { onError, onSaved } = renderRow();
        await userEvent.click(screen.getByRole('button', { name: /open details/i }));
        await userEvent.type(screen.getByLabelText('Task description'), ' Then ask IT.');
        await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
        await waitFor(() => expect(onError).toHaveBeenCalled());
        expect(onSaved).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /close details/i })).toBeInTheDocument();
    });
});
