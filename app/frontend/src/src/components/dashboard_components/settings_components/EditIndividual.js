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
    Select,
    Checkbox,
    VStack,
    useToast,
    CheckboxGroup,
    HStack,
    Divider
} from '@chakra-ui/react';
import { updateIndividual } from '../../../services/api/put';
import { createIndividual } from '../../../services/api/post';
import { useSettings } from '../../../context/SettingsContext';

const EditIndividual = ({ isOpen, onClose, individualData, onSave }) => {
    const [formData, setFormData] = useState({
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const { campuses, campusesLoading } = useSettings();

    const isEditMode = Boolean(individualData);

    useEffect(() => {
        if (isEditMode) {
            setFormData({ host_campus: '', ...individualData });
        } else {
            // Clear form data for create mode
            setFormData({
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
                <ModalHeader color="gray.800" fontWeight="bold">
                    {isEditMode ? 'Edit Individual' : 'Add Individual'}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Name
                            </FormLabel>
                            <Input
                                size="sm"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Enter name"
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Employee ID
                            </FormLabel>
                            <Input
                                size="sm"
                                name="employee_id"
                                value={formData.employee_id}
                                onChange={handleInputChange}
                                placeholder="Enter employee ID"
                                isReadOnly={isEditMode}
                                borderColor="gray.300"
                                bg={isEditMode ? "gray.50" : "white"}
                                _hover={{ borderColor: isEditMode ? "gray.300" : "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Email
                            </FormLabel>
                            <Input
                                size="sm"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Enter email"
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Title
                            </FormLabel>
                            <Input
                                size="sm"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter title"
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                ATI Role
                            </FormLabel>
                            <Input
                                size="sm"
                                name="ati_role"
                                value={formData.ati_role}
                                onChange={handleInputChange}
                                placeholder="Enter ATI role"
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                Host Campus
                            </FormLabel>
                            <Select
                                size="sm"
                                name="host_campus"
                                value={formData.host_campus || ''}
                                onChange={handleInputChange}
                                placeholder={campusesLoading ? 'Loading campuses…' : 'Select a campus'}
                                isDisabled={campusesLoading}
                                borderColor="gray.300"
                                _hover={{ borderColor: "gray.400" }}
                                _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                            >
                                {campuses.map((c) => (
                                    <option key={c.abbreviation} value={c.abbreviation}>
                                        {c.name}
                                    </option>
                                ))}
                            </Select>
                        </FormControl>

                        <Divider />

                        <FormControl>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={3}>
                                Status Options
                            </FormLabel>
                            <VStack align="start" spacing={2}>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    name="active"
                                    isChecked={formData.active}
                                    onChange={handleInputChange}
                                >
                                    Active Member
                                </Checkbox>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    name="non_committee_member_active"
                                    isChecked={formData.non_committee_member_active}
                                    onChange={handleInputChange}
                                >
                                    Active Non-Committee Member
                                </Checkbox>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    name="can_approve_yse"
                                    isChecked={formData.can_approve_yse}
                                    onChange={handleInputChange}
                                >
                                    Can Approve YSE
                                </Checkbox>
                            </VStack>
                        </FormControl>

                        <Divider />

                        <CheckboxGroup>
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={3}>
                                Working Groups
                            </FormLabel>
                            <VStack align="start" spacing={2}>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    isChecked={formData.workingGroups?.some((wg) => wg.name === 'Web')}
                                    onChange={(e) => handleWorkingGroupChange('Web', e.target.checked)}
                                >
                                    Web
                                </Checkbox>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    isChecked={formData.workingGroups?.some((wg) => wg.name === 'Instructional Materials')}
                                    onChange={(e) => handleWorkingGroupChange('Instructional Materials', e.target.checked)}
                                >
                                    Instructional Materials
                                </Checkbox>
                                <Checkbox
                                    size="sm"
                                    colorScheme="teal"
                                    isChecked={formData.workingGroups?.some((wg) => wg.name === 'Procurement')}
                                    onChange={(e) => handleWorkingGroupChange('Procurement', e.target.checked)}
                                >
                                    Procurement
                                </Checkbox>
                            </VStack>
                        </CheckboxGroup>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onClose}
                        mr={3}
                        borderColor="gray.300"
                        _hover={{ bg: "gray.50" }}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        colorScheme="teal"
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