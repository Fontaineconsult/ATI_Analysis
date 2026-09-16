import React, { useMemo, useState } from 'react';
import {
    Badge, Box, Button, Collapse, Heading, HStack, IconButton, Input, Modal, ModalBody,
    ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Progress, Select, Spinner, Text,
    useDisclosure, useToast, VStack, Wrap, WrapItem,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { FaPlus } from 'react-icons/fa';
import useResource from '../../../../hooks/useResource';
import { KEYS } from '../../../../context/resourceKeys';
import { fetchPlanAsanaSubtasks } from '../../../../services/api/get';
import { addPlanSubtask } from '../../../../services/api/post';
import { setPlanSubtaskCompleted } from '../../../../services/api/put';
import { getPlanStatusColor, getPlanStatusLabel } from '../../../../styles/planStatusColors';
import { getWorkingGroupIdentity } from '../../../../styles/workingGroupIdentity';
import PlanEditForm from '../../../PlansAndAccomplishments/PlanEditForm';
import TaskRow from './TaskRow';
import { T } from '../../presentScale';

/**
 * The plan as a page, not a form. Identity band, the description as text,
 * then Progress as the load-bearing section: a done / total meter, open
 * tasks as full-width rows with owner, due date and OVERDUE / UNOWNED spelled
 * out, completed tasks folded to a count. Completing a task or adding a next
 * step uses the same Asana-first writes the desk view makes. A pencil opens
 * the existing edit form in a modal for the rare live correction. The
 * indicators the plan furthers live in the notes column (IndicatorsPanel).
 *
 * Each task row opens into its details and an in-place editor (TaskRow).
 *
 * Props:
 *   plan           The plan on stage (board row shape).
 *   campus, year   Coordinates for the add-task write.
 *   people         Active Person rows for the owner picker.
 *   onChanged()    After any write, so the shell can refresh the board.
 *   addStepRef     Ref placed on the "Add next step" button (the n shortcut).
 */
function PlanStage({ plan, campus, year, people = [], onChanged, addStepRef }) {
    const toast = useToast();
    const editModal = useDisclosure();
    const [busyGid, setBusyGid] = useState(null);
    const [showDone, setShowDone] = useState(false);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAssignee, setNewAssignee] = useState('');
    const [newDue, setNewDue] = useState('');
    const [saving, setSaving] = useState(false);

    const planId = plan?.unique_id || null;
    const { data: subsResp, loading: subsLoading, reload: reloadSubs } = useResource(
        planId ? KEYS.planAsanaSubtasks(planId) : null,
        () => fetchPlanAsanaSubtasks(planId),
    );
    const subtasks = useMemo(() => subsResp || [], [subsResp]);

    const today = new Date().toISOString().slice(0, 10);
    const open = subtasks.filter((s) => !s.completed);
    const done = subtasks.filter((s) => s.completed);
    const overdueOf = (s) => Boolean(!s.completed && s.due_on && s.due_on < today);
    // Overdue first, then by due date, then unowned before owned.
    const openSorted = [...open].sort((a, b) => {
        const ao = overdueOf(a) ? 0 : 1, bo = overdueOf(b) ? 0 : 1;
        if (ao !== bo) return ao - bo;
        return (a.due_on || '9999-12-31').localeCompare(b.due_on || '9999-12-31');
    });

    const showError = (title) => (e) => toast({
        title, description: e?.response?.data?.error || e?.message,
        status: 'error', duration: 4000, isClosable: true,
    });

    const toggle = async (sub) => {
        setBusyGid(sub.asana_gid);
        try {
            await setPlanSubtaskCompleted(planId, sub.asana_gid, !sub.completed);
            await reloadSubs();
            if (onChanged) onChanged();
        } catch (e) {
            showError('Could not update the task in Asana')(e);
        } finally {
            setBusyGid(null);
        }
    };

    const addStep = async () => {
        if (!newName.trim()) return;
        setSaving(true);
        try {
            await addPlanSubtask(planId, {
                name: newName.trim(),
                assigneePersonId: newAssignee || null,
                dueOn: newDue || null,
                yearName: year,
                campusAbbrev: campus,
            });
            setNewName(''); setNewAssignee(''); setNewDue('');
            setAdding(false);
            await reloadSubs();
            if (onChanged) onChanged();
        } catch (e) {
            showError('Could not add the next step')(e);
        } finally {
            setSaving(false);
        }
    };

    if (!plan) {
        return (
            <Box h="100%" display="flex" alignItems="center" justifyContent="center" p={10}>
                <Text fontSize={T.body} color="gray.700" fontStyle="italic">
                    No plan on stage. Pick one from the agenda.
                </Text>
            </Box>
        );
    }

    const status = getPlanStatusColor(plan);
    const wg = getWorkingGroupIdentity(plan.workingGroup || plan.working_groups?.[0]);
    const doneCount = done.length;
    const total = subtasks.length;

    return (
        <Box as="section" aria-label="Plan on stage" h="100%" overflowY="auto" minW="0" px={{ base: 4, xl: 8 }} py={5}>
            <VStack align="stretch" spacing={5} maxW="1100px" mx="auto">
                {/* Identity band */}
                <Box>
                    <HStack align="start" spacing={3}>
                        <Heading as="h1" fontSize={T.title} lineHeight="1.2" color="gray.800" flex="1" minW="0">
                            {plan.name || '(untitled plan)'}
                        </Heading>
                        <IconButton
                            aria-label="Edit plan details"
                            title="Edit plan details"
                            icon={<EditIcon />}
                            size="sm"
                            variant="outline"
                            bg="white"
                            colorScheme="teal"
                            onClick={editModal.onOpen}
                        />
                    </HStack>
                    <Wrap spacing={3} mt={2} align="center">
                        <WrapItem>
                            <Text fontSize={T.meta} fontWeight="bold" textTransform="uppercase" letterSpacing="wide"
                                  color={status.fg} bg={status.bg} px={2} py={0.5} borderRadius="full">
                                {getPlanStatusLabel(plan)}
                            </Text>
                        </WrapItem>
                        {wg.name && (
                            <WrapItem>
                                <HStack spacing={1.5}>
                                    <Box w="10px" h="10px" borderRadius="full" bg={wg.accent} aria-hidden="true" />
                                    <Text fontSize={T.meta} color="gray.700" fontWeight="semibold">{wg.name}</Text>
                                </HStack>
                            </WrapItem>
                        )}
                        {plan.goalNumber != null && (
                            <WrapItem><Text fontSize={T.meta} color="gray.700">Goal {plan.goalNumber}</Text></WrapItem>
                        )}
                        {plan.is_campus_plan && (
                            <WrapItem><Badge colorScheme="green" fontSize={T.meta} textTransform="none">Campus plan</Badge></WrapItem>
                        )}
                        {plan.is_key_plan && (
                            <WrapItem><Badge colorScheme="purple" fontSize={T.meta} textTransform="none">Key plan</Badge></WrapItem>
                        )}
                    </Wrap>
                </Box>

                {plan.description && (
                    <Text fontSize={T.body} color="gray.800" lineHeight="1.5" whiteSpace="pre-wrap">
                        {plan.description}
                    </Text>
                )}

                {/* Progress */}
                <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={5}>
                    <HStack justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                        <Heading as="h2" fontSize={T.heading} color="teal.700">Progress</Heading>
                        <HStack spacing={3}>
                            {total > 0 && (
                                <Text fontSize={T.meta} color="gray.700" fontWeight="semibold">
                                    {doneCount} / {total} done
                                </Text>
                            )}
                            <Button
                                ref={addStepRef}
                                size="sm"
                                colorScheme="teal"
                                variant={adding ? 'solid' : 'outline'}
                                bg={adding ? undefined : 'white'}
                                leftIcon={<FaPlus />}
                                onClick={() => setAdding((v) => !v)}
                                title="Add next step (n)"
                            >
                                {adding ? 'Cancel' : 'Add next step'}
                            </Button>
                        </HStack>
                    </HStack>
                    {total > 0 && (
                        <Progress value={(doneCount / total) * 100} size="sm" colorScheme="green" borderRadius="full"
                                  bg="gray.200" mb={4} aria-label={`${doneCount} of ${total} tasks done`} />
                    )}

                    {adding && (
                        <Box p={3} mb={3} borderWidth="1px" borderColor="gray.300" borderRadius="md" bg="gray.50">
                            <VStack spacing={2} align="stretch">
                                <Input size="md" bg="white" fontSize={T.body} borderColor="gray.300" autoFocus
                                       placeholder="What is the next step?" aria-label="Next step"
                                       value={newName} onChange={(e) => setNewName(e.target.value)}
                                       onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }} />
                                <HStack spacing={2} wrap="wrap">
                                    <Select size="sm" bg="white" maxW="260px" fontSize={T.meta} borderColor="gray.300"
                                            aria-label="Owner" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
                                        <option value="">Unowned</option>
                                        {people.map((p) => <option key={p.unique_id} value={p.unique_id}>{p.name}</option>)}
                                    </Select>
                                    <Input size="sm" type="date" bg="white" maxW="180px" fontSize={T.meta} borderColor="gray.300"
                                           aria-label="Due date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
                                    <Box flex="1" />
                                    <Button size="sm" colorScheme="teal" onClick={addStep} isLoading={saving}
                                            isDisabled={!newName.trim()}>
                                        Save to Asana
                                    </Button>
                                </HStack>
                            </VStack>
                        </Box>
                    )}

                    {subsLoading ? (
                        <HStack color="gray.700"><Spinner size="sm" color="teal.500" /><Text fontSize={T.body}>Loading progress…</Text></HStack>
                    ) : total === 0 ? (
                        <Text fontSize={T.body} color={plan.plan_status === 'In Progress' ? 'orange.800' : 'gray.700'} fontStyle="italic">
                            {plan.plan_status === 'In Progress'
                                ? 'In progress with no recorded next step.'
                                : 'No tasks recorded.'}
                        </Text>
                    ) : (
                        <VStack align="stretch" spacing={2}>
                            {openSorted.length === 0 && (
                                <Text fontSize={T.body} color="orange.800" fontStyle="italic">
                                    Every task is done. Add the next step or close the plan.
                                </Text>
                            )}
                            {openSorted.map((sub) => (
                                <TaskRow
                                    key={sub.asana_gid}
                                    planUniqueId={planId}
                                    sub={sub}
                                    people={people}
                                    today={today}
                                    busy={busyGid === sub.asana_gid}
                                    onToggle={toggle}
                                    onSaved={async () => { await reloadSubs(); if (onChanged) onChanged(); }}
                                    onError={showError('Could not save the task')}
                                />
                            ))}
                            {done.length > 0 && (
                                <Box pt={1}>
                                    <Button size="sm" variant="outline" bg="white" colorScheme="gray"
                                            onClick={() => setShowDone((v) => !v)} aria-expanded={showDone}>
                                        {showDone ? 'Hide' : 'Show'} {done.length} completed
                                    </Button>
                                    <Collapse in={showDone} animateOpacity unmountOnExit>
                                        <VStack align="stretch" spacing={1.5} mt={2}>
                                            {done.map((sub) => (
                                                <TaskRow
                                                    key={sub.asana_gid}
                                                    planUniqueId={planId}
                                                    sub={sub}
                                                    people={people}
                                                    today={today}
                                                    busy={busyGid === sub.asana_gid}
                                                    onToggle={toggle}
                                                    onSaved={async () => { await reloadSubs(); if (onChanged) onChanged(); }}
                                                    onError={showError('Could not save the task')}
                                                />
                                            ))}
                                        </VStack>
                                    </Collapse>
                                </Box>
                            )}
                        </VStack>
                    )}
                </Box>

            </VStack>

            <Modal isOpen={editModal.isOpen} onClose={editModal.onClose} size="2xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" color="teal.700">Edit plan</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <PlanEditForm
                            key={plan.unique_id}
                            plan={plan}
                            onClose={editModal.onClose}
                            onSuccess={() => { editModal.onClose(); if (onChanged) onChanged(); }}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default PlanStage;
