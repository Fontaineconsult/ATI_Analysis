import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Input,
    InputGroup,
    InputLeftElement,
    Text,
    VStack,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';

/**
 * Flat, searchable Tool list (no grouping facet, so no accordion — mirrors TaapList).
 * Rows are keyed/selected by `tool_identifier` (the business key used by detail/CRUD).
 *
 * Props:
 *   items          Array of tool summaries {tool_identifier, title, description, ...}.
 *   selectedId     tool_identifier of the selected row, or null.
 *   onSelect(item) Called with the summary when a row is clicked.
 *   onAdd()        Called when "Add Tool" is pressed.
 *   emptyMessage   Shown when items.length === 0.
 */
function ToolList({ items = [], selectedId, onSelect, onAdd, emptyMessage = 'No tools yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();

    const filtered = useMemo(() => {
        const list = q
            ? items.filter((t) => `${t.title || ''} ${t.description || ''} ${t.tool_identifier || ''}`.toLowerCase().includes(q))
            : items;
        return [...list].sort((a, b) => (a.tool_identifier || '').localeCompare(b.tool_identifier || ''));
    }, [items, q]);

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={onAdd}>
                Add Tool
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                    placeholder="Search title, description…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>

            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" overflowY="auto" flex="1" maxH="65vh">
                {items.length === 0 ? (
                    <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">{emptyMessage}</Box>
                ) : filtered.length === 0 ? (
                    <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">No tools match “{query}”.</Box>
                ) : (
                    filtered.map((t) => {
                        const isSelected = t.tool_identifier === selectedId;
                        return (
                            <Box
                                key={t.tool_identifier || t.unique_id}
                                px={3}
                                py={2}
                                cursor="pointer"
                                bg={isSelected ? 'teal.50' : 'white'}
                                borderLeftWidth="3px"
                                borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                                borderBottomWidth="1px"
                                borderBottomColor="gray.100"
                                _hover={{ bg: isSelected ? 'teal.50' : 'gray.50' }}
                                onClick={() => onSelect && onSelect(t)}
                            >
                                <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={1}>
                                    {t.title || '(untitled)'}
                                </Text>
                                <Text fontSize="2xs" color="gray.400" noOfLines={1}>{t.tool_identifier}</Text>
                            </Box>
                        );
                    })
                )}
            </Box>
        </VStack>
    );
}

export default ToolList;
