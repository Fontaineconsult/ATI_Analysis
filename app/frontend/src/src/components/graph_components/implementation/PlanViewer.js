import React, { useContext, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Input,
    Textarea,
    Switch,
    FormControl,
    FormLabel,
    Text,
    Flex,
    Collapse,
    Select,
} from '@chakra-ui/react';
import { updatePlan } from '../../../services/api/put'; // Replace with the actual function
import { createPlan } from '../../../services/api/post'; // Replace with the actual function
import { DataContext } from '../../../context/DataContext';
import { SettingsContext, useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext'; // Import the UserContext

function PlanViewer({ plans, onSubmit, yearSuccessEvidence, createdBy }) {
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [isAddingNewPlan, setIsAddingNewPlan] = useState(false); // State for adding new plan
    const { loadSingleWorkingGroupData, selectedYear } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext); // Get the current user from UserContext
    const { currentAcademicYear } = useContext(SettingsContext);

    // Toggle expanded/collapsed state
    const toggleCollapse = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    // Handle form submission for both new and updated plans
    const handleFormSubmit = async (index, planData, isNew) => {
        try {
            if (isNew) {
                await createPlan({
                    furthered_yse_identifier: yearSuccessEvidence,
                    ...planData,
                    academic_year_name: currentAcademicYear,
                });
            } else {
                await updatePlan({
                    furthered_yse_identifier: yearSuccessEvidence,
                    ...planData,
                    academic_year_name: currentAcademicYear,
                });
            }
            await loadSingleWorkingGroupData(currentWorkingGroup); // Refresh data
            setExpandedIndex(null);
            setIsAddingNewPlan(false);
        } catch (error) {
            console.error('Error submitting plan:', error);
        }
    };

    return (
        <Box>
            {/* Button to add a new plan */}
            <Button
                colorScheme="teal"
                onClick={() => {
                    setIsAddingNewPlan(true);
                    setExpandedIndex(null); // Collapse any other expanded plans
                }}
                mb={4}
            >
                Add New Plan
            </Button>

            {/* Render the PlanForm for adding a new plan if isAddingNewPlan is true */}
            {isAddingNewPlan ? (
                    <Box mb={4} border="1px solid teal" borderRadius="md" p={4} boxShadow="sm">
                        <PlanForm
                            plan={null} // Pass null for a new plan
                            onSubmit={(planData) => handleFormSubmit(null, planData, true)} // Pass true to indicate new plan
                            createdBy={user?.properties || user} // Pass user data or null
                        />
                    </Box>
                ) : // Render existing plans if not adding a new plan
                plans && plans.length > 0 ? (
                    plans.map((planWrapper, index) => {
                        const plan = planWrapper;
                        const createdByPerson = planWrapper.created_by?.properties;

                        return (
                            <Box
                                key={plan.properties.unique_id || index}
                                mb={4}
                                border="1px solid teal"
                                borderRadius="md"
                                p={4}
                                boxShadow="sm"
                            >
                                <Flex
                                    justify="space-between"
                                    alignItems="center"
                                    cursor="pointer"
                                    onClick={() => toggleCollapse(index)}
                                >
                                    <Text fontWeight="bold" fontSize="sm">
                                        {plan.properties.name || 'Untitled Plan'}
                                    </Text>
                                    <Button size="sm" colorScheme="teal">
                                        {expandedIndex === index ? 'Collapse' : 'Expand'}
                                    </Button>
                                </Flex>

                                {/* Uncomment if you have createdByPerson data */}
                                {/* <Text fontSize="sm" color="gray.600" mt={2}>
                Created by: {createdByPerson ? createdByPerson.name : 'Unknown Author'}
              </Text> */}

                                <Collapse in={expandedIndex === index} animateOpacity>
                                    <Box mt={4}>
                                        <PlanForm
                                            plan={plan} // Pass the actual plan object
                                            onSubmit={(planData) => handleFormSubmit(index, planData, false)} // Pass false to indicate update
                                            createdBy={createdByPerson}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })
                ) : (
                    <Text>No plans available.</Text>
                )}
        </Box>
    );
}

function PlanForm({ plan, onSubmit, createdBy }) {
    const [planData, setPlanData] = useState({
        unique_id: plan?.properties?.unique_id || '',
        name: plan?.properties?.name || '',
        description: plan?.properties?.description || '',
        is_key_plan: plan?.properties?.is_key_plan || false,
        is_campus_plan: plan?.properties?.is_campus_plan || false,
        abandoned: plan?.properties?.abandoned || false,
        abandoned_notes: plan?.properties?.abandoned_notes || '',
        plan_status: plan?.properties?.plan_status || 'Not Started', // Default to "Not Started"
        created_by: createdBy || {}, // Use the passed createdBy data or fallback to an empty object
    });

    // New state to track submission status
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update local state when `plan` or `createdBy` prop changes
    useEffect(() => {
        setPlanData({
            unique_id: plan?.properties?.unique_id || '',
            name: plan?.properties?.name || '',
            description: plan?.properties?.description || '',
            is_key_plan: plan?.properties?.is_key_plan || false,
            is_campus_plan: plan?.properties?.is_campus_plan || false,
            abandoned: plan?.properties?.abandoned || false,
            abandoned_notes: plan?.properties?.abandoned_notes || '',
            plan_status: plan?.properties?.plan_status || 'Not Started', // Default to "Not Started"
            created_by: createdBy || {},
        });
    }, [plan, createdBy]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPlanData({
            ...planData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // Start the spinner
        try {
            await onSubmit(planData);
        } catch (error) {
            console.error('Error submitting plan:', error);
        } finally {
            setIsSubmitting(false); // Stop the spinner
        }
    };

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <FormControl mb={4}>
                <FormLabel>Plan Name</FormLabel>
                <Input name="name" value={planData.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea name="description" value={planData.description} onChange={handleChange} />
            </FormControl>

            {/* Display created_by person details */}
            {createdBy?.name ? (
                <Box mb={4}>
                    <Text fontSize="sm" color="gray.600">
                        Created by: {createdBy.name} ({createdBy.title || 'Unknown Title'})
                    </Text>
                </Box>
            ) : (
                <Text fontSize="sm" color="gray.600">Created by: Unknown</Text>
            )}

            <Flex gap={4} mb={4}>
                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Key Plan</FormLabel>
                        <Switch
                            name="is_key_plan"
                            isChecked={planData.is_key_plan}
                            onChange={handleChange}
                        />
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Campus Plan</FormLabel>
                        <Switch
                            name="is_campus_plan"
                            isChecked={planData.is_campus_plan}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>

                <Box flex="1">
                    <FormControl mb={4}>
                        <FormLabel>Plan Status</FormLabel>
                        <Select name="plan_status" value={planData.plan_status} onChange={handleChange}>
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Complete">Complete</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Abandoned">Abandoned</option>
                        </Select>
                    </FormControl>
                    <FormControl mb={4}>
                        <FormLabel>Abandoned</FormLabel>
                        <Switch
                            name="abandoned"
                            isChecked={planData.abandoned}
                            onChange={handleChange}
                        />
                    </FormControl>
                </Box>
            </Flex>

            <FormControl mb={4}>
                <FormLabel>Abandoned Notes</FormLabel>
                <Textarea
                    name="abandoned_notes"
                    value={planData.abandoned_notes}
                    onChange={handleChange}
                />
            </FormControl>

            <Button
                type="submit"
                colorScheme="teal"
                mt={4}
                isLoading={isSubmitting} // Chakra UI prop to show spinner
                loadingText={plan?.properties?.name ? 'Updating...' : 'Submitting...'}
            >
                {plan?.properties?.name ? 'Update Plan' : 'Submit Plan'}
            </Button>
        </Box>
    );
}

export default PlanViewer;
