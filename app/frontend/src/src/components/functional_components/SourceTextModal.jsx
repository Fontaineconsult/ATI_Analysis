import React, { useEffect, useState } from 'react';
import {
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

/**
 * Add or edit the Source Text on ONE artifact behind something that cites it: a Webpage or
 * a Document hanging off an intellectual source or a governance instrument.
 *
 * Shared rather than owned by either area, because the job is identical on both sides. The
 * caller supplies the writer through `onSave`, so this component never has to know whether
 * it is looking at a webpage or a document, and never reaches for a service itself.
 *
 * `loadText` exists because the two callers hold different amounts of the record. The
 * intellectual-source detail read is a single-item read and carries `raw_text` inline. The
 * governance read is a list across every instrument and deliberately carries only the
 * length, so the text for one item is fetched when the editor opens. Pass `loadText` when
 * the text is not already on the item.
 *
 * Props:
 *   isOpen, onClose
 *   item      { unique_id, name, url?, raw_text?, raw_text_captured? }
 *   onSave    (uniqueId, text) => Promise
 *   loadText  optional (uniqueId) => Promise<string>
 *   onSaved   optional, called after a successful save
 *   label     optional noun for the dialog, defaults to "Source Text"
 */
function SourceTextModal({ isOpen, onClose, item, onSave, loadText, onSaved, label = 'Source Text' }) {
    const [text, setText] = useState('');
    const [original, setOriginal] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen || !item) return;
        let cancelled = false;

        // Without a loader the item already carries its text, so there is nothing to wait
        // for and the box should be editable immediately.
        if (!loadText) {
            setText(item.raw_text || '');
            setOriginal(item.raw_text || '');
            return undefined;
        }

        setLoading(true);
        loadText(item.unique_id)
            .then((loaded) => {
                if (cancelled) return;
                setText(loaded || '');
                setOriginal(loaded || '');
            })
            .catch((error) => {
                if (cancelled) return;
                // A failed load must not present an empty box, because saving that would
                // wipe text the fetch simply could not reach.
                toast({
                    title: 'Could not load the current text.',
                    description: error?.message || 'Close and try again.',
                    status: 'error', duration: 4000, isClosable: true,
                });
                onClose();
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [isOpen, item, loadText, onClose, toast]);

    if (!item) return null;

    const unchanged = original === text;

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onSave(item.unique_id, text);
            toast({
                title: text ? 'Source text saved.' : 'Source text cleared.',
                status: 'success', duration: 2000, isClosable: true,
            });
            if (onSaved) await onSaved();
            onClose();
        } catch (error) {
            toast({
                title: 'Save failed.',
                description: error?.response?.data?.error || error?.message || 'Please try again.',
                status: 'error', duration: 4000, isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontSize="md">{label} — {item.name || item.url}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        {item.url && (
                            <Text fontSize="xs" color="gray.600">
                                <Link href={item.url} isExternal color="teal.700" wordBreak="break-all">
                                    {item.url} <ExternalLinkIcon mx="2px" aria-hidden="true" />
                                </Link>
                            </Text>
                        )}
                        {loading ? (
                            <HStack p={6} color="gray.600" fontSize="sm" justify="center">
                                <Spinner size="sm" /><Text>Loading the current text…</Text>
                            </HStack>
                        ) : (
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">
                                    Text (Markdown)
                                </FormLabel>
                                <Textarea
                                    size="sm"
                                    rows={20}
                                    fontFamily="mono"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Paste what the source says. For a paywalled or SSO-walled item, paste the content rather than summarising it."
                                />
                                <FormHelperText fontSize="xs">
                                    {text.length
                                        ? `${text.length.toLocaleString()} characters${item.raw_text_captured ? ` · last captured ${item.raw_text_captured}` : ''}. Saving the same text again does not move the capture date; emptying the box clears both.`
                                        : 'The published source stays authoritative. This is a snapshot of it, dated when you save.'}
                                </FormHelperText>
                            </FormControl>
                        )}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={2} onClick={onClose} isDisabled={submitting}>Cancel</Button>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={submitting}
                        isDisabled={unchanged || loading}
                        loadingText="Saving…"
                    >
                        {unchanged ? 'No changes' : 'Save Text'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default SourceTextModal;
