import React, { useContext, useState } from 'react';
import {
    Box,
    Heading,
    VStack,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Spinner,
    Text,
    Center,
    Button,
    HStack,
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
    Textarea,
    Select,
    Switch,
    useDisclosure,
    useToast,
    Checkbox
} from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { DataContext } from '../../context/DataContext';
import { SettingsContext } from '../../context/SettingsContext';
import PlansTable from './PlansTable';
import AccomplishmentsTable from './AccomplishmentsTable';
import { createPlan } from '../../services/api/post';
import { workingGroupWebSafe } from "../../services/utils/tools";

function PlansAccomplishmentsManager() {
    const { data, loading, loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentAcademicYear } = useContext(SettingsContext);
    const [activeTab, setActiveTab] = useState(0);
    const [showAbandoned, setShowAbandoned] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    // Form state for new plan
    const [newPlanData, setNewPlanData] = useState({
        name: '',
        description: '',
        plan_status: 'Not Started',
        is_key_plan: false,
        is_campus_plan: false,
        abandoned: false,
        abandoned_notes: '',
        academic_year_name: currentAcademicYear,
        furthered_goal_number: '',
        working_group: '',
        furthered_yse_identifier: ''
    });

    // Get available YSE identifiers for dropdown
    const getAvailableYSEs = () => {
        const yses = [];
        ['web', 'instructionalMaterials', 'procurement'].forEach(wg => {
            if (data[wg]?.goals) {
                data[wg].goals.forEach(goal => {
                    if (goal.indicators) {
                        goal.indicators.forEach(indicator => {
                            if (indicator.evidences) {
                                indicator.evidences.forEach(evidence => {
                                    if (evidence.evidence?.properties?.year_identifier) {
                                        yses.push({
                                            identifier: evidence.evidence.properties.year_identifier,
                                            workingGroup: workingGroupWebSafe(wg),
                                            goalNumber: goal.goal?.properties?.goal_number,
                                            indicatorKey: indicator.indicator?.properties?.composite_key,
                                            indicatorDescription: indicator.indicator?.properties?.success_indicator
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
        return yses;
    };

    const availableYSEs = getAvailableYSEs();

    const handleYSEChange = (yseIdentifier) => {
        const selectedYSE = availableYSEs.find(yse => yse.identifier === yseIdentifier);
        if (selectedYSE) {
            setNewPlanData({
                ...newPlanData,
                furthered_yse_identifier: yseIdentifier,
                working_group: workingGroupWebSafe(selectedYSE.workingGroup),
                furthered_goal_number: selectedYSE.goalNumber
            });
        }
    };

    const handleSubmitNewPlan = async () => {
        // Validate required fields
        if (!newPlanData.name || !newPlanData.description) {
            toast({
                title: "Missing required fields",
                description: "Please fill in name and description",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            // Include current_academic_year for automatic completion year tracking
            await createPlan({
                ...newPlanData,
                current_academic_year: currentAcademicYear
            });
            toast({
                title: "Plan created successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right"
            });

            // Reload data for the working group
            if (newPlanData.working_group) {
                await loadSingleWorkingGroupData(workingGroupWebSafe(newPlanData.working_group));
            }

            // Reset form and close modal
            setNewPlanData({
                name: '',
                description: '',
                plan_status: 'Not Started',
                is_key_plan: false,
                is_campus_plan: false,
                abandoned: false,
                abandoned_notes: '',
                academic_year_name: currentAcademicYear,
                furthered_goal_number: '',
                working_group: '',
                furthered_yse_identifier: ''
            });
            onClose();
        } catch (error) {
            toast({
                title: "Error creating plan",
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

    const getAllPlans = () => {
        const plans = [];
        ['web', 'instructionalMaterials', 'procurement'].forEach(wg => {
            if (data[wg]?.goals) {
                data[wg].goals.forEach(goal => {
                    // Goal-level plans with progress notes
                    if (goal.plans_with_progress_notes && Array.isArray(goal.plans_with_progress_notes)) {
                        goal.plans_with_progress_notes.forEach(planData => {
                            if (planData.plan) {
                                plans.push({
                                    ...planData.plan.properties,
                                    progress_notes: planData.progress_notes || [],
                                    workingGroup: workingGroupWebSafe(wg),
                                    goalNumber: goal.goal?.properties?.goal_number,
                                    level: 'goal'
                                });
                            }
                        });
                    }
                    // Fallback for backward compatibility
                    else if (goal.plans && Array.isArray(goal.plans)) {
                        goal.plans.forEach(plan => {
                            plans.push({
                                ...plan.properties,
                                progress_notes: [],
                                workingGroup: workingGroupWebSafe(wg),
                                goalNumber: goal.goal?.properties?.goal_number,
                                level: 'goal'
                            });
                        });
                    }

                    // Check indicator level
                    if (goal.indicators && Array.isArray(goal.indicators)) {
                        goal.indicators.forEach(indicator => {
                            const indicatorInfo = indicator.indicator?.properties;

                            // Check within evidences for plans
                            if (indicator.evidences && Array.isArray(indicator.evidences)) {
                                indicator.evidences.forEach(evidence => {
                                    // Check for plans with notes first
                                    if (evidence.plans_with_notes && Array.isArray(evidence.plans_with_notes)) {
                                        evidence.plans_with_notes.forEach(planData => {
                                            if (planData.plan) {
                                                plans.push({
                                                    ...planData.plan.properties,
                                                    progress_notes: planData.progress_notes || [],
                                                    workingGroup: workingGroupWebSafe(wg),
                                                    goalNumber: goal.goal?.properties?.goal_number,
                                                    yearIdentifier: evidence.evidence?.properties?.year_identifier,
                                                    indicatorKey: indicatorInfo?.composite_key,
                                                    indicatorDescription: indicatorInfo?.success_indicator,
                                                    level: 'evidence'
                                                });
                                            }
                                        });
                                    }
                                    // Fallback for backward compatibility
                                    else if (evidence.plans && Array.isArray(evidence.plans)) {
                                        evidence.plans.forEach(plan => {
                                            plans.push({
                                                ...plan.properties,
                                                progress_notes: [],
                                                workingGroup: workingGroupWebSafe(wg),
                                                goalNumber: goal.goal?.properties?.goal_number,
                                                yearIdentifier: evidence.evidence?.properties?.year_identifier,
                                                indicatorKey: indicatorInfo?.composite_key,
                                                indicatorDescription: indicatorInfo?.success_indicator,
                                                level: 'evidence'
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        // Remove duplicates based on unique_id
        const uniquePlans = plans.filter((plan, index, self) =>
            index === self.findIndex((p) => p.unique_id === plan.unique_id)
        );

        // Filter out abandoned plans unless showAbandoned is true
        return uniquePlans.filter(plan => showAbandoned || !plan.abandoned);
    };

    const getAllAccomplishments = () => {
        const accomplishments = [];

        ['web', 'instructionalMaterials', 'procurement'].forEach(wg => {
            if (data[wg]?.goals) {
                data[wg].goals.forEach(goal => {
                    // Goal-level accomplishments
                    if (goal.accomplishments && Array.isArray(goal.accomplishments)) {
                        goal.accomplishments.forEach(accData => {
                            // Handle new structure with YSE information
                            const acc = accData.accomplishment || accData;
                            const yseList = accData.advances_yse_list || [];

                            // Process YSE list to extract identifiers and descriptions
                            const yseIdentifiers = [];
                            const yseDescriptions = [];

                            if (Array.isArray(yseList)) {
                                yseList.forEach(yse => {
                                    if (yse?.properties?.year_identifier) {
                                        yseIdentifiers.push(yse.properties.year_identifier);
                                        if (yse.properties.description) {
                                            yseDescriptions.push({
                                                identifier: yse.properties.year_identifier,
                                                description: yse.properties.description
                                            });
                                        }
                                    }
                                });
                            }

                            accomplishments.push({
                                ...(acc.properties || acc),
                                workingGroup: wg,
                                goalNumber: goal.goal?.properties?.goal_number,
                                level: 'goal',
                                // Include YSE information as arrays
                                yse_identifiers: yseIdentifiers,
                                yse_descriptions: yseDescriptions
                            });
                        });
                    }
                });
            }
        });

        // Remove duplicates based on unique_id
        const uniqueAccomplishments = accomplishments.filter((acc, index, self) =>
            index === self.findIndex((a) => a.unique_id === acc.unique_id)
        );

        return uniqueAccomplishments;
    };

    if (loading) {
        return (
            <Center minH="400px">
                <VStack spacing={4}>
                    <Spinner
                        size="lg"
                        color="teal.500"
                        thickness="3px"
                    />
                    <Text fontSize="sm" color="gray.600">
                        Loading plans and accomplishments...
                    </Text>
                </VStack>
            </Center>
        );
    }

    const plans = getAllPlans();
    const accomplishments = getAllAccomplishments();

    return (
        <Box p={6} bg="gray.50" minH="100vh">
            <VStack spacing={6} align="stretch">
                <Box
                    bg="white"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                    p={6}
                >
                    <HStack justify="space-between">
                        <Heading size="lg" color="gray.800" fontWeight="bold">
                            Plans & Accomplishments
                        </Heading>
                        <HStack spacing={3}>
                            {activeTab === 0 && (
                                <Checkbox
                                    size="sm"
                                    isChecked={showAbandoned}
                                    onChange={(e) => setShowAbandoned(e.target.checked)}
                                    colorScheme="gray"
                                >
                                    <Text fontSize="sm" color="gray.600">
                                        Show abandoned
                                    </Text>
                                </Checkbox>
                            )}
                            <Button
                                size="sm"
                                colorScheme="teal"
                                leftIcon={<FaPlus />}
                                onClick={onOpen}
                            >
                                Add Plan
                            </Button>
                        </HStack>
                    </HStack>
                </Box>

                <Box
                    bg="white"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                    overflow="hidden"
                >
                    <Tabs
                        index={activeTab}
                        onChange={setActiveTab}
                        colorScheme="teal"
                        variant="line"
                    >
                        <TabList
                            bg="gray.50"
                            borderBottomWidth="2px"
                            borderBottomColor="gray.200"
                        >
                            <Tab
                                fontSize="sm"
                                fontWeight="semibold"
                                color="gray.600"
                                _selected={{
                                    color: 'teal.700',
                                    borderBottomWidth: '2px',
                                    borderBottomColor: 'teal.500',
                                    bg: 'white'
                                }}
                                _hover={{
                                    bg: 'white'
                                }}
                            >
                                Plans ({plans.length})
                            </Tab>
                            <Tab
                                fontSize="sm"
                                fontWeight="semibold"
                                color="gray.600"
                                _selected={{
                                    color: 'teal.700',
                                    borderBottomWidth: '2px',
                                    borderBottomColor: 'teal.500',
                                    bg: 'white'
                                }}
                                _hover={{
                                    bg: 'white'
                                }}
                            >
                                Accomplishments ({accomplishments.length})
                            </Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel p={0}>
                                <PlansTable
                                    plans={plans}
                                    onUpdate={loadSingleWorkingGroupData}
                                />
                            </TabPanel>
                            <TabPanel p={0}>
                                <AccomplishmentsTable
                                    accomplishments={accomplishments}
                                    onUpdate={loadSingleWorkingGroupData}
                                />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Box>
            </VStack>

            {/* Add Plan Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="2xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader color="gray.800" fontWeight="bold">
                        Create New Plan
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                    Plan Name
                                </FormLabel>
                                <Input
                                    size="sm"
                                    borderColor="gray.300"
                                    value={newPlanData.name}
                                    onChange={(e) => setNewPlanData({...newPlanData, name: e.target.value})}
                                    placeholder="Enter plan name"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                    Description
                                </FormLabel>
                                <Textarea
                                    size="sm"
                                    borderColor="gray.300"
                                    value={newPlanData.description}
                                    onChange={(e) => setNewPlanData({...newPlanData, description: e.target.value})}
                                    placeholder="Describe the plan and its objectives"
                                    rows={3}
                                />
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                    Year Success Evidence
                                </FormLabel>
                                <Select
                                    size="sm"
                                    borderColor="gray.300"
                                    value={newPlanData.furthered_yse_identifier}
                                    onChange={(e) => handleYSEChange(e.target.value)}
                                    placeholder="Select a Year Success Evidence (optional)"
                                >
                                    {availableYSEs.map((yse) => (
                                        <option key={yse.identifier} value={yse.identifier}>
                                            {yse.identifier} - {yse.indicatorKey}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" color="gray.800" fontWeight="bold">
                                    Initial Status
                                </FormLabel>
                                <Select
                                    size="sm"
                                    borderColor="gray.300"
                                    value={newPlanData.plan_status}
                                    onChange={(e) => setNewPlanData({...newPlanData, plan_status: e.target.value})}
                                >
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                </Select>
                            </FormControl>

                            <HStack spacing={6} width="full">
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb="0" mr={3}>
                                        Key Plan
                                    </FormLabel>
                                    <Switch
                                        size="sm"
                                        colorScheme="purple"
                                        isChecked={newPlanData.is_key_plan}
                                        onChange={(e) => setNewPlanData({...newPlanData, is_key_plan: e.target.checked})}
                                    />
                                </FormControl>
                                <FormControl display="flex" alignItems="center">
                                    <FormLabel fontSize="sm" color="gray.800" fontWeight="bold" mb="0" mr={3}>
                                        Campus Plan
                                    </FormLabel>
                                    <Switch
                                        size="sm"
                                        colorScheme="green"
                                        isChecked={newPlanData.is_campus_plan}
                                        onChange={(e) => setNewPlanData({...newPlanData, is_campus_plan: e.target.checked})}
                                    />
                                </FormControl>
                            </HStack>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="outline" size="sm" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="teal"
                            size="sm"
                            onClick={handleSubmitNewPlan}
                            isLoading={isSubmitting}
                            loadingText="Creating..."
                        >
                            Create Plan
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default PlansAccomplishmentsManager;