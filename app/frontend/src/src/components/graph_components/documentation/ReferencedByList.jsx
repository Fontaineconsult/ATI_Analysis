import React, { useMemo } from 'react';
import { Badge, Box, HStack, Link, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

import { parentHref, relTypeLabel } from './documentationConfig';

/**
 * Everything that points at one documentation record, grouped by relationship
 * type.
 *
 * This is the component that answers "who uses this?", and it is deliberately
 * rendered high in the detail panel: for a shared record it is also the blast
 * radius, and the count needs to be visible before anyone considers changing
 * anything.
 *
 * The references come from an UNTYPED inbound match on the server, so a record
 * reachable only through governance's is_sourced_from shows up here exactly like
 * one attached through is_documented_by. That is why the orphan count is
 * trustworthy — 100 records reach the graph only that way.
 */
function ReferencedByList({ references = [], campus }) {
    const grouped = useMemo(() => {
        const byRel = {};
        references.forEach((ref) => {
            const key = ref.rel_type || 'unknown';
            (byRel[key] = byRel[key] || []).push(ref);
        });
        return Object.entries(byRel).sort((a, b) => b[1].length - a[1].length);
    }, [references]);

    if (!references.length) {
        return (
            <Box bg="orange.50" borderWidth="1px" borderColor="orange.200" borderRadius="md" p={3}>
                <Text fontSize="sm" color="orange.800">
                    Nothing in the graph points at this record, by any relationship type.
                </Text>
                <Text fontSize="xs" color="gray.600" mt={1}>
                    It will not appear as evidence anywhere. That may be correct — some records
                    are staged before being attached — or it may be a leftover.
                </Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={3}>
            {grouped.map(([relType, refs]) => (
                <Box key={relType}>
                    <Text
                        fontSize="2xs"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        color="gray.600"
                        mb={1}
                    >
                        {relTypeLabel(relType)} ({refs.length})
                    </Text>
                    <VStack align="stretch" spacing={1}>
                        {refs.map((ref, i) => {
                            const href = parentHref(campus, ref);
                            const label = ref.parent_title || ref.parent_id;
                            return (
                                <Box
                                    key={`${ref.parent_id}-${i}`}
                                    px={2}
                                    py={1}
                                    borderWidth="1px"
                                    borderColor="gray.200"
                                    borderRadius="md"
                                    bg="gray.50"
                                >
                                    <HStack spacing={2} align="baseline" flexWrap="wrap">
                                        <Badge
                                            colorScheme="gray"
                                            borderRadius="md"
                                            fontSize="2xs"
                                            textTransform="none"
                                        >
                                            {ref.parent_label}
                                        </Badge>
                                        {href ? (
                                            <Link
                                                as={RouterLink}
                                                to={href}
                                                fontSize="sm"
                                                color="teal.700"
                                                textDecoration="underline"
                                            >
                                                {label}
                                            </Link>
                                        ) : (
                                            /* No explorer route for this parent type — plain
                                               text rather than a link that would 404. */
                                            <Text fontSize="sm" color="gray.800">{label}</Text>
                                        )}
                                    </HStack>

                                    {/* YSE coordinates are resolved server-side, so the
                                        composite year_identifier never has to be parsed here. */}
                                    {ref.yse && (
                                        <Wrap spacing={1} mt={1}>
                                            {ref.yse.indicator && (
                                                <WrapItem>
                                                    <Badge colorScheme="teal" borderRadius="md" fontSize="2xs" fontFamily="mono">
                                                        {ref.yse.indicator}
                                                    </Badge>
                                                </WrapItem>
                                            )}
                                            {ref.yse.campus && (
                                                <WrapItem>
                                                    <Badge colorScheme="purple" borderRadius="md" fontSize="2xs">
                                                        {ref.yse.campus}
                                                    </Badge>
                                                </WrapItem>
                                            )}
                                            {ref.yse.year && (
                                                <WrapItem>
                                                    <Badge colorScheme="gray" borderRadius="md" fontSize="2xs">
                                                        {ref.yse.year}
                                                    </Badge>
                                                </WrapItem>
                                            )}
                                        </Wrap>
                                    )}

                                    {/* Year scoping only exists on some edge types. When the
                                        edge carries no scoping at all we render nothing rather
                                        than an empty state, because those edges structurally
                                        cannot carry years — an absence is not a gap. */}
                                    {ref.year_scoped && ref.edge_props && (
                                        <Wrap spacing={1} mt={1}>
                                            {(ref.edge_props.included_in_years || []).map((y) => (
                                                <WrapItem key={`in-${y}`}>
                                                    <Badge colorScheme="green" borderRadius="full" fontSize="2xs">
                                                        {y}
                                                    </Badge>
                                                </WrapItem>
                                            ))}
                                            {(ref.edge_props.excluded_from_years || []).map((y) => (
                                                <WrapItem key={`ex-${y}`}>
                                                    <Badge colorScheme="red" borderRadius="full" fontSize="2xs">
                                                        excluded {y}
                                                    </Badge>
                                                </WrapItem>
                                            ))}
                                        </Wrap>
                                    )}
                                </Box>
                            );
                        })}
                    </VStack>
                </Box>
            ))}
        </VStack>
    );
}

export default ReferencedByList;
