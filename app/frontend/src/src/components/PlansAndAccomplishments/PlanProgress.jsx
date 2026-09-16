import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Checkbox,
    Collapse,
    HStack,
    Input,
    Link,
    Select,
    Spinner,
    Text,
    Textarea,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { EditIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { FaPlus } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { SettingsContext } from '../../context/SettingsContext';
import { UserContext } from '../../context/UserContext';
import { fetchPlanAsanaSubtasks } from '../../services/api/get';
import { addPlanSubtask } from '../../services/api/post';
import {
    setPlanSubtaskAssignee,
    setPlanSubtaskCompleted,
    setPlanSubtaskStatus,
    updatePlanSubtask,
} from '../../services/api/put';
import useResource from '../../hooks/useResource';
import { KEYS } from '../../context/resourceKeys';
import { PLAN_STATUSES } from '../../services/utils/planStatus';
import { getPlanStatusColorScheme } from '../../styles/planStatusColors';

/** Assignee picker: any active person. Assignment is app-side data (Asana
 *  only accepts workspace members as actors), so no email is required. */
function AssigneeSelect({ people, value, onChange, label }) {
    return (
        <Select
            size="sm" bg="white" maxW="260px"
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            borderColor="gray.300"
        >
            <option value="">Unassigned</option>
            {people.map((p) => (
                <option key={p.unique_id} value={p.unique_id}>{p.name}</option>
            ))}
        </Select>
    );
}

/** One progress subtask: completion checkbox, name + description, and an
 *  inline editor for name / description / due date (Asana written first). */
function SubtaskRow({ planUniqueId, sub, people, busy, onToggle, onSaved, onError }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(sub.name || '');
    const [notes, setNotes] = useState(sub.notes || '');
    const [dueOn, setDueOn] = useState(sub.due_on || '');
    const [assigneeId, setAssigneeId] = useState(sub.assigned_to?.unique_id || '');
    const [status, setStatus] = useState(sub.task_status || 'Not Started');
    const [resolution, setResolution] = useState(sub.resolution_note || '');
    const [saving, setSaving] = useState(false);

    const openEditor = () => {
        setName(sub.name || '');
        setNotes(sub.notes || '');
        setDueOn(sub.due_on || '');
        setAssigneeId(sub.assigned_to?.unique_id || '');
        setStatus(sub.task_status || 'Not Started');
        setResolution(sub.resolution_note || '');
        setEditing(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            await updatePlanSubtask(planUniqueId, sub.asana_gid, {
                name: name.trim(),
                notes,
                ...(dueOn ? { dueOn } : {}),
            });
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
            setEditing(false);
            await onSaved();
        } catch (e) {
            onError(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box
            px={3} py={2}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
            bg={sub.completed ? 'green.50' : 'white'}
        >
            <HStack align="start" spacing={2}>
                <Checkbox
                    colorScheme="green"
                    isChecked={Boolean(sub.completed)}
                    isDisabled={busy}
                    onChange={() => onToggle(sub)}
                    aria-label={`${sub.completed ? 'Reopen' : 'Complete'}: ${sub.name || 'untitled subtask'}`}
                    mt={0.5}
                />
                <Box flex="1" minW="0">
                    <HStack spacing={2} align="center">
                        <Text
                            fontSize="sm"
                            color={sub.completed ? 'gray.700' : 'gray.800'}
                            textDecoration={sub.completed ? 'line-through' : 'none'}
                        >
                            {sub.name || '(untitled subtask)'}
                        </Text>
                        {sub.task_status && (
                            <Badge
                                colorScheme={getPlanStatusColorScheme(sub.task_status)}
                                variant="subtle" fontSize="2xs" textTransform="none"
                            >
                                {sub.task_status}
                            </Badge>
                        )}
                    </HStack>
                    {sub.notes && !editing && (
                        <Text fontSize="xs" color="gray.700" whiteSpace="pre-wrap" mt={0.5}>
                            {sub.notes}
                        </Text>
                    )}
                    {sub.resolution_note && !editing && (
                        <Text fontSize="xs" color="gray.700" fontStyle="italic" mt={0.5}>
                            Resolution: {sub.resolution_note}
                        </Text>
                    )}
                    <HStack spacing={2} mt={0.5}>
                        {(sub.assigned_to?.name || sub.assignee_name) && (
                            <Text fontSize="2xs" color="gray.700">
                                {sub.assigned_to?.name || sub.assignee_name}
                            </Text>
                        )}
                        {sub.due_on && (
                            <Text fontSize="2xs" color="gray.700">due {sub.due_on}</Text>
                        )}
                    </HStack>
                    {sub.unique_id && (
                        <Text fontFamily="mono" fontSize="2xs" color="gray.600" mt={0.5}>
                            {sub.unique_id}
                        </Text>
                    )}
                </Box>
                {busy && <Spinner size="xs" color="teal.500" mt={1} />}
                <Button
                    size="xs" variant="ghost" colorScheme="teal"
                    onClick={editing ? () => setEditing(false) : openEditor}
                    aria-label={`Edit: ${sub.name || 'untitled subtask'}`}
                >
                    <EditIcon />
                </Button>
                {sub.permalink_url && (
                    <Link href={sub.permalink_url} isExternal color="purple.600" fontSize="xs" mt={1}>
                        <ExternalLinkIcon aria-label="Open in Asana" />
                    </Link>
                )}
            </HStack>

            {editing && (
                <Box mt={2} p={2} borderWidth="1px" borderColor="gray.300" borderRadius="md" bg="gray.50">
                    <VStack spacing={2} align="stretch">
                        <Input
                            size="sm" bg="white"
                            aria-label="Edit subtask name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            borderColor="gray.300"
                        />
                        <Textarea
                            size="sm" bg="white" rows={3}
                            placeholder="Description (saved to Asana as the subtask notes)"
                            aria-label="Edit subtask description"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            borderColor="gray.300"
                        />
                        <HStack wrap="wrap" gap={2}>
                            <Input
                                size="sm" type="date" maxW="180px" bg="white"
                                aria-label="Edit due date"
                                value={dueOn}
                                onChange={(e) => setDueOn(e.target.value)}
                                borderColor="gray.300"
                            />
                            <AssigneeSelect
                                people={people}
                                value={assigneeId}
                                onChange={setAssigneeId}
                                label="Edit assignee"
                            />
                            <Select
                                size="sm" bg="white" maxW="180px"
                                aria-label="Edit status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                borderColor="gray.300"
                            >
                                {PLAN_STATUSES.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </Select>
                        </HStack>
                        <Textarea
                            size="sm" bg="white" rows={2}
                            placeholder="Resolution note: how this ended, whatever the terminal status"
                            aria-label="Edit resolution note"
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            borderColor="gray.300"
                        />
                        <HStack justify="flex-end">
                            <HStack>
                                <Button size="xs" variant="ghost" onClick={() => setEditing(false)} isDisabled={saving}>
                                    Cancel
                                </Button>
                                <Button size="xs" colorScheme="teal" onClick={save}
                                        isLoading={saving} isDisabled={!name.trim()}>
                                    Save changes
                                </Button>
                            </HStack>
                        </HStack>
                    </VStack>
                </Box>
            )}
        </Box>
    );
}

/**
 * The plan's single progress surface. Progress items ARE the plan's Asana
 * subtasks: adding one here creates it in Asana (an unlinked plan gets its
 * Asana task created on the way) and records the result as a first-order
 * graph row; checking one off completes it in Asana and mirrors Asana's
 * answer back. The bulk "Asana Refresh" button still reconciles everything,
 * including subtasks people added inside Asana.
 *
 * Progress notes written before the merge (Note nodes) render read-only in
 * the "Earlier progress notes" disclosure below the list.
 *
 * Props:
 *   planUniqueId  The plan whose progress to show.
 *   legacyNotes   plan.progress_notes (raw read-path shape); optional.
 */
function PlanProgress({ planUniqueId, legacyNotes }) {
    const { campus } = useParams();
    const { currentAcademicYear } = useContext(SettingsContext);
    const { loadAllIndividuals, individuals } = useContext(UserContext);
    const toast = useToast();

    // The assignee pool: every active person. Ownership is recorded in the
    // graph, not in Asana, so nobody is excluded for lacking an email.
    useEffect(() => {
        if (!individuals || individuals.length === 0) loadAllIndividuals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const people = useMemo(
        () => (individuals || [])
            .filter((p) => p.active)
            .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
        [individuals],
    );

    const { data: subtasksResp, loading, error, reload } = useResource(
        planUniqueId ? KEYS.planAsanaSubtasks(planUniqueId) : null,
        () => fetchPlanAsanaSubtasks(planUniqueId),
    );
    const subtasks = useMemo(() => subtasksResp || [], [subtasksResp]);

    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [newDueOn, setNewDueOn] = useState('');
    const [newAssigneeId, setNewAssigneeId] = useState('');
    const [saving, setSaving] = useState(false);
    const [busyGid, setBusyGid] = useState(null);
    const [notesOpen, setNotesOpen] = useState(false);

    const showError = (title) => (e) => {
        toast({
            title,
            description: e?.response?.data?.error || e?.message,
            status: 'error', duration: 4000, isClosable: true,
        });
    };

    const notes = useMemo(() => {
        const parsed = (legacyNotes || []).map((noteData) => {
            const note = noteData.note?.properties || noteData.note || {};
            const creator = noteData.created_by?.properties || noteData.created_by || null;
            return {
                unique_id: note.unique_id,
                name: note.name,
                content: note.content,
                date_created: note.date_created,
                created_by_name: creator?.name || null,
            };
        });
        return parsed.sort((a, b) => {
            if (!a.date_created) return 1;
            if (!b.date_created) return -1;
            return new Date(b.date_created) - new Date(a.date_created);
        });
    }, [legacyNotes]);

    const handleToggle = async (sub) => {
        setBusyGid(sub.asana_gid);
        try {
            await setPlanSubtaskCompleted(planUniqueId, sub.asana_gid, !sub.completed);
            await reload();
        } catch (e) {
            showError('Could not update the subtask in Asana')(e);
        } finally {
            setBusyGid(null);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            await addPlanSubtask(planUniqueId, {
                name: newName.trim(),
                notes: newNotes.trim() || null,
                dueOn: newDueOn || null,
                assigneePersonId: newAssigneeId || null,
                yearName: currentAcademicYear,
                campusAbbrev: campus,
            });
            setNewName('');
            setNewNotes('');
            setNewDueOn('');
            setNewAssigneeId('');
            setShowAdd(false);
            await reload();
            toast({
                title: 'Progress added',
                description: 'Saved to Asana and recorded here.',
                status: 'success', duration: 2500, isClosable: true,
            });
        } catch (e) {
            toast({
                title: 'Could not add the subtask',
                description: e?.response?.data?.error || e?.message,
                status: 'error', duration: 4000, isClosable: true,
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <HStack spacing={2} color="gray.700">
                <Spinner size="xs" color="teal.500" />
                <Text fontSize="sm">Loading progress…</Text>
            </HStack>
        );
    }

    const doneCount = subtasks.filter((s) => s.completed).length;
    const lastSynced = subtasks[0]?.last_synced;

    return (
        <VStack align="stretch" spacing={3}>
            <HStack justify="space-between" wrap="wrap">
                <HStack spacing={2}>
                    {subtasks.length > 0 && (
                        <Badge colorScheme={doneCount === subtasks.length ? 'green' : 'blue'} variant="subtle">
                            {doneCount} / {subtasks.length} complete
                        </Badge>
                    )}
                    {lastSynced && (
                        <Text fontSize="2xs" color="gray.600">
                            Synced {new Date(lastSynced).toLocaleString()}
                        </Text>
                    )}
                </HStack>
                <Button
                    size="xs"
                    colorScheme="teal"
                    leftIcon={<FaPlus />}
                    variant={showAdd ? 'solid' : 'outline'}
                    bg={showAdd ? undefined : 'white'}
                    onClick={() => setShowAdd((s) => !s)}
                >
                    {showAdd ? 'Cancel' : 'Add progress'}
                </Button>
            </HStack>

            {error && (
                <Text fontSize="sm" color="red.600">Could not load progress: {error}</Text>
            )}

            {showAdd && (
                <Box p={3} borderWidth="1px" borderColor="gray.300" borderRadius="md" bg="gray.50">
                    <VStack spacing={2} align="stretch">
                        <Input
                            size="sm"
                            bg="white"
                            placeholder="What was done, or what is the next step?"
                            aria-label="Subtask name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            borderColor="gray.300"
                        />
                        <Textarea
                            size="sm" bg="white" rows={3}
                            placeholder="Description (optional, saved to Asana as the subtask notes)"
                            aria-label="Subtask description"
                            value={newNotes}
                            onChange={(e) => setNewNotes(e.target.value)}
                            borderColor="gray.300"
                        />
                        <HStack justify="space-between" wrap="wrap" gap={2}>
                            <HStack>
                                <Input
                                    size="sm" type="date" maxW="180px" bg="white"
                                    aria-label="Due date (optional)"
                                    value={newDueOn}
                                    onChange={(e) => setNewDueOn(e.target.value)}
                                    borderColor="gray.300"
                                />
                                <AssigneeSelect
                                    people={people}
                                    value={newAssigneeId}
                                    onChange={setNewAssigneeId}
                                    label="Assign to"
                                />
                            </HStack>
                            <Button
                                size="sm" colorScheme="teal"
                                onClick={handleAdd}
                                isLoading={saving} loadingText="Saving…"
                                isDisabled={!newName.trim()}
                            >
                                Save to Asana
                            </Button>
                        </HStack>
                    </VStack>
                </Box>
            )}

            {subtasks.length === 0 && !error && (
                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                    No progress recorded yet. Add the first item; it is saved to Asana
                    and kept here as the record.
                </Text>
            )}

            <VStack align="stretch" spacing={1}>
                {subtasks.map((sub) => (
                    <SubtaskRow
                        key={sub.asana_gid}
                        planUniqueId={planUniqueId}
                        sub={sub}
                        people={people}
                        busy={busyGid === sub.asana_gid}
                        onToggle={handleToggle}
                        onSaved={reload}
                        onError={showError('Could not save the subtask edit')}
                    />
                ))}
            </VStack>

            {notes.length > 0 && (
                <Box>
                    <Button
                        size="xs" variant="ghost" colorScheme="gray"
                        onClick={() => setNotesOpen((o) => !o)}
                        aria-expanded={notesOpen}
                    >
                        {notesOpen ? 'Hide' : 'Show'} earlier progress notes ({notes.length})
                    </Button>
                    <Collapse in={notesOpen} animateOpacity unmountOnExit>
                        <VStack align="stretch" spacing={1.5} mt={1.5}>
                            {notes.map((note, index) => (
                                <Box
                                    key={note.unique_id || index}
                                    p={2}
                                    borderWidth="1px"
                                    borderColor="gray.300"
                                    borderRadius="md"
                                    bg="gray.100"
                                >
                                    <HStack justify="space-between">
                                        <Text fontWeight="semibold" color="gray.800" fontSize="sm">
                                            {note.name}
                                        </Text>
                                        <Badge colorScheme="gray" fontSize="2xs">
                                            {note.date_created || 'no date'}
                                        </Badge>
                                    </HStack>
                                    <Text color="gray.700" fontSize="sm" whiteSpace="pre-wrap">
                                        {note.content}
                                    </Text>
                                    {note.created_by_name && (
                                        <Text color="gray.700" fontSize="xs" fontStyle="italic">
                                            by {note.created_by_name}
                                        </Text>
                                    )}
                                </Box>
                            ))}
                        </VStack>
                    </Collapse>
                </Box>
            )}
        </VStack>
    );
}

export default PlanProgress;
