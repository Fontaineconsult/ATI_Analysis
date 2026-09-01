import React, { useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Button,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    List,
    Select,
    Text,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

import useListboxNavigation from '../../../hooks/useListboxNavigation';
import DocumentationAttachmentFilter from './DocumentationAttachmentFilter';
import { Loading } from '../common/Loading';
import DocumentationListRow from './DocumentationListRow';
import {
    DOC_SORTS,
    DOC_SORT_ORDER,
    DOC_TYPES,
    searchDocumentation,
    sortDocumentation,
    typesInGroup,
} from './documentationConfig';

/**
 * Selectable list for the Documentation area.
 *
 * Two things here serve the primary use, which is reconciling records rather
 * than looking one up:
 *
 *  1. Sorting defaults to name and offers "Location", so near-duplicates land
 *     next to each other. The 45 Documents all named "Minutes PDF" at the same
 *     example.edu URL are only obvious when they are adjacent.
 *  2. Every row carries its reference count and the locator, because deciding
 *     which of two similar records is authoritative depends on what points at
 *     each and where each one lives.
 *  3. The "Attached to" facet narrows by what a record documents rather than by
 *     what it is — the one question that crosses types, and the reason two
 *     Documents can be the same type and have nothing to do with each other.
 *
 * Rows are a separate memoized component and the keyboard handlers come from
 * useListboxNavigation's STABLE `itemHandlers`, not from getItemProps. With 418
 * rows carrying ~600 tooltips between them, rendering them inline meant every
 * row re-rendered on every list render — and a click causes several. See
 * DocumentationListRow for the measurements.
 *
 * Keyboard behaviour comes from useListboxNavigation — one tab stop, arrows move
 * focus without selecting, Enter/Space select (design-sense §6.1, APG Listbox).
 */
function DocumentationList({
    items = [],
    group,
    activeTypes = [],
    onToggleType,
    selectedId = null,
    onSelect,
    query = '',
    onQueryChange,
    sortKey = 'name',
    onSortChange,
    typeCounts = {},
    attachmentFacets = { families: [] },
    activeAttachments = [],
    onToggleAttachment,
    onToggleAttachmentGroup,
    onClearAttachments,
    loading = false,
}) {
    const groupTypes = typesInGroup(group);

    const visible = useMemo(() => {
        const byType = activeTypes.length
            ? items.filter((i) => activeTypes.includes(i.doc_type))
            : items;
        return sortDocumentation(searchDocumentation(byType, query), sortKey);
    }, [items, activeTypes, query, sortKey]);

    const selectedIndex = visible.findIndex((i) => i.unique_id === selectedId);

    const { focusedIndex, itemHandlers } = useListboxNavigation({
        itemCount: visible.length,
        selectedIndex,
        onActivate: (i) => onSelect?.(visible[i]),
    });

    // Stable for the life of the list, so the memoized rows are not invalidated
    // by their own handlers changing identity.
    const { registerItem, onItemFocus, onItemKeyDown } = itemHandlers;

    // onSelect arrives inline from the container, so it changes identity every
    // render; pinning it here keeps that from reaching the rows.
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const handleSelect = useCallback((item) => onSelectRef.current?.(item), []);

    return (
        <Box>
            <HStack spacing={2} mb={2}>
                <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.600" boxSize={3} />
                    </InputLeftElement>
                    <Input
                        placeholder="Search name, location, content, parent…"
                        value={query}
                        onChange={(e) => onQueryChange?.(e.target.value)}
                        borderColor="gray.300"
                        _focus={{
                            borderColor: 'teal.500',
                            boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)',
                        }}
                        aria-label="Search documentation"
                    />
                </InputGroup>
                <Select
                    size="sm"
                    value={sortKey}
                    onChange={(e) => onSortChange?.(e.target.value)}
                    maxW="150px"
                    flexShrink={0}
                    aria-label="Sort documentation"
                    borderColor="gray.300"
                >
                    {DOC_SORT_ORDER.map((key) => (
                        <option key={key} value={key}>{DOC_SORTS[key].label}</option>
                    ))}
                </Select>
            </HStack>

            {/* Type narrowing. aria-pressed toggle buttons, not links — these
                filter in place and never navigate. */}
            <Wrap spacing={1} mb={2}>
                {groupTypes.map((type) => {
                    const active = activeTypes.includes(type);
                    return (
                        <WrapItem key={type}>
                            <Button
                                size="xs"
                                variant={active ? 'solid' : 'outline'}
                                colorScheme={active ? DOC_TYPES[type].colorScheme : 'gray'}
                                onClick={() => onToggleType?.(type)}
                                aria-pressed={active}
                            >
                                {DOC_TYPES[type].plural} ({typeCounts[type] ?? 0})
                            </Button>
                        </WrapItem>
                    );
                })}
            </Wrap>

            <DocumentationAttachmentFilter
                facets={attachmentFacets}
                selected={activeAttachments}
                onToggle={onToggleAttachment}
                onToggleGroup={onToggleAttachmentGroup}
                onClear={onClearAttachments}
            />

            {/* One live region, two states. The spinner replaces the count
                rather than sitting beside it, and Loading is rendered with
                live={false} so we do not nest a second aria-live inside this
                one — design-sense §5 (loading, inline). */}
            <Box mb={2} role="status" aria-live="polite">
                {loading
                    ? <Loading label="Loading documentation…" live={false} />
                    : (
                        <Text fontSize="xs" color="gray.600">
                            {`${visible.length} ${visible.length === 1 ? 'record' : 'records'}`}
                        </Text>
                    )}
            </Box>

            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                boxShadow="sm"
                maxH="70vh"
                overflowY="auto"
            >
                {visible.length === 0 ? (
                    <Text p={4} fontSize="sm" color="gray.600" fontStyle="italic">
                        {query
                            ? `No documentation matches “${query}”.`
                            : 'No documentation of this type yet.'}
                    </Text>
                ) : (
                    <List role="listbox" aria-label={`${group} documentation`}>
                        {visible.map((item, index) => (
                            <DocumentationListRow
                                key={item.unique_id}
                                item={item}
                                index={index}
                                isSelected={item.unique_id === selectedId}
                                isFocused={index === focusedIndex}
                                onSelect={handleSelect}
                                registerItem={registerItem}
                                onItemFocus={onItemFocus}
                                onItemKeyDown={onItemKeyDown}
                            />
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );
}

export default DocumentationList;
