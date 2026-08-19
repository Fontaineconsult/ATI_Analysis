import React, { useContext, useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Collapse,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    Link,
    Select,
    Switch,
    Text,
    Textarea,
    Tooltip,
    VStack,
    Wrap,
    WrapItem,
    useToast,
} from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { updatePlan } from '../../../services/api/put';
import { createPlan } from '../../../services/api/post';
import { DataContext } from '../../../context/DataContext';
import { SettingsContext, useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import { PLAN_STATUSES, DEFAULT_PLAN_STATUS } from '../../../services/utils/planStatus';
import { getPlanStatusColorScheme, getPlanStatusLabel } from '../../../styles/planStatusColors';

/**
 * Plans attached to one YearSuccessEvidence, in the indicator's Annotations tab.
 *
 * A plan is usually SHARED: it furthers many indicators across many campuses, but this
 * editor is always opened from a single indicator's page. The badge row exists to make
 * that reach visible before anyone edits — without it the form reads as though it were
 * editing something local to this indicator, which it very often is not.
 */

/** The scope + classification badges for one plan. */
function PlanBadges({ plan }) {
    const indicatorCount = plan.indicator_count || 0;
    const campuses = plan.campuses || [];

    return (
        <Wrap spacing={1.5} mt={1.5} shouldWrapChildren>
            <WrapItem>
                <Badge colorScheme={getPlanStatusColorScheme(plan)} fontSize="2xs">
                    {getPlanStatusLabel(plan)}
                    {/* Folded into the status badge rather than given its own: the date
                        only means anything as a qualifier on "Completed". */}
                    {plan.completed_date && !plan.abandoned ? ` · ${plan.completed_date}` : ''}
                </Badge>
            </WrapItem>

            {plan.is_key_plan ? (
                <WrapItem><Badge colorScheme="purple" fontSize="2xs">Key Plan</Badge></WrapItem>
            ) : null}

            {plan.is_campus_plan ? (
                <WrapItem><Badge colorScheme="teal" fontSize="2xs">Campus Plan</Badge></WrapItem>
            ) : null}

            {/* Shown only when the plan actually reaches beyond this indicator — a "1
                indicator" badge would be noise on every row and would bury the cases
                that matter. */}
            {indicatorCount > 1 ? (
                <WrapItem>
                    <Tooltip label={`This plan furthers ${indicatorCount} success indicators. Edits here apply to all of them.`}>
                        <Badge colorScheme="orange" variant="subtle" fontSize="2xs" cursor="help">
                            {indicatorCount} indicators
                        </Badge>
                    </Tooltip>
                </WrapItem>
            ) : null}

            {campuses.length > 1 ? (
                <WrapItem>
                    <Tooltip label={`Shared across ${campuses.join(', ').toUpperCase()}.`}>
                        <Badge colorScheme="blue" variant="subtle" fontSize="2xs" cursor="help">
                            {campuses.length} campuses
                        </Badge>
                    </Tooltip>
                </WrapItem>
            ) : null}

            {plan.asana_task_gid ? (
                <WrapItem>
                    <Link
                        href={`https://app.asana.com/0/0/${plan.asana_task_gid}`}
                        isExternal
                        display="inline-flex"
                        alignItems="center"
                    >
                        <Badge colorScheme="gray" fontSize="2xs" cursor="pointer">
                            Asana <ExternalLinkIcon boxSize={2} ml={0.5} />
                        </Badge>
                    </Link>
                </WrapItem>
            ) : null}
        </Wrap>
    );
}

function PlanViewer({ plans, onSubmit, yearSuccessEvidence, createdBy }) {
    // Keyed by unique_id, not list position: the list is re-fetched after every save
    // and a positional key expands whichever plan happens to land in that slot.
    const [expandedId, setExpandedId] = useState(null);
    const [isAddingNewPlan, setIsAddingNewPlan] = useState(false);
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentWorkingGroup } = useSettings();
    const { user } = useContext(UserContext);
    const { currentAcademicYear } = useContext(SettingsContext);
    const toast = useToast();

    const toggleCollapse = (uniqueId) => {
        setExpandedId(expandedId === uniqueId ? null : uniqueId);
    };

    // Handle form submission for both new and updated plans
    const handleFormSubmit = async (planData, isNew) => {
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
            toast({
                title: isNew ? 'Plan created' : 'Plan updated',
                status: 'success', duration: 2000, isClosable: true, position: 'top-right',
            });
            setExpandedId(null);
            setIsAddingNewPlan(false);
        } catch (error) {
            // A failed save must NOT look like a successful one. This previously only
            // logged to the console and still fell through to closing the form, so a
            // rejected update was indistinguishable from a saved one. Keep the form
            // open with the user's input intact, and say what went wrong.
            console.error('Error submitting plan:', error);
            toast({
                title: isNew ? 'Failed to create plan' : 'Failed to update plan',
                description: error?.response?.data?.error || error?.message || 'Please try again.',
                status: 'error', duration: 6000, isClosable: true, position: 'top-right',
            });
        }
    };

    return (
        <Box>
            {!isAddingNewPlan ? (
                <Button size="sm" colorScheme="teal" onClick={() => setIsAddingNewPlan(true)} mb={3}>
                    + Add Plan
                </Button>
            ) : (
                // Above the list, not instead of it — the list is context while you write,
                // and this is the pattern the sibling Notes/Messages tabs already use.
                <Box mb={3} borderWidth="1px" borderColor="teal.300" borderRadius="md" p={3} bg="teal.50">
                    <Text fontSize="xs" fontWeight="semibold" color="teal.700" textTransform="uppercase" letterSpacing="wide" mb={2}>
                        New Plan
                    </Text>
                    <PlanForm
                        plan={null}
                        onSubmit={(planData) => handleFormSubmit(planData, true)}
                        onCancel={() => setIsAddingNewPlan(false)}
                        createdBy={user?.properties || user}
                    />
                </Box>
            )}

            {plans && plans.length > 0 ? (
                <VStack align="stretch" spacing={2}>
                    {plans.map((planWrapper, index) => {
                        const props = planWrapper.properties || {};
                        const uniqueId = props.unique_id || `idx-${index}`;
                        const isExpanded = expandedId === uniqueId;
                        const createdByPerson = planWrapper.created_by?.properties;

                        return (
                            <Box
                                key={uniqueId}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="md"
                                p={3}
                                _hover={{ borderColor: 'teal.300', bg: 'gray.50' }}
                            >
                                <Flex justify="space-between" align="start" gap={2}>
                                    <Box flex="1" minW="0">
                                        <Text fontWeight="semibold" fontSize="sm" color="gray.800">
                                            {props.name || 'Untitled Plan'}
                                        </Text>
                                        {props.description ? (
                                            <Text fontSize="xs" color="gray.600" noOfLines={isExpanded ? undefined : 2} mt={0.5}>
                                                {props.description}
                                            </Text>
                                        ) : null}
                                        <PlanBadges plan={props} />
                                    </Box>
                                    <Button
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="teal"
                                        flexShrink={0}
                                        onClick={() => toggleCollapse(uniqueId)}
                                        aria-expanded={isExpanded}
                                    >
                                        {isExpanded ? 'Close' : 'Edit'}
                                    </Button>
                                </Flex>

                                {/* unmountOnExit: without it every row keeps a full form
                                    mounted, so a collapsed plan still contributes its
                                    labels and status <option>s to the accessibility tree
                                    — duplicating the badge text and giving screen readers
                                    N hidden forms to wade through. */}
                                <Collapse in={isExpanded} animateOpacity unmountOnExit>
                                    <Box mt={3} pt={3} borderTopWidth="1px" borderColor="gray.200">
                                        <PlanForm
                                            plan={planWrapper}
                                            onSubmit={(planData) => handleFormSubmit(planData, false)}
                                            onCancel={() => setExpandedId(null)}
                                            createdBy={createdByPerson}
                                        />
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </VStack>
            ) : (
                <Text fontSize="sm" color="gray.600" fontStyle="italic">
                    No plans recorded for this indicator.
                </Text>
            )}
        </Box>
    );
}

function PlanForm({ plan, onSubmit, onCancel, createdBy }) {
    const initial = () => ({
        unique_id: plan?.properties?.unique_id || '',
        name: plan?.properties?.name || '',
        description: plan?.properties?.description || '',
        is_key_plan: plan?.properties?.is_key_plan || false,
        is_campus_plan: plan?.properties?.is_campus_plan || false,
        abandoned: plan?.properties?.abandoned || false,
        abandoned_notes: plan?.properties?.abandoned_notes || '',
        plan_status: plan?.properties?.plan_status || DEFAULT_PLAN_STATUS,
        completed_date: plan?.properties?.completed_date || '',
        created_by: createdBy || {},
    });

    const [planData, setPlanData] = useState(initial);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Re-seed when a different plan is opened.
    useEffect(() => { setPlanData(initial()); }, [plan, createdBy]);  // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPlanData({ ...planData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(planData);
        } catch (error) {
            console.error('Error submitting plan:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEdit = Boolean(plan?.properties?.unique_id);

    return (
        <Box as="form" onSubmit={handleSubmit}>
            <VStack align="stretch" spacing={3}>
                <FormControl isRequired>
                    <FormLabel htmlFor={`plan-name-${planData.unique_id || 'new'}`} fontSize="sm" color="gray.700" fontWeight="semibold" mb={1}>
                        Plan Name
                    </FormLabel>
                    <Input
                        id={`plan-name-${planData.unique_id || 'new'}`}
                        size="sm" name="name" value={planData.name} onChange={handleChange}
                    />
                </FormControl>

                <FormControl isRequired>
                    <FormLabel htmlFor={`plan-desc-${planData.unique_id || 'new'}`} fontSize="sm" color="gray.700" fontWeight="semibold" mb={1}>
                        Description
                    </FormLabel>
                    <Textarea
                        id={`plan-desc-${planData.unique_id || 'new'}`}
                        size="sm" rows={3} name="description" value={planData.description} onChange={handleChange}
                    />
                </FormControl>

                <Flex gap={4} wrap="wrap">
                    <FormControl flex="1" minW="180px">
                        <FormLabel htmlFor={`plan-status-${planData.unique_id || 'new'}`} fontSize="sm" color="gray.700" fontWeight="semibold" mb={1}>
                            Plan Status
                        </FormLabel>
                        {/* Options come from the shared vocabulary, not a literal list —
                            hardcoding them here is what let "Complete" drift away from
                            the write path's "Completed". */}
                        <Select
                            id={`plan-status-${planData.unique_id || 'new'}`}
                            size="sm" name="plan_status" value={planData.plan_status} onChange={handleChange}
                        >
                            {PLAN_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </Select>
                    </FormControl>

                    <VStack align="stretch" spacing={2} flex="1" minW="180px" justify="flex-end">
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <FormLabel htmlFor={`plan-key-${planData.unique_id || 'new'}`} fontSize="sm" color="gray.700" fontWeight="semibold" mb={0}>
                                Key Plan
                            </FormLabel>
                            <Switch
                                id={`plan-key-${planData.unique_id || 'new'}`}
                                size="sm" colorScheme="teal" name="is_key_plan"
                                isChecked={planData.is_key_plan} onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <FormLabel htmlFor={`plan-campus-${planData.unique_id || 'new'}`} fontSize="sm" color="gray.700" fontWeight="semibold" mb={0}>
                                Campus Plan
                            </FormLabel>
                            <Switch
                                id={`plan-campus-${planData.unique_id || 'new'}`}
                                size="sm" colorScheme="teal" name="is_campus_plan"
                                isChecked={planData.is_campus_plan} onChange={handleChange}
                            />
                        </FormControl>
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                            <FormLabel htmlFor={`plan-abandoned-${planData.unique_id || 'new'}`} fontSize="sm" color="gray.700" fontWeight="semibold" mb={0}>
                                Abandoned
                            </FormLabel>
                            <Switch
                                id={`plan-abandoned-${planData.unique_id || 'new'}`}
                                size="sm" colorScheme="red" name="abandoned"
                                isChecked={planData.abandoned} onChange={handleChange}
                            />
                        </FormControl>
                    </VStack>
                </Flex>

                {/* Only asked for once the plan is Completed. Left blank, the write path
                    stamps today on the transition; filled in, it records a completion
                    that actually happened earlier — this register is kept
                    retrospectively, so "today" is often the wrong answer. */}
                {planData.plan_status === 'Completed' && !planData.abandoned ? (
                    <FormControl>
                        <FormLabel htmlFor={`plan-completed-${planData.unique_id || 'new'}`} fontSize="sm" color="gray.700" fontWeight="semibold" mb={1}>
                            Completed Date
                        </FormLabel>
                        <Input
                            id={`plan-completed-${planData.unique_id || 'new'}`}
                            type="date"
                            size="sm"
                            maxW="200px"
                            name="completed_date"
                            value={planData.completed_date}
                            onChange={handleChange}
                        />
                        <FormHelperText fontSize="xs" color="gray.600">
                            Leave blank to record today.
                        </FormHelperText>
                    </FormControl>
                ) : null}

                {/* Only relevant once the plan is abandoned — an always-visible field here
                    invited notes on plans that were never abandoned. */}
                {planData.abandoned ? (
                    <FormControl>
                        <FormLabel htmlFor={`plan-abnotes-${planData.unique_id || 'new'}`} fontSize="sm" color="gray.700" fontWeight="semibold" mb={1}>
                            Abandoned Notes
                        </FormLabel>
                        <Textarea
                            id={`plan-abnotes-${planData.unique_id || 'new'}`}
                            size="sm" rows={2} name="abandoned_notes"
                            value={planData.abandoned_notes} onChange={handleChange}
                        />
                    </FormControl>
                ) : null}

                <HStack justify="space-between" align="center">
                    <Text fontSize="xs" color="gray.600">
                        {createdBy?.name
                            ? `Created by ${createdBy.name}${createdBy.title ? ` (${createdBy.title})` : ''}`
                            : 'Created by unknown'}
                    </Text>
                    <HStack spacing={2}>
                        {onCancel ? (
                            <Button size="sm" variant="ghost" onClick={onCancel} isDisabled={isSubmitting}>
                                Cancel
                            </Button>
                        ) : null}
                        <Button
                            type="submit"
                            size="sm"
                            colorScheme="teal"
                            isLoading={isSubmitting}
                            loadingText={isEdit ? 'Updating…' : 'Saving…'}
                        >
                            {isEdit ? 'Update Plan' : 'Save Plan'}
                        </Button>
                    </HStack>
                </HStack>
            </VStack>
        </Box>
    );
}

export default PlanViewer;
