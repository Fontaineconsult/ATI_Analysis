import React, { useContext, useState } from 'react';
import {
    Badge, Box, Button, Divider, HStack, Text, Textarea, VStack, useToast,
} from '@chakra-ui/react';
import { UserContext } from '../../../context/UserContext';
import EntityAttachmentSelector from '../../functional_components/EntityAttachmentSelector';
import {
    settleQuery, attachEvidenceToQuery, detachEvidenceFromQuery, addQueryNote,
} from '../../../services/api/put';

/**
 * Expanded detail for a single Query: detail text, the YSE it addresses (attach/detach via
 * the shared EntityAttachmentSelector), a settle action + recorded answer, and notes.
 *
 * Props: query (serialized), candidateEvidence (array of {year_identifier, composite_key,
 * success_indicator, status_level}), onChanged() — refresh hook.
 */
export default function QueryDetail({ query, candidateEvidence = [], onChanged }) {
    const { user } = useContext(UserContext);
    const toast = useToast();
    const [answerDraft, setAnswerDraft] = useState('');
    const [noteDraft, setNoteDraft] = useState('');
    const [busy, setBusy] = useState(false);

    const errText = (err) => err?.response?.data?.error || err?.message || 'Please try again.';

    const label = (e) => `${e.composite_key || '—'} — ${e.success_indicator || ''}`.trim();

    const attached = (query.addresses_evidence || []).map((e) => ({
        unique_id: e.year_identifier,
        label: label(e),
        badge: e.status_level ? <Badge colorScheme="gray" fontSize="2xs">{e.status_level}</Badge> : null,
    }));
    const attachedIds = new Set(attached.map((a) => a.unique_id));
    const candidates = (candidateEvidence || [])
        .filter((c) => !attachedIds.has(c.year_identifier))
        .map((c) => ({ unique_id: c.year_identifier, label: label(c) }));

    const handleSettle = async () => {
        if (!answerDraft.trim()) return;
        setBusy(true);
        try {
            await settleQuery(query.unique_id, answerDraft.trim(), user?.unique_id || null);
            toast({ title: 'Query settled', status: 'success', duration: 2000, isClosable: true });
            setAnswerDraft('');
            if (onChanged) await onChanged();
        } catch (err) {
            toast({ title: 'Settle failed', description: errText(err), status: 'error', duration: 4000, isClosable: true });
        } finally { setBusy(false); }
    };

    const handleAddNote = async () => {
        if (!noteDraft.trim()) return;
        setBusy(true);
        try {
            await addQueryNote(query.unique_id, noteDraft.trim(), user?.unique_id || null);
            setNoteDraft('');
            if (onChanged) await onChanged();
        } catch (err) {
            toast({ title: 'Add note failed', description: errText(err), status: 'error', duration: 4000, isClosable: true });
        } finally { setBusy(false); }
    };

    return (
        <VStack align="stretch" spacing={3} pt={2}>
            {query.detail && (
                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{query.detail}</Text>
            )}

            {/* Answer / settle */}
            {query.status === 'settled' ? (
                <Box bg="green.50" borderRadius="md" p={3} borderWidth="1px" borderColor="green.200">
                    <Text fontSize="xs" fontWeight="bold" color="green.700" textTransform="uppercase">Answer</Text>
                    <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" mt={1}>{query.answer}</Text>
                    {query.settled_by && (
                        <Text fontSize="xs" color="gray.600" mt={1}>
                            — {query.settled_by.name}{query.date_settled ? ` · ${query.date_settled}` : ''}
                        </Text>
                    )}
                </Box>
            ) : (
                <Box>
                    <Text fontSize="xs" fontWeight="bold" color="teal.700" textTransform="uppercase" mb={1}>Answer &amp; settle</Text>
                    <Textarea size="sm" value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)} rows={2} placeholder="Record the answer to settle this question…" />
                    <Button mt={2} size="xs" colorScheme="green" onClick={handleSettle} isLoading={busy} isDisabled={!answerDraft.trim()}>Mark settled</Button>
                </Box>
            )}

            <Divider />

            {/* Addressed evidence */}
            <Box>
                <Text fontSize="xs" fontWeight="bold" color="teal.700" textTransform="uppercase" mb={2}>Addresses evidence</Text>
                <EntityAttachmentSelector
                    attached={attached}
                    candidates={candidates}
                    onAttach={(yseId) => attachEvidenceToQuery(query.unique_id, yseId)}
                    onDetach={(yseId) => detachEvidenceFromQuery(query.unique_id, yseId)}
                    afterChange={onChanged}
                    entityLabel="Indicator (YSE)"
                    placeholder="Select an indicator…"
                    attachLabel="Link"
                    detachLabel="Unlink"
                    emptyLabel="No evidence linked yet."
                    noCandidates="No more evidence to link."
                />
            </Box>

            <Divider />

            {/* Notes */}
            <Box>
                <Text fontSize="xs" fontWeight="bold" color="teal.700" textTransform="uppercase" mb={2}>Notes</Text>
                {(query.notes || []).length === 0 ? (
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">No notes yet.</Text>
                ) : (
                    <VStack align="stretch" spacing={1} mb={2}>
                        {query.notes.map((n) => (
                            <Box key={n.unique_id} bg="gray.50" borderRadius="sm" p={2}>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{n.content}</Text>
                                {(n.author?.name || n.dateCreated) && (
                                    <Text fontSize="2xs" color="gray.600" mt={1}>
                                        {n.author?.name ? `— ${n.author.name}` : ''}
                                        {n.author?.name && n.dateCreated ? ' · ' : ''}
                                        {n.dateCreated || ''}
                                    </Text>
                                )}
                            </Box>
                        ))}
                    </VStack>
                )}
                <HStack align="start">
                    <Textarea size="sm" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={1} placeholder="Add a note…" />
                    <Button size="xs" variant="outline" colorScheme="teal" onClick={handleAddNote} isLoading={busy} isDisabled={!noteDraft.trim()}>Add</Button>
                </HStack>
            </Box>
        </VStack>
    );
}
