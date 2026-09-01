import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
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
    Select,
    Switch,
    Text,
    Textarea,
    VStack,
    useToast,
} from '@chakra-ui/react';

import {
    buildEditPayload,
    editableFieldsFor,
    getTypeLabel,
    initialEditValues,
    isNoOpPayload,
    DOC_TYPES,
} from './documentationConfig';

/**
 * Edit one documentation record's own fields.
 *
 * Config-driven: the fields come from DOC_EDIT_FIELDS, which mirrors what each
 * update_* function on the server actually reads, then are narrowed again by the
 * server's own type_capabilities. So a control never appears for a property the
 * schema does not have — the failure mode this replaces is a switch that reports
 * success and writes nothing.
 *
 * WHAT THIS DOES NOT DO, deliberately. It does not re-point a record at a
 * different parent, and it does not create or delete one. Those change what a
 * record MEANS in the graph and belong to the surfaces that own the parent
 * context — the implementation explorer, the governance panel. This form edits
 * the record itself, which is the piece the Documentation area is the right home
 * for and the piece nothing else offered.
 *
 * It also sends only what changed; see buildEditPayload for why that is a
 * correctness requirement rather than a nicety.
 */
function DocumentationEditForm({ item, capabilities, isOpen, onClose, onSave }) {
    const toast = useToast();
    const [values, setValues] = useState({});
    const [saving, setSaving] = useState(false);

    const fields = useMemo(
        () => (item ? editableFieldsFor(item.doc_type, capabilities) : []),
        [item, capabilities],
    );

    // Re-seed whenever a different record is opened, so the form never shows the
    // previous record's values against this one's id.
    useEffect(() => {
        if (isOpen && item) setValues(initialEditValues(item, fields));
    }, [isOpen, item, fields]);

    const set = (name) => (e) => {
        const next = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setValues((prev) => ({ ...prev, [name]: next }));
    };

    const handleSubmit = async () => {
        const payload = buildEditPayload(item, fields, values);
        if (isNoOpPayload(payload)) {
            toast({
                title: 'Nothing to save.',
                description: 'No fields were changed.',
                status: 'info',
                duration: 2000,
                isClosable: true,
            });
            return;
        }

        setSaving(true);
        try {
            await onSave(payload);
            toast({
                title: `${getTypeLabel(item.doc_type)} updated.`,
                status: 'success',
                duration: 2000,
                isClosable: true,
            });
            onClose();
        } catch (e) {
            toast({
                title: 'Save failed.',
                description: e?.response?.data?.error || e?.message || 'Please try again.',
                status: 'error',
                duration: 3500,
                isClosable: true,
            });
        } finally {
            setSaving(false);
        }
    };

    if (!item) return null;

    const typeConfig = DOC_TYPES[item.doc_type] || {};
    const shared = (item.parent_count || 0) > 1;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader fontSize="md">
                    Edit {getTypeLabel(item.doc_type)}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {/* Stated before anything editable, not after. One shared node
                        means this edit reaches every record that holds it, and
                        there is no way to change it for only one of them. */}
                    {shared && (
                        <Alert status="warning" borderRadius="md" fontSize="sm" mb={4}>
                            <AlertIcon />
                            <Text>
                                This record is attached to {item.parent_count} records. Editing it
                                changes what all {item.parent_count} of them show.
                            </Text>
                        </Alert>
                    )}

                    {typeConfig.incompleteConcept && (
                        <Alert status="info" borderRadius="md" fontSize="xs" mb={4}>
                            <AlertIcon />
                            {getTypeLabel(item.doc_type)} is not a finished concept in the ontology
                            yet — thin data here is unfinished modelling, not a record to reconcile.
                        </Alert>
                    )}

                    <VStack align="stretch" spacing={4}>
                        {fields.map((field) => (
                            <FormControl key={field.name}>
                                <FormLabel fontSize="sm" mb={1}>{field.label}</FormLabel>

                                {field.type === 'boolean' && (
                                    <Switch
                                        isChecked={Boolean(values[field.name])}
                                        onChange={set(field.name)}
                                        colorScheme="teal"
                                        aria-label={field.label}
                                    />
                                )}

                                {/* Three options, not a checkbox: "not assessed" is a
                                    real state and collapsing it into false would
                                    claim someone had looked. */}
                                {field.type === 'tristate' && (
                                    <Select
                                        size="sm"
                                        value={values[field.name] ?? ''}
                                        onChange={set(field.name)}
                                        aria-label={field.label}
                                    >
                                        <option value="">Not assessed</option>
                                        <option value="false">No</option>
                                        <option value="true">Yes</option>
                                    </Select>
                                )}

                                {field.type === 'date' && (
                                    <Input
                                        type="date"
                                        size="sm"
                                        value={values[field.name] ?? ''}
                                        onChange={set(field.name)}
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <Textarea
                                        size="sm"
                                        rows={field.rows || 3}
                                        value={values[field.name] ?? ''}
                                        onChange={set(field.name)}
                                    />
                                )}

                                {field.type === 'text' && (
                                    <Input
                                        size="sm"
                                        value={values[field.name] ?? ''}
                                        onChange={set(field.name)}
                                    />
                                )}

                                {field.help && (
                                    <FormHelperText fontSize="xs">{field.help}</FormHelperText>
                                )}
                            </FormControl>
                        ))}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose} size="sm">Cancel</Button>
                    <Button
                        colorScheme="teal"
                        onClick={handleSubmit}
                        isLoading={saving}
                        loadingText="Saving"
                        size="sm"
                    >
                        Save
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default DocumentationEditForm;
