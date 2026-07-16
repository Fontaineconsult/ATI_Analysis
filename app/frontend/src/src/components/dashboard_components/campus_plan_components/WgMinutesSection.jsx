import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Button, HStack, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, VStack, useDisclosure, useToast,
} from '@chakra-ui/react';

import { fetchMinutesPanelForPlan } from '../../../services/api/get';
import { deleteMeetingMinutes } from '../../../services/api/delete';
import MeetingMinutesForm from '../meeting_minutes_components/MeetingMinutesForm';
import MeetingMinutesDetail from '../meeting_minutes_components/MeetingMinutesDetail';

function attachCount(m) {
    return (m.documents || []).length + (m.webpages || []).length;
}

/** Read modal for one minutes record — wraps the existing MeetingMinutesDetail body. */
function MinutesModal({ minutes, accentColor, workingGroupName, onChanged, onEdit, onClose }) {
    const toast = useToast();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!window.confirm('Delete these minutes? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteMeetingMinutes(minutes.unique_id);
            toast({ title: 'Minutes deleted', status: 'success', duration: 2000, isClosable: true });
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
                    <Text fontSize="md" fontWeight="bold" color="gray.800" lineHeight="1.35">{minutes.title}</Text>
                    <HStack spacing={2.5} mt={2} flexWrap="wrap">
                        {minutes.meeting_date && (
                            <Text fontFamily="mono" fontSize="xs" color="gray.600">{minutes.meeting_date}</Text>
                        )}
                        {minutes.recorded_by && (
                            <Text fontSize="xs" color="gray.600">recorded by {minutes.recorded_by.name}</Text>
                        )}
                        <Box w="9px" h="9px" borderRadius="full" bg={accentColor} />
                        <Text fontSize="xs" color="gray.600">{workingGroupName}</Text>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <MeetingMinutesDetail minutes={minutes} onChanged={onChanged} />
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="outline" colorScheme="teal" onClick={() => onEdit(minutes)}>Edit</Button>
                    <Button size="sm" variant="ghost" colorScheme="red" ml={2} onClick={handleDelete} isLoading={deleting}>Delete</Button>
                    <Box flex="1" />
                    <Button size="sm" colorScheme="teal" onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

/**
 * Compact Meeting Minutes footer for a working-group card (design handoff v2 §5).
 * Self-loads via fetchMinutesPanelForPlan; rows open a read modal; "+ Add minutes"
 * opens the create form.
 */
export default function WgMinutesSection({ workingGroupPlanIdentifier, workingGroupName, accentColor }) {
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
            const resp = await fetchMinutesPanelForPlan(workingGroupPlanIdentifier);
            setPanel(resp.data);
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || 'Failed to load meeting minutes');
        } finally {
            setLoading(false);
        }
    }, [workingGroupPlanIdentifier]);

    useEffect(() => { load(); }, [load]);

    const minutes = panel?.minutes || [];
    const planExists = panel?.exists !== false;
    const openMinutes = minutes.find((m) => m.unique_id === openId) || null;

    const openCreate = () => { setEditing(null); formDisc.onOpen(); };
    const openEdit = (m) => { setOpenId(null); setEditing(m); formDisc.onOpen(); };

    return (
        <Box flex="1" minW={0}>
            <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="teal.600" letterSpacing="wide">
                    Meeting Minutes{minutes.length ? ` (${minutes.length})` : ''}
                </Text>
                <Button size="xs" variant="outline" colorScheme="teal" onClick={openCreate} isDisabled={!planExists || loading}>
                    + Add minutes
                </Button>
            </HStack>

            {loading ? (
                <HStack color="gray.600" fontSize="sm"><Spinner size="sm" /><Text>Loading…</Text></HStack>
            ) : error ? (
                <Text fontSize="sm" color="red.500">{error}</Text>
            ) : minutes.length === 0 ? (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">No meeting minutes yet.</Text>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {minutes.map((m) => {
                        const n = attachCount(m);
                        return (
                            <HStack
                                key={m.unique_id}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                bg="white"
                                px={2.5}
                                py={2}
                                spacing={2.5}
                                cursor="pointer"
                                _hover={{ bg: 'gray.50' }}
                                onClick={() => setOpenId(m.unique_id)}
                                role="button"
                            >
                                <Text fontSize="sm" fontWeight="medium" color="gray.800" flex="1" minW={0} noOfLines={1}>
                                    {m.title}
                                </Text>
                                {m.meeting_date && (
                                    <Text fontFamily="mono" fontSize="2xs" color="gray.600" whiteSpace="nowrap">{m.meeting_date}</Text>
                                )}
                                {n > 0 && <Text fontSize="2xs" color="teal.600" whiteSpace="nowrap">{n} att</Text>}
                                <Text fontSize="2xs" color="gray.600">▸</Text>
                            </HStack>
                        );
                    })}
                </VStack>
            )}

            {openMinutes && (
                <MinutesModal
                    minutes={openMinutes}
                    accentColor={accentColor}
                    workingGroupName={workingGroupName}
                    onChanged={load}
                    onEdit={openEdit}
                    onClose={() => setOpenId(null)}
                />
            )}

            {formDisc.isOpen && (
                <MeetingMinutesForm
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
