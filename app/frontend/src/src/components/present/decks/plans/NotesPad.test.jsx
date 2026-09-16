/**
 * The notes pad: Enter saves a note, the kind buttons prefix, Make task
 * hands the owner and due date through, and the saved body renders.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import NotesPad from './NotesPad';

const PLAN = { unique_id: 'p1', name: 'Assemble ATI Committee', working_groups: ['Web'] };
const PEOPLE = [{ unique_id: 'per1', name: 'Frank Lee' }];

const renderPad = (props = {}) => {
    const onAppend = jest.fn().mockResolvedValue({ appended_line: '- 10:04 note' });
    const onMakeTask = jest.fn().mockResolvedValue({});
    render(
        <ChakraProvider>
            <NotesPad plan={PLAN} workingGroupName="Web" minutes={null} busy={false} error={null}
                      onAppend={onAppend} onMakeTask={onMakeTask} people={PEOPLE} {...props} />
        </ChakraProvider>,
    );
    return { onAppend, onMakeTask };
};

describe('NotesPad', () => {
    it('saves a note on Enter and clears the input', async () => {
        const { onAppend } = renderPad();
        const input = screen.getByLabelText('Meeting note');
        await userEvent.type(input, 'Frank confirmed two leads{Enter}');
        expect(onAppend).toHaveBeenCalledWith({ text: 'Frank confirmed two leads', kind: 'note' });
        expect(input).toHaveValue('');
    });

    it('Shift+Enter is a newline, not a save', async () => {
        const { onAppend } = renderPad();
        const input = screen.getByLabelText('Meeting note');
        await userEvent.type(input, 'line one{Shift>}{Enter}{/Shift}line two');
        expect(onAppend).not.toHaveBeenCalled();
        expect(input).toHaveValue('line one\nline two');
    });

    it('Decision and Ask pass their kind', async () => {
        const { onAppend } = renderPad();
        await userEvent.type(screen.getByLabelText('Meeting note'), 'monthly cadence');
        await userEvent.click(screen.getByRole('button', { name: 'Decision' }));
        expect(onAppend).toHaveBeenCalledWith({ text: 'monthly cadence', kind: 'decision' });
        await userEvent.type(screen.getByLabelText('Meeting note'), 'who owns the charter');
        await userEvent.click(screen.getByRole('button', { name: 'Ask' }));
        expect(onAppend).toHaveBeenLastCalledWith({ text: 'who owns the charter', kind: 'ask' });
    });

    it('Make task carries the owner and due date', async () => {
        const { onMakeTask } = renderPad();
        await userEvent.type(screen.getByLabelText('Meeting note'), 'Recruit Sonoma lead');
        await userEvent.click(screen.getByRole('button', { name: 'Make task' }));
        await userEvent.selectOptions(screen.getByLabelText('Task owner'), 'per1');
        await userEvent.type(screen.getByLabelText('Task due date'), '2026-10-01');
        await userEvent.click(screen.getByRole('button', { name: 'Save task' }));
        expect(onMakeTask).toHaveBeenCalledWith({ text: 'Recruit Sonoma lead', assigneeId: 'per1', dueOn: '2026-10-01' });
    });

    it('renders the saved minutes body', () => {
        renderPad({ minutes: { title: 'Web working group, 2026-09-12', content: '### Assemble ATI Committee\n- 10:04 Daniel: two leads confirmed' } });
        expect(screen.getByText('Web working group, 2026-09-12')).toBeInTheDocument();
        expect(screen.getByText('10:04 Daniel: two leads confirmed')).toBeInTheDocument();
    });

    it('surfaces a save error inline and puts the draft back', async () => {
        const onAppend = jest.fn().mockRejectedValue(new Error('Asana said no'));
        renderPad({ onAppend });
        await userEvent.type(screen.getByLabelText('Meeting note'), 'x{Enter}');
        expect(await screen.findByRole('alert')).toHaveTextContent('Asana said no');
        expect(screen.getByLabelText('Meeting note')).toHaveValue('x');
    });
});
