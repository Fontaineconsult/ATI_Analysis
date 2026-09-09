import React, { useMemo, useState } from 'react';
import { Button, Th } from '@chakra-ui/react';
import { TriangleDownIcon, TriangleUpIcon, UpDownIcon } from '@chakra-ui/icons';

/**
 * Column sorting for plain Chakra tables — the settings-area idiom.
 *
 * Split in two so the table keeps real `table`/`th` semantics (design-sense §6.1,
 * APG Table/Sortable Table pattern): `useColumnSort` owns the sort state and the
 * sorted rows; `SortableTh` renders a header cell whose accessible machinery is
 * right — `aria-sort` on the th, a real button inside it, and a visible
 * direction glyph so sort state is never color-only.
 *
 * Usage:
 *   const ACCESSORS = { name: (r) => r.name, count: (r) => r.count };  // module-level
 *   const { sorted, sortKey, direction, toggleSort } = useColumnSort(rows, ACCESSORS);
 *   <SortableTh columnKey="name" sortKey={sortKey} direction={direction} onSort={toggleSort}>
 *       Name
 *   </SortableTh>
 *
 * Define the accessor map at module level (or useMemo it) — it is a dependency
 * of the internal memo.
 */

/** Mixed-type comparator: null/undefined sort last, numbers numerically,
 *  booleans true-first, strings case-insensitively. */
export const compareValues = (a, b) => {
    const aEmpty = a === null || a === undefined || a === '';
    const bEmpty = b === null || b === undefined || b === '';
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : (a ? -1 : 1);
    return String(a).localeCompare(String(b), undefined, { sensitivity: 'base', numeric: true });
};

export function useColumnSort(items, accessors, initialKey = null, initialDirection = 'asc') {
    const [sortKey, setSortKey] = useState(initialKey);
    const [direction, setDirection] = useState(initialDirection);

    const toggleSort = (key) => {
        if (key === sortKey) {
            setDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setDirection('asc');
        }
    };

    const sorted = useMemo(() => {
        const accessor = sortKey ? accessors[sortKey] : null;
        if (!accessor) return items;
        const rows = [...(items || [])];
        rows.sort((a, b) => compareValues(accessor(a), accessor(b)));
        if (direction === 'desc') rows.reverse();
        return rows;
    }, [items, accessors, sortKey, direction]);

    return { sorted, sortKey, direction, toggleSort };
}

/**
 * A sortable header cell. Empty-values-last and direction toggling come from
 * `useColumnSort`; this only renders the th + button + glyph. Non-sortable
 * columns keep using a plain `Th` beside these.
 */
export function SortableTh({ columnKey, sortKey, direction, onSort, children, isNumeric, ...rest }) {
    const active = sortKey === columnKey;
    const ariaSort = active ? (direction === 'asc' ? 'ascending' : 'descending') : undefined;
    const glyph = active
        ? (direction === 'asc' ? <TriangleUpIcon boxSize={2.5} /> : <TriangleDownIcon boxSize={2.5} />)
        : <UpDownIcon boxSize={2.5} color="gray.500" />;

    return (
        <Th aria-sort={ariaSort} isNumeric={isNumeric} px={1} py={0} {...rest}>
            <Button
                variant="ghost"
                size="xs"
                onClick={() => onSort(columnKey)}
                rightIcon={glyph}
                color="gray.700"
                fontWeight="semibold"
                fontSize="xs"
                textTransform="uppercase"
                letterSpacing="wider"
                px={2}
                borderRadius="sm"
                _hover={{ bg: 'gray.100' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
            >
                {children}
            </Button>
        </Th>
    );
}
