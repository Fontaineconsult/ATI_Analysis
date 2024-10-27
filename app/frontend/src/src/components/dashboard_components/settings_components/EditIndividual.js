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
    Select,
    VStack,
    HStack,
    useToast,
} from '@chakra-ui/react';
import { updateIndividual } from '../../../services/api/put';
import {createIndividual} from "../../../services/api/post";

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

    const handleWorkingGroupChange = (wgName) => {
        setFormData((prev) => {
            const isMember = prev.workingGroups.some((wg) => wg.name === wgName);
            let updatedWorkingGroups;
            if (isMember) {
                // Remove working group
                updatedWorkingGroups = prev.workingGroups.filter((wg) => wg.name !== wgName);
            } else {
                // Add working group
                updatedWorkingGroups = [...prev.workingGroups, { name: wgName }];
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

                        <FormControl>
                            <FormLabel>Working Groups</FormLabel>
                            <HStack>
                                <Checkbox
                                    isChecked={formData.workingGroups.some((wg) => wg.name === 'Web')}
                                    onChange={() => handleWorkingGroupChange('Web')}
                                >
                                    Web
                                </Checkbox>
                                <Checkbox
                                    isChecked={formData.workingGroups.some((wg) => wg.name === 'Instructional Materials')}
                                    onChange={() => handleWorkingGroupChange('Instructional Materials')}
                                >
                                    Instructional Materials
                                </Checkbox>
                                <Checkbox
                                    isChecked={formData.workingGroups.some((wg) => wg.name === 'Procurement')}
                                    onChange={() => handleWorkingGroupChange('Procurement')}
                                >
                                    Procurement
                                </Checkbox>
                            </HStack>
                        </FormControl>
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
