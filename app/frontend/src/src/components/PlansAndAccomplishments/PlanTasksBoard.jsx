import React, { useMemo, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Checkbox,
    HStack,
    Link as ChakraLink,
    Select,
    Spinner,
    Text,
    VStack,
    useToast,
} from '@chakra-ui/react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { fetchPlansTasks } from '../../services/api/get';
import { setPlanSubtaskCompleted } from '../../services/api/put';
import useResource from '../../hooks/useResource';
import { KEYS } from '../../context/resourceKeys';
import { getPlanStatusColorScheme } from '../../styles/planStatusColors';

const UNASSIGNED = '__unassigned__';

/**
 * The cross-plan task list: every progress subtask across the campus+year's
 * visible plans, answering "what is open, who owes it, and what is overdue"
 * without opening plans one by one. Overdue rows lead (the backend sorts by
 * due date; the overdue flag is derived there too). Tasks complete in place
 * (the same Asana-first write the plan detail uses), and each row links to
 * its plan for everything deeper.
 *
 * Props:
 *   year   The academic year the board is scoped to (from the manager).
 */
function PlanTasksBoard({ year }) {
    const { campus } = useParams();
    const toast = useToast();

    const { data: resp, loading, error, reload } = useResource(
        campus && year ? KEYS.plansTasks(campus, year) : null,
        () => fetchPlansTasks(campus, year),
    );
    const tasks = useMemo(() => resp?.data?.tasks || [], [resp]);

    const [openOnly, setOpenOnly] = useState(true);
    const [assigneeFilter, setAssigneeFilter] = useState('');
    const [busyGid, setBusyGid] = useState(null);

    // The owner filter's options: everyone who actually owes something here.
    const owners = useMemo(() => {
        const seen = new Map();
        tasks.forEach((t) => {
            const key = t.assigned_to?.unique_id;
            const label = t.assigned_to?.name || t.assignee_name;
            if (key && !seen.has(key)) seen.set(key, label);
        });
        return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    }, [tasks]);

    const visible = useMemo(() => tasks.filter((t) => {
        if (openOnly && t.completed) return false;
        if (assigneeFilter === UNASSIGNED) return !t.assigned_to && !t.assignee_name;
        if (assigneeFilter) return t.assigned_to?.unique_id === assigneeFilter;
        return true;
    }), [tasks, openOnly, assigneeFilter]);

    const overdueCount = useMemo(
        () => tasks.filter((t) => t.overdue).length, [tasks],
    );

    const handleToggle = async (task) => {
        setBusyGid(task.asana_gid);
        try {
            await setPlanSubtaskCompleted(task.plan.unique_id, task.asana_gid, !task.completed);
            await reload();
        } catch (e) {
            toast({
                title: 'Could not update the task in Asana',
                description: e?.response?.data?.error || e?.message,
                status: 'error', duration: 4000, isClosable: true,
            });
        } finally {
            setBusyGid(null);
        }
    };

    if (loading) {
        return (
            <HStack p={6} color="gray.700" fontSize="sm">
                <Spinner size="sm" color="teal.500" />
                <Text>Loading the task list…</Text>
            </HStack>
        );
    }

    return (
        <Box p={4}>
            <HStack spacing={3} mb={3} wrap="wrap">
                <Select
                    size="sm" maxW="260px" bg="white"
                    aria-label="Filter by owner"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                    borderColor="gray.300"
                >
                    <option value="">All owners</option>
                    <option value={UNASSIGNED}>Unassigned</option>
                    {owners.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                </Select>
                <Button
                    size="sm"
                    colorScheme="blue"
                    variant={openOnly ? 'solid' : 'outline'}
                    bg={openOnly ? undefined : 'white'}
                    onClick={() => setOpenOnly((v) => !v)}
                    aria-pressed={openOnly}
                >
                    Open only
                </Button>
                <Text fontSize="xs" color="gray.700">
                    {visible.length} task{visible.length === 1 ? '' : 's'}
                    {overdueCount > 0 ? ` · ${overdueCount} overdue` : ''}
                </Text>
            </HStack>

            {error && (
                <Text fontSize="sm" color="red.600" mb={3}>Could not load the task list.</Text>
            )}

            {visible.length === 0 && !error ? (
                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                    Nothing here. Progress tasks live on each plan; add one from a
                    plan's Progress section.
                </Text>
            ) : (
                <VStack align="stretch" spacing={1}>
                    {visible.map((task) => (
                        <HStack
                            key={task.asana_gid}
                            align="start"
                            px={3} py={2}
                            borderWidth="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            borderLeftWidth="3px"
                            borderLeftColor={task.overdue ? 'red.400'
                                : task.completed ? 'green.300' : 'gray.300'}
                            bg={task.completed ? 'green.50' : 'white'}
                            spacing={2}
                        >
                            <Checkbox
                                colorScheme="green"
                                isChecked={Boolean(task.completed)}
                                isDisabled={busyGid === task.asana_gid}
                                onChange={() => handleToggle(task)}
                                aria-label={`${task.completed ? 'Reopen' : 'Complete'}: ${task.name || 'untitled task'}`}
                                mt={0.5}
                            />
                            <Box flex="1" minW="0">
                                <HStack spacing={2} align="center" wrap="wrap">
                                    <Text
                                        fontSize="sm"
                                        color={task.completed ? 'gray.700' : 'gray.800'}
                                        textDecoration={task.completed ? 'line-through' : 'none'}
                                    >
                                        {task.name || '(untitled task)'}
                                    </Text>
                                    {task.task_status && (
                                        <Badge colorScheme={getPlanStatusColorScheme(task.task_status)}
                                               variant="subtle" fontSize="2xs" textTransform="none">
                                            {task.task_status}
                                        </Badge>
                                    )}
                                    {task.overdue && (
                                        <Badge colorScheme="red" variant="subtle" fontSize="2xs">Overdue</Badge>
                                    )}
                                </HStack>
                                <HStack spacing={2} mt={0.5} wrap="wrap">
                                    <ChakraLink
                                        as={RouterLink}
                                        to={`/${campus}/ati-explorer/plans/${task.plan.unique_id}`}
                                        fontSize="2xs" color="teal.700"
                                        _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
                                    >
                                        {task.plan.name || '(untitled plan)'}
                                    </ChakraLink>
                                    {(task.assigned_to?.name || task.assignee_name) && (
                                        <Text fontSize="2xs" color="gray.700">
                                            {task.assigned_to?.name || task.assignee_name}
                                        </Text>
                                    )}
                                    {task.due_on && (
                                        <Text fontSize="2xs" color={task.overdue ? 'red.600' : 'gray.700'}>
                                            due {task.due_on}
                                        </Text>
                                    )}
                                </HStack>
                            </Box>
                            {busyGid === task.asana_gid && <Spinner size="xs" color="teal.500" mt={1} />}
                        </HStack>
                    ))}
                </VStack>
            )}
        </Box>
    );
}

export default PlanTasksBoard;
