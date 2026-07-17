import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
    Box,
    Heading,
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
    HStack, Center,
} from '@chakra-ui/react';
import { useTable } from 'react-table';
import { DataContext } from '../../../context/DataContext';
import { UserContext } from '../../../context/UserContext';
import { updateIndividual } from '../../../services/api/put';
import EditIndividual from './EditIndividual';

// Memoized Table Component
const MembersTable = React.memo(({ columns, data }) => {
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

    return (
        <TableContainer overflowX="auto">
            <Table variant="simple" {...getTableProps()} size="sm">
                <Thead bg="gray.50">
                    {headerGroups.map((headerGroup) => (
                        <Tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <Th
                                    {...column.getHeaderProps()}
                                    style={{ whiteSpace: 'nowrap', padding: '8px' }}
                                    color="gray.700"
                                    fontWeight="semibold"
                                    fontSize="xs"
                                >
                                    {column.render('Header')}
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </Thead>
                <Tbody {...getTableBodyProps()}>
                    {rows.map((row) => {
                        prepareRow(row);
                        return (
                            <Tr {...row.getRowProps()} _hover={{ bg: "gray.50" }}>
                                {row.cells.map((cell) => (
                                    <Td
                                        {...cell.getCellProps()}
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '150px',
                                        }}
                                        fontSize="xs"
                                        color="gray.700"
                                    >
                                        {cell.render('Cell')}
                                    </Td>
                                ))}
                            </Tr>
                        );
                    })}
                </Tbody>
            </Table>
        </TableContainer>
    );
});

function Members() {
    const { data, loading } = useContext(DataContext);
    const { loadAllIndividuals, individuals } = useContext(UserContext);
    const [individualsData, setIndividualsData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIndividual, setSelectedIndividual] = useState(null);
    const toast = useToast();

    // Load individuals on component mount
    useEffect(() => {
        loadAllIndividuals();
    }, []);

    // Update individualsData when data.individuals changes
    useEffect(() => {
        if (individuals) {
            setIndividualsData(individuals);
        }
    }, [individuals]);

    // Function to refresh data after save
    const refreshData = useCallback(() => {
        loadAllIndividuals();
    }, [loadAllIndividuals]);

    // Function to open modal in create mode
    const openCreateModal = () => {
        setSelectedIndividual(null);
        setIsModalOpen(true);
    };

    // Function to open modal in edit mode
    const openEditModal = (individual) => {
        setSelectedIndividual(individual);
        setIsModalOpen(true);
    };

    // Handle checkbox changes with optimistic updates
    const handleCheckboxChange = useCallback(
        async (individual, key) => {
            let updatedIndividual;

            if (key === 'active' || key === 'can_approve_yse' || key === 'non_committee_member_active' || key === 'ati_role') {
                // For simple boolean or string properties
                const newValue = !individual[key];

                // Update local state optimistically
                setIndividualsData((prevIndividuals) =>
                    prevIndividuals.map((indiv) => {
                        if (indiv.employee_id === individual.employee_id) {
                            return { ...indiv, [key]: newValue };
                        }
                        return indiv;
                    })
                );

                updatedIndividual = { ...individual, [key]: newValue };
            } else if (key === 'web' || key === 'ins' || key === 'pro') {
                // For working groups
                const workingGroupName =
                    key === 'web' ? 'Web' : key === 'ins' ? 'Instructional Materials' : 'Procurement';
                const isMember = individual.workingGroups?.some((wg) => wg.name === workingGroupName);

                let updatedWorkingGroups;

                if (isMember) {
                    // Remove the working group
                    updatedWorkingGroups = individual.workingGroups.filter((wg) => wg.name !== workingGroupName);
                } else {
                    // Add the working group
                    updatedWorkingGroups = [...(individual.workingGroups || []), { name: workingGroupName }];
                }

                // Update local state optimistically
                setIndividualsData((prevIndividuals) =>
                    prevIndividuals.map((indiv) => {
                        if (indiv.employee_id === individual.employee_id) {
                            return { ...indiv, workingGroups: updatedWorkingGroups };
                        }
                        return indiv;
                    })
                );

                updatedIndividual = { ...individual, workingGroups: updatedWorkingGroups };
            } else {
                // Handle other cases if necessary
                return;
            }

            try {
                // Update the backend
                await updateIndividual(updatedIndividual);
                toast({
                    title: 'Updated successfully.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            } catch (error) {
                // Revert state if update fails
                setIndividualsData((prevIndividuals) =>
                    prevIndividuals.map((indiv) => {
                        if (indiv.employee_id === individual.employee_id) {
                            return individual; // Revert to original individual
                        }
                        return indiv;
                    })
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

    const columns = React.useMemo(
        () => [
            {
                Header: 'Name',
                accessor: 'name',
                Cell: ({ value }) => (
                    <Text as="span" isTruncated maxWidth="150px" title={value} fontWeight="medium">
                        {value}
                    </Text>
                ),
            },
            {
                Header: 'EID',
                accessor: 'employee_id',
                Cell: ({ value }) => (
                    <Text as="span" isTruncated maxWidth="100px" title={value}>
                        {value}
                    </Text>
                ),
            },
            {
                Header: 'Role',
                accessor: 'ati_role',
                Cell: ({ value }) => (
                    <Text as="span" isTruncated maxWidth="100px" title={value}>
                        {value || '-'}
                    </Text>
                ),
            },
            {
                Header: 'Campus',
                accessor: 'host_campus',
                Cell: ({ value }) => (
                    <Text as="span" isTruncated maxWidth="80px" title={value} textTransform="uppercase">
                        {value || '-'}
                    </Text>
                ),
            },
            {
                Header: 'Active',
                accessor: 'active',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        size="sm"
                        colorScheme="teal"
                        isChecked={original.active}
                        onChange={() => handleCheckboxChange(original, 'active')}
                        aria-label={`Active — ${original.name}`}
                    />
                ),
            },
            {
                Header: 'Non-Member',
                accessor: 'non_committee_member_active',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        size="sm"
                        colorScheme="teal"
                        isChecked={original.non_committee_member_active}
                        onChange={() => handleCheckboxChange(original, 'non_committee_member_active')}
                        title="Active non-committee member"
                        aria-label={`Active non-committee member — ${original.name}`}
                    />
                ),
            },
            {
                Header: 'Web',
                accessor: (row) => row.workingGroups?.some((wg) => wg.name === 'Web'),
                id: 'web',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        size="sm"
                        colorScheme="teal"
                        isChecked={original.workingGroups?.some((wg) => wg.name === 'Web')}
                        onChange={() => handleCheckboxChange(original, 'web')}
                        aria-label={`Web working group — ${original.name}`}
                    />
                ),
            },
            {
                Header: 'Ins',
                accessor: (row) =>
                    row.workingGroups?.some((wg) => wg.name === 'Instructional Materials'),
                id: 'ins',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        size="sm"
                        colorScheme="teal"
                        isChecked={original.workingGroups?.some((wg) => wg.name === 'Instructional Materials')}
                        onChange={() => handleCheckboxChange(original, 'ins')}
                        aria-label={`Instructional Materials working group — ${original.name}`}
                    />
                ),
            },
            {
                Header: 'Pro',
                accessor: (row) => row.workingGroups?.some((wg) => wg.name === 'Procurement'),
                id: 'pro',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        size="sm"
                        colorScheme="teal"
                        isChecked={original.workingGroups?.some((wg) => wg.name === 'Procurement')}
                        onChange={() => handleCheckboxChange(original, 'pro')}
                        aria-label={`Procurement working group — ${original.name}`}
                    />
                ),
            },
            {
                Header: 'Approver',
                accessor: 'can_approve_yse',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        size="sm"
                        colorScheme="teal"
                        isChecked={original.can_approve_yse}
                        onChange={() => handleCheckboxChange(original, 'can_approve_yse')}
                        aria-label={`Can approve evidence — ${original.name}`}
                    />
                ),
            },
            {
                Header: 'Email',
                accessor: 'email',
                Cell: ({ value }) => (
                    <Text as="span" isTruncated maxWidth="180px" title={value} fontSize="xs">
                        {value}
                    </Text>
                ),
            },
            {
                Header: 'Actions',
                id: 'actions',
                Cell: ({ row: { original } }) => (
                    <Button
                        size="xs"
                        colorScheme="teal"
                        variant="ghost"
                        onClick={() => openEditModal(original)}
                    >
                        Edit
                    </Button>
                ),
            },
        ],
        [handleCheckboxChange]
    );

    if (loading) {
        return (
            <Center h="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
            </Center>
        );
    }

    if (!individualsData || individualsData.length === 0) {
        return <Box>No members found.</Box>;
    }

    return (
        <Box>
            <HStack justifyContent="space-between" mb={4}>
                <Heading size="md" color="gray.800">Members</Heading>
                <Button colorScheme="teal" size="sm" onClick={openCreateModal}>
                    Add Person
                </Button>
            </HStack>
            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                overflow="hidden"
                bg="white"
                boxShadow="sm"
            >
                <MembersTable columns={columns} data={individualsData} />
            </Box>
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