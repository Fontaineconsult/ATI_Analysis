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
    Input,
    Checkbox,
    VStack,
    useToast, CheckboxGroup,
} from '@chakra-ui/react';
import { updateIndividual } from '../../../services/api/put';
import { createIndividual } from '../../../services/api/post';

const EditIndividual = ({ isOpen, onClose, individualData, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        employee_id: '',
        email: '',
        title: '',
        ati_role: '',
        active: true,
        can_approve_yse: false,
        workingGroups: [],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const isEditMode = Boolean(individualData);

    useEffect(() => {
        if (isEditMode) {
            setFormData({ ...individualData });
        } else {
            // Clear form data for create mode
            setFormData({
                name: '',
                employee_id: '',
                email: '',
                title: '',
                ati_role: '',
                active: true,
                can_approve_yse: false,
                workingGroups: [],
            });
        }
    }, [individualData, isEditMode]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData((prev) => ({
                ...prev,
                [name]: checked,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleWorkingGroupChange = (wgName, isChecked) => {
        setFormData((prev) => {
            console.log(wgName, isChecked)
            const prevWorkingGroups = Array.isArray(prev.workingGroups) ? prev.workingGroups : [];

            let updatedWorkingGroups;
            if (isChecked) {
                // Add working group if not already present
                if (!prevWorkingGroups.some((wg) => wg.name === wgName)) {
                    updatedWorkingGroups = [...prevWorkingGroups, { name: wgName }];
                } else {
                    updatedWorkingGroups = prevWorkingGroups;
                }
            } else {
                // Remove working group
                updatedWorkingGroups = prevWorkingGroups.filter((wg) => wg.name !== wgName);
            }

            return { ...prev, workingGroups: updatedWorkingGroups };
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                await updateIndividual(formData);
                toast({
                    title: 'Individual updated successfully.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            } else {
                await createIndividual(formData);
                toast({
                    title: 'Individual created successfully.',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                });
            }
            onSave(); // Callback to refresh data in parent component
            onClose(); // Close the modal
        } catch (error) {
            toast({
                title: 'Error saving individual.',
                description: error.message || 'An error occurred.',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>{isEditMode ? 'Edit Individual' : 'Add Individual'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel>Name</FormLabel>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter name"
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel>Employee ID</FormLabel>
                            <Input
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleInputChange}
                                placeholder="Enter employee ID"
                                isReadOnly={isEditMode} // Prevent changing employee_id in edit mode
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Email</FormLabel>
                            <Input
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Title</FormLabel>
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter title"
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>ATI Role</FormLabel>
                            <Input
                                name="ati_role"
                                value={formData.ati_role}
                                onChange={handleInputChange}
                                placeholder="Enter ATI role"
                            />
                        </FormControl>

                        <FormControl>
                            <Checkbox
                                name="active"
                                isChecked={formData.active}
                                onChange={handleInputChange}
                            >
                                Active
                            </Checkbox>
                        </FormControl>

                        <FormControl>
                            <Checkbox
                                name="can_approve_yse"
                                isChecked={formData.can_approve_yse}
                                onChange={handleInputChange}
                            >
                                Can Approve YSE
                            </Checkbox>
                        </FormControl>

                        <CheckboxGroup>
                            <FormLabel>Working Groups</FormLabel>
                            <VStack align="start" spacing={2}>
                                <Checkbox
                                    isChecked={formData.workingGroups.some((wg) => wg.name === 'Instructional Materials')}
                                    onChange={(e) => handleWorkingGroupChange('Instructional Materials', e.target.checked)}
                                >
                                    Instructional Materials
                                </Checkbox>
                                <Checkbox
                                    isChecked={formData.workingGroups.some((wg) => wg.name === 'Procurement')}
                                    onChange={(e) => handleWorkingGroupChange('Procurement', e.target.checked)}
                                >
                                    Procurement
                                </Checkbox>
                                <Checkbox
                                    isChecked={formData.workingGroups.some((wg) => wg.name === 'Web')}
                                    onChange={(e) => handleWorkingGroupChange('Web', e.target.checked)}
                                >
                                    Web
                                </Checkbox>
                            </VStack>
                        </CheckboxGroup>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button onClick={onClose} mr={3}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        disabled={!formData.name || !formData.employee_id}
                    >
                        {isEditMode ? 'Update' : 'Create'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EditIndividual;
