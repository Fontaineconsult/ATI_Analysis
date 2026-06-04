import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Divider,
    Heading,
    HStack,
    Spacer,
    Spinner,
    Text,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { fetchComponentDetail } from '../../../services/api/get';
import {
    assignGuidelineToComponent,
    unassignGuidelineFromComponent,
    assignParentInterfaceToComponent,
    unassignParentInterfaceFromComponent,
} from '../../../services/api/put';
import { deleteComponent } from '../../../services/api/delete';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import { ComponentKindBadge } from './ComponentBadges';
import ComponentForm from './ComponentForm';

const Card = ({ title, children, ...rest }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5} {...rest}>
        {title && <Heading as="h3" size="sm" color="teal.700" mb={3}>{title}</Heading>}
        {children}
    </Box>
);

function Field({ label, value }) {
    return (
        <Box>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold">{label}</Text>
            {value
                ? <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap">{String(value)}</Text>
                : <Text fontSize="sm" color="gray.400" fontStyle="italic">Not set</Text>}
        </Box>
    );
}

/**
 * Right-column component detail. Fetches full detail by component_identifier (the list
 * carries only summaries), then renders stacked cards: identity (+ kind badge), parent
 * interface (part_of — editable), and the WCAG guidelines it must satisfy (editable).
 *
 * Props:
 *   componentIdentifier         Selected component's business key, or null.
 *   interfaces                  Interface summaries, for the parent picker.
 *   guidelines                  [{unique_id, title}] governance guidelines, for must_satisfy.
 *   onAfterMutate(deletedId?)   Parent refresh hook; called with the id on delete.
 *   onGoToInterface(ifaceId)    Optional: jump to the Interfaces tab and select one.
 */
function ComponentDetailPanel({ componentIdentifier, interfaces = [], guidelines = [], onAfterMutate, onGoToInterface }) {
    const toast = useToast();
    const editDisclosure = useDisclosure();
    const [component, setComponent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const reload = useCallback(async () => {
        if (!componentIdentifier) { setComponent(null); return; }
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchComponentDetail(componentIdentifier);
            setComponent(resp?.data || null);
        } catch (e) {
            setError(e?.message || 'Failed to load component.');
        } finally {
            setLoading(false);
        }
    }, [componentIdentifier]);

    useEffect(() => { reload(); }, [reload]);

    const refreshAll = useCallback(async () => {
        await reload();
        if (onAfterMutate) await onAfterMutate();
    }, [reload, onAfterMutate]);

    if (!componentIdentifier) {
        return (
            <Box p={8} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="lg" bg="gray.50" textAlign="center">
                <Text color="gray.500" fontSize="sm">
                    Select a component on the left, or click <strong>Add Component</strong> to create one.
                </Text>
            </Box>
        );
    }
    if (loading) {
        return (
            <HStack p={4} color="gray.600" fontSize="sm">
                <Spinner size="sm" color="teal.500" /><Text>Loading component…</Text>
            </HStack>
        );
    }
    if (error) {
        return <Alert status="error" borderRadius="md" fontSize="sm"><AlertIcon />{error}</Alert>;
    }
    if (!component) return null;

    const handleDelete = async () => {
        if (!window.confirm('Delete this component? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteComponent(component.component_identifier);
            toast({ title: 'Component deleted.', status: 'success', duration: 2000, isClosable: true });
            if (onAfterMutate) await onAfterMutate(component.component_identifier);
        } catch (e) {
            toast({ title: 'Delete failed.', description: e?.message, status: 'error', duration: 3000, isClosable: true });
        } finally {
            setDeleting(false);
        }
    };

    const parent = component.part_of;
    const parentAttached = parent
        ? [{ unique_id: parent.interface_identifier, label: `${parent.title} (${parent.interface_identifier})` }]
        : [];
    const parentCandidates = interfaces.map((i) => ({ unique_id: i.interface_identifier, label: `${i.title} (${i.interface_identifier})` }));

    const guidelineAttached = (component.must_satisfy || []).map((g) => ({ unique_id: g.unique_id, label: g.title }));
    const guidelineCandidates = guidelines.map((g) => ({ unique_id: g.unique_id, label: g.title }));

    return (
        <VStack align="stretch" spacing={4}>
            {/* Identity */}
            <Card>
                <HStack align="start" mb={3}>
                    <VStack align="stretch" spacing={2} flex="1" minW="0">
                        <HStack spacing={2} flexWrap="wrap">
                            {component.component_kind && <ComponentKindBadge kind={component.component_kind} />}
                        </HStack>
                        <Heading as="h2" size="md" color="gray.800">{component.title || '(untitled)'}</Heading>
                        <Text fontSize="xs" color="gray.400">{component.component_identifier}</Text>
                    </VStack>
                    <Spacer />
                    <HStack>
                        <Button size="sm" variant="outline" colorScheme="teal" onClick={editDisclosure.onOpen}>Edit</Button>
                        <Button size="sm" variant="ghost" colorScheme="red" onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    </HStack>
                </HStack>

                <Divider my={3} borderColor="gray.200" />

                <VStack align="stretch" spacing={3}>
                    <Field label="Description" value={component.description} />
                </VStack>
            </Card>

            {/* Parent interface (part_of) — editable */}
            <Card title="Parent interface">
                <Text fontSize="xs" color="gray.500" mb={2}>
                    The interface this component is part of. Components are composition, not identity.
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Interface"
                    placeholder="Select an interface…"
                    attached={parentAttached}
                    candidates={parentCandidates}
                    onAttach={(id) => assignParentInterfaceToComponent(component.component_identifier, id)}
                    onDetach={(id) => unassignParentInterfaceFromComponent(component.component_identifier, id)}
                    afterChange={refreshAll}
                    emptyLabel="No parent interface (standalone)."
                />
                {onGoToInterface && parent && (
                    <Button mt={2} size="xs" variant="link" colorScheme="teal" onClick={() => onGoToInterface(parent.interface_identifier)}>
                        Open {parent.title} →
                    </Button>
                )}
            </Card>

            {/* WCAG guidelines this component must satisfy (must_satisfy) — editable */}
            <Card title="Must satisfy (WCAG)">
                <Text fontSize="xs" color="gray.500" mb={2}>
                    The WCAG guidelines this component must meet — the standard's criteria attach at this grain.
                </Text>
                <EntityAttachmentSelector
                    entityLabel="Guideline"
                    placeholder="Select a guideline…"
                    attached={guidelineAttached}
                    candidates={guidelineCandidates}
                    onAttach={(uid) => assignGuidelineToComponent(component.component_identifier, uid)}
                    onDetach={(uid) => unassignGuidelineFromComponent(component.component_identifier, uid)}
                    afterChange={refreshAll}
                    emptyLabel="No guideline linked yet."
                />
            </Card>

            <ComponentForm
                isOpen={editDisclosure.isOpen}
                onClose={editDisclosure.onClose}
                interfaces={interfaces}
                existingComponent={component}
                onSaved={async () => { await refreshAll(); }}
            />
        </VStack>
    );
}

export default ComponentDetailPanel;
