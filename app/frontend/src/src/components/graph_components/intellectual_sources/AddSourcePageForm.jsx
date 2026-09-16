import React, { useEffect, useState } from 'react';
import {
    Button,
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { attachSourcePage } from '../../../services/api/put';
import { INTELLECTUAL_SOURCE_COLOR } from './intellectualSourceTypes';

/**
 * Add a page an intellectual source was drawn from.
 *
 * The form takes a URL rather than offering a picker over ~300 existing pages, because the
 * URL is what you have when you find a source, and because it makes the cross-link rule
 * automatic: the server MERGEs on url, so pasting a URL already in the graph links the
 * existing page instead of making a second one. The toast says which happened, since
 * "linked the page governance already cites" and "created a new page" are different facts
 * and the caller should know which they got.
 *
 * Props: isOpen, onClose, sourceUniqueId, onSaved()
 */
function AddSourcePageForm({ isOpen, onClose, sourceUniqueId, onSaved }) {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) return;
        setUrl('');
        setName('');
    }, [isOpen]);

    const handleSubmit = async () => {
        const trimmed = url.trim();
        if (!trimmed) {
            toast({ title: 'A URL is required.', status: 'error', duration: 2000, isClosable: true });
            return;
        }
        setSubmitting(true);
        try {
            const response = await attachSourcePage(sourceUniqueId, trimmed, name.trim());
            const page = response?.data?.item?.attached_page;
            toast({
                title: page?.created ? 'Page created and linked.' : 'Existing page linked.',
                description: page?.created
                    ? undefined
                    : 'That URL was already in the graph, so it was cross-linked rather than duplicated.',
                status: 'success', duration: 3500, isClosable: true,
            });
            if (onSaved) await onSaved();
            onClose();
        } catch (error) {
            toast({
                title: 'Could not add the page.',
                description: error?.response?.data?.error || error?.message || 'Please try again.',
                status: 'error', duration: 4000, isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontSize="md">Add a source page</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">URL</FormLabel>
                            <Input
                                size="sm"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.edu/accessibility/procurement"
                            />
                            <FormHelperText fontSize="xs">
                                A URL already in the graph is linked, not duplicated. Its existing name and
                                any text it already carries are kept.
                            </FormHelperText>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Name</FormLabel>
                            <Input
                                size="sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ICT Procurement Procedures (Example University)"
                            />
                            <FormHelperText fontSize="xs">
                                Optional; the URL is used when this is blank. Naming the publisher keeps
                                near-identical pages apart. Ignored if the page already exists.
                            </FormHelperText>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={2} onClick={onClose} isDisabled={submitting}>Cancel</Button>
                    <Button size="sm" colorScheme={INTELLECTUAL_SOURCE_COLOR} onClick={handleSubmit}
                        isLoading={submitting} loadingText="Adding…">
                        Add Page
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default AddSourcePageForm;
