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
    VStack,
    Wrap,
    WrapItem,
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
import Section from '../../graph_components/common/Section';
import WorkingGroupPlan from './WorkingGroupPlan';
import CampusPlanStatStrip from './CampusPlanStatStrip';

/**
 * Pick the WGP that matches `wgName` out of a campus plan's
 * `working_group_plans` array. Used to thread the same working group
 * across peer campuses for the cross-campus prioritized-indicator badges.
 */
function findWgpForGroup(plan, wgName) {
    if (!plan || !Array.isArray(plan.working_group_plans)) return null;
    return plan.working_group_plans.find((wgp) => wgp.working_group === wgName) || null;
}

function CampusPlanContainer() {
    const { currentCampus, currentAcademicYear, campuses } = useSettings();
    // UserContext is optional in tests — guard against missing provider.
    const userCtx = useContext(UserContext);
    const currentUserUniqueId = userCtx && userCtx.currentUser ? userCtx.currentUser.unique_id : null;
    const individuals = userCtx?.individuals || [];

    // Peers explicitly loaded by the user via the comparison selector. The
    // primary campus from SettingsContext is always loaded; peers are
    // opt-in additions for cross-campus indicator comparison.
    const [peerCampusAbbrevs, setPeerCampusAbbrevs] = useState([]);

    // All campuses we want plan data for. Order is stable: primary first.
    const allCampusAbbrevs = useMemo(() => {
        if (!currentCampus) return [];
        const peers = peerCampusAbbrevs.filter((a) => a && a !== currentCampus);
        return [currentCampus, ...peers];
    }, [currentCampus, peerCampusAbbrevs]);

    const { byAbbrev, refreshOne, createPlanFor } = useCampusPlans(allCampusAbbrevs, currentAcademicYear);

    const primaryState = byAbbrev[currentCampus] || { plan: null, loading: true, error: null, notFound: false, creating: false };
    const { plan, loading, error, notFound, creating } = primaryState;

    const sponsorsModal = useDisclosure();

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

    // Map of campus abbreviation → display name, from SettingsContext.
    const campusNameByAbbrev = useMemo(() => {
        const map = {};
        (campuses || []).forEach((c) => { if (c.abbreviation) map[c.abbreviation] = c.name; });
        return map;
    }, [campuses]);

    // Build the list of peer campus plans paired with their abbreviation
    // and human name, ready for downstream consumption.
    const peerCampusPlans = useMemo(() => {
        return peerCampusAbbrevs
            .filter((a) => a && a !== currentCampus)
            .map((abbrev) => ({
                campusAbbrev: abbrev,
                campusName: campusNameByAbbrev[abbrev] || abbrev,
                state: byAbbrev[abbrev] || { plan: null, loading: true, error: null },
            }));
    }, [peerCampusAbbrevs, currentCampus, byAbbrev, campusNameByAbbrev]);

    // Available campuses for the picker — every campus except the primary.
    const availablePeerOptions = useMemo(() => {
        return (campuses || []).filter((c) => c.abbreviation && c.abbreviation !== currentCampus);
    }, [campuses, currentCampus]);

    const handlePeerSelectionChange = (selected) => {
        // Chakra MenuOptionGroup passes the array of currently-checked values.
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
            <Box maxW="container.xl" mx="auto" px={6} py={6}>
                <Alert status="error" borderRadius="md" fontSize="sm">
                    <AlertIcon />
                    Error: {error}
                </Alert>
            </Box>
        );
    }

    if (notFound) {
        return (
            <Box maxW="container.xl" mx="auto" px={6} py={6}>
                <Card textAlign="center">
                    <Heading as="h1" size="lg" color="gray.800" mb={3}>
                        Campus Plan
                    </Heading>
                    <Text color="gray.600" mb={6}>
                        No plan exists yet for {currentCampus} in {currentAcademicYear}.
                    </Text>
                    <Button
                        colorScheme="teal"
                        onClick={handleCreatePrimary}
                        isLoading={creating}
                        loadingText="Creating…"
                    >
                        Create Campus Plan
                    </Button>
                </Card>
            </Box>
        );
    }

    if (!plan) return null;

    return (
        <Box maxW="container.xl" mx="auto" px={6} py={6}>
            <Heading as="h2" size="lg" color="gray.800" mb={4}>
                Campus Plan
            </Heading>

            <CampusPlanStatStrip plan={plan} />

            <VStack align="stretch" spacing={4}>
                {/* Identity card — campus · year · plan identifier. */}
                <Card>
                    <Text fontSize="sm" color="gray.600">
                        {plan.campus?.name || currentCampus} · {plan.academic_year} · <Text as="span" fontFamily="mono" color="gray.400">{plan.plan_identifier}</Text>
                    </Text>
                </Card>

                <Section
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
                                <Button size="xs" variant="ghost" onClick={() => setEditingSummary(false)} isDisabled={savingSummary}>
                                    Cancel
                                </Button>
                                <Button size="xs" colorScheme="teal" onClick={saveSummary} isLoading={savingSummary} loadingText="Saving…">
                                    Save
                                </Button>
                            </HStack>
                        </VStack>
                    ) : plan.executive_summary ? (
                        <Text color="gray.700" whiteSpace="pre-wrap">{plan.executive_summary}</Text>
                    ) : (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">No summary yet.</Text>
                    )}
                </Section>

                <Section
                    title="Executive Sponsors"
                    action={(
                        <Button size="xs" variant="outline" colorScheme="teal" onClick={sponsorsModal.onOpen}>
                            Manage
                        </Button>
                    )}
                >
                    {plan.executive_sponsors.length === 0 ? (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">None assigned.</Text>
                    ) : (
                        <VStack align="stretch" spacing={1}>
                            {plan.executive_sponsors.map((person) => (
                                <HStack key={person.unique_id} spacing={2}>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.800">{person.name}</Text>
                                    {person.title && (
                                        <Text fontSize="sm" color="gray.500">— {person.title}</Text>
                                    )}
                                </HStack>
                            ))}
                        </VStack>
                    )}
                </Section>

                <Section title="President's Report">
                    {plan.presidents_report ? (
                        <Link
                            href={plan.presidents_report.uri_path || plan.presidents_report.file_path}
                            color="teal.600"
                            fontSize="sm"
                            isExternal
                        >
                            {plan.presidents_report.name || 'View report'}
                        </Link>
                    ) : (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">
                            No president's report yet.
                        </Text>
                    )}
                </Section>

                {/* Cross-campus comparison selector. Loads peer campus plans
                    into the same view so each WG's Prioritized Indicators
                    block can show per-campus badges. */}
                <Card
                    title="Cross-campus comparison"
                    action={(
                        <Menu closeOnSelect={false}>
                            <MenuButton
                                as={Button}
                                size="sm"
                                variant="outline"
                                colorScheme="teal"
                                rightIcon={<ChevronDownIcon />}
                            >
                                Compare with…
                            </MenuButton>
                            <MenuList maxH="320px" overflowY="auto">
                                <MenuOptionGroup
                                    type="checkbox"
                                    value={peerCampusAbbrevs}
                                    onChange={handlePeerSelectionChange}
                                >
                                    {availablePeerOptions.map((c) => (
                                        <MenuItemOption key={c.abbreviation} value={c.abbreviation}>
                                            {c.name}
                                        </MenuItemOption>
                                    ))}
                                </MenuOptionGroup>
                            </MenuList>
                        </Menu>
                    )}
                >
                    <Text fontSize="xs" color="gray.500" mb={peerCampusPlans.length > 0 ? 3 : 0}>
                        Add peer campuses to compare prioritized indicators in each working group below.
                    </Text>
                    {peerCampusPlans.length > 0 && (
                        <Wrap spacing={2}>
                            {peerCampusPlans.map(({ campusAbbrev, campusName, state }) => {
                                const tagColor =
                                    state.loading ? 'gray' :
                                        state.error ? 'red' :
                                            state.notFound ? 'orange' : 'teal';
                                const tagText =
                                    state.loading ? `${campusName} — loading…` :
                                        state.error ? `${campusName} — error` :
                                            state.notFound ? `${campusName} — no plan yet` :
                                                campusName;
                                return (
                                    <WrapItem key={campusAbbrev}>
                                        <Tag colorScheme={tagColor} variant="subtle">
                                            <TagLabel>{tagText}</TagLabel>
                                            <TagCloseButton onClick={() => handleRemovePeer(campusAbbrev)} />
                                        </Tag>
                                    </WrapItem>
                                );
                            })}
                        </Wrap>
                    )}
                </Card>

                <Box>
                    <Heading as="h2" size="md" color="gray.800" mb={3}>
                        Working Group Plans
                    </Heading>
                    <VStack align="stretch" spacing={3}>
                        {plan.working_group_plans.map((wgp) => {
                            // For each peer campus, find the matching WGP for THIS working group
                            // (matched by working_group name, since composite identifiers differ
                            // across campuses). Pass only successfully-loaded peers; loading/error
                            // peers are surfaced in the comparison strip above.
                            const peerWorkingGroupPlans = peerCampusPlans
                                .map(({ campusAbbrev, campusName, state }) => {
                                    const peerWgp = findWgpForGroup(state.plan, wgp.working_group);
                                    return peerWgp ? { campusAbbrev, campusName, wgp: peerWgp, state } : null;
                                })
                                .filter(Boolean);

                            return (
                                <WorkingGroupPlan
                                    key={wgp.plan_identifier}
                                    wgp={wgp}
                                    campusAbbrev={currentCampus}
                                    campusName={plan.campus?.name || currentCampus}
                                    onIndicatorAdded={handleReloadPrimary}
                                    onProgressAdded={handleReloadPrimary}
                                    onLeadsChanged={handleReloadPrimary}
                                    currentUserUniqueId={currentUserUniqueId}
                                    peerWorkingGroupPlans={peerWorkingGroupPlans}
                                    onPeerIndicatorChanged={refreshOne}
                                />
                            );
                        })}
                    </VStack>
                </Box>
            </VStack>

            <Modal isOpen={sponsorsModal.isOpen} onClose={sponsorsModal.onClose} size="2xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" color="teal.700">
                        Manage Executive Sponsors
                    </ModalHeader>
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
