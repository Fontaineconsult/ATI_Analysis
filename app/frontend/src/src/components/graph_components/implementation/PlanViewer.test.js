/**
 * The Plans tab in an indicator's Annotations section.
 *
 * The behaviour worth pinning is the badge row. A plan is usually SHARED — it furthers
 * many indicators across many campuses — but this editor is always opened from one
 * indicator's page, so the badges are what tell an author the reach of what they are
 * about to edit. Also covered: a failed save must not look like a successful one.
 */
jest.mock('axios', () => ({
    __esModule: true,
    default: {
        get: jest.fn(), put: jest.fn(), post: jest.fn(),
        defaults: { withCredentials: false, headers: { common: {} } },
        interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    },
}));
jest.mock('../../../services/api/put', () => ({ updatePlan: jest.fn() }));
jest.mock('../../../services/api/post', () => ({ createPlan: jest.fn() }));

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import PlanViewer from './PlanViewer';
import { updatePlan } from '../../../services/api/put';
import { createPlan } from '../../../services/api/post';
import { DataContext } from '../../../context/DataContext';
import { SettingsContext } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';

const loadSingleWorkingGroupData = jest.fn();

const plan = (over = {}) => ({
    labels: ['Plan'],
    properties: {
        unique_id: 'p1',
        name: 'Assemble ATI Committee',
        description: 'Find members across all 3 campuses.',
        plan_status: 'In Progress',
        is_key_plan: false,
        is_campus_plan: true,
        abandoned: false,
        abandoned_notes: '',
        indicator_count: 24,
        campuses: ['csueb', 'sfsu', 'ssu'],
        ...over,
    },
});

const renderViewer = (plans = [plan()]) =>
    render(
        <ChakraProvider>
            <UserContext.Provider value={{ user: { name: 'Tester' } }}>
                <SettingsContext.Provider value={{ currentAcademicYear: '2026-2027', currentWorkingGroup: 'Web' }}>
                    <DataContext.Provider value={{ loadSingleWorkingGroupData, selectedYear: '2026-2027' }}>
                        <PlanViewer plans={plans} onSubmit={jest.fn()} yearSuccessEvidence="2026-2027 1.1-web-sfsu" />
                    </DataContext.Provider>
                </SettingsContext.Provider>
            </UserContext.Provider>
        </ChakraProvider>,
    );

beforeEach(() => jest.clearAllMocks());

