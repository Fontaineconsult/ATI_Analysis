import React, { useCallback, useEffect, useState } from 'react';
import {
    Badge, Box, Button, HStack, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, VStack, useDisclosure, useToast,
} from '@chakra-ui/react';

import { useSettings } from '../../../context/SettingsContext';
import { fetchQueryPanelForPlan } from '../../../services/api/get';
import { deleteQuery } from '../../../services/api/delete';
import { getStatusMeta, getCategoryMeta } from '../query_components/queriesConfig';
import QueryForm from '../query_components/QueryForm';
import QueryDetail from '../query_components/QueryDetail';

function StatusBadge({ status, vocab }) {
    const meta = getStatusMeta(status);
    return <Badge colorScheme={meta.colorScheme} fontSize="2xs">{vocab?.query_statuses?.[status] || meta.label}</Badge>;
}
function CategoryBadge({ category, vocab }) {
    if (!category) return null;
    const meta = getCategoryMeta(category);
    return <Badge colorScheme={meta.colorScheme} variant="subtle" fontSize="2xs">{vocab?.query_categories?.[category] || meta.label}</Badge>;
}

/** Read/settle modal for one query — wraps the existing QueryDetail body. */
function QueryModal({ query, candidateEvidence, vocab, accentColor, workingGroupName, onChanged, onEdit, onClose }) {
    const toast = useToast();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Delete this question? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteQuery(query.unique_id);
            toast({ title: 'Question deleted', status: 'success', duration: 2000, isClosable: true });
            if (onChanged) await onChanged();
            onClose();
        } catch (err) {
            toast({ title: 'Delete failed', description: err?.message, status: 'error', duration: 4000, isClosable: true });
            setDeleting(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={2}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800" lineHeight="1.4">{query.question}</Text>
                    <HStack spacing={2} mt={2} flexWrap="wrap">
                        <CategoryBadge category={query.category} vocab={vocab} />
                        <StatusBadge status={query.status} vocab={vocab} />
                        <Text fontSize="xs" color="gray.600">
                            raised by {query.raised_by?.name || '—'}{query.date_raised ? ` · ${query.date_raised}` : ''}
                        </Text>
                        <Box w="9px" h="9px" borderRadius="full" bg={accentColor} />
                        <Text fontSize="xs" color="gray.600">{workingGroupName}</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <QueryDetail query={query} candidateEvidence={candidateEvidence} onChanged={onChanged} />
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="outline" colorScheme="teal" onClick={() => onEdit(query)}>Edit</Button>
                    <Button size="sm" variant="ghost" colorScheme="red" ml={2} onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    <Box flex="1" />
                    <Button size="sm" colorScheme="teal" onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

/**
 * Compact Queries footer for a working-group card (design handoff v2 §5). Self-loads
 * via fetchQueryPanelForPlan; rows open a read/settle modal; "+ New" opens the create form.
 */
export default function WgQueriesSection({ workingGroupPlanIdentifier, workingGroupName, accentColor }) {
    const { vocab } = useSettings();
    const [panel, setPanel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const formDisc = useDisclosure();
    const [editing, setEditing] = useState(null);
    const [openId, setOpenId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await fetchQueryPanelForPlan(workingGroupPlanIdentifier);
            setPanel(resp.data);
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load queries');
        } finally {
            setLoading(false);
        }
    }, [workingGroupPlanIdentifier]);

    useEffect(() => { load(); }, [load]);

    const queries = panel?.queries || [];
    const candidateEvidence = panel?.candidate_evidence || [];
    const planExists = panel?.exists !== false;
    const openQuery = queries.find((q) => q.unique_id === openId) || null;

    const openCreate = () => { setEditing(null); formDisc.onOpen(); };
    const openEdit = (q) => { setOpenId(null); setEditing(q); formDisc.onOpen(); };

    return (
        <Box flex="1" minW={0}>
            <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="teal.600" letterSpacing="wide">
                    Queries{queries.length ? ` (${queries.length})` : ''}
                </Text>
                <Button size="xs" variant="outline" colorScheme="teal" onClick={openCreate} isDisabled={!planExists || loading}>
                    + New
                </Button>
            </HStack>

            {loading ? (
                <HStack color="gray.600" fontSize="sm"><Spinner size="sm" /><Text>Loading…</Text></HStack>
            ) : error ? (
                <Text fontSize="sm" color="red.500">{error}</Text>
            ) : queries.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">No questions yet.</Text>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {queries.map((q) => (
                        <Box
                            key={q.unique_id}
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderLeftWidth="3px"
                            borderLeftColor={q.status === 'settled' ? 'green.400' : 'teal.200'}
                            borderRadius="md"
                            bg="white"
                            px={2.5}
                            py={2}
                            cursor="pointer"
                            _hover={{ bg: 'gray.50' }}
                            onClick={() => setOpenId(q.unique_id)}
                            role="button"
                        >
                            <Text fontSize="sm" color="gray.800" lineHeight="1.45" noOfLines={2}>{q.question}</Text>
                            <HStack spacing={2} mt={1.5} flexWrap="wrap">
                                <CategoryBadge category={q.category} vocab={vocab} />
                                <StatusBadge status={q.status} vocab={vocab} />
                                <Text fontSize="2xs" color="gray.600">
                                    {q.raised_by?.name || '—'}{q.date_raised ? ` · ${q.date_raised}` : ''}
                                </Text>
                            </HStack>
                        </Box>
                    ))}
                </VStack>
            )}

            {openQuery && (
                <QueryModal
                    query={openQuery}
                    candidateEvidence={candidateEvidence}
                    vocab={vocab}
                    accentColor={accentColor}
                    workingGroupName={workingGroupName}
                    onChanged={load}
                    onEdit={openEdit}
                    onClose={() => setOpenId(null)}
                />
            )}

            {formDisc.isOpen && (
                <QueryForm
                    isOpen={formDisc.isOpen}
                    onClose={formDisc.onClose}
                    mode={editing ? 'edit' : 'create'}
                    initial={editing}
                    workingGroupPlanIdentifier={workingGroupPlanIdentifier}
                    onSaved={load}
                />
            )}
        </Box>
    );
}
