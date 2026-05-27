import React, { useState, useContext } from 'react';
import {
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Switch,
    Button,
    useToast,
    Text,
    Box,
} from '@chakra-ui/react';
import { updatePlan } from '../../services/api/put';
import { SettingsContext } from '../../context/SettingsContext';

function PlanEditForm({ plan, onClose, onSuccess }) {
    const { currentAcademicYear } = useContext(SettingsContext);
    const [formData, setFormData] = useState({
        unique_id: plan.unique_id,
        name: plan.name,
        description: plan.description,
        plan_status: plan.plan_status || 'Not Started',
        is_key_plan: plan.is_key_plan || false,
        is_campus_plan: plan.is_campus_plan || false,
        abandoned: plan.abandoned || false,
        abandoned_notes: plan.abandoned_notes || '',
        completion_notes: plan.completion_notes || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    // Handle status change - automatically update abandoned field and clear
    // any stale notes when the related state goes away.
    const handleStatusChange = (newStatus) => {
        if (newStatus === 'Abandoned') {
            setFormData({
                ...formData,
                plan_status: newStatus,
                abandoned: true,
                completion_notes: '' // Clear stale completion notes when abandoning
            });
        } else if (newStatus === 'Completed') {
            setFormData({
                ...formData,
                plan_status: newStatus,
                abandoned: false,
                abandoned_notes: '' // Clear stale abandonment notes when completing
            });
        } else {
            setFormData({
                ...formData,
                plan_status: newStatus,
                abandoned: false,
                abandoned_notes: '',
                completion_notes: ''
            });
        }
    };

    const handleSubmit = async () => {
        // Validate abandonment notes if status is abandoned
        if (formData.abandoned && !formData.abandoned_notes?.trim()) {
            toast({
                title: "Abandonment notes required",
                description: "Please provide a reason for abandoning this plan",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            return;
        }

        // Validate completion notes when status is Completed
        if (formData.plan_status === 'Completed' && !formData.completion_notes?.trim()) {
            toast({
                title: "Completion notes required",
                description: "Please describe what was completed and any outcomes",
                status: "warning",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Stamp the current academic year whenever the desired state is
            // active (abandoned / completed) AND no year edge exists on the
            // persisted plan. Covers both the flip-on transition and the
            // backfill case for already-completed/abandoned plans created
            // before year tracking existed. If a year edge already exists,
            // we leave it alone — re-saves can't rewrite history.
            const updatePayload = { ...formData };
            if (formData.abandoned === true && !plan.abandoned_year && currentAcademicYear) {
                updatePayload.abandoned_year_name = currentAcademicYear;
            }
            if (formData.plan_status === 'Completed' && !plan.completed_year && currentAcademicYear) {
                updatePayload.completed_year_name = currentAcademicYear;
            }
            await updatePlan(updatePayload);
            toast({
                title: "Plan updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            onSuccess();
        } catch (error) {
            toast({
                title: "Error updating plan",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <VStack spacing={2} align="stretch">
                    <FormControl>
                        <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={1}>
                            Name
                        </FormLabel>
                        <Input
                            size="sm"
                            borderColor="gray.300"
                            bg="white"
                            color="gray.800"
                            _placeholder={{ color: "gray.500" }}
                            _hover={{ borderColor: "gray.400" }}
                            _focus={{
                                borderColor: "teal.500",
                                boxShadow: "0 0 0 1px teal.500",
                                bg: "white"
                            }}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={1}>
                            Description
                        </FormLabel>
                        <Textarea
                            size="sm"
                            borderColor="gray.300"
                            bg="white"
                            color="gray.800"
                            _placeholder={{ color: "gray.500" }}
                            _hover={{ borderColor: "gray.400" }}
                            _focus={{
                                borderColor: "teal.500",
                                boxShadow: "0 0 0 1px teal.500",
                                bg: "white"
                            }}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            rows={3}
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb={1}>
                            Status
                        </FormLabel>
                        <Select
                            size="sm"
                            borderColor="gray.300"
                            bg="white"
                            color="gray.800"
                            _hover={{ borderColor: "gray.400" }}
                            _focus={{
                                borderColor: "teal.500",
                                boxShadow: "0 0 0 1px teal.500",
                                bg: "white"
                            }}
                            value={formData.plan_status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                        >
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Abandoned">Abandoned</option>
                        </Select>
                    </FormControl>

                    {(formData.abandoned || formData.plan_status === 'Abandoned') && (
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="red.700" fontWeight="bold" mb={1}>
                                Abandonment Notes <Text as="span" color="red.500">*</Text>
                            </FormLabel>
                            <Textarea
                                size="sm"
                                borderColor="red.300"
                                bg="red.50"
                                color="gray.800"
                                _placeholder={{ color: "red.400" }}
                                _hover={{ borderColor: "red.400", bg: "red.100" }}
                                _focus={{
                                    borderColor: "red.500",
                                    boxShadow: "0 0 0 1px red.500",
                                    bg: "red.50"
                                }}
                                value={formData.abandoned_notes}
                                onChange={(e) => setFormData({...formData, abandoned_notes: e.target.value})}
                                rows={2}
                                placeholder="Please provide a reason for abandoning this plan..."
                            />
                            <Text fontSize="xs" color="red.600" mt={1}>
                                Required when marking a plan as abandoned
                            </Text>
                        </FormControl>
                    )}

                    {formData.plan_status === 'Completed' && (
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" color="green.700" fontWeight="bold" mb={1}>
                                Completion Notes <Text as="span" color="green.500">*</Text>
                            </FormLabel>
                            <Textarea
                                size="sm"
                                borderColor="green.300"
                                bg="green.50"
                                color="gray.800"
                                _placeholder={{ color: "green.400" }}
                                _hover={{ borderColor: "green.400", bg: "green.100" }}
                                _focus={{
                                    borderColor: "green.500",
                                    boxShadow: "0 0 0 1px green.500",
                                    bg: "green.50"
                                }}
                                value={formData.completion_notes}
                                onChange={(e) => setFormData({...formData, completion_notes: e.target.value})}
                                rows={2}
                                placeholder="What was completed? Any outcomes or follow-ups?"
                            />
                            <Text fontSize="xs" color="green.600" mt={1}>
                                Required when marking a plan as completed
                            </Text>
                        </FormControl>
                    )}

                    <HStack spacing={3}>
                        <FormControl display="flex" alignItems="center">
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb="0" mr={2}>
                                Key Plan
                            </FormLabel>
                            <Switch
                                size="sm"
                                colorScheme="purple"
                                isChecked={formData.is_key_plan}
                                onChange={(e) => setFormData({...formData, is_key_plan: e.target.checked})}
                            />
                        </FormControl>
                        <FormControl display="flex" alignItems="center">
                            <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb="0" mr={2}>
                                Campus Plan
                            </FormLabel>
                            <Switch
                                size="sm"
                                colorScheme="green"
                                isChecked={formData.is_campus_plan}
                                onChange={(e) => setFormData({...formData, is_campus_plan: e.target.checked})}
                            />
                        </FormControl>
                    </HStack>

                    <HStack justify="flex-end" pt={1}>
                        <Button
                            size="sm"
                            variant="outline"
                            borderColor="gray.300"
                            color="gray.700"
                            _hover={{
                                borderColor: "gray.400",
                                bg: "gray.50"
                            }}
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            loadingText="Saving..."
                        >
                            Save Changes
                        </Button>
                    </HStack>
            </VStack>
        </Box>
    );
}

export default PlanEditForm;