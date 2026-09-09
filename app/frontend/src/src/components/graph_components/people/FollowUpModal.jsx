import React, { useCallback, useMemo, useState } from 'react';
import {
    Badge, Box, Button, Flex, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, VStack, useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Markdown from '../common/Markdown';
import Section from '../common/Section';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import CopyFollowUpButton from './CopyFollowUpButton';
import NextContactEditor from './NextContactEditor';
import { fetchFollowUpTable, fetchFollowUpsForMeeting } from '../../../services/api/get';
import { markFollowUpSent } from '../../../services/api/put';
import useResource from '../../../hooks/useResource';
import { KEYS } from '../../../context/resourceKeys';
import { navigateToIndicator } from '../../../services/utils/tools';

/** Total open asks recorded against one indicator row. */
export function askCount(row) {
    return (row.queries?.length || 0)
        + (row.recommendations?.length || 0)
        + (row.concerns?.length || 0);
}

/** One indicator's line in the live gap table — opens its dashboard goal view,
 *  which is where the evidence behind it actually gets edited. */
function IndicatorRow({ row, onOpen }) {
    const asks = askCount(row);
    return (
        <Box
            borderWidth="1px" borderColor="gray.200" borderRadius="md" borderLeftWidth="3px"
            borderLeftColor={asks ? 'orange.400' : 'gray.300'}
            bg="white" px={3} py={2} textAlign="left"
            cursor="pointer" _hover={{ bg: 'gray.50' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '-2px' }}
            onClick={() => onOpen(row)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(row); }
            }}
            role="button" tabIndex={0}
            aria-label={`Open ${row.composite_key} to update its evidence`}
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
                <Text fontSize="2xs" color="gray.600" aria-hidden="true">&#9656;</Text>
            </Flex>
            <Text fontSize="xs" color="gray.700" mt={1} noOfLines={2}>
                {row.success_indicator}
            </Text>
        </Box>
    );
}

/** One saved follow-up, rendered as it was written. */
function SavedFollowUp({ item, onMarkSent, marking, onReload }) {
    const sent = item.status === 'sent';
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
                {!sent && (
                    <Button
                        size="xs" variant="outline" colorScheme="green"
                        isLoading={marking} loadingText="Marking…"
                        onClick={() => onMarkSent(item)}
                        title="Record that this actually went out"
                    >
                        Mark sent
                    </Button>
                )}
            </Flex>

            {/* The table above is live; this text is a snapshot. The timestamp is
                how a reader tells whether it still describes the same graph. */}
            <Text fontFamily="mono" fontSize="2xs" color="gray.600" mb={2}>
                generated {item.generated_at || item.date_created || 'date unknown'}
                {item.date_sent ? ` · sent ${item.date_sent}` : ''}
            </Text>

            {(item.addressed_to || []).length > 0 && (
                <Text fontSize="xs" color="gray.700" mb={2}>
                    To: {item.addressed_to.map((p) => p.name).join(', ')}
                </Text>
            )}

            {/* The tickler: when somebody picks this chase back up. */}
            <Box mb={2}>
                <NextContactEditor followUp={item} onSaved={onReload} />
            </Box>

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
export default function FollowUpModal({ guide, campus, onClose }) {
    const navigate = useNavigate();
    const meetingId = guide?.resulted_in?.unique_id || null;
    const campusAbbrev = campus || guide?.campus || null;

    // navigateToIndicator is the single sanctioned entry point for "go to a
    // success indicator from its composite key" (services/utils/tools). Leaving
    // this view is fine: it lives at ?followup=<guide id>, so Back brings it
    // straight back with the table re-read.
    const openIndicator = useCallback((row) => {
        navigateToIndicator(navigate, row.composite_key, campusAbbrev);
    }, [navigate, campusAbbrev]);

    const { data: tableResp, loading: tableLoading, error: tableError } = useResource(
        meetingId ? KEYS.followUpTable(meetingId) : null,
        () => fetchFollowUpTable(meetingId),
    );
    const rows = useMemo(() => tableResp?.data?.rows || [], [tableResp]);

    const toast = useToast();
    const [markingId, setMarkingId] = useState(null);

    const { data: savedResp, loading: savedLoading, reload: reloadSaved } = useResource(
        meetingId ? KEYS.followUpsForMeeting(meetingId) : null,
        () => fetchFollowUpsForMeeting(meetingId),
    );
    const saved = savedResp?.data?.follow_ups || [];

    const handleMarkSent = useCallback(async (item) => {
        setMarkingId(item.unique_id);
        try {
            await markFollowUpSent(item.unique_id);
            await reloadSaved();
            toast({
                title: 'Marked sent',
                description: 'Open asks on it now count as unanswered.',
                status: 'success', duration: 3000, isClosable: true,
            });
        } catch (e) {
            toast({
                title: 'Could not mark it sent',
                description: e?.message || 'Unknown error.',
                status: 'error', duration: 4000, isClosable: true,
            });
        } finally {
            setMarkingId(null);
        }
    }, [reloadSaved, toast]);

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
                                        {' · live · click to edit'}
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
                                    {rows.map((r) => (
                                        <IndicatorRow
                                            key={r.year_identifier} row={r} onOpen={openIndicator} />
                                    ))}
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
                                    {saved.map((f) => (
                                        <SavedFollowUp
                                            key={f.unique_id} item={f}
                                            onMarkSent={handleMarkSent}
                                            marking={markingId === f.unique_id}
                                            onReload={reloadSaved} />
                                    ))}
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
