import React, { useContext, useState } from 'react';
import {
    Button, FormControl, FormLabel, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Select, Textarea, VStack, useToast,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import { createQuery } from '../../../services/api/post';
import { updateQuery } from '../../../services/api/put';
import { vocabToOptions, CATEGORY_META } from './queriesConfig';

/**
 * Create / edit modal for a Query. In create mode it needs the anchor: either
 * `workingGroupPlanIdentifier`, or `createContext` = {campusAbbrev, academicYear, workingGroup}.
 */
export default function QueryForm({
    isOpen, onClose, mode = 'create', initial = null,
    workingGroupPlanIdentifier = null, createContext = null, onSaved,
}) {
    const { vocab } = useSettings();
    const { individuals, user } = useContext(UserContext);
    const toast = useToast();
    const isEdit = mode === 'edit';

    const [question, setQuestion] = useState(initial?.question || '');
    const [detail, setDetail] = useState(initial?.detail || '');
    const [category, setCategory] = useState(initial?.category || '');
    const [status, setStatus] = useState(initial?.status || 'open');
    const [raisedBy, setRaisedBy] = useState(initial?.raised_by?.unique_id || user?.unique_id || '');
    const [saving, setSaving] = useState(false);

    const categoryOptions = vocabToOptions(vocab?.query_categories, CATEGORY_META);
    const statusOptions = vocabToOptions(vocab?.query_statuses, null);
    const people = (individuals || []).filter((p) => p.active || p.non_committee_member_active);

    const errText = (err) => err?.response?.data?.error || err?.message || 'Please try again.';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        setSaving(true);
        try {
            if (isEdit) {
                await updateQuery(initial.unique_id, {
                    question: question.trim(),
                    detail,
                    category: category || null,
                    status,
                });
            } else {
                const payload = {
                    question: question.trim(),
                    detail: detail || undefined,
                    category: category || undefined,
                    raised_by_unique_id: raisedBy || undefined,
                };
                if (workingGroupPlanIdentifier) {
                    payload.working_group_plan_identifier = workingGroupPlanIdentifier;
                } else if (createContext) {
                    payload.campus_abbrev = createContext.campusAbbrev;
                    payload.year_name = createContext.academicYear;
                    payload.working_group = createContext.workingGroup;
                }
                await createQuery(payload);
            }
            toast({ title: isEdit ? 'Query updated' : 'Query created', status: 'success', duration: 2000, isClosable: true });
            if (onSaved) await onSaved();
            onClose();
        } catch (err) {
            toast({ title: isEdit ? 'Update failed' : 'Create failed', description: errText(err), status: 'error', duration: 4000, isClosable: true });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader fontSize="md" color="teal.700">{isEdit ? 'Edit Question' : 'New Question'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={4}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm">Question</FormLabel>
                            <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} placeholder="What needs to be decided?" />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Detail / context</FormLabel>
                            <Textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm">Category</FormLabel>
                            <Select placeholder="Uncategorized" value={category} onChange={(e) => setCategory(e.target.value)}>
                                {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </Select>
                        </FormControl>
                        {isEdit ? (
                            <FormControl>
                                <FormLabel fontSize="sm">Status</FormLabel>
                                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                                    {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </Select>
                            </FormControl>
                        ) : (
                            <FormControl>
                                <FormLabel fontSize="sm">Raised by</FormLabel>
                                <Select placeholder="(unspecified)" value={raisedBy} onChange={(e) => setRaisedBy(e.target.value)}>
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
                    <Button colorScheme="teal" type="submit" isLoading={saving} loadingText="Saving…" isDisabled={!question.trim()}>
                        {isEdit ? 'Save' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
