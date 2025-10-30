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
    Grid,
    GridItem,
    Heading,
    Badge
} from '@chakra-ui/react';
import { updatePlan } from '../../services/api/put';
import { DataContext } from '../../context/DataContext';
import { SettingsContext } from '../../context/SettingsContext';

function PlanEditForm({ plan, onClose, onSuccess }) {
    const { data } = useContext(DataContext);
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
        completion_notes: plan.completion_notes || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    // Handle status change - automatically update abandoned field
    const handleStatusChange = (newStatus) => {
        if (newStatus === 'Abandoned') {
            setFormData({
                ...formData,
                plan_status: newStatus,
                abandoned: true
            });
        } else {
            setFormData({
                ...formData,
                plan_status: newStatus,
                abandoned: false,
                abandoned_notes: '' // Clear notes when not abandoned
            });
        }
    };

    // Extract ONLY year success evidences that contain THIS plan
    const getRelatedYearSuccessEvidences = () => {
        const evidences = [];
        const wg = plan.workingGroup;

        if (data[wg]?.goals) {
            data[wg].goals.forEach(goal => {
                if (goal.indicators) {
                    goal.indicators.forEach(indicatorObj => {
                        if (indicatorObj.evidences) {
                            indicatorObj.evidences.forEach(evidence => {
                                const planExists = evidence.plans?.some(p =>
                                    p.properties?.unique_id === plan.unique_id
                                );

                                if (planExists && evidence.evidence?.properties) {
                                    evidences.push({
                                        yearIdentifier: evidence.evidence.properties.year_identifier,
                                        uniqueId: evidence.evidence.properties.unique_id,
                                        indicatorKey: indicatorObj.indicator?.properties?.composite_key,
                                        indicatorDescription: indicatorObj.indicator?.properties?.success_indicator,
                                        goalNumber: goal.goal?.properties?.goal_number,
                                        statusLevel: evidence.statusLevel?.properties?.status_level,
                                        planCount: evidence.plans?.length || 0
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

        return evidences.sort((a, b) => b.yearIdentifier.localeCompare(a.yearIdentifier));
    };

    const relatedEvidences = getRelatedYearSuccessEvidences();

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

        setIsSubmitting(true);
        try {
            // Include current_academic_year for automatic completion year tracking
            const response = await updatePlan({
                ...formData,
                current_academic_year: currentAcademicYear
            });

            // Check if an accomplishment was created
            if (response?.data?.accomplishment_created) {
                const accName = response.data.accomplishment?.accomplishment_name || "New accomplishment";
                toast({
                    title: "Plan Completed!",
                    description: `${accName} has been created automatically`,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                    position: "top-right"
                });
            } else {
                toast({
                    title: "Plan updated successfully",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "top-right"
                });
            }
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

    const getStatusColor = (status) => {
        switch(status) {
            case 'Optimized': return 'green';
            case 'Managed': return 'blue';
            case 'Established': return 'cyan';
            case 'Defined': return 'yellow';
            case 'Initiated': return 'orange';
            case 'Not Started': return 'red';
            default: return 'gray';
        }
    };

    return (
        <Grid templateColumns="2fr 1fr" gap={3}>
            {/* Left Column - Form */}
            <GridItem>
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

                    {formData.plan_status === 'Completed' && (
                        <FormControl>
                            <FormLabel fontSize="sm" color="green.700" fontWeight="bold" mb={1}>
                                Completion Notes
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
                                placeholder="Optional notes about the completion of this plan..."
                            />
                            <Text fontSize="xs" color="green.600" mt={1}>
                                These notes will be used when creating an accomplishment from this plan
                            </Text>
                        </FormControl>
                    )}

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
            </GridItem>

            {/* Right Column - Related Year Success Evidences */}
            <GridItem>
                <Box
                    borderWidth="1px"
                    borderColor="gray.300"
                    borderRadius="lg"
                    p={3}
                    bg="white"
                    maxHeight="50vh"
                    overflowY="auto"
                    boxShadow="sm"
                >
                    <Heading
                        size="sm"
                        mb={2}
                        color="gray.800"
                        fontWeight="bold"
                        position="sticky"
                        top={-3}
                        bg="white"
                        pb={1}
                        borderBottomWidth="1px"
                        borderBottomColor="gray.200"
                    >
                        Associated Year Success Evidence
                    </Heading>

                    {relatedEvidences.length > 0 ? (
                        <VStack spacing={2} align="stretch">
                            {relatedEvidences.map((evidence, index) => (
                                <Box
                                    key={evidence.uniqueId}
                                    p={2}
                                    borderRadius="lg"
                                    borderWidth="1px"
                                    borderColor={index === 0 ? "teal.400" : "gray.300"}
                                    bg={index === 0 ? "teal.50" : "white"}
                                    boxShadow={index === 0 ? "sm" : "none"}
                                    transition="all 0.2s"
                                    _hover={{ boxShadow: "sm", borderColor: index === 0 ? "teal.500" : "gray.400" }}
                                >
                                    <HStack justify="space-between" mb={1}>
                                        <Text fontWeight="bold" color={index === 0 ? "teal.800" : "gray.800"} fontSize="sm">
                                            {evidence.yearIdentifier}
                                        </Text>
                                        <HStack spacing={1}>
                                            {index === 0 && (
                                                <Badge colorScheme="teal" fontSize="xs">
                                                    PRIMARY
                                                </Badge>
                                            )}
                                            {evidence.statusLevel && (
                                                <Badge colorScheme={getStatusColor(evidence.statusLevel)} fontSize="xs">
                                                    {evidence.statusLevel}
                                                </Badge>
                                            )}
                                        </HStack>
                                    </HStack>
                                    <Text fontWeight="semibold" color="gray.700" fontSize="sm">
                                        {evidence.indicatorKey}
                                    </Text>
                                    <Text color="gray.600" fontSize="xs" mt={1}>
                                        {evidence.indicatorDescription}
                                    </Text>
                                    <HStack mt={2} justify="space-between">
                                        <Text color="gray.500" fontSize="xs">
                                            Goal {evidence.goalNumber}
                                        </Text>
                                        {evidence.planCount > 1 && (
                                            <Text color="purple.600" fontSize="xs" fontWeight="semibold">
                                                {evidence.planCount} plans total
                                            </Text>
                                        )}
                                    </HStack>
                                </Box>
                            ))}
                        </VStack>
                    ) : (
                        <Text fontSize="sm" color="gray.700" textAlign="center" mt={4}>
                            This plan is not associated with any Year Success Evidence
                        </Text>
                    )}
                </Box>
            </GridItem>
        </Grid>
    );
}

export default PlanEditForm;