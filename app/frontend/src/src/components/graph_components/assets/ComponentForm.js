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
    Select,
    Text,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { getComponentKindOptions } from './componentConfig';
import { createComponent } from '../../../services/api/post';
import { updateComponent } from '../../../services/api/put';

/**
 * Component create/edit modal.
 *
 * Identity is parent-interface + title-slug (component_identifier), built server-side. On
 * CREATE the user supplies title + an optional parent interface + kind. On EDIT title and
 * parent are immutable (the backend rejects them); only kind + description are editable,
 * and the identity fields render read-only.
 *
 * Props: isOpen, onClose, interfaces (summaries for the parent picker),
 *        presetInterfaceIdentifier (optional create prefill), existingComponent (edit
 *        mode + prefill), onSaved(component|null).
 */
function ComponentForm({ isOpen, onClose, interfaces = [], presetInterfaceIdentifier, existingComponent, onSaved }) {
    const isEdit = Boolean(existingComponent);
    const { vocab } = useSettings();
    const toast = useToast();
    const [form, setForm] = useState({
        title: '',
        interface_identifier: '',
        component_kind: '',
        description: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        // In edit mode existingComponent is the detail projection (part_of is an object).
        const parentFromDetail = existingComponent?.part_of?.interface_identifier || '';
        setForm({
            title: existingComponent?.title || '',
            interface_identifier: parentFromDetail || presetInterfaceIdentifier || '',
            component_kind: existingComponent?.component_kind || '',
            description: existingComponent?.description || '',
        });
    }, [isOpen, existingComponent, presetInterfaceIdentifier]);

    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    const handleSubmit = async () => {
        const title = form.title.trim();
        if (!title) { toast({ title: 'Title is required.', status: 'error', duration: 2000, isClosable: true }); return; }

        setSubmitting(true);
        try {
            let saved;
            if (isEdit) {
                const fields = {
                    component_kind: form.component_kind || null,
                    description: form.description.trim() || null,
                };
                const resp = await updateComponent(existingComponent.component_identifier, fields);
                saved = resp?.data?.component || null;
            } else {
                const payload = { title };
                if (form.interface_identifier) payload.interface_identifier = form.interface_identifier;
                if (form.component_kind) payload.component_kind = form.component_kind;
                if (form.description.trim()) payload.description = form.description.trim();
                const resp = await createComponent(payload);
                saved = resp?.data?.component || null;
            }
            toast({ title: isEdit ? 'Component updated.' : 'Component created.', status: 'success', duration: 2000, isClosable: true });
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
        <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEdit ? 'Edit Component' : 'Add Component'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired={!isEdit}>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Title</FormLabel>
                            <Input
                                size="sm"
                                value={form.title}
                                onChange={set('title')}
                                placeholder="e.g. Video Player"
                                isReadOnly={isEdit}
                                bg={isEdit ? 'gray.50' : undefined}
                                color={isEdit ? 'gray.500' : undefined}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Parent Interface</FormLabel>
                            {isEdit ? (
                                <Input
                                    size="sm"
                                    value={form.interface_identifier || 'standalone'}
                                    isReadOnly
                                    bg="gray.50"
                                    color="gray.600"
                                />
                            ) : (
                                <Select size="sm" placeholder="None (standalone)" value={form.interface_identifier} onChange={set('interface_identifier')}>
                                    {interfaces.map((i) => (
                                        <option key={i.interface_identifier} value={i.interface_identifier}>
                                            {i.title} ({i.interface_identifier})
                                        </option>
                                    ))}
                                </Select>
                            )}
                            <Text fontSize="2xs" color="gray.600" mt={1}>
                                The interface this component is part of. Part of identity, so immutable after create.
                            </Text>
                        </FormControl>

                        {isEdit && (
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Identifier</FormLabel>
                                <Input size="sm" value={existingComponent.component_identifier} isReadOnly bg="gray.50" color="gray.600" />
                            </FormControl>
                        )}

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Kind</FormLabel>
                            <Select size="sm" placeholder="Select kind…" value={form.component_kind} onChange={set('component_kind')}>
                                {getComponentKindOptions(vocab).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                            </Select>
                            <Text fontSize="2xs" color="gray.600" mt={1}>
                                The WCAG-grain functional role (where the standard's criteria attach).
                            </Text>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Description</FormLabel>
                            <Textarea size="sm" rows={3} value={form.description} onChange={set('description')} />
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

export default ComponentForm;
