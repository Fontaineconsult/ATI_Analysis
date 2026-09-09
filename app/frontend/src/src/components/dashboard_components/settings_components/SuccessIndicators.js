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
    Spinner,
    Center,
    Switch,
    Tooltip,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { DataContext } from '../../../context/DataContext';
import { updateRemovedStatus, updateOverrideImplementationRequirement } from '../../../services/api/put';
import { createYearSuccessEvidence } from '../../../services/api/post';
import { sortGoals, sortSuccessIndicators } from "../../../services/utils/sorters";
import { useColumnSort, SortableTh } from '../../functional_components/SortableTable';
import AddIndicator from './AddIndicator';
import EditIndicator from './EditIndicator';
import { SettingsContext } from "../../../context/SettingsContext";

const companionCount = (indicator) =>
    (indicator.examples_of_evidence?.length || 0) + (indicator.evidenceRequirements?.length || 0);

// Sort accessors, module-level so the sort memo's dependency is stable.
const SORT_ACCESSORS = {
    indicator: (r) => r.success_indicator,
    key: (r) => r.composite_key,
    status: (r) => !r.removed,                                        // Active first ascending
    override: (r) => Boolean(r.override_implementation_requirement),
    evidence: (r) => companionCount(r),
};

/**
 * One goal's indicator table, with its own column-sort state (each goal is its
 * own table, so sort cannot be shared). Rows arrive pre-sorted in the default
 * indicator order; sorting a column overrides it until the header is toggled.
 */
