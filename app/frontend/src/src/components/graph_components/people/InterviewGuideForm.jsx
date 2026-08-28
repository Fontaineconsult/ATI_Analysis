import React, { useContext, useState } from 'react';
import {
    Box, Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton,
    ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Tab, TabList, TabPanel,
    TabPanels, Tabs, Text, Textarea, VStack, useToast,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import TagMultiSelect from '../../functional_components/TagMultiSelect';
import Markdown from '../common/Markdown';
import {
    setGuideCommunities, setGuidePeople, setGuideResultedIn, setGuideTargets,
    updateInterviewGuide,
} from '../../../services/api/put';

const sameSet = (a, b) => [...a].sort().join('|') === [...b].sort().join('|');

/**
 * Edit modal for one InterviewGuide. Guides are AUTHORED by the
 * /stakeholder-interview skill; this modal corrects and connects — scalar
 * fields plus the edge sets (interviewees / target YSEs / communities) and the
 * resulted_in closure. Every list saves full-replace, and only the sets that
 * actually moved are sent.
 *
 * Props:
 *   isOpen/onClose
 *   guide             the serialized guide (full projection)
 *   yseOptions        [{value: year_identifier, label}] target candidates
 *   communityOptions  [{value: unique_id, label}]
 *   minutesCandidates [{unique_id, title, meeting_date}] for the closure select
 *   onSaved           refresh hook
 */
export default function InterviewGuideForm({
    isOpen, onClose, guide, yseOptions = [], communityOptions = [],
    minutesCandidates = [], onSaved,
}) {
    const { individuals } = useContext(UserContext);
    const toast = useToast();

    const [title, setTitle] = useState(guide.title || '');
    const [meetingDate, setMeetingDate] = useState(guide.meeting_date || '');
    const [content, setContent] = useState(guide.content || '');
    const [personIds, setPersonIds] = useState((guide.prepared_for || []).map((p) => p.unique_id));
    const [targetIds, setTargetIds] = useState((guide.targets || []).map((t) => t.year_identifier));
    const [communityIds, setCommunityIds] = useState(
        (guide.pertains_to_communities || []).map((c) => c.unique_id),
    );
    const [resultedIn, setResultedIn] = useState(guide.resulted_in?.unique_id || '');
    const [saving, setSaving] = useState(false);

    const people = (individuals || []).filter((p) => p.active || p.non_committee_member_active);
    const personOptions = people.map((p) => ({
        value: p.unique_id,
        label: p.title ? `${p.name} — ${p.title}` : p.name,
    }));
    const errText = (err) => err?.response?.data?.error || err?.message || 'Please try again.';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
            await updateInterviewGuide(guide.unique_id, {
                title: title.trim(), content, meeting_date: meetingDate || null,
            });
            if (!sameSet(personIds, (guide.prepared_for || []).map((p) => p.unique_id))) {
                await setGuidePeople(guide.unique_id, personIds);
            }
            if (!sameSet(targetIds, (guide.targets || []).map((t) => t.year_identifier))) {
                await setGuideTargets(guide.unique_id, targetIds);
            }
            if (!sameSet(communityIds, (guide.pertains_to_communities || []).map((c) => c.unique_id))) {
                await setGuideCommunities(guide.unique_id, communityIds);
            }
            if (resultedIn !== (guide.resulted_in?.unique_id || '')) {
                await setGuideResultedIn(guide.unique_id, resultedIn || null);
            }
            toast({ title: 'Guide updated', status: 'success', duration: 2000, isClosable: true });
            if (onSaved) await onSaved();
            onClose();
        } catch (err) {
            toast({ title: 'Update failed', description: errText(err), status: 'error', duration: 4000, isClosable: true });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader fontSize="md" color="teal.700">Edit Interview Guide</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={4}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm">Title</FormLabel>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Planned meeting date</FormLabel>
                            <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} maxW="220px" />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Guide (Markdown)</FormLabel>
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
                            <FormLabel fontSize="sm">Intended interviewees</FormLabel>
                            <TagMultiSelect
                                options={personOptions}
                                selectedIds={personIds}
                                onChange={setPersonIds}
                                addLabel="Add an interviewee…"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Target indicators (this campus + year)</FormLabel>
                            <TagMultiSelect
                                options={yseOptions}
                                selectedIds={targetIds}
                                onChange={setTargetIds}
                                addLabel="Add a target…"
                                colorScheme="blue"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Pertains to communities of practice</FormLabel>
                            <TagMultiSelect
                                options={communityOptions}
                                selectedIds={communityIds}
                                onChange={setCommunityIds}
                                addLabel="Add a community…"
                                colorScheme="purple"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Resulted in (the meeting's minutes)</FormLabel>
                            <Text fontSize="xs" color="gray.700" mb={1}>
                                Closes the loop: prep → meeting → record. Normally set by the ingest pipeline.
                            </Text>
                            <Select
                                size="sm"
                                maxW="480px"
                                placeholder="(not held yet)"
                                value={resultedIn}
                                onChange={(e) => setResultedIn(e.target.value)}
                            >
                                {minutesCandidates.map((m) => (
                                    <option key={m.unique_id} value={m.unique_id}>
                                        {m.meeting_date ? `${m.meeting_date} — ` : ''}{m.title}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                    <Button colorScheme="teal" type="submit" isLoading={saving} loadingText="Saving…" isDisabled={!title.trim()}>
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
