// src/components/dashboard_components/settings_components/Members.js

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
    HStack,
} from '@chakra-ui/react';
import { useTable } from 'react-table';
import { DataContext } from '../../../context/DataContext';
import { UserContext } from '../../../context/UserContext';
import { updateIndividual } from '../../../services/api/put'; // Import the update function
import EditIndividual from './EditIndividual'; // Import the new component

// Memoized Table Component
const MembersTable = React.memo(({ columns, data }) => {
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({ columns, data });

    return (
        <TableContainer overflowX="auto">
            <Table variant="simple" {...getTableProps()} size="sm">
                <Thead>
                    {headerGroups.map((headerGroup) => (
                        <Tr {...headerGroup.getHeaderGroupProps()}>
                            {headerGroup.headers.map((column) => (
                                <Th
                                    {...column.getHeaderProps()}
                                    style={{ whiteSpace: 'nowrap', padding: '8px' }}
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
                            <Tr {...row.getRowProps()}>
                                {row.cells.map((cell) => (
                                    <Td
                                        {...cell.getCellProps()}
                                        style={{
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '150px',
                                        }}
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
    const {loadAllIndividuals,individuals } = useContext(UserContext);
    const [individualsData, setIndividualsData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIndividual, setSelectedIndividual] = useState(null); // For edit mode
    const toast = useToast();

    // Load individuals on component mount
    useEffect(() => {
        loadAllIndividuals();
    }, []); // Empty dependency array since loadAllIndividuals is memoized

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

            if (key === 'active' || key === 'can_approve_yse' || key === 'ati_role') {
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
                    <Text as="span" isTruncated maxWidth="150px" title={value}>
                        {value}
                    </Text>
                ),
            },
            {
                Header: 'EID',
                accessor: 'employee_id',
                Cell: ({ value }) => (
                    <Text as="span" isTruncated maxWidth="120px" title={value}>
                        {value}
                    </Text>
                ),
            },
            {
                Header: 'Role',
                accessor: 'ati_role',
                Cell: ({ value }) => (
                    <Text as="span" isTruncated maxWidth="120px" title={value}>
                        {value}
                    </Text>
                ),
            },
            {
                Header: 'Active',
                accessor: 'active',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        isChecked={original.active}
                        onChange={() => handleCheckboxChange(original, 'active')}
                    />
                ),
            },
            {
                Header: 'Web',
                accessor: (row) => row.workingGroups?.some((wg) => wg.name === 'Web'),
                id: 'web',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        isChecked={original.workingGroups?.some((wg) => wg.name === 'Web')}
                        onChange={() => handleCheckboxChange(original, 'web')}
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
                        isChecked={original.workingGroups?.some((wg) => wg.name === 'Instructional Materials')}
                        onChange={() => handleCheckboxChange(original, 'ins')}
                    />
                ),
            },
            {
                Header: 'Pro',
                accessor: (row) => row.workingGroups?.some((wg) => wg.name === 'Procurement'),
                id: 'pro',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        isChecked={original.workingGroups?.some((wg) => wg.name === 'Procurement')}
                        onChange={() => handleCheckboxChange(original, 'pro')}
                    />
                ),
            },
            {
                Header: 'Approver',
                accessor: 'can_approve_yse',
                Cell: ({ row: { original } }) => (
                    <Checkbox
                        isChecked={original.can_approve_yse}
                        onChange={() => handleCheckboxChange(original, 'can_approve_yse')}
                    />
                ),
            },
            {
                Header: 'Email',
                accessor: 'email',
                Cell: ({ value }) => (
                    <Text as="span" isTruncated maxWidth="200px" title={value}>
                        {value}
                    </Text>
                ),
            },
            {
                Header: 'Actions',
                id: 'actions',
                Cell: ({ row: { original } }) => (
                    <Button size="sm" onClick={() => openEditModal(original)}>
                        Edit
                    </Button>
                ),
            },
        ],
        [handleCheckboxChange]
    );

    if (loading) {
        return <Spinner size="xl" />;
    }

    if (!individualsData || individualsData.length === 0) {
        return <Box>No members found.</Box>;
    }

    return (
        <Box>
            <HStack justifyContent="space-between" mb={4}>
                <Heading size="md">Members</Heading>
                <Button colorScheme="blue" onClick={openCreateModal}>
                    Add Person
                </Button>
            </HStack>
            <MembersTable columns={columns} data={individualsData} />
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
