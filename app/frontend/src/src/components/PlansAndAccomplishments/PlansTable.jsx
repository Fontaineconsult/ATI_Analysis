import React, { useState, useEffect, useRef } from 'react';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    HStack,
    VStack,
    IconButton,
    Collapse,
    Box
} from '@chakra-ui/react';
import { FaEdit } from 'react-icons/fa';
import PlanEditForm from './PlanEditForm';
import PlanProgressNotes from './PlanProgressNotes';

const STORAGE_KEY_EXPANDED = 'plansTable_expandedRows';
const STORAGE_KEY_SCROLL = 'plansTable_scrollPosition';

function PlansTable({ plans, onUpdate }) {
    // Initialize editingRows from sessionStorage if available
    const [editingRows, setEditingRows] = useState(() => {
        try {
            const saved = sessionStorage.getItem(STORAGE_KEY_EXPANDED);
            if (saved) {
                const parsed = JSON.parse(saved);
                return new Set(parsed);
            }
        } catch (e) {
            console.error('Error loading expanded rows from storage:', e);
        }
        return new Set();
    });

    const containerRef = useRef(null);

    // Save editingRows to sessionStorage whenever it changes
    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY_EXPANDED, JSON.stringify([...editingRows]));
        } catch (e) {
            console.error('Error saving expanded rows to storage:', e);
        }
    }, [editingRows]);

    // Save scroll position before unmount
    useEffect(() => {
        const saveScrollPosition = () => {
            if (containerRef.current) {
                const scrollY = window.scrollY || window.pageYOffset;
                sessionStorage.setItem(STORAGE_KEY_SCROLL, scrollY.toString());
            }
        };

        // Save on navigation events
        window.addEventListener('beforeunload', saveScrollPosition);

        return () => {
            saveScrollPosition();
            window.removeEventListener('beforeunload', saveScrollPosition);
        };
    }, []);

    // Restore scroll position on mount
    useEffect(() => {
        try {
            const savedScroll = sessionStorage.getItem(STORAGE_KEY_SCROLL);
            if (savedScroll) {
                const scrollY = parseInt(savedScroll, 10);
                // Delay restoration to ensure content is rendered
                setTimeout(() => {
                    window.scrollTo({
                        top: scrollY,
                        behavior: 'auto'
                    });
                }, 100);
            }
        } catch (e) {
            console.error('Error restoring scroll position:', e);
        }
    }, []);

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
        <Box ref={containerRef}>
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
                            <Td color="gray.700" fontSize="xs">
                                {plan.goalNumber}
                            </Td>
                            <Td>
                                <Badge
                                    colorScheme={
                                        plan.abandoned ? 'red' :
                                            plan.plan_status === 'Completed' ? 'green' :
                                                plan.plan_status === 'In Progress' ? 'blue' : 'gray'
                                    }
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
                                colSpan={6}
                                p={0}
                                borderWidth={0}
                                bg={editingRows.has(plan.unique_id) ? "gray.50" : "transparent"}
                            >
                                <Collapse in={editingRows.has(plan.unique_id)} animateOpacity>
                                    {/* Only render the expensive components when actually expanded */}
                                    {editingRows.has(plan.unique_id) && (
                                        <Box
                                            p={3}
                                            bg="gray.50"
                                            borderBottomWidth="2px"
                                            borderBottomColor="gray.200"
                                        >
                                            <PlanEditForm
                                                key={`plan-edit-${plan.unique_id}-${JSON.stringify(plan.furthered_yse_identifiers || [])}`}
                                                plan={plan}
                                                onClose={() => toggleEdit(plan.unique_id)}
                                                onSuccess={() => {
                                                    // Keep the row expanded after saving
                                                    onUpdate(plan.workingGroup);
                                                }}
                                                progressNotesComponent={
                                                    <PlanProgressNotes
                                                        planUniqueId={plan.unique_id}
                                                        planName={plan.name}
                                                        progressNotesData={plan.progress_notes || []}
                                                        onUpdate={() => onUpdate(plan.workingGroup)}
                                                    />
                                                }
                                            />
                                        </Box>
                                    )}
                                </Collapse>
                            </Td>
                        </Tr>
                    </React.Fragment>
                ))}
            </Tbody>
        </Table>
        </Box>
    );
}

export default PlansTable;