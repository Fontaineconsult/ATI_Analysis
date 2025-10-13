import React, { useState } from 'react';
import {
    Box,
    Text,
    Heading,
    Flex,
    Divider,
    Button,
    HStack,
    VStack,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Switch,
    Badge,
    useToast
} from '@chakra-ui/react';
import { FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { updatePlan } from '../../../services/api/put';
import { createPlan } from '../../../services/api/post';

function Plan({
                  planData,
                  isNew = false,
                  goalNumber,
                  workingGroup,
                  academicYear,
                  onSuccess,
                  onCancel,
                  onUpdate
              }) {
    const [isEditing, setIsEditing] = useState(isNew);
    const [formData, setFormData] = useState({
        name: planData?.properties?.name || '',
        description: planData?.properties?.description || '',
        is_key_plan: planData?.properties?.is_key_plan || false,
        is_campus_plan: planData?.properties?.is_campus_plan || false,
        plan_status: planData?.properties?.plan_status || 'Not Started',
        abandoned: planData?.properties?.abandoned || false,
        abandoned_notes: planData?.properties?.abandoned_notes || '',
        furthered_goal_number: goalNumber,
        furthered_working_group: workingGroup,
        academic_year_name: academicYear,
        unique_id: planData?.properties?.unique_id || null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async () => {
        if (!formData.name || !formData.description) {
            toast({
                title: "Missing required fields",
                description: "Please fill in name and description",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setIsSubmitting(true);
        try {
            if (isNew) {
                await createPlan(formData);
                toast({
                    title: "Plan created successfully",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
                if (onSuccess) onSuccess();
            } else {
                await updatePlan(formData);
                toast({
                    title: "Plan updated successfully",
                    status: "success",
                    duration: 2000,
                    isClosable: true,
                });
                setIsEditing(false);
                if (onUpdate) onUpdate();
            }
        } catch (error) {
            toast({
                title: isNew ? "Error creating plan" : "Error updating plan",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (isNew && onCancel) {
            onCancel();
        } else {
            // Reset form to original data
            setFormData({
                name: planData?.properties?.name || '',
                description: planData?.properties?.description || '',
                is_key_plan: planData?.properties?.is_key_plan || false,
                is_campus_plan: planData?.properties?.is_campus_plan || false,
                plan_status: planData?.properties?.plan_status || 'Not Started',
                abandoned: planData?.properties?.abandoned || false,
                abandoned_notes: planData?.properties?.abandoned_notes || '',
                furthered_goal_number: goalNumber,
                furthered_working_group: workingGroup,
                academic_year_name: academicYear,
                unique_id: planData?.properties?.unique_id || null
            });
        }
    };

    // Edit/Create Form View
    if (isEditing) {
        return (
            <Box
                p={4}
                mb={3}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="gray.50"
            >
                <VStack spacing={3} align="stretch">
                    <FormControl isRequired>
                        <FormLabel fontSize="xs" color="teal.600">Plan Name</FormLabel>
                        <Input
                            size="sm"
                            bg="white"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Enter plan name"
                        />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontSize="xs" color="teal.600">Description</FormLabel>
                        <Textarea
                            size="sm"
                            bg="white"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Enter plan description"
                            rows={3}
                        />
                    </FormControl>

                    <HStack spacing={4}>
                        <FormControl flex="1">
                            <FormLabel fontSize="xs" color="teal.600">Status</FormLabel>
                            <Select
                                size="sm"
                                bg="white"
                                value={formData.plan_status}
                                onChange={(e) => setFormData({...formData, plan_status: e.target.value})}
                            >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Completed">On Hold</option>
                                <option value="Abandoned">Abandoned</option>
                            </Select>
                        </FormControl>

                        <FormControl display="flex" alignItems="center" flex="1">
                            <FormLabel fontSize="xs" color="teal.600" mb="0">Key Plan</FormLabel>
                            <Switch
                                size="sm"
                                colorScheme="teal"
                                isChecked={formData.is_key_plan}
                                onChange={(e) => setFormData({...formData, is_key_plan: e.target.checked})}
                            />
                        </FormControl>

                        <FormControl display="flex" alignItems="center" flex="1">
                            <FormLabel fontSize="xs" color="teal.600" mb="0">Campus Plan</FormLabel>
                            <Switch
                                size="sm"
                                colorScheme="teal"
                                isChecked={formData.is_campus_plan}
                                onChange={(e) => setFormData({...formData, is_campus_plan: e.target.checked})}
                            />
                        </FormControl>
                    </HStack>

                    {formData.plan_status === 'Abandoned' && (
                        <FormControl>
                            <FormLabel fontSize="xs" color="teal.600">Abandonment Notes</FormLabel>
                            <Textarea
                                size="sm"
                                bg="white"
                                value={formData.abandoned_notes}
                                onChange={(e) => setFormData({...formData, abandoned_notes: e.target.value})}
                                placeholder="Explain why this plan was abandoned"
                                rows={2}
                            />
                        </FormControl>
                    )}

                    <HStack justify="flex-end" pt={2}>
                        <Button
                            size="xs"
                            variant="outline"
                            leftIcon={<FaTimes />}
                            onClick={handleCancel}
                            isDisabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="xs"
                            colorScheme="teal"
                            leftIcon={<FaSave />}
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            loadingText={isNew ? "Creating..." : "Saving..."}
                        >
                            {isNew ? 'Create' : 'Save'}
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        );
    }

    // Display View (for existing plans)
    if (!planData) return null;

    const { name, description, is_key_plan, is_campus_plan, abandoned, abandoned_notes, plan_status } = planData.properties;

    return (
        <Box
            p={4}
            mb={3}
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            bg="white"
            _hover={{ bg: "gray.50" }}
            transition="all 0.2s"
        >
            <Flex justify="space-between" align="start" mb={2}>
                <Heading as="h5" size="sm" color="gray.800" flex="1">
                    {name}
                </Heading>
                <HStack spacing={2}>
                    <Badge
                        colorScheme={
                            plan_status === 'Completed' ? 'green' :
                                plan_status === 'In Progress' ? 'blue' :
                                    plan_status === 'Abandoned' ? 'red' : 'gray'
                        }
                        fontSize="xs"
                    >
                        {plan_status}
                    </Badge>
                    <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="teal"
                        leftIcon={<FaEdit />}
                        onClick={() => setIsEditing(true)}
                    >
                        Edit
                    </Button>
                </HStack>
            </Flex>

            <Divider mb={3} />

            <VStack align="stretch" spacing={2}>
                <Box>
                    <Text fontSize="xs" color="teal.600" fontWeight="semibold">Description:</Text>
                    <Text fontSize="sm" color="gray.700">{description}</Text>
                </Box>

                <HStack spacing={4}>
                    {is_key_plan && (
                        <Badge colorScheme="purple" fontSize="xs">Key Plan</Badge>
                    )}
                    {is_campus_plan && (
                        <Badge colorScheme="green" fontSize="xs">Campus Plan</Badge>
                    )}
                </HStack>

                {abandoned && abandoned_notes && (
                    <Box>
                        <Text fontSize="xs" color="red.600" fontWeight="semibold">Abandonment Notes:</Text>
                        <Text fontSize="sm" color="gray.700">{abandoned_notes}</Text>
                    </Box>
                )}
            </VStack>
        </Box>
    );
}

export default Plan;