/**
 * Editing on the detail panel itself.
 *
 * The controls are exposed rather than behind a dialog, and the form contract is
 * the one the implementation explorer's document editor uses: fill the fields,
 * then Cancel or Update. These cover that contract — the fields are there
 * without opening anything, Cancel puts the record back, and nothing is written
 * until Update.
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

const updateButton = () => screen.getByRole('button', { name: /^Update / });
const cancelButton = () => screen.getByRole('button', { name: 'Cancel' });

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

    it('offers Cancel and Update, always, like the implementations editor', () => {
        renderPanel();
        expect(updateButton()).toBeInTheDocument();
        expect(cancelButton()).toBeInTheDocument();
    });

    it('writes only what changed', async () => {
        const { onSave } = renderPanel();
        await userEvent.type(screen.getByLabelText('Name'), '!');
        await userEvent.click(updateButton());

        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
        expect(onSave).toHaveBeenCalledWith({ unique_id: 'd1', name: 'A doc!' });
    });

    it('Cancel puts the record back', async () => {
        const { onSave } = renderPanel();
        await userEvent.type(screen.getByLabelText('Name'), '!');
        await userEvent.click(cancelButton());

        await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('A doc'));
        expect(onSave).not.toHaveBeenCalled();
    });

    it('says so rather than writing when nothing was changed', async () => {
        const { onSave } = renderPanel();
        await userEvent.click(updateButton());

        await waitFor(() => expect(screen.getByText(/Nothing to update/i)).toBeInTheDocument());
        expect(onSave).not.toHaveBeenCalled();
    });

    it('shows the newly selected record, not the previous one', async () => {
        const { rerender } = renderPanel();
        await userEvent.type(screen.getByLabelText('Name'), '!');
        await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('A doc!'));

        rerender(
            <ChakraProvider>
                <MemoryRouter>
                    <DocumentationDetailPanel
                        item={doc({ unique_id: 'd2', name: 'Another doc', title: 'Another doc' })}
                        campus="sfsu"
                        onSave={jest.fn()}
                    />
                </MemoryRouter>
            </ChakraProvider>,
        );
        await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Another doc'));
    });

    it('keeps the edit on screen when the update fails', async () => {
        const onSave = jest.fn().mockRejectedValue(new Error('Neo4j said no'));
        renderPanel({ onSave });

        await userEvent.type(screen.getByLabelText('Name'), '!');
        await userEvent.click(updateButton());

        await waitFor(() => expect(screen.getByText('Neo4j said no')).toBeInTheDocument());
        expect(screen.getByLabelText('Name')).toHaveValue('A doc!');
    });

    it('states the blast radius for a shared record', () => {
        renderPanel({ item: doc({ parent_count: 7 }) });
        expect(screen.getByText(/Attached to 7 records/i)).toBeInTheDocument();
    });

    it('puts Referenced by below the editor', () => {
        renderPanel();
        const headings = screen.getAllByRole('heading')
            .map((h) => h.textContent)
            .filter((t) => t === 'Fields' || t.startsWith('Referenced by'));
        expect(headings[0]).toBe('Fields');
        expect(headings[1]).toMatch(/^Referenced by/);
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
        expect(screen.queryByRole('button', { name: /^Update / })).not.toBeInTheDocument();
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
