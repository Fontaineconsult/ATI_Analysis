import React, { useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Heading,
    Button,
    Select,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Badge,
    HStack,
    Divider,
    Spinner,
    Center,
    Switch,
    Tooltip,
} from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { updateRemovedStatus, updateOverrideImplementationRequirement } from '../../../services/api/put';
import { createYearSuccessEvidence } from '../../../services/api/post';
import { sortGoals, sortSuccessIndicators } from "../../../services/utils/sorters";
import AddIndicator from './AddIndicator';
import { SettingsContext } from "../../../context/SettingsContext";

const SuccessIndicators = () => {
    const { campus } = useParams();
    const { data, refreshIndicators } = useContext(DataContext);
    const { indicators } = data;
    const { currentAcademicYear } = useContext(SettingsContext);
    const [openModals, setOpenModals] = useState({});
    const [selectedIndicator, setSelectedIndicator] = useState(null);
    const [actionType, setActionType] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const onAddOpen = (categoryName) => {
        setOpenModals((prev) => ({ ...prev, [categoryName]: true }));
    };

    const onAddClose = (categoryName) => {
        setOpenModals((prev) => ({ ...prev, [categoryName]: false }));
    };

    const handleStatusChange = async (indicator, newStatus) => {
        const originalRemovedStatus = indicator.removed;
        const newRemovedStatus = newStatus === 'Removed';

        indicator.removed = newRemovedStatus;
        refreshIndicators();

        try {
            setIsLoading(true);
            await updateRemovedStatus(indicator.composite_key, newRemovedStatus);
            refreshIndicators();
        } catch (error) {
            console.error("Failed to update status:", error);
            indicator.removed = originalRemovedStatus;
            refreshIndicators();
        } finally {
            setIsLoading(false);
        }
    };

    const handleOverrideChange = async (indicator, override) => {
        const original = indicator.override_implementation_requirement;

        indicator.override_implementation_requirement = override;
        refreshIndicators();

        try {
            setIsLoading(true);
            await updateOverrideImplementationRequirement(indicator.composite_key, override);
            refreshIndicators();
        } catch (error) {
            console.error("Failed to update implementation-requirement override:", error);
            indicator.override_implementation_requirement = original;
            refreshIndicators();
        } finally {
            setIsLoading(false);
        }
    };

    const toggleYearSuccessEvidence = async (indicator, academicYear) => {
        const action = indicator.yearSuccessIndicators.length > 0 ? "detach" : "attach";
        setIsLoading(true);

        try {
            if (action === "attach") {
                await createYearSuccessEvidence(academicYear, indicator.composite_key, campus);
            } else {
                // Detach not yet implemented
            }
            refreshIndicators();
        } catch (error) {
            console.error(`Failed to ${action} year success evidence:`, error);
        } finally {
            setIsLoading(false);
            setSelectedIndicator(null);
            setActionType('');
        }
    };

    const handleActionClick = (indicator) => {
        setSelectedIndicator(indicator);
        setActionType(indicator.yearSuccessIndicators.length > 0 ? 'Detach YSE' : 'Attach YSE');
        toggleYearSuccessEvidence(indicator, currentAcademicYear);
    };

    const handleAddIndicatorSubmit = (indicatorData) => {
        console.log("New indicator data:", indicatorData);
    };

    if (!indicators) {
        return (
            <Center h="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
            </Center>
        );
    }

    return (
        <Box>
            <HStack justifyContent="space-between" mb={6}>
                <Heading size="md" color="gray.800">Success Indicators</Heading>
                {isLoading && <Spinner size="sm" color="teal.500" />}
            </HStack>

            {indicators
                .sort(sortGoals)
                .map((category) => (
                    <Box key={category.name} mb={8}>
                        <Box
                            bg="teal.50"
                            px={4}
                            py={3}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor="teal.100"
                            mb={4}
                        >
                            <HStack justifyContent="space-between" align="center">
                                <Heading size="sm" color="teal.700">{category.name}</Heading>
                                <Button
                                    colorScheme="teal"
                                    size="sm"
                                    onClick={() => onAddOpen(category.name)}
                                >
                                    Add Indicator
                                </Button>
                            </HStack>
                        </Box>

                        <AddIndicator
                            indicators={category}
                            wg={category.name}
                            isOpen={openModals[category.name] || false}
                            onClose={() => onAddClose(category.name)}
                            onSubmit={handleAddIndicatorSubmit}
                        />

                        {category.goals && category.goals.length > 0 ? (
                            category.goals
                                .sort(sortGoals)
                                .map((goal) => (
                                    <Box
                                        key={goal.goal_number}
                                        mb={6}
                                        borderWidth="1px"
                                        borderColor="gray.200"
                                        borderRadius="lg"
                                        overflow="hidden"
                                        bg="white"
                                        boxShadow="sm"
                                    >
                                        <Box
                                            bg="gray.50"
                                            px={4}
                                            py={3}
                                            borderBottomWidth="1px"
                                            borderColor="gray.200"
                                        >
                                            <Heading size="sm" color="gray.700">
                                                Goal {goal.goal_number}: {goal.goal}
                                            </Heading>
                                            {goal.name && (
                                                <Text fontSize="xs" color="gray.500" mt={1}>
                                                    {goal.name}
                                                </Text>
                                            )}
                                        </Box>

                                        {goal.successIndicators && goal.successIndicators.length > 0 ? (
                                            <TableContainer overflowX="unset">
                                                <Table variant="simple" size="sm" layout="fixed">
                                                    <Thead bg="gray.50">
                                                        <Tr>
                                                            <Th color="gray.600" fontSize="xs" fontWeight="semibold">Success Indicator</Th>
                                                            <Th color="gray.600" fontSize="xs" fontWeight="semibold" w="120px">Key</Th>
                                                            <Th color="gray.600" fontSize="xs" fontWeight="semibold" w="130px">Status</Th>
                                                            <Th color="gray.600" fontSize="xs" fontWeight="semibold" w="150px">Implementations</Th>
                                                            <Th color="gray.600" fontSize="xs" fontWeight="semibold" w="130px">Actions</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {goal.successIndicators
                                                            .sort(sortSuccessIndicators)
                                                            .map((indicator) => {
                                                                const isRemoved = indicator.removed;
                                                                const hasYse = indicator.yearSuccessIndicators?.length > 0;

                                                                return (
                                                                    <Tr
                                                                        key={indicator.composite_key}
                                                                        opacity={isRemoved ? 0.5 : 1}
                                                                        bg={isRemoved ? 'gray.50' : 'white'}
                                                                        _hover={{ bg: isRemoved ? 'gray.100' : 'gray.50' }}
                                                                    >
                                                                        <Td fontSize="xs" color="gray.700" whiteSpace="normal" wordBreak="break-word">
                                                                            {indicator.success_indicator}
                                                                        </Td>
                                                                        <Td>
                                                                            <Badge
                                                                                fontSize="xs"
                                                                                colorScheme={isRemoved ? 'gray' : 'teal'}
                                                                                variant="subtle"
                                                                            >
                                                                                {indicator.composite_key}
                                                                            </Badge>
                                                                        </Td>
                                                                        <Td>
                                                                            <Select
                                                                                value={isRemoved ? 'Removed' : 'Active'}
                                                                                onChange={(e) => handleStatusChange(indicator, e.target.value)}
                                                                                size="xs"
                                                                                w="110px"
                                                                                borderColor="gray.300"
                                                                                _hover={{ borderColor: 'gray.400' }}
                                                                                _focus={{ borderColor: 'teal.500' }}
                                                                                bg="white"
                                                                            >
                                                                                <option value="Active">Active</option>
                                                                                <option value="Removed">Removed</option>
                                                                            </Select>
                                                                        </Td>
                                                                        <Td>
                                                                            <Tooltip
                                                                                label="When on, this indicator does not require traditional implementations — the dashboard won't flag it as missing implementations."
                                                                                openDelay={400}
                                                                                hasArrow
                                                                            >
                                                                                <HStack spacing={2}>
                                                                                    <Switch
                                                                                        size="sm"
                                                                                        colorScheme="orange"
                                                                                        isChecked={Boolean(indicator.override_implementation_requirement)}
                                                                                        onChange={(e) => handleOverrideChange(indicator, e.target.checked)}
                                                                                    />
                                                                                    <Text fontSize="2xs" color="gray.500">
                                                                                        {indicator.override_implementation_requirement ? 'Not required' : 'Required'}
                                                                                    </Text>
                                                                                </HStack>
                                                                            </Tooltip>
                                                                        </Td>
                                                                        <Td>
                                                                            <Button
                                                                                size="xs"
                                                                                colorScheme={hasYse ? 'red' : 'green'}
                                                                                variant={hasYse ? 'outline' : 'solid'}
                                                                                onClick={() => handleActionClick(indicator)}
                                                                                _hover={{
                                                                                    transform: 'translateY(-1px)',
                                                                                    boxShadow: 'sm'
                                                                                }}
                                                                                transition="all 0.2s"
                                                                            >
                                                                                {hasYse ? 'Detach YSE' : 'Attach YSE'}
                                                                            </Button>
                                                                        </Td>
                                                                    </Tr>
                                                                );
                                                            })}
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Box p={4}>
                                                <Text fontSize="sm" color="gray.500">No success indicators available.</Text>
                                            </Box>
                                        )}
                                    </Box>
                                ))
                        ) : (
                            <Box
                                p={4}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="lg"
                                bg="white"
                            >
                                <Text fontSize="sm" color="gray.500">No goals available for {category.name}.</Text>
                            </Box>
                        )}
                    </Box>
                ))}
        </Box>
    );
};

export default SuccessIndicators;
