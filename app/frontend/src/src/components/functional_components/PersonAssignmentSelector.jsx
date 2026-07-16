import React, { useMemo, useState } from 'react';
import {
    Box,
    Button,
    Flex,
    Select,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useToast,
} from '@chakra-ui/react';

/**
 * Generic person-to-entity assignment surface. Originally extracted from the
 * "Implementing Persons" modal in the ATI Explorer (YSE ⇆ Person), now reused
 * for executive sponsors on CampusPlans and group leads on WorkingGroupPlans.
 *
 * The caller owns the data and the I/O:
 *   - `assignedPersons`  — the people currently linked to whatever this is
 *                          managing (full Person objects with at least
 *                          unique_id, name, title).
 *   - `candidatePersons` — the people the caller wants to allow assigning.
 *                          The component filters out anyone already in
 *                          `assignedPersons` so the picker only shows
 *                          unassigned candidates.
 *   - `onAssign(uniqueId)`   — async; perform the link. Resolves on success.
 *   - `onUnassign(uniqueId)` — async; perform the unlink. Resolves on success.
 *   - `afterChange()`        — optional; called after each successful op so
 *                              the caller can refetch and re-derive
 *                              `assignedPersons` / `candidatePersons`.
 *
 * Optional copy:
 *   - `placeholder`  — text in the Select prompt (default: "Select person to assign")
 *   - `assignLabel`  — text on the Assign button (default: "Assign")
 */
function PersonAssignmentSelector({
                                      assignedPersons = [],
                                      candidatePersons = [],
                                      onAssign,
                                      onUnassign,
                                      afterChange,
                                      placeholder = 'Select person to assign',
                                      assignLabel = 'Assign',
                                  }) {
    const [selectedPerson, setSelectedPerson] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [removingPersonId, setRemovingPersonId] = useState(null);
    const toast = useToast();

    const availableCandidates = useMemo(() => {
        const assignedIds = new Set(assignedPersons.map((p) => p.unique_id));
        return candidatePersons.filter((p) => !assignedIds.has(p.unique_id));
    }, [assignedPersons, candidatePersons]);

    const handleAssign = async () => {
        if (!selectedPerson) return;
        setIsAssigning(true);
        try {
            await onAssign(selectedPerson);
            toast({
                title: 'Person assigned',
                status: 'success',
                duration: 2000,
                isClosable: true,
                position: 'top-right',
            });
            setSelectedPerson('');
            if (afterChange) await afterChange();
        } catch (error) {
            toast({
                title: 'Error assigning person',
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top-right',
            });
        } finally {
            setIsAssigning(false);
        }
    };

    const handleRemove = async (personId) => {
        setRemovingPersonId(personId);
        try {
            await onUnassign(personId);
            toast({
                title: 'Person unassigned',
                status: 'success',
                duration: 2000,
                isClosable: true,
                position: 'top-right',
            });
            if (afterChange) await afterChange();
        } catch (error) {
            toast({
                title: 'Error removing person',
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top-right',
            });
        } finally {
            setRemovingPersonId(null);
        }
    };

    return (
        <Box>
            <Flex gap={2} mb={4}>
                <Select
                    size="sm"
                    placeholder={placeholder}
                    aria-label={placeholder || 'Select a person'}
                    value={selectedPerson}
                    onChange={(e) => setSelectedPerson(e.target.value)}
                    fontSize="sm"
                    borderColor="teal.300"
                    isDisabled={isAssigning || availableCandidates.length === 0}
                    _hover={{ borderColor: 'teal.400' }}
                    _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
                >
                    {availableCandidates.map((person) => (
                        <option key={person.unique_id} value={person.unique_id}>
                            {person.name}{person.title ? ` — ${person.title}` : ''}
                        </option>
                    ))}
                </Select>
                <Button
                    size="sm"
                    colorScheme="teal"
                    onClick={handleAssign}
                    isLoading={isAssigning}
                    loadingText="Assigning..."
                    isDisabled={!selectedPerson || isAssigning}
                >
                    {assignLabel}
                </Button>
            </Flex>

            {assignedPersons.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    No one assigned yet.
                </Text>
            ) : (
                <Table variant="simple" size="sm">
                    <Thead>
                        <Tr bg="teal.50">
                            <Th color="teal.700" fontWeight="semibold" fontSize="xs">Name</Th>
                            <Th color="teal.700" fontWeight="semibold" fontSize="xs">Title</Th>
                            <Th color="teal.700" fontWeight="semibold" fontSize="xs">Actions</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {assignedPersons.map((person) => (
                            <Tr key={person.unique_id} _hover={{ bg: 'gray.50' }}>
                                <Td color="gray.700" fontSize="xs">{person.name}</Td>
                                <Td color="gray.600" fontSize="xs">{person.title}</Td>
                                <Td>
                                    <Button
                                        size="xs"
                                        colorScheme="red"
                                        variant="solid"
                                        onClick={() => handleRemove(person.unique_id)}
                                        isLoading={removingPersonId === person.unique_id}
                                        loadingText="Removing..."
                                        isDisabled={removingPersonId !== null}
                                        _hover={{ bg: 'red.600' }}
                                    >
                                        Remove
                                    </Button>
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            )}
        </Box>
    );
}

export default PersonAssignmentSelector;
