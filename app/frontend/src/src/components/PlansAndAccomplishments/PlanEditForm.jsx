import React, { useState, useContext, useMemo, useEffect } from 'react';
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
    Heading,
    Badge,
    Collapse,
    IconButton,
    useDisclosure,
    Divider,
    Grid,
    GridItem
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { updatePlan } from '../../services/api/put';
import { DataContext } from '../../context/DataContext';
import { SettingsContext } from '../../context/SettingsContext';
import YSECheckboxSelector from '../../services/utils/YSECheckboxSelector';

function PlanEditForm({ plan, onClose, onSuccess, progressNotesComponent }) {
    const { data } = useContext(DataContext);
    const { currentAcademicYear } = useContext(SettingsContext);
    const { isOpen: isYSEOpen, onToggle: onYSEToggle } = useDisclosure({ defaultIsOpen: false });
    const navigate = useNavigate();

    // Helper function to get Edit URL for ATI Explorer from composite key
    const getEditUrlFromCompositeKey = (compositeKey) => {
        const [numbers, suffix] = compositeKey.split('-');
        const [goalNumber, indicatorNumber] = numbers.split('.');

        const workingGroupMap = {
            'web': 'web',
            'pro': 'procurement',
            'ins': 'instructional-materials'
        };

        const workingGroupSegment = workingGroupMap[suffix] || suffix;
        return `/ati-explorer/${workingGroupSegment}/goal/${goalNumber}#${compositeKey}`;
    };

    // Helper function to navigate to evidence from composite key
    const navigateToEvidence = (compositeKey) => {
        // Save scroll position before navigation for back button
        const scrollY = window.scrollY || window.pageYOffset;
        sessionStorage.setItem('plansTable_scrollPosition', scrollY.toString());

        const editUrl = getEditUrlFromCompositeKey(compositeKey);
        const [pathname, hash] = editUrl.split('#');

        navigate(pathname + '#' + hash);

        setTimeout(() => {
            if (hash) {
                const element = document.getElementById(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    setTimeout(() => {
                        const retryElement = document.getElementById(hash);
                        if (retryElement) {
                            retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 500);
                }
            }
        }, 100);
    };

    // Get current YSE associations for the plan - filter out invalid/null entries
    const initialYSEAssociations = useMemo(() => {
        let identifiers = [];

        // If the plan already has YSE identifiers stored, use them
        if (plan.furthered_yse_identifiers && Array.isArray(plan.furthered_yse_identifiers)) {
            identifiers = plan.furthered_yse_identifiers;
        }
        // If there's a single YSE identifier, convert to array
        else if (plan.furthered_yse_identifier) {
            identifiers = [plan.furthered_yse_identifier];
        }

        // Filter out null, undefined, or empty string values
        return identifiers.filter(id => id && id.trim());
    }, [plan.furthered_yse_identifiers, plan.furthered_yse_identifier]);

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
        furthered_yse_identifiers: initialYSEAssociations
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    // Sync formData when plan data changes (after data refresh)
    useEffect(() => {
        setFormData(prevData => ({
            unique_id: plan.unique_id,
            name: plan.name,
            description: plan.description,
            plan_status: plan.plan_status || 'Not Started',
            is_key_plan: plan.is_key_plan || false,
            is_campus_plan: plan.is_campus_plan || false,
            abandoned: plan.abandoned || false,
            abandoned_notes: plan.abandoned_notes || '',
            completion_notes: plan.completion_notes || '',
            furthered_yse_identifiers: initialYSEAssociations
        }));
    }, [plan.unique_id, initialYSEAssociations]); // Simplified dependencies

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

    // Extract YSEs that THIS plan furthers - look across ALL working groups
    const relatedEvidences = useMemo(() => {
        const evidences = [];
        const evidenceMap = new Map(); // Use map to avoid duplicates

        // Get the YSE identifiers from the current form data (which includes user's unsaved changes)
        const yseIdentifiersToShow = formData.furthered_yse_identifiers || [];

        if (yseIdentifiersToShow.length > 0) {
            // Look across ALL working groups, not just the plan's working group
            ['web', 'instructionalMaterials', 'procurement'].forEach(wg => {
                if (data[wg]?.goals) {
                    data[wg].goals.forEach(goal => {
                        if (goal.indicators) {
                            goal.indicators.forEach(indicatorObj => {
                                if (indicatorObj.evidences) {
                                    indicatorObj.evidences.forEach(evidence => {
                                        const evidenceYearId = evidence.evidence?.properties?.year_identifier;

                                        // Check if this evidence's year_identifier is in our plan's YSE list
                                        if (evidenceYearId && yseIdentifiersToShow.includes(evidenceYearId) && !evidenceMap.has(evidenceYearId)) {
                                            const evidenceData = {
                                                yearIdentifier: evidenceYearId,
                                                uniqueId: evidence.evidence.properties.unique_id,
                                                indicatorKey: indicatorObj.indicator?.properties?.composite_key,
                                                indicatorDescription: indicatorObj.indicator?.properties?.success_indicator,
                                                goalNumber: goal.goal?.properties?.goal_number,
                                                statusLevel: evidence.statusLevel?.properties?.status_level,
                                                workingGroup: wg,
                                                // Count how many plans are associated with this evidence
                                                planCount: (evidence.plans?.length || 0) + (evidence.plans_with_notes?.length || 0)
                                            };
                                            evidenceMap.set(evidenceYearId, evidenceData);
                                            evidences.push(evidenceData);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });

            // Add any YSE identifiers that weren't found in the current data
            // These might be from different years or deleted evidences
            yseIdentifiersToShow.forEach(yseId => {
                if (!evidenceMap.has(yseId)) {
                    // Extract composite key from the identifier (e.g., "2024-2025-1.9-web" -> "1.9-web")
                    const parts = yseId.split('-');
                    const compositeKey = parts.length >= 4 ? `${parts[2]}-${parts[3]}` : yseId;

                    evidences.push({
                        yearIdentifier: yseId,
                        uniqueId: `not-found-${yseId}`,
                        indicatorKey: compositeKey,
                        indicatorDescription: 'Evidence not available in current data',
                        goalNumber: parts[2]?.split('.')[0] || '?',
                        statusLevel: null,
                        workingGroup: parts[3] || 'unknown',
                        planCount: 0,
                        notFound: true // Mark as not found
                    });
                }
            });
        }

        return evidences.sort((a, b) => b.yearIdentifier.localeCompare(a.yearIdentifier));
    }, [data, formData.furthered_yse_identifiers]);

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
            // Prepare the data for submission
            // Send multiple YSE identifiers - the Plan model supports 1:many relationship
            const submitData = {
                ...formData,
                current_academic_year: currentAcademicYear,
                // Send the array of YSE identifiers
                furthered_yse_identifiers: formData.furthered_yse_identifiers || [],
                // Also send single identifier for backward compatibility
                furthered_yse_identifier: formData.furthered_yse_identifiers?.[0] || null
            };

            // Include current_academic_year for automatic completion year tracking
            const response = await updatePlan(submitData);

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
        <Grid templateColumns="1fr 1fr" gap={4}>
            {/* Left Column - Form Section */}
            <GridItem>
                <Box
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                    p={4}
                    bg="white"
                >
                    <Heading size="sm" mb={4} color="gray.700">
                        Plan Details
                    </Heading>
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

                    {/* Collapsible YSE Selector */}
                    <Box
                        borderWidth="1px"
                        borderColor="gray.300"
                        borderRadius="md"
                        p={2}
                        bg="gray.50"
                    >
                        <HStack
                            justify="space-between"
                            cursor="pointer"
                            onClick={onYSEToggle}
                            _hover={{ bg: "gray.100" }}
                            p={1}
                            borderRadius="md"
                        >
                            <HStack>
                                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                                    Associated Year Success Evidence
                                </Text>
                                {formData.furthered_yse_identifiers.length > 0 && (
                                    <Badge colorScheme="teal" fontSize="xs">
                                        {formData.furthered_yse_identifiers.length} selected
                                    </Badge>
                                )}
                            </HStack>
                            <IconButton
                                size="xs"
                                icon={isYSEOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                variant="ghost"
                                aria-label={isYSEOpen ? "Collapse" : "Expand"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onYSEToggle();
                                }}
                            />
                        </HStack>

                        <Collapse in={isYSEOpen} animateOpacity>
                            <Box pt={2}>
                                {/* Only render YSECheckboxSelector when actually open to avoid performance issues */}
                                {isYSEOpen && (
                                    <YSECheckboxSelector
                                        value={formData.furthered_yse_identifiers}
                                        onChange={(selectedIdentifiers) =>
                                            setFormData({ ...formData, furthered_yse_identifiers: selectedIdentifiers })
                                        }
                                        isDisabled={isSubmitting}
                                        label=""
                                        maxHeight={250}
                                    />
                                )}
                            </Box>
                        </Collapse>
                    </Box>

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
            </GridItem>

            {/* Right Column - Associated YSE and Progress Notes */}
            <GridItem>
                <VStack spacing={4} align="stretch">
                    {/* Related Year Success Evidences Section */}
                    <Box
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="lg"
                        p={4}
                        bg="white"
                    >
                        <Heading
                            size="sm"
                            mb={4}
                            color="gray.700"
                        >
                            Associated Year Success Evidence
                        </Heading>

                        {relatedEvidences.length > 0 ? (
                            <Box maxHeight="30vh" overflowY="auto">
                                <VStack spacing={2} align="stretch" pr={1}>
                                    {relatedEvidences.map((evidence, index) => (
                                            <Box
                                                key={evidence.uniqueId}
                                                p={2}
                                                borderRadius="lg"
                                                borderWidth="1px"
                                                borderColor={evidence.notFound ? "orange.300" : (index === 0 ? "teal.400" : "gray.300")}
                                                bg={evidence.notFound ? "orange.50" : (index === 0 ? "teal.50" : "white")}
                                                boxShadow={index === 0 && !evidence.notFound ? "sm" : "none"}
                                                transition="all 0.2s"
                                                cursor={evidence.notFound ? "not-allowed" : "pointer"}
                                                opacity={evidence.notFound ? 0.7 : 1}
                                                _hover={evidence.notFound ? {} : {
                                                    boxShadow: "md",
                                                    borderColor: index === 0 ? "teal.500" : "teal.400"
                                                }}
                                                onClick={() => !evidence.notFound && navigateToEvidence(evidence.indicatorKey)}
                                            >
                                            <HStack justify="space-between" mb={1}>
                                                <Text fontWeight="bold" color={index === 0 ? "teal.800" : "gray.800"} fontSize="sm">
                                                    {evidence.yearIdentifier}
                                                </Text>
                                                <HStack spacing={1}>
                                                    {evidence.notFound && (
                                                        <Badge colorScheme="orange" fontSize="xs">
                                                            NOT FOUND
                                                        </Badge>
                                                    )}
                                                    {!evidence.notFound && index === 0 && (
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
                            </Box>
                        ) : (
                            <Text fontSize="sm" color="gray.700" textAlign="center" mt={4}>
                                This plan is not associated with any Year Success Evidence
                            </Text>
                        )}
                    </Box>

                    {/* Progress Notes Component */}
                    {progressNotesComponent}
                </VStack>
            </GridItem>
        </Grid>
    );
}

export default PlanEditForm;