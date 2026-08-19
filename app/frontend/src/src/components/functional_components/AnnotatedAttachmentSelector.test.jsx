/**
 * The shared editor for edges that carry properties. Tested against a generic
 * two-field schema rather than any one consumer's, since the point of the component
 * is that the schema — not the component — decides what an edge carries.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import AnnotatedAttachmentSelector from './AnnotatedAttachmentSelector';

const FIELDS = [
    { name: 'ref', label: 'Ref', type: 'text', mono: true, display: 'badge' },
    { name: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 2, display: 'quote' },
    { name: 'why', label: 'Why', type: 'text', display: 'muted' },
];

const CANDIDATES = [
    { unique_id: 'a', label: 'Alpha', group: 'Group One' },
    { unique_id: 'b', label: 'Bravo', group: 'Group One' },
    { unique_id: 'c', label: 'Charlie', group: 'Group Two' },
];

const setup = (props = {}) => {
    const handlers = {
        onAttach: jest.fn().mockResolvedValue({}),
        onUpdate: jest.fn().mockResolvedValue({}),
        onDetach: jest.fn().mockResolvedValue({}),
        afterChange: jest.fn(),
    };
    const utils = render(
        <ChakraProvider>
            <AnnotatedAttachmentSelector
                entityLabel="Link"
                fields={FIELDS}
                candidates={CANDIDATES}
                attached={[]}
                {...handlers}
                {...props}
            />
        </ChakraProvider>,
    );
    return { ...utils, ...handlers };
};

it('renders the empty state and an add affordance', () => {
    setup({ emptyLabel: 'Nothing here yet.' });
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Link an item' })).toBeInTheDocument();
});

it('renders optgroups in candidate order and omits already-attached items', async () => {
    const { container } = setup({
        attached: [{ unique_id: 'a', label: 'Alpha' }],
    });

    await userEvent.click(screen.getByRole('button', { name: '+ Link an item' }));

    expect(Array.from(container.querySelectorAll('optgroup')).map((g) => g.label))
        .toEqual(['Group One', 'Group Two']);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options).toContain('Bravo');
    expect(options).not.toContain('Alpha');
});

it('renders ungrouped candidates without an optgroup', async () => {
    const { container } = setup({ candidates: [{ unique_id: 'x', label: 'Xray' }] });
    await userEvent.click(screen.getByRole('button', { name: '+ Link an item' }));
    expect(container.querySelectorAll('optgroup')).toHaveLength(0);
    expect(screen.getByRole('option', { name: 'Xray' })).toBeInTheDocument();
});

it('passes the collected field values to onAttach', async () => {
    const { onAttach, afterChange } = setup();

    await userEvent.click(screen.getByRole('button', { name: '+ Link an item' }));
    await userEvent.selectOptions(screen.getByLabelText('Item'), 'c');
    await userEvent.type(screen.getByLabelText('Ref'), 'R-1');
    await userEvent.type(screen.getByLabelText('Excerpt'), 'some text');
    await userEvent.click(screen.getByRole('button', { name: 'Link' }));

    await waitFor(() => expect(onAttach).toHaveBeenCalledWith('c', { ref: 'R-1', excerpt: 'some text', why: '' }));
    expect(afterChange).toHaveBeenCalled();
});

it('renders each field according to its display mode', () => {
    setup({
        attached: [{
            unique_id: 'a', label: 'Alpha', badge: 'A-1',
            ref: 'R-9', excerpt: 'the quoted sentence', why: 'the reason',
        }],
    });

    expect(screen.getByText('A-1')).toBeInTheDocument();          // badge column
    expect(screen.getByText('R-9')).toBeInTheDocument();          // display: badge
    expect(screen.getByText('the quoted sentence')).toBeInTheDocument();  // display: quote
    expect(screen.getByText('the reason')).toBeInTheDocument();   // display: muted
});

it('edits an attached row in place, seeded from its current values', async () => {
    const { onUpdate } = setup({
        attached: [{ unique_id: 'a', label: 'Alpha', ref: 'R-9', excerpt: 'keep me', why: '' }],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Excerpt')).toHaveValue('keep me');

    const ref = screen.getByLabelText('Ref');
    await userEvent.clear(ref);
    await userEvent.type(ref, 'R-10');
    await userEvent.click(screen.getByRole('button', { name: 'Save link' }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith('a', { ref: 'R-10', excerpt: 'keep me', why: '' }));
});

it('hides the edit control when no onUpdate is supplied', () => {
    setup({ attached: [{ unique_id: 'a', label: 'Alpha' }], onUpdate: undefined });
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
});

it('detaches a row', async () => {
    const { onDetach } = setup({ attached: [{ unique_id: 'a', label: 'Alpha' }] });
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(onDetach).toHaveBeenCalledWith('a'));
});

it('shows a flag badge only when the predicate matches', () => {
    const flag = { when: (i) => !i.ref, label: 'Unreferenced', colorScheme: 'orange', tooltip: 'no ref' };
    const { rerender } = setup({ attached: [{ unique_id: 'a', label: 'Alpha' }], flag });
    expect(screen.getByText('Unreferenced')).toBeInTheDocument();

    rerender(
        <ChakraProvider>
            <AnnotatedAttachmentSelector
                entityLabel="Link" fields={FIELDS} candidates={CANDIDATES} flag={flag}
                attached={[{ unique_id: 'a', label: 'Alpha', ref: 'R-1' }]}
                onAttach={jest.fn()} onUpdate={jest.fn()} onDetach={jest.fn()}
            />
        </ChakraProvider>,
    );
    expect(screen.queryByText('Unreferenced')).not.toBeInTheDocument();
});

it('works with no fields at all, as a plain grouped attach surface', async () => {
    const { onAttach } = setup({ fields: [] });
    await userEvent.click(screen.getByRole('button', { name: '+ Link an item' }));
    await userEvent.selectOptions(screen.getByLabelText('Item'), 'a');
    await userEvent.click(screen.getByRole('button', { name: 'Link' }));
    await waitFor(() => expect(onAttach).toHaveBeenCalledWith('a', {}));
});

it('reports a failed attach without clearing the composer', async () => {
    const onAttach = jest.fn().mockRejectedValue(new Error('nope'));
    setup({ onAttach });

    await userEvent.click(screen.getByRole('button', { name: '+ Link an item' }));
    await userEvent.selectOptions(screen.getByLabelText('Item'), 'a');
    await userEvent.type(screen.getByLabelText('Ref'), 'R-1');
    await userEvent.click(screen.getByRole('button', { name: 'Link' }));

    await waitFor(() => expect(screen.getByLabelText('Ref')).toHaveValue('R-1'));
});
