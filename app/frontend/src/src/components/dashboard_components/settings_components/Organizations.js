import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Badge,
    Box,
    Button,
    Center,
    Flex,
    Heading,
    HStack,
    Input,
    Select,
    Spinner,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useToast,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { fetchLocalOrgUnits } from '../../../services/api/get';
import { createOrgUnit } from '../../../services/api/post';
import { deleteOrgUnit } from '../../../services/api/delete';

const TYPE_BADGE = { Department: 'blue', College: 'purple' };

/**
 * Settings → Organizations: the local org units (Departments and Colleges)
 * operating under the current campus. Units created here are automatically
 * connected operates_under_campus, so they appear in the campus-scoped pickers
 * (asset stewards, the Employed By editor, implementor org rollups).
 *
 * Vendors are external suppliers, managed in the Assets area — not here.
 */
function Organizations() {
    const { campus } = useParams();
    const toast = useToast();

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    // Add-form state
    const [unitType, setUnitType] = useState('department');
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');

    // Delete-confirm state
    const [pendingDelete, setPendingDelete] = useState(null);
    const cancelRef = useRef();

    const load = useCallback(async () => {
        try {
            const resp = await fetchLocalOrgUnits(campus);
            setUnits(resp?.data || []);
        } catch (e) {
            toast({ title: 'Failed to load organizations', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setLoading(false);
        }
    }, [campus, toast]);

    useEffect(() => {
        setLoading(true);
        load();
    }, [load]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setBusy(true);
        try {
            await createOrgUnit(unitType, name.trim(), { location: location.trim() || null, campus });
            toast({ title: 'Organization created', status: 'success', duration: 2000, isClosable: true });
            setName('');
            setLocation('');
            await load();
        } catch (err) {
            toast({
                title: 'Failed to create organization',
                description: err?.response?.data?.error || err?.message,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        const unit = pendingDelete;
        setPendingDelete(null);
        if (!unit) return;
        setBusy(true);
        try {
            await deleteOrgUnit(unit.type.toLowerCase(), unit.name);
            toast({ title: 'Organization deleted', status: 'success', duration: 2000, isClosable: true });
            await load();
        } catch (err) {
            toast({ title: 'Failed to delete organization', description: err?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <Center h="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
            </Center>
        );
    }

    return (
        <Box>
            <HStack justifyContent="space-between" mb={1}>
                <Heading size="md" color="gray.800">Organizations</Heading>
                <Text fontSize="xs" color="gray.600" textTransform="uppercase">{campus}</Text>
            </HStack>
            <Text fontSize="sm" color="gray.600" mb={4}>
                Local departments and colleges for this campus. They appear as employer and
                steward options across the app. Vendors are managed in the Assets area.
            </Text>

            {/* Add form */}
            <Box as="form" onSubmit={handleAdd} borderWidth="1px" borderColor="gray.200" borderRadius="lg" bg="white" boxShadow="sm" p={4} mb={4}>
                <Flex gap={2} wrap="wrap">
                    <Select size="sm" w="36" flexShrink={0} value={unitType} onChange={(e) => setUnitType(e.target.value)} aria-label="Organization type">
                        <option value="department">Department</option>
                        <option value="college">College</option>
                    </Select>
                    <Input
                        size="sm"
                        flex="1"
                        minW="220px"
                        placeholder={`New ${unitType} name…`}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        aria-label="Organization name"
                    />
                    <Input
                        size="sm"
                        w="52"
                        placeholder="Location (optional)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        aria-label="Location"
                    />
                    <Button type="submit" size="sm" colorScheme="teal" leftIcon={<AddIcon boxSize={3} />}
                            isDisabled={!name.trim()} isLoading={busy}>
                        Add
                    </Button>
                </Flex>
            </Box>

            {/* Roster */}
            {units.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    No departments or colleges recorded for this campus yet.
                </Text>
            ) : (
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden" bg="white" boxShadow="sm">
                    <TableContainer overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead bg="gray.50">
                                <Tr>
                                    <Th color="gray.700" fontWeight="semibold" fontSize="xs">Type</Th>
                                    <Th color="gray.700" fontWeight="semibold" fontSize="xs">Name</Th>
                                    <Th color="gray.700" fontWeight="semibold" fontSize="xs">Location</Th>
                                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" isNumeric>Employees</Th>
                                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" aria-label="Actions" />
                                </Tr>
                            </Thead>
                            <Tbody>
                                {units.map((u) => (
                                    <Tr key={u.unique_id || `${u.type}-${u.name}`} _hover={{ bg: 'gray.50' }}>
                                        <Td>
                                            <Badge colorScheme={TYPE_BADGE[u.type] || 'gray'} variant="subtle" fontSize="2xs">
                                                {u.type}
                                            </Badge>
                                        </Td>
                                        <Td fontSize="sm" color="gray.800" fontWeight="medium">{u.name}</Td>
                                        <Td fontSize="xs" color="gray.600">{u.location || '—'}</Td>
                                        <Td fontSize="xs" color="gray.700" isNumeric>{u.employee_count}</Td>
                                        <Td textAlign="right">
                                            <Button size="xs" colorScheme="red" variant="ghost" isDisabled={busy}
                                                    onClick={() => setPendingDelete(u)}>
                                                Delete
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Delete confirmation */}
            <AlertDialog
                isOpen={!!pendingDelete}
                leastDestructiveRef={cancelRef}
                onClose={() => setPendingDelete(null)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete {pendingDelete?.type?.toLowerCase()}
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Delete <b>{pendingDelete?.name}</b>?
                            {pendingDelete?.employee_count > 0 && (
                                <Text mt={2} color="red.600" fontSize="sm">
                                    {pendingDelete.employee_count} employment link
                                    {pendingDelete.employee_count === 1 ? '' : 's'} will be removed with it.
                                </Text>
                            )}
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} size="sm" onClick={() => setPendingDelete(null)}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" size="sm" onClick={handleDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
}

export default Organizations;
