import React, { useEffect, useState } from 'react';
import {
    Button,
    Checkbox,
    CheckboxGroup,
    Divider,
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
    useToast,
    VStack,
} from '@chakra-ui/react';
import { useSettings } from '../../../context/SettingsContext';
import { createIndividual } from '../../../services/api/post';
import { updateIndividual } from '../../../services/api/put';
import {
    PERSON_FORM_FIELDS,
    PERSON_STATUS_FIELDS,
    WORKING_GROUPS,
    WORKING_GROUP_ORDER,
    personWorkingGroups,
} from './peopleConfig';

const emptyForm = () => ({
    name: '',
    employee_id: '',
    email: '',
    title: '',
    ati_role: '',
    host_campus: '',
    active: true,
    non_committee_member_active: false,
    can_approve_yse: false,
    workingGroups: [],
});

/**
 * Canon create/edit modal for a Person (mirrors GovernanceForm). Fields come
 * from peopleConfig — the form, badges, and roster all share one vocabulary.
 *
 * Props:
 *   isOpen, onClose
 *   existingPerson   When provided, switches to edit mode and pre-fills
 *                    (roster- or detail-shaped person object).
 *   onSaved(employeeId)  Called after a successful save.
 */
function PersonForm({ isOpen, onClose, existingPerson, onSaved }) {
    const isEditMode = Boolean(existingPerson);
    const { campuses, campusesLoading } = useSettings();
    const [formData, setFormData] = useState(emptyForm());
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!isOpen) return;
        if (existingPerson) {
            setFormData({
                ...emptyForm(),
                name: existingPerson.name || '',
                employee_id: existingPerson.employee_id || '',
                email: existingPerson.email || '',
                title: existingPerson.title || '',
                ati_role: existingPerson.ati_role || '',
                host_campus: existingPerson.host_campus || '',
                active: existingPerson.active !== false,
                non_committee_member_active: !!existingPerson.non_committee_member_active,
                can_approve_yse: !!existingPerson.can_approve_yse,
                workingGroups: personWorkingGroups(existingPerson).map((name) => ({ name })),
            });
        } else {
            setFormData(emptyForm());
        }
    }, [isOpen, existingPerson]);

    const setField = (name) => (e) => {
        const value = e.target?.value ?? '';
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const setFlag = (name) => (e) => {
        const checked = !!e.target?.checked;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const toggleWorkingGroup = (wgName) => (e) => {
        const checked = !!e.target?.checked;
        setFormData((prev) => {
            const current = prev.workingGroups.filter((wg) => wg.name !== wgName);
            return {
                ...prev,
                workingGroups: checked ? [...current, { name: wgName }] : current,
            };
        });
    };

    const handleSubmit = async () => {
        if (!formData.name?.trim() || !formData.employee_id?.trim()) {
            toast({ title: 'Name and Employee ID are required.', status: 'error', duration: 2000, isClosable: true });
            return;
        }
        // Ship only the fields the individuals endpoint knows — never the
        // enriched detail payload (roles, YSEs, …) a detail-shaped person carries.
        const payload = {
            name: formData.name.trim(),
            employee_id: formData.employee_id.trim(),
            email: formData.email?.trim() || '',
            title: formData.title?.trim() || '',
            ati_role: formData.ati_role?.trim() || '',
            host_campus: formData.host_campus || '',
            active: formData.active,
            non_committee_member_active: formData.non_committee_member_active,
            can_approve_yse: formData.can_approve_yse,
            workingGroups: formData.workingGroups,
        };

        setSubmitting(true);
        try {
            if (isEditMode) {
                await updateIndividual(payload);
            } else {
                await createIndividual(payload);
            }
            toast({
                title: isEditMode ? 'Person updated.' : 'Person created.',
                status: 'success',
                duration: 2000,
                isClosable: true,
                position: 'top-right',
            });
            if (onSaved) onSaved(payload.employee_id);
            onClose();
        } catch (error) {
            toast({
                title: isEditMode ? 'Update failed.' : 'Create failed.',
                description: error?.message || 'Please try again.',
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
                <ModalHeader>{isEditMode ? `Edit ${existingPerson.name || 'Person'}` : 'Add Person'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack align="stretch" spacing={3}>
                        {PERSON_FORM_FIELDS.map((field) => {
                            const readOnly = isEditMode && field.readOnlyInEdit;
                            return (
                                <FormControl key={field.name} isRequired={field.required}>
                                    <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">
                                        {field.label}
                                    </FormLabel>
                                    <Input
                                        size="sm"
                                        type={field.type === 'email' ? 'email' : 'text'}
                                        value={formData[field.name] || ''}
                                        onChange={setField(field.name)}
                                        isReadOnly={readOnly}
                                        bg={readOnly ? 'gray.50' : 'white'}
                                    />
                                </FormControl>
                            );
                        })}

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold">
                                Host Campus
                            </FormLabel>
                            <Select
                                size="sm"
                                value={formData.host_campus || ''}
                                onChange={setField('host_campus')}
                                placeholder={campusesLoading ? 'Loading campuses…' : 'Select a campus'}
                                isDisabled={campusesLoading}
                            >
                                {(campuses || []).map((c) => (
                                    <option key={c.abbreviation} value={c.abbreviation}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider borderColor="gray.200" />

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold" mb={2}>
                                Status
                            </FormLabel>
                            <VStack align="start" spacing={2}>
                                {PERSON_STATUS_FIELDS.map((flag) => (
                                    <Checkbox
                                        key={flag.name}
                                        size="sm"
                                        colorScheme="teal"
                                        isChecked={!!formData[flag.name]}
                                        onChange={setFlag(flag.name)}
                                    >
                                        {flag.label}
                                    </Checkbox>
                                ))}
                            </VStack>
                        </FormControl>

                        <Divider borderColor="gray.200" />

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.700" fontWeight="semibold" mb={2}>
                                Working Groups
                            </FormLabel>
                            <CheckboxGroup>
                                <VStack align="start" spacing={2}>
                                    {WORKING_GROUP_ORDER.map((key) => {
                                        const wg = WORKING_GROUPS[key];
                                        return (
                                            <Checkbox
                                                key={wg.key}
                                                size="sm"
                                                colorScheme={wg.colorScheme}
                                                isChecked={formData.workingGroups.some((w) => w.name === wg.name)}
                                                onChange={toggleWorkingGroup(wg.name)}
                                            >
                                                {wg.name}
                                            </Checkbox>
                                        );
                                    })}
                                </VStack>
                            </CheckboxGroup>
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

export default PersonForm;
