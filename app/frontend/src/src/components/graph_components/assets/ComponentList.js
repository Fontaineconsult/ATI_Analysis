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
import { getComponentKindOptions, getComponentKindConfig } from './componentConfig';
import { useSettings } from '../../../context/SettingsContext';

/**
 * Component list grouped by kind via Chakra Accordion (mirrors InterfaceList). kind is
 * single-valued, so each component sits in exactly one group. Rows are keyed/selected by
 * `component_identifier` (the business key used by detail/CRUD).
 *
 * Props:
 *   items          Array of component summaries {component_identifier, title, component_kind, ...}.
 *   selectedId     component_identifier of the selected row, or null.
 *   onSelect(item) Called with the full summary when a row is clicked.
 *   onAdd()        Called when "Add Component" is pressed.
 *   emptyMessage   Shown when items.length === 0.
 */
function ComponentList({ items = [], selectedId, onSelect, onAdd, emptyMessage = 'No components yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const { vocab } = useSettings();
    const kindOrder = useMemo(() => getComponentKindOptions(vocab).map((o) => o.key), [vocab]);

    const grouped = useMemo(() => {
        const byKind = new Map();
        for (const kk of kindOrder) byKind.set(kk, []);
        for (const it of items) {
            if (q) {
                const hay = `${it.title || ''} ${it.description || ''} ${it.component_kind || ''} ${it.component_identifier || ''}`.toLowerCase();
                if (!hay.includes(q)) continue;
            }
            const kk = it.component_kind;
            if (kk && byKind.has(kk)) {
                byKind.get(kk).push(it);
            } else {
                if (!byKind.has('_other')) byKind.set('_other', []);
                byKind.get('_other').push(it);
            }
        }
        return byKind;
    }, [items, q, kindOrder]);

    const kindKeys = useMemo(() => {
        const keys = [...kindOrder];
        if (grouped.has('_other') && grouped.get('_other').length) keys.push('_other');
        return keys;
    }, [grouped, kindOrder]);

    const defaultIndex = useMemo(() => {
        const indices = [];
        kindKeys.forEach((kk, idx) => {
            const list = grouped.get(kk) || [];
            const containsSelected = selectedId && list.some((it) => it.component_identifier === selectedId);
            const hasSearchMatches = q && list.length > 0;
            if (containsSelected || hasSearchMatches) indices.push(idx);
        });
        return indices;
    }, [grouped, kindKeys, selectedId, q]);

    const totalMatches = useMemo(
        () => Array.from(grouped.values()).reduce((acc, list) => acc + list.length, 0),
        [grouped],
    );

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={onAdd}>
                Add Component
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.600" />
                </InputLeftElement>
                <Input
                    placeholder="Search title, description, kind…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>

            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" overflowY="auto" flex="1" maxH="65vh">
                {items.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">{emptyMessage}</Box>
                ) : q && totalMatches === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">No components match “{query}”.</Box>
                ) : (
                    <Accordion key={defaultIndex.join(',')} defaultIndex={defaultIndex} allowMultiple>
                        {kindKeys.map((kindKey) => {
                            const config = getComponentKindConfig(kindKey, vocab);
                            const list = grouped.get(kindKey) || [];
                            const label = config?.label || (kindKey === '_other' ? 'Other / Unspecified' : kindKey);
                            return (
                                <AccordionItem key={kindKey} borderColor="gray.100">
                                    <AccordionButton px={3} py={2} _hover={{ bg: 'gray.50' }}>
                                        <HStack flex="1" justify="space-between" align="center">
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">{label}</Text>
                                            <Text fontSize="xs" color="gray.600">{list.length}</Text>
                                        </HStack>
                                        <AccordionIcon ml={2} />
                                    </AccordionButton>
                                    <AccordionPanel p={0} bg="gray.50">
                                        {list.length === 0 ? (
                                            <Box px={3} py={2} fontSize="xs" color="gray.600" fontStyle="italic">None yet.</Box>
                                        ) : (
                                            list.map((item) => {
                                                const isSelected = item.component_identifier === selectedId;
                                                return (
                                                    <Box
                                                        key={item.component_identifier || item.unique_id}
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
                                                            {item.title || '(untitled)'}
                                                        </Text>
                                                        <Text fontSize="2xs" color="gray.600" noOfLines={1}>{item.component_identifier}</Text>
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

export default ComponentList;
