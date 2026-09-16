/**
 * New plan on stage: the payload carries the indicator, the status and the
 * meeting; the minutes are opened before the create and written after it;
 * the first next step lands on the new plan; unchecking "Record in the
 * minutes" writes no minutes at all.
 */
jest.mock('../../../../services/api/get', () => ({
    fetchYsesByCampusForYear: jest.fn(),
}));
jest.mock('../../../../services/api/post', () => ({
    createPlan: jest.fn(),
    addPlanSubtask: jest.fn(),
}));
jest.mock('../../../../hooks/useResource', () => jest.fn());

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import useResource from '../../../../hooks/useResource';
import { addPlanSubtask, createPlan } from '../../../../services/api/post';
import NewPlanForm, { buildNewPlanPayload } from './NewPlanForm';

const CATALOGUE = {
    academic_year: '2026-2027',
    campuses: [
        {
            abbreviation: 'sfsu', name: 'San Francisco State',
            working_groups: [
                { name: 'Web', yses: [
                    { year_identifier: '2026-2027-1.1-web-sfsu', indicator_composite_key: '1.1-web', indicator_description: 'Web policy' },
                    { year_identifier: '2026-2027-1.2-web-sfsu', indicator_composite_key: '1.2-web', indicator_description: 'Web plan' },
                ] },
                { name: 'Procurement', yses: [
                    { year_identifier: '2026-2027-2.1-pro-sfsu', indicator_composite_key: '2.1-pro', indicator_description: 'Procurement policy' },
                ] },
            ],
        },
        {
            abbreviation: 'ssu', name: 'Sonoma State',
            working_groups: [
                { name: 'Web', yses: [
                    { year_identifier: '2026-2027-1.1-web-ssu', indicator_composite_key: '1.1-web', indicator_description: 'Web policy' },
                ] },
            ],
        },
    ],
};
const CAMPUSES = [{ abbreviation: 'sfsu', name: 'San Francisco State' }, { abbreviation: 'ssu', name: 'Sonoma State' }];
const GROUPS = [{ slug: 'web', name: 'Web' }, { slug: 'procurement', name: 'Procurement' }];
const PEOPLE = [{ unique_id: 'per1', name: 'Frank Lee' }];

const renderForm = (props = {}) => {
    const ensureMinutes = jest.fn().mockResolvedValue({ unique_id: 'm1' });
    const appendMinutes = jest.fn().mockResolvedValue({ appended_line: '- 10:12 Decision: New plan: x' });
    const onCreated = jest.fn();
    const onClose = jest.fn();
    render(
        <ChakraProvider>
            <NewPlanForm
                isOpen onClose={onClose} campus="sfsu" year="2026-2027"
                campusOptions={CAMPUSES} workingGroups={GROUPS} defaultWorkingGroup="Web" people={PEOPLE}
                ensureMinutes={ensureMinutes} appendMinutes={appendMinutes} onCreated={onCreated}
                {...props}
            />
        </ChakraProvider>,
    );
    return { ensureMinutes, appendMinutes, onCreated, onClose };
};

const fillRequired = async () => {
    await userEvent.type(screen.getByPlaceholderText('What the plan is called'), 'Recruit campus leads');
    await userEvent.type(screen.getByPlaceholderText('What the plan will do, in a sentence or two'), 'One lead per campus.');
    await userEvent.selectOptions(screen.getByLabelText('Indicator'), '2026-2027-1.2-web-sfsu');
};

beforeEach(() => {
    jest.clearAllMocks();
    useResource.mockReturnValue({ data: { status: 'success', data: CATALOGUE }, loading: false, error: null });
    createPlan.mockResolvedValue({ status: 'success', data: { plan: { unique_id: 'p9', name: 'Recruit campus leads', plan_status: 'In Progress' } } });
    addPlanSubtask.mockResolvedValue({});
});

describe('buildNewPlanPayload', () => {
    it('carries the indicator, the status, the flags and the meeting', () => {
        const payload = buildNewPlanPayload(
            { name: ' A ', description: ' B ', yseIdentifier: 'y1', status: 'In Progress', isKeyPlan: true, isCampusPlan: false },
            { year: '2026-2027', minutesUniqueId: 'm1' },
        );
        expect(payload).toEqual({
            name: 'A', description: 'B', academic_year_name: '2026-2027', furthered_yse_identifier: 'y1',
            plan_status: 'In Progress', is_key_plan: true, is_campus_plan: false, minutes_unique_id: 'm1',
        });
        expect(buildNewPlanPayload(
            { name: 'A', description: 'B', yseIdentifier: 'y1', status: 'Not Started' }, { year: '2026-2027' },
        )).not.toHaveProperty('minutes_unique_id');
    });
});

