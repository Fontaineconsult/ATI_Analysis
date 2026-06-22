import React, { useMemo, useRef, useState } from 'react';
import {
    Badge,
    Box,
    Checkbox,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    Text,
    VStack,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

/**
 * Selectable list of the ontology's node types (design-sense §4.1 flat list + §6 ARIA
 * listbox). Diagnostic-first: a node type with NO descriptor shows a red "no description"
 * dot, and an "Only undescribed" filter turns the list into a gap punch-list.
 *
 * Props:
 *   nodeTypes      assembled node_type objects (with descriptor + shaped_by + fields/relationships)
 *   selectedLabel  label of the selected node type, or null
 *   onSelect(nt)   called with the node type when a row is chosen
 */
function OntologyList({ nodeTypes = [], selectedLabel, onSelect }) {
    const [query, setQuery] = useState('');
    const [undescribedOnly, setUndescribedOnly] = useState(false);
    const rowRefs = useRef({});
    const q = query.trim().toLowerCase();

    const visible = useMemo(() => {
        return nodeTypes
            .filter((nt) => {
                if (undescribedOnly && nt.descriptor) return false;
                if (!q) return true;
                return (
                    nt.label.toLowerCase().includes(q) ||
                    (nt.summary || '').toLowerCase().includes(q)
                );
            })
            .slice()
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [nodeTypes, q, undescribedOnly]);

    const moveFocus = (currentLabel, delta) => {
        const idx = visible.findIndex((nt) => nt.label === currentLabel);
        const next = visible[idx + delta];
        if (next) rowRefs.current[next.label]?.focus();
    };

    const onKeyDown = (e, nt) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveFocus(nt.label, 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveFocus(nt.label, -1); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect && onSelect(nt); }
    };

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <InputGroup size="sm">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                    placeholder="Search node types…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>

            <HStack justify="space-between" px={1}>
                <Checkbox
                    size="sm"
                    colorScheme="teal"
                    isChecked={undescribedOnly}
                    onChange={(e) => setUndescribedOnly(e.target.checked)}
                >
                    <Text fontSize="xs" color="gray.600">Only undescribed</Text>
                </Checkbox>
                <Text fontSize="xs" color="gray.500">{visible.length}</Text>
            </HStack>

            <Box
                role="listbox"
                aria-label="Ontology node types"
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                bg="white"
                overflowY="auto"
                flex="1"
                maxH="65vh"
            >
                {visible.length === 0 ? (
                    <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">
                        {undescribedOnly ? 'Every node type is described. 🎉' : 'No node types match.'}
                    </Box>
                ) : (
                    visible.map((nt) => {
                        const isSelected = nt.label === selectedLabel;
                        const described = !!nt.descriptor;
                        const shapesCount = (nt.shaped_by || []).length;
                        return (
                            <Box
                                key={nt.label}
                                ref={(el) => { rowRefs.current[nt.label] = el; }}
                                role="option"
                                aria-selected={isSelected}
                                tabIndex={isSelected || (!selectedLabel && visible[0]?.label === nt.label) ? 0 : -1}
                                cursor="pointer"
                                px={3}
                                py={2}
                                bg={isSelected ? 'teal.50' : 'white'}
                                borderLeftWidth="3px"
                                borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                                borderBottomWidth="1px"
                                borderBottomColor="gray.100"
                                _hover={{ bg: isSelected ? 'teal.50' : 'gray.50' }}
                                _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '-2px' }}
                                onClick={() => onSelect && onSelect(nt)}
                                onKeyDown={(e) => onKeyDown(e, nt)}
                            >
                                <HStack justify="space-between" align="center" spacing={2}>
                                    <HStack spacing={2} minW="0">
                                        <Box
                                            boxSize="8px"
                                            borderRadius="full"
                                            bg={described ? 'green.400' : 'red.400'}
                                            flexShrink={0}
                                            title={described ? 'Described' : 'No description'}
                                        />
                                        <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800" noOfLines={1}>
                                            {nt.label}
                                        </Text>
                                    </HStack>
                                    <HStack spacing={1} flexShrink={0}>
                                        <Badge fontSize="2xs" colorScheme="gray" variant="subtle">{nt.fields.length}f</Badge>
                                        <Badge fontSize="2xs" colorScheme="gray" variant="subtle">{nt.relationships.length}r</Badge>
                                        {shapesCount > 0 && (
                                            <Badge fontSize="2xs" colorScheme="purple" variant="subtle">{shapesCount}▢</Badge>
                                        )}
                                    </HStack>
                                </HStack>
                                {nt.summary && (
                                    <Text fontSize="xs" color="gray.600" noOfLines={1} mt={0.5} pl="16px">
                                        {nt.summary}
                                    </Text>
                                )}
                            </Box>
                        );
                    })
                )}
            </Box>
        </VStack>
    );
}

export default OntologyList;
