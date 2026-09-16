import React, { useEffect, useMemo, useState } from 'react';
import {
    Box, Button, Checkbox, FormControl, FormHelperText, FormLabel, HStack, Input, Modal, ModalBody,
    ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select, Spinner, Switch,
    Text, Textarea, useToast, VStack,
} from '@chakra-ui/react';
import useResource from '../../../../hooks/useResource';
import { KEYS } from '../../../../context/resourceKeys';
import { fetchYsesByCampusForYear } from '../../../../services/api/get';
import { addPlanSubtask, createPlan } from '../../../../services/api/post';
import { T } from '../../presentScale';

/**
 * A plan proposed in the room, recorded while the room is still there.
 *
 * The desk's Add Plan modal takes a name, a description, a Year Success
 * Evidence and a status. This one takes the same plan and adds what a meeting
 * knows that a desk does not: which campus and working group are proposing
 * it, the first next step with an owner (so the plan is never born with the
 * no-next-step flag), and the meeting it came out of. The write order is:
 *
 *   1. open today's minutes for the working group (only when "Record in the
 *      minutes" is on), so the plan can carry its origin;
 *   2. POST /plans with minutes_unique_id, which sets plan -[raised_in]-> minutes
 *      and returns the created plan;
 *   3. the first next step as an Asana subtask on the new plan, raised_in the
 *      same minutes;
 *   4. a "Decision: New plan: <name>" line under the plan's heading, which
 *      asserts minutes -[discusses]-> plan the way any note does.
 *
 * Steps 3 and 4 failing after step 2 succeeded leave a plan that exists; the
 * form says so and still hands the plan to the shell, because the room needs
 * it on stage more than it needs a clean transaction.
 *
 * The indicator list is the year's catalogue (`/evidence/yses-by-campus`),
 * the same read the desk's evidence picker makes, filtered to the chosen
 * campus and working group. Nothing here walks the dashboard payload.
 *
 * Status defaults to In Progress because only plans in progress are on deck;
 * a Not Started plan is created but the form says it will not appear until
 * it is started.
 *
 * Props:
 *   isOpen, onClose
 *   campus              The URL campus (the one holding the meeting). Default campus.
 *   year                Academic year name.
 *   campusOptions       [{ abbreviation, name }] from settings.
 *   workingGroups       [{ slug, name }] active this year.
 *   defaultWorkingGroup Working group NAME to preselect (the filter or the plan on stage).
 *   people              Active Person rows for the first-step owner picker.
 *   ensureMinutes(wgName)                 -> Promise<minutes record>
 *   appendMinutes(wgName, { text, planUniqueId, kind }) -> Promise
 *   onCreated(plan, { campusAbbrev, workingGroupSlug, workingGroupName, onDeck })
 */

export const NEW_PLAN_STATUSES = ['In Progress', 'Not Started'];

/** The POST /plans body for the form's values. Exported for the test. */
export function buildNewPlanPayload(values, { year, minutesUniqueId = null }) {
    return {
        name: values.name.trim(),
        description: values.description.trim(),
        academic_year_name: year,
        furthered_yse_identifier: values.yseIdentifier,
        plan_status: values.status,
        is_key_plan: Boolean(values.isKeyPlan),
        is_campus_plan: Boolean(values.isCampusPlan),
        ...(minutesUniqueId ? { minutes_unique_id: minutesUniqueId } : {}),
    };
}

const EMPTY = {
    name: '', description: '', campus: '', workingGroup: '', yseIdentifier: '',
    status: 'In Progress', isKeyPlan: false, isCampusPlan: false,
    stepName: '', stepAssignee: '', stepDue: '', recordInMinutes: true,
};

