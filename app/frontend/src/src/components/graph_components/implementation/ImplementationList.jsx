import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    List,
    ListItem,
    Spacer,
    Text,
    VStack,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import { IMPLEMENTATION_TYPES, typeLabel, allDocumentsDepreciated, implementationInCampus } from './implementationConfig';

/**
 * Selectable list for the 1/3 column. Mirrors PlansList: a filter bar
 * ("Show all Campuses", default off → active-campus only) over a list grouped
 * by category (sticky teal headers + counts), like the Plans working-group
 * groups. Rows carry red-at-zero diagnostic chips (no evidence link / no owner).
 *
 * Props:
 *   items          Flat array of implementation objects (each carries `.type`,
 *                  `.campuses`, `.is_evidence_for`, `.owned_by`).
 *   groupByType    When true, render a sticky header per category; when false
 *                  (a single category is selected upstream) render one flat list.
 *   activeCampus   Current campus abbreviation — the default scope.
 *   selectedId     unique_id of the selected implementation, or null.
 *   onSelect(impl) Called with the full implementation object on click.
 *   onAdd()        Opens the create modal (owned by the container).
 *   typeName       Label used in the search placeholder / empty copy.
 *   emptyMessage   Shown when `items` is empty.
 */
function ImplementationList({
    items = [],
    groupByType = false,
    activeCampus,
    showAllCampuses = false,
    setShowAllCampuses = () => {},
    showRetired = false,
    setShowRetired = () => {},
    selectedId,
    onSelect,
    onAdd,
    typeName = 'implementation',
    emptyMessage,
}) {
    const [search, setSearch] = useState('');
    // The campus scope (Show all Campuses) and the retired filter are owned by
    // the parent so the category counts + stat strip agree with what this list
    // shows. Defaults: active campus only, retired hidden.

    const lower = typeName.toLowerCase();

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((impl) => {
            if (q && !(impl.title || '').toLowerCase().includes(q)) return false;
            if (!showRetired && impl.retired) return false;
            if (showAllCampuses) return true;
            return implementationInCampus(impl, activeCampus);
        });
    }, [items, search, showAllCampuses, showRetired, activeCampus]);

    // Group into category sections (only when asked + non-empty).
    const sections = useMemo(() => {
        if (!groupByType) return null;
        return IMPLEMENTATION_TYPES
            .map(({ key }) => ({ key, label: typeLabel(key), items: filtered.filter((i) => i.type === key) }))
            .filter((s) => s.items.length > 0);
    }, [groupByType, filtered]);

    const renderRow = (impl) => {
        const isSelected = impl.unique_id === selectedId;
        const yseCount = impl.is_evidence_for?.length || 0;
        const ownerCount = impl.owned_by?.length || 0;
        const campuses = Array.isArray(impl.campuses) ? impl.campuses : [];
        const docsAllDeprecated = allDocumentsDepreciated(impl);
        return (
            <ListItem
                key={impl.unique_id}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                px={3}
                py={2}
                cursor="pointer"
                bg={isSelected ? 'teal.50' : 'white'}
                borderLeftWidth="3px"
                borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                borderBottomWidth="1px"
                borderBottomColor="gray.100"
                _hover={{ bg: isSelected ? 'teal.50' : 'gray.50', boxShadow: 'md' }}
                _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
                onClick={() => onSelect && onSelect(impl)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect && onSelect(impl);
                    }
                }}
            >
                <Text
                    fontSize="sm"
                    fontWeight={isSelected ? 'semibold' : 'medium'}
                    color={impl.retired ? 'gray.600' : 'gray.800'}
                    fontStyle={impl.retired ? 'italic' : 'normal'}
                    noOfLines={2}
                >
                    {impl.title || '(untitled)'}
                </Text>
                <HStack spacing={1.5} mt={1.5} flexWrap="wrap">
                    {impl.retired && (
                        <Badge colorScheme="gray" variant="solid" fontSize="2xs" borderRadius="full" px={2}
                               title={impl.retired_date ? `Retired ${impl.retired_date}` : 'Retired'}>
                            Retired
                        </Badge>
                    )}
                    <Badge colorScheme={yseCount === 0 ? 'red' : 'teal'} variant="subtle" fontSize="2xs" borderRadius="full" px={2}>
                        {yseCount} YSE
                    </Badge>
                    <Badge colorScheme={ownerCount === 0 ? 'red' : 'gray'} variant="subtle" fontSize="2xs" borderRadius="full" px={2}>
                        {ownerCount} owner{ownerCount === 1 ? '' : 's'}
                    </Badge>
                    {docsAllDeprecated && (
                        <Badge colorScheme="orange" variant="solid" fontSize="2xs" borderRadius="full" px={2} title="Every attached document is marked depreciated — no active documentation">
                            ⚠ Docs deprecated
                        </Badge>
                    )}
                    {campuses.map((abbrev) => (
                        <Badge key={abbrev} colorScheme="gray" variant="outline" fontSize="2xs" borderRadius="full" px={2} textTransform="uppercase">
                            {abbrev}
                        </Badge>
                    ))}
                </HStack>
            </ListItem>
        );
    };

    return (
        <VStack align="stretch" spacing={2} h="100%">
            <HStack spacing={2}>
                <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.600" boxSize={3} />
                    </InputLeftElement>
                    <Input
                        placeholder={`Search ${lower}s…`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        borderColor="gray.300"
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px var(--chakra-colors-teal-500)' }}
                    />
                </InputGroup>
                <Button size="sm" colorScheme="teal" leftIcon={<AddIcon />} flexShrink={0} onClick={onAdd}>
                    Add
                </Button>
            </HStack>

            <HStack spacing={2}>
                <Button
                    size="xs"
                    colorScheme="teal"
                    variant={showAllCampuses ? 'solid' : 'outline'}
                    onClick={() => setShowAllCampuses((v) => !v)}
                    aria-pressed={showAllCampuses}
                >
                    Show all Campuses
                </Button>
                <Button
                    size="xs"
                    colorScheme="gray"
                    variant={showRetired ? 'solid' : 'outline'}
                    onClick={() => setShowRetired((v) => !v)}
                    aria-pressed={showRetired}
                >
                    Show retired
                </Button>
                <Spacer />
                <Text fontSize="2xs" color="gray.600">
                    {showAllCampuses
                        ? 'all campuses'
                        : `${(activeCampus || '').toUpperCase() || 'active'} only`}
                    {' · '}{filtered.length} shown
                </Text>
            </HStack>

            {items.length === 0 ? (
                <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">
                    {emptyMessage || `No ${lower}s yet.`}
                </Box>
            ) : filtered.length === 0 ? (
                <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">
                    No {lower}s match the current filters.
                </Box>
            ) : (
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" overflow="hidden">
                    {groupByType ? (
                        sections.map((section) => (
                            <Box key={section.key}>
                                <HStack
                                    position="sticky"
                                    top={0}
                                    zIndex={1}
                                    px={3}
                                    py={2}
                                    bg="gray.50"
                                    borderBottomWidth="1px"
                                    borderBottomColor="gray.200"
                                    justify="space-between"
                                >
                                    <Heading as="h3" size="xs" textTransform="uppercase" letterSpacing="wide" color="teal.700">
                                        {section.label}
                                    </Heading>
                                    <Text fontSize="2xs" fontWeight="semibold" color="gray.600">
                                        {section.items.length}
                                    </Text>
                                </HStack>
                                <List spacing={0} role="listbox" aria-label={`${section.label} implementations`}>
                                    {section.items.map(renderRow)}
                                </List>
                            </Box>
                        ))
                    ) : (
                        <List spacing={0} role="listbox" aria-label={`${typeName} list`}>
                            {filtered.map(renderRow)}
                        </List>
                    )}
                </Box>
            )}
        </VStack>
    );
}

export default ImplementationList;
