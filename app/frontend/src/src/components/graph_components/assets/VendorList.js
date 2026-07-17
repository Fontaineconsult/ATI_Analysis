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
import useListboxNavigation from '../../../hooks/useListboxNavigation';

/**
 * Flat, searchable vendor list (selected by `name`, the unique business key).
 */
function VendorList({ items = [], selectedName, onSelect, onAdd, emptyMessage = 'No vendors yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();

    const filtered = useMemo(() => {
        const list = q
            ? items.filter((v) => `${v.name || ''} ${v.location || ''}`.toLowerCase().includes(q))
            : items;
        return [...list].sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
    }, [items, q]);

    const { getItemProps } = useListboxNavigation({
        itemCount: filtered.length,
        selectedIndex: filtered.findIndex((v) => v.name === selectedName),
        onActivate: (i) => onSelect && onSelect(filtered[i]),
    });

    const hasRows = items.length > 0 && filtered.length > 0;

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={onAdd}>
                Add Vendor
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.600" />
                </InputLeftElement>
                <Input
                    placeholder="Search name, location…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>

            {/* listbox role only when options render — an empty listbox violates
                aria-required-children. */}
            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" overflowY="auto" flex="1" maxH="65vh"
                 role={hasRows ? 'listbox' : undefined} aria-label={hasRows ? 'Vendors' : undefined}>
                {items.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">{emptyMessage}</Box>
                ) : filtered.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">No vendors match “{query}”.</Box>
                ) : (
                    filtered.map((v, index) => {
                        const isSelected = v.name === selectedName;
                        return (
                            <Box
                                key={v.unique_id || v.name}
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
                                onClick={() => onSelect && onSelect(v)}
                            >
                                <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={1}>
                                    {v.name || '(unnamed)'}
                                </Text>
                                {v.location && <Text fontSize="xs" color="gray.600" noOfLines={1}>{v.location}</Text>}
                            </Box>
                        );
                    })
                )}
            </Box>
        </VStack>
    );
}

export default VendorList;