function GoalIndicatorsTable({ indicators, onStatusChange, onOverrideChange, onEditOpen, onActionClick }) {
    const { sorted, sortKey, direction, toggleSort } = useColumnSort(indicators, SORT_ACCESSORS);

    const sortableHeader = (key, label, extra = {}) => (
        <SortableTh columnKey={key} sortKey={sortKey} direction={direction} onSort={toggleSort} {...extra}>
            {label}
        </SortableTh>
    );

    return (
        <TableContainer overflowX="unset">
            <Table variant="simple" size="sm" layout="fixed">
                <Thead bg="gray.50">
                    <Tr>
                        {sortableHeader('indicator', 'Success Indicator')}
                        {sortableHeader('key', 'Key', { w: '120px' })}
                        {sortableHeader('status', 'Status', { w: '130px' })}
                        {sortableHeader('override', 'Implementations', { w: '160px' })}
                        {sortableHeader('evidence', 'Evidence', { w: '130px' })}
                        <Th color="gray.700" fontSize="xs" fontWeight="semibold" w="130px">Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {sorted.map((indicator) => {
                        const isRemoved = indicator.removed;
                        const hasYse = indicator.yearSuccessIndicators?.length > 0;
                        const evidenceCount = indicator.examples_of_evidence?.length || 0;
                        const requirementCount = indicator.evidenceRequirements?.length || 0;
                        const hasCompanion = evidenceCount > 0
                            || requirementCount > 0
                            || Boolean(indicator.established_example)
                            || Boolean(indicator.managed_example)
                            || Boolean(indicator.optimizing_example);

                        return (
                            <Tr
                                key={indicator.composite_key}
                                bg={isRemoved ? 'gray.50' : 'white'}
                                _hover={{ bg: isRemoved ? 'gray.100' : 'gray.50' }}
                            >
                                <Td
                                    fontSize="xs"
                                    color="gray.700"
                                    fontStyle={isRemoved ? 'italic' : 'normal'}
                                    whiteSpace="normal"
                                    wordBreak="break-word"
                                >
                                    {indicator.success_indicator}
                                </Td>
                                <Td>
                                    <Badge
                                        fontSize="xs"
                                        colorScheme={isRemoved ? 'gray' : 'teal'}
                                        variant="subtle"
                                        fontFamily="mono"
                                    >
                                        {indicator.composite_key}
                                    </Badge>
                                </Td>
                                <Td>
                                    <Select
                                        value={isRemoved ? 'Removed' : 'Active'}
                                        onChange={(e) => onStatusChange(indicator, e.target.value)}
                                        aria-label={`Status — ${indicator.composite_key}`}
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
                                                onChange={(e) => onOverrideChange(indicator, e.target.checked)}
                                                aria-label={`Implementations not required — ${indicator.composite_key}`}
                                            />
                                            <Text fontSize="2xs" color="gray.700">
                                                {indicator.override_implementation_requirement ? 'Not required' : 'Required'}
                                            </Text>
                                        </HStack>
                                    </Tooltip>
                                </Td>
                                <Td>
                                    <HStack spacing={2}>
                                        <Button
                                            size="xs"
                                            colorScheme="teal"
                                            variant={hasCompanion ? 'solid' : 'outline'}
                                            bg={hasCompanion ? undefined : 'white'}
                                            onClick={() => onEditOpen(indicator)}
                                        >
                                            Edit
                                        </Button>
                                        {evidenceCount > 0 && (
                                            <Tooltip label={`${evidenceCount} example(s) of evidence`} openDelay={400} hasArrow>
                                                <Badge fontSize="2xs" colorScheme="green" variant="subtle">
                                                    {evidenceCount}
                                                </Badge>
                                            </Tooltip>
                                        )}
                                        {requirementCount > 0 && (
                                            <Tooltip label={`${requirementCount} evidence requirement(s) — the companion bar, decomposed`} openDelay={400} hasArrow>
                                                <Badge fontSize="2xs" colorScheme="blue" variant="subtle">
                                                    {requirementCount}
                                                </Badge>
                                            </Tooltip>
                                        )}
                                    </HStack>
                                </Td>
                                <Td>
                                    <Button
                                        size="xs"
                                        colorScheme={hasYse ? 'red' : 'green'}
                                        variant={hasYse ? 'outline' : 'solid'}
                                        bg={hasYse ? 'white' : undefined}
                                        onClick={() => onActionClick(indicator)}
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
    );
}

const SuccessIndicators = () => {
    const { campus } = useParams();
    const { data, refreshIndicators } = useContext(DataContext);
    const { indicators } = data;
    const { currentAcademicYear } = useContext(SettingsContext);
    const [openModals, setOpenModals] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [editingIndicator, setEditingIndicator] = useState(null);

    const onAddOpen = (categoryName) => {
        setOpenModals((prev) => ({ ...prev, [categoryName]: true }));
    };

    const onAddClose = (categoryName) => {
        setOpenModals((prev) => ({ ...prev, [categoryName]: false }));
    };

    const onEditOpen = (indicator) => setEditingIndicator(indicator);
    const onEditClose = () => setEditingIndicator(null);

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
        }
    };

    const handleActionClick = (indicator) => {
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
            <HStack justifyContent="space-between" mb={4}>
                <Heading as="h2" size="lg" color="gray.800">Success Indicators</Heading>
                {isLoading && <Spinner size="sm" color="teal.500" />}
            </HStack>

            {[...indicators]
                .sort(sortGoals)
                .map((category) => (
                    <Box key={category.name} mb={8}>
                        {/* Working-group band — solid teal.700 with white heading
                            (design-sense §4.2: a teal.50 tint band disappears). */}
                        <Box
                            bg="teal.700"
                            px={4}
                            py={3}
                            borderRadius="lg"
                            mb={4}
                        >
                            <HStack justifyContent="space-between" align="center">
                                <Heading as="h3" size="sm" color="white" fontWeight="extrabold">
                                    {category.name}
                                </Heading>
                                <Button
                                    size="sm"
                                    bg="white"
                                    color="teal.700"
                                    _hover={{ bg: 'teal.50' }}
                                    leftIcon={<AddIcon boxSize={3} />}
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
                            [...category.goals]
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
                                            <Heading as="h4" size="sm" color="gray.700">
                                                Goal {goal.goal_number}: {goal.goal}
                                            </Heading>
                                            {goal.name && (
                                                <Text fontSize="xs" color="gray.700" mt={1}>
                                                    {goal.name}
                                                </Text>
                                            )}
                                        </Box>

                                        {goal.successIndicators && goal.successIndicators.length > 0 ? (
                                            <GoalIndicatorsTable
                                                indicators={[...goal.successIndicators].sort(sortSuccessIndicators)}
                                                onStatusChange={handleStatusChange}
                                                onOverrideChange={handleOverrideChange}
                                                onEditOpen={onEditOpen}
                                                onActionClick={handleActionClick}
                                            />
                                        ) : (
                                            <Box p={4}>
                                                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                                                    No success indicators yet.
                                                </Text>
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
                                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                                    No goals available for {category.name}.
                                </Text>
                            </Box>
                        )}
                    </Box>
                ))}

            <EditIndicator
                indicator={editingIndicator}
                isOpen={editingIndicator !== null}
                onClose={onEditClose}
            />
        </Box>
    );
};

export default SuccessIndicators;
