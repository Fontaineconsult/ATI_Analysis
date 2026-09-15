import React, { useState } from 'react';
import {
    Box, Button, Checkbox, Collapse, HStack, Input, Link, Select, Spinner, Text, Textarea, VStack,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import {
    setPlanSubtaskAssignee, setPlanSubtaskStatus, updatePlanSubtask,
} from '../../../../services/api/put';
import { PLAN_STATUSES } from '../../../../services/utils/planStatus';
import { T } from '../../presentScale';

/**
 * One task on the stage. The row itself is a disclosure: click it (or press
 * Enter on it) and the task opens into its details with every property
 * editable in place: name, description, owner, due date, status, and the
 * resolution note. Saves are the same Asana-first writes the desk view's
 * Progress section makes. The checkbox completes the task without opening it.
 *
 * Props:
 *   planUniqueId   The plan the task hangs off.
 *   sub            The subtask row (asana_gid, name, notes, completed, due_on, ...).
 *   people         Active Person rows for the owner picker.
 *   today          'YYYY-MM-DD', for the overdue flag.
 *   busy           True while this row's completion toggle is in flight.
 *   onToggle(sub)  Complete or reopen.
 *   onSaved()      After a successful property save (caller reloads).
 *   onError(e)     Toast the failure.
 */
function TaskRow({ planUniqueId, sub, people = [], today, busy, onToggle, onSaved, onError }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState(sub.name || '');
    const [notes, setNotes] = useState(sub.notes || '');
    const [dueOn, setDueOn] = useState(sub.due_on || '');
    const [assigneeId, setAssigneeId] = useState(sub.assigned_to?.unique_id || '');
    const [status, setStatus] = useState(sub.task_status || 'Not Started');
    const [resolution, setResolution] = useState(sub.resolution_note || '');

    const overdue = Boolean(!sub.completed && sub.due_on && sub.due_on < today);
    const owner = sub.assigned_to?.name || sub.assignee_name || null;

    const reset = () => {
        setName(sub.name || '');
        setNotes(sub.notes || '');
        setDueOn(sub.due_on || '');
        setAssigneeId(sub.assigned_to?.unique_id || '');
        setStatus(sub.task_status || 'Not Started');
        setResolution(sub.resolution_note || '');
    };
    const toggleOpen = () => { if (!open) reset(); setOpen((o) => !o); };

    const dirty = name.trim() !== (sub.name || '')
        || notes !== (sub.notes || '')
        || dueOn !== (sub.due_on || '')
        || assigneeId !== (sub.assigned_to?.unique_id || '')
        || status !== (sub.task_status || 'Not Started')
        || resolution !== (sub.resolution_note || '');

    const save = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const fieldsChanged = name.trim() !== (sub.name || '') || notes !== (sub.notes || '') || dueOn !== (sub.due_on || '');
            if (fieldsChanged) {
                await updatePlanSubtask(planUniqueId, sub.asana_gid, {
                    name: name.trim(),
                    notes,
                    ...(dueOn ? { dueOn } : {}),
                });
            }
            if (assigneeId !== (sub.assigned_to?.unique_id || '')) {
                await setPlanSubtaskAssignee(planUniqueId, sub.asana_gid, assigneeId || null);
            }
            const statusChanged = status !== (sub.task_status || 'Not Started');
            const resolutionChanged = resolution !== (sub.resolution_note || '');
            if (statusChanged || resolutionChanged) {
                await setPlanSubtaskStatus(planUniqueId, sub.asana_gid, {
                    ...(statusChanged ? { status } : {}),
                    ...(resolutionChanged ? { resolutionNote: resolution } : {}),
                });
            }
            setOpen(false);
            if (onSaved) await onSaved();
        } catch (e) {
            if (onError) onError(e);
        } finally {
            setSaving(false);
        }
    };

    const railColor = sub.completed ? 'green.300' : overdue ? 'red.500' : 'gray.300';

    return (
        <Box borderWidth="1px" borderColor={sub.completed ? 'green.200' : 'gray.200'} borderRadius="md"
             borderLeftWidth="5px" borderLeftColor={railColor} bg={sub.completed ? 'green.50' : 'white'}>
            <HStack align="start" spacing={3} px={3} py={2.5}>
                <Checkbox
                    size="lg" colorScheme="green" mt={0.5}
                    isChecked={Boolean(sub.completed)}
                    isDisabled={busy}
                    onChange={() => onToggle(sub)}
                    aria-label={`${sub.completed ? 'Reopen' : 'Complete'}: ${sub.name || 'untitled task'}`}
                />
                {/* The disclosure trigger is a real button so it has a keyboard path. */}
                <Box
                    as="button"
                    type="button"
                    flex="1" minW="0" textAlign="left"
                    onClick={toggleOpen}
                    aria-expanded={open}
                    aria-label={`${open ? 'Close' : 'Open'} details: ${sub.name || 'untitled task'}`}
                    borderRadius="sm"
                    _hover={{ bg: sub.completed ? 'green.100' : 'gray.50' }}
                    _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '2px' }}
                    px={1} mx={-1}
                >
                    <HStack spacing={2} align="start">
                        <Box color="gray.700" mt="0.2em" flexShrink={0} aria-hidden="true">
                            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        </Box>
                        <Box flex="1" minW="0">
                            <Text fontSize={T.body} lineHeight="1.35"
                                  color={sub.completed ? 'gray.700' : 'gray.800'}
                                  textDecoration={sub.completed ? 'line-through' : 'none'}>
                                {sub.name || '(untitled task)'}
                            </Text>
                            <HStack spacing={3} mt={1} wrap="wrap">
                                <Text fontSize={T.meta} color={owner ? 'gray.700' : 'purple.700'} fontWeight={owner ? 'normal' : 'semibold'}>
                                    {owner || 'UNOWNED'}
                                </Text>
                                {sub.due_on && !sub.completed && (
                                    <Text fontSize={T.meta} color={overdue ? 'red.700' : 'gray.700'} fontWeight={overdue ? 'semibold' : 'normal'}>
                                        {overdue ? `OVERDUE, due ${sub.due_on}` : `due ${sub.due_on}`}
                                    </Text>
                                )}
                                {sub.completed && sub.completed_at && (
                                    <Text fontSize={T.meta} color="gray.700">done {sub.completed_at.slice(0, 10)}</Text>
                                )}
                                {sub.task_status && sub.task_status !== 'Not Started' && (
                                    <Text fontSize={T.meta} color="gray.700">{sub.task_status}</Text>
                                )}
                                {!open && sub.notes && (
                                    <Text fontSize={T.meta} color="gray.700" noOfLines={1} flex="1" minW="0">{sub.notes}</Text>
                                )}
                            </HStack>
                        </Box>
                    </HStack>
                </Box>
                {busy && <Spinner size="sm" color="teal.500" mt={1} />}
            </HStack>

            <Collapse in={open} animateOpacity unmountOnExit>
                <Box px={4} pb={3} pt={1} borderTopWidth="1px" borderColor="gray.200" bg="gray.50">
                    <VStack spacing={2} align="stretch" mt={2}>
                        <Input size="md" bg="white" fontSize={T.body} borderColor="gray.300"
                               aria-label="Task name" value={name} onChange={(e) => setName(e.target.value)} />
                        <Textarea size="sm" bg="white" rows={3} fontSize={T.body} borderColor="gray.300"
                                  placeholder="Description (saved to Asana as the task notes)"
                                  aria-label="Task description" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        <HStack spacing={2} wrap="wrap">
                            <Select size="sm" bg="white" maxW="260px" fontSize={T.meta} borderColor="gray.300"
                                    aria-label="Task owner" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                                <option value="">Unowned</option>
                                {people.map((p) => <option key={p.unique_id} value={p.unique_id}>{p.name}</option>)}
                            </Select>
                            <Input size="sm" type="date" bg="white" maxW="180px" fontSize={T.meta} borderColor="gray.300"
                                   aria-label="Task due date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
                            <Select size="sm" bg="white" maxW="180px" fontSize={T.meta} borderColor="gray.300"
                                    aria-label="Task status" value={status} onChange={(e) => setStatus(e.target.value)}>
                                {PLAN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </HStack>
                        <Textarea size="sm" bg="white" rows={2} fontSize={T.body} borderColor="gray.300"
                                  placeholder="Resolution note: how this ended, whatever the terminal status"
                                  aria-label="Task resolution note" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                        <HStack justify="space-between" wrap="wrap">
                            {sub.permalink_url ? (
                                <Link href={sub.permalink_url} isExternal fontSize={T.meta} color="teal.700">
                                    Open in Asana <ExternalLinkIcon mx="2px" />
                                </Link>
                            ) : <Box />}
                            <HStack>
                                <Button size="sm" variant="outline" bg="white" onClick={() => { reset(); setOpen(false); }} isDisabled={saving}>
                                    Cancel
                                </Button>
                                <Button size="sm" colorScheme="teal" onClick={save} isLoading={saving}
                                        isDisabled={!name.trim() || !dirty}>
                                    Save changes
                                </Button>
                            </HStack>
                        </HStack>
                    </VStack>
                </Box>
            </Collapse>
        </Box>
    );
}

export default TaskRow;
