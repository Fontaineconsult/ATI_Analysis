import React, { useMemo, useState } from 'react';
import {
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    List,
    ListItem,
    Text,
    VStack,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

/**
 * Generic selectable people list. Caller supplies the people array and a
 * selection callback. No filtering of its own — the parent decides who to
 * pass in (active, all, by working group, etc.). Designed to be reused for
 * any feature that needs a "pick a person" list.
 *
 * Props:
 *   people            Array of person objects (need unique_id, name; title and
 *                     host_campus are rendered if present).
 *   selectedId        unique_id of the currently selected person, or null.
 *   onSelect(person)  Called with the full person object when a row is clicked.
 *   emptyMessage      Optional override; default "No people to show."
 *   showSearch        Defaults to true. Renders an in-list name/title filter.
 */
function PeopleList({ people = [], selectedId, onSelect, emptyMessage = 'No people to show.', showSearch = true }) {
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        if (!query.trim()) return people;
        const q = query.trim().toLowerCase();
        return people.filter((p) =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.title || '').toLowerCase().includes(q) ||
            (p.host_campus || '').toLowerCase().includes(q),
        );
    }, [people, query]);

    if (!people || people.length === 0) {
        return (
            <Box p={4} color="gray.500" fontSize="sm" fontStyle="italic">
                {emptyMessage}
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={2} h="100%">
            {showSearch && (
                <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                    </InputLeftElement>
                    <Input
                        placeholder="Search by name, title, campus…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        borderColor="gray.300"
                        _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                    />
                </InputGroup>
            )}

            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                overflowY="auto"
                flex="1"
                maxH="70vh"
            >
                <List spacing={0} role="listbox" aria-label="People">
                    {filtered.map((person) => {
                        const isSelected = person.unique_id === selectedId;
                        return (
                            <ListItem
                                key={person.unique_id}
                                role="option"
                                aria-selected={isSelected}
                                px={3}
                                py={2}
                                cursor="pointer"
                                bg={isSelected ? 'teal.50' : 'white'}
                                borderLeftWidth="3px"
                                borderLeftColor={isSelected ? 'teal.500' : 'transparent'}
                                borderBottomWidth="1px"
                                borderBottomColor="gray.100"
                                _hover={{ bg: isSelected ? 'teal.50' : 'gray.50' }}
                                onClick={() => onSelect && onSelect(person)}
                            >
                                <Text fontSize="sm" fontWeight={isSelected ? 'semibold' : 'medium'} color="gray.800">
                                    {person.name}
                                </Text>
                                {person.title && (
                                    <Text fontSize="xs" color="gray.600" noOfLines={1}>
                                        {person.title}
                                    </Text>
                                )}
                                {person.host_campus && (
                                    <Text fontSize="2xs" color="teal.600" textTransform="uppercase" fontWeight="bold">
                                        {person.host_campus}
                                    </Text>
                                )}
                            </ListItem>
                        );
                    })}
                    {filtered.length === 0 && (
                        <ListItem px={3} py={3} color="gray.500" fontSize="sm" fontStyle="italic">
                            No matches.
                        </ListItem>
                    )}
                </List>
            </Box>
        </VStack>
    );
}

export default PeopleList;
