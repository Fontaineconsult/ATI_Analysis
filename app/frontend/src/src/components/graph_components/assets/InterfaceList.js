import React, { useMemo, useState } from 'react';
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
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
import { getKindOptions, getKindConfig } from './interfaceConfig';
import { useSettings } from '../../../context/SettingsContext';
import { CoverageDomainBadge } from './InterfaceBadges';

/**
 * Interface list grouped by kind via Chakra Accordion (mirrors AssetList).
 * Search filters across all sections and auto-expands matching ones. Rows are
 * keyed/selected by `interface_identifier` (the business key used by detail/CRUD).
 * A ⚠ badge marks rows in `uncoveredSet` (no remediation reaches them).
 *
 * Props:
 *   items          Array of interface summaries {interface_identifier, title, interface_kind, coverage_domains, ...}.
 *   selectedId     interface_identifier of the selected row, or null.
 *   onSelect(item) Called with the full summary when a row is clicked.
 *   onAdd()        Called when "Add Interface" is pressed.
 *   uncoveredSet   Set of interface_identifiers showing the uncovered signal.
 *   emptyMessage   Shown when items.length === 0.
 */
function InterfaceList({ items = [], selectedId, onSelect, onAdd, uncoveredSet, emptyMessage = 'No interfaces yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const uncovered = uncoveredSet || new Set();
    const { vocab } = useSettings();
    // Kind group order comes from data_config (via /settings); empty until loaded.
    const kindOrder = useMemo(() => getKindOptions(vocab).map((o) => o.key), [vocab]);

    const grouped = useMemo(() => {
        const byKind = new Map();
        for (const kk of kindOrder) byKind.set(kk, []);
        for (const it of items) {
            // interface_kind is multi-valued; an interface appears under each of its kinds.
            const kinds = Array.isArray(it.interface_kind)
                ? it.interface_kind
                : (it.interface_kind ? [it.interface_kind] : []);
            if (q) {
                const hay = `${it.title || ''} ${it.description || ''} ${it.coverage_domains || ''} ${kinds.join(' ')} ${it.interface_identifier || ''}`.toLowerCase();
                if (!hay.includes(q)) continue;
            }
            let placed = false;
            for (const k of kinds) {
                if (byKind.has(k)) { byKind.get(k).push(it); placed = true; }
            }
            if (!placed) {
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
            const containsSelected = selectedId && list.some((it) => it.interface_identifier === selectedId);
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
                Add Interface
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                    placeholder="Search title, description, domain…"
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
                    <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">No interfaces match “{query}”.</Box>
                ) : (
                    <Accordion key={defaultIndex.join(',')} defaultIndex={defaultIndex} allowMultiple>
                        {kindKeys.map((kindKey) => {
                            const config = getKindConfig(kindKey, vocab);
                            const list = grouped.get(kindKey) || [];
                            const label = config?.label || (kindKey === '_other' ? 'Other' : kindKey);
                            return (
                                <AccordionItem key={kindKey} borderColor="gray.100">
                                    <AccordionButton px={3} py={2} _hover={{ bg: 'gray.50' }}>
                                        <HStack flex="1" justify="space-between" align="center">
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.700">{label}</Text>
                                            <Text fontSize="xs" color="gray.500">{list.length}</Text>
                                        </HStack>
                                        <AccordionIcon ml={2} />
                                    </AccordionButton>
                                    <AccordionPanel p={0} bg="gray.50">
                                        {list.length === 0 ? (
                                            <Box px={3} py={2} fontSize="xs" color="gray.500" fontStyle="italic">None yet.</Box>
                                        ) : (
                                            list.map((item) => {
                                                const isSelected = item.interface_identifier === selectedId;
                                                const isUncovered = uncovered.has(item.interface_identifier);
                                                return (
                                                    <Box
                                                        key={item.interface_identifier || item.unique_id}
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
                                                                {item.title || '(untitled)'}
                                                            </Text>
                                                            {isUncovered && (
                                                                <Badge colorScheme="red" fontSize="2xs" px={1} borderRadius="sm" title="No remediation reaches this interface">
                                                                    ⚠
                                                                </Badge>
                                                            )}
                                                        </HStack>
                                                        <HStack mt={1} spacing={1}>
                                                            {item.coverage_domains && <CoverageDomainBadge domain={item.coverage_domains} size="sm" />}
                                                            <Text fontSize="2xs" color="gray.400" noOfLines={1}>{item.interface_identifier}</Text>
                                                        </HStack>
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

export default InterfaceList;
