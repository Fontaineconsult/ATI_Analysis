import React, { useEffect, useState } from 'react';
import {
    Button,
    FormControl,
    FormHelperText,
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
    Select,
    useToast,
    VStack,
} from '@chakra-ui/react';
import SchemaElementKindBadge from './SchemaElementKindBadge';
import { SCHEMA_ELEMENT_KIND_ORDER, HANDLE_PLACEHOLDER, humanizeKind } from './schemaElementTypes';
import { createSchemaElement } from '../../../services/api/post';
import { updateSchemaElement } from '../../../services/api/put';
import { useDescriptors } from '../../../hooks/useDescriptors';

/**
 * Create/edit a SchemaElement in a modal. On create, `element_kind` is chosen via a select
 * (single-form variant of Governance's two-step picker); `handle` + `name` are the fields.
 * On edit, handle + kind are immutable identity — only `name` changes.
 *
 * Props: isOpen, onClose, existingItem, onSaved(item)
 */
function SchemaElementForm({ isOpen, onClose, existingItem, onSaved }) {
    const isEditMode = Boolean(existingItem);
    const { describeFieldValue } = useDescriptors();
    const [kind, setKind] = useState('node_label');
    const [handle, setHandle] = useState('');
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) return;
        if (isEditMode) {
            setKind(existingItem.element_kind || 'node_label');
            setHandle(existingItem.handle || '');
            setName(existingItem.name || '');
        } else {
            setKind('node_label');
            setHandle('');
            setName('');
        }
    }, [isOpen, isEditMode, existingItem]);

    const kindLabel = (k) => describeFieldValue('element_kind', k)?.title || humanizeKind(k);

    const handleSubmit = async () => {
        const cleanedHandle = handle.trim();
        if (!cleanedHandle) {
            toast({ title: 'Handle is required.', status: 'error', duration: 2000, isClosable: true });
            return;
        }
        setSubmitting(true);
        try {
            const fields = { name: name.trim() || undefined };
            const response = isEditMode
                ? await updateSchemaElement(existingItem.handle, fields)
                : await createSchemaElement(kind, { handle: cleanedHandle, ...fields });
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
                <ModalHeader>
                    <HStack>
                        {isEditMode && <SchemaElementKindBadge kind={kind} />}
                        <span>{isEditMode ? 'Edit Schema Element' : 'Add Schema Element'}</span>
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        {!isEditMode && (
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Kind</FormLabel>
                                <Select size="sm" value={kind} onChange={(e) => setKind(e.target.value)} borderColor="gray.300">
                                    {SCHEMA_ELEMENT_KIND_ORDER.map((k) => (
                                        <option key={k} value={k}>{kindLabel(k)}</option>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Handle</FormLabel>
                            <Input
                                size="sm"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value)}
                                placeholder={HANDLE_PLACEHOLDER[kind] || 'label:Tool'}
                                isReadOnly={isEditMode}
                                bg={isEditMode ? 'gray.50' : 'white'}
                                fontFamily="mono"
                            />
                            <FormHelperText fontSize="xs">
                                {isEditMode
                                    ? 'Identity — immutable. Delete and re-create to change.'
                                    : 'Namespaced by kind: label:<Label> / rel:<rel> / field:<Label>.<field>.'}
                            </FormHelperText>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Name</FormLabel>
                            <Input size="sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Human label, e.g. Tool" />
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

export default SchemaElementForm;