describe('NewPlanForm', () => {
    it('lists the indicators of the chosen campus and working group', async () => {
        renderForm();
        const indicator = screen.getByLabelText('Indicator');
        expect(indicator).toHaveTextContent('1.1-web');
        expect(indicator).toHaveTextContent('1.2-web');
        expect(indicator).not.toHaveTextContent('2.1-pro');

        await userEvent.selectOptions(screen.getByLabelText('Working group'), 'Procurement');
        expect(screen.getByLabelText('Indicator')).toHaveTextContent('2.1-pro');
        expect(screen.getByLabelText('Indicator')).not.toHaveTextContent('1.1-web');

        await userEvent.selectOptions(screen.getByLabelText('Campus'), 'ssu');
        // Sonoma has no Procurement indicators this year.
        expect(screen.getByLabelText('Indicator')).toBeDisabled();
    });

    it('opens the minutes first, creates the plan with the meeting, then records the decision', async () => {
        const { ensureMinutes, appendMinutes, onCreated, onClose } = renderForm();
        await fillRequired();
        await userEvent.click(screen.getByRole('button', { name: 'Create plan' }));

        await waitFor(() => expect(onCreated).toHaveBeenCalled());
        expect(ensureMinutes).toHaveBeenCalledWith('Web');
        expect(createPlan).toHaveBeenCalledWith({
            name: 'Recruit campus leads', description: 'One lead per campus.',
            academic_year_name: '2026-2027', furthered_yse_identifier: '2026-2027-1.2-web-sfsu',
            plan_status: 'In Progress', is_key_plan: false, is_campus_plan: false, minutes_unique_id: 'm1',
        });
        expect(appendMinutes).toHaveBeenCalledWith('Web', {
            text: 'New plan: Recruit campus leads', planUniqueId: 'p9', kind: 'decision',
        });
        expect(addPlanSubtask).not.toHaveBeenCalled();
        expect(onCreated).toHaveBeenCalledWith(
            expect.objectContaining({ unique_id: 'p9' }),
            { campusAbbrev: 'sfsu', workingGroupSlug: 'web', workingGroupName: 'Web', onDeck: true },
        );
        expect(onClose).toHaveBeenCalled();
        // The minutes were opened before the plan was created.
        expect(ensureMinutes.mock.invocationCallOrder[0]).toBeLessThan(createPlan.mock.invocationCallOrder[0]);
    });

    it('writes the first next step on the new plan, raised in the same minutes', async () => {
        const { onCreated } = renderForm();
        await fillRequired();
        await userEvent.type(screen.getByLabelText('First next step'), 'Email the Sonoma provost');
        await userEvent.selectOptions(screen.getByLabelText('Step owner'), 'per1');
        await userEvent.click(screen.getByRole('button', { name: 'Create plan' }));

        await waitFor(() => expect(onCreated).toHaveBeenCalled());
        expect(addPlanSubtask).toHaveBeenCalledWith('p9', {
            name: 'Email the Sonoma provost', assigneePersonId: 'per1', dueOn: null,
            yearName: '2026-2027', campusAbbrev: 'sfsu', minutesUniqueId: 'm1',
        });
    });

    it('writes nothing to the minutes when the record box is unchecked', async () => {
        const { ensureMinutes, appendMinutes, onCreated } = renderForm();
        await fillRequired();
        await userEvent.click(screen.getByRole('checkbox', { name: /Record in the minutes/ }));
        await userEvent.click(screen.getByRole('button', { name: 'Create plan' }));

        await waitFor(() => expect(onCreated).toHaveBeenCalled());
        expect(ensureMinutes).not.toHaveBeenCalled();
        expect(appendMinutes).not.toHaveBeenCalled();
        expect(createPlan.mock.calls[0][0]).not.toHaveProperty('minutes_unique_id');
    });

    it('a Not Started plan is created but reported as not on deck', async () => {
        const { onCreated } = renderForm();
        await fillRequired();
        await userEvent.selectOptions(screen.getByLabelText('Status'), 'Not Started');
        expect(screen.getByText(/Only plans in progress are on deck/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Create plan' }));

        await waitFor(() => expect(onCreated).toHaveBeenCalled());
        expect(createPlan.mock.calls[0][0].plan_status).toBe('Not Started');
        expect(onCreated.mock.calls[0][1].onDeck).toBe(false);
    });

    it('a failed create keeps the form open with the error and hands nothing to the shell', async () => {
        createPlan.mockRejectedValueOnce({ response: { data: { error: 'Plan description already exists' } } });
        const { appendMinutes, onCreated, onClose } = renderForm();
        await fillRequired();
        await userEvent.click(screen.getByRole('button', { name: 'Create plan' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Plan description already exists');
        expect(appendMinutes).not.toHaveBeenCalled();
        expect(onCreated).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('cannot be sent without a name, a description and an indicator', async () => {
        renderForm();
        const button = screen.getByRole('button', { name: 'Create plan' });
        expect(button).toBeDisabled();
        await userEvent.type(screen.getByPlaceholderText('What the plan is called'), 'x');
        await userEvent.type(screen.getByPlaceholderText('What the plan will do, in a sentence or two'), 'y');
        expect(button).toBeDisabled();
        await userEvent.selectOptions(screen.getByLabelText('Indicator'), '2026-2027-1.1-web-sfsu');
        expect(button).toBeEnabled();
    });
});
