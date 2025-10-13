import React, { useState } from 'react';
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
    Box
} from '@chakra-ui/react';
import { FaEdit } from 'react-icons/fa';
import PlanEditForm from './PlanEditForm';

function PlansTable({ plans, onUpdate }) {
    const [editingRows, setEditingRows] = useState(new Set());

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
                                    <Box
                                        p={6}
                                        bg="gray.50"
                                        borderBottomWidth="2px"
                                        borderBottomColor="gray.200"
                                    >
                                        <PlanEditForm
                                            plan={plan}
                                            onClose={() => toggleEdit(plan.unique_id)}
                                            onSuccess={() => {
                                                toggleEdit(plan.unique_id);
                                                onUpdate(plan.workingGroup);
                                            }}
                                        />
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