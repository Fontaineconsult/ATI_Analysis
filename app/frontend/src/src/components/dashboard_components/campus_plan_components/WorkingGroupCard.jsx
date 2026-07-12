import React, { useContext, useMemo, useState } from 'react';
import {
    Box, Button, HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter,
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
import { getWgAccent, isAtRisk, isStale } from './campusPlanConfig';

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
}

function Avatar({ name, size = '22px' }) {
    return (
        <Box
            w={size}
            h={size}
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

const MICRO = {
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: 'gray.500',
    letterSpacing: 'wide',
    whiteSpace: 'nowrap',
};

/**
 * One working-group card in the single-page campus plan (design handoff v2 §5).
 * Header (dot + name + id + leads + Manage) → prioritized-indicator table (rows
 * from IndicatorRow, filtered by the stat-strip filter, with cross-campus peer
 * chips) → footer (Queries + Meeting Minutes). Renders for all four groups
 * including Steering — an empty table is fine.
 */
function WorkingGroupCard({
    wgp,
    campusAbbrev,
    campusName,
    indicatorFilter = 'all',
    currentUserUniqueId,
    peerWorkingGroupPlans = [],
    onIndicatorAdded,
    onProgressAdded,
    onLeadsChanged,
}) {
    const addModal = useDisclosure();
    const leadsModal = useDisclosure();
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
            <HStack px={5} py={4} spacing={3} borderBottomWidth="1px" borderColor="gray.100" flexWrap="wrap">
                <Box w="9px" h="9px" borderRadius="full" bg={accent} flexShrink={0} />
                <Text fontSize="17px" fontWeight="bold" color="gray.800">{wgp.working_group}</Text>
                <Text fontFamily="mono" fontSize="11px" color="gray.400" whiteSpace="nowrap">{wgp.plan_identifier}</Text>
                <Box flex="1" minW="12px" />
                <Text {...MICRO}>Leads</Text>
                {leads.length === 0 ? (
                    <Text fontSize="13px" color="gray.400" fontStyle="italic">none</Text>
                ) : (
                    leads.map((l) => (
                        <HStack key={l.unique_id} spacing={1}>
                            <Avatar name={l.name} />
                            <Text fontSize="13px" color="gray.600" whiteSpace="nowrap">{l.name}</Text>
                        </HStack>
                    ))
                )}
                <Button size="xs" variant="outline" colorScheme="teal" onClick={leadsModal.onOpen}>Manage</Button>
            </HStack>

            {/* Prioritized indicators */}
            <HStack px={5} pt={3} pb={1} spacing={3}>
                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="teal.600" letterSpacing="wide">
                    Prioritized Indicators ({sis.length})
                </Text>
                <Box flex="1" />
                <Button size="xs" variant="outline" colorScheme="teal" onClick={addModal.onOpen}>+ Add Indicator</Button>
            </HStack>

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
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">No indicators prioritized yet.</Text>
                </Box>
            ) : visibleSis.length === 0 ? (
                <Box px={5} py={4}>
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">No indicators match this filter.</Text>
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

            {/* Footer: Queries + Meeting Minutes */}
            <HStack px={5} py={4} align="flex-start" spacing={4} borderTopWidth="1px" borderColor="gray.100">
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
