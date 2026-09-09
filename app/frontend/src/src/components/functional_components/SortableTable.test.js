/**
 * Tests for the settings-area column-sort primitive: the mixed-type comparator,
 * the hook's toggle semantics, and the ARIA contract on the header cell
 * (aria-sort on the th, a real button inside it).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table, Thead, Tbody, Tr, Td } from '@chakra-ui/react';
import { compareValues, useColumnSort, SortableTh } from './SortableTable';

describe('compareValues', () => {
    it('sorts strings case-insensitively and numerically aware', () => {
        expect(compareValues('alpha', 'Beta')).toBeLessThan(0);
        expect(compareValues('goal 2', 'goal 10')).toBeLessThan(0);
    });

    it('sorts numbers numerically', () => {
        expect(compareValues(2, 10)).toBeLessThan(0);
    });

    it('puts true before false, and empty values last', () => {
        expect(compareValues(true, false)).toBeLessThan(0);
        expect(compareValues(null, 'anything')).toBeGreaterThan(0);
        expect(compareValues('anything', undefined)).toBeLessThan(0);
        expect(compareValues('', 'x')).toBeGreaterThan(0);
        expect(compareValues(null, undefined)).toBe(0);
    });
});

const ROWS = [
    { id: 'b', name: 'Beta', count: 2 },
    { id: 'a', name: 'alpha', count: 10 },
    { id: 'c', name: 'Gamma', count: null },
];

const ACCESSORS = { name: (r) => r.name, count: (r) => r.count };

function Harness() {
    const { sorted, sortKey, direction, toggleSort } = useColumnSort(ROWS, ACCESSORS);
    return (
        <Table>
            <Thead>
                <Tr>
                    <SortableTh columnKey="name" sortKey={sortKey} direction={direction} onSort={toggleSort}>
                        Name
                    </SortableTh>
                    <SortableTh columnKey="count" sortKey={sortKey} direction={direction} onSort={toggleSort}>
                        Count
                    </SortableTh>
                </Tr>
            </Thead>
            <Tbody>
                {sorted.map((r) => (
                    <Tr key={r.id}>
                        <Td>{r.name}</Td>
                    </Tr>
                ))}
            </Tbody>
        </Table>
    );
}

const rowOrder = () =>
    screen.getAllByRole('row').slice(1).map((tr) => tr.textContent);

describe('useColumnSort + SortableTh', () => {
    it('leaves rows in given order until a header is clicked', () => {
        render(<Harness />);
        expect(rowOrder()).toEqual(['Beta', 'alpha', 'Gamma']);
        expect(screen.getAllByRole('columnheader')[0]).not.toHaveAttribute('aria-sort');
    });

    it('sorts ascending on first click, descending on second, and sets aria-sort', async () => {
        render(<Harness />);
        const nameButton = screen.getByRole('button', { name: 'Name' });

        await userEvent.click(nameButton);
        expect(rowOrder()).toEqual(['alpha', 'Beta', 'Gamma']);
        expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort', 'ascending');

        await userEvent.click(nameButton);
        expect(rowOrder()).toEqual(['Gamma', 'Beta', 'alpha']);
        expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('aria-sort', 'descending');
    });

    it('switching columns resets to ascending, sorts numerically, empty last', async () => {
        render(<Harness />);
        await userEvent.click(screen.getByRole('button', { name: 'Name' }));
        await userEvent.click(screen.getByRole('button', { name: 'Count' }));

        // 2 before 10 (numeric, not lexicographic); null count last.
        expect(rowOrder()).toEqual(['Beta', 'alpha', 'Gamma']);
        expect(screen.getAllByRole('columnheader')[1]).toHaveAttribute('aria-sort', 'ascending');
        expect(screen.getAllByRole('columnheader')[0]).not.toHaveAttribute('aria-sort');
    });
});
