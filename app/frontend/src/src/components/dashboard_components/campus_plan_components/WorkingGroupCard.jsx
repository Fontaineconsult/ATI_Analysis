import React, { useContext, useId, useMemo, useState } from 'react';
import {
    Box, Button, Heading, HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
    ModalHeader, ModalOverlay, Text, useDisclosure,
} from '@chakra-ui/react';

import { UserContext } from '../../../context/UserContext';
import { assignGroupLead, unassignGroupLead } from '../../../services/api/post';
import PersonAssignmentSelector from '../../functional_components/PersonAssignmentSelector';
import IndicatorSelectorModal from './IndicatorSelectorModal';
import ProgressUpdateModal from './ProgressUpdateModal';
import IndicatorRow, { INDICATOR_GRID_COLUMNS } from './IndicatorRow';
import WgQueriesSection from './WgQueriesSection';
import WgMinutesSection from './WgMinutesSection';
import WgCommunitiesSection, { WgPeopleSection, campusMembersOf, communityMembersAt } from './WgCommunitiesSection';
import WgCardSection, { SectionButton } from './WgCardSection';
import CopyWorkingGroupPlanButton from './CopyWorkingGroupPlanButton';
import { getWgAccent, isAtRisk, isStale } from './campusPlanConfig';

const MICRO = {
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: 'gray.600',
    letterSpacing: 'wide',
    whiteSpace: 'nowrap',
};

/**
 * One working-group card in the single-page campus plan (design handoff v2 §5).
 * Header (dot + name + id), then four zones, each a WgCardSection with a
 * section header (accent bar, teal heading, summary): Leads & Members (WgPeopleSection) → Prioritized Indicators
 * (rows from IndicatorRow, filtered by the stat-strip filter, with cross-campus
 * peer chips) → Communities of Practice whose stakes land in this group
 * (WgCommunitiesSection) → Queries & Meeting Minutes. Renders for all four groups
 * including Steering — an empty table is fine.
 */
