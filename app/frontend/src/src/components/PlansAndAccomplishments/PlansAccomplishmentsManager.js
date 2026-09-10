import React, { useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { WORKING_GROUP_LIST } from '../../styles/workingGroupIdentity';
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
    useToast
} from '@chakra-ui/react';
import { FaPlus, FaSyncAlt } from 'react-icons/fa';
import { DataContext } from '../../context/DataContext';
import { SettingsContext } from '../../context/SettingsContext';
import PlansSplitView from './PlansSplitView';
import AccomplishmentsTable from './AccomplishmentsTable';
import PlanTasksBoard from './PlanTasksBoard';
import { createPlan, refreshAsanaPlans } from '../../services/api/post';
import { fetchAccomplishmentsBoard, fetchPlansBoard } from '../../services/api/get';
import useResource from '../../hooks/useResource';
import { KEYS } from '../../context/resourceKeys';
import { workingGroupWebSafe } from "../../services/utils/tools";

// Board working-group names -> the URL slugs PlansList buckets by.
const WG_NAME_TO_SLUG = Object.fromEntries(
    WORKING_GROUP_LIST.map((w) => [w.name, w.slug]),
);

function StatCard({ label, value, accent }) {
    return (
        <Box flex="1" bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg"
             boxShadow="sm" p={4} borderTopWidth="3px" borderTopColor={accent}>
            <Text fontSize="xs" color="gray.700" textTransform="uppercase">{label}</Text>
            <Text fontSize="2xl" fontWeight="bold" color="gray.800">{value}</Text>
        </Box>
    );
}

