import React, { useMemo } from 'react';
import {
    Badge, Box, Button, Flex, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, VStack,
} from '@chakra-ui/react';
import Markdown from '../common/Markdown';
import Section from '../common/Section';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import CopyFollowUpButton from './CopyFollowUpButton';
import { fetchFollowUpTable, fetchFollowUpsForMeeting } from '../../../services/api/get';
import useResource from '../../../hooks/useResource';
import { KEYS } from '../../../context/resourceKeys';

/** Total open asks recorded against one indicator row. */
export function askCount(row) {
    return (row.queries?.length || 0)
        + (row.recommendations?.length || 0)
        + (row.concerns?.length || 0);
}

/** One indicator's line in the live gap table. */
function IndicatorRow({ row }) {
    const asks = askCount(row);
    return (
        <Box
            borderWidth="1px" borderColor="gray.200" borderRadius="md" borderLeftWidth="3px"
            borderLeftColor={asks ? 'orange.400' : 'gray.300'}
            bg="white" px={3} py={2}
        >
            <Flex gap={2} align="center" wrap="wrap">
                <Badge colorScheme="blue" variant="subtle" fontSize="2xs" textTransform="none">
                    {row.composite_key}
                </Badge>
                <Box flex="1" minW="120px" maxW="220px">
                    <StatusLevelLadder level={row.status_level} variant="compact" />
                </Box>
                <Badge
                    colorScheme={row.evidence?.length ? 'teal' : 'gray'}
                    variant="subtle" fontSize="2xs" textTransform="none"
                >
                    {row.evidence?.length || 0} evidence
                </Badge>
                <Badge
                    colorScheme={asks ? 'orange' : 'gray'}
                    variant="subtle" fontSize="2xs" textTransform="none"
                >
                    {asks} {asks === 1 ? 'ask' : 'asks'}
                </Badge>
            </Flex>
            <Text fontSize="xs" color="gray.700" mt={1} noOfLines={2}>
                {row.success_indicator}
            </Text>
        </Box>
    );
}

/** One saved follow-up, rendered as it was written. */
function SavedFollowUp({ item }) {
    return (
        <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="white" p={3}>
            <Flex gap={2} align="center" wrap="wrap" mb={2}>
                <Text fontSize="sm" fontWeight="medium" color="gray.800" flex="1" minW={0}>
                    {item.subject}
                </Text>
                <Badge
                    colorScheme={item.status === 'sent' ? 'green' : 'gray'}
                    variant="subtle" fontSize="2xs"
                >
                    {item.status}
                </Badge>
                {item.community && (
                    <Badge colorScheme="purple" variant="subtle" fontSize="2xs" textTransform="none">
                        {item.community}
                    </Badge>
                )}
                <CopyFollowUpButton markdown={item.body_markdown} subject={item.subject} />
            </Flex>

            {/* The table above is live; this text is a snapshot. The timestamp is
                how a reader tells whether it still describes the same graph. */}
            <Text fontFamily="mono" fontSize="2xs" color="gray.600" mb={2}>
                generated {item.generated_at || item.date_created || 'date unknown'}
            </Text>

            {item.body_markdown ? (
                <Box borderTopWidth="1px" borderColor="gray.200" pt={2}>
                    <Markdown>{item.body_markdown}</Markdown>
                </Box>
            ) : (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    This follow-up has no body saved.
                </Text>
            )}
        </Box>
    );
}

/**
 * The follow-ups chasing one held interview guide.
 *
 * This view does NOT compose anything. Follow-ups are written by Claude Code
 * against the notes, source text and bar elements behind these indicators — the
 * same way interview guides are authored — and saved through the follow-ups
 * API. A template here could only mail-merge the structured nodes, which would
 * miss every gap recorded as prose, including artifacts a stakeholder offered
 * in the room.
 *
 * What the app owns is the rest of the loop: showing the live gap table beside
 * the saved messages, timestamping them so staleness is visible, and getting
 * one onto the clipboard as an email.
 */
export default function FollowUpModal({ guide, onClose }) {
    const meetingId = guide?.resulted_in?.unique_id || null;

    const { data: tableResp, loading: tableLoading, error: tableError } = useResource(
        meetingId ? KEYS.followUpTable(meetingId) : null,
        () => fetchFollowUpTable(meetingId),
    );
    const rows = useMemo(() => tableResp?.data?.rows || [], [tableResp]);

    const { data: savedResp, loading: savedLoading } = useResource(
        meetingId ? KEYS.followUpsForMeeting(meetingId) : null,
        () => fetchFollowUpsForMeeting(meetingId),
    );
    const saved = savedResp?.data?.follow_ups || [];

    const community = (guide?.pertains_to_communities || [])[0]?.name || '';
    const totalAsks = rows.reduce((n, r) => n + askCount(r), 0);

    return (
        <Modal isOpen onClose={onClose} size="4xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={2}>
                    <Text fontSize="md" fontWeight="bold" color="gray.800">Follow-up</Text>
                    <Flex mt={1} gap={1.5} wrap="wrap" align="center">
                        <Text fontSize="xs" color="gray.600">{guide?.title}</Text>
                        {guide?.resulted_in && (
                            <Text fontSize="xs" color="gray.600">&rarr; {guide.resulted_in.title}</Text>
                        )}
                        {community && (
                            <Badge colorScheme="purple" variant="subtle" fontSize="2xs" textTransform="none">
                                {community}
                            </Badge>
                        )}
                    </Flex>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {!meetingId ? (
                        <Text fontSize="sm" color="gray.600">
                            This guide has no minutes linked yet. A follow-up chases what a meeting
                            left open, so link the minutes first.
                        </Text>
                    ) : (
                        <VStack align="stretch" spacing={3}>
                            <Section
                                title="Gaps by indicator"
                                action={
                                    <Text fontSize="2xs" color="gray.600">
                                        {rows.length} indicator{rows.length === 1 ? '' : 's'}
                                        {' · '}
                                        {totalAsks} open ask{totalAsks === 1 ? '' : 's'}
                                        {' · live'}
                                    </Text>
                                }
                            >
                                {tableLoading && <Spinner size="sm" />}
                                {tableError && (
                                    <Text fontSize="sm" color="red.600">Could not load the gap table.</Text>
                                )}
                                {!tableLoading && !rows.length && (
                                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                                        No indicators are linked to these minutes. Indicators are derived
                                        from notes shared with the meeting, so this usually means the
                                        minutes have not been ingested yet.
                                    </Text>
                                )}
                                <VStack align="stretch" spacing={1.5}>
                                    {rows.map((r) => <IndicatorRow key={r.year_identifier} row={r} />)}
                                </VStack>
                            </Section>

                            <Section title={`Follow-ups (${saved.length})`}>
                                {savedLoading && <Spinner size="sm" />}
                                {!savedLoading && !saved.length && (
                                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                                        None written for this meeting yet. Follow-ups are composed with
                                        Claude Code against the notes and source text behind these
                                        indicators, then saved here to read, copy and track.
                                    </Text>
                                )}
                                <VStack align="stretch" spacing={2}>
                                    {saved.map((f) => <SavedFollowUp key={f.unique_id} item={f} />)}
                                </VStack>
                            </Section>
                        </VStack>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Box flex="1" />
                    <Button size="sm" colorScheme="teal" onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
