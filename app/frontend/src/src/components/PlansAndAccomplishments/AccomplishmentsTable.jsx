import React, { useState } from 'react';
import {
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    Collapse,
    Box,
    Badge,
    HStack,
    VStack,
    Text
} from '@chakra-ui/react';
import { FaEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import AccomplishmentEditForm from './AccomplishmentEditForm';

function AccomplishmentsTable({ accomplishments, onUpdate }) {
    const [expandedRows, setExpandedRows] = useState(new Set());
    const [editingRows, setEditingRows] = useState(new Set());

    const toggleRow = (id) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
            const newEditing = new Set(editingRows);
            newEditing.delete(id);
            setEditingRows(newEditing);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const toggleEdit = (id) => {
        const newEditing = new Set(editingRows);
        if (newEditing.has(id)) {
            newEditing.delete(id);
        } else {
            newEditing.add(id);
            const newExpanded = new Set(expandedRows);
            newExpanded.add(id);
            setExpandedRows(newExpanded);
        }
        setEditingRows(newEditing);
    };

    return (
        <Table variant="simple" size="sm">
            <Thead>
                <Tr>
                    <Th width="40px">
                        <span className="sr-only">Expand</span>
                    </Th>
                    <Th>Name</Th>
                    <Th>Working Group</Th>
                    <Th>Goal</Th>
                    <Th>Advances YSE</Th>
                    <Th>Actions</Th>
                </Tr>
            </Thead>
            <Tbody>
                {accomplishments.map((acc, index) => (
                    <React.Fragment key={acc.unique_id || index}>
                        <Tr>
                            <Td>
                                <IconButton
                                    size="xs"
                                    icon={expandedRows.has(acc.unique_id) ? <FaChevronUp /> : <FaChevronDown />}
                                    onClick={() => toggleRow(acc.unique_id)}
                                    variant="ghost"
                                    aria-label={expandedRows.has(acc.unique_id) ? "Collapse row" : "Expand row"}
                                    aria-expanded={expandedRows.has(acc.unique_id)}
                                />
                            </Td>
                            <Td>{acc.name}</Td>
                            <Td>{acc.workingGroup}</Td>
                            <Td>{acc.goalNumber}</Td>
                            <Td>
                                {acc.yse_identifiers && acc.yse_identifiers.length > 0 ? (
                                    <HStack spacing={1} flexWrap="wrap">
                                        {acc.yse_identifiers.map((identifier, idx) => {
                                            const description = acc.yse_descriptions?.find(
                                                d => d.identifier === identifier
                                            )?.description;
                                            return (
                                                <Badge
                                                    key={identifier}
                                                    colorScheme="purple"
                                                    fontSize="xs"
                                                    title={description || identifier}
                                                >
                                                    {identifier}
                                                </Badge>
                                            );
                                        })}
                                    </HStack>
                                ) : (
                                    <Text fontSize="xs" color="gray.400">—</Text>
                                )}
                            </Td>
                            <Td>
                                <IconButton
                                    size="xs"
                                    icon={<FaEdit />}
                                    onClick={() => toggleEdit(acc.unique_id)}
                                    variant="ghost"
                                    colorScheme="blue"
                                    aria-label="Edit accomplishment"
                                />
                            </Td>
                        </Tr>
                        <Tr>
                            <Td colSpan={6} p={0} borderWidth={0}>
                                <Collapse in={expandedRows.has(acc.unique_id)} animateOpacity>
                                    <Box p={4} bg="blue.50" borderBottomWidth="1px">
                                        {editingRows.has(acc.unique_id) ? (
                                            <AccomplishmentEditForm
                                                accomplishment={acc}
                                                onClose={() => toggleEdit(acc.unique_id)}
                                                onSuccess={() => {
                                                    toggleEdit(acc.unique_id);
                                                    onUpdate(acc.workingGroup);
                                                }}
                                            />
                                        ) : (
                                            <VStack align="stretch" spacing={2}>
                                                <Box>
                                                    <Text fontWeight="bold" fontSize="sm" mb={1}>Description:</Text>
                                                    <Text fontSize="sm">{acc.description}</Text>
                                                </Box>
                                                {acc.yse_identifiers && acc.yse_identifiers.length > 0 && (
                                                    <Box>
                                                        <Text fontWeight="bold" fontSize="sm" mb={1}>
                                                            Advances Year Success Evidence ({acc.yse_identifiers.length}):
                                                        </Text>
                                                        <VStack align="stretch" spacing={1}>
                                                            {acc.yse_identifiers.map(identifier => {
                                                                const description = acc.yse_descriptions?.find(
                                                                    d => d.identifier === identifier
                                                                )?.description;
                                                                return (
                                                                    <HStack key={identifier} spacing={2}>
                                                                        <Badge colorScheme="purple" fontSize="xs">
                                                                            {identifier}
                                                                        </Badge>
                                                                        {description && (
                                                                            <Text fontSize="xs" color="gray.600">
                                                                                {description}
                                                                            </Text>
                                                                        )}
                                                                    </HStack>
                                                                );
                                                            })}
                                                        </VStack>
                                                    </Box>
                                                )}
                                            </VStack>
                                        )}
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

export default AccomplishmentsTable;