function PlansAccomplishmentsManager() {
    const { data, loading, loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentAcademicYear, currentCampus } = useContext(SettingsContext);

    // /plans/:planId deep-link support. The route pattern mirrors implementations'
    // /implementations/:type/:id — same component handles list and deep-link,
    // we just pre-expand the matching row.
    //
    // FUTURE: when a dedicated single-plan detail view is built, this route
    // will instead mount that view (PlanDetailView or similar). The URL
    // shape stays the same; only the rendering swaps.
    const { planId: initialPlanId } = useParams();

    const [activeTab, setActiveTab] = useState(0);

    // The Plans tab reads its own board: one request carrying every visible
    // plan WITH its task rollups (open / overdue / unowned / no-next-step),
    // instead of walking the whole three-working-group dashboard payload
    // client-side. The dashboard payload's one remaining job here is the
    // add-plan form's YSE options.
    const {
        data: boardResp, loading: boardLoading, reload: reloadBoard,
    } = useResource(
        currentCampus && currentAcademicYear
            ? KEYS.plansBoard(currentCampus, currentAcademicYear) : null,
        () => fetchPlansBoard(currentCampus, currentAcademicYear),
    );
    const boardPlans = useMemo(() => (boardResp?.data?.plans || []).map((p) => ({
        ...p,
        workingGroup: WG_NAME_TO_SLUG[p.working_groups?.[0]] || p.working_groups?.[0] || null,
        goalNumber: p.goal_numbers?.[0] ?? null,
    })), [boardResp]);

    const boardStats = useMemo(() => ({
        total: boardPlans.length,
        openTasks: boardPlans.reduce((n, p) => n + (p.tasks_open || 0), 0),
        overdue: boardPlans.reduce((n, p) => n + (p.tasks_overdue || 0), 0),
        noNextStep: boardPlans.filter((p) => p.no_next_step).length,
    }), [boardPlans]);

    // The Accomplishments tab reads its own board too (context columns
    // included), so it no longer depends on the dashboard payload either.
    const {
        data: accResp, reload: reloadAccomplishments,
    } = useResource(KEYS.accomplishmentsBoard, fetchAccomplishmentsBoard);
    const accomplishmentRows = useMemo(
        () => (accResp?.data?.accomplishments || []).map((a) => ({
            ...a,
            workingGroup: a.working_groups?.[0] || null,
            goalNumber: a.goal_numbers?.[0] ?? null,
        })),
        [accResp],
    );
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAsanaRefreshing, setIsAsanaRefreshing] = useState(false);
    const toast = useToast();

    // Two-way Asana sync for the current campus + year: pushes plans into the
    // year's Asana project, pulls subtasks back into the graph, then refetches
    // all three working groups so any new subtask state is visible.
    const handleAsanaRefresh = async () => {
        if (!currentCampus || !currentAcademicYear) {
            toast({
                title: 'Campus and year required',
                description: 'Select a campus and academic year before refreshing Asana.',
                status: 'warning', duration: 4000, isClosable: true,
            });
            return;
        }
        setIsAsanaRefreshing(true);
        try {
            const result = await refreshAsanaPlans(currentCampus, currentAcademicYear);
            const s = result?.data || {};
            toast({
                title: 'Asana refresh complete',
                description: `${s.tasks_created ?? 0} created, ${s.tasks_updated ?? 0} updated, ` +
                    `${s.subtasks_synced ?? 0} subtasks mirrored into "${s.project_name}".`,
                status: 'success', duration: 6000, isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Asana refresh failed',
                description: error.response?.data?.error || error.message,
                status: 'error', duration: 8000, isClosable: true,
            });
        } finally {
            setIsAsanaRefreshing(false);
        }
    };

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
        WORKING_GROUP_LIST.map((w) => w.dataKey).forEach(wg => {
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
            // If a plan is created already-abandoned or already-completed, stamp
            // the current academic year so it shows up under the right year's
            // bucket. The backend connects abandoned_year / completed_year
            // edges when these *_year_name fields are present.
            const createPayload = { ...newPlanData };
            if (newPlanData.abandoned === true && currentAcademicYear) {
                createPayload.abandoned_year_name = currentAcademicYear;
            }
            if (newPlanData.plan_status === 'Completed' && currentAcademicYear) {
                createPayload.completed_year_name = currentAcademicYear;
            }
            await createPlan(createPayload);
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
                await reloadBoard();
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

    // Plan rows come from the /plans/board read (boardPlans above); the old
    // getAllPlans walk over the dashboard payload is gone with it.
    // Accomplishment rows come from the /accomplishments/board read below.

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

    const plans = boardPlans;
    const accomplishments = accomplishmentRows;

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
                                <Button
                                    size="sm"
                                    variant="outline"
                                    colorScheme="purple"
                                    leftIcon={<FaSyncAlt />}
                                    onClick={handleAsanaRefresh}
                                    isLoading={isAsanaRefreshing}
                                    loadingText="Syncing Asana…"
                                >
                                    Asana Refresh
                                </Button>
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
                                Tasks ({boardStats.openTasks})
                            </Tab>
                        </TabList>

                        <TabPanels>
                            <TabPanel p={0}>
                                {/* Diagnostic strip: what needs attention across every
                                    visible plan, before any row is opened. */}
                                <HStack spacing={4} p={4} pb={0} align="stretch">
                                    <StatCard label="Plans" value={boardStats.total} accent="teal.400" />
                                    <StatCard label="Open tasks" value={boardStats.openTasks}
                                              accent={boardStats.openTasks > 0 ? 'blue.400' : 'gray.300'} />
                                    <StatCard label="Overdue tasks" value={boardStats.overdue}
                                              accent={boardStats.overdue > 0 ? 'red.400' : 'gray.300'} />
                                    <StatCard label="No next step" value={boardStats.noNextStep}
                                              accent={boardStats.noNextStep > 0 ? 'orange.400' : 'gray.300'} />
                                </HStack>
                                {boardLoading ? (
                                    <HStack p={6} color="gray.700" fontSize="sm">
                                        <Spinner size="sm" color="teal.500" />
                                        <Text>Loading the plans board…</Text>
                                    </HStack>
                                ) : (
                                    <PlansSplitView
                                        plans={plans}
                                        onUpdate={reloadBoard}
                                        initialPlanId={initialPlanId}
                                    />
                                )}
                            </TabPanel>
                            <TabPanel p={0}>
                                <AccomplishmentsTable
                                    accomplishments={accomplishments}
                                    onUpdate={reloadAccomplishments}
                                />
                            </TabPanel>
                            <TabPanel p={0}>
                                <PlanTasksBoard year={currentAcademicYear} />
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