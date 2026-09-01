import React, { useMemo } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    List,
    ListItem,
    Select,
    Text,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

import useListboxNavigation from '../../../hooks/useListboxNavigation';
import DocumentationAttachmentFilter from './DocumentationAttachmentFilter';
import { DocumentationBadgeRow } from './DocumentationBadges';
import {
    DOC_SORTS,
    DOC_SORT_ORDER,
    DOC_TYPES,
    getTypeLabel,
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

    const { getItemProps } = useListboxNavigation({
        itemCount: visible.length,
        selectedIndex,
        onActivate: (i) => onSelect?.(visible[i]),
    });

    const locatorOf = (item) => item.url || item.uri_path || item.file_path || '';

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

            <Text fontSize="xs" color="gray.600" mb={2} aria-live="polite">
                {loading
                    ? 'Loading…'
                    : `${visible.length} ${visible.length === 1 ? 'record' : 'records'}`}
            </Text>

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
                        {visible.map((item, index) => {
                            const isSelected = item.unique_id === selectedId;
                            const locator = locatorOf(item);
                            return (
                                <ListItem
                                    key={item.unique_id}
                                    {...getItemProps(index)}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => onSelect?.(item)}
                                    px={3}
                                    py={2}
                                    cursor="pointer"
                                    bg={isSelected ? 'teal.50' : 'white'}
                                    borderLeftWidth="3px"
                                    borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                                    borderBottomWidth="1px"
                                    borderBottomColor="gray.100"
                                    _hover={{ bg: isSelected ? 'teal.50' : 'gray.50', boxShadow: 'md' }}
                                    _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
                                >
                                    <HStack justify="space-between" align="flex-start" spacing={2}>
                                        <Box minW="0" flex="1">
                                            <Text fontSize="sm" fontWeight="medium" color="gray.800" noOfLines={2}>
                                                {item.title || <em>Untitled</em>}
                                            </Text>
                                            {locator && (
                                                <Text
                                                    fontSize="2xs"
                                                    color="gray.600"
                                                    fontFamily="mono"
                                                    noOfLines={1}
                                                    title={locator}
                                                >
                                                    {locator}
                                                </Text>
                                            )}
                                        </Box>
                                        {/* Reference count is red at zero — an orphan is the
                                            thing you most need to notice while scanning. */}
                                        <Badge
                                            flexShrink={0}
                                            colorScheme={item.reference_count ? 'gray' : 'red'}
                                            borderRadius="full"
                                            fontSize="2xs"
                                            title={`${item.reference_count} reference(s), ${item.parent_count} record(s)`}
                                        >
                                            {item.reference_count}
                                        </Badge>
                                    </HStack>
                                    <Wrap spacing={1} mt={1}>
                                        <WrapItem>
                                            <Badge
                                                colorScheme={DOC_TYPES[item.doc_type]?.colorScheme || 'gray'}
                                                borderRadius="md"
                                                fontSize="2xs"
                                                textTransform="uppercase"
                                            >
                                                {getTypeLabel(item.doc_type)}
                                            </Badge>
                                        </WrapItem>
                                        <WrapItem>
                                            <HStack spacing={1}>
                                                <DocumentationBadgeRow item={item} />
                                            </HStack>
                                        </WrapItem>
                                    </Wrap>
                                </ListItem>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Box>
    );
}

export default DocumentationList;
