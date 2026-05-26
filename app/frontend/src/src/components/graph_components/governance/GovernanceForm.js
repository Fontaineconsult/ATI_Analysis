import React, { useEffect, useState } from 'react';
import {
    Button,
    FormControl,
    FormLabel,
    HStack,
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
import GovernanceTypeBadge from './GovernanceTypeBadge';
import { getGovernanceTypeConfig } from './governanceTypes';
import { createGovernance } from '../../../services/api/post';
import { updateGovernance } from '../../../services/api/put';

/**
 * Type-aware governance form rendered inside a modal. Drives both create and
 * edit. Fields come from governanceTypes.js — adding a new governance type
 * means editing one file; this form picks up the new shape automatically.
 *
 * Props:
 *   isOpen, onClose
 *   governanceType  Required for create; for edit, derived from `existingItem.type`.
 *   existingItem    When provided, switches to edit mode and pre-fills.
 *   onSaved(item)   Called after a successful save with the API-returned item.
 */
function GovernanceForm({ isOpen, onClose, governanceType, existingItem, onSaved }) {
    const isEditMode = Boolean(existingItem);
    const effectiveType = isEditMode ? existingItem.type : governanceType;
    const config = getGovernanceTypeConfig(effectiveType);

    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen || !config) return;
        const initial = {};
        for (const field of config.fields) {
            initial[field.name] = existingItem?.[field.name] || '';
        }
        setFormData(initial);
    }, [isOpen, config, existingItem]);

    if (!config) return null;

    const handleChange = (name) => (e) => {
        const value = e.target?.value ?? '';
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        // Trim and drop empties so the backend doesn't store whitespace-only values.
        const cleaned = {};
        for (const field of config.fields) {
            const v = (formData[field.name] || '').toString().trim();
            if (v) cleaned[field.name] = v;
        }
        if (!cleaned.title) {
            toast({ title: 'Title is required.', status: 'error', duration: 2000, isClosable: true });
            return;
        }

        setSubmitting(true);
        try {
            const response = isEditMode
                ? await updateGovernance(effectiveType, existingItem.unique_id, cleaned)
                : await createGovernance(effectiveType, cleaned);
            toast({
                title: isEditMode ? 'Updated.' : 'Created.',
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
            if (onSaved) onSaved(response?.data?.item || null);
            onClose();
        } catch (error) {
            toast({
                title: isEditMode ? 'Update failed.' : 'Create failed.',
                description: error?.message || 'Please try again.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack>
                        <GovernanceTypeBadge type={effectiveType} />
                        <span>{isEditMode ? `Edit ${config.label}` : `Add ${config.label}`}</span>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        {config.fields.map((field) => (
                            <FormControl key={field.name} isRequired={field.required}>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">
                                    {field.label}
                                </FormLabel>
                                {field.type === 'textarea' ? (
                                    <Textarea
                                        size="sm"
                                        value={formData[field.name] || ''}
                                        onChange={handleChange(field.name)}
                                        rows={3}
                                    />
                                ) : (
                                    <Input
                                        size="sm"
                                        type={field.type === 'date' ? 'date' : 'text'}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange(field.name)}
                                    />
                                )}
                            </FormControl>
                        ))}
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

export default GovernanceForm;
