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
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { createPrinciple } from '../../../services/api/post';
import { updatePrinciple } from '../../../services/api/put';

/**
 * Create/edit a Principle in a modal (single node type → no kind picker). `handle` + `name`
 * required; `handle` is immutable identity on edit. Grounding/shapes edges are managed in the
 * detail panel, not here.
 *
 * Props: isOpen, onClose, existingItem, onSaved(item)
 */
function PrincipleForm({ isOpen, onClose, existingItem, onSaved }) {
    const isEditMode = Boolean(existingItem);
    const [form, setForm] = useState({ handle: '', name: '', description_short: '', description_full: '' });
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) return;
        setForm({
            handle: existingItem?.handle || '',
            name: existingItem?.name || '',
            description_short: existingItem?.description_short || '',
            description_full: existingItem?.description_full || '',
        });
    }, [isOpen, existingItem]);

    const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

    const handleSubmit = async () => {
        const handle = form.handle.trim();
        const name = form.name.trim();
        if (!handle || !name) {
            toast({ title: 'Handle and name are required.', status: 'error', duration: 2000, isClosable: true });
            return;
        }
        setSubmitting(true);
        try {
            const fields = {
                name,
                description_short: form.description_short.trim() || undefined,
                description_full: form.description_full.trim() || undefined,
            };
            const response = isEditMode
                ? await updatePrinciple(existingItem.handle, fields)
                : await createPrinciple({ handle, ...fields });
            toast({ title: isEditMode ? 'Updated.' : 'Created.', status: 'success', duration: 2000, isClosable: true });
            if (onSaved) onSaved(response?.data?.item || null);
            onClose();
        } catch (error) {
            toast({
                title: isEditMode ? 'Update failed.' : 'Create failed.',
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
                <ModalHeader>{isEditMode ? 'Edit Principle' : 'Add Principle'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Handle</FormLabel>
                            <Input
                                size="sm"
                                value={form.handle}
                                onChange={set('handle')}
                                placeholder="principle:closest-to-capacity"
                                isReadOnly={isEditMode}
                                bg={isEditMode ? 'gray.50' : 'white'}
                                fontFamily="mono"
                            />
                            <FormHelperText fontSize="xs">
                                {isEditMode ? 'Identity — immutable.' : "Namespaced 'principle:<slug>'."}
                            </FormHelperText>
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Name</FormLabel>
                            <Input size="sm" value={form.name} onChange={set('name')} placeholder="Closest to capacity" />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Short Description</FormLabel>
                            <Textarea size="sm" rows={2} value={form.description_short} onChange={set('description_short')}
                                placeholder="Concise statement of the commitment (default UI text)…" />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Full Rationale</FormLabel>
                            <Textarea size="sm" rows={6} value={form.description_full} onChange={set('description_full')}
                                placeholder="The whole idea — reasoning and design commitment behind the principle…" />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={2} onClick={onClose} isDisabled={submitting}>Cancel</Button>
                    <Button size="sm" colorScheme="teal" onClick={handleSubmit} isLoading={submitting}
                        loadingText={isEditMode ? 'Saving…' : 'Creating…'}>
                        {isEditMode ? 'Save Changes' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default PrincipleForm;
