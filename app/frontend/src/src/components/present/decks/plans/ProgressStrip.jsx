import React from 'react';
import { HStack, Text } from '@chakra-ui/react';
import { T } from '../../presentScale';

/**
 * One line of figures under the bar, in place of four stat cards. The last
 * figure is the one the desk view cannot show: tasks completed since the
 * working group last met, from AsanaSubtask.completed_at against the
 * previous minutes record's meeting_date.
 *
 * Props:
 *   plans            The visible (filtered) plans.
 *   tasks            Every task on the board (tasks_board rows) for the same filter.
 *   sinceDate        'YYYY-MM-DD' of the previous meeting, or null when unknown.
 */
export function completedSince(tasks = [], sinceDate) {
    if (!sinceDate) return null;
    return tasks.filter((t) => t.completed && t.completed_at && t.completed_at.slice(0, 10) >= sinceDate).length;
}

function Figure({ value, label, tone = 'gray.800' }) {
    return (
        <HStack spacing={1.5} align="baseline">
            <Text fontSize={T.heading} fontWeight="bold" color={tone} lineHeight="1">{value}</Text>
            <Text fontSize={T.meta} color="gray.700">{label}</Text>
        </HStack>
    );
}

function ProgressStrip({ plans = [], tasks = [], sinceDate = null }) {
    const openTasks = plans.reduce((n, p) => n + (p.tasks_open || 0), 0);
    const overdue = plans.reduce((n, p) => n + (p.tasks_overdue || 0), 0);
    const noNext = plans.filter((p) => p.no_next_step).length;
    const since = completedSince(tasks, sinceDate);

    return (
        <HStack as="section" aria-label="Progress figures" spacing={{ base: 4, xl: 8 }} px={4} py={2}
                bg="white" borderBottomWidth="1px" borderColor="gray.200" wrap="wrap" rowGap={1}>
            <Figure value={plans.length} label={plans.length === 1 ? 'plan in progress' : 'plans in progress'} />
            <Figure value={openTasks} label="open tasks" tone={openTasks ? 'blue.700' : 'gray.800'} />
            <Figure value={overdue} label="overdue" tone={overdue ? 'red.700' : 'gray.800'} />
            <Figure value={noNext} label="without a next step" tone={noNext ? 'orange.800' : 'gray.800'} />
            {since != null && (
                <Figure value={since} label={`completed since ${sinceDate}`} tone={since ? 'green.700' : 'gray.800'} />
            )}
        </HStack>
    );
}

export default ProgressStrip;
