import React, { useContext, useMemo, useState } from 'react';
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Heading,
    HStack,
    Link,
    Menu,
    MenuButton,
    MenuItemOption,
    MenuList,
    MenuOptionGroup,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Tag,
    TagCloseButton,
    TagLabel,
    Text,
    Textarea,
    useDisclosure,
    useToast,
    VStack,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';

import { useSettings } from '../../../context/SettingsContext';
import { UserContext } from '../../../context/UserContext';
import { useCampusPlans } from '../../../hooks/useCampusPlans';
import {
    assignExecutiveSponsor,
    unassignExecutiveSponsor,
    updateCampusPlanSummary,
} from '../../../services/api/post';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import Card from '../../graph_components/common/Card';
import CampusPlanStatStrip from './CampusPlanStatStrip';
import WorkingGroupCard from './WorkingGroupCard';
import { orderWorkingGroupPlans } from './campusPlanConfig';

/** Initials for a sponsor avatar (first + last word). */
function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function SponsorAvatar({ name }) {
    return (
        <Box
            w="26px"
            h="26px"
            borderRadius="full"
            bg="teal.50"
            color="teal.800"
            fontSize="10px"
            fontWeight="bold"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
        >
            {initials(name)}
        </Box>
    );
}

/**
 * Pick the WGP that matches `wgName` out of a campus plan's working_group_plans
 * array — used to thread the same working group across peer campuses.
 */
function findWgpForGroup(plan, wgName) {
    if (!plan || !Array.isArray(plan.working_group_plans)) return null;
    return plan.working_group_plans.find((wgp) => wgp.working_group === wgName) || null;
}

/**
 * Campus Plan — single-page operational dashboard (design handoff v2). Stat strip
 * (with row filters) → 3-card profile band → cross-campus row → four working-group
 * cards (Steering, Web, Instructional Materials, Procurement).
 */
