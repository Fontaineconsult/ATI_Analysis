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
    useToast,
    VStack,
} from '@chakra-ui/react';
import { createVendor } from '../../../services/api/post';
import { updateVendor } from '../../../services/api/put';

/**
 * Vendor create/edit modal. Create is a plain POST {name, location?}; edit is the
 * `update` PUT action (location + optional rename via new_name). Name is the
 * unique business key, so editing it renames the node (existing Asset.supplied_by
 * / employs edges survive the rename).
 *
 * Props: isOpen, onClose, existingVendor (edit + prefill), onSaved(vendor|null).
 */
function VendorForm({ isOpen, onClose, existingVendor, onSaved }) {
    const isEdit = Boolean(existingVendor);
    const toast = useToast();
    const [form, setForm] = useState({ name: '', location: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setForm({ name: existingVendor?.name || '', location: existingVendor?.location || '' });
    }, [isOpen, existingVendor]);

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async () => {
        const name = form.name.trim();
        if (!name) { toast({ title: 'Name is required.', status: 'error', duration: 2000, isClosable: true }); return; }

        setSubmitting(true);
        try {
            let saved;
            if (isEdit) {
                const resp = await updateVendor(existingVendor.name, {
                    new_name: name,
                    location: form.location.trim() || null,
                });
                saved = resp?.data?.vendor || null;
            } else {
                const payload = { name };
                if (form.location.trim()) payload.location = form.location.trim();
                const resp = await createVendor(payload);
                saved = resp?.data?.vendor || null;
            }
            toast({ title: isEdit ? 'Vendor updated.' : 'Vendor created.', status: 'success', duration: 2000, isClosable: true });
            if (onSaved) onSaved(saved);
            onClose();
        } catch (error) {
            toast({
                title: isEdit ? 'Update failed.' : 'Create failed.',
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3500,
                isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEdit ? 'Edit Vendor' : 'Add Vendor'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Name</FormLabel>
                            <Input size="sm" value={form.name} onChange={set('name')} />
                        </FormControl>
                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Location</FormLabel>
                            <Input size="sm" value={form.location} onChange={set('location')} />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={2} onClick={onClose} isDisabled={submitting}>Cancel</Button>
                    <Button
                        size="sm"
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={submitting}
                        loadingText={isEdit ? 'Saving…' : 'Creating…'}
                    >
                        {isEdit ? 'Save Changes' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default VendorForm;
