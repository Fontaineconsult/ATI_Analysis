import React, { useContext, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Flex,
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
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Tooltip,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';

import { UserContext } from '../../../context/UserContext';
import { getUrlFromCompositeKey, getGoalViewUrlFromCompositeKey } from '../../../services/utils/tools';
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
import { splitCardOuter, splitCardTop, splitCardBottom } from '../../graph_components/common/splitCardStyles';
import QueriesPanel from '../query_components/QueriesPanel';
import MeetingMinutesPanel from '../meeting_minutes_components/MeetingMinutesPanel';
import { getPlanStatusColorScheme, getPlanStatusLabel } from '../../../styles/planStatusColors';
import { getWorkingGroupIdentity } from '../../../styles/workingGroupIdentity';
import {
    PLAN_STATUS_ORDER,
    getTrajectoryColorScheme,
    getTrajectoryLabel,
} from './campusPlanConfig';

function TrajectoryBadge({ trajectory }) {
    if (!trajectory) return null;
    return (
        <Badge
            colorScheme={getTrajectoryColorScheme(trajectory)}
            fontSize="xs"
            textTransform="none"
        >
            {getTrajectoryLabel(trajectory)}
        </Badge>
    );
}

function EmptyText({ children }) {
    return (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">{children}</Text>
    );
}

/**
 * Renders a single working group's slice of a CampusPlan as an
 * identity-accented card. The card top border, identity dot, leads-bar tint, and
 * sub-tab underline all carry the working group's brand accent (Web = blue,
 * Instructional Materials = purple, Procurement = coral — see
 * styles/workingGroupIdentity.js and design-sense §2). Action buttons stay brand
 * teal, matching GoalNavigator/SubNavbar (accent = identity chrome, not actions).
 *
 * Layout: an identity strip (dot + name + plan_identifier), a full-width Group
 * Leads bar, then Chakra line sub-tabs — Indicators · Plans · Queries · Minutes.
 * The sub-tabs are `isLazy`, so the self-fetching Queries / Meeting-Minutes
 * panels load only when their tab is first opened.
 *
 * Reusable across all three working group views. The shape it expects is the WGP
 * object the /campus-plans/<campus>/<year> endpoint returns under
 * working_group_plans.
 */
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
    const [activeProgressSi, setActiveProgressSi] = useState(null);
    const [togglingKey, setTogglingKey] = useState(null); // `${campusAbbrev}|${compositeKey}` while adding
    const toast = useToast();
    const userCtx = useContext(UserContext);
    const individuals = userCtx?.individuals || [];

    if (!wgp) return null;

    // Working-group identity: accent chrome + the matching Chakra colorScheme for
    // the sub-tab underline. Keyed by display name (campus-plan data is name-keyed).
    const identity = getWorkingGroupIdentity(wgp.working_group);
    const accent = identity.accent;
    const wgColorScheme = identity.colorScheme;

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

    // The cross-campus toggle row only earns its space in comparison mode; with
    // just the primary campus loaded it would show a single redundant self-button.
    const showCampusBadges = allCampusEntries.length > 1;

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
        const { campusAbbrev: targetAbbrev, campusName: targetName, wgp: targetWgp, isPrimary } = campusEntry;
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
            toast({
                title: alreadyPrioritized
                    ? `Removed ${entry.composite_key} from ${targetName}'s plan`
                    : `Prioritized ${entry.composite_key} for ${targetName}`,
                status: 'success',
                duration: 1800,
                isClosable: true,
            });
        } catch (err) {
            console.error('Failed to toggle prioritized indicator', err);
            toast({
                title: 'Could not update prioritized indicator',
                description: 'Your change was not saved. Please try again.',
                status: 'error',
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setTogglingKey(null);
        }
    };

    // ---- Sub-tab: Prioritized Indicators ----
    const indicatorsPanel = (
        <>
            <Flex justify="flex-end" mb={3}>
                <Button size="xs" variant="outline" colorScheme="teal" onClick={onOpen}>
                    + Add Indicator
                </Button>
            </Flex>
            {unionIndicators.length === 0 ? (
                <EmptyText>None selected.</EmptyText>
            ) : (
                <VStack align="stretch" spacing={3}>
                    {unionIndicators.map((entry) => {
                        const si = entry.primarySi;
                        const isPrimaryPrioritized = entry.prioritizedByAbbrevs.has(campusAbbrev);
                        const progress = si?.progress || { yse_identifier: null, update_count: 0, updates: [] };
                        const updates = progress.updates || [];
                        const trajectory = updates.length > 0 ? updates[0].trajectory : null;
                        const canLogProgress = !!progress.yse_identifier;

                        return (
                            <Box
                                key={entry.composite_key}
                                {...splitCardOuter}
                                opacity={isPrimaryPrioritized ? 1 : 0.85}
                            >
                                {/* Top band: identifier link · status · row actions. */}
                                <Box {...splitCardTop}>
                                    <Flex align="center" gap={2} flexWrap="wrap">
                                        <HStack spacing={2} flex="1" minW="0">
                                            {campusAbbrev ? (
                                                <Link
                                                    as={RouterLink}
                                                    to={getGoalViewUrlFromCompositeKey(entry.composite_key, campusAbbrev)}
                                                    fontFamily="mono"
                                                    fontSize="xs"
                                                    fontWeight="semibold"
                                                    color="teal.700"
                                                    whiteSpace="nowrap"
                                                    _hover={{ textDecoration: 'underline' }}
                                                    _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', borderRadius: 'sm' }}
                                                    title={`Open the ${entry.composite_key} success indicator`}
                                                >
                                                    {entry.composite_key}
                                                </Link>
                                            ) : (
                                                <Text fontFamily="mono" fontSize="xs" fontWeight="semibold" color="gray.700" whiteSpace="nowrap">
                                                    {entry.composite_key}
                                                </Text>
                                            )}
                                            {isPrimaryPrioritized ? (
                                                <>
                                                    <StatusProgression
                                                        previousStatusLevel={si.previous_status_level}
                                                        currentStatusLevel={si.status_level}
                                                    />
                                                    <TrajectoryBadge trajectory={trajectory} />
                                                </>
                                            ) : (
                                                <Text fontSize="xs" color="gray.400" fontStyle="italic" whiteSpace="nowrap">
                                                    Not prioritized here
                                                </Text>
                                            )}
                                        </HStack>
                                        {isPrimaryPrioritized && (
                                            <HStack spacing={1} flexShrink={0}>
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
                                            </HStack>
                                        )}
                                    </Flex>
                                </Box>

                                {/* Bottom: the indicator name + cross-campus + progress, full width. */}
                                <Box {...splitCardBottom}>
                                    <Text fontSize="sm" color="gray.800" fontWeight="medium">
                                        {entry.success_indicator}
                                    </Text>

                                    {showCampusBadges && (
                                        <Box mt={2}>
                                            <HStack spacing={1} flexWrap="wrap">
                                                {allCampusEntries.map((c) => {
                                                    const has = entry.prioritizedByAbbrevs.has(c.campusAbbrev);
                                                    const tkey = `${c.campusAbbrev}|${entry.composite_key}`;
                                                    const isBusy = togglingKey === tkey;
                                                    const label = has
                                                        ? `Prioritized by ${c.campusName} — click to remove`
                                                        : `Click to prioritize for ${c.campusName}`;
                                                    return (
                                                        <Button
                                                            key={c.campusAbbrev}
                                                            size="xs"
                                                            variant={has ? 'solid' : 'outline'}
                                                            colorScheme={has ? 'teal' : 'gray'}
                                                            onClick={() => handleToggleCampusPriority(entry, c)}
                                                            isLoading={isBusy}
                                                            isDisabled={isBusy}
                                                            aria-pressed={has}
                                                            aria-label={label}
                                                            title={label}
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
                                        </Box>
                                    )}

                                    {isPrimaryPrioritized && updates.length > 0 && (
                                        <Box
                                            mt={3}
                                            pt={3}
                                            borderTopWidth="1px"
                                            borderTopColor="gray.100"
                                        >
                                            <VStack align="stretch" spacing={1}>
                                                {updates.map((upd, idx) => (
                                                    <HStack key={idx} align="baseline" spacing={2} fontSize="xs" flexWrap="wrap">
                                                        {upd.update_date && (
                                                            <Text fontFamily="mono" color="gray.500" whiteSpace="nowrap">
                                                                {upd.update_date}
                                                            </Text>
                                                        )}
                                                        {upd.trajectory && (
                                                            <Badge
                                                                colorScheme={getTrajectoryColorScheme(upd.trajectory)}
                                                                fontSize="2xs"
                                                                textTransform="none"
                                                            >
                                                                {getTrajectoryLabel(upd.trajectory)}
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
                            </Box>
                        );
                    })}
                </VStack>
            )}
        </>
    );

    // ---- Sub-tab: Plans ----
    const plansPanel = wgp.plans.length === 0 ? (
        <EmptyText>No campus-plan plans yet.</EmptyText>
    ) : (
        <VStack align="stretch" spacing={2}>
            <HStack spacing={2} flexWrap="wrap" mb={1}>
                {(() => {
                    const counts = wgp.plans.reduce((acc, plan) => {
                        const key = plan.abandoned ? 'Abandoned' : (plan.plan_status || 'Not Started');
                        acc[key] = (acc[key] || 0) + 1;
                        return acc;
                    }, {});
                    return PLAN_STATUS_ORDER
                        .filter((status) => counts[status])
                        .map((status) => (
                            <Badge key={status} colorScheme={getPlanStatusColorScheme(status)} fontSize="xs">
                                {counts[status]} {status}
                            </Badge>
                        ));
                })()}
            </HStack>

            {wgp.plans.map((plan) => {
                const planHref = campusAbbrev && plan.unique_id
                    ? `/${campusAbbrev}/ati-explorer/plans/${plan.unique_id}`
                    : null;
                const accentColor = plan.abandoned ? 'red.300' : 'teal.400';
                const statusLabel = getPlanStatusLabel(plan);

                const card = (
                    <Box
                        {...splitCardOuter}
                        borderLeftWidth="3px"
                        borderLeftColor={accentColor}
                        transition="box-shadow 0.15s"
                        _hover={planHref ? { boxShadow: 'md' } : undefined}
                    >
                        {/* Top band: status + year. */}
                        <Box {...splitCardTop}>
                            <HStack spacing={2} flexWrap="wrap">
                                <Badge colorScheme={getPlanStatusColorScheme(statusLabel)} fontSize="2xs">
                                    {statusLabel}
                                </Badge>
                                {plan.academic_year && (
                                    <Text fontSize="xs" color="gray.500" fontFamily="mono" whiteSpace="nowrap">
                                        {plan.academic_year}
                                        {plan.completed_year && ` · completed ${plan.completed_year}`}
                                    </Text>
                                )}
                            </HStack>
                        </Box>
                        {/* Bottom: plan name. */}
                        <Box {...splitCardBottom}>
                            <Text fontSize="sm" fontWeight="medium" color="gray.800" noOfLines={2}>
                                {plan.name || plan.description}
                            </Text>
                        </Box>
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
    );

    return (
        <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderTopWidth="3px"
            borderTopColor={accent}
            borderRadius="lg"
            boxShadow="sm"
            p={5}
            textAlign="left"
        >
            {/* Identity strip: dot + working group name + plan identifier. */}
            <Flex justify="space-between" align="center" gap={2} flexWrap="wrap" mb={4}>
                <Heading as="h3" size="sm" color="teal.700">
                    <Box
                        as="span"
                        display="inline-block"
                        w="9px"
                        h="9px"
                        borderRadius="full"
                        bg={accent}
                        mr={2}
                        verticalAlign="middle"
                        aria-hidden="true"
                    />
                    {wgp.working_group}
                </Heading>
                <Text fontSize="xs" color="gray.400" fontFamily="mono">
                    {wgp.plan_identifier}
                </Text>
            </Flex>

            {/* Group Leads — full-width identity-tinted bar. */}
            <Flex
                justify="space-between"
                align="center"
                gap={3}
                bg={identity.accentTint}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                px={3}
                py={2}
                mb={4}
                flexWrap="wrap"
            >
                <Box minW="0">
                    <Text
                        as="span"
                        fontSize="2xs"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        color="gray.500"
                        fontWeight="bold"
                        mr={2}
                    >
                        Group Leads
                    </Text>
                    {wgp.group_leads.length === 0 ? (
                        <Text as="span" fontSize="sm" color="gray.500" fontStyle="italic">
                            No leads assigned.
                        </Text>
                    ) : (
                        wgp.group_leads.map((person, i) => (
                            <Text as="span" key={person.unique_id} fontSize="sm" color="gray.800">
                                {i > 0 && <Text as="span" color="gray.400"> · </Text>}
                                <Text as="span" fontWeight="medium">{person.name}</Text>
                                {person.title && (
                                    <Text as="span" color="gray.500"> — {person.title}</Text>
                                )}
                            </Text>
                        ))
                    )}
                </Box>
                <Button size="xs" variant="outline" colorScheme="teal" onClick={leadsModal.onOpen} flexShrink={0}>
                    Manage
                </Button>
            </Flex>

            {/* Sub-tabs: Indicators · Plans · Queries · Minutes. isLazy so the
                self-fetching Queries / Minutes panels load only when first opened. */}
            <Tabs variant="line" colorScheme={wgColorScheme} isLazy>
                <TabList>
                    <Tab fontSize="sm">
                        Indicators{unionIndicators.length > 0 ? ` (${unionIndicators.length})` : ''}
                    </Tab>
                    <Tab fontSize="sm">
                        Plans{wgp.plans.length > 0 ? ` (${wgp.plans.length})` : ''}
                    </Tab>
                    <Tab fontSize="sm">Queries</Tab>
                    <Tab fontSize="sm">Minutes</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel px={0}>{indicatorsPanel}</TabPanel>
                    <TabPanel px={0}>{plansPanel}</TabPanel>
                    <TabPanel px={0}>
                        <QueriesPanel workingGroupPlanIdentifier={wgp.plan_identifier} />
                    </TabPanel>
                    <TabPanel px={0}>
                        <MeetingMinutesPanel workingGroupPlanIdentifier={wgp.plan_identifier} />
                    </TabPanel>
                </TabPanels>
            </Tabs>

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
                            candidatePersons={individuals.filter((i) => i.active || i.non_committee_member_active)}
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
