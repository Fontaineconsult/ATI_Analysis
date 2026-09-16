import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import IntellectualSourceList from './IntellectualSourceList';

const ITEMS = [
    {
        unique_id: 'a1',
        name: 'Commonwealth of Massachusetts ACR Review Checklist',
        publisher: 'Commonwealth of Massachusetts',
        description_short: 'A yes/no method for judging a conformance report.',
        raw_text_captured: '2026-09-16',
        informs_count: 2,
        source_count: 1,
    },
    {
        unique_id: 'b2',
        name: 'Impact-tiered ICT accessibility review',
        description_short: 'Sizes review depth to a product reach.',
        raw_text_captured: null,
        informs_count: 0,
        source_count: 4,
    },
];

const renderList = (props = {}) =>
    render(
        <ChakraProvider>
            <IntellectualSourceList items={ITEMS} {...props} />
        </ChakraProvider>,
    );

describe('IntellectualSourceList', () => {
    it('renders every source with its name', () => {
        renderList();
        expect(screen.getByText(ITEMS[0].name)).toBeInTheDocument();
        expect(screen.getByText(ITEMS[1].name)).toBeInTheDocument();
    });

    /**
     * The two diagnostics are the point of the row. A reading list nobody has read, and a
     * source nothing is wired to, are the two failure modes this tab exists to surface.
     */
    it('flags whether a source has text and whether anything is wired to it', () => {
        renderList();
        expect(screen.getByText('Has text')).toBeInTheDocument();
        expect(screen.getByText('No text')).toBeInTheDocument();
        expect(screen.getByText('Informs 2')).toBeInTheDocument();
        expect(screen.getByText('Informs nothing')).toBeInTheDocument();
    });

    it('filters on name, author and publisher', () => {
        renderList();
        const search = screen.getByPlaceholderText(/search name, author, publisher/i);

        fireEvent.change(search, { target: { value: 'Massachusetts' } });
        expect(screen.getByText(ITEMS[0].name)).toBeInTheDocument();
        expect(screen.queryByText(ITEMS[1].name)).not.toBeInTheDocument();

        // Publisher matches even though it is not in the name of the other row.
        fireEvent.change(search, { target: { value: 'impact-tiered' } });
        expect(screen.getByText(ITEMS[1].name)).toBeInTheDocument();
        expect(screen.queryByText(ITEMS[0].name)).not.toBeInTheDocument();
    });

    it('says so when nothing matches, rather than looking empty', () => {
        renderList();
        fireEvent.change(screen.getByPlaceholderText(/search name, author, publisher/i),
            { target: { value: 'zzzz' } });
        expect(screen.getByText(/no sources match/i)).toBeInTheDocument();
    });

    it('selects on click', () => {
        const onSelect = jest.fn();
        renderList({ onSelect });
        fireEvent.click(screen.getByText(ITEMS[1].name));
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ unique_id: 'b2' }));
    });

    it('is a listbox with selectable options', () => {
        renderList({ selectedId: 'a1' });
        expect(screen.getByRole('listbox', { name: /intellectual sources/i })).toBeInTheDocument();
        const options = screen.getAllByRole('option');
        expect(options).toHaveLength(2);
        expect(options[0]).toHaveAttribute('aria-selected', 'true');
        expect(options[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('shows the empty message when there are no sources at all', () => {
        render(
            <ChakraProvider>
                <IntellectualSourceList items={[]} emptyMessage="Nothing here yet." />
            </ChakraProvider>,
        );
        expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
