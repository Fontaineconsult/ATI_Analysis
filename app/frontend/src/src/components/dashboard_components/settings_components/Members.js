import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
    Box,
    Heading,
    HStack,
    Input,
    Stat,
    StatLabel,
    StatNumber,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Checkbox,
    Spinner,
    Text,
    useToast,
    Button,
    Center,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { DataContext } from '../../../context/DataContext';
import { UserContext } from '../../../context/UserContext';
import { updateIndividual } from '../../../services/api/put';
import { WORKING_GROUPS } from '../../graph_components/people/peopleConfig';
import { useColumnSort, SortableTh } from '../../functional_components/SortableTable';
import EditIndividual from './EditIndividual';

const wgMember = (row, wgName) => Boolean(row.workingGroups?.some((wg) => wg.name === wgName));

// Sort accessors, module-level so the sort memo's dependency is stable.
const SORT_ACCESSORS = {
    name: (r) => r.name,
    employee_id: (r) => r.employee_id,
    ati_role: (r) => r.ati_role,
    host_campus: (r) => r.host_campus,
    active: (r) => Boolean(r.active),
    non_committee_member_active: (r) => Boolean(r.non_committee_member_active),
    web: (r) => wgMember(r, WORKING_GROUPS.web.name),
    ins: (r) => wgMember(r, WORKING_GROUPS.ins.name),
    pro: (r) => wgMember(r, WORKING_GROUPS.pro.name),
    can_approve_yse: (r) => Boolean(r.can_approve_yse),
    email: (r) => r.email,
};

function StatCard({ label, value, accent }) {
    return (
        <Box
            flex="1"
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="sm"
            p={4}
            borderTopWidth="3px"
            borderTopColor={accent}
        >
            <Stat>
                <StatLabel fontSize="xs" color="gray.700" textTransform="uppercase">{label}</StatLabel>
                <StatNumber fontSize="2xl" color="gray.800">{value}</StatNumber>
            </Stat>
        </Box>
    );
}

