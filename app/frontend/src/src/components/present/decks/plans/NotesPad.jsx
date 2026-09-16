import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Box, Button, Heading, HStack, Input, Select, Text, Textarea, VisuallyHidden, VStack,
} from '@chakra-ui/react';
import Markdown from '../../../graph_components/common/Markdown';
import { T } from '../../presentScale';

/**
 * What the room says about the plan on stage, typed while looking at it.
 *
 * Entries go to today's minutes record for the plan's working group as
 * Markdown lines under the plan's heading (see useMeetingMinutes). Three
 * ways to save: Enter or Save writes a note; Decision and Ask prefix the
 * line with the word the ontology-ingest rubric routes on; Make task turns
 * the text into an Asana subtask on the plan with an owner and due date,
 * then records "(task created)" in the minutes.
 *
 * The saved body renders below the input so the remote team reads the same
 * record the graph holds. An aria-live region announces each save.
 *
 * Props:
 *   plan             The plan on stage (needs unique_id, name, working group name).
 *   workingGroupName The minutes record's working group ("Web").
 *   minutes          Today's record for that group, or null before the first save.
 *   busy, error      From useMeetingMinutes.
 *   onAppend({ text, kind })            -> Promise (resolves with the record)
 *   onMakeTask({ text, assigneeId, dueOn }) -> Promise
 *   people           Active Person rows for the owner picker.
 *   inputRef         Ref to the textarea so the m shortcut can focus it.
 */
function NotesPad({
    plan, workingGroupName, minutes, busy, error,
    onAppend, onMakeTask, people = [], inputRef,
}) {
    const [text, setText] = useState('');
    const [taskMode, setTaskMode] = useState(false);
    const [assigneeId, setAssigneeId] = useState('');
    const [dueOn, setDueOn] = useState('');
    const [announce, setAnnounce] = useState('');
    const [localError, setLocalError] = useState(null);
    const bodyRef = useRef(null);
    const fallbackRef = useRef(null);
    const ref = inputRef || fallbackRef;

    // Scroll the record to its latest line after each save.
    const content = minutes?.content || '';
    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [content]);

    const canSave = text.trim().length > 0 && !busy && Boolean(plan);

    // The input clears the moment a save starts, so the presenter can keep
    // typing while the write is in flight; a failure puts the draft back.
    const save = async (kind) => {
        if (!canSave) return;
        const draft = text.trim();
        setLocalError(null);
        setText('');
        try {
            const record = await onAppend({ text: draft, kind });
            setAnnounce(`Saved: ${record?.appended_line || draft}`);
        } catch (e) {
            setText(draft);
            setLocalError(e?.response?.data?.error || e?.message || 'Could not save the note.');
        }
    };

    const makeTask = async () => {
        if (!canSave) return;
        const draft = text.trim();
        setLocalError(null);
        setText('');
        try {
            await onMakeTask({ text: draft, assigneeId: assigneeId || null, dueOn: dueOn || null });
            setTaskMode(false);
            setAssigneeId('');
            setDueOn('');
            setAnnounce(`Task created: ${draft}`);
        } catch (e) {
            setText(draft);
            setLocalError(e?.response?.data?.error || e?.message || 'Could not create the task.');
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (taskMode) makeTask(); else save('note');
        }
    };

    const title = useMemo(() => {
        if (minutes?.title) return minutes.title;
        const day = new Date().toISOString().slice(0, 10);
        return workingGroupName ? `${workingGroupName} working group, ${day}` : 'Meeting notes';
    }, [minutes, workingGroupName]);

    return (
        <Box as="aside" aria-label="Meeting notes" h="100%" display="flex" flexDirection="column"
             bg="white" borderLeftWidth="1px" borderColor="gray.200" minW="0">
            <Box px={4} py={2} borderBottomWidth="1px" borderColor="gray.200">
                <Heading as="h2" fontSize={T.section} textTransform="uppercase" letterSpacing="wide" color="teal.700">
                    Meeting notes
                </Heading>
                <Text fontSize={T.meta} color="gray.700" noOfLines={1}>{title}</Text>
            </Box>

            <Box ref={bodyRef} flex="1" overflowY="auto" minH="0" px={4} py={3}
                 sx={{
                     'p, li': { fontSize: T.body, color: 'gray.800', lineHeight: 1.4 },
                     h3: { fontSize: T.section, textTransform: 'uppercase', letterSpacing: 'wide', color: 'teal.700', mt: 3 },
                     ul: { pl: 4 },
                 }}>
                {content ? (
                    <Markdown>{content}</Markdown>
                ) : (
                    <Text fontSize={T.body} color="gray.700" fontStyle="italic">
                        Nothing saved yet. The first note opens today's minutes for the {workingGroupName || 'working'} group
                        {plan?.name ? ` under "${plan.name}"` : ''}.
                    </Text>
                )}
            </Box>

            <Box px={4} py={3} borderTopWidth="1px" borderColor="gray.200" bg="gray.50">
                <VStack align="stretch" spacing={2}>
                    <Textarea
                        ref={ref}
                        size="sm"
                        bg="white"
                        rows={3}
                        fontSize={T.body}
                        borderColor="gray.300"
                        placeholder={plan ? `Note on "${plan.name}". Enter saves, Shift+Enter for a new line.` : 'Select a plan first.'}
                        aria-label="Meeting note"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={onKeyDown}
                        isDisabled={!plan}
                    />
                    {taskMode && (
                        <HStack spacing={2} wrap="wrap">
                            <Select size="sm" bg="white" maxW="240px" fontSize={T.meta} borderColor="gray.300"
                                    aria-label="Task owner" value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}>
                                <option value="">Unowned</option>
                                {people.map((p) => (
                                    <option key={p.unique_id} value={p.unique_id}>{p.name}</option>
                                ))}
                            </Select>
                            <Input size="sm" type="date" bg="white" maxW="180px" fontSize={T.meta} borderColor="gray.300"
                                   aria-label="Task due date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
                        </HStack>
                    )}
                    <HStack spacing={2} wrap="wrap">
                        {taskMode ? (
                            <>
                                <Button size="sm" colorScheme="teal" onClick={makeTask} isDisabled={!canSave} isLoading={busy}>
                                    Save task
                                </Button>
                                <Button size="sm" variant="outline" bg="white" onClick={() => setTaskMode(false)} isDisabled={busy}>
                                    Back to note
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button size="sm" colorScheme="teal" onClick={() => save('note')} isDisabled={!canSave} isLoading={busy}>
                                    Save
                                </Button>
                                <Button size="sm" variant="outline" bg="white" colorScheme="teal"
                                        onClick={() => save('decision')} isDisabled={!canSave}>
                                    Decision
                                </Button>
                                <Button size="sm" variant="outline" bg="white" colorScheme="teal"
                                        onClick={() => save('ask')} isDisabled={!canSave}>
                                    Ask
                                </Button>
                                <Button size="sm" variant="outline" bg="white" colorScheme="purple"
                                        onClick={() => setTaskMode(true)} isDisabled={!plan || !text.trim()}>
                                    Make task
                                </Button>
                            </>
                        )}
                    </HStack>
                    {(localError || error) && (
                        <Text role="alert" fontSize={T.meta} color="red.700">{localError || error}</Text>
                    )}
                </VStack>
            </Box>
            <VisuallyHidden aria-live="polite" role="status">{announce}</VisuallyHidden>
        </Box>
    );
}

export default NotesPad;
