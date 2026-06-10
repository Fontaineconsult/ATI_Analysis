import React, { useContext, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Collapse,
    Heading,
    HStack,
    IconButton,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Tooltip,
    useDisclosure,
    VStack,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';

import { UserContext } from '../../../context/UserContext';
import { getUrlFromCompositeKey } from '../../../services/utils/tools';
import {
    addPrioritizedIndicator,
    removePrioritizedIndicator,
    assignGroupLead,
    unassignGroupLead,
} from '../../../services/api/post';
import IndicatorSelectorModal from './IndicatorSelectorModal';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import ProgressUpdateModal from './ProgressUpdateModal';
import StatusProgression from './StatusProgression';

// Trajectory pill colors. Mirrors data_config.trajectory_choices keys.
const TRAJECTORY_COLOR = {
    improving: 'green',
    on_track:  'blue',
    stagnant:  'yellow',
    at_risk:   'orange',
    failing:   'red',
};
const TRAJECTORY_LABEL = {
    improving: 'Improving',
    on_track:  'On Track',
    stagnant:  'Stagnant',
    at_risk:   'At Risk',
    failing:   'Failing',
};

function TrajectoryBadge({ trajectory }) {
    if (!trajectory) return null;
    return (
        <Badge
            colorScheme={TRAJECTORY_COLOR[trajectory] || 'gray'}
            fontSize="xs"
            textTransform="none"
        >
            {TRAJECTORY_LABEL[trajectory] || trajectory}
        </Badge>
    );
}

/**
 * Renders a single working group's slice of a CampusPlan: heading, identifier,
 * indicator/lead counts, and the list of campus-plan-flagged Plans attached
 * via WorkingGroupPlan.includes_plan.
 *
 * Reusable across all three working group views (Web / Procurement /
 * Instructional Materials). The shape it expects is the WGP object the
 * /campus-plans/<campus>/<year> endpoint returns under working_group_plans.
 */
function SectionHeading({ children, mb = 2 }) {
    return (
        <Heading as="h4" size="xs" color="gray.700" mb={mb} textTransform="uppercase" letterSpacing="wide">
            {children}
        </Heading>
    );
}

function EmptyText({ children }) {
    return (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">{children}</Text>
    );
}

function WorkingGroupPlan({
    wgp,
    campusAbbrev,
    campusName,
    onIndicatorAdded,
    onProgressAdded,
    onLeadsChanged,
    currentUserUniqueId,
    peerWorkingGroupPlans = [],
    onPeerIndicatorChanged,
}) {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const leadsModal = useDisclosure();
    const plansSection = useDisclosure({ defaultIsOpen: false });
    const [activeProgressSi, setActiveProgressSi] = useState(null);
    const [togglingKey, setTogglingKey] = useState(null); // `${campusAbbrev}|${compositeKey}` while adding
    const userCtx = useContext(UserContext);
    const individuals = userCtx?.individuals || [];

    if (!wgp) return null;

    const prioritizedIds = wgp.prioritized_success_indicators.map((si) => si.unique_id);

    // Union of prioritized indicators across the primary + every loaded peer
    // campus, deduped by composite_key. Each entry carries:
    //   - primarySi: the primary campus's SI object (with status, trajectory,
    //     progress, plans) if the primary has prioritized it, else null.
    //   - prioritizedByAbbrevs: Set of campus abbrevs (primary + peers) that
    //     have prioritized this indicator. Drives per-campus badges.
    // Rows where primarySi is null are "peer-only" — primary hasn't picked
    // this one yet; clicking the primary badge adds it.
    const allCampusEntries = [
        { campusAbbrev, campusName: campusName || campusAbbrev, wgp, isPrimary: true },
        ...peerWorkingGroupPlans.map(({ campusAbbrev: a, campusName: n, wgp: w }) => ({
            campusAbbrev: a, campusName: n || a, wgp: w, isPrimary: false,
        })),
    ];

    const unionIndicators = (() => {
        const byKey = new Map();
        // Primary first so the primarySi is populated from this campus when present.
        for (const { wgp: w, campusAbbrev: a } of allCampusEntries) {
            if (!w || !Array.isArray(w.prioritized_success_indicators)) continue;
            for (const si of w.prioritized_success_indicators) {
                const key = si.composite_key;
                if (!key) continue;
                let entry = byKey.get(key);
                if (!entry) {
                    entry = {
                        composite_key: key,
                        success_indicator: si.success_indicator,
                        primarySi: null,
                        prioritizedByAbbrevs: new Set(),
                    };
                    byKey.set(key, entry);
                }
                entry.prioritizedByAbbrevs.add(a);
                // Carry the primary's full SI when the primary has prioritized it.
                if (a === campusAbbrev) entry.primarySi = si;
                // Fill in description from any campus if we don't have one yet.
                if (!entry.success_indicator) entry.success_indicator = si.success_indicator;
            }
        }
        return Array.from(byKey.values()).sort((a, b) => a.composite_key.localeCompare(b.composite_key));
    })();

    // Toggle this indicator's priority for a given campus. Adding and removing both run
    // through here; the campus badge reflects current state and flips it on click.
    // Un-prioritizing only drops the priority edge — any logged progress / companion plans
    // for the indicator stay put and reappear if it's re-prioritized.
    const handleToggleCampusPriority = async (entry, campusEntry) => {
        const { campusAbbrev: targetAbbrev, wgp: targetWgp, isPrimary } = campusEntry;
        if (!targetWgp?.plan_identifier) return;
        const alreadyPrioritized = entry.prioritizedByAbbrevs.has(targetAbbrev);
        const tkey = `${targetAbbrev}|${entry.composite_key}`;
        setTogglingKey(tkey);
        try {
            if (alreadyPrioritized) {
                await removePrioritizedIndicator(targetWgp.plan_identifier, entry.composite_key);
            } else {
                await addPrioritizedIndicator(targetWgp.plan_identifier, entry.composite_key);
            }
            if (isPrimary) {
                if (onIndicatorAdded) onIndicatorAdded();
            } else {
                if (onPeerIndicatorChanged) onPeerIndicatorChanged(targetAbbrev);
            }
        } catch (err) {
            // Surface to console; toast handling can be wired by caller if desired.
            console.error('Failed to toggle prioritized indicator', err);
        } finally {
            setTogglingKey(null);
        }
    };

    return (
        <Box p={4} borderWidth="1px" borderColor="gray.200" borderRadius="md">
            <HStack justify="space-between" mb={4}>
                <Heading as="h3" size="sm" color="teal.700">
                    {wgp.working_group}
                </Heading>
                <Text fontSize="xs" color="gray.500" fontFamily="mono">
                    {wgp.plan_identifier}
                </Text>
            </HStack>

            <VStack align="stretch" spacing={4}>
                <Box>
                    <HStack justify="space-between" align="center" mb={2}>
                        <SectionHeading mb={0}>Group Leads</SectionHeading>
                        <Button
                            size="xs"
                            variant="outline"
                            colorScheme="teal"
                            onClick={leadsModal.onOpen}
                        >
                            Manage
                        </Button>
                    </HStack>
                    {wgp.group_leads.length === 0 ? (
                        <EmptyText>No leads assigned.</EmptyText>
                    ) : (
                        <VStack align="stretch" spacing={1}>
                            {wgp.group_leads.map((person) => (
                                <HStack key={person.unique_id} spacing={2}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.800">{person.name}</Text>
                                    {person.title && (
                                        <Text fontSize="sm" color="gray.500">— {person.title}</Text>
                                    )}
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </Box>

                <Box>
                    <HStack justify="space-between" align="center" mb={2}>
                        <SectionHeading mb={0}>Prioritized Indicators</SectionHeading>
                        <Button
                            size="xs"
                            variant="outline"
                            colorScheme="teal"
                            onClick={onOpen}
                        >
                            + Add Indicator
                        </Button>
                    </HStack>
                    {unionIndicators.length === 0 ? (
                        <EmptyText>None selected.</EmptyText>
                    ) : (
                        <VStack align="stretch" spacing={3}>
                            {unionIndicators.map((entry) => {
                                const si = entry.primarySi;
                                const isPrimaryPrioritized = entry.prioritizedByAbbrevs.has(campusAbbrev);
                                const companionCount = si?.companion_plans ? si.companion_plans.length : 0;
                                const progress = si?.progress || { yse_identifier: null, update_count: 0, updates: [] };
                                const updates = progress.updates || [];
                                const trajectory = updates.length > 0 ? updates[0].trajectory : null;
                                const canLogProgress = !!progress.yse_identifier;

                                const campusBadgesRow = (
                                    <HStack spacing={1} flexWrap="wrap">
                                        {allCampusEntries.map((c) => {
                                            const has = entry.prioritizedByAbbrevs.has(c.campusAbbrev);
                                            const tkey = `${c.campusAbbrev}|${entry.composite_key}`;
                                            const isBusy = togglingKey === tkey;
                                            return (
                                                <Button
                                                    key={c.campusAbbrev}
                                                    size="xs"
                                                    variant={has ? 'solid' : 'outline'}
                                                    colorScheme={has ? 'teal' : 'gray'}
                                                    onClick={() => handleToggleCampusPriority(entry, c)}
                                                    isLoading={isBusy}
                                                    isDisabled={isBusy}
                                                    title={
                                                        has
                                                            ? `Prioritized by ${c.campusName} — click to remove`
                                                            : `Click to prioritize for ${c.campusName}`
                                                    }
                                                    px={2}
                                                    minW="unset"
                                                    fontSize="2xs"
                                                    textTransform="uppercase"
                                                >
                                                    {c.campusAbbrev}
                                                </Button>
                                            );
                                        })}
                                    </HStack>
                                );

                                return (
                                    <Box
                                        key={entry.composite_key}
                                        p={3}
                                        borderWidth="1px"
                                        borderColor={isPrimaryPrioritized ? 'gray.300' : 'gray.200'}
                                        borderRadius="md"
                                        bg={isPrimaryPrioritized ? 'gray.50' : 'white'}
                                        boxShadow="sm"
                                        opacity={isPrimaryPrioritized ? 1 : 0.95}
                                    >
                                        <HStack align="center" spacing={2}>
                                            <Heading
                                                as="h5"
                                                fontFamily="mono"
                                                fontSize="xs"
                                                color="gray.700"
                                                minW="60px"
                                                fontWeight="semibold"
                                            >
                                                {entry.composite_key}
                                            </Heading>
                                            <Text fontSize="sm" color="gray.900" flex={1} textAlign="left">
                                                {entry.success_indicator}
                                            </Text>
                                            {isPrimaryPrioritized ? (
                                                <>
                                                    <StatusProgression
                                                        previousStatusLevel={si.previous_status_level}
                                                        currentStatusLevel={si.status_level}
                                                    />
                                                    <TrajectoryBadge trajectory={trajectory} />
                                                    {companionCount > 0 ? (
                                                        <Text fontSize="xs" color="teal.600" fontWeight="medium" whiteSpace="nowrap">
                                                            {companionCount} plan{companionCount === 1 ? '' : 's'}
                                                        </Text>
                                                    ) : (
                                                        <Text fontSize="xs" color="gray.400" fontStyle="italic" whiteSpace="nowrap">
                                                            no plan yet
                                                        </Text>
                                                    )}
                                                    {campusAbbrev && (
                                                        <Button
                                                            as={RouterLink}
                                                            to={`/${campusAbbrev}/dashboard/reports/${getUrlFromCompositeKey(entry.composite_key)}`}
                                                            size="xs"
                                                            variant="ghost"
                                                            colorScheme="teal"
                                                        >
                                                            View
                                                        </Button>
                                                    )}
                                                    {canLogProgress && (
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            colorScheme="teal"
                                                            onClick={() => setActiveProgressSi(si)}
                                                        >
                                                            Log
                                                        </Button>
                                                    )}
                                                    <Tooltip label={`Remove from ${campusName || campusAbbrev}'s plan`} hasArrow openDelay={300}>
                                                        <IconButton
                                                            aria-label="Remove indicator from this plan"
                                                            icon={<CloseIcon boxSize={2} />}
                                                            size="xs"
                                                            variant="ghost"
                                                            colorScheme="red"
                                                            isLoading={togglingKey === `${campusAbbrev}|${entry.composite_key}`}
                                                            onClick={() => handleToggleCampusPriority(entry, allCampusEntries[0])}
                                                        />
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Text fontSize="xs" color="gray.400" fontStyle="italic" whiteSpace="nowrap">
                                                    Not prioritized here
                                                </Text>
                                            )}
                                        </HStack>
                                        <Box mt={2} pl="68px">
                                            {campusBadgesRow}
                                        </Box>
                                        {isPrimaryPrioritized && updates.length > 0 && (
                                            <Box
                                                mt={3}
                                                pt={3}
                                                borderTopWidth="1px"
                                                borderTopColor="gray.100"
                                            >
                                                <VStack align="stretch" spacing={1} pl="68px">
                                                    {updates.map((upd, idx) => (
                                                        <HStack key={idx} align="baseline" spacing={2} fontSize="xs">
                                                            {upd.update_date && (
                                                                <Text fontFamily="mono" color="gray.500" minW="80px" whiteSpace="nowrap">
                                                                    {upd.update_date}
                                                                </Text>
                                                            )}
                                                            {upd.trajectory && (
                                                                <Badge
                                                                    colorScheme={TRAJECTORY_COLOR[upd.trajectory] || 'gray'}
                                                                    fontSize="2xs"
                                                                    textTransform="none"
                                                                >
                                                                    {TRAJECTORY_LABEL[upd.trajectory] || upd.trajectory}
                                                                </Badge>
                                                            )}
                                                            <Text color="gray.600" fontStyle="italic">"{upd.note}"</Text>
                                                            {upd.author_name && (
                                                                <Text color="gray.500" whiteSpace="nowrap">— {upd.author_name}</Text>
                                                            )}
                                                        </HStack>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}
                                    </Box>
                                );
                            })}
                        </VStack>
                    )}
                </Box>

                <Box>
                    <SectionHeading>
                        Plans{wgp.plans.length > 0 ? ` (${wgp.plans.length})` : ''}
                    </SectionHeading>

                    {wgp.plans.length === 0 ? (
                        <EmptyText>No campus-plan plans yet.</EmptyText>
                    ) : (
                        <>
                            <HStack spacing={2} flexWrap="wrap" mb={2}>
                                {(() => {
                                    const counts = wgp.plans.reduce((acc, plan) => {
                                        const key = plan.abandoned ? 'Abandoned' : (plan.plan_status || 'Not Started');
                                        acc[key] = (acc[key] || 0) + 1;
                                        return acc;
                                    }, {});
                                    const order = ['In Progress', 'Not Started', 'On Hold', 'Completed', 'Abandoned'];
                                    const colorFor = (status) => ({
                                        'Completed': 'green',
                                        'In Progress': 'blue',
                                        'Abandoned': 'red',
                                    }[status] || 'gray');
                                    return order
                                        .filter((status) => counts[status])
                                        .map((status) => (
                                            <Badge key={status} colorScheme={colorFor(status)} fontSize="xs">
                                                {counts[status]} {status}
                                            </Badge>
                                        ));
                                })()}
                            </HStack>

                            <HStack
                                justify="space-between"
                                align="center"
                                onClick={plansSection.onToggle}
                                cursor="pointer"
                                py={1}
                                px={1}
                                mx={-1}
                                borderRadius="sm"
                                _hover={{ bg: 'gray.50' }}
                                role="button"
                                aria-expanded={plansSection.isOpen}
                                aria-label={plansSection.isOpen ? 'Collapse plan details' : 'Expand plan details'}
                            >
                                <Text fontSize="xs" color="teal.600" fontWeight="semibold" textTransform="uppercase" letterSpacing="wide">
                                    {plansSection.isOpen ? 'Hide details' : 'Show details'}
                                </Text>
                                {plansSection.isOpen
                                    ? <ChevronUpIcon color="gray.500" boxSize={4} />
                                    : <ChevronDownIcon color="gray.500" boxSize={4} />}
                            </HStack>
                            <Collapse in={plansSection.isOpen} animateOpacity unmountOnExit>
                                <VStack align="stretch" spacing={2} mt={2}>
                                    {wgp.plans.map((plan) => {
                                        const planHref = campusAbbrev && plan.unique_id
                                            ? `/${campusAbbrev}/dashboard/plans/${plan.unique_id}`
                                            : null;

                                        const card = (
                                            <Box
                                                p={3}
                                                bg="gray.50"
                                                borderRadius="sm"
                                                borderLeftWidth="3px"
                                                borderLeftColor={plan.abandoned ? 'red.300' : 'teal.400'}
                                                transition="background-color 0.15s, transform 0.15s"
                                                _hover={planHref ? { bg: 'gray.100' } : undefined}
                                            >
                                                <HStack justify="space-between" align="baseline" spacing={2}>
                                                    <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                                        {plan.name || plan.description}
                                                    </Text>
                                                    {plan.academic_year && (
                                                        <Text fontSize="xs" color="gray.500" fontFamily="mono" whiteSpace="nowrap">
                                                            {plan.academic_year}
                                                            {plan.completed_year && ` · completed ${plan.completed_year}`}
                                                        </Text>
                                                    )}
                                                </HStack>
                                                {plan.plan_status && (
                                                    <Text fontSize="xs" color="gray.600" mt={1}>
                                                        Status: {plan.plan_status}
                                                    </Text>
                                                )}
                                            </Box>
                                        );

                                        return planHref ? (
                                            <Link
                                                key={plan.unique_id}
                                                as={RouterLink}
                                                to={planHref}
                                                display="block"
                                                _hover={{ textDecoration: 'none' }}
                                            >
                                                {card}
                                            </Link>
                                        ) : (
                                            <React.Fragment key={plan.unique_id}>{card}</React.Fragment>
                                        );
                                    })}
                                </VStack>
                            </Collapse>
                        </>
                    )}
                </Box>
            </VStack>

            <IndicatorSelectorModal
                isOpen={isOpen}
                onClose={onClose}
                workingGroupPlanIdentifier={wgp.plan_identifier}
                workingGroupName={wgp.working_group}
                availableIndicators={wgp.available_indicators || []}
                prioritizedIndicatorIds={prioritizedIds}
                onIndicatorAdded={onIndicatorAdded}
            />

            {activeProgressSi && (
                <ProgressUpdateModal
                    isOpen={true}
                    onClose={() => setActiveProgressSi(null)}
                    workingGroupPlanIdentifier={wgp.plan_identifier}
                    yseIdentifier={activeProgressSi.progress && activeProgressSi.progress.yse_identifier}
                    indicatorLabel={`${activeProgressSi.composite_key} — ${activeProgressSi.success_indicator}`}
                    authorUniqueId={currentUserUniqueId}
                    onProgressAdded={async () => {
                        if (onProgressAdded) await onProgressAdded();
                    }}
                />
            )}

            <Modal isOpen={leadsModal.isOpen} onClose={leadsModal.onClose} size="2xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" color="teal.700">
                        Manage Group Leads — {wgp.working_group}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <PersonAssignmentSelector
                            assignedPersons={wgp.group_leads || []}
                            candidatePersons={individuals.filter((i) => i.active)}
                            onAssign={(personUniqueId) => assignGroupLead(wgp.plan_identifier, personUniqueId)}
                            onUnassign={(personUniqueId) => unassignGroupLead(wgp.plan_identifier, personUniqueId)}
                            afterChange={async () => {
                                if (onLeadsChanged) await onLeadsChanged();
                            }}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" colorScheme="teal" onClick={leadsModal.onClose}>Done</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default WorkingGroupPlan;