function CampusPlanContainer() {
    const { currentCampus, currentAcademicYear, campuses } = useSettings();
    const userCtx = useContext(UserContext);
    const currentUserUniqueId = userCtx && userCtx.currentUser ? userCtx.currentUser.unique_id : null;
    const individuals = userCtx?.individuals || [];
    const toast = useToast();

    // Peers explicitly loaded via the comparison selector. Primary is always loaded.
    const [peerCampusAbbrevs, setPeerCampusAbbrevs] = useState([]);

    const allCampusAbbrevs = useMemo(() => {
        if (!currentCampus) return [];
        const peers = peerCampusAbbrevs.filter((a) => a && a !== currentCampus);
        return [currentCampus, ...peers];
    }, [currentCampus, peerCampusAbbrevs]);

    const { byAbbrev, refreshOne, createPlanFor } = useCampusPlans(allCampusAbbrevs, currentAcademicYear);

    const primaryState = byAbbrev[currentCampus] || { plan: null, loading: true, error: null, notFound: false, creating: false };
    const { plan, loading, error, notFound, creating } = primaryState;

    const sponsorsModal = useDisclosure();

    // Stat-strip row filter: 'all' | 'risk' | 'stale'.
    const [indicatorFilter, setIndicatorFilter] = useState('all');

    // Inline executive-summary editor state.
    const [editingSummary, setEditingSummary] = useState(false);
    const [summaryDraft, setSummaryDraft] = useState('');
    const [savingSummary, setSavingSummary] = useState(false);

    const handleReloadPrimary = () => refreshOne(currentCampus);
    const handleCreatePrimary = () => createPlanFor(currentCampus);

    const openSummaryEditor = () => {
        setSummaryDraft(plan?.executive_summary || '');
        setEditingSummary(true);
    };
    const saveSummary = async () => {
        setSavingSummary(true);
        try {
            await updateCampusPlanSummary(plan.plan_identifier, summaryDraft);
            setEditingSummary(false);
            await handleReloadPrimary();
        } catch (err) {
            console.error('Failed to save executive summary', err);
        } finally {
            setSavingSummary(false);
        }
    };

    const campusNameByAbbrev = useMemo(() => {
        const map = {};
        (campuses || []).forEach((c) => { if (c.abbreviation) map[c.abbreviation] = c.name; });
        return map;
    }, [campuses]);

    const peerCampusPlans = useMemo(() => {
        return peerCampusAbbrevs
            .filter((a) => a && a !== currentCampus)
            .map((abbrev) => ({
                campusAbbrev: abbrev,
                campusName: campusNameByAbbrev[abbrev] || abbrev,
                state: byAbbrev[abbrev] || { plan: null, loading: true, error: null },
            }));
    }, [peerCampusAbbrevs, currentCampus, byAbbrev, campusNameByAbbrev]);

    const availablePeerOptions = useMemo(() => {
        return (campuses || []).filter((c) => c.abbreviation && c.abbreviation !== currentCampus);
    }, [campuses, currentCampus]);

    const handlePeerSelectionChange = (selected) => {
        const arr = Array.isArray(selected) ? selected : (selected ? [selected] : []);
        setPeerCampusAbbrevs(arr.filter((a) => a !== currentCampus));
    };
    const handleRemovePeer = (abbrev) => {
        setPeerCampusAbbrevs((prev) => prev.filter((a) => a !== abbrev));
    };

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minH="400px">
                <Spinner size="xl" color="teal.500" thickness="3px" />
                <Text mt={4} color="gray.600" fontSize="sm">Loading campus plan…</Text>
            </Box>
        );
    }

    if (error) {
        return (
            <Box maxW="1280px" mx="auto" px={6} py={6}>
                <Alert status="error" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    Error: {error}
                </Alert>
            </Box>
        );
    }

    if (notFound) {
        return (
            <Box maxW="1280px" mx="auto" px={6} py={6}>
                <Card textAlign="center">
                    <Heading as="h1" size="lg" color="gray.800" mb={3}>Campus Plan</Heading>
                    <Text color="gray.600" mb={6}>
                        No plan exists yet for {currentCampus} in {currentAcademicYear}.
                    </Text>
                    <Button colorScheme="teal" onClick={handleCreatePrimary} isLoading={creating} loadingText="Creating…">
                        Create Campus Plan
                    </Button>
                </Card>
            </Box>
        );
    }

    if (!plan) return null;

    const presidentsReport = plan.presidents_report;
    const orderedWgps = orderWorkingGroupPlans(plan.working_group_plans);

    return (
        <Box maxW="1280px" mx="auto" px={6} py={6} pb={14} bg="gray.50">
            {/* Title row */}
            <HStack align="center" spacing={3} mb={4}>
                <Heading as="h2" size="lg" color="gray.800">Campus Plan</Heading>
                <Box flex="1" />
                <Text fontSize="sm" color="gray.600">
                    {plan.campus?.name || currentCampus} · {plan.academic_year} ·{' '}
                    <Text as="span" fontFamily="mono" color="gray.600" whiteSpace="nowrap">{plan.plan_identifier}</Text>
                </Text>
            </HStack>

            <CampusPlanStatStrip plan={plan} activeFilter={indicatorFilter} onFilterChange={setIndicatorFilter} />

            {/* Profile band */}
            <HStack align="stretch" spacing={4} mb={4}>
                <Card
                    flex="2"
                    title="Executive Summary"
                    action={!editingSummary && (
                        <Button size="xs" variant="outline" colorScheme="teal" onClick={openSummaryEditor}>
                            {plan.executive_summary ? 'Edit' : 'Add'}
                        </Button>
                    )}
                >
                    {editingSummary ? (
                        <VStack align="stretch" spacing={2}>
                            <Textarea
                                value={summaryDraft}
                                onChange={(e) => setSummaryDraft(e.target.value)}
                                size="sm"
                                rows={4}
                                placeholder="Plan-level narrative for this campus and year…"
                            />
                            <HStack justify="flex-end" spacing={2}>
                                <Button size="xs" variant="ghost" onClick={() => setEditingSummary(false)} isDisabled={savingSummary}>Cancel</Button>
                                <Button size="xs" colorScheme="teal" onClick={saveSummary} isLoading={savingSummary} loadingText="Saving…">Save</Button>
                            </HStack>
                        </VStack>
                    ) : plan.executive_summary ? (
                        <Text color="gray.700" whiteSpace="pre-wrap" lineHeight="1.55">{plan.executive_summary}</Text>
                    ) : (
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">No summary yet.</Text>
                    )}
                </Card>

                <Card
                    flex="1"
                    title="Executive Sponsors"
                    action={(
                        <Button size="xs" variant="outline" colorScheme="teal" onClick={sponsorsModal.onOpen}>Manage</Button>
                    )}
                >
                    {plan.executive_sponsors.length === 0 ? (
                        <Text fontSize="sm" color="gray.600" fontStyle="italic">None assigned.</Text>
                    ) : (
                        <VStack align="stretch" spacing={3}>
                            {plan.executive_sponsors.map((person) => (
                                <Box key={person.unique_id}>
                                    <HStack spacing={2.5}>
                                        <SponsorAvatar name={person.name} />
                                        <Text fontSize="sm" fontWeight="medium" color="gray.800">{person.name}</Text>
                                    </HStack>
                                    {person.title && (
                                        <Text fontSize="xs" color="gray.600" pl="36px">{person.title}</Text>
                                    )}
                                </Box>
                            ))}
                        </VStack>
                    )}
                </Card>

                <Card flex="1" title="President's Report">
                    {presidentsReport ? (
                        <Link
                            href={presidentsReport.uri_path || presidentsReport.file_path}
                            color="teal.600"
                            fontSize="sm"
                            isExternal
                        >
                            {presidentsReport.name || 'View report'}
                        </Link>
                    ) : (
                        <VStack align="stretch" spacing={2}>
                            <Alert status="error" borderRadius="md" fontSize="sm" py={2}>
                                <AlertIcon />
                                Not uploaded for {plan.academic_year}.
                            </Alert>
                            <Button
                                size="sm"
                                variant="outline"
                                colorScheme="teal"
                                alignSelf="flex-start"
                                onClick={() => toast({
                                    title: "President's report upload isn't wired up yet.",
                                    status: 'info', duration: 3000, isClosable: true,
                                })}
                            >
                                Upload report
                            </Button>
                        </VStack>
                    )}
                </Card>
            </HStack>

            {/* Cross-campus comparison */}
            <Card mb={4}>
                <HStack align="center" spacing={3} flexWrap="wrap">
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="teal.600" letterSpacing="wide" whiteSpace="nowrap">
                        Cross-campus comparison
                    </Text>
                    <Text fontSize="xs" color="gray.600" flex="1" minW="180px">
                        Add peer campuses to compare prioritized indicators in each working group below.
                    </Text>
                    {peerCampusPlans.map(({ campusAbbrev, campusName, state }) => {
                        const tagColor = state.loading ? 'gray' : state.error ? 'red' : state.notFound ? 'orange' : 'teal';
                        const tagText = state.loading ? `${campusName} — loading…`
                            : state.error ? `${campusName} — error`
                                : state.notFound ? `${campusName} — no plan yet`
                                    : campusName;
                        return (
                            <Tag key={campusAbbrev} colorScheme={tagColor} variant="subtle">
                                <TagLabel>{tagText}</TagLabel>
                                <TagCloseButton onClick={() => handleRemovePeer(campusAbbrev)} />
                            </Tag>
                        );
                    })}
                    <Menu closeOnSelect={false}>
                        <MenuButton as={Button} size="sm" variant="outline" colorScheme="teal" rightIcon={<ChevronDownIcon />}>
                            Compare with…
                        </MenuButton>
                        <MenuList maxH="320px" overflowY="auto">
                            <MenuOptionGroup type="checkbox" value={peerCampusAbbrevs} onChange={handlePeerSelectionChange}>
                                {availablePeerOptions.map((c) => (
                                    <MenuItemOption key={c.abbreviation} value={c.abbreviation}>{c.name}</MenuItemOption>
                                ))}
                            </MenuOptionGroup>
                        </MenuList>
                    </Menu>
                </HStack>
            </Card>

            {/* Working group cards */}
            {orderedWgps.map((wgp) => {
                const peerWorkingGroupPlans = peerCampusPlans
                    .map(({ campusAbbrev, campusName, state }) => {
                        const peerWgp = findWgpForGroup(state.plan, wgp.working_group);
                        return peerWgp ? { campusAbbrev, campusName, wgp: peerWgp, state } : null;
                    })
                    .filter(Boolean);

                return (
                    <WorkingGroupCard
                        key={wgp.plan_identifier}
                        wgp={wgp}
                        campusAbbrev={currentCampus}
                        campusName={plan.campus?.name || currentCampus}
                        indicatorFilter={indicatorFilter}
                        currentUserUniqueId={currentUserUniqueId}
                        peerWorkingGroupPlans={peerWorkingGroupPlans}
                        onIndicatorAdded={handleReloadPrimary}
                        onProgressAdded={handleReloadPrimary}
                        onLeadsChanged={handleReloadPrimary}
                    />
                );
            })}

            <Modal isOpen={sponsorsModal.isOpen} onClose={sponsorsModal.onClose} size="2xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" color="teal.700">Manage Executive Sponsors</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <PersonAssignmentSelector
                            assignedPersons={plan.executive_sponsors || []}
                            candidatePersons={individuals.filter((i) => i.active || i.non_committee_member_active)}
                            onAssign={(personUniqueId) => assignExecutiveSponsor(plan.plan_identifier, personUniqueId)}
                            onUnassign={(personUniqueId) => unassignExecutiveSponsor(plan.plan_identifier, personUniqueId)}
                            afterChange={handleReloadPrimary}
                        />
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" colorScheme="teal" onClick={sponsorsModal.onClose}>Done</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default CampusPlanContainer;
