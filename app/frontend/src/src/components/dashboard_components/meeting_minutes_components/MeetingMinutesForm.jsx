import React, { useContext, useMemo, useState } from 'react';
import {
    Badge, Box, Button, FormControl, FormLabel, HStack, Input, Modal, ModalBody,
    ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Tab,
    TabList, TabPanel, TabPanels, Tabs, Text, Textarea,
    VStack, useToast,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import { fetchAllCommunities } from '../../../services/api/get';
import useResource from '../../../hooks/useResource';
import { KEYS } from '../../../context/resourceKeys';
import { createMeetingMinutes } from '../../../services/api/post';
import {
    setMinutesCommunities, setMinutesParticipants, updateMeetingMinutes,
} from '../../../services/api/put';
import Markdown from '../../graph_components/common/Markdown';
import TagMultiSelect from '../../functional_components/TagMultiSelect';

/**
 * Create / edit modal for a MeetingMinutes record. In create mode it needs the anchor:
 * `workingGroupPlanIdentifier`, or `createContext` = {campusAbbrev, academicYear, workingGroup}.
 * The body is Markdown, with a Write/Preview toggle. Participants (Person -participated_in->
 * minutes; people the transcript shows were present, not idle mentions) and pertinent
 * communities of practice (minutes -pertains_to-> CoP, multiple expected) are assigned here;
 * both save as full-replace sets. Edit mode also surfaces the ontology-ingest stamp
 * (read-only — the ingest pipeline writes it).
 */
export default function MeetingMinutesForm({
    isOpen, onClose, mode = 'create', initial = null,
    workingGroupPlanIdentifier = null, createContext = null, onSaved,
}) {
    const { individuals, user } = useContext(UserContext);
    const toast = useToast();
    const isEdit = mode === 'edit';

    const [title, setTitle] = useState(initial?.title || '');
    const [meetingDate, setMeetingDate] = useState(initial?.meeting_date || '');
    const [content, setContent] = useState(initial?.content || '');
    const [recordedBy, setRecordedBy] = useState(initial?.recorded_by?.unique_id || user?.unique_id || '');
    const [participantIds, setParticipantIds] = useState(
        (initial?.participants || []).map((p) => p.unique_id),
    );
    const [communityIds, setCommunityIds] = useState(
        (initial?.pertains_to_communities || []).map((c) => c.unique_id),
    );
    const [saving, setSaving] = useState(false);

    // Shared key with the Communities area, the interview-guide panel and the
    // implementation panel: opening this modal after visiting any of them costs
    // no request at all.
    const { data: communitiesResp } = useResource(KEYS.communitiesAll, fetchAllCommunities);
    const communities = useMemo(() => communitiesResp?.data?.items || [], [communitiesResp]);

    const people = (individuals || []).filter((p) => p.active || p.non_committee_member_active);
    const personOptions = people.map((p) => ({
        value: p.unique_id,
        label: p.title ? `${p.name} — ${p.title}` : p.name,
    }));
    const communityOptions = communities.map((c) => ({ value: c.unique_id, label: c.name }));
    const errText = (err) => err?.response?.data?.error || err?.message || 'Please try again.';
    const sameSet = (a, b) => [...a].sort().join('|') === [...b].sort().join('|');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
            if (isEdit) {
                await updateMeetingMinutes(initial.unique_id, {
                    title: title.trim(), content, meeting_date: meetingDate || null,
                });
                // Full-replace sets — only send when the selection actually moved.
                const initialParticipants = (initial.participants || []).map((p) => p.unique_id);
                const initialCommunities = (initial.pertains_to_communities || []).map((c) => c.unique_id);
                if (!sameSet(participantIds, initialParticipants)) {
                    await setMinutesParticipants(initial.unique_id, participantIds);
                }
                if (!sameSet(communityIds, initialCommunities)) {
                    await setMinutesCommunities(initial.unique_id, communityIds);
                }
            } else {
                const payload = {
                    title: title.trim(),
                    content: content || undefined,
                    meeting_date: meetingDate || undefined,
                    recorded_by_unique_id: recordedBy || undefined,
                    participant_unique_ids: participantIds.length ? participantIds : undefined,
                    pertains_to_community_unique_ids: communityIds.length ? communityIds : undefined,
                };
                if (workingGroupPlanIdentifier) {
                    payload.working_group_plan_identifier = workingGroupPlanIdentifier;
                } else if (createContext) {
                    payload.campus_abbrev = createContext.campusAbbrev;
                    payload.year_name = createContext.academicYear;
                    payload.working_group = createContext.workingGroup;
                }
                await createMeetingMinutes(payload);
            }
            toast({ title: isEdit ? 'Minutes updated' : 'Minutes recorded', status: 'success', duration: 2000, isClosable: true });
            if (onSaved) await onSaved();
            onClose();
        } catch (err) {
            toast({ title: isEdit ? 'Update failed' : 'Record failed', description: errText(err), status: 'error', duration: 4000, isClosable: true });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader fontSize="md" color="teal.700">{isEdit ? 'Edit Meeting Minutes' : 'Record Meeting Minutes'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={4}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm">Title</FormLabel>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Web WG — March 14" />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Meeting date</FormLabel>
                            <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} maxW="220px" />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Minutes (Markdown)</FormLabel>
                            <Tabs size="sm" variant="enclosed" colorScheme="teal">
                                <TabList>
                                    <Tab>Write</Tab>
                                    <Tab>Preview</Tab>
                                </TabList>
                                <TabPanels>
                                    <TabPanel px={0}>
                                        <Textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            rows={14}
                                            fontFamily="mono"
                                            fontSize="sm"
                                            placeholder="Paste the meeting minutes here (Markdown supported)…"
                                        />
                                    </TabPanel>
                                    <TabPanel px={0}>
                                        <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3} minH="200px">
                                            {content
                                                ? <Markdown>{content}</Markdown>
                                                : <Box color="gray.600" fontSize="sm">Nothing to preview yet.</Box>}
                                        </Box>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Participants</FormLabel>
                            <Text fontSize="xs" color="gray.700" mb={1}>
                                Who the transcript shows was in the meeting — not people merely mentioned.
                            </Text>
                            <TagMultiSelect
                                options={personOptions}
                                selectedIds={participantIds}
                                onChange={setParticipantIds}
                                addLabel="Add a participant…"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Pertains to communities of practice</FormLabel>
                            <Text fontSize="xs" color="gray.700" mb={1}>
                                Which communities this meeting concerns — several is normal.
                            </Text>
                            <TagMultiSelect
                                options={communityOptions}
                                selectedIds={communityIds}
                                onChange={setCommunityIds}
                                addLabel="Add a community…"
                                colorScheme="purple"
                            />
                        </FormControl>
                        {!isEdit && (
                            <FormControl>
                                <FormLabel fontSize="sm">Recorded by</FormLabel>
                                <Select placeholder="(unspecified)" value={recordedBy} onChange={(e) => setRecordedBy(e.target.value)} maxW="360px">
                                    {people.map((p) => (
                                        <option key={p.unique_id} value={p.unique_id}>
                                            {p.name}{p.title ? ` — ${p.title}` : ''}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {isEdit && (
                            <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50" p={3}>
                                <HStack spacing={2} mb={1}>
                                    <Text fontSize="xs" fontWeight="bold" color="teal.700" textTransform="uppercase">Ontology ingest</Text>
                                    {initial?.ontology_ingested ? (
                                        <Badge colorScheme="teal" variant="subtle" fontSize="2xs">ingested</Badge>
                                    ) : (
                                        <Badge colorScheme="orange" variant="subtle" fontSize="2xs">not ingested</Badge>
                                    )}
                                </HStack>
                                {initial?.ontology_ingested ? (
                                    <Text fontSize="xs" color="gray.700">
                                        {initial.ontology_ingest_date ? `Ingested ${initial.ontology_ingest_date}.` : 'Ingested.'}
                                        {initial.ontology_ingest_note ? ` ${initial.ontology_ingest_note}` : ''}
                                    </Text>
                                ) : (
                                    <Text fontSize="xs" color="gray.700">
                                        Not yet processed into the knowledge graph — untapped source material.
                                        The ontology-ingest pipeline stamps this, not this form.
                                    </Text>
                                )}
                            </Box>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                    <Button colorScheme="teal" type="submit" isLoading={saving} loadingText="Saving…" isDisabled={!title.trim()}>
                        {isEdit ? 'Save' : 'Record'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
