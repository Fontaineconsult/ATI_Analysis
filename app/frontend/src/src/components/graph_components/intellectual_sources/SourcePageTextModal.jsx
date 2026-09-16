import React, { useEffect, useState } from 'react';
import {
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { updateWebpageSourceText } from '../../../services/api/put';
import { INTELLECTUAL_SOURCE_COLOR } from './intellectualSourceTypes';

/**
 * Add or edit the Source Text on ONE page behind an intellectual source.
 *
 * A synthesized source has no canonical url and no text of its own; its text lives on the
 * pages it was drawn from, one at a time. This is where that is typed.
 *
 * Writes `{unique_id, raw_text}` and nothing else, through updateWebpageSourceText. The
 * six-argument updateWebpage would also reassign a maintainer and write year-inclusion and
 * YSE association edges when handed those arguments, which a text edit has no business
 * doing.
 *
 * Props: isOpen, onClose, page ({unique_id, name, url, raw_text, raw_text_captured}), onSaved()
 */
function SourcePageTextModal({ isOpen, onClose, page, onSaved }) {
    const [text, setText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) return;
        setText(page?.raw_text || '');
    }, [isOpen, page]);

    if (!page) return null;

    const unchanged = (page.raw_text || '') === text;

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await updateWebpageSourceText(page.unique_id, text);
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
                <ModalHeader fontSize="md">Source Text — {page.name || page.url}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        {page.url && (
                            <Text fontSize="xs" color="gray.600">
                                <Link href={page.url} isExternal color={`${INTELLECTUAL_SOURCE_COLOR}.700`} wordBreak="break-all">
                                    {page.url} <ExternalLinkIcon mx="2px" aria-hidden="true" />
                                </Link>
                            </Text>
                        )}
                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">
                                Page text (Markdown)
                            </FormLabel>
                            <Textarea
                                size="sm"
                                rows={20}
                                fontFamily="mono"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste what the page says. For a paywalled or SSO-walled page, paste the content rather than summarising it."
                            />
                            <FormHelperText fontSize="xs">
                                {text.length
                                    ? `${text.length.toLocaleString()} characters${page.raw_text_captured ? ` · last captured ${page.raw_text_captured}` : ''}. Saving the same text again does not move the capture date; emptying the box clears both.`
                                    : 'The published page stays authoritative. This is a snapshot of it, dated when you save.'}
                            </FormHelperText>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={2} onClick={onClose} isDisabled={submitting}>Cancel</Button>
                    <Button
                        size="sm"
                        colorScheme={INTELLECTUAL_SOURCE_COLOR}
                        onClick={handleSubmit}
                        isLoading={submitting}
                        isDisabled={unchanged}
                        loadingText="Saving…"
                    >
                        {unchanged ? 'No changes' : 'Save Text'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default SourcePageTextModal;
