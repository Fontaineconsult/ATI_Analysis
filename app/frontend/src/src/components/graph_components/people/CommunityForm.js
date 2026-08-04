import React, { useEffect, useState } from 'react';
import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { createCommunity } from '../../../services/api/post';
import { updateCommunity } from '../../../services/api/put';

/**
 * Canon create/edit modal for a CommunityOfPractice. Name is required and
 * unique (the backend rejects duplicates); description is optional prose.
 *
 * Props:
 *   isOpen, onClose
 *   existingCommunity  When provided, switches to edit mode and pre-fills.
 *   onSaved(community) Called with the API-returned community after a save.
 */
function CommunityForm({ isOpen, onClose, existingCommunity, onSaved }) {
    const isEditMode = Boolean(existingCommunity);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) return;
        setName(existingCommunity?.name || '');
        setDescription(existingCommunity?.description || '');
    }, [isOpen, existingCommunity]);

    const handleSubmit = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            toast({ title: 'Community name is required.', status: 'error', duration: 2000, isClosable: true });
            return;
        }
        setSubmitting(true);
        try {
            const response = isEditMode
                ? await updateCommunity(existingCommunity.unique_id, { name: trimmed, description: description.trim() || null })
                : await createCommunity({ name: trimmed, description: description.trim() || null });
            toast({
                title: isEditMode ? 'Community updated.' : 'Community created.',
                status: 'success',
                duration: 2000,
                isClosable: true,
                position: 'top-right',
            });
            if (onSaved) onSaved(response?.data?.community || null);
            onClose();
        } catch (error) {
            toast({
                title: isEditMode ? 'Update failed.' : 'Create failed.',
                description: error?.response?.data?.error || error?.message || 'Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
                position: 'top-right',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEditMode ? `Edit ${existingCommunity.name}` : 'Add Community'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Name</FormLabel>
                            <Input
                                size="sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Alternative Media"
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Description</FormLabel>
                            <Textarea
                                size="sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Who works this ground, across campuses?"
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={2} onClick={onClose} isDisabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={submitting}
                        loadingText={isEditMode ? 'Saving…' : 'Creating…'}
                    >
                        {isEditMode ? 'Save Changes' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default CommunityForm;
