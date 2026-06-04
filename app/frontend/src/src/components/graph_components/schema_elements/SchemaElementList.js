import React, { useMemo, useState } from 'react';
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
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
import { SCHEMA_ELEMENT_KIND_ORDER, humanizeKind } from './schemaElementTypes';
import { useDescriptors } from '../../../hooks/useDescriptors';

/**
 * SchemaElement list grouped by element_kind via accordion (mirrors GovernanceList). Selection
 * is by `handle` (the URL key). Owned by the container; presentational here.
 *
 * Props: items, selectedHandle, onSelect(item), onAdd(), emptyMessage
 */
function SchemaElementList({ items = [], selectedHandle, onSelect, onAdd, emptyMessage = 'No schema elements yet.' }) {
    const [query, setQuery] = useState('');
    const { describeFieldValue } = useDescriptors();
    const q = query.trim().toLowerCase();

    const grouped = useMemo(() => {
        const byKind = new Map();
        for (const k of SCHEMA_ELEMENT_KIND_ORDER) byKind.set(k, []);
        for (const it of items) {
            if (q) {
                const hay = `${it.handle || ''} ${it.name || ''}`.toLowerCase();
                if (!hay.includes(q)) continue;
            }
            if (byKind.has(it.element_kind)) byKind.get(it.element_kind).push(it);
        }
        return byKind;
    }, [items, q]);

    const defaultIndex = useMemo(() => {
        const indices = [];
        SCHEMA_ELEMENT_KIND_ORDER.forEach((k, idx) => {
            const list = grouped.get(k) || [];
            const containsSelected = selectedHandle && list.some((it) => it.handle === selectedHandle);
            const hasSearchMatches = q && list.length > 0;
            if (containsSelected || hasSearchMatches) indices.push(idx);
        });
        return indices;
    }, [grouped, selectedHandle, q]);

    const totalMatches = useMemo(
        () => Array.from(grouped.values()).reduce((acc, list) => acc + list.length, 0),
        [grouped],
    );

    const kindLabel = (k) => describeFieldValue('element_kind', k)?.title || humanizeKind(k);

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={onAdd}>
                Add Schema Element
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                    placeholder="Search handle or name…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>

            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" overflowY="auto" flex="1" maxH="65vh">
                {items.length === 0 ? (
                    <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">{emptyMessage}</Box>
                ) : q && totalMatches === 0 ? (
                    <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">No elements match “{query}”.</Box>
                ) : (
                    <Accordion key={defaultIndex.join(',')} defaultIndex={defaultIndex} allowMultiple>
                        {SCHEMA_ELEMENT_KIND_ORDER.map((kind) => {
                            const list = grouped.get(kind) || [];
                            return (
                                <AccordionItem key={kind} borderColor="gray.100">
                                    <AccordionButton px={3} py={2} _hover={{ bg: 'gray.50' }}>
                                        <HStack flex="1" justify="space-between" align="center">
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">{kindLabel(kind)}</Text>
                                            <Text fontSize="xs" color="gray.500">{list.length}</Text>
                                        </HStack>
                                        <AccordionIcon ml={2} />
                                    </AccordionButton>
                                    <AccordionPanel p={0} bg="gray.50">
                                        {list.length === 0 ? (
                                            <Box px={3} py={2} fontSize="xs" color="gray.500" fontStyle="italic">None yet.</Box>
                                        ) : (
                                            list.map((item) => {
                                                const isSelected = item.handle === selectedHandle;
                                                return (
                                                    <Box
                                                        key={item.handle}
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
                                                        <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={1}>
                                                            {item.name || item.handle}
                                                        </Text>
                                                        <Text fontSize="2xs" color="gray.400" fontFamily="mono" noOfLines={1}>
                                                            {item.handle}
                                                        </Text>
                                                    </Box>
                                                );
                                            })
                                        )}
                                    </AccordionPanel>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </Box>
        </VStack>
    );
}

export default SchemaElementList;
