import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Text,
    VStack,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import useListboxNavigation from '../../../hooks/useListboxNavigation';
import { INTELLECTUAL_SOURCE_COLOR } from './intellectualSourceTypes';

/**
 * Flat, searchable list of IntellectualSources (single node type → no accordion), mirroring
 * PrincipleList. Selection by `unique_id` (the URL key).
 *
 * Each row carries two diagnostics, because a reading list nobody has read is the failure
 * mode here: whether the source has text yet, and whether anything is wired to it. Both come
 * from the list read's counts rather than from the edge payloads.
 *
 * Props: items, selectedId, onSelect(item), onAdd(), emptyMessage
 */
function IntellectualSourceList({ items = [], selectedId, onSelect, onAdd, emptyMessage = 'No intellectual sources yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();

    const filtered = useMemo(() => {
        if (!q) return items;
        return items.filter((it) =>
            `${it.name || ''} ${it.publisher || ''} ${it.author || ''} ${it.description_short || ''}`
                .toLowerCase().includes(q));
    }, [items, q]);

    const { getItemProps } = useListboxNavigation({
        itemCount: filtered.length,
        selectedIndex: filtered.findIndex((it) => it.unique_id === selectedId),
        onActivate: (i) => onSelect && onSelect(filtered[i]),
    });

    const hasRows = items.length > 0 && filtered.length > 0;

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button size="sm" colorScheme={INTELLECTUAL_SOURCE_COLOR} leftIcon={<AddIcon boxSize={3} />} onClick={onAdd}>
                Add Intellectual Source
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.600" />
                </InputLeftElement>
                <Input
                    placeholder="Search name, author, publisher…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: `${INTELLECTUAL_SOURCE_COLOR}.500`, boxShadow: `0 0 0 1px ${INTELLECTUAL_SOURCE_COLOR}.500` }}
                />
            </InputGroup>

            {/* The listbox options are focusable (roving tabindex), which also
                satisfies keyboard access to this scrollable region. */}
            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" overflowY="auto" flex="1" maxH="65vh"
                 role={hasRows ? 'listbox' : undefined} aria-label={hasRows ? 'Intellectual sources' : undefined}>
                {items.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">{emptyMessage}</Box>
                ) : filtered.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">No sources match “{query}”.</Box>
                ) : (
                    filtered.map((item, index) => {
                        const isSelected = item.unique_id === selectedId;
                        const informs = item.informs_count || 0;
                        // Text lives in one of two places. A source with a canonical url holds
                        // it on the node; a synthesized one holds it on the pages it was drawn
                        // from, so its node is empty by design. Reading only the node would
                        // mark every synthesized source unread forever.
                        const pagesMissing = item.sources_without_text || 0;
                        const hasText = Boolean(item.raw_text_captured) || (item.source_count > 0 && pagesMissing === 0);
                        const textLabel = hasText ? 'Has text'
                            : pagesMissing ? `${pagesMissing} page${pagesMissing === 1 ? '' : 's'} without text`
                                : 'No text';
                        return (
                            <Box
                                key={item.unique_id}
                                {...getItemProps(index)}
                                role="option"
                                aria-selected={isSelected}
                                _focusVisible={{ outline: '2px solid', outlineColor: `${INTELLECTUAL_SOURCE_COLOR}.500`, outlineOffset: '-2px' }}
                                px={3}
                                py={2}
                                cursor="pointer"
                                bg={isSelected ? `${INTELLECTUAL_SOURCE_COLOR}.50` : 'white'}
                                borderLeftWidth="3px"
                                borderLeftColor={isSelected ? `${INTELLECTUAL_SOURCE_COLOR}.500` : 'transparent'}
                                borderBottomWidth="1px"
                                borderBottomColor="gray.100"
                                _hover={{ bg: isSelected ? `${INTELLECTUAL_SOURCE_COLOR}.50` : 'gray.50' }}
                                onClick={() => onSelect && onSelect(item)}
                            >
                                <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={2}>
                                    {item.name}
                                </Text>
                                {(item.publisher || item.author) && (
                                    <Text fontSize="2xs" color="gray.600" noOfLines={1}>
                                        {[item.author, item.publisher].filter(Boolean).join(' · ')}
                                    </Text>
                                )}
                                <HStack spacing={1} mt={1} flexWrap="wrap">
                                    <Badge fontSize="2xs" colorScheme={hasText ? 'green' : pagesMissing ? 'orange' : 'gray'} variant="subtle">
                                        {textLabel}
                                    </Badge>
                                    <Badge fontSize="2xs" colorScheme={informs ? INTELLECTUAL_SOURCE_COLOR : 'gray'} variant="subtle">
                                        {informs ? `Informs ${informs}` : 'Informs nothing'}
                                    </Badge>
                                </HStack>
                                {item.description_short && (
                                    <Text fontSize="xs" color="gray.600" noOfLines={2} mt={1}>{item.description_short}</Text>
                                )}
                            </Box>
                        );
                    })
                )}
            </Box>
        </VStack>
    );
}

export default IntellectualSourceList;