function NewPlanForm({
    isOpen, onClose, campus, year, campusOptions = [], workingGroups = [], defaultWorkingGroup,
    people = [], ensureMinutes, appendMinutes, onCreated,
}) {
    const toast = useToast();
    const [values, setValues] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const set = (patch) => setValues((v) => ({ ...v, ...patch }));

    // Fresh defaults each time the form opens: the meeting's campus, the
    // group on the filter or on stage, and nothing typed.
    useEffect(() => {
        if (!isOpen) return;
        setValues({
            ...EMPTY,
            campus: campus || campusOptions[0]?.abbreviation || '',
            workingGroup: defaultWorkingGroup || workingGroups[0]?.name || '',
        });
        setError(null);
    }, [isOpen, campus, defaultWorkingGroup, campusOptions, workingGroups]);

    const { data: catalogueResp, loading: catalogueLoading, error: catalogueError } = useResource(
        isOpen && year ? KEYS.ysesByCampus(year) : null,
        () => fetchYsesByCampusForYear(year),
    );
    const catalogue = useMemo(() => catalogueResp?.data || catalogueResp || null, [catalogueResp]);

    // The indicators the chosen campus's working group tracks this year.
    const yseOptions = useMemo(() => {
        const campusEntry = (catalogue?.campuses || []).find((c) => c.abbreviation === values.campus);
        const group = (campusEntry?.working_groups || []).find((g) => g.name === values.workingGroup);
        return group?.yses || [];
    }, [catalogue, values.campus, values.workingGroup]);

    // A stale indicator choice (campus or group changed under it) is dropped.
    useEffect(() => {
        if (values.yseIdentifier && !yseOptions.some((y) => y.year_identifier === values.yseIdentifier)) {
            set({ yseIdentifier: '' });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [yseOptions]);

    const wgSlug = workingGroups.find((w) => w.name === values.workingGroup)?.slug || null;
    const canSave = values.name.trim() && values.description.trim() && values.yseIdentifier && !saving;

    const submit = async () => {
        if (!canSave) return;
        setSaving(true);
        setError(null);
        const name = values.name.trim();
        let minutesRecord = null;
        let plan = null;
        try {
            if (values.recordInMinutes) {
                minutesRecord = await ensureMinutes(values.workingGroup);
            }
            const resp = await createPlan(buildNewPlanPayload(values, {
                year, minutesUniqueId: minutesRecord?.unique_id || null,
            }));
            plan = resp?.data?.plan;
            if (!plan?.unique_id) throw new Error('The plan was created but did not come back with an id.');
        } catch (e) {
            setError(e?.response?.data?.error || e?.message || 'Could not create the plan.');
            setSaving(false);
            return;
        }

        // The plan exists from here on. What follows is best effort and reported.
        const warnings = [];
        if (values.stepName.trim()) {
            try {
                await addPlanSubtask(plan.unique_id, {
                    name: values.stepName.trim(),
                    assigneePersonId: values.stepAssignee || null,
                    dueOn: values.stepDue || null,
                    yearName: year,
                    campusAbbrev: campus,
                    minutesUniqueId: minutesRecord?.unique_id || null,
                });
            } catch (e) {
                warnings.push(`The first next step was not saved to Asana: ${e?.response?.data?.error || e?.message}`);
            }
        }
        if (minutesRecord) {
            try {
                await appendMinutes(values.workingGroup, {
                    text: `New plan: ${name}`, planUniqueId: plan.unique_id, kind: 'decision',
                });
            } catch (e) {
                warnings.push(`The minutes line was not written: ${e?.response?.data?.error || e?.message}`);
            }
        }

        const onDeck = values.status === 'In Progress';
        toast({
            title: `Plan created: ${name}`,
            description: warnings.length
                ? warnings.join(' ')
                : (onDeck ? undefined : 'Not started, so it is not on deck until it is in progress.'),
            status: warnings.length ? 'warning' : 'success',
            duration: warnings.length ? 9000 : 4000,
            isClosable: true,
        });
        setSaving(false);
        onClose();
        if (onCreated) {
            onCreated(plan, {
                campusAbbrev: values.campus, workingGroupSlug: wgSlug, workingGroupName: values.workingGroup, onDeck,
            });
        }
    };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); }
    };

    return (
        <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent onKeyDown={onKeyDown}>
                <ModalHeader fontSize={T.heading} color="teal.700">New plan</ModalHeader>
                <ModalCloseButton isDisabled={saving} />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel fontSize={T.meta} fontWeight="bold" color="gray.800" mb={1}>Name</FormLabel>
                            <Input size="md" bg="white" fontSize={T.body} borderColor="gray.300" autoFocus
                                   value={values.name} onChange={(e) => set({ name: e.target.value })}
                                   placeholder="What the plan is called" />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel fontSize={T.meta} fontWeight="bold" color="gray.800" mb={1}>Description</FormLabel>
                            <Textarea size="md" bg="white" fontSize={T.body} borderColor="gray.300" rows={3}
                                      value={values.description} onChange={(e) => set({ description: e.target.value })}
                                      placeholder="What the plan will do, in a sentence or two" />
                        </FormControl>

                        <HStack spacing={3} align="start" wrap="wrap">
                            <FormControl isRequired flex="1" minW="160px">
                                <FormLabel fontSize={T.meta} fontWeight="bold" color="gray.800" mb={1}>Campus</FormLabel>
                                <Select size="md" bg="white" fontSize={T.body} borderColor="gray.300"
                                        value={values.campus} onChange={(e) => set({ campus: e.target.value })}
                                        aria-label="Campus">
                                    {campusOptions.map((c) => (
                                        <option key={c.abbreviation} value={c.abbreviation}>{c.name || c.abbreviation}</option>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl isRequired flex="1" minW="160px">
                                <FormLabel fontSize={T.meta} fontWeight="bold" color="gray.800" mb={1}>Working group</FormLabel>
                                <Select size="md" bg="white" fontSize={T.body} borderColor="gray.300"
                                        value={values.workingGroup} onChange={(e) => set({ workingGroup: e.target.value })}
                                        aria-label="Working group">
                                    {workingGroups.map((w) => <option key={w.slug} value={w.name}>{w.name}</option>)}
                                </Select>
                            </FormControl>
                        </HStack>

                        <FormControl isRequired>
                            <FormLabel fontSize={T.meta} fontWeight="bold" color="gray.800" mb={1}>Indicator the plan furthers</FormLabel>
                            {catalogueLoading ? (
                                <HStack color="gray.700"><Spinner size="sm" color="teal.500" /><Text fontSize={T.body}>Loading indicators…</Text></HStack>
                            ) : (
                                <Select size="md" bg="white" fontSize={T.body} borderColor="gray.300"
                                        value={values.yseIdentifier} onChange={(e) => set({ yseIdentifier: e.target.value })}
                                        aria-label="Indicator" placeholder={yseOptions.length ? 'Choose an indicator' : 'No indicators for this campus and group'}
                                        isDisabled={yseOptions.length === 0}>
                                    {yseOptions.map((y) => (
                                        <option key={y.year_identifier} value={y.year_identifier}>
                                            {y.indicator_composite_key}
                                            {y.indicator_description ? ` · ${y.indicator_description}` : ''}
                                        </option>
                                    ))}
                                </Select>
                            )}
                            {catalogueError && (
                                <FormHelperText color="red.700" fontSize={T.meta}>Could not load the indicators: {catalogueError}</FormHelperText>
                            )}
                        </FormControl>

                        <HStack spacing={6} align="start" wrap="wrap">
                            <FormControl flex="1" minW="160px">
                                <FormLabel fontSize={T.meta} fontWeight="bold" color="gray.800" mb={1}>Status</FormLabel>
                                <Select size="md" bg="white" fontSize={T.body} borderColor="gray.300"
                                        value={values.status} onChange={(e) => set({ status: e.target.value })}
                                        aria-label="Status">
                                    {NEW_PLAN_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </Select>
                                {values.status !== 'In Progress' && (
                                    <FormHelperText fontSize={T.meta} color="orange.800">
                                        Only plans in progress are on deck. This one will not appear until it is started.
                                    </FormHelperText>
                                )}
                            </FormControl>
                            <FormControl display="flex" alignItems="center" w="auto" pt={{ base: 0, md: 8 }}>
                                <FormLabel fontSize={T.meta} fontWeight="bold" color="gray.800" mb={0} mr={2}>Key plan</FormLabel>
                                <Switch colorScheme="purple" isChecked={values.isKeyPlan}
                                        onChange={(e) => set({ isKeyPlan: e.target.checked })} />
                            </FormControl>
                            <FormControl display="flex" alignItems="center" w="auto" pt={{ base: 0, md: 8 }}>
                                <FormLabel fontSize={T.meta} fontWeight="bold" color="gray.800" mb={0} mr={2}>Campus plan</FormLabel>
                                <Switch colorScheme="green" isChecked={values.isCampusPlan}
                                        onChange={(e) => set({ isCampusPlan: e.target.checked })} />
                            </FormControl>
                        </HStack>

                        {/* The first next step, so the plan is not born without one. */}
                        <Box p={3} borderWidth="1px" borderColor="gray.300" borderRadius="md" bg="gray.50">
                            <Text fontSize={T.meta} fontWeight="bold" color="gray.800" mb={2}>First next step (optional)</Text>
                            <VStack spacing={2} align="stretch">
                                <Input size="md" bg="white" fontSize={T.body} borderColor="gray.300"
                                       placeholder="What happens first?" aria-label="First next step"
                                       value={values.stepName} onChange={(e) => set({ stepName: e.target.value })} />
                                <HStack spacing={2} wrap="wrap">
                                    <Select size="sm" bg="white" maxW="260px" fontSize={T.meta} borderColor="gray.300"
                                            aria-label="Step owner" value={values.stepAssignee}
                                            onChange={(e) => set({ stepAssignee: e.target.value })}>
                                        <option value="">Unowned</option>
                                        {people.map((p) => <option key={p.unique_id} value={p.unique_id}>{p.name}</option>)}
                                    </Select>
                                    <Input size="sm" type="date" bg="white" maxW="180px" fontSize={T.meta} borderColor="gray.300"
                                           aria-label="Step due date" value={values.stepDue}
                                           onChange={(e) => set({ stepDue: e.target.value })} />
                                </HStack>
                            </VStack>
                        </Box>

                        <Checkbox colorScheme="teal" isChecked={values.recordInMinutes}
                                  onChange={(e) => set({ recordInMinutes: e.target.checked })}>
                            <Text fontSize={T.body} as="span">
                                Record in the minutes as a decision of the {values.workingGroup || 'working'} group
                            </Text>
                        </Checkbox>

                        {error && <Text role="alert" fontSize={T.meta} color="red.700">{error}</Text>}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="md" variant="outline" bg="white" mr={3} onClick={onClose} isDisabled={saving}>Cancel</Button>
                    <Button size="md" colorScheme="teal" onClick={submit} isLoading={saving} isDisabled={!canSave}
                            title="Create the plan (Ctrl+Enter)">
                        Create plan
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default NewPlanForm;
