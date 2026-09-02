import React, { useCallback, useMemo, useState } from 'react';
import {
    Badge, Box, Button, Flex, HStack, Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Spinner, Text, Textarea, VStack, useToast,
} from '@chakra-ui/react';
import Section from '../common/Section';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import CopyFollowUpButton from './CopyFollowUpButton';
import { fetchFollowUpTable, fetchFollowUpsForMeeting } from '../../../services/api/get';
import { createFollowUp } from '../../../services/api/post';
import { buildFollowUpMarkdown } from '../../../services/utils/followUpMarkdown';
import useResource from '../../../hooks/useResource';
import useInvalidateResources from '../../../hooks/useInvalidateResources';
import { KEYS, NS } from '../../../context/resourceKeys';

/** Total open asks recorded against one indicator row. */
export function askCount(row) {
    return (row.queries?.length || 0)
        + (row.recommendations?.length || 0)
        + (row.concerns?.length || 0);
}

/** One indicator's line in the gap table. */
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

/** A previously saved follow-up. */
function SavedRow({ item }) {
    return (
        <Flex
            borderWidth="1px" borderColor="gray.200" borderRadius="md"
            bg="white" px={3} py={2} gap={2} align="center" wrap="wrap"
        >
            <Text fontSize="sm" color="gray.800" flex="1" minW={0} noOfLines={1}>
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
            {item.date_created && (
                <Text fontFamily="mono" fontSize="2xs" color="gray.600">{item.date_created}</Text>
            )}
        </Flex>
    );
}

/**
 * Generate and save the follow-up for one held interview guide.
 *
 * The gap table is a LIVE read of the graph; the markdown draft is generated
 * from it, edited here, and saved on the FollowUp node. What is saved is what
 * gets copied later, so a message reworded before sending stays reworded.
 */
export default function FollowUpModal({ guide, onClose }) {
    const toast = useToast();
    const meetingId = guide?.resulted_in?.unique_id || null;

    const [draft, setDraft] = useState('');
    const [subject, setSubject] = useState('');
    const [saving, setSaving] = useState(false);

    const { data: tableResp, loading: tableLoading, error: tableError } = useResource(
        meetingId ? KEYS.followUpTable(meetingId) : null,
        () => fetchFollowUpTable(meetingId),
    );
    const rows = useMemo(() => tableResp?.data?.rows || [], [tableResp]);

    const {
        data: savedResp, loading: savedLoading, reload: reloadSaved,
    } = useResource(
        meetingId ? KEYS.followUpsForMeeting(meetingId) : null,
        () => fetchFollowUpsForMeeting(meetingId),
    );
    const saved = savedResp?.data?.follow_ups || [];

    const { invalidateNamespace } = useInvalidateResources();

    const community = (guide?.pertains_to_communities || [])[0]?.name || '';
    const recipients = useMemo(() => guide?.prepared_for || [], [guide]);

    const handleGenerate = useCallback(() => {
        const { subject: generatedSubject, markdown } = buildFollowUpMarkdown(rows, {
            meetingTitle: guide?.resulted_in?.title || guide?.title,
            meetingDate: guide?.resulted_in?.meeting_date || guide?.meeting_date,
            recipients,
            community,
            campus: guide?.campus || '',
        });
        setSubject(generatedSubject);
        setDraft(markdown);
    }, [rows, guide, recipients, community]);

    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            await createFollowUp({
                subject,
                meeting_minutes_id: meetingId,
                body_markdown: draft,
                community_name: community || undefined,
                campus_abbreviation: guide?.campus || undefined,
                interview_guide_id: guide?.unique_id,
                addressed_to_ids: recipients.map((p) => p.unique_id),
                covers_evidence_identifiers: rows.map((r) => r.year_identifier),
            });
            invalidateNamespace(NS.followUps);
            await reloadSaved();
            toast({
                title: 'Follow-up saved',
                description: 'Copy it when you are ready to send.',
                status: 'success', duration: 3000, isClosable: true,
            });
        } catch (e) {
            toast({
                title: 'Could not save the follow-up',
                description: e?.message || 'Unknown error.',
                status: 'error', duration: 4000, isClosable: true,
            });
        } finally {
            setSaving(false);
        }
    }, [subject, draft, meetingId, community, guide, recipients, rows,
        invalidateNamespace, reloadSaved, toast]);

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

                            <Section
                                title="Draft"
                                action={
                                    <HStack spacing={2}>
                                        <Button
                                            size="xs" variant="outline" colorScheme="teal"
                                            onClick={handleGenerate} isDisabled={!rows.length}
                                        >
                                            {draft ? 'Regenerate' : 'Generate'}
                                        </Button>
                                        {draft && <CopyFollowUpButton markdown={draft} subject={subject} />}
                                    </HStack>
                                }
                            >
                                {draft ? (
                                    <Textarea
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        fontFamily="mono"
                                        fontSize="xs"
                                        rows={18}
                                        aria-label="Follow-up message, markdown"
                                    />
                                ) : (
                                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                                        Generate a draft from the table above, then edit it before saving.
                                        What you save is what gets copied.
                                    </Text>
                                )}
                            </Section>

                            <Section title={`Saved follow-ups (${saved.length})`}>
                                {savedLoading && <Spinner size="sm" />}
                                {!savedLoading && !saved.length && (
                                    <Text fontSize="sm" color="gray.600" fontStyle="italic">
                                        None saved for this meeting yet.
                                    </Text>
                                )}
                                <VStack align="stretch" spacing={1.5}>
                                    {saved.map((f) => <SavedRow key={f.unique_id} item={f} />)}
                                </VStack>
                            </Section>
                        </VStack>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button
                        size="sm" colorScheme="teal" variant="outline"
                        onClick={handleSave}
                        isLoading={saving} loadingText="Saving…"
                        isDisabled={!draft || !subject}
                    >
                        Save follow-up
                    </Button>
                    <Box flex="1" />
                    <Button size="sm" colorScheme="teal" onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