function WorkingGroupCard({
    wgp,
    campusAbbrev,
    campusName,
    indicatorFilter = 'all',
    currentUserUniqueId,
    peerWorkingGroupPlans = [],
    communities = [],
    members = [],
    onIndicatorAdded,
    onProgressAdded,
    onLeadsChanged,
}) {
    const addModal = useDisclosure();
    const leadsModal = useDisclosure();
    // The card title names each zone's landmark too, so four cards' "Leads & Members"
    // regions read as "Web, Leads & Members", "Instructional Materials, Leads & Members".
    const titleId = useId();
    const [activeProgressSi, setActiveProgressSi] = useState(null);
    const [expanded, setExpanded] = useState(() => new Set());
    const userCtx = useContext(UserContext);
    const individuals = userCtx?.individuals || [];

    const accent = getWgAccent(wgp?.working_group);
    const sis = wgp?.prioritized_success_indicators || [];
    const leads = wgp?.group_leads || [];

    // Peer campuses that prioritize each indicator (keyed by composite_key), with
    // that campus's current maturity — drives the per-row comparison chips (D2).
    const peersByKey = useMemo(() => {
        const map = new Map();
        for (const peer of peerWorkingGroupPlans) {
            const pw = peer?.wgp;
            for (const si of pw?.prioritized_success_indicators || []) {
                if (!si.composite_key) continue;
                if (!map.has(si.composite_key)) map.set(si.composite_key, []);
                map.get(si.composite_key).push({
                    abbrev: peer.campusAbbrev,
                    name: peer.campusName || peer.campusAbbrev,
                    status_level: si.status_level,
                });
            }
        }
        return map;
    }, [peerWorkingGroupPlans]);

    const visibleSis = sis.filter((si) => {
        if (indicatorFilter === 'risk') return isAtRisk(si);
        if (indicatorFilter === 'stale') return isStale(si);
        return true;
    });

    // One-line summaries for the section headers. Each counts exactly what the
    // section below it renders, using the same campus filters.
    const here = campusAbbrev ? campusAbbrev.toUpperCase() : 'this campus';
    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
    const campusMembers = campusMembersOf(leads, members, campusAbbrev);
    const peopleSummary = `${plural(leads.length, 'lead')} · ${plural(campusMembers.length, 'member')} at ${here}`;
    const atRiskCount = sis.filter(isAtRisk).length;
    const staleCount = sis.filter(isStale).length;
    const indicatorSummary = [
        atRiskCount ? `${atRiskCount} at risk` : null,
        staleCount ? `${staleCount} stale` : null,
    ].filter(Boolean).join(' · ') || null;
    const communitiesHere = communities.map((c) => ({ ...c, members: communityMembersAt(c, campusAbbrev) }));
    const staffedCount = communitiesHere.filter((c) => c.members.length > 0).length;
    const communitySummary = communities.length
        ? `${staffedCount} with people at ${here} · ${communities.length - staffedCount} without`
        : null;

    // What the Copy table button puts on the clipboard: the card as shown.
    const report = {
        workingGroup: wgp?.working_group,
        planIdentifier: wgp?.plan_identifier,
        campusName,
        leads,
        members: campusMembers,
        indicators: sis,
        communities: communitiesHere,
    };

    const toggleExpand = (key) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    if (!wgp) return null;

    return (
        <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="sm"
            borderTopWidth="3px"
            borderTopColor={accent}
            mb={4}
        >
            {/* Header */}
            <HStack px={5} py={4} spacing={3} flexWrap="wrap">
                <Box w="9px" h="9px" borderRadius="full" bg={accent} flexShrink={0} />
                <Heading as="h3" id={titleId} fontSize="17px" fontWeight="bold" color="gray.800">{wgp.working_group}</Heading>
                <Text fontFamily="mono" fontSize="11px" color="gray.600" whiteSpace="nowrap">{wgp.plan_identifier}</Text>
                <Box flex="1" minW="12px" />
                <CopyWorkingGroupPlanButton report={report} />
            </HStack>

            {/* 1. People: leads, then this campus's members */}
            <WgCardSection
                labelPrefixId={titleId}
                title="Leads & Members"
                summary={peopleSummary}
                accentColor={accent}
                action={<SectionButton onClick={leadsModal.onOpen}>Manage leads</SectionButton>}
            >
                <WgPeopleSection leads={leads} members={members} campusAbbrev={campusAbbrev} />
            </WgCardSection>

            {/* 2. Prioritized indicators */}
            <WgCardSection
                labelPrefixId={titleId}
                title="Prioritized Indicators"
                count={sis.length}
                summary={indicatorSummary}
                accentColor={accent}
                action={<SectionButton onClick={addModal.onOpen}>+ Add Indicator</SectionButton>}
            >
            {/* Table header */}
            <Box
                display="grid"
                gridTemplateColumns={INDICATOR_GRID_COLUMNS}
                gap="10px"
                px={5}
                py={1.5}
                borderBottomWidth="1px"
                borderColor="gray.200"
            >
                <Text {...MICRO}>Key</Text>
                <Text {...MICRO}>Success indicator</Text>
                <Text {...MICRO}>Maturity (prev → curr)</Text>
                <Text {...MICRO}>Trajectory</Text>
                <Text {...MICRO}>Plans</Text>
                <Text {...MICRO}>Upd</Text>
                <Text {...MICRO} textAlign="right">Actions</Text>
            </Box>

            {sis.length === 0 ? (
                <Box px={5} py={4}>
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">No indicators prioritized yet.</Text>
                </Box>
            ) : visibleSis.length === 0 ? (
                <Box px={5} py={4}>
                    <Text fontSize="sm" color="gray.600" fontStyle="italic">No indicators match this filter.</Text>
                </Box>
            ) : (
                visibleSis.map((si) => (
                    <IndicatorRow
                        key={si.composite_key || si.unique_id}
                        si={si}
                        peers={peersByKey.get(si.composite_key) || []}
                        campusAbbrev={campusAbbrev}
                        workingGroupPlanIdentifier={wgp.plan_identifier}
                        currentUserUniqueId={currentUserUniqueId}
                        expanded={expanded.has(si.composite_key || si.unique_id)}
                        onToggleExpand={() => toggleExpand(si.composite_key || si.unique_id)}
                        onLog={(e) => { if (e) e.stopPropagation(); setActiveProgressSi(si); }}
                        onProgressAdded={onProgressAdded}
                    />
                ))
            )}
            </WgCardSection>

            {/* 3. Communities of practice whose stakes land in this group */}
            <WgCardSection
                labelPrefixId={titleId}
                title="Communities of Practice"
                count={communities.length}
                summary={communitySummary}
                accentColor={accent}
            >
                <WgCommunitiesSection communities={communities} accentColor={accent} campusAbbrev={campusAbbrev} />
            </WgCardSection>

            {/* 4. Queries + Meeting Minutes */}
            <WgCardSection title="Queries & Meeting Minutes" accentColor={accent} labelPrefixId={titleId}>
                <HStack px={5} py={4} align="flex-start" spacing={4}>
                    <WgQueriesSection
                        workingGroupPlanIdentifier={wgp.plan_identifier}
                        workingGroupName={wgp.working_group}
                        accentColor={accent}
                    />
                    <WgMinutesSection
                        workingGroupPlanIdentifier={wgp.plan_identifier}
                        workingGroupName={wgp.working_group}
                        accentColor={accent}
                    />
                </HStack>
            </WgCardSection>

            {/* Modals */}
            <IndicatorSelectorModal
                isOpen={addModal.isOpen}
                onClose={addModal.onClose}
                workingGroupPlanIdentifier={wgp.plan_identifier}
                workingGroupName={wgp.working_group}
                availableIndicators={wgp.available_indicators || []}
                prioritizedIndicatorIds={sis.map((si) => si.unique_id)}
                onIndicatorAdded={onIndicatorAdded}
            />

            {activeProgressSi && (
                <ProgressUpdateModal
                    isOpen
                    onClose={() => setActiveProgressSi(null)}
                    workingGroupPlanIdentifier={wgp.plan_identifier}
                    yseIdentifier={activeProgressSi.progress && activeProgressSi.progress.yse_identifier}
                    indicatorLabel={`${activeProgressSi.composite_key} — ${activeProgressSi.success_indicator}`}
                    authorUniqueId={currentUserUniqueId}
                    onProgressAdded={async () => { if (onProgressAdded) await onProgressAdded(); }}
                />
            )}

            <Modal isOpen={leadsModal.isOpen} onClose={leadsModal.onClose} size="2xl" scrollBehavior="inside">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="md" color="teal.700">Manage Group Leads — {wgp.working_group}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={4}>
                        <PersonAssignmentSelector
                            assignedPersons={leads}
                            candidatePersons={individuals.filter((i) => i.active || i.non_committee_member_active)}
                            onAssign={(personUniqueId) => assignGroupLead(wgp.plan_identifier, personUniqueId)}
                            onUnassign={(personUniqueId) => unassignGroupLead(wgp.plan_identifier, personUniqueId)}
                            afterChange={async () => { if (onLeadsChanged) await onLeadsChanged(); }}
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

export default WorkingGroupCard;
