import React, { useState, useEffect } from 'react';
import {
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    FormHelperText,
    Input,
    Textarea,
    Select,
    Checkbox,
    VStack,
    Divider,
    Text,
    Code,
    useToast,
} from '@chakra-ui/react';
import { createDescriptor } from '../../../services/api/post';
import { updateDescriptor } from '../../../services/api/put';
import { deleteDescriptor } from '../../../services/api/delete';
import { fetchSettings } from '../../../services/api/get';
import { useDescriptors } from '../../../hooks/useDescriptors';

// Fallback if /settings is unavailable — the kinds are a fixed set.
const DEFAULT_KINDS = { node_type: 'Node Type', field: 'Field', field_value: 'Field Value', rel_type: 'Relationship Type' };

const EMPTY_FORM = {
    descriptor_kind: 'node_type',
    target_label: '',
    target_field: '',
    target_value: '',
    title: '',
    description_short: '',
    description_full: '',
    include_in_report: false,
};

// Which target_* coordinates each kind requires (drives the conditional inputs + validation).
const TARGETS_BY_KIND = {
    node_type: ['target_label'],
    field: ['target_label', 'target_field'],
    field_value: ['target_field', 'target_value'],
    rel_type: ['target_field'],  // the relationship name (handle: rel_type:<name>)
};

const TARGET_META = {
    target_label: { label: 'Target Label', placeholder: 'e.g. Interface', help: 'The node-type label.' },
    target_field: { label: 'Target Field / Name', placeholder: 'e.g. function / develops', help: 'The field name, or (for a relationship type) the relationship name.' },
    target_value: { label: 'Target Value', placeholder: 'e.g. teaching-and-learning', help: 'The vocabulary value key.' },
};

const KIND_LABEL = { node_type: 'Node Type', field: 'Field', field_value: 'Field Value', rel_type: 'Relationship Type' };

// Mirror identifiers.py so the locked handle preview matches what the backend will build.
function previewHandle(f) {
    switch (f.descriptor_kind) {
        case 'node_type': return `node_type:${f.target_label}`;
        case 'field': return `field:${f.target_label}.${f.target_field}`;
        case 'field_value': return `field_value:${f.target_field}.${f.target_value}`;
        case 'rel_type': return `rel_type:${f.target_field}`;
        default: return '';
    }
}

/**
 * Create / edit a UniversalDescriptor.
 *
 * Three modes:
 *   - edit         (descriptorData set)  → patch prose; handle/kind/target are immutable.
 *   - preset-create (presetTarget set)   → create for a SPECIFIC element (the ontology browser
 *                                          knows the kind + target); those are locked, you write prose.
 *   - free create  (neither)             → the open "Add Descriptor" form with kind/target inputs.
 */
