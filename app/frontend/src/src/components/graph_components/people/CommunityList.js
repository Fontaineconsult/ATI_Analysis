import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    Input,
    InputGroup,
    InputLeftElement,
    List,
    ListItem,
    Text,
    VStack,
} from '@chakra-ui/react';
import { AddIcon, SearchIcon } from '@chakra-ui/icons';
import useListboxNavigation from '../../../hooks/useListboxNavigation';

/**
 * Selectable list of communities of practice. Caller supplies the list-shaped
 * community objects ({unique_id, name, description, member_count, campuses})
 * and owns filtering — this renders search, selection, and the Add button.
 *
 * Props:
 *   communities         Array of community objects.
 *   selectedId          unique_id of the selected community, or null.
 *   onSelect(community) Called with the full object when a row is activated.
 *   onAdd()             Optional. Renders the canon Add button beside the search.
 *   emptyMessage        Optional override; default "No communities yet."
 */
function CommunityList({ communities = [], selectedId, onSelect, onAdd, emptyMessage = 'No communities yet.' }) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        if (!query.trim()) return communities;
        const q = query.trim().toLowerCase();
        return communities.filter((c) =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.description || '').toLowerCase().includes(q),
        );
    }, [communities, query]);

    const { getItemProps } = useListboxNavigation({
        itemCount: filtered.length,
        selectedIndex: filtered.findIndex((c) => c.unique_id === selectedId),
        onActivate: (i) => onSelect && onSelect(filtered[i]),
    });

    const header = (
        <HStack spacing={2}>
            <InputGroup size="sm" flex="1">
                <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.600" />
                </InputLeftElement>
                <Input
                    placeholder="Search communities…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                />
            </InputGroup>
            {onAdd && (
                <Button
                    size="sm"
                    colorScheme="teal"
                    variant="outline"
                    leftIcon={<AddIcon boxSize={2.5} />}
                    onClick={onAdd}
                    flexShrink={0}
                >
                    Add
                </Button>
            )}
        </HStack>
    );

    if (!communities || communities.length === 0) {
        return (
            <VStack align="stretch" spacing={2}>
                {header}
                <Box p={4} color="gray.600" fontSize="sm" fontStyle="italic">
                    {emptyMessage}
                </Box>
            </VStack>
        );
    }

    return (
        <VStack align="stretch" spacing={2} h="100%">
            {header}

            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                overflowY="auto"
                flex="1"
                maxH="70vh"
            >
                <List spacing={0}
                      role={filtered.length > 0 ? 'listbox' : undefined}
                      aria-label={filtered.length > 0 ? 'Communities' : undefined}>
                    {filtered.map((community, index) => {
                        const isSelected = community.unique_id === selectedId;
                        const memberCount = community.member_count || 0;
                        const campusCount = Array.isArray(community.campuses) ? community.campuses.length : 0;
                        return (
                            <ListItem
                                key={community.unique_id}
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
                                onClick={() => onSelect && onSelect(community)}
                            >
                                <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800">
                                    {community.name}
                                </Text>
                                {community.description && (
                                    <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                        {community.description}
                                    </Text>
                                )}
                                <HStack spacing={1} mt={0.5}>
                                    <Badge
                                        colorScheme={memberCount === 0 ? 'red' : 'teal'}
                                        variant="subtle"
                                        fontSize="2xs"
                                        borderRadius="full"
                                        px={2}
                                    >
                                        {memberCount} member{memberCount === 1 ? '' : 's'}
                                    </Badge>
                                    {campusCount > 0 && (
                                        <Badge colorScheme="gray" variant="subtle" fontSize="2xs" borderRadius="full" px={2}>
                                            {campusCount} campus{campusCount === 1 ? '' : 'es'}
                                        </Badge>
                                    )}
                                </HStack>
                            </ListItem>
                        );
                    })}
                    {filtered.length === 0 && (
                        <ListItem px={3} py={3} color="gray.600" fontSize="sm" fontStyle="italic">
                            No matches.
                        </ListItem>
                    )}
                </List>
            </Box>
        </VStack>
    );
}

export default CommunityList;
