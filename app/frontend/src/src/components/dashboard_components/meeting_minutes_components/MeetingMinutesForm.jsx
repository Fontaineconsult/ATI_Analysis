import React, { useContext, useState } from 'react';
import {
    Box, Button, FormControl, FormLabel, Input, Modal, ModalBody, ModalCloseButton,
    ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Tab, TabList, TabPanel,
    TabPanels, Tabs, Textarea, VStack, useToast,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import { createMeetingMinutes } from '../../../services/api/post';
import { updateMeetingMinutes } from '../../../services/api/put';
import Markdown from '../../graph_components/common/Markdown';

/**
 * Create / edit modal for a MeetingMinutes record. In create mode it needs the anchor:
 * `workingGroupPlanIdentifier`, or `createContext` = {campusAbbrev, academicYear, workingGroup}.
 * The body is Markdown, with a Write/Preview toggle.
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
    const [saving, setSaving] = useState(false);

    const people = (individuals || []).filter((p) => p.active || p.non_committee_member_active);
    const errText = (err) => err?.response?.data?.error || err?.message || 'Please try again.';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
            if (isEdit) {
                await updateMeetingMinutes(initial.unique_id, {
                    title: title.trim(), content, meeting_date: meetingDate || null,
                });
            } else {
                const payload = {
                    title: title.trim(),
                    content: content || undefined,
                    meeting_date: meetingDate || undefined,
                    recorded_by_unique_id: recordedBy || undefined,
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
                                                : <Box color="gray.400" fontSize="sm">Nothing to preview yet.</Box>}
                                        </Box>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
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