function Members() {
    const { loading } = useContext(DataContext);
    const { loadAllIndividuals, individuals } = useContext(UserContext);
    const [individualsData, setIndividualsData] = useState([]);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIndividual, setSelectedIndividual] = useState(null);
    const toast = useToast();

    useEffect(() => {
        loadAllIndividuals();
    }, []);

    useEffect(() => {
        if (individuals) {
            setIndividualsData(individuals);
        }
    }, [individuals]);

    const refreshData = useCallback(() => {
        loadAllIndividuals();
    }, [loadAllIndividuals]);

    const openCreateModal = () => {
        setSelectedIndividual(null);
        setIsModalOpen(true);
    };

    const openEditModal = (individual) => {
        setSelectedIndividual(individual);
        setIsModalOpen(true);
    };

    // Checkbox changes save immediately, optimistically, and revert on failure.
    const handleCheckboxChange = useCallback(
        async (individual, key) => {
            let updatedIndividual;

            if (key === 'active' || key === 'can_approve_yse' || key === 'non_committee_member_active') {
                const newValue = !individual[key];
                setIndividualsData((prev) =>
                    prev.map((indiv) =>
                        indiv.employee_id === individual.employee_id ? { ...indiv, [key]: newValue } : indiv
                    )
                );
                updatedIndividual = { ...individual, [key]: newValue };
            } else if (key === 'web' || key === 'ins' || key === 'pro') {
                const workingGroupName = WORKING_GROUPS[key]?.name || key;
                const isMember = wgMember(individual, workingGroupName);
                const updatedWorkingGroups = isMember
                    ? individual.workingGroups.filter((wg) => wg.name !== workingGroupName)
                    : [...(individual.workingGroups || []), { name: workingGroupName }];

                setIndividualsData((prev) =>
                    prev.map((indiv) =>
                        indiv.employee_id === individual.employee_id
                            ? { ...indiv, workingGroups: updatedWorkingGroups }
                            : indiv
                    )
                );
                updatedIndividual = { ...individual, workingGroups: updatedWorkingGroups };
            } else {
                return;
            }

            try {
                await updateIndividual(updatedIndividual);
                toast({
                    title: 'Updated successfully.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            } catch (error) {
                setIndividualsData((prev) =>
                    prev.map((indiv) =>
                        indiv.employee_id === individual.employee_id ? individual : indiv
                    )
                );
                toast({
                    title: 'Error updating individual.',
                    description: error.message,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        },
        [toast]
    );

    // Diagnostic counts read over the FULL roster, not the filtered view.
    const stats = useMemo(() => ({
        total: individualsData.length,
        active: individualsData.filter((p) => p.active).length,
        approvers: individualsData.filter((p) => p.can_approve_yse).length,
        noCampus: individualsData.filter((p) => !p.host_campus).length,
    }), [individualsData]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return individualsData;
        return individualsData.filter((p) =>
            [p.name, p.email, p.ati_role, p.host_campus, p.employee_id]
                .some((field) => field && String(field).toLowerCase().includes(q))
        );
    }, [individualsData, search]);

    const { sorted, sortKey, direction, toggleSort } = useColumnSort(filtered, SORT_ACCESSORS, 'name');

    const sortableHeader = (key, label, extra = {}) => (
        <SortableTh columnKey={key} sortKey={sortKey} direction={direction} onSort={toggleSort} {...extra}>
            {label}
        </SortableTh>
    );

    if (loading) {
        return (
            <Center h="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
            </Center>
        );
    }

    return (
        <Box>
            <HStack justifyContent="space-between" mb={4}>
                <Heading as="h2" size="lg" color="gray.800">Members</Heading>
                <Button colorScheme="teal" size="sm" leftIcon={<AddIcon boxSize={3} />} onClick={openCreateModal}>
                    Add Person
                </Button>
            </HStack>

            <HStack spacing={4} mb={4} align="stretch">
                <StatCard label="Members" value={stats.total} accent="teal.400" />
                <StatCard label="Active" value={stats.active} accent="green.400" />
                <StatCard label="Approvers" value={stats.approvers} accent="purple.400" />
                <StatCard
                    label="No campus"
                    value={stats.noCampus}
                    accent={stats.noCampus > 0 ? 'red.400' : 'gray.300'}
                />
            </HStack>

            <Input
                size="sm"
                maxW="360px"
                mb={3}
                bg="white"
                placeholder="Search by name, email, role, campus…"
                aria-label="Search members"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                borderColor="gray.300"
                _hover={{ borderColor: 'gray.400' }}
                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }}
            />

            {individualsData.length === 0 ? (
                <Text fontSize="sm" color="gray.700" fontStyle="italic">No members yet.</Text>
            ) : sorted.length === 0 ? (
                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                    No members match “{search.trim()}”.
                </Text>
            ) : (
                <Box
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    overflow="hidden"
                    bg="white"
                    boxShadow="sm"
                >
                    <TableContainer overflowX="auto">
                        <Table variant="simple" size="sm">
                            <Thead bg="gray.50">
                                <Tr>
                                    {sortableHeader('name', 'Name')}
                                    {sortableHeader('employee_id', 'EID')}
                                    {sortableHeader('ati_role', 'Role')}
                                    {sortableHeader('host_campus', 'Campus')}
                                    {sortableHeader('active', 'Active')}
                                    {sortableHeader('non_committee_member_active', 'Non-Member')}
                                    {sortableHeader('web', 'Web')}
                                    {sortableHeader('ins', 'Ins')}
                                    {sortableHeader('pro', 'Pro')}
                                    {sortableHeader('can_approve_yse', 'Approver')}
                                    {sortableHeader('email', 'Email')}
                                    <Th color="gray.700" fontWeight="semibold" fontSize="xs">Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {sorted.map((person) => (
                                    <Tr key={person.employee_id} _hover={{ bg: 'gray.50' }}>
                                        <Td fontSize="xs" color="gray.800" fontWeight="medium" maxW="150px">
                                            <Text as="span" isTruncated display="inline-block" maxW="150px" title={person.name}>
                                                {person.name}
                                            </Text>
                                        </Td>
                                        <Td fontSize="xs" color="gray.700" fontFamily="mono" maxW="100px">
                                            <Text as="span" isTruncated display="inline-block" maxW="100px" title={person.employee_id}>
                                                {person.employee_id}
                                            </Text>
                                        </Td>
                                        <Td fontSize="xs" color="gray.700" maxW="100px">
                                            <Text as="span" isTruncated display="inline-block" maxW="100px" title={person.ati_role}>
                                                {person.ati_role || '—'}
                                            </Text>
                                        </Td>
                                        <Td fontSize="xs" color="gray.700" textTransform="uppercase">
                                            {person.host_campus || '—'}
                                        </Td>
                                        <Td>
                                            <Checkbox
                                                size="sm"
                                                colorScheme="teal"
                                                isChecked={Boolean(person.active)}
                                                onChange={() => handleCheckboxChange(person, 'active')}
                                                aria-label={`Active — ${person.name}`}
                                            />
                                        </Td>
                                        <Td>
                                            <Checkbox
                                                size="sm"
                                                colorScheme="teal"
                                                isChecked={Boolean(person.non_committee_member_active)}
                                                onChange={() => handleCheckboxChange(person, 'non_committee_member_active')}
                                                aria-label={`Active non-committee member — ${person.name}`}
                                            />
                                        </Td>
                                        <Td>
                                            <Checkbox
                                                size="sm"
                                                colorScheme="teal"
                                                isChecked={wgMember(person, WORKING_GROUPS.web.name)}
                                                onChange={() => handleCheckboxChange(person, 'web')}
                                                aria-label={`Web working group — ${person.name}`}
                                            />
                                        </Td>
                                        <Td>
                                            <Checkbox
                                                size="sm"
                                                colorScheme="teal"
                                                isChecked={wgMember(person, WORKING_GROUPS.ins.name)}
                                                onChange={() => handleCheckboxChange(person, 'ins')}
                                                aria-label={`Instructional Materials working group — ${person.name}`}
                                            />
                                        </Td>
                                        <Td>
                                            <Checkbox
                                                size="sm"
                                                colorScheme="teal"
                                                isChecked={wgMember(person, WORKING_GROUPS.pro.name)}
                                                onChange={() => handleCheckboxChange(person, 'pro')}
                                                aria-label={`Procurement working group — ${person.name}`}
                                            />
                                        </Td>
                                        <Td>
                                            <Checkbox
                                                size="sm"
                                                colorScheme="teal"
                                                isChecked={Boolean(person.can_approve_yse)}
                                                onChange={() => handleCheckboxChange(person, 'can_approve_yse')}
                                                aria-label={`Can approve evidence — ${person.name}`}
                                            />
                                        </Td>
                                        <Td fontSize="xs" color="gray.700" maxW="180px">
                                            <Text as="span" isTruncated display="inline-block" maxW="180px" title={person.email}>
                                                {person.email}
                                            </Text>
                                        </Td>
                                        <Td>
                                            <Button
                                                size="xs"
                                                colorScheme="teal"
                                                variant="outline"
                                                bg="white"
                                                onClick={() => openEditModal(person)}
                                            >
                                                Edit
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            <EditIndividual
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                individualData={selectedIndividual}
                onSave={refreshData}
            />
        </Box>
    );
}

export default Members;
