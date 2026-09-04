import React, { useCallback, useState } from 'react';
import {
    Badge, Box, Button, Flex, HStack, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, VStack, useDisclosure, useToast,
} from '@chakra-ui/react';

import { fetchMinutesPanelForPlan } from '../../../services/api/get';
import useResource from '../../../hooks/useResource';
import useInvalidateResources from '../../../hooks/useInvalidateResources';
import { KEYS, NS } from '../../../context/resourceKeys';
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
                    {/* Same badge line as the list row: ingest state, communities, participants. */}
                    <Flex mt={2} gap={1.5} wrap="wrap" align="center">
                        {minutes.ontology_ingested ? (
                            <Badge colorScheme="teal" variant="subtle" fontSize="2xs">ingested</Badge>
                        ) : (
                            <Badge
                                colorScheme="orange"
                                variant="subtle"
                                fontSize="2xs"
                                title="Not yet processed by the ontology-ingest skill — untapped source material"
                            >
                                not ingested
                            </Badge>
                        )}
                        {(minutes.pertains_to_communities || []).map((c) => (
                            <Badge key={c.unique_id} colorScheme="purple" variant="subtle" fontSize="2xs" textTransform="none">
                                {c.name}
                            </Badge>
                        ))}
                        {(minutes.participants || []).map((p) => (
                            <Badge key={p.unique_id} colorScheme="gray" variant="subtle" fontSize="2xs" textTransform="none">
                                {p.name}
                            </Badge>
                        ))}
                    </Flex>
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
    const formDisc = useDisclosure();
    const [editing, setEditing] = useState(null);
    const [openId, setOpenId] = useState(null);

    // Both this and the standalone MeetingMinutesPanel read the same key, so whichever
    // you open second costs nothing, and a write in either refreshes both.
    const {
        data: panelResp, loading, error, reload: reloadPanel,
    } = useResource(
        workingGroupPlanIdentifier ? KEYS.minutesForPlan(workingGroupPlanIdentifier) : null,
        () => fetchMinutesPanelForPlan(workingGroupPlanIdentifier),
    );
    const panel = panelResp?.data || null;

    const { invalidateNamespace } = useInvalidateResources();
    const load = useCallback(async () => {
        invalidateNamespace(NS.minutes);
        await reloadPanel();
    }, [invalidateNamespace, reloadPanel]);

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
                // Capped height, then scroll — long meeting histories stay inside the card.
                <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto" pr={1}>
                    {minutes.map((m) => {
                        const n = attachCount(m);
                        const participants = m.participants || [];
                        const communities = m.pertains_to_communities || [];
                        return (
                            <Box
                                key={m.unique_id}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                bg="gray.50"
                                px={2.5}
                                py={2}
                                textAlign="left"
                                cursor="pointer"
                                _hover={{ bg: 'gray.100' }}
                                _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '-2px' }}
                                onClick={() => setOpenId(m.unique_id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(m.unique_id); }
                                }}
                                role="button"
                                tabIndex={0}
                                aria-label={`Open meeting minutes: ${m.title}`}
                            >
                                <HStack spacing={2.5} align="start">
                                    <Text fontSize="sm" fontWeight="medium" color="gray.800" flex="1" minW={0} noOfLines={1}>
                                        {m.title}
                                    </Text>
                                    <Text fontSize="2xs" color="gray.600">▸</Text>
                                </HStack>
                                <Flex mt={1} gap={1.5} wrap="wrap" align="center">
                                    {m.meeting_date && (
                                        <Text fontFamily="mono" fontSize="2xs" color="gray.600" whiteSpace="nowrap">{m.meeting_date}</Text>
                                    )}
                                    {n > 0 && <Text fontSize="2xs" color="teal.600" whiteSpace="nowrap">{n} att</Text>}
                                    {m.ontology_ingested ? (
                                        <Badge colorScheme="teal" variant="subtle" fontSize="2xs">ingested</Badge>
                                    ) : (
                                        <Badge
                                            colorScheme="orange"
                                            variant="subtle"
                                            fontSize="2xs"
                                            title="Not yet processed by the ontology-ingest skill — untapped source material"
                                        >
                                            not ingested
                                        </Badge>
                                    )}
                                    {communities.map((c) => (
                                        <Badge key={c.unique_id} colorScheme="purple" variant="subtle" fontSize="2xs" textTransform="none">
                                            {c.name}
                                        </Badge>
                                    ))}
                                    {participants.map((p) => (
                                        <Badge key={p.unique_id} colorScheme="gray" variant="subtle" fontSize="2xs" textTransform="none">
                                            {p.name}
                                        </Badge>
                                    ))}
                                </Flex>
                            </Box>
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