describe('badges', () => {
    it('shows the plan status, using the shared colour vocabulary', () => {
        renderViewer();
        expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('surfaces how far the plan reaches beyond this indicator', () => {
        renderViewer();
        expect(screen.getByText('24 indicators')).toBeInTheDocument();
        expect(screen.getByText('3 campuses')).toBeInTheDocument();
    });

    it('hides the reach badges when the plan is local to this indicator', () => {
        renderViewer([plan({ indicator_count: 1, campuses: ['sfsu'] })]);
        expect(screen.queryByText(/indicators$/)).not.toBeInTheDocument();
        expect(screen.queryByText(/campuses$/)).not.toBeInTheDocument();
    });

    it('lets `abandoned` override the status label', () => {
        renderViewer([plan({ abandoned: true, plan_status: 'In Progress' })]);
        expect(screen.getByText('Abandoned')).toBeInTheDocument();
        expect(screen.queryByText('In Progress')).not.toBeInTheDocument();
    });

    it('shows classification badges only when set', () => {
        renderViewer([plan({ is_key_plan: true, is_campus_plan: false })]);
        expect(screen.getByText('Key Plan')).toBeInTheDocument();
        expect(screen.queryByText('Campus Plan')).not.toBeInTheDocument();
    });

    it('links an Asana-tracked plan out to its task', () => {
        renderViewer([plan({ asana_task_gid: '12345' })]);
        expect(screen.getByRole('link', { name: /Asana/ }))
            .toHaveAttribute('href', 'https://app.asana.com/0/0/12345');
    });

    it('renders an empty state when there are no plans', () => {
        renderViewer([]);
        expect(screen.getByText('No plans recorded for this indicator.')).toBeInTheDocument();
    });
});

describe('editing', () => {
    it('offers exactly the statuses the write path accepts', async () => {
        renderViewer();
        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

        const options = within(await screen.findByLabelText('Plan Status')).getAllByRole('option');
        expect(options.map((o) => o.value))
            .toEqual(['Not Started', 'In Progress', 'Completed', 'On Hold', 'Abandoned']);
        // The spelling that used to 500 must not be offerable.
        expect(options.map((o) => o.value)).not.toContain('Complete');
    });

    it('submits an update and reports success', async () => {
        updatePlan.mockResolvedValue({});
        renderViewer();

        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Update Plan' }));

        await waitFor(() => expect(updatePlan).toHaveBeenCalledWith(expect.objectContaining({
            unique_id: 'p1',
            furthered_yse_identifier: '2026-2027 1.1-web-sfsu',
            academic_year_name: '2026-2027',
            plan_status: 'In Progress',
        })));
        expect(await screen.findByText('Plan updated')).toBeInTheDocument();
        expect(loadSingleWorkingGroupData).toHaveBeenCalledWith('Web');
    });

    it('surfaces a failed save instead of silently closing', async () => {
        updatePlan.mockRejectedValue({ response: { data: { error: "Invalid plan_status: 'Nope'." } } });
        renderViewer();

        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Update Plan' }));

        expect(await screen.findByText('Failed to update plan')).toBeInTheDocument();
        expect(screen.getByText("Invalid plan_status: 'Nope'.")).toBeInTheDocument();
        // Form stays open with the user's input rather than closing as if saved.
        expect(screen.getByLabelText(/Plan Name/)).toBeInTheDocument();
    });

    it('only asks for abandoned notes once the plan is abandoned', async () => {
        renderViewer();
        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
        await screen.findByLabelText(/Plan Name/);

        expect(screen.queryByLabelText('Abandoned Notes')).not.toBeInTheDocument();
        await userEvent.click(screen.getByLabelText('Abandoned'));
        expect(screen.getByLabelText('Abandoned Notes')).toBeInTheDocument();
    });

    it('keeps the list visible while adding, and can be cancelled', async () => {
        renderViewer();

        await userEvent.click(screen.getByRole('button', { name: '+ Add Plan' }));
        // The existing plan is still on screen — the add form does not replace the list.
        expect(screen.getByText('Assemble ATI Committee')).toBeInTheDocument();
        expect(screen.getByText('New Plan')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.queryByText('New Plan')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: '+ Add Plan' })).toBeInTheDocument();
    });

    it('creates a new plan through the create path', async () => {
        createPlan.mockResolvedValue({});
        renderViewer();

        await userEvent.click(screen.getByRole('button', { name: '+ Add Plan' }));
        await userEvent.type(await screen.findByLabelText(/Plan Name/), 'New thing');
        await userEvent.type(screen.getByLabelText(/Description/), 'Because.');
        await userEvent.click(screen.getByRole('button', { name: 'Save Plan' }));

        await waitFor(() => expect(createPlan).toHaveBeenCalledWith(expect.objectContaining({
            name: 'New thing', description: 'Because.',
            furthered_yse_identifier: '2026-2027 1.1-web-sfsu',
        })));
    });

    it('expands by plan identity, not list position', async () => {
        renderViewer([
            plan({ unique_id: 'a', name: 'Alpha' }),
            plan({ unique_id: 'b', name: 'Bravo' }),
        ]);

        const rows = screen.getAllByRole('button', { name: 'Edit' });
        await userEvent.click(rows[1]);
        await screen.findByDisplayValue('Bravo');

        // Exactly one row is open, and it is Bravo's.
        const open = screen.getAllByRole('button', { name: 'Close' });
        expect(open).toHaveLength(1);
        expect(screen.getByDisplayValue('Bravo')).toBeInTheDocument();
    });
});
