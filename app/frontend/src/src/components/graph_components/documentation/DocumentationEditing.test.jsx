/**
 * Editing on the detail panel itself.
 *
 * The controls are exposed rather than behind a dialog because the job is
 * working down a filtered list fixing records, so these tests are mostly about
 * that job: the fields are there without opening anything, an edit survives
 * jumping to another record and back, and nothing is written until you say so.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';

import DocumentationDetailPanel from './DocumentationDetailPanel';

const doc = (over = {}) => ({
    doc_type: 'documents',
    unique_id: 'd1',
    title: 'A doc',
    name: 'A doc',
    description: 'Some description',
    uri_path: 'https://sfsu.edu/doc',
    file_path: null,
    is_administrative_review_documentation: false,
    is_milestone_and_measures_documentation: false,
    include_in_report: true,
    include_in_report_set: true,
    depreciated: null,
    depreciated_date: null,
    raw_text: null,
    has_location: true,
    reference_count: 1,
    parent_count: 1,
    integrity: [],
    referenced_by: [],
    ...over,
});

const renderPanel = (props = {}) => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const utils = render(
        <ChakraProvider>
            <MemoryRouter>
                <DocumentationDetailPanel item={doc()} campus="sfsu" onSave={onSave} {...props} />
            </MemoryRouter>
        </ChakraProvider>,
    );
    return { onSave, ...utils };
};

const saveBar = () => screen.queryByRole('button', { name: 'Save' });

describe('editing on the panel', () => {
    it('shows the fields without opening anything', () => {
        renderPanel();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Deprecated')).toBeInTheDocument();
        // Nothing to open, and nothing to close.
        expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('offers no save bar until something changes', async () => {
        renderPanel();
        expect(saveBar()).not.toBeInTheDocument();

        await userEvent.type(screen.getByLabelText('Name'), '!');
        await waitFor(() => expect(saveBar()).toBeInTheDocument());
    });

    it('counts the unsaved changes and marks the fields that changed', async () => {
        renderPanel();
        await userEvent.type(screen.getByLabelText('Name'), '!');

        await waitFor(() => expect(screen.getByText('1 unsaved')).toBeInTheDocument());
        expect(screen.getByText('changed')).toBeInTheDocument();

        await userEvent.selectOptions(screen.getByLabelText('Deprecated'), 'true');
        await waitFor(() => expect(screen.getByText('2 unsaved')).toBeInTheDocument());
    });

    it('writes only what changed', async () => {
        const { onSave } = renderPanel();
        await userEvent.type(screen.getByLabelText('Name'), '!');
        await userEvent.click(saveBar());

        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
        expect(onSave).toHaveBeenCalledWith({ unique_id: 'd1', name: 'A doc!' });
    });

    it('reverts to the stored values', async () => {
        const { onSave } = renderPanel();
        await userEvent.type(screen.getByLabelText('Name'), '!');
        await userEvent.click(screen.getByRole('button', { name: 'Revert' }));

        await waitFor(() => expect(saveBar()).not.toBeInTheDocument());
        expect(screen.getByLabelText('Name')).toHaveValue('A doc');
        expect(onSave).not.toHaveBeenCalled();
    });

    /** The property that makes it safe to jump around a list while working. */
    it('keeps an unsaved edit when you move to another record and back', async () => {
        const { rerender } = renderPanel();
        await userEvent.type(screen.getByLabelText('Name'), '!');
        await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('A doc!'));

        const other = doc({ unique_id: 'd2', name: 'Another doc', title: 'Another doc' });
        const back = doc();
        const wrap = (item) => (
            <ChakraProvider>
                <MemoryRouter>
                    <DocumentationDetailPanel item={item} campus="sfsu" onSave={jest.fn()} />
                </MemoryRouter>
            </ChakraProvider>
        );

        rerender(wrap(other));
        await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Another doc'));
        // The other record is clean — the draft belongs to d1, not to the panel.
        expect(saveBar()).not.toBeInTheDocument();

        rerender(wrap(back));
        await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('A doc!'));
        expect(saveBar()).toBeInTheDocument();
    });

    it('clears the draft once saved', async () => {
        const { onSave, rerender } = renderPanel();
        await userEvent.type(screen.getByLabelText('Name'), '!');
        await userEvent.click(saveBar());
        await waitFor(() => expect(onSave).toHaveBeenCalled());

        // The container refetches; the saved record comes back with the new name.
        rerender(
            <ChakraProvider>
                <MemoryRouter>
                    <DocumentationDetailPanel
                        item={doc({ name: 'A doc!', title: 'A doc!' })}
                        campus="sfsu"
                        onSave={onSave}
                    />
                </MemoryRouter>
            </ChakraProvider>,
        );
        await waitFor(() => expect(saveBar()).not.toBeInTheDocument());
    });

    it('keeps the edit on screen when the save fails', async () => {
        const onSave = jest.fn().mockRejectedValue(new Error('Neo4j said no'));
        renderPanel({ onSave });

        await userEvent.type(screen.getByLabelText('Name'), '!');
        await userEvent.click(saveBar());

        await waitFor(() => expect(screen.getByText('Neo4j said no')).toBeInTheDocument());
        expect(screen.getByLabelText('Name')).toHaveValue('A doc!');
        // Awaited, not asserted inline: the toast fires in the catch and the
        // button leaves its "Saving" state in the finally, so the button is
        // still named "Saving" at the instant the toast appears.
        await waitFor(() => expect(saveBar()).toBeInTheDocument());
    });

    it('states the blast radius for a shared record', () => {
        renderPanel({ item: doc({ parent_count: 7 }) });
        expect(screen.getByText(/Attached to 7 records/i)).toBeInTheDocument();
    });

    it('renders read-only with no save handler', () => {
        render(
            <ChakraProvider>
                <MemoryRouter>
                    <DocumentationDetailPanel item={doc()} campus="sfsu" />
                </MemoryRouter>
            </ChakraProvider>,
        );
        expect(screen.getByText('Read-only in this context.')).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeDisabled();
    });

    it('does not offer deprecation for a Metric', () => {
        renderPanel({
            item: doc({
                doc_type: 'metrics', unique_id: 'm1', name: 'A metric',
                composite_key: 'k', has_location: false,
            }),
        });
        expect(screen.queryByLabelText('Deprecated')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Composite key')).toBeInTheDocument();
    });

    it('gives a URL field a button that opens it', () => {
        renderPanel();
        const open = screen.getByRole('link', { name: /Open Link \(URI\) in a new tab/i });
        expect(open).toHaveAttribute('href', 'https://sfsu.edu/doc');
        expect(open).toHaveAttribute('target', '_blank');
    });

    it('says when the report flag has never been set', () => {
        renderPanel({ item: doc({ include_in_report_set: false }) });
        expect(screen.getByText(/never been explicitly set/i)).toBeInTheDocument();
    });

    it('does not repeat the locator as read-only text', () => {
        renderPanel();
        // The locator is an input; a second, non-editable rendering of the same
        // value would be two places to look and two places to disagree.
        const inputs = screen.getAllByDisplayValue('https://sfsu.edu/doc');
        expect(inputs).toHaveLength(1);
    });
});
