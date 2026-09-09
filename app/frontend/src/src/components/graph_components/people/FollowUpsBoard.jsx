import React, { useCallback, useMemo, useState } from 'react';
import {
    Badge, Box, Button, Collapse, Flex, Heading, HStack, Input, Spinner,
    Stat, StatLabel, StatNumber, Text, VStack, useToast,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { fetchFollowUpBoard } from '../../../services/api/get';
import {
    markFollowUpSent, setFollowUpStatus,
    settleQuery, updateRecommendation, updateConcern,
} from '../../../services/api/put';
import useResource from '../../../hooks/useResource';
import { KEYS } from '../../../context/resourceKeys';
import NextContactEditor, { contactDueState } from './NextContactEditor';

function StatCard({ label, value, accent }) {
    return (
        <Box flex="1" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg"
             boxShadow="sm" p={4} borderTopWidth="3px" borderTopColor={accent}>
            <Stat>
                <StatLabel fontSize="xs" color="gray.700" textTransform="uppercase">{label}</StatLabel>
                <StatNumber fontSize="2xl" color="gray.800">{value}</StatNumber>
            </Stat>
        </Box>
    );
}

const TASK_TYPE = {
    query: { label: 'Query', colorScheme: 'blue' },
    recommendation: { label: 'Recommendation', colorScheme: 'purple' },
    concern: { label: 'Concern', colorScheme: 'orange' },
};

const TASK_STATUS = {
    open: 'orange', in_progress: 'blue',
    settled: 'green', addressed: 'green', converted: 'green',
    dismissed: 'gray',
};

const isTaskResolved = (type, status) =>
    (type === 'query' ? status === 'settled' : status !== 'open');

/** One task a chase carried, with its resolve control. Settling a query
 *  requires the answer text — the record of what actually came back. */
function TaskRow({ type, task, text, busy, onResolve }) {
    const [settling, setSettling] = useState(false);
    const [answer, setAnswer] = useState('');
    const resolved = isTaskResolved(type, task.status);

    return (
        <Box borderWidth="1px" borderColor="gray.300" borderRadius="md" bg="gray.100" px={2} py={1.5}>
            <Flex gap={2} align="center" wrap="wrap">
                <Badge colorScheme={TASK_TYPE[type].colorScheme} variant="subtle" fontSize="2xs">
                    {TASK_TYPE[type].label}
                </Badge>
                <Text fontSize="xs" color="gray.800" flex="1" minW="180px">{text}</Text>
                <Badge colorScheme={TASK_STATUS[task.status] || 'gray'} variant="subtle"
                       fontSize="2xs" textTransform="none">
                    {task.status}
                </Badge>
                {!resolved && type === 'query' && (
                    <Button size="xs" variant="outline" bg="white" colorScheme="teal"
                            onClick={() => setSettling((s) => !s)} aria-expanded={settling}>
                        Settle…
                    </Button>
                )}
                {!resolved && type === 'recommendation' && (
                    <>
                        <Button size="xs" variant="outline" bg="white" colorScheme="green"
                                isDisabled={busy} onClick={() => onResolve(type, task, 'addressed')}>
                            Addressed
                        </Button>
                        <Button size="xs" variant="ghost" colorScheme="gray"
                                isDisabled={busy} onClick={() => onResolve(type, task, 'dismissed')}>
                            Dismiss
                        </Button>
                    </>
                )}
                {!resolved && type === 'concern' && (
                    <>
                        <Button size="xs" variant="outline" bg="white" colorScheme="green"
                                isDisabled={busy} onClick={() => onResolve(type, task, 'converted')}>
                            Converted
                        </Button>
                        <Button size="xs" variant="ghost" colorScheme="gray"
                                isDisabled={busy} onClick={() => onResolve(type, task, 'dismissed')}>
                            Dismiss
                        </Button>
                    </>
                )}
            </Flex>
            {type === 'query' && (task.answerable_by || []).length > 0 && !resolved && (
                <Text fontSize="2xs" color="gray.700" mt={0.5}>
                    answer owed by {task.answerable_by.join(', ')}
                </Text>
            )}
            {settling && !resolved && (
                <HStack mt={1.5} spacing={2}>
                    <Input
                        size="xs" bg="white" flex="1"
                        placeholder="What came back — the answer that settles this"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        aria-label={`Answer for: ${text}`}
                        borderColor="gray.300"
                    />
                    <Button size="xs" colorScheme="teal" isDisabled={!answer.trim() || busy}
                            onClick={() => onResolve(type, task, answer.trim())}>
                        Save answer
                    </Button>
                </HStack>
            )}
        </Box>
    );
}

/** One chase on the board. Progress is task resolution, not reply arrival —
 *  many replies can settle nothing, and one can settle everything. The left
 *  border carries the due state ambiently; badges say it in text, so color is
 *  never the only signal. */
function ChaseCard({ row, onReload, busyId, onMarkSent, onBackToDraft, onResolveTask }) {
    const [tasksOpen, setTasksOpen] = useState(false);
    const dueState = contactDueState(row.next_contact_date);
    const sent = row.status === 'sent';
    const borderColor = dueState === 'overdue' ? 'red.400'
        : dueState === 'due' ? 'orange.400'
        : (sent && row.open_asks > 0) ? 'orange.300'
        : 'gray.300';
    const busy = busyId === row.unique_id;

    const tasks = [
        ...(row.included_queries || []).map((t) => ({ type: 'query', task: t, text: t.question })),
        ...(row.included_recommendations || []).map((t) => ({ type: 'recommendation', task: t, text: t.recommendation })),
        ...(row.included_concerns || []).map((t) => ({ type: 'concern', task: t, text: t.concern })),
    ];

    return (
        <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm"
             borderLeftWidth="3px" borderLeftColor={borderColor} p={3}>
            <Flex gap={2} align="center" wrap="wrap">
                <Text fontSize="sm" fontWeight="medium" color="gray.800" flex="1" minW="200px">
                    {row.subject}
                </Text>
                <Badge colorScheme={sent ? 'green' : 'gray'} variant="subtle" fontSize="2xs">
                    {row.status}
                </Badge>
                {row.community && (
                    <Badge colorScheme="purple" variant="subtle" fontSize="2xs" textTransform="none">
                        {row.community}
                    </Badge>
                )}
                {row.campus && (
                    <Badge colorScheme="gray" variant="outline" fontSize="2xs">{row.campus}</Badge>
                )}
                {row.total_asks > 0 && (
                    <Badge colorScheme={row.all_resolved ? 'green' : 'orange'} variant="subtle"
                           fontSize="2xs" textTransform="none">
                        {row.resolved_asks}/{row.total_asks} tasks resolved
                    </Badge>
                )}
                {row.reply_count > 0 && (
                    <Badge colorScheme="blue" variant="subtle" fontSize="2xs" textTransform="none">
                        {row.reply_count} repl{row.reply_count === 1 ? 'y' : 'ies'}
                    </Badge>
                )}
            </Flex>

            <Text fontSize="xs" color="gray.700" mt={1}>
                {row.meeting_title}
                {row.meeting_date ? ` · met ${row.meeting_date}` : ''}
                {row.date_sent ? ` · sent ${row.date_sent}` : ' · not sent'}
            </Text>

            {tasks.length > 0 && (
                <Box mt={2}>
                    <Button
                        size="xs" variant="ghost" colorScheme="teal"
                        onClick={() => setTasksOpen((o) => !o)}
                        aria-expanded={tasksOpen}
                    >
                        {tasksOpen ? 'Hide' : 'Show'} tasks ({row.open_asks} open of {row.total_asks})
                    </Button>
                    <Collapse in={tasksOpen} animateOpacity unmountOnExit>
                        <VStack align="stretch" spacing={1.5} mt={1.5}>
                            {tasks.map(({ type, task, text }) => (
                                <TaskRow
                                    key={task.unique_id} type={type} task={task} text={text}
                                    busy={busy}
                                    onResolve={(t, tk, value) => onResolveTask(row, t, tk, value)}
                                />
                            ))}
                        </VStack>
                    </Collapse>
                </Box>
            )}

            <Flex mt={2} gap={2} align="center" wrap="wrap" justify="space-between">
                <Box flex="1" minW="260px">
                    <NextContactEditor followUp={row} onSaved={onReload} />
                </Box>
                {sent ? (
                    <Button size="xs" variant="ghost" colorScheme="gray"
                            isLoading={busy}
                            onClick={() => onBackToDraft(row)}
                            title="It was not sent after all — clears the sent date">
                        Back to draft
                    </Button>
                ) : (
                    <Button size="xs" variant="outline" bg="white" colorScheme="green"
                            isLoading={busy}
                            onClick={() => onMarkSent(row)}
                            title="Record that this actually went out">
                        Mark sent
                    </Button>
                )}
            </Flex>
        </Box>
    );
}

/**
 * Every chase across every meeting — "what have we chased, what is resolved,
 * and who do we contact next". Rows arrive next-contact first from the
 * backend; the strip leads with what is due and what is still open.
 *
 * Progress is measured by RESOLVING THE TASKS a chase carried — settling its
 * queries (with the answer that came back), addressing or dismissing its
 * recommendations, converting or dismissing its concerns — never by counting
 * replies. Composition still lives with the /follow-up skill; linking an
 * inbound reply Message to its chase is an ingest-side act.
 */
export default function FollowUpsBoard() {
    const { campus } = useParams();
    const toast = useToast();
    const [busyId, setBusyId] = useState(null);

    const { data: resp, loading, error, reload } = useResource(
        KEYS.followUpBoard(campus),
        () => fetchFollowUpBoard(campus),
    );
    const rows = useMemo(() => resp?.data?.follow_ups || [], [resp]);

    // Two sections: what still has to go out, then what already went out.
    // Within each, the backend's next-contact-first order is preserved.
    const drafts = useMemo(() => rows.filter((r) => r.status !== 'sent'), [rows]);
    const sent = useMemo(() => rows.filter((r) => r.status === 'sent'), [rows]);

    const stats = useMemo(() => {
        const dueNow = rows.filter((r) => ['overdue', 'due'].includes(contactDueState(r.next_contact_date)));
        return {
            total: rows.length,
            due: dueNow.length,
            // Open tasks on SENT chases: a draft's tasks are not being chased yet.
            openTasks: sent.reduce((n, r) => n + (r.open_asks || 0), 0),
            drafts: drafts.length,
        };
    }, [rows, sent, drafts]);

    const withBusy = useCallback(async (row, fn, successTitle) => {
        setBusyId(row.unique_id);
        try {
            await fn();
            await reload();
            toast({ title: successTitle, status: 'success', duration: 2000, isClosable: true });
        } catch (e) {
            toast({
                title: 'Update failed',
                description: e?.response?.data?.error || e?.message || 'Unknown error.',
                status: 'error', duration: 3500, isClosable: true,
            });
        } finally {
            setBusyId(null);
        }
    }, [reload, toast]);

    const handleMarkSent = useCallback((row) =>
        withBusy(row, () => markFollowUpSent(row.unique_id), 'Marked sent'), [withBusy]);
    const handleBackToDraft = useCallback((row) =>
        withBusy(row, () => setFollowUpStatus(row.unique_id, 'draft'), 'Back to draft'), [withBusy]);

    // One resolve path for all three task types. For a query, `value` is the
    // answer text; for the other two it is the new status.
    const handleResolveTask = useCallback((row, type, task, value) => {
        const call = type === 'query' ? () => settleQuery(task.unique_id, value)
            : type === 'recommendation' ? () => updateRecommendation(task.unique_id, { status: value })
            : () => updateConcern(task.unique_id, { status: value });
        return withBusy(row, call, 'Task resolved');
    }, [withBusy]);

    if (loading) {
        return (
            <HStack p={4} color="gray.700" fontSize="sm">
                <Spinner size="sm" color="teal.500" />
                <Text>Loading the chase board…</Text>
            </HStack>
        );
    }

    const renderCard = (row) => (
        <ChaseCard
            key={row.unique_id} row={row}
            onReload={reload} busyId={busyId}
            onMarkSent={handleMarkSent} onBackToDraft={handleBackToDraft}
            onResolveTask={handleResolveTask}
        />
    );

    return (
        <Box>
            <HStack spacing={4} mb={4} align="stretch">
                <StatCard label="Chases" value={stats.total} accent="teal.400" />
                <StatCard label="Contacts due" value={stats.due}
                          accent={stats.due > 0 ? 'red.400' : 'gray.300'} />
                <StatCard label="Open tasks" value={stats.openTasks}
                          accent={stats.openTasks > 0 ? 'orange.400' : 'gray.300'} />
                <StatCard label="Drafts" value={stats.drafts} accent="purple.400" />
            </HStack>

            {error && (
                <Text fontSize="sm" color="red.600" mb={3}>Could not load the board.</Text>
            )}

            {!rows.length ? (
                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                    No follow-ups yet. They are composed with the /follow-up skill after a
                    meeting is ingested, then tracked here.
                </Text>
            ) : (
                <VStack align="stretch" spacing={4}>
                    {/* Not yet sent — the messages still waiting to go out. */}
                    <Box>
                        <Heading as="h3" size="xs" color="teal.700" textTransform="uppercase"
                                 letterSpacing="wide" mb={2}>
                            To send ({drafts.length})
                        </Heading>
                        {drafts.length === 0 ? (
                            <Text fontSize="sm" color="gray.700" fontStyle="italic">
                                Nothing waiting to go out.
                            </Text>
                        ) : (
                            <VStack align="stretch" spacing={2}>{drafts.map(renderCard)}</VStack>
                        )}
                    </Box>

                    {/* Sent — a visibly different box: these went out, and what is
                        tracked here is task resolution and when to nudge again. */}
                    <Box bg="green.50" borderWidth="1px" borderColor="green.200"
                         borderRadius="lg" p={3}>
                        <Flex align="center" gap={2} mb={2}>
                            <Heading as="h3" size="xs" color="green.800" textTransform="uppercase"
                                     letterSpacing="wide">
                                Sent ({sent.length})
                            </Heading>
                            <Text fontSize="2xs" color="green.800">
                                resolve the tasks as answers come back · nudge on the scheduled date
                            </Text>
                        </Flex>
                        {sent.length === 0 ? (
                            <Text fontSize="sm" color="gray.700" fontStyle="italic">
                                Nothing sent yet.
                            </Text>
                        ) : (
                            <VStack align="stretch" spacing={2}>{sent.map(renderCard)}</VStack>
                        )}
                    </Box>
                </VStack>
            )}
        </Box>
    );
}
