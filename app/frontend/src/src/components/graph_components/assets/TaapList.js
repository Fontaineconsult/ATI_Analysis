import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Tag,
    Text,
    VStack,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { getOutcomeColor, getOutcomeLabel, toISODate } from './assetConfig';
import useListboxNavigation from '../../../hooks/useListboxNavigation';

/**
 * Flat, searchable TAAP list (the set is smaller than assets, so no accordion).
 * Sorted active-first then by review_due ascending — the annual-review worklist
 * order. Selected by `title` (the TAAP's unique business key).
 */
function TaapList({ items = [], selectedTitle, onSelect, onAdd, emptyMessage = 'No TAAPs yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();

    const filtered = useMemo(() => {
        const list = q
            ? items.filter((t) => `${t.title || ''} ${t.description || ''} ${t.outcome || ''}`.toLowerCase().includes(q))
            : items;
        return [...list].sort((a, b) => {
            if (!!a.active !== !!b.active) return a.active ? -1 : 1;
            const ad = toISODate(a.review_due) || '9999-99-99';
            const bd = toISODate(b.review_due) || '9999-99-99';
            return ad.localeCompare(bd);
        });
    }, [items, q]);

    const { getItemProps } = useListboxNavigation({
        itemCount: filtered.length,
        selectedIndex: filtered.findIndex((t) => t.title === selectedTitle),
        onActivate: (i) => onSelect && onSelect(filtered[i]),
    });

    const hasRows = items.length > 0 && filtered.length > 0;

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={onAdd}>
                Add TAAP
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.600" />
                </InputLeftElement>
                <Input
                    placeholder="Search title, outcome…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>

            {/* listbox role only when options render — an empty listbox violates
                aria-required-children. */}
            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" overflowY="auto" flex="1" maxH="65vh"
                 role={hasRows ? 'listbox' : undefined} aria-label={hasRows ? 'TAAPs' : undefined}>
                {items.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">{emptyMessage}</Box>
                ) : filtered.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">No TAAPs match “{query}”.</Box>
                ) : (
                    filtered.map((t, index) => {
                        const isSelected = t.title === selectedTitle;
                        const due = toISODate(t.review_due);
                        return (
                            <Box
                                key={t.title}
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
                                onClick={() => onSelect && onSelect(t)}
                            >
                                <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={1}>
                                    {t.title}
                                </Text>
                                <HStack mt={1} spacing={1}>
                                    {t.outcome && <Tag size="sm" colorScheme={getOutcomeColor(t.outcome)} variant="subtle">{getOutcomeLabel(t.outcome)}</Tag>}
                                    <Tag size="sm" colorScheme={t.active ? 'green' : 'gray'} variant="subtle">{t.active ? 'Active' : 'Inactive'}</Tag>
                                    {due && <Text fontSize="2xs" color="gray.600">due {due}</Text>}
                                </HStack>
                            </Box>
                        );
                    })
                )}
            </Box>
        </VStack>
    );
}

export default TaapList;
