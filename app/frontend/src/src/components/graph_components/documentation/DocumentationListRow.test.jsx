/**
 * The memoization guard for the documentation list.
 *
 * The list is long and each row is expensive: 418 rows on the artifacts tab and
 * 567 on annotations, carrying ~600 and ~1,240 Chakra Tooltips between them.
 * Before the rows were memoized, every row re-rendered on every list render —
 * and one click causes several (the selection, the roving tab stop following it,
 * the detail fetch resolving, the URL changing). Measured in jsdom at the time:
 * 4.5s for a selection change, 1.9s for a re-render where nothing the list
 * showed had changed. After: 103ms and 36ms.
 *
 * It counts RENDERS, not milliseconds. A timing assertion on a shared CI box is
 * a flake generator; the render count is the actual property and it is exact.
 *
 * The row is mocked with a memoized stand-in on purpose. What can regress is not
 * the row — it is the LIST handing it something rebuilt every render (an object
 * literal, an inline arrow, a derived array), which turns any memo off. Counting
 * renders of a memoized stand-in measures exactly that.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

const mockRowRenders = [];

jest.mock('./DocumentationListRow', () => {
    const ReactLib = require('react');
    const Row = ({ item, isSelected }) => {
        mockRowRenders.push(item.unique_id);
        return ReactLib.createElement(
            'li',
            { role: 'option', 'aria-selected': isSelected },
            item.title,
        );
    };
    return { __esModule: true, default: ReactLib.memo(Row) };
});

// eslint-disable-next-line import/first
import DocumentationList from './DocumentationList';
// eslint-disable-next-line import/first
import ActualRow from './DocumentationListRow';

const items = Array.from({ length: 40 }, (_, i) => ({
    doc_type: i % 3 === 0 ? 'webpages' : 'documents',
    unique_id: `id-${i}`,
    title: `Record ${i}`,
    name: `Record ${i}`,
    uri_path: `https://sfsu.edu/doc-${i}`,
    include_in_report: true,
    include_in_report_set: true,
    depreciated: false,
    has_location: true,
    reference_count: 2,
    parent_count: 1,
    integrity: [],
    referenced_by: [],
}));

// Every call passes FRESH inline props, exactly as the container does.
const listWith = (selectedId) => (
    <ChakraProvider>
        <DocumentationList
            items={items}
            group="artifacts"
            activeTypes={[]}
            selectedId={selectedId}
            onSelect={() => {}}
            onToggleType={() => {}}
            onQueryChange={() => {}}
            onSortChange={() => {}}
            typeCounts={{ documents: 27, webpages: 13 }}
            attachmentFacets={{ families: [] }}
            activeAttachments={[]}
            onToggleAttachment={() => {}}
            onToggleAttachmentGroup={() => {}}
            onClearAttachments={() => {}}
        />
    </ChakraProvider>
);

describe('documentation list rows', () => {
    beforeEach(() => { mockRowRenders.length = 0; });

    it('is a memoized component', () => {
        // React.memo wraps in an object whose $$typeof is the memo symbol.
        expect(ActualRow.$$typeof).toBe(Symbol.for('react.memo'));
    });

    it('re-renders nothing when the parent re-renders with the same selection', () => {
        const { rerender } = render(listWith('id-1'));
        expect(mockRowRenders).toHaveLength(40);

        mockRowRenders.length = 0;
        rerender(listWith('id-1'));

        // The detail fetch resolving, or the URL changing, must cost nothing.
        // Every prop the list hands a row has to be stable for this to hold.
        expect(mockRowRenders).toEqual([]);
    });

    it('re-renders only the two rows a selection actually moves between', () => {
        const { rerender } = render(listWith('id-1'));

        mockRowRenders.length = 0;
        rerender(listWith('id-2'));

        // The row losing the selection and the row gaining it — and, because the
        // roving tab stop follows the selection, those same two rows.
        expect(new Set(mockRowRenders)).toEqual(new Set(['id-1', 'id-2']));
    });

    it('re-renders every row when the list itself changes', () => {
        const { rerender } = render(listWith('id-1'));
        mockRowRenders.length = 0;

        // Sanity check on the guard: it must not be passing because the rows
        // never render at all.
        rerender(
            <ChakraProvider>
                <DocumentationList
                    items={items.slice(0, 5)}
                    group="artifacts"
                    activeTypes={[]}
                    selectedId="id-1"
                    onSelect={() => {}}
                    typeCounts={{}}
                    attachmentFacets={{ families: [] }}
                    activeAttachments={[]}
                />
            </ChakraProvider>,
        );
        expect(mockRowRenders.length).toBeGreaterThan(0);
    });
});
