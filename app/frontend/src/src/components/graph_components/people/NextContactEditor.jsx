import React, { useMemo, useState } from 'react';
import {
    Badge, Box, Button, Checkbox, Flex, HStack, Input, Text, VStack, Wrap, WrapItem,
    useToast,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { setFollowUpNextContact } from '../../../services/api/put';

/** ISO date for today in LOCAL time — toISOString would shift the day near midnight. */
export const todayIso = () => {
    const now = new Date();
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-');
};

/** 'overdue' | 'due' (today) | 'scheduled' | null (no reminder). */
export const contactDueState = (nextContactDate) => {
    if (!nextContactDate) return null;
    const today = todayIso();
    if (nextContactDate < today) return 'overdue';
    if (nextContactDate === today) return 'due';
    return 'scheduled';
};

const DUE_BADGE = {
    overdue: { colorScheme: 'red', label: 'Overdue' },
    due: { colorScheme: 'orange', label: 'Due today' },
    scheduled: { colorScheme: 'teal', label: 'Scheduled' },
};

/**
 * The next-contact reminder on one chase: when to re-contact, whom, about what.
 *
 * Displays the standing reminder (with its due state) and edits it in place.
 * Person candidates are the follow-up's recipients plus whoever the reminder
 * already targets — the people on the hook for this chase, not the whole
 * roster. Saving with no date is a clear: date, note, and persons go together,
 * because a note or person with no date is a reminder that can never come due.
 *
 * Props:
 *   followUp  A row carrying unique_id, next_contact_date, next_contact_note,
 *             next_contact_with: [{unique_id,name}], addressed_to: [{unique_id,name}].
 *   onSaved   Called after a successful save/clear, to reload the source.
 */
export default function NextContactEditor({ followUp, onSaved }) {
    const toast = useToast();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [contactDate, setContactDate] = useState(followUp.next_contact_date || '');
    const [note, setNote] = useState(followUp.next_contact_note || '');
    const [personIds, setPersonIds] = useState(
        (followUp.next_contact_with || []).map((p) => p.unique_id)
    );

    const candidates = useMemo(() => {
        const seen = new Map();
        [...(followUp.addressed_to || []), ...(followUp.next_contact_with || [])]
            .forEach((p) => { if (p?.unique_id && !seen.has(p.unique_id)) seen.set(p.unique_id, p); });
        return [...seen.values()];
    }, [followUp.addressed_to, followUp.next_contact_with]);

    const openEditor = () => {
        setContactDate(followUp.next_contact_date || '');
        setNote(followUp.next_contact_note || '');
        setPersonIds((followUp.next_contact_with || []).map((p) => p.unique_id));
        setEditing(true);
    };

    const togglePerson = (uniqueId, checked) => {
        setPersonIds((prev) => (checked
            ? [...prev, uniqueId]
            : prev.filter((id) => id !== uniqueId)));
    };

    const save = async (clear = false) => {
        setSaving(true);
        try {
            await setFollowUpNextContact(followUp.unique_id, clear ? {} : {
                contactDate,
                note: note.trim() || null,
                personIds,
            });
            setEditing(false);
            toast({
                title: clear ? 'Reminder cleared' : 'Next contact scheduled',
                status: 'success', duration: 2000, isClosable: true,
            });
            if (onSaved) await onSaved();
        } catch (e) {
            toast({
                title: 'Could not save the reminder',
                description: e?.message || 'Unknown error.',
                status: 'error', duration: 3500, isClosable: true,
            });
        } finally {
            setSaving(false);
        }
    };

    const dueState = contactDueState(followUp.next_contact_date);
    const persons = followUp.next_contact_with || [];

    if (!editing) {
        return (
            <Flex gap={2} align="center" wrap="wrap">
                <CalendarIcon boxSize={3} color={dueState === 'overdue' ? 'red.500' : 'gray.500'} aria-hidden="true" />
                {dueState ? (
                    <>
                        <Badge {...DUE_BADGE[dueState]} variant="subtle" fontSize="2xs">
                            {DUE_BADGE[dueState].label}
                        </Badge>
                        <Text fontSize="xs" color="gray.800" fontWeight="medium">
                            {followUp.next_contact_date}
                        </Text>
                        {persons.length > 0 && (
                            <Text fontSize="xs" color="gray.700">
                                contact {persons.map((p) => p.name).join(', ')}
                            </Text>
                        )}
                        {followUp.next_contact_note && (
                            <Text fontSize="xs" color="gray.700" fontStyle="italic" noOfLines={1}>
                                {followUp.next_contact_note}
                            </Text>
                        )}
                    </>
                ) : (
                    <Text fontSize="xs" color="gray.700" fontStyle="italic">
                        No next contact scheduled.
                    </Text>
                )}
                <Button size="xs" variant="outline" bg="white" colorScheme="teal" onClick={openEditor}>
                    {dueState ? 'Edit' : 'Schedule contact'}
                </Button>
            </Flex>
        );
    }

    return (
        <Box borderWidth="1px" borderColor="gray.300" borderRadius="md" bg="gray.50" p={3}>
            <VStack align="stretch" spacing={2}>
                <HStack spacing={2}>
                    <Input
                        size="sm" type="date" maxW="180px" bg="white"
                        value={contactDate}
                        onChange={(e) => setContactDate(e.target.value)}
                        aria-label="Next contact date"
                        borderColor="gray.300"
                    />
                    <Input
                        size="sm" flex="1" bg="white"
                        placeholder="What to chase (optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        aria-label="Next contact note"
                        borderColor="gray.300"
                    />
                </HStack>
                {candidates.length > 0 && (
                    <Wrap spacing={3}>
                        {candidates.map((p) => (
                            <WrapItem key={p.unique_id}>
                                <Checkbox
                                    size="sm" colorScheme="teal" bg="white" px={2} py={0.5}
                                    borderWidth="1px" borderColor="gray.200" borderRadius="md"
                                    isChecked={personIds.includes(p.unique_id)}
                                    onChange={(e) => togglePerson(p.unique_id, e.target.checked)}
                                >
                                    <Text as="span" fontSize="xs">{p.name}</Text>
                                </Checkbox>
                            </WrapItem>
                        ))}
                    </Wrap>
                )}
                <HStack justify="flex-end" spacing={2}>
                    {followUp.next_contact_date && (
                        <Button size="xs" variant="ghost" colorScheme="red"
                                isDisabled={saving} onClick={() => save(true)}>
                            Clear reminder
                        </Button>
                    )}
                    <Button size="xs" variant="ghost" onClick={() => setEditing(false)} isDisabled={saving}>
                        Cancel
                    </Button>
                    <Button size="xs" colorScheme="teal" isLoading={saving}
                            isDisabled={!contactDate} onClick={() => save(false)}>
                        Save
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
}
