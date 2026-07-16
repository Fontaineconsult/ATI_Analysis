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
import { getScopeOptions, getScopeConfig } from './assetConfig';
import { useSettings } from '../../../context/SettingsContext';
import { ClassBadge } from './AssetBadges';

/**
 * Asset list grouped by scope via Chakra Accordion (mirrors GovernanceList).
 * Search filters across all sections and auto-expands matching ones. Rows are
 * keyed/selected by `asset_identifier` (the business key used by detail/CRUD).
 * A ⚠ badge marks rows in `elevationSet` (stewarded but unremediated).
 *
 * Props:
 *   items          Array of asset summaries {asset_identifier, title, scope, asset_class, ...}.
 *   selectedId     asset_identifier of the selected row, or null.
 *   onSelect(item) Called with the full summary when a row is clicked.
 *   onAdd()        Called when "Add Asset" is pressed.
 *   elevationSet   Set of asset_identifiers showing the elevation signal.
 *   emptyMessage   Shown when items.length === 0.
 */
function AssetList({ items = [], selectedId, onSelect, onAdd, elevationSet, emptyMessage = 'No assets yet.' }) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const elevation = elevationSet || new Set();
    const { vocab } = useSettings();
    // Scope group order comes from data_config (via /settings); empty until loaded.
    const scopeOrder = useMemo(() => getScopeOptions(vocab).map((o) => o.key), [vocab]);

    const grouped = useMemo(() => {
        const byScope = new Map();
        for (const sk of scopeOrder) byScope.set(sk, []);
        for (const it of items) {
            if (q) {
                const hay = `${it.title || ''} ${it.description || ''} ${it.asset_class || ''} ${it.asset_identifier || ''}`.toLowerCase();
                if (!hay.includes(q)) continue;
            }
            if (byScope.has(it.scope)) {
                byScope.get(it.scope).push(it);
            } else {
                if (!byScope.has('_other')) byScope.set('_other', []);
                byScope.get('_other').push(it);
            }
        }
        return byScope;
    }, [items, q, scopeOrder]);

    const scopeKeys = useMemo(() => {
        const keys = [...scopeOrder];
        if (grouped.has('_other') && grouped.get('_other').length) keys.push('_other');
        return keys;
    }, [grouped, scopeOrder]);

    const defaultIndex = useMemo(() => {
        const indices = [];
        scopeKeys.forEach((sk, idx) => {
            const list = grouped.get(sk) || [];
            const containsSelected = selectedId && list.some((it) => it.asset_identifier === selectedId);
            const hasSearchMatches = q && list.length > 0;
            if (containsSelected || hasSearchMatches) indices.push(idx);
        });
        return indices;
    }, [grouped, scopeKeys, selectedId, q]);

    const totalMatches = useMemo(
        () => Array.from(grouped.values()).reduce((acc, list) => acc + list.length, 0),
        [grouped],
    );

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <Button size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />} onClick={onAdd}>
                Add Asset
            </Button>

            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.600" />
                </InputLeftElement>
                <Input
                    placeholder="Search title, description, class…"
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
                    <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">No assets match “{query}”.</Box>
                ) : (
                    <Accordion key={defaultIndex.join(',')} defaultIndex={defaultIndex} allowMultiple>
                        {scopeKeys.map((scopeKey) => {
                            const config = getScopeConfig(scopeKey, vocab);
                            const list = grouped.get(scopeKey) || [];
                            const label = config?.label || (scopeKey === '_other' ? 'Other' : scopeKey);
                            return (
                                <AccordionItem key={scopeKey} borderColor="gray.100">
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
                                                const isSelected = item.asset_identifier === selectedId;
                                                const isElevated = elevation.has(item.asset_identifier);
                                                return (
                                                    <Box
                                                        key={item.asset_identifier || item.unique_id}
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
                                                            {isElevated && (
                                                                <Badge colorScheme="red" fontSize="2xs" px={1} borderRadius="sm" title="Stewarded but not yet remediated">
                                                                    ⚠
                                                                </Badge>
                                                            )}
                                                        </HStack>
                                                        <HStack mt={1} spacing={1}>
                                                            {item.asset_class && <ClassBadge assetClass={item.asset_class} size="sm" />}
                                                            <Text fontSize="2xs" color="gray.600" noOfLines={1}>{item.asset_identifier}</Text>
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

export default AssetList;
