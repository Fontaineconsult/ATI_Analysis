/**
 * RTL tests for the Documentation list.
 *
 * Two things are worth locking down here: the APG listbox keyboard contract
 * (arrows move focus WITHOUT selecting, so arrowing doesn't thrash the detail
 * panel), and the reconciliation affordances — sorting by location so
 * near-duplicates cluster, and searching parent titles as well as own fields.
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';

import DocumentationList from './DocumentationList';

const item = (over = {}) => ({
    doc_type: 'documents',
    unique_id: 'd1',
    title: 'A document',
    include_in_report: true,
    include_in_report_set: true,
    depreciated: false,
    has_location: true,
    reference_count: 1,
    parent_count: 1,
    integrity: [],
    referenced_by: [],
    ...over,
});

const items = [
    item({ unique_id: 'a', title: 'Zeta guidance', uri_path: 'https://example.edu/minutes.pdf', reference_count: 0, parent_count: 0 }),
    item({ unique_id: 'b', title: 'Alpha policy', uri_path: 'https://sfsu.edu/policy' }),
    item({ unique_id: 'c', title: 'Mu handbook', uri_path: 'https://example.edu/minutes.pdf' }),
    item({ unique_id: 'd', doc_type: 'webpages', title: 'Captions page', url: 'https://sfsu.edu/captions',
        referenced_by: [{ parent_title: 'Captioning Process', parent_label: 'Process' }] }),
];

/**
 * Scope option queries to the listbox. The sort control is a native <select>,
 * whose <option> children also carry role="option" — a global getAllByRole
 * would mix the two.
 */
const options = () => within(screen.getByRole('listbox')).getAllByRole('option');

const renderList = (props = {}) => render(
    <ChakraProvider>
        <DocumentationList
            items={items}
            group="artifacts"
            activeTypes={[]}
            typeCounts={{ documents: 3, webpages: 1 }}
            sortKey="name"
            {...props}
        />
    </ChakraProvider>,
);

describe('DocumentationList — listbox contract', () => {
    it('exposes a listbox with one option per record', () => {
        renderList();
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(options()).toHaveLength(4);
    });

    it('has exactly one tab stop', () => {
        renderList();
        const tabbable = options().filter((o) => o.getAttribute('tabindex') === '0');
        expect(tabbable).toHaveLength(1);
    });

    it('marks only the selected row aria-selected', () => {
        renderList({ selectedId: 'b' });
        const selected = options().filter((o) => o.getAttribute('aria-selected') === 'true');
        expect(selected).toHaveLength(1);
        expect(within(selected[0]).getByText('Alpha policy')).toBeInTheDocument();
    });

    it('selects on click', async () => {
        const onSelect = jest.fn();
        renderList({ onSelect });
        await userEvent.click(screen.getByText('Alpha policy'));
        expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ unique_id: 'b' }));
    });

    it('moving focus with the arrow keys does not select', async () => {
        const onSelect = jest.fn();
        renderList({ onSelect });
        options()[0].focus();
        await userEvent.keyboard('{ArrowDown}');
        // Focus moved, but nothing was activated — this is what keeps arrowing
        // through a long list from refetching a detail panel on every keypress.
        expect(onSelect).not.toHaveBeenCalled();
    });

    it('activates the focused option on Enter', async () => {
        const onSelect = jest.fn();
        renderList({ onSelect });
        options()[0].focus();
        await userEvent.keyboard('{Enter}');
        expect(onSelect).toHaveBeenCalled();
    });
});

describe('DocumentationList — reconciliation affordances', () => {
    it('clusters records that share a location when sorted by location', () => {
        renderList({ sortKey: 'locator' });
        const titles = options().map((o) => o.textContent);
        // The two example.edu records must be adjacent — spotting 45 identical
        // fixtures depends on them sitting together, not on searching one by one.
        const zeta = titles.findIndex((t) => t.includes('Zeta guidance'));
        const mu = titles.findIndex((t) => t.includes('Mu handbook'));
        expect(Math.abs(zeta - mu)).toBe(1);
    });

    it('shows the reference count on every row, red at zero', () => {
        renderList();
        const orphanRow = options().find((o) => o.textContent.includes('Zeta guidance'));
        expect(within(orphanRow).getByText('0')).toBeInTheDocument();
    });

    it('shows the locator under the title so duplicates are visible', () => {
        renderList();
        expect(screen.getAllByTitle('https://example.edu/minutes.pdf').length).toBeGreaterThan(0);
    });
});

describe('DocumentationList — search and filtering', () => {
    it('filters by the record’s own title', async () => {
        renderList({ query: 'alpha' });
        expect(options()).toHaveLength(1);
        expect(screen.getByText('Alpha policy')).toBeInTheDocument();
    });

    it('finds a record by its parent’s title', () => {
        // Reconciliation usually starts from what a record is attached to.
        renderList({ query: 'captioning process' });
        expect(options()).toHaveLength(1);
        expect(screen.getByText('Captions page')).toBeInTheDocument();
    });

    it('reports the count in a live region', () => {
        renderList({ query: 'alpha' });
        expect(screen.getByText('1 record')).toBeInTheDocument();
    });

    it('distinguishes no-matches from an empty collection', () => {
        renderList({ query: 'nothingmatchesthis' });
        expect(screen.getByText(/No documentation matches/)).toBeInTheDocument();

        renderList({ items: [], query: '' });
        expect(screen.getByText(/No documentation of this type yet/)).toBeInTheDocument();
    });

    it('renders type chips as aria-pressed toggles, not links', async () => {
        const onToggleType = jest.fn();
        renderList({ onToggleType, activeTypes: ['documents'] });

        const chip = screen.getByRole('button', { name: /Documents \(3\)/ });
        expect(chip).toHaveAttribute('aria-pressed', 'true');

        await userEvent.click(screen.getByRole('button', { name: /Webpages \(1\)/ }));
        expect(onToggleType).toHaveBeenCalledWith('webpages');
    });

    it('narrows to the active types', () => {
        renderList({ activeTypes: ['webpages'] });
        expect(options()).toHaveLength(1);
        expect(screen.getByText('Captions page')).toBeInTheDocument();
    });
});
