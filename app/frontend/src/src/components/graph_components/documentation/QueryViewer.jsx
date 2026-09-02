import React from 'react';
import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { getCategoryMeta, getStatusMeta } from '../../dashboard_components/query_components/queriesConfig';

/**
 * The pending questions pointed at ONE year's evidence, read-only.
 *
 * Read-only on purpose: a Query is raised under a WorkingGroupPlan, not under a
 * YSE, so this is a view of something that belongs elsewhere. Editing here would
 * imply an ownership the model does not have — the Queries area (and the campus
 * plan's working-group section) is where they are raised and settled.
 *
 * Open questions sort first: a settled one is history, an open one is work.
 */
const STATUS_RANK = { open: 0, in_progress: 1, settled: 2 };

export function sortQueries(queries = []) {
    return [...queries].sort((a, b) => {
        const rank = (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3);
        if (rank !== 0) return rank;
        return String(a.question || '').localeCompare(String(b.question || ''));
    });
}

function QueryRow({ query }) {
    const status = getStatusMeta(query.status);
    const category = getCategoryMeta(query.category);
    const settled = query.status === 'settled';

    return (
        <Box
            borderWidth="1px" borderColor="gray.200" borderRadius="md"
            borderLeftWidth="3px" borderLeftColor={settled ? 'gray.300' : 'orange.400'}
            bg="white" px={3} py={2}
        >
            <Flex gap={2} align="baseline" wrap="wrap">
                <Text fontSize="sm" color="gray.800" flex="1" minW="200px">
                    {query.question}
                </Text>
                <Badge colorScheme={status.colorScheme} variant="subtle" fontSize="2xs">
                    {status.label}
                </Badge>
                <Badge colorScheme={category.colorScheme} variant="subtle" fontSize="2xs" textTransform="none">
                    {category.label}
                </Badge>
            </Flex>

            {query.detail && (
                <Text fontSize="xs" color="gray.700" mt={1} whiteSpace="pre-wrap">
                    {query.detail}
                </Text>
            )}

            {/* The answer is the point of a settled query — showing the question
                without it would make the record look emptier than it is. */}
            {settled && query.answer && (
                <Box mt={2} pt={2} borderTopWidth="1px" borderColor="gray.200">
                    <Text fontSize="2xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">
                        Answer
                    </Text>
                    <Text fontSize="xs" color="gray.800" whiteSpace="pre-wrap">{query.answer}</Text>
                </Box>
            )}

            <HStack spacing={2} mt={1.5} wrap="wrap">
                {query.raised_by && (
                    <Text fontSize="2xs" color="gray.600">raised by {query.raised_by}</Text>
                )}
                {(query.answerable_by || []).map((name) => (
                    <Badge key={name} colorScheme="blue" variant="subtle" fontSize="2xs" textTransform="none">
                        {name} owes the answer
                    </Badge>
                ))}
                {query.date_raised && (
                    <Text fontFamily="mono" fontSize="2xs" color="gray.600">{query.date_raised}</Text>
                )}
            </HStack>
        </Box>
    );
}

export default function QueryViewer({ queries = [] }) {
    if (!queries.length) {
        return (
            <Text fontSize="sm" color="gray.600" fontStyle="italic">
                No pending questions are pointed at this evidence.
            </Text>
        );
    }

    return (
        <VStack align="stretch" spacing={2}>
            {sortQueries(queries).map((q) => <QueryRow key={q.unique_id} query={q} />)}
        </VStack>
    );
}
