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
import { GOVERNANCE_TYPE_ORDER, getGovernanceTypeConfig } from './governanceTypes';

/**
 * Reusable governance list grouped by type via Chakra Accordion. Each of the
 * six governance types gets its own collapsible section showing its items.
 * Search filters across all sections and auto-expands any section with
 * matching items so results are never hidden behind a closed panel.
 *
 * Selection state and the "add" handoff are owned by the parent so this
 * component stays reusable outside the explorer.
 *
 * Props:
 *   items                Array of governance items {type, unique_id, title, ...}.
 *   selectedId           unique_id of the currently selected item, or null.
 *   onSelect(item)       Called with the full item when a row is clicked.
 *   onAdd()              Called when the "Add Governance" button is pressed.
 *   emptyMessage         Shown when items.length === 0.
 */
function GovernanceList({ items = [], selectedId, onSelect, onAdd, emptyMessage = 'No governance items yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();

    // Group items by type, applying the search filter.
    const grouped = useMemo(() => {
        const byType = new Map();
        for (const tk of GOVERNANCE_TYPE_ORDER) byType.set(tk, []);
        for (const it of items) {
            if (q) {
                const hay = `${it.title || ''} ${it.description || ''} ${it.legislative_authority || ''} ${it.source_institution || ''}`.toLowerCase();
                if (!hay.includes(q)) continue;
            }
            if (byType.has(it.type)) byType.get(it.type).push(it);
        }
        return byType;
    }, [items, q]);

    // Default-expand any section that holds the selected item OR has matches
    // while searching. Without a search, default to all-collapsed so the
    // panel scans cleanly.
    const defaultIndex = useMemo(() => {
        const indices = [];
        GOVERNANCE_TYPE_ORDER.forEach((tk, idx) => {
            const list = grouped.get(tk) || [];
            const containsSelected = selectedId && list.some((it) => it.unique_id === selectedId);
            const hasSearchMatches = q && list.length > 0;
            if (containsSelected || hasSearchMatches) indices.push(idx);
        });
        return indices;
    }, [grouped, selectedId, q]);

    const totalMatches = useMemo(
        () => Array.from(grouped.values()).reduce((acc, list) => acc + list.length, 0),
        [grouped],
    );

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button
                size="sm"
                colorScheme="teal"
                leftIcon={<AddIcon boxSize={3} />}
                onClick={onAdd}
            >
                Add Governance
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.600" />
                </InputLeftElement>
                <Input
                    placeholder="Search title, description, authority…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>

            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
                overflowY="auto"
                flex="1"
                maxH="65vh"
            >
                {items.length === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">
                        {emptyMessage}
                    </Box>
                ) : q && totalMatches === 0 ? (
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">
                        No items match “{query}”.
                    </Box>
                ) : (
                    // key on defaultIndex so a new search re-applies the expanded set
                    <Accordion key={defaultIndex.join(',')} defaultIndex={defaultIndex} allowMultiple>
                        {GOVERNANCE_TYPE_ORDER.map((typeKey) => {
                            const config = getGovernanceTypeConfig(typeKey);
                            const list = grouped.get(typeKey) || [];
                            return (
                                <AccordionItem key={typeKey} borderColor="gray.100">
                                    <AccordionButton px={3} py={2} _hover={{ bg: 'gray.50' }}>
                                        <HStack flex="1" justify="space-between" align="center">
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                                                {config?.plural || config?.label || typeKey}
                                            </Text>
                                            <Text fontSize="xs" color="gray.600">
                                                {list.length}
                                            </Text>
                                        </HStack>
                                        <AccordionIcon ml={2} />
                                    </AccordionButton>
                                    <AccordionPanel p={0} bg="gray.50">
                                        {list.length === 0 ? (
                                            <Box px={3} py={2} fontSize="xs" color="gray.600" fontStyle="italic">
                                                None yet.
                                            </Box>
                                        ) : (
                                            list.map((item) => {
                                                const isSelected = item.unique_id === selectedId;
                                                return (
                                                    <Box
                                                        key={item.unique_id}
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
                                                        {item.description && (
                                                            <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                                                {item.description}
                                                            </Text>
                                                        )}
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

export default GovernanceList;
