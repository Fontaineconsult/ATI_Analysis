/**
 * The merged Progress section: subtasks are the plan's progress records —
 * addable and completable from the app (Asana written through the services),
 * with pre-merge progress notes rendered read-only in a disclosure.
 */
jest.mock('../../services/api/get', () => ({
    __esModule: true,
    fetchPlanAsanaSubtasks: jest.fn(),
}));
jest.mock('../../services/api/post', () => ({
    __esModule: true,
    addPlanSubtask: jest.fn(),
}));
jest.mock('../../services/api/put', () => ({
    __esModule: true,
    setPlanSubtaskCompleted: jest.fn(),
    updatePlanSubtask: jest.fn(),
    setPlanSubtaskAssignee: jest.fn(),
    setPlanSubtaskStatus: jest.fn(),
}));
jest.mock('../../context/SettingsContext', () => {
    const React = require('react');
    return {
        __esModule: true,
        SettingsContext: React.createContext({ currentAcademicYear: '2025-2026' }),
    };
});
jest.mock('../../context/UserContext', () => {
    const React = require('react');
    return {
        __esModule: true,
        UserContext: React.createContext({
            loadAllIndividuals: jest.fn(),
            individuals: [
                { unique_id: 'per-1', name: 'Sara Marquez', email: 'sara@x.edu', active: true },
                { unique_id: 'per-2', name: 'No Email Person', email: '', active: true },
                { unique_id: 'per-3', name: 'Inactive Person', email: 'gone@x.edu', active: false },
            ],
        }),
    };
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PlanProgress from './PlanProgress';
import { fetchPlanAsanaSubtasks } from '../../services/api/get';
import { addPlanSubtask } from '../../services/api/post';
import {
    setPlanSubtaskAssignee, setPlanSubtaskCompleted, setPlanSubtaskStatus,
    updatePlanSubtask,
} from '../../services/api/put';

const SUBTASKS = [
    {
        unique_id: 'uid-aaa111', asana_gid: 'sub-1', name: 'Collect the roster', completed: false,
        notes: 'Ask HR for the full list, not the committee subset.',
        task_status: 'In Progress',
        due_on: '2026-10-01', assignee_name: 'Sara Marquez',
        permalink_url: 'https://app.asana.com/sub-1',
        last_synced: '2026-09-09T10:00:00Z',
    },
    {
        asana_gid: 'sub-2', name: 'Draft the procedure', completed: true,
        completed_at: '2026-09-01T10:00:00Z', permalink_url: null,
        task_status: 'Completed',
        resolution_note: 'Signed off at the August meeting.',
        assigned_to: { unique_id: 'per-1', name: 'Sara Marquez' },
        last_synced: '2026-09-09T10:00:00Z',
    },
];

const LEGACY_NOTES = [
    {
        note: { properties: { unique_id: 'n1', name: 'Week 1 update', content: 'Kickoff held.', date_created: '2026-08-01' } },
        created_by: { properties: { name: 'Daniel Fontaine' } },
    },
];

const renderProgress = (legacyNotes = []) => render(
    <ChakraProvider>
        <MemoryRouter initialEntries={['/ssu/ati-explorer/plans/p1']}>
            <Routes>
                <Route
                    path="/:campus/ati-explorer/plans/:planId"
                    element={<PlanProgress planUniqueId="p1" legacyNotes={legacyNotes} />}
                />
            </Routes>
        </MemoryRouter>
    </ChakraProvider>,
);

beforeEach(() => {
    fetchPlanAsanaSubtasks.mockResolvedValue(SUBTASKS);
    addPlanSubtask.mockResolvedValue({ asana_gid: 'sub-3' });
    setPlanSubtaskCompleted.mockResolvedValue({ asana_gid: 'sub-1', completed: true });
    updatePlanSubtask.mockResolvedValue({ asana_gid: 'sub-1' });
    setPlanSubtaskAssignee.mockResolvedValue({ asana_gid: 'sub-1' });
    setPlanSubtaskStatus.mockResolvedValue({ asana_gid: 'sub-1' });
});

describe('PlanProgress', () => {
    it('lists the subtasks with their completion count', async () => {
        renderProgress();
        expect(await screen.findByText('Collect the roster')).toBeInTheDocument();
        expect(screen.getByText('Draft the procedure')).toBeInTheDocument();
        expect(screen.getByText('1 / 2 complete')).toBeInTheDocument();
        // Sub-1 shows the Asana mirror name; sub-2 shows the linked Person.
        expect(screen.getAllByText('Sara Marquez')).toHaveLength(2);
    });

    it('completes a subtask from the app and reloads', async () => {
        renderProgress();
        await userEvent.click(
            await screen.findByRole('checkbox', { name: /complete: collect the roster/i }),
        );
        await waitFor(() =>
            expect(setPlanSubtaskCompleted).toHaveBeenCalledWith('p1', 'sub-1', true));
        await waitFor(() => expect(fetchPlanAsanaSubtasks).toHaveBeenCalledTimes(2));
    });

    it('reopens a completed subtask', async () => {
        renderProgress();
        await userEvent.click(
            await screen.findByRole('checkbox', { name: /reopen: draft the procedure/i }),
        );
        await waitFor(() =>
            expect(setPlanSubtaskCompleted).toHaveBeenCalledWith('p1', 'sub-2', false));
    });

    it('adds progress through Asana with the campus and year context', async () => {
        renderProgress();
        await userEvent.click(await screen.findByRole('button', { name: /add progress/i }));
        await userEvent.type(screen.getByLabelText('Subtask name'), 'Send the follow-up');
        await userEvent.click(screen.getByRole('button', { name: /save to asana/i }));

        await waitFor(() => expect(addPlanSubtask).toHaveBeenCalledWith('p1', {
            name: 'Send the follow-up',
            notes: null,
            dueOn: null,
            assigneePersonId: null,
            yearName: '2025-2026',
            campusAbbrev: 'ssu',
        }));
        await waitFor(() => expect(fetchPlanAsanaSubtasks).toHaveBeenCalledTimes(2));
    });

    it('shows the description a subtask carries', async () => {
        renderProgress();
        expect(await screen.findByText(/ask HR for the full list/i)).toBeInTheDocument();
    });

    it('exposes the row unique_id, small, at the bottom', async () => {
        renderProgress();
        expect(await screen.findByText('uid-aaa111')).toBeInTheDocument();
    });

    it('adds progress with a description', async () => {
        renderProgress();
        await userEvent.click(await screen.findByRole('button', { name: /add progress/i }));
        await userEvent.type(screen.getByLabelText('Subtask name'), 'Draft the memo');
        await userEvent.type(screen.getByLabelText('Subtask description'), 'One page, to the deans.');
        await userEvent.click(screen.getByRole('button', { name: /save to asana/i }));

        await waitFor(() => expect(addPlanSubtask).toHaveBeenCalledWith('p1',
            expect.objectContaining({ name: 'Draft the memo', notes: 'One page, to the deans.' })));
    });

    it('edits name, description, and due date in place', async () => {
        renderProgress();
        await userEvent.click(
            await screen.findByRole('button', { name: /edit: collect the roster/i }),
        );

        const nameInput = screen.getByLabelText('Edit subtask name');
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Collect the full roster');
        const notesInput = screen.getByLabelText('Edit subtask description');
        await userEvent.clear(notesInput);
        await userEvent.type(notesInput, 'Include student assistants.');
        await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => expect(updatePlanSubtask).toHaveBeenCalledWith('p1', 'sub-1', {
            name: 'Collect the full roster',
            notes: 'Include student assistants.',
            dueOn: '2026-10-01',
        }));
        // The assignee and status were untouched, so neither write went out.
        expect(setPlanSubtaskAssignee).not.toHaveBeenCalled();
        expect(setPlanSubtaskStatus).not.toHaveBeenCalled();
        await waitFor(() => expect(fetchPlanAsanaSubtasks).toHaveBeenCalledTimes(2));
    });

    it('wears the state tracker in the plan status colors', async () => {
        renderProgress();
        expect(await screen.findByText('In Progress')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('shows the resolution note on a resolved task', async () => {
        renderProgress();
        expect(await screen.findByText(/Resolution: Signed off at the August meeting\./))
            .toBeInTheDocument();
    });

    it('sets status and resolution note together from the editor', async () => {
        renderProgress();
        await userEvent.click(
            await screen.findByRole('button', { name: /edit: collect the roster/i }),
        );
        await userEvent.selectOptions(screen.getByLabelText('Edit status'), 'On Hold');
        await userEvent.type(
            screen.getByLabelText('Edit resolution note'),
            'Waiting on the CSUBuy decision.',
        );
        await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() => expect(setPlanSubtaskStatus).toHaveBeenCalledWith('p1', 'sub-1', {
            status: 'On Hold',
            resolutionNote: 'Waiting on the CSUBuy decision.',
        }));
    });

    it('offers every active person as an assignee, email or not', async () => {
        // Ownership is app-side data, so lacking an email (not being in the
        // Asana workspace) excludes nobody. Inactive people stay out.
        renderProgress();
        await userEvent.click(await screen.findByRole('button', { name: /add progress/i }));

        const select = screen.getByLabelText('Assign to');
        const options = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);
        expect(options).toEqual(['Unassigned', 'No Email Person', 'Sara Marquez']);
    });

    it('assigns at creation', async () => {
        renderProgress();
        await userEvent.click(await screen.findByRole('button', { name: /add progress/i }));
        await userEvent.type(screen.getByLabelText('Subtask name'), 'Chase the roster');
        await userEvent.selectOptions(screen.getByLabelText('Assign to'), 'per-1');
        await userEvent.click(screen.getByRole('button', { name: /save to asana/i }));

        await waitFor(() => expect(addPlanSubtask).toHaveBeenCalledWith('p1',
            expect.objectContaining({ name: 'Chase the roster', assigneePersonId: 'per-1' })));
    });

    it('assigns an existing subtask from the editor', async () => {
        renderProgress();
        await userEvent.click(
            await screen.findByRole('button', { name: /edit: collect the roster/i }),
        );
        await userEvent.selectOptions(screen.getByLabelText('Edit assignee'), 'per-1');
        await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() =>
            expect(setPlanSubtaskAssignee).toHaveBeenCalledWith('p1', 'sub-1', 'per-1'));
    });

    it('unassigns by choosing Unassigned', async () => {
        renderProgress();
        await userEvent.click(
            await screen.findByRole('button', { name: /edit: draft the procedure/i }),
        );
        await userEvent.selectOptions(screen.getByLabelText('Edit assignee'), '');
        await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

        await waitFor(() =>
            expect(setPlanSubtaskAssignee).toHaveBeenCalledWith('p1', 'sub-2', null));
    });

    it('keeps pre-merge progress notes readable, but read-only', async () => {
        renderProgress(LEGACY_NOTES);
        await screen.findByText('Collect the roster');

        await userEvent.click(
            screen.getByRole('button', { name: /show earlier progress notes \(1\)/i }),
        );
        expect(screen.getByText('Week 1 update')).toBeInTheDocument();
        expect(screen.getByText('Kickoff held.')).toBeInTheDocument();
        expect(screen.getByText(/by Daniel Fontaine/)).toBeInTheDocument();
        // No edit/add controls for the legacy notes.
        expect(screen.queryByRole('button', { name: /add note/i })).not.toBeInTheDocument();
    });

    it('says where progress goes when there is none yet', async () => {
        fetchPlanAsanaSubtasks.mockResolvedValue([]);
        renderProgress();
        expect(await screen.findByText(/saved to Asana and kept here/i)).toBeInTheDocument();
    });
});