const EditDescriptor = ({ isOpen, onClose, descriptorData, onSave, presetTarget }) => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [kinds, setKinds] = useState(DEFAULT_KINDS);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    // Refetch the app-wide descriptor store after any edit so every consumer (glossary,
    // tooltips, inline help) updates live without a page reload.
    const { refreshDescriptors } = useDescriptors();

    const isEditMode = Boolean(descriptorData);
    const isPreset = !isEditMode && Boolean(presetTarget);

    useEffect(() => {
        let active = true;
        fetchSettings()
            .then((resp) => {
                if (active && resp?.data?.descriptor_kinds) setKinds(resp.data.descriptor_kinds);
            })
            .catch(() => { /* keep DEFAULT_KINDS */ });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                descriptor_kind: descriptorData.descriptor_kind || 'node_type',
                target_label: descriptorData.target_label || '',
                target_field: descriptorData.target_field || '',
                target_value: descriptorData.target_value || '',
                title: descriptorData.title || '',
                description_short: descriptorData.description_short || '',
                description_full: descriptorData.description_full || '',
                include_in_report: Boolean(descriptorData.include_in_report),
            });
        } else if (presetTarget) {
            setFormData({
                ...EMPTY_FORM,
                descriptor_kind: presetTarget.descriptor_kind || 'node_type',
                target_label: presetTarget.target_label || '',
                target_field: presetTarget.target_field || '',
                target_value: presetTarget.target_value || '',
            });
        } else {
            setFormData(EMPTY_FORM);
        }
    }, [descriptorData, isEditMode, presetTarget]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const requiredTargets = TARGETS_BY_KIND[formData.descriptor_kind] || [];

    // Create needs the target coordinates for the chosen kind (unless preset supplies them);
    // edit only touches descriptions.
    const isValid = isEditMode || isPreset || requiredTargets.every((t) => formData[t] && formData[t].trim());

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await updateDescriptor(descriptorData.descriptor_handle, {
                    title: formData.title,
                    description_short: formData.description_short,
                    description_full: formData.description_full,
                    include_in_report: formData.include_in_report,
                });
                toast({ title: 'Descriptor updated.', status: 'success', duration: 2000, isClosable: true });
            } else {
                await createDescriptor({
                    descriptor_kind: formData.descriptor_kind,
                    target_label: formData.target_label || null,
                    target_field: formData.target_field || null,
                    target_value: formData.target_value || null,
                    title: formData.title || null,
                    description_short: formData.description_short || null,
                    description_full: formData.description_full || null,
                    include_in_report: formData.include_in_report,
                });
                toast({ title: 'Descriptor created.', status: 'success', duration: 2000, isClosable: true });
            }
            onSave();
            refreshDescriptors();
            onClose();
        } catch (error) {
            const msg = error?.response?.data?.error || error.message;
            toast({ title: 'Error saving descriptor.', description: msg, status: 'error', duration: 4000, isClosable: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete the description for "${descriptorData.descriptor_handle}"? This cannot be undone.`)) return;
        setIsSubmitting(true);
        try {
            await deleteDescriptor(descriptorData.descriptor_handle);
            toast({ title: 'Descriptor deleted.', status: 'info', duration: 2000, isClosable: true });
            onSave();
            refreshDescriptors();
            onClose();
        } catch (error) {
            const msg = error?.response?.data?.error || error.message;
            toast({ title: 'Error deleting descriptor.', description: msg, status: 'error', duration: 4000, isClosable: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    const lockedHandle = isEditMode ? descriptorData.descriptor_handle : previewHandle(formData);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent maxH="90vh">
                <ModalHeader color="gray.800" fontWeight="bold">
                    {isEditMode ? 'Edit Description' : isPreset ? `Describe ${KIND_LABEL[formData.descriptor_kind] || 'Element'}` : 'Add Descriptor'}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        {(isEditMode || isPreset) ? (
                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                    {KIND_LABEL[formData.descriptor_kind] || 'Element'}
                                </FormLabel>
                                <Code fontSize="sm" px={2} py={1} borderRadius="md" colorScheme="teal">
                                    {lockedHandle}
                                </Code>
                                <FormHelperText fontSize="xs">
                                    The kind and target are identity and cannot be changed{isEditMode ? '. To change them, delete and re-create.' : ' — you are writing this element’s description.'}
                                </FormHelperText>
                            </FormControl>
                        ) : (
                            <>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Kind</FormLabel>
                                    <Select size="sm" name="descriptor_kind" value={formData.descriptor_kind}
                                        onChange={handleInputChange} borderColor="gray.300">
                                        {Object.entries(kinds).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </Select>
                                </FormControl>

                                {requiredTargets.map((t) => (
                                    <FormControl key={t} isRequired>
                                        <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">{TARGET_META[t].label}</FormLabel>
                                        <Input size="sm" name={t} value={formData[t]} onChange={handleInputChange}
                                            placeholder={TARGET_META[t].placeholder} borderColor="gray.300"
                                            _hover={{ borderColor: 'gray.400' }}
                                            _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                                        <FormHelperText fontSize="xs">{TARGET_META[t].help}</FormHelperText>
                                    </FormControl>
                                ))}
                            </>
                        )}

                        <Divider />

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Title</FormLabel>
                            <Input size="sm" name="title" value={formData.title} onChange={handleInputChange}
                                placeholder="Short human label, e.g. Function" borderColor="gray.300"
                                _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Short Description</FormLabel>
                            <Textarea size="sm" name="description_short" value={formData.description_short}
                                onChange={handleInputChange} rows={2} placeholder="Concise text shown by default in tooltips & the browser..."
                                borderColor="gray.300" _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">Full Description</FormLabel>
                            <Textarea size="sm" name="description_full" value={formData.description_full}
                                onChange={handleInputChange} rows={6} placeholder="Long-form reasoning and design rationale (the whole idea / why)..."
                                borderColor="gray.300" _hover={{ borderColor: 'gray.400' }}
                                _focus={{ borderColor: 'teal.500', boxShadow: '0 0 0 1px teal.500' }} />
                        </FormControl>

                        <FormControl>
                            <Checkbox name="include_in_report" isChecked={formData.include_in_report}
                                onChange={handleInputChange} colorScheme="teal">
                                <Text fontSize="sm" color="gray.700">Include in report</Text>
                            </Checkbox>
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    {isEditMode && (
                        <Button size="sm" colorScheme="red" variant="ghost" mr="auto"
                            onClick={handleDelete} isDisabled={isSubmitting}>
                            Delete
                        </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={onClose} mr={3} borderColor="gray.300" _hover={{ bg: 'gray.50' }}>
                        Cancel
                    </Button>
                    <Button size="sm" colorScheme="teal" onClick={handleSubmit} isLoading={isSubmitting} isDisabled={!isValid}>
                        {isEditMode ? 'Update' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditDescriptor;
