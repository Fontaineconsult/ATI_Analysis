import React, { useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Heading,
    HStack,
    IconButton,
    Tag,
    Text,
    VStack,
    Wrap,
    WrapItem,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { DIRECTION_META } from './ontologyConfig';
import EditDescriptor from '../../dashboard_components/settings_components/EditDescriptor';

// --- canon primitives (design-sense §3.3) -------------------------------------------------
const Card = ({ title, children, ...rest }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg"
         boxShadow="sm" p={5} {...rest}>
        {title && <Heading as="h3" size="sm" color="teal.700" mb={3}>{title}</Heading>}
        {children}
    </Box>
);

const Section = ({ title, count, children }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={3}>
        <HStack justify="space-between" mb={2}>
            <Heading as="h4" size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide">
                {title}
            </Heading>
            {count != null && <Text fontSize="xs" color="gray.500">{count}</Text>}
        </HStack>
        {children}
    </Box>
);

// A tiny pencil that opens the descriptor editor for an element. Tinted red when the element
// has no description yet (design-sense §1.1 — surface the gap).
const EditDot = ({ described, label, onClick }) => (
    <IconButton
        aria-label={`${described ? 'Edit' : 'Add'} description for ${label}`}
        title={described ? 'Edit description' : 'Add description'}
        icon={<EditIcon />}
        size="xs"
        variant="ghost"
        colorScheme={described ? 'teal' : 'red'}
        onClick={onClick}
    />
);

const ShapedByTags = ({ shapedBy }) => {
    if (!shapedBy || shapedBy.length === 0) return null;
    return (
        <Wrap mt={2} spacing={1}>
            {shapedBy.map((p) => (
                <WrapItem key={p.handle}>
                    <Tag size="sm" colorScheme="purple" variant="subtle">{p.name}</Tag>
                </WrapItem>
            ))}
        </Wrap>
    );
};

const FlagBadges = ({ field }) => (
    <HStack spacing={1}>
        {field.required && <Badge fontSize="2xs" colorScheme="red" variant="subtle">required</Badge>}
        {field.unique && <Badge fontSize="2xs" colorScheme="blue" variant="subtle">unique</Badge>}
        {field.indexed && !field.unique && <Badge fontSize="2xs" colorScheme="gray" variant="subtle">indexed</Badge>}
    </HStack>
);

function FieldRow({ field, onEditField, onEditChoice }) {
    const d = field.descriptor;
    return (
        <Box py={2} borderBottomWidth="1px" borderBottomColor="gray.100">
            <HStack justify="space-between" align="center" spacing={2}>
                <HStack spacing={2} minW="0">
                    <Text fontSize="sm" fontFamily="mono" color="gray.800">{field.name}</Text>
                    <Badge fontSize="2xs" colorScheme="gray" variant="outline">{field.type}</Badge>
                </HStack>
                <HStack spacing={1}>
                    <FlagBadges field={field} />
                    <EditDot described={!!d} label={field.name} onClick={() => onEditField(field)} />
                </HStack>
            </HStack>
            {d?.description_short && (
                <Text fontSize="xs" color="gray.600" mt={1}>{d.description_short}</Text>
            )}
            {field.choices && field.choices.length > 0 && (
                <Wrap mt={1.5} spacing={1}>
                    {field.choices.map((c) => (
                        <WrapItem key={c.value}>
                            <Tag size="sm" variant="subtle" cursor="pointer"
                                 colorScheme={c.descriptor ? 'blue' : 'gray'}
                                 onClick={() => onEditChoice(field, c)}
                                 title={c.descriptor?.description_short || `${c.label} — click to describe`}>
                                {c.label}
                            </Tag>
                        </WrapItem>
                    ))}
                </Wrap>
            )}
        </Box>
    );
}

function RelationshipRow({ rel, onEditRel }) {
    const dir = DIRECTION_META[rel.direction] || DIRECTION_META.to;
    const d = rel.descriptor;
    return (
        <Box py={2} borderBottomWidth="1px" borderBottomColor="gray.100">
            <HStack justify="space-between" align="center" spacing={2}>
                <HStack spacing={2} minW="0" flexWrap="wrap">
                    <Text fontSize="sm" fontFamily="mono" color="gray.800">{rel.name}</Text>
                    <Badge fontSize="2xs" colorScheme="orange" variant="subtle">{rel.rel_type}</Badge>
                    <Text fontSize="xs" color="gray.500">{dir.symbol} {rel.target || '—'}</Text>
                    {rel.model && <Badge fontSize="2xs" colorScheme="purple" variant="outline">{rel.model}</Badge>}
                </HStack>
                <EditDot described={!!d} label={rel.rel_type} onClick={() => onEditRel(rel)} />
            </HStack>
            {d?.description_short && (
                <Text fontSize="xs" color="gray.600" mt={1}>{d.description_short}</Text>
            )}
        </Box>
    );
}

/**
 * Detail panel for one ontology node type — identity Card + Fields + Relationships
 * (design-sense §3.1/§3.3). Editing happens here, in context: every element (node type,
 * field, field value, relationship type) opens the shared EditDescriptor modal pre-scoped
 * to that element. `onChanged` refreshes the browser after a save/delete.
 */
function OntologyDetailPanel({ nodeType, onChanged }) {
    const [showFull, setShowFull] = useState(false);
    const [editing, setEditing] = useState(null);  // {descriptorData} | {presetTarget} | null

    if (!nodeType) {
        return (
            <Box borderWidth="2px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg"
                 bg="gray.50" p={10} textAlign="center">
                <Text color="gray.500">Select a node type to view its fields, relationships, and descriptions.</Text>
            </Box>
        );
    }

    const d = nodeType.descriptor;

    // Open the editor for an element: edit its existing descriptor, or create one pre-scoped
    // to (kind, target) when it has none yet.
    const openEditor = (element, descriptor_kind, targets) => {
        if (element?.descriptor) setEditing({ descriptorData: element.descriptor });
        else setEditing({ presetTarget: { descriptor_kind, ...targets } });
    };

    const editNodeType = () => openEditor(nodeType, 'node_type', { target_label: nodeType.label });
    const editField = (field) => openEditor(field, 'field', { target_label: nodeType.label, target_field: field.name });
    const editChoice = (field, choice) => openEditor(choice, 'field_value', { target_field: field.name, target_value: choice.value });
    const editRel = (rel) => openEditor(rel, 'rel_type', { target_field: rel.rel_type });

    return (
        <VStack align="stretch" spacing={4}>
            <Card>
                <HStack justify="space-between" align="start">
                    <Box minW="0">
                        <Heading as="h3" size="md" color="gray.800">{nodeType.label}</Heading>
                        <Text fontSize="xs" fontFamily="mono" color="gray.400">{nodeType.handle}</Text>
                    </Box>
                    <HStack spacing={2}>
                        {!d && <Badge colorScheme="red" variant="subtle">no description</Badge>}
                        <Button size="xs" variant="ghost" colorScheme="teal" leftIcon={<EditIcon />} onClick={editNodeType}>
                            {d ? 'Edit' : 'Describe'}
                        </Button>
                    </HStack>
                </HStack>

                {d?.description_short ? (
                    <Text fontSize="sm" color="gray.700" mt={3}>{d.description_short}</Text>
                ) : (
                    nodeType.summary && <Text fontSize="sm" color="gray.600" mt={3} fontStyle="italic">{nodeType.summary}</Text>
                )}

                {d?.description_full && (
                    <>
                        {showFull && <Text fontSize="sm" color="gray.700" mt={2} whiteSpace="pre-wrap">{d.description_full}</Text>}
                        <Button size="xs" variant="ghost" colorScheme="teal" mt={1} onClick={() => setShowFull((s) => !s)}>
                            {showFull ? 'Hide rationale' : 'Show full rationale'}
                        </Button>
                    </>
                )}

                <ShapedByTags shapedBy={nodeType.shaped_by} />
            </Card>

            <Section title="Fields" count={nodeType.fields.length}>
                {nodeType.fields.length === 0
                    ? <Text fontSize="sm" color="gray.500" fontStyle="italic">No fields.</Text>
                    : nodeType.fields.map((f) => (
                        <FieldRow key={f.name} field={f} onEditField={editField} onEditChoice={editChoice} />
                    ))}
            </Section>

            <Section title="Relationships" count={nodeType.relationships.length}>
                {nodeType.relationships.length === 0
                    ? <Text fontSize="sm" color="gray.500" fontStyle="italic">No relationships.</Text>
                    : nodeType.relationships.map((r) => (
                        <RelationshipRow key={r.name} rel={r} onEditRel={editRel} />
                    ))}
            </Section>

            <EditDescriptor
                isOpen={!!editing}
                onClose={() => setEditing(null)}
                descriptorData={editing?.descriptorData}
                presetTarget={editing?.presetTarget}
                onSave={() => { if (onChanged) onChanged(); }}
            />
        </VStack>
    );
}

export default OntologyDetailPanel;
