import React, { useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Button,
    Divider,
    Heading,
    HStack,
    Link,
    Spacer,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import SchemaElementKindBadge from './SchemaElementKindBadge';
import SchemaElementForm from './SchemaElementForm';
import { deleteSchemaElement } from '../../../services/api/delete';
import { useDescriptors } from '../../../hooks/useDescriptors';

// Parse a SchemaElement handle into the descriptor coordinates it points at.
function parseHandle(item) {
    const h = item?.handle || '';
    if (item?.element_kind === 'node_label') return { label: h.replace(/^label:/, '') };
    if (item?.element_kind === 'field') {
        const rest = h.replace(/^field:/, '');
        const dot = rest.indexOf('.');
        if (dot === -1) return {};
        return { label: rest.slice(0, dot), field: rest.slice(dot + 1) };
    }
    return {};  // rel_type has no descriptor type in Phase 1
}

/**
 * Right-column detail for a SchemaElement. Header + descriptor PROSE (resolved from the
 * descriptor context by the element's handle, NOT stored on the element) + a read-only
 * "Shaped by" backref listing the Principles that shape it (each linking to its URL).
 *
 * Props: item, onAfterEdit(item), onAfterDelete(item), placeholder
 */
function SchemaElementDetailPanel({ item, onAfterEdit, onAfterDelete, placeholder }) {
    const editDisclosure = useDisclosure();
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();
    const { campus } = useParams();
    const { describeNodeType, describeField } = useDescriptors();

    if (!item) {
        return (
            placeholder || (
                <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                    <Text color="gray.500" fontSize="sm">
                        Select a schema element on the left, or click <strong>Add Schema Element</strong> to create one.
                    </Text>
                </Box>
            )
        );
    }

    const parsed = parseHandle(item);
    const descriptor = parsed.field
        ? describeField(parsed.label, parsed.field)
        : (parsed.label ? describeNodeType(parsed.label) : null);

    const handleDelete = async () => {
        if (!window.confirm(`Delete schema element "${item.handle}"? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await deleteSchemaElement(item.handle);
            toast({ title: 'Deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterDelete) onAfterDelete(item);
        } catch (error) {
            toast({ title: 'Delete failed.', description: error?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    const shapedBy = item.shaped_by || [];

    return (
        <VStack align="stretch" spacing={4}>
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <SchemaElementKindBadge kind={item.element_kind} />
                        <Heading as="h2" size="md" color="gray.800">{item.name || item.handle}</Heading>
                        <Text fontSize="xs" color="gray.400" fontFamily="mono">{item.handle}</Text>
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                {/* Meaning comes from the ontology descriptions layer, resolved by handle. */}
                <Box>
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" mb={1}>Meaning</Text>
                    {descriptor ? (
                        <>
                            {descriptor.description_short && (
                                <Text fontSize="sm" color="gray.800" mb={descriptor.description_full ? 2 : 0}>{descriptor.description_short}</Text>
                            )}
                            {descriptor.description_full && (
                                <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap">{descriptor.description_full}</Text>
                            )}
                        </>
                    ) : (
                        <Text fontSize="sm" color="gray.400" fontStyle="italic">
                            No description yet. Add one in Settings → Ontology Descriptions for this element.
                        </Text>
                    )}
                </Box>
            </Box>

            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>Shaped by</Heading>
                {shapedBy.length === 0 ? (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">No principles shape this element yet.</Text>
                ) : (
                    <VStack align="stretch" spacing={1}>
                        {shapedBy.map((p) => (
                            <Link
                                key={p.handle}
                                as={RouterLink}
                                to={`/${campus}/ati-explorer/principles/${encodeURIComponent(p.handle)}`}
                                fontSize="sm"
                                color="teal.600"
                            >
                                {p.name || p.handle}
                            </Link>
                        ))}
                    </VStack>
                )}
                {/* Phase 2: a "Concerned by" section listing Determinations will go here. */}
            </Box>

            <SchemaElementForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                existingItem={item}
                onSaved={(updated) => { if (onAfterEdit) onAfterEdit(updated || item); }}
            />
        </VStack>
    );
}

export default SchemaElementDetailPanel;
