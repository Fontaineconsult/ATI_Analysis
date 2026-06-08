import React, { useEffect, useRef, useState } from 'react';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    HStack,
    IconButton,
    Collapse,
    Box,
    Grid,
    GridItem
} from '@chakra-ui/react';
import { FaEdit } from 'react-icons/fa';
import PlanEditForm from './PlanEditForm';
import PlanProgressNotes from './PlanProgressNotes';
import { getPlanStatusColorScheme } from '../../styles/planStatusColors';

function PlansTable({ plans, onUpdate, initialPlanId }) {
    const [editingRows, setEditingRows] = useState(
        () => (initialPlanId ? new Set([initialPlanId]) : new Set())
    );

    // Re-honor initialPlanId if it changes after mount (e.g., user clicks
    // an in-app link to a different /plans/<id> while already on this page).
    useEffect(() => {
        if (initialPlanId) {
            setEditingRows((prev) => new Set([...prev, initialPlanId]));
        }
    }, [initialPlanId]);

    // Scroll the deep-linked row into view once the plan rows have rendered.
    const deepLinkRowRef = useRef(null);
    useEffect(() => {
        if (initialPlanId && deepLinkRowRef.current) {
            deepLinkRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [initialPlanId, plans]);

    const toggleEdit = (id) => {
        const newEditing = new Set(editingRows);
        if (newEditing.has(id)) {
            newEditing.delete(id);
        } else {
            newEditing.add(id);
        }
        setEditingRows(newEditing);
    };

    return (
        <Table variant="simple" size="sm">
            <Thead bg="gray.50">
                <Tr>
                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" textTransform="uppercase">
                        Name
                    </Th>
                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" textTransform="uppercase">
                        Working Group
                    </Th>
                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" textTransform="uppercase">
                        Campus
                    </Th>
                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" textTransform="uppercase">
                        Goal
                    </Th>
                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" textTransform="uppercase">
                        Status
                    </Th>
                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" textTransform="uppercase">
                        Flags
                    </Th>
                    <Th color="gray.700" fontWeight="semibold" fontSize="xs" textTransform="uppercase">
                        Actions
                    </Th>
                </Tr>
            </Thead>
            <Tbody>
                {plans.map((plan, index) => (
                    <React.Fragment key={plan.unique_id || index}>
                        <Tr
                            ref={plan.unique_id === initialPlanId ? deepLinkRowRef : null}
                            _hover={{ bg: "gray.50" }}
                            transition="background-color 0.2s"
                        >
                            <Td
                                color="gray.800"
                                fontWeight="medium"
                                fontSize="sm"
                            >
                                {plan.name}
                            </Td>
                            <Td color="gray.700" fontSize="xs">
                                {plan.workingGroup}
                            </Td>
                            <Td>
                                {Array.isArray(plan.campuses) && plan.campuses.length > 0 ? (
                                    <HStack spacing={1}>
                                        {plan.campuses.map((abbrev) => (
                                            <Badge
                                                key={abbrev}
                                                colorScheme="teal"
                                                fontSize="xs"
                                                px={2}
                                                py={1}
                                                borderRadius="md"
                                                textTransform="uppercase"
                                            >
                                                {abbrev}
                                            </Badge>
                                        ))}
                                    </HStack>
                                ) : (
                                    <Box as="span" color="gray.400" fontSize="xs">—</Box>
                                )}
                            </Td>
                            <Td color="gray.700" fontSize="xs">
                                {plan.goalNumber}
                            </Td>
                            <Td>
                                <Badge
                                    colorScheme={getPlanStatusColorScheme(plan)}
                                    fontSize="xs"
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                >
                                    {plan.abandoned ? 'Abandoned' : plan.plan_status}
                                </Badge>
                            </Td>
                            <Td>
                                <HStack spacing={1}>
                                    {plan.is_key_plan && (
                                        <Badge
                                            colorScheme="purple"
                                            fontSize="xs"
                                            px={2}
                                            py={1}
                                            borderRadius="md"
                                        >
                                            Key
                                        </Badge>
                                    )}
                                    {plan.is_campus_plan && (
                                        <Badge
                                            colorScheme="green"
                                            fontSize="xs"
                                            px={2}
                                            py={1}
                                            borderRadius="md"
                                        >
                                            Campus
                                        </Badge>
                                    )}
                                </HStack>
                            </Td>
                            <Td>
                                <IconButton
                                    size="xs"
                                    icon={<FaEdit />}
                                    onClick={() => toggleEdit(plan.unique_id)}
                                    variant={editingRows.has(plan.unique_id) ? "solid" : "ghost"}
                                    colorScheme="teal"
                                    aria-label="Edit plan"
                                    aria-expanded={editingRows.has(plan.unique_id)}
                                    _hover={{
                                        bg: editingRows.has(plan.unique_id) ? "teal.600" : "teal.50"
                                    }}
                                />
                            </Td>
                        </Tr>
                        <Tr>
                            <Td
                                colSpan={7}
                                p={0}
                                borderWidth={0}
                                bg={editingRows.has(plan.unique_id) ? "gray.50" : "transparent"}
                            >
                                <Collapse in={editingRows.has(plan.unique_id)} animateOpacity>
                                    <Box
                                        p={3}
                                        bg="gray.50"
                                        borderBottomWidth="2px"
                                        borderBottomColor="gray.200"
                                    >
                                        {(plan.completed_year || plan.abandoned_year) && (
                                            <HStack spacing={2} mb={3}>
                                                {plan.completed_year && (
                                                    <Badge
                                                        colorScheme="green"
                                                        variant="outline"
                                                        fontSize="xs"
                                                        px={2}
                                                        py={1}
                                                        borderRadius="md"
                                                    >
                                                        Completed {plan.completed_year}
                                                    </Badge>
                                                )}
                                                {plan.abandoned_year && (
                                                    <Badge
                                                        colorScheme="red"
                                                        variant="outline"
                                                        fontSize="xs"
                                                        px={2}
                                                        py={1}
                                                        borderRadius="md"
                                                    >
                                                        Abandoned {plan.abandoned_year}
                                                    </Badge>
                                                )}
                                            </HStack>
                                        )}
                                        <Grid templateColumns="2fr 1fr" gap={3}>
                                            <GridItem>
                                                <PlanEditForm
                                                    plan={plan}
                                                    onClose={() => toggleEdit(plan.unique_id)}
                                                    onSuccess={() => {
                                                        toggleEdit(plan.unique_id);
                                                        onUpdate(plan.workingGroup);
                                                    }}
                                                />
                                            </GridItem>
                                            <GridItem>
                                                <PlanProgressNotes
                                                    planUniqueId={plan.unique_id}
                                                    planName={plan.name}
                                                    progressNotesData={plan.progress_notes || []}
                                                />
                                            </GridItem>
                                        </Grid>
                                    </Box>
                                </Collapse>
                            </Td>
                        </Tr>
                    </React.Fragment>
                ))}
            </Tbody>
        </Table>
    );
}

export default PlansTable;