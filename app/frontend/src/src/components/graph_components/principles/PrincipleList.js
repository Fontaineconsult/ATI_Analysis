import React, { useMemo, useState } from 'react';
import {
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
import PrincipleSourceBadge from './PrincipleSourceBadge';
import PrincipleGroundingTags from './PrincipleGroundingTags';
import useListboxNavigation from '../../../hooks/useListboxNavigation';

/**
 * Flat, searchable list of Principles (single node type → no accordion). Each row shows the
 * name, handle, and the derived grounding badge. Selection by `handle` (the URL key).
 *
 * Props: items, selectedHandle, onSelect(item), onAdd(), emptyMessage
 */
function PrincipleList({ items = [], selectedHandle, onSelect, onAdd, emptyMessage = 'No principles yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();

    const filtered = useMemo(() => {
        if (!q) return items;
        return items.filter((it) =>
            `${it.handle || ''} ${it.name || ''} ${it.description_short || ''}`.toLowerCase().includes(q));
    }, [items, q]);

    const { getItemProps } = useListboxNavigation({
        itemCount: filtered.length,
        selectedIndex: filtered.findIndex((it) => it.handle === selectedHandle),
        onActivate: (i) => onSelect && onSelect(filtered[i]),
    });

    const hasRows = items.length > 0 && filtered.length > 0;

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={onAdd}>
                Add Principle
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.600" />
                </InputLeftElement>
                <Input
                    placeholder="Search name, handle, statement…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>

            {/* The listbox options are focusable (roving tabindex), which also
                satisfies keyboard access to this scrollable region. */}
            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" overflowY="auto" flex="1" maxH="65vh"
                 role={hasRows ? 'listbox' : undefined} aria-label={hasRows ? 'Principles' : undefined}>
                {items.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">{emptyMessage}</Box>
                ) : filtered.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">No principles match “{query}”.</Box>
                ) : (
                    filtered.map((item, index) => {
                        const isSelected = item.handle === selectedHandle;
                        return (
                            <Box
                                key={item.handle}
                                {...getItemProps(index)}
                                role="option"
                                aria-selected={isSelected}
                                _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '-2px' }}
                                px={3}
                                py={2}
                                cursor="pointer"
                                bg={isSelected ? 'teal.50' : 'white'}
                                borderLeftWidth="3px"
                                borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                                borderBottomWidth="1px"
                                borderBottomColor="gray.100"
                                _hover={{ bg: isSelected ? 'teal.50' : 'gray.50' }}
                                onClick={() => onSelect && onSelect(item)}
                            >
                                <HStack justify="space-between" align="start">
                                    <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={1}>
                                        {item.name || item.handle}
                                    </Text>
                                    <PrincipleSourceBadge principle={item} size="sm" />
                                </HStack>
                                <Text fontSize="2xs" color="gray.600" fontFamily="mono" noOfLines={1}>{item.handle}</Text>
                                <Box mt={1}>
                                    <PrincipleGroundingTags principle={item} size="sm" />
                                </Box>
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

export default PrincipleList;
