import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Button, Collapse, Flex, HStack, IconButton, Spinner, Text, Tooltip, VStack,
    useDisclosure, useToast,
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, ChevronUpIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import Section from '../../graph_components/common/Section';
import { fetchMinutesPanelForPlan } from '../../../services/api/get';
import { deleteMeetingMinutes } from '../../../services/api/delete';
import MeetingMinutesForm from './MeetingMinutesForm';
import MeetingMinutesDetail from './MeetingMinutesDetail';

function MinutesRow({ minutes, onChanged, onEdit }) {
    const { isOpen, onToggle } = useDisclosure();
    const toast = useToast();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('Delete these minutes? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await deleteMeetingMinutes(minutes.unique_id);
            toast({ title: 'Minutes deleted', status: 'success', duration: 2000, isClosable: true });
            if (onChanged) await onChanged();
        } catch (err) {
            toast({ title: 'Delete failed', description: err?.message, status: 'error', duration: 4000, isClosable: true });
            setDeleting(false);
        }
    };

    const attachedCount = (minutes.documents || []).length + (minutes.webpages || []).length;

    return (
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" borderLeftWidth="3px" borderLeftColor="teal.400" bg="white">
            <Flex align="center" gap={2} p={2} cursor="pointer" onClick={onToggle} _hover={{ bg: 'gray.50' }} role="button" aria-expanded={isOpen}>
                <VStack align="stretch" spacing={0} flex={1} minW={0}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.800" noOfLines={1}>{minutes.title}</Text>
                    <HStack spacing={2}>
                        {minutes.meeting_date && <Text fontSize="2xs" color="gray.500" fontFamily="mono">{minutes.meeting_date}</Text>}
                        {minutes.recorded_by && <Text fontSize="2xs" color="gray.500">{minutes.recorded_by.name}</Text>}
                        {attachedCount > 0 && <Text fontSize="2xs" color="teal.600">{attachedCount} attached</Text>}
                    </HStack>
                </VStack>
                <Tooltip label="Edit" openDelay={400}>
                    <IconButton aria-label="Edit minutes" icon={<EditIcon />} size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(minutes); }} />
                </Tooltip>
                <Tooltip label="Delete" openDelay={400}>
                    <IconButton aria-label="Delete minutes" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" isLoading={deleting} onClick={handleDelete} />
                </Tooltip>
                {isOpen ? <ChevronUpIcon color="gray.500" /> : <ChevronDownIcon color="gray.500" />}
            </Flex>
            <Collapse in={isOpen} animateOpacity unmountOnExit>
                <Box px={3} pb={3}>
                    <MeetingMinutesDetail minutes={minutes} onChanged={onChanged} />
                </Box>
            </Collapse>
        </Box>
    );
}

/**
 * Self-contained Meeting Minutes panel embedded in the campus-plan working-group card.
 * Anchored by `workingGroupPlanIdentifier`; loads its own records and refreshes after every
 * mutation. Renders pasted Markdown minutes readably.
 */
export default function MeetingMinutesPanel({ workingGroupPlanIdentifier, title = 'Meeting Minutes' }) {
    const [panel, setPanel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const formDisc = useDisclosure();
    const [editing, setEditing] = useState(null);

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
    const openCreate = () => { setEditing(null); formDisc.onOpen(); };
    const openEdit = (m) => { setEditing(m); formDisc.onOpen(); };

    const headerAction = (
        <Button size="xs" colorScheme="teal" variant="outline" leftIcon={<AddIcon />} onClick={openCreate} isDisabled={!planExists || loading}>
            Add minutes
        </Button>
    );

    return (
        <Section title={`${title}${minutes.length ? ` (${minutes.length})` : ''}`} action={planExists ? headerAction : null}>
            {loading ? (
                <HStack color="gray.500" fontSize="sm"><Spinner size="sm" /><Text>Loading…</Text></HStack>
            ) : error ? (
                <Text fontSize="sm" color="red.500">{error}</Text>
            ) : !planExists ? (
                <Text fontSize="sm" color="gray.500" fontStyle="italic">No campus plan for this year yet — create one to record minutes here.</Text>
            ) : minutes.length === 0 ? (
                <Text fontSize="sm" color="gray.500" fontStyle="italic">No meeting minutes yet.</Text>
            ) : (
                <VStack align="stretch" spacing={2}>
                    {minutes.map((m) => (
                        <MinutesRow key={m.unique_id} minutes={m} onChanged={load} onEdit={openEdit} />
                    ))}
                </VStack>
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
        </Section>
    );
}
