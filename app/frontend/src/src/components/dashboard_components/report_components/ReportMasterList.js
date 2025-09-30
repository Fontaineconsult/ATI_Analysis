import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from "../../../context/DataContext";
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    Heading,
    VStack,
    Badge,
    Spinner,
    Alert,
    AlertIcon,
    Text,
    Divider,
    Flex,
    HStack
} from "@chakra-ui/react";
import {getStatusColor} from "../../../services/utils/tools";
import AtiStats from "./atistats";
import StatusLevels from "./StatusLevelDefs";

const ReportMasterList = () => {
    const { data, loading, error } = useContext(DataContext);
    const navigate = useNavigate();

    // Helper function to get View URL from composite key
    const getUrlFromCompositeKey = (compositeKey) => {
        const [numbers, suffix] = compositeKey.split('-');
        const [goalNumber, indicatorNumber] = numbers.split('.');

        const workingGroupMap = {
            'web': 'web',
            'pro': 'procurement',
            'ins': 'instructional-materials'
        };

        const workingGroupSegment = workingGroupMap[suffix] || suffix;
        return `${workingGroupSegment}/${goalNumber}/${indicatorNumber}`;
    };

    // Helper function to get Edit URL for ATI Explorer
    const getEditUrlFromCompositeKey = (compositeKey) => {
        const [numbers, suffix] = compositeKey.split('-');
        const [goalNumber, indicatorNumber] = numbers.split('.');

        const workingGroupMap = {
            'web': 'web',
            'pro': 'procurement',
            'ins': 'instructional-materials'
        };

        const workingGroupSegment = workingGroupMap[suffix] || suffix;
        // Format: /ati/ati-explorer/{working-group}/goal/{goal-number}#{composite-key}
        return `/ati-explorer/${workingGroupSegment}/goal/${goalNumber}#${compositeKey}`;
    };

    // Function to render a table for a single goal
    const renderGoalTable = (goal, workingGroupName) => {
        if (!goal.indicators || goal.indicators.length === 0) {
            return (
                <Box key={goal.goal?.id} mb={6}>
                    <Heading size="sm" color="gray.700" mb={2}>
                        Goal {goal.goal?.properties?.goal_number}: {goal.goal?.properties?.name}
                    </Heading>
                    <Text color="gray.500" fontSize="sm">No indicators available for this goal.</Text>
                </Box>
            );
        }

        // Sort indicators by indicator number
        const sortedIndicators = [...goal.indicators].sort((a, b) => {
            const aNum = parseInt(a.indicator?.properties?.composite_key?.split('-')[0]?.split('.')[1] || 0);
            const bNum = parseInt(b.indicator?.properties?.composite_key?.split('-')[0]?.split('.')[1] || 0);
            return aNum - bNum;
        });

        return (
            <Box
                key={goal.goal?.id}
                mb={6}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
                bg="white"
                boxShadow="sm"
                _hover={{ boxShadow: "md" }}
                transition="box-shadow 0.2s"
            >
                <VStack align="stretch" spacing={3}>
                    <Box>
                        <Heading size="sm" color="gray.700" mb={2}>
                            Goal {goal.goal?.properties?.goal_number}: {goal.goal?.properties?.name}
                        </Heading>
                        <Text fontSize="xs" color="gray.600">
                            {goal.goal?.properties?.goal}
                        </Text>
                    </Box>

                    <Table variant="simple" size="sm">
                        <Thead>
                            <Tr bg="gray.50">
                                <Th width="10%" color="gray.600" fontWeight="semibold" fontSize="xs">ID</Th>
                                <Th width="50%" color="gray.600" fontWeight="semibold" fontSize="xs">Description</Th>
                                <Th width="18%" color="gray.600" fontWeight="semibold" fontSize="xs">Status</Th>
                                <Th width="22%" color="gray.600" fontWeight="semibold" fontSize="xs">Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {sortedIndicators.map((indicator) => {
                                const compositeKey = indicator.indicator?.properties?.composite_key;
                                const indicatorNumber = compositeKey?.split('-')[0]?.split('.')[1];
                                const statusLevel = indicator.evidences?.[0]?.statusLevel?.properties?.status_level;

                                return (
                                    <Tr key={indicator.indicator?.id} _hover={{ bg: "gray.50" }}>
                                        <Td fontWeight="medium" color="gray.700" fontSize="xs">{indicatorNumber}</Td>
                                        <Td color="gray.700" fontSize="xs">{indicator.indicator?.properties?.success_indicator}</Td>
                                        <Td>
                                            <Badge
                                                bg={getStatusColor(statusLevel)}
                                                color="white"
                                                fontSize="xs"
                                                px={2}
                                                py={1}
                                                borderRadius="md"
                                            >
                                                {statusLevel || 'Not Started'}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <HStack spacing={2}>
                                                <Button
                                                    size="xs"
                                                    colorScheme="teal"
                                                    variant="solid"
                                                    onClick={() => {
                                                        const urlSegment = getUrlFromCompositeKey(compositeKey);
                                                        navigate(`/dashboard/reports/${urlSegment}`);
                                                    }}
                                                    _hover={{ bg: "teal.600" }}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    colorScheme="gray"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const editUrl = getEditUrlFromCompositeKey(compositeKey);
                                                        const [pathname, hash] = editUrl.split('#');

                                                        // Navigate using React Router (no page reload)
                                                        navigate(pathname + '#' + hash);

                                                        // Use setTimeout to ensure the page has rendered before scrolling
                                                        setTimeout(() => {
                                                            if (hash) {
                                                                const element = document.getElementById(hash);
                                                                if (element) {
                                                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                } else {
                                                                    // If element not found immediately, try again after a longer delay
                                                                    setTimeout(() => {
                                                                        const retryElement = document.getElementById(hash);
                                                                        if (retryElement) {
                                                                            retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                        }
                                                                    }, 500);
                                                                }
                                                            }
                                                        }, 100);
                                                    }}
                                                    _hover={{ bg: "gray.50" }}
                                                >
                                                    Edit
                                                </Button>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                );
                            })}
                        </Tbody>
                    </Table>
                </VStack>
            </Box>
        );
    };

    // Function to render all goals for a working group
    const renderWorkingGroup = (workingGroupData, workingGroupName) => {
        if (!workingGroupData?.goals || workingGroupData.goals.length === 0) {
            return (
                <Box key={workingGroupName} mb={8}>
                    <Heading size="md" color="teal.700" mb={4}>
                        {workingGroupData?.workingGroup || workingGroupName}
                    </Heading>
                    <Text color="gray.500" fontSize="sm">No goals available for this working group.</Text>
                </Box>
            );
        }

        return (
            <Box key={workingGroupName} mb={8}>
                <Heading size="md" color="teal.700" mb={4}>
                    {workingGroupData.workingGroup}
                </Heading>
                <VStack align="stretch" spacing={4}>
                    {workingGroupData.goals
                        .sort((a, b) => (a.goal?.properties?.goal_number || 0) - (b.goal?.properties?.goal_number || 0))
                        .map((goal) => renderGoalTable(goal, workingGroupName))}
                </VStack>
            </Box>
        );
    };

    if (loading) {
        return (
            <Box p={8} display="flex" flexDirection="column" alignItems="center" justifyContent="center" minH="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
                <Text mt={4} color="gray.600" fontSize="sm">Loading reports...</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={8}>
                <Alert status="error" borderRadius="lg" fontSize="sm">
                    <AlertIcon />
                    Error loading data: {error}
                </Alert>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box p={8}>
                <Alert status="warning" borderRadius="lg" fontSize="sm">
                    <AlertIcon />
                    No data available
                </Alert>
            </Box>
        );
    }

    return (
        <Flex  p={6} gap={8}>
            {/* Main Content - 75% */}
            <Box
                flex="0 0 75%"
                bg="white"
                borderRadius="lg"
                p={6}
                boxShadow="sm"
            >
                <Heading size="lg" color="gray.800" mb={6}>
                    ATI Success Indicators Report
                </Heading>

                {/* Web Working Group */}
                {data.web && renderWorkingGroup(data.web, 'Web')}
                {data.web && data.procurement && <Divider my={6} borderColor="gray.200" />}

                {/* Procurement Working Group */}
                {data.procurement && renderWorkingGroup(data.procurement, 'Procurement')}
                {data.procurement && data.instructionalMaterials && <Divider my={6} borderColor="gray.200" />}

                {/* Instructional Materials Working Group */}
                {data.instructionalMaterials && renderWorkingGroup(data.instructionalMaterials, 'Instructional Materials')}
            </Box>

            {/* Supporting Information Column - 25% */}
            <Box
                flex="0 0 25%"
                bg="white"
                borderRadius="lg"
                p={6}
                boxShadow="sm"
                height="fit-content"
                top={24}
            >
                <Heading size="md" color="gray.800" mb={4}>
                    Supporting Information
                </Heading>
                <AtiStats/>
                <StatusLevels/>
            </Box>
        </Flex>
    );
};

export default ReportMasterList;