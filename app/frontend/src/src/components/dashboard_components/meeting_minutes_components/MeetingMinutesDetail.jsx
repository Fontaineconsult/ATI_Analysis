import React, { useContext, useState } from 'react';
import {
    Box, Button, Divider, Flex, HStack, IconButton, Input, Link, Select, Text, Textarea,
    VStack, useToast,
} from '@chakra-ui/react';
import { DeleteIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { UserContext } from '../../../context/UserContext';
import Markdown from '../../graph_components/common/Markdown';
import {
    attachDocumentToMinutes, attachWebpageToMinutes, detachDocumentFromMinutes,
    detachWebpageFromMinutes, addMinutesNote,
} from '../../../services/api/put';

/**
 * Expanded detail for one MeetingMinutes record: the rendered Markdown body, attached
 * Documents/Webpages (with a create-and-attach form + remove), and notes.
 *
 * Props: minutes (serialized), onChanged() — refresh hook.
 */
export default function MeetingMinutesDetail({ minutes, onChanged }) {
    const { user } = useContext(UserContext);
    const toast = useToast();
    const [attachType, setAttachType] = useState('document');
    const [attachName, setAttachName] = useState('');
    const [attachUrl, setAttachUrl] = useState('');
    const [noteDraft, setNoteDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const errText = (err) => err?.response?.data?.error || err?.message || 'Please try again.';

    const documents = minutes.documents || [];
    const webpages = minutes.webpages || [];

    const handleAttach = async () => {
        if (attachType === 'document' ? !attachName.trim() : !attachUrl.trim()) return;
        setBusy(true);
        try {
            if (attachType === 'document') {
                await attachDocumentToMinutes(minutes.unique_id, { name: attachName.trim(), uri_path: attachUrl.trim() || null });
            } else {
                await attachWebpageToMinutes(minutes.unique_id, { name: attachName.trim() || null, url: attachUrl.trim() });
            }
            setAttachName(''); setAttachUrl('');
            if (onChanged) await onChanged();
        } catch (err) {
            toast({ title: 'Attach failed', description: errText(err), status: 'error', duration: 4000, isClosable: true });
        } finally { setBusy(false); }
    };

    const handleDetachDoc = async (docId) => {
        setBusy(true);
        try { await detachDocumentFromMinutes(minutes.unique_id, docId); if (onChanged) await onChanged(); }
        catch (err) { toast({ title: 'Remove failed', description: errText(err), status: 'error', duration: 4000, isClosable: true }); }
        finally { setBusy(false); }
    };
    const handleDetachWeb = async (webId) => {
        setBusy(true);
        try { await detachWebpageFromMinutes(minutes.unique_id, webId); if (onChanged) await onChanged(); }
        catch (err) { toast({ title: 'Remove failed', description: errText(err), status: 'error', duration: 4000, isClosable: true }); }
        finally { setBusy(false); }
    };

    const handleAddNote = async () => {
        if (!noteDraft.trim()) return;
        setBusy(true);
        try { await addMinutesNote(minutes.unique_id, noteDraft.trim(), user?.unique_id || null); setNoteDraft(''); if (onChanged) await onChanged(); }
        catch (err) { toast({ title: 'Add note failed', description: errText(err), status: 'error', duration: 4000, isClosable: true }); }
        finally { setBusy(false); }
    };

    return (
        <VStack align="stretch" spacing={3} pt={2}>
            {/* Rendered minutes */}
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                {minutes.content
                    ? <Markdown>{minutes.content}</Markdown>
                    : <Text fontSize="sm" color="gray.400" fontStyle="italic">No minutes text.</Text>}
            </Box>

            <Divider />

            {/* Attachments */}
            <Box>
                <Text fontSize="xs" fontWeight="bold" color="teal.700" textTransform="uppercase" mb={2}>Attachments</Text>
                {(documents.length === 0 && webpages.length === 0) ? (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic" mb={2}>Nothing attached yet.</Text>
                ) : (
                    <VStack align="stretch" spacing={1} mb={2}>
                        {documents.map((d) => {
                            const href = d.uri_path || d.file_path;
                            return (
                                <HStack key={d.unique_id} justify="space-between">
                                    {href ? (
                                        <Link href={href} isExternal color="teal.600" fontSize="sm">📄 {d.name} <ExternalLinkIcon boxSize={3} /></Link>
                                    ) : (
                                        <Text fontSize="sm" color="gray.700">📄 {d.name}</Text>
                                    )}
                                    <IconButton aria-label="Remove document" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" isDisabled={busy} onClick={() => handleDetachDoc(d.unique_id)} />
                                </HStack>
                            );
                        })}
                        {webpages.map((w) => (
                            <HStack key={w.unique_id} justify="space-between">
                                <Link href={w.url} isExternal color="teal.600" fontSize="sm">🔗 {w.name || w.url} <ExternalLinkIcon boxSize={3} /></Link>
                                <IconButton aria-label="Remove webpage" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" isDisabled={busy} onClick={() => handleDetachWeb(w.unique_id)} />
                            </HStack>
                        ))}
                    </VStack>
                )}
                <Flex gap={2} wrap="wrap" align="center">
                    <Select size="sm" maxW="130px" value={attachType} onChange={(e) => setAttachType(e.target.value)}>
                        <option value="document">Document</option>
                        <option value="webpage">Webpage</option>
                    </Select>
                    <Input size="sm" maxW="200px" placeholder="Name" value={attachName} onChange={(e) => setAttachName(e.target.value)} />
                    <Input size="sm" flex={1} minW="180px" placeholder={attachType === 'document' ? 'URL or file path (optional)' : 'URL'} value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} />
                    <Button size="sm" colorScheme="teal" variant="outline" onClick={handleAttach} isLoading={busy}>Attach</Button>
                </Flex>
            </Box>

            <Divider />

            {/* Notes */}
            <Box>
                <Text fontSize="xs" fontWeight="bold" color="teal.700" textTransform="uppercase" mb={2}>Notes</Text>
                {(minutes.notes || []).length === 0 ? (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">No notes yet.</Text>
                ) : (
                    <VStack align="stretch" spacing={1} mb={2}>
                        {minutes.notes.map((n) => (
                            <Box key={n.unique_id} bg="gray.50" borderRadius="sm" p={2}>
                                <Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap">{n.content}</Text>
                                {n.dateCreated && <Text fontSize="2xs" color="gray.500" mt={1}>{n.dateCreated}</Text>}
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
