import React, { useCallback, useEffect, useState } from 'react';
import {
    Badge,
    Box,
    HStack,
    Icon,
    Link,
    List,
    ListItem,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { FaCheckCircle, FaRegCircle } from 'react-icons/fa';
import { fetchPlanAsanaSubtasks } from '../../services/api/get';

/**
 * Read-only list of a plan's Asana subtasks (AsanaSubtask mirror nodes).
 * Asana owns these — they're written by the "Asana Refresh" button and never
 * edited in-app, so this component renders state, not controls.
 *
 * Props:
 *   planUniqueId   The plan whose subtasks to fetch. Refetches on change.
 */
function PlanAsanaSubtasks({ planUniqueId }) {
    const [subtasks, setSubtasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        if (!planUniqueId) return;
        setLoading(true);
        setError(null);
        try {
            setSubtasks(await fetchPlanAsanaSubtasks(planUniqueId));
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        } finally {
            setLoading(false);
        }
    }, [planUniqueId]);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <HStack spacing={2} color="gray.500">
                <Spinner size="xs" />
                <Text fontSize="sm">Loading Asana subtasks…</Text>
            </HStack>
        );
    }

    if (error) {
        return <Text fontSize="sm" color="red.600">Couldn't load Asana subtasks: {error}</Text>;
    }

    if (subtasks.length === 0) {
        return (
            <Text fontSize="sm" color="gray.500" fontStyle="italic">
                No subtasks synced from Asana yet. Add subtasks to this plan's task in
                Asana, then use the "Asana Refresh" button above to mirror them here.
            </Text>
        );
    }

    const doneCount = subtasks.filter((s) => s.completed).length;
    const lastSynced = subtasks[0]?.last_synced;

    return (
        <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
                <Badge colorScheme={doneCount === subtasks.length ? 'green' : 'blue'} variant="subtle">
                    {doneCount} / {subtasks.length} complete
                </Badge>
                {lastSynced && (
                    <Text fontSize="2xs" color="gray.400">
                        Synced {new Date(lastSynced).toLocaleString()}
                    </Text>
                )}
            </HStack>

            <List spacing={1}>
                {subtasks.map((sub) => (
                    <ListItem
                        key={sub.asana_gid}
                        px={3}
                        py={2}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        bg={sub.completed ? 'green.50' : 'white'}
                    >
                        <HStack align="start" spacing={2}>
                            <Icon
                                as={sub.completed ? FaCheckCircle : FaRegCircle}
                                color={sub.completed ? 'green.500' : 'gray.400'}
                                mt={0.5}
                            />
                            <Box flex="1" minW="0">
                                <Text
                                    fontSize="sm"
                                    color={sub.completed ? 'gray.500' : 'gray.800'}
                                    textDecoration={sub.completed ? 'line-through' : 'none'}
                                >
                                    {sub.name || '(untitled subtask)'}
                                </Text>
                                <HStack spacing={2} mt={0.5}>
                                    {sub.assignee_name && (
                                        <Text fontSize="2xs" color="gray.500">{sub.assignee_name}</Text>
                                    )}
                                    {sub.due_on && (
                                        <Text fontSize="2xs" color="gray.500">due {sub.due_on}</Text>
                                    )}
                                </HStack>
                            </Box>
                            {sub.permalink_url && (
                                <Link href={sub.permalink_url} isExternal color="purple.500" fontSize="xs">
                                    <ExternalLinkIcon aria-label="Open in Asana" />
                                </Link>
                            )}
                        </HStack>
                    </ListItem>
                ))}
            </List>
        </VStack>
    );
}

export default PlanAsanaSubtasks;
