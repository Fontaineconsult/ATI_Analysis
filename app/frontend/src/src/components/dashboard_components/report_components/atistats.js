import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Text,
    VStack,
    Spinner,
    TableContainer,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    Heading
} from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';

const calculateStatistics = (data) => {
    const stats = {
        workingGroups: {
            web: { goals: 0, indicators: 0 },
            instructionalMaterials: { goals: 0, indicators: 0 },
            procurement: { goals: 0, indicators: 0 }
        },
        statusLevels: {
            'Not Started': 0,
            Initiated: 0,
            Defined: 0,
            Established: 0,
            Managed: 0,
            Optimizing: 0
        },
        unassignedEvidence: 0
    };

    // Function to process each working group
    const processWorkingGroup = (workingGroupData) => {
        if (!workingGroupData || !workingGroupData.goals) return { goals: 0, indicators: 0 };

        const groupStats = {
            goals: workingGroupData.goals.length,
            indicators: 0
        };

        // Process each goal
        workingGroupData.goals.forEach((goal) => {
            if (!goal.indicators) return;

            groupStats.indicators += goal.indicators.length;

            // Process each indicator's evidence for status levels and unassigned
            goal.indicators.forEach((indicator) => {
                if (!indicator.evidences) return;

                indicator.evidences.forEach((evidenceObj) => {
                    // Count status levels
                    if (evidenceObj.statusLevel?.properties?.status_level) {
                        stats.statusLevels[evidenceObj.statusLevel.properties.status_level]++;
                    }

                    // Count unassigned evidence
                    if (!evidenceObj.persons || evidenceObj.persons.length === 0) {
                        stats.unassignedEvidence++;
                    }
                });
            });
        });

        return groupStats;
    };

    // Process each working group
    if (data.web) {
        stats.workingGroups.web = processWorkingGroup(data.web);
    }
    if (data.instructionalMaterials) {
        stats.workingGroups.instructionalMaterials = processWorkingGroup(data.instructionalMaterials);
    }
    if (data.procurement) {
        stats.workingGroups.procurement = processWorkingGroup(data.procurement);
    }

    return stats;
};

const AtiStats = () => {
    const { data, loading } = useContext(DataContext);
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();
    const { campus } = useParams();

    useEffect(() => {
        if (data && !loading) {
            setStats(calculateStatistics(data));
        }
    }, [data, loading]);

    const handleWorkingGroupClick = (workingGroup) => {
        // Map working group names to anchor IDs
        const anchorMap = {
            'web': 'web-section',
            'instructionalMaterials': 'instructional-materials-section',
            'procurement': 'procurement-section'
        };

        const anchorId = anchorMap[workingGroup];

        // Scroll to the section
        const element = document.getElementById(anchorId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // If element doesn't exist yet, navigate to the page first then scroll
            navigate(`/${campus}/dashboard/reports#` + anchorId);
            setTimeout(() => {
                const retryElement = document.getElementById(anchorId);
                if (retryElement) {
                    retryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
    };

    if (loading || !stats) {
        return (
            <Box display="flex" justifyContent="center" py={8}>
                <Spinner size="lg" color="teal.500" />
            </Box>
        );
    }

    const totalStatusAssignments = Object.values(stats.statusLevels).reduce((sum, val) => sum + val, 0);

    return (
        <VStack align="stretch" spacing={6}>
            {/* Working Group Metrics */}
            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
                bg="white"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s"
            >
            <Heading as="h3" size="md" color="teal.700" mb={4}>
                    Working Group Metrics
                </Heading>
                <TableContainer>
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr bg="gray.50">
                                <Th color="gray.600" fontWeight="semibold">Working Group</Th>
                                <Th color="gray.600" fontWeight="semibold" isNumeric>Goals</Th>
                                <Th color="gray.600" fontWeight="semibold" isNumeric>Success Indicators</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            <Tr
                                _hover={{ bg: "gray.50", cursor: "pointer" }}
                                onClick={() => handleWorkingGroupClick('web')}
                                cursor="pointer"
                            >
                                <Td color="gray.700">Web</Td>
                                <Td color="gray.700" isNumeric fontWeight="medium">{stats.workingGroups.web.goals}</Td>
                                <Td color="gray.700" isNumeric fontWeight="medium">{stats.workingGroups.web.indicators}</Td>
                            </Tr>
                            <Tr
                                _hover={{ bg: "gray.50", cursor: "pointer" }}
                                onClick={() => handleWorkingGroupClick('instructionalMaterials')}
                                cursor="pointer"
                            >
                                <Td color="gray.700">Instructional Materials</Td>
                                <Td color="gray.700" isNumeric fontWeight="medium">{stats.workingGroups.instructionalMaterials.goals}</Td>
                                <Td color="gray.700" isNumeric fontWeight="medium">{stats.workingGroups.instructionalMaterials.indicators}</Td>
                            </Tr>
                            <Tr
                                _hover={{ bg: "gray.50", cursor: "pointer" }}
                                onClick={() => handleWorkingGroupClick('procurement')}
                                cursor="pointer"
                            >
                                <Td color="gray.700">Procurement</Td>
                                <Td color="gray.700" isNumeric fontWeight="medium">{stats.workingGroups.procurement.goals}</Td>
                                <Td color="gray.700" isNumeric fontWeight="medium">{stats.workingGroups.procurement.indicators}</Td>
                            </Tr>
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Status Assignments */}
            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
                bg="white"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s"
            >
                <Heading as="h3" size="md" color="teal.700" mb={4}>
                    Status Assignments
                </Heading>
                <TableContainer>
                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr bg="gray.50">
                                <Th color="gray.600" fontWeight="semibold">Status Level</Th>
                                <Th color="gray.600" fontWeight="semibold" isNumeric>Count</Th>
                                <Th color="gray.600" fontWeight="semibold" isNumeric>Percent</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {Object.entries(stats.statusLevels).map(([status, count]) => {
                                const percentage = totalStatusAssignments
                                    ? ((count / totalStatusAssignments) * 100).toFixed(1)
                                    : 0;
                                return (
                                    <Tr key={status} _hover={{ bg: "gray.50" }}>
                                        <Td color="gray.700">{status}</Td>
                                        <Td color="gray.700" isNumeric fontWeight="medium">{count}</Td>
                                        <Td color="gray.700" isNumeric fontWeight="medium">{percentage}%</Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Unassigned Evidence */}
            <Box
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
                bg="white"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s"
            >
                <Heading as="h3" size="md" color="teal.700" mb={3}>
                    Implementation Assignment
                </Heading>
                <Text color="gray.700" fontSize="sm" mb={2}>
                    Success indicators with no implementing person assigned:{' '}
                    <Text as="span" fontWeight="bold" color="teal.600" fontSize="lg">
                        {stats.unassignedEvidence}
                    </Text>
                </Text>
                <Text fontSize="xs" color="gray.500">
                    Evidence nodes should have at least one person assigned to track implementation progress.
                </Text>
            </Box>
        </VStack>
    );
};

export default AtiStats;