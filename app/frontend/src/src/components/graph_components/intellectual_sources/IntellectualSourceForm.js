import React, { useEffect, useState } from 'react';
import {
    Button,
    Divider,
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
    Text,
    Textarea,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { createIntellectualSource } from '../../../services/api/post';
import { updateIntellectualSource } from '../../../services/api/put';
import {
    ATTRIBUTION_FIELDS,
    EDITABLE_FIELD_NAMES,
    INTELLECTUAL_SOURCE_COLOR,
    PROVENANCE_FIELDS,
} from './intellectualSourceTypes';

const BLANK = EDITABLE_FIELD_NAMES.reduce((acc, k) => ({ ...acc, [k]: '' }), { name: '' });

/**
 * Create/edit an IntellectualSource in a modal (single node type → no kind picker). `name` is
 * required and unique. The `informs` edges are managed in the detail panel, not here, matching
 * how PrincipleForm leaves grounding to its panel.
 *
 * Props: isOpen, onClose, existingItem, onSaved(item)
 */
function IntellectualSourceForm({ isOpen, onClose, existingItem, onSaved }) {
    const isEditMode = Boolean(existingItem);
    const [form, setForm] = useState(BLANK);
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) return;
        const next = { ...BLANK };
        for (const key of Object.keys(BLANK)) next[key] = existingItem?.[key] || '';
        setForm(next);
    }, [isOpen, existingItem]);

    const set = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

    const renderField = (field) => {
        const value = form[field.name] || '';
        const isMarkdown = field.type === 'markdown';
        const chars = value.length;
        // Char count and capture date replace the static hint once there is text, so the
        // field reports its own staleness. Same treatment governance Source Text gets.
        const help = isMarkdown && chars
            ? `${chars.toLocaleString()} characters${existingItem?.raw_text_captured ? ` · last captured ${existingItem.raw_text_captured}` : ''}. Re-pasting the same text does not move the capture date; clearing the box removes it.`
            : field.helpText;
        return (
            <FormControl key={field.name} isRequired={field.required}>
                <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">{field.label}</FormLabel>
                {field.type === 'textarea' || isMarkdown ? (
                    <Textarea
                        size="sm"
                        rows={isMarkdown ? 10 : 3}
                        value={value}
                        onChange={set(field.name)}
                        fontFamily={isMarkdown ? 'mono' : undefined}
                    />
                ) : (
                    <Input size="sm" type={field.type === 'date' ? 'date' : 'text'} value={value} onChange={set(field.name)} />
                )}
                {help && <FormHelperText fontSize="xs">{help}</FormHelperText>}
            </FormControl>
        );
    };

    const handleSubmit = async () => {
        const name = form.name.trim();
        if (!name) {
            toast({ title: 'Name is required.', status: 'error', duration: 2000, isClosable: true });
            return;
        }
        setSubmitting(true);
        try {
            const fields = { name };
            for (const key of EDITABLE_FIELD_NAMES) {
                const value = (form[key] || '').trim();
                // On edit an empty string is meaningful: it clears the field. On create it
                // is just an untouched box, so it is left off the payload entirely.
                if (isEditMode || value) fields[key] = value;
            }
            const response = isEditMode
                ? await updateIntellectualSource(existingItem.unique_id, fields)
                : await createIntellectualSource(fields);
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
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" closeOnOverlayClick={!submitting}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEditMode ? 'Edit Intellectual Source' : 'Add Intellectual Source'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Name</FormLabel>
                            <Input size="sm" value={form.name} onChange={set('name')}
                                placeholder="How to Interpret a VPAT (Harvard Digital Accessibility Services)" />
                            <FormHelperText fontSize="xs">Unique. Naming the publisher in the name keeps near-identical guides apart.</FormHelperText>
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Short Description</FormLabel>
                            <Textarea size="sm" rows={2} value={form.description_short} onChange={set('description_short')}
                                placeholder="What the source says, in one line…" />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">Full Description</FormLabel>
                            <Textarea size="sm" rows={5} value={form.description_full} onChange={set('description_full')}
                                placeholder="The whole idea, and what a campus would take from it…" />
                        </FormControl>

                        <Divider borderColor="gray.200" />
                        <Text fontSize="xs" color="gray.600" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                            Attribution
                        </Text>
                        {ATTRIBUTION_FIELDS.map(renderField)}

                        <Divider borderColor="gray.200" />
                        <Text fontSize="xs" color="gray.600" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                            Provenance
                        </Text>
                        {PROVENANCE_FIELDS.map(renderField)}
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button size="sm" variant="ghost" mr={2} onClick={onClose} isDisabled={submitting}>Cancel</Button>
                    <Button size="sm" colorScheme={INTELLECTUAL_SOURCE_COLOR} onClick={handleSubmit} isLoading={submitting}
                        loadingText={isEditMode ? 'Saving…' : 'Creating…'}>
                        {isEditMode ? 'Save Changes' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default IntellectualSourceForm;
