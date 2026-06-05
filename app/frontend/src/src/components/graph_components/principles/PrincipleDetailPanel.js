import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Collapse,
    Divider,
    Heading,
    HStack,
    Spacer,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import PrincipleSourceBadge from './PrincipleSourceBadge';
import PrincipleGroundingTags from './PrincipleGroundingTags';
import PrincipleForm from './PrincipleForm';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import GovernanceTypeBadge from '../governance/GovernanceTypeBadge';
import { getGovernanceTypeLabel } from '../governance/governanceTypes';
import { deletePrinciple } from '../../../services/api/delete';
import { fetchAllGovernance } from '../../../services/api/get';
import {
    attachGovernanceToPrinciple,
    detachGovernanceFromPrinciple,
    attachSourceToPrinciple,
    detachSourceFromPrinciple,
    attachShapeToPrinciple,
    detachShapeFromPrinciple,
} from '../../../services/api/put';
import { useMetaScaffold } from '../../../hooks/useMetaScaffold';
import { useDescriptors } from '../../../hooks/useDescriptors';

/**
 * Right-column detail for a Principle. Shows the stored statement (short + expandable full),
 * then THREE relationship blocks via EntityAttachmentSelector:
 *   - Grounded in — Governance      (derives_from; DOWN to mandate)
 *   - Grounded in — Intellectual Sources (derives_from; DOWN to theory)
 *   - Shapes — Schema Elements      (across-link to the schema)
 * (Grounding is split into two blocks because Governance and IntellectualSource attach with
 * different payloads — the brief's single "Grounded in" concept, realized with two selectors.)
 *
 * Props: item, onAfterEdit(item), onAfterDelete(item), placeholder
 */
function PrincipleDetailPanel({ item, onAfterEdit, onAfterDelete, placeholder }) {
    const editDisclosure = useDisclosure();
    const fullDisclosure = useDisclosure();
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();
    const { intellectualSources } = useMetaScaffold();
    const { descriptors } = useDescriptors();

    // Governance candidates aren't in the meta-scaffold context; fetch once and cache.
    const [governanceItems, setGovernanceItems] = useState([]);
    useEffect(() => {
        let active = true;
        fetchAllGovernance()
            .then((resp) => { if (active) setGovernanceItems(resp?.data?.items || []); })
            .catch(() => { /* leave empty; selector just shows no candidates */ });
        return () => { active = false; };
    }, []);

    const refresh = useCallback(async () => {
        if (onAfterEdit) await onAfterEdit(item);
    }, [onAfterEdit, item]);

    // unique_id -> governance type, from both candidates and currently-attached, so detach knows
    // the type to send.
    const govTypeByUid = useMemo(() => {
        const m = {};
        for (const g of governanceItems) m[g.unique_id] = g.type;
        for (const g of (item?.grounded_in?.governance || [])) if (g.unique_id) m[g.unique_id] = g.type;
        return m;
    }, [governanceItems, item]);

    if (!item) {
        return (
            placeholder || (
                <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                    <Text color="gray.500" fontSize="sm">
                        Select a principle on the left, or click <strong>Add Principle</strong> to create one.
                    </Text>
                </Box>
            )
        );
    }

    const handleDelete = async () => {
        if (!window.confirm(`Delete principle "${item.handle}"? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await deletePrinciple(item.handle);
            toast({ title: 'Deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterDelete) onAfterDelete(item);
        } catch (error) {
            toast({ title: 'Delete failed.', description: error?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    const grounded = item.grounded_in || { governance: [], intellectual_sources: [] };

    return (
        <VStack align="stretch" spacing={4}>
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <HStack spacing={1} flexWrap="wrap">
                            <PrincipleSourceBadge principle={item} />
                            <PrincipleGroundingTags principle={item} />
                        </HStack>
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

                {item.description_short ? (
                    <Text fontSize="sm" color="gray.800">{item.description_short}</Text>
                ) : (
                    <Text fontSize="sm" color="gray.400" fontStyle="italic">No short statement set.</Text>
                )}

                {item.description_full && (
                    <Box mt={2}>
                        <Button size="xs" variant="link" colorScheme="teal" onClick={fullDisclosure.onToggle}>
                            {fullDisclosure.isOpen ? 'Hide full rationale' : 'Full rationale'}
                        </Button>
                        <Collapse in={fullDisclosure.isOpen} animateOpacity>
                            <Text fontSize="sm" color="gray.600" whiteSpace="pre-wrap" mt={2}>{item.description_full}</Text>
                        </Collapse>
                    </Box>
                )}
            </Box>

            {/* DOWN — grounding in governance */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>Grounded in — Governance</Heading>
                <EntityAttachmentSelector
                    entityLabel="Governance"
                    placeholder="Select a law / policy / directive…"
                    attached={(grounded.governance || []).map((g) => ({
                        unique_id: g.unique_id,
                        label: g.title || '(untitled)',
                        badge: <GovernanceTypeBadge type={g.type} size="sm" />,
                    }))}
                    candidates={governanceItems.map((g) => ({
                        unique_id: g.unique_id,
                        // dropdown <option> can't hold a badge, so name it "<Type> — <Title>"
                        label: `${getGovernanceTypeLabel(g.type)} — ${g.title || '(untitled)'}`,
                    }))}
                    onAttach={(uid) => attachGovernanceToPrinciple(item.handle, govTypeByUid[uid], uid)}
                    onDetach={(uid) => detachGovernanceFromPrinciple(item.handle, govTypeByUid[uid], uid)}
                    afterChange={refresh}
                    emptyLabel="Not grounded in any governance yet."
                />
            </Box>

            {/* DOWN — grounding in intellectual sources */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>Grounded in — Intellectual Sources</Heading>
                <EntityAttachmentSelector
                    entityLabel="Source"
                    placeholder="Select a theory / source…"
                    attached={(grounded.intellectual_sources || []).map((s) => ({ unique_id: s.unique_id, label: s.name || '(untitled)' }))}
                    candidates={intellectualSources.map((s) => ({ unique_id: s.unique_id, label: s.name || '(untitled)' }))}
                    onAttach={(uid) => attachSourceToPrinciple(item.handle, uid)}
                    onDetach={(uid) => detachSourceFromPrinciple(item.handle, uid)}
                    afterChange={refresh}
                    emptyLabel="Not grounded in any intellectual source yet."
                />
            </Box>

            {/* ACROSS — shapes ontology elements (descriptors). The descriptor IS the anchor:
                the same UniversalDescriptor that holds an element's prose is what a principle
                points at. Candidates are the full descriptor catalog. */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                <Heading as="h3" size="sm" color="teal.700" mb={3}>Shapes — Ontology Elements</Heading>
                <EntityAttachmentSelector
                    entityLabel="Ontology element"
                    placeholder="Select an ontology element (descriptor)…"
                    attached={(item.shapes || []).map((d) => ({ unique_id: d.descriptor_handle, label: d.title || d.descriptor_handle }))}
                    candidates={descriptors.map((d) => ({ unique_id: d.descriptor_handle, label: d.title || d.descriptor_handle }))}
                    onAttach={(handle) => attachShapeToPrinciple(item.handle, handle)}
                    onDetach={(handle) => detachShapeFromPrinciple(item.handle, handle)}
                    afterChange={refresh}
                    emptyLabel="Shapes no ontology elements yet."
                />
            </Box>

            <PrincipleForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                existingItem={item}
                onSaved={(updated) => { if (onAfterEdit) onAfterEdit(updated || item); }}
            />
        </VStack>
    );
}

export default PrincipleDetailPanel;
