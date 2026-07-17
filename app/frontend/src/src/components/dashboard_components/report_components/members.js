import React, { useContext, useEffect } from 'react';
import {
    Box,
    Text,
    TableContainer,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    Spinner
} from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import {UserContext} from "../../../context/UserContext";

function Members() {
    const { data, loading } = useContext(DataContext);
    const { loadAllIndividuals, individuals } = useContext(UserContext);

    useEffect(() => {
        // Load individuals data when component mounts
        if (!individuals) {
            loadAllIndividuals();
        }
    }, []);

    // Filter for active members only
    const activeMembers = individuals?.filter((member) => member.active) || [];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" py={8}>
                <Spinner size="lg" color="teal.500" />
            </Box>
        );
    }

    return (
        <Box
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"

            bg="white"
            boxShadow="sm"
        >
            <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={4}>
                Active Committee Members
            </Text>

            <TableContainer>
                <Table variant="simple" size="sm">
                    <Thead>
                        <Tr bg="gray.50">
                            <Th py={1} px={2}  color="gray.600" fontWeight="semibold" fontSize="xs">Name</Th>
                            <Th py={1} px={2}  color="gray.600" fontWeight="semibold" fontSize="xs">Role</Th>
                            <Th py={1} px={2}  color="gray.600" fontWeight="semibold" fontSize="xs">Working Groups</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {activeMembers.length > 0 ? (
                            activeMembers.map((member) => (
                                <Tr key={member.employee_id || member.unique_id} _hover={{ bg: "gray.50" }}>
                                    <Td  px={2}  color="gray.700" fontSize="xs">
                                        {member.name}
                                    </Td>
                                    <Td  px={2}  color="gray.600" fontSize="xs">
                                        {member.ati_role || 'Member'}
                                    </Td>
                                    <Td   px={2}  color="gray.600" fontSize="xs">
                                        {member.workingGroups
                                            ?.map((group) => {
                                                // Handle both string and object formats
                                                const groupName = typeof group === 'string' ? group : group.name;

                                                // Map full names to abbreviations
                                                if (groupName === 'Instructional Materials' || groupName === 'instructional-materials') {
                                                    return 'Ins. M';
                                                } else if (groupName === 'Procurement' || groupName === 'procurement') {
                                                    return 'Proc';
                                                } else if (groupName === 'Web' || groupName === 'web') {
                                                    return 'Web';
                                                } else {
                                                    return groupName;
                                                }
                                            })
                                            .join(', ') || 'None assigned'}
                                    </Td>
                                </Tr>
                            ))
                        ) : (
                            <Tr>
                                <Td colSpan={3} textAlign="center" color="gray.600" fontSize="sm">
                                    No active members found
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </TableContainer>

            {activeMembers.length > 0 && (
                <Text fontSize="xs" color="gray.600" mt={4}>
                    Total Active Members: {activeMembers.length}
                </Text>
            )}
        </Box>
    );
}

export default Members;