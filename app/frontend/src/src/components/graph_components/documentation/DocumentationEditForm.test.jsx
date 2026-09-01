/**
 * The edit form. What matters here is what it OFFERS and what it SENDS — the
 * field schema is tested separately in documentationEdit.test.js, so these cover
 * the wiring: the right controls appear for the right type, the blast radius is
 * stated before anything editable, and only changed fields leave the form.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

import DocumentationEditForm from './DocumentationEditForm';

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
    depreciated: null,
    depreciated_date: null,
    raw_text: null,
    parent_count: 1,
    ...over,
});

const setup = (item = doc(), props = {}) => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();
    render(
        <ChakraProvider>
            <DocumentationEditForm
                item={item}
                isOpen
                onClose={onClose}
                onSave={onSave}
                {...props}
            />
        </ChakraProvider>,
    );
    return { onSave, onClose };
};

const save = () => screen.getByRole('button', { name: 'Save' });

describe('DocumentationEditForm', () => {
    it('renders the fields the type supports', () => {
        setup();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Deprecated')).toBeInTheDocument();
        expect(screen.getByLabelText('Source text')).toBeInTheDocument();
    });

    it('offers no deprecation control for a Metric', () => {
        setup({
            doc_type: 'metrics', unique_id: 'm1', name: 'A metric',
            composite_key: 'k', include_in_report: true, parent_count: 1,
        });
        expect(screen.queryByLabelText('Deprecated')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Composite key')).toBeInTheDocument();
    });

    it('honours the server saying a type has no deprecation', () => {
        setup(doc({ doc_type: 'notes', content: 'hi' }), {
            capabilities: { notes: { supports_depreciation: false } },
        });
        expect(screen.queryByLabelText('Deprecated')).not.toBeInTheDocument();
    });

    it('offers three options for a tri-state, not a checkbox', () => {
        setup();
        const control = screen.getByLabelText('Deprecated');
        expect(control.tagName).toBe('SELECT');
        expect([...control.options].map((o) => o.value)).toEqual(['', 'false', 'true']);
        // A null flag reads as "not assessed", which is not the same as "no".
        expect(control.value).toBe('');
    });

    it('states the blast radius before anything editable when the record is shared', () => {
        setup(doc({ parent_count: 7 }));
        expect(screen.getByText(/attached to 7 records/i)).toBeInTheDocument();
    });

    it('says nothing about blast radius for a record with one parent', () => {
        setup(doc({ parent_count: 1 }));
        expect(screen.queryByText(/attached to/i)).not.toBeInTheDocument();
    });

    it('sends only the field that changed', async () => {
        const { onSave } = setup();

        await userEvent.clear(screen.getByLabelText('Name'));
        await userEvent.type(screen.getByLabelText('Name'), 'Renamed');
        await userEvent.click(save());

        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
        expect(onSave).toHaveBeenCalledWith({ unique_id: 'd1', name: 'Renamed' });
    });

    it('writes a tri-state as a real boolean', async () => {
        const { onSave } = setup();

        await userEvent.selectOptions(screen.getByLabelText('Deprecated'), 'true');
        await userEvent.click(save());

        await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
        expect(onSave).toHaveBeenCalledWith({ unique_id: 'd1', depreciated: true });
    });

    it('does not save when nothing was changed', async () => {
        const { onSave, onClose } = setup();
        await userEvent.click(save());

        await waitFor(() => expect(screen.getByText(/Nothing to save/i)).toBeInTheDocument());
        expect(onSave).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('closes on a successful save', async () => {
        const { onClose } = setup();
        await userEvent.clear(screen.getByLabelText('Name'));
        await userEvent.type(screen.getByLabelText('Name'), 'Renamed');
        await userEvent.click(save());

        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('stays open and reports the error when the save fails', async () => {
        const onSave = jest.fn().mockRejectedValue(new Error('Neo4j said no'));
        const onClose = jest.fn();
        render(
            <ChakraProvider>
                <DocumentationEditForm item={doc()} isOpen onClose={onClose} onSave={onSave} />
            </ChakraProvider>,
        );

        await userEvent.clear(screen.getByLabelText('Name'));
        await userEvent.type(screen.getByLabelText('Name'), 'Renamed');
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(screen.getByText('Neo4j said no')).toBeInTheDocument());
        // The edit is not lost on failure — the user can correct and retry.
        expect(onClose).not.toHaveBeenCalled();
    });
});
