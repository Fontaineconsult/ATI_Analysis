import React, { useState } from 'react';
import {
    Badge,
    Box,
    Button,
    HStack,
    Input,
    Link,
    Select,
    SimpleGrid,
    Text,
    VStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

import StatusProgression, { StatusPill } from './StatusProgression';
import {
    TRAJECTORY_CONFIG,
    getTrajectoryColorScheme,
    getTrajectoryLabel,
    latestTrajectory,
    updateAgeDays,
    isStale,
} from './campusPlanConfig';
import { addProgressUpdate } from '../../../services/api/post';
import { getGoalViewUrlFromCompositeKey, getUrlFromCompositeKey } from '../../../services/utils/tools';
import { getPlanStatusColorScheme, getPlanStatusLabel } from '../../../styles/planStatusColors';

// Grid template shared by the header row and every data row (design handoff v2 §5):
// Key | Success indicator | Maturity | Trajectory | Plans | Upd | Actions
export const INDICATOR_GRID_COLUMNS =
    '56px minmax(240px,2fr) minmax(120px,205px) 76px 56px 40px 72px';

// Companion-plans mini-table: Plan (name links to the plan) | Status
const COMPANION_GRID = 'minmax(0,1fr) 110px';
const COMPANION_MICRO = {
    fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
    color: 'gray.600', letterSpacing: 'wide', whiteSpace: 'nowrap',
};

const TRAJECTORY_OPTION_ENTRIES = Object.entries(TRAJECTORY_CONFIG); // [[value,{label}], ...]

/** Small campus-comparison chip: abbrev + that campus's current maturity pill. */
function PeerChip({ abbrev, statusLevel }) {
    return (
        <HStack
            spacing={1}
            px={1.5}
            py={0.5}
            bg="gray.50"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
        >
            <Text fontSize="2xs" fontWeight="bold" textTransform="uppercase" color="gray.600">
                {abbrev}
            </Text>
            <StatusPill level={statusLevel} />
        </HStack>
    );
}

/** Inline "add a progress update" composer shown in the expanded panel. */
function InlineComposer({ workingGroupPlanIdentifier, yseIdentifier, authorUniqueId, onProgressAdded }) {
    const [note, setNote] = useState('');
    const [trajectory, setTrajectory] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!yseIdentifier) {
        return (
            <Text fontSize="xs" color="gray.600" fontStyle="italic" mt={2}>
                No evidence for this year yet — nothing to log an update against.
            </Text>
        );
    }

    const submit = async () => {
        if (!note.trim() || !trajectory) return;
        setSubmitting(true);
        try {
            await addProgressUpdate(workingGroupPlanIdentifier, yseIdentifier, {
                note: note.trim(),
                trajectory,
                authorUniqueId,
            });
            setNote('');
            setTrajectory('');
            if (onProgressAdded) await onProgressAdded();
        } catch (err) {
            console.error('Failed to log progress update', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <HStack mt={2} spacing={2} align="stretch">
            <Input
                size="sm"
                flex="1"
                placeholder="Add an update…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            />
            <Select
                size="sm"
                w="150px"
                placeholder="Trajectory"
                value={trajectory}
                onChange={(e) => setTrajectory(e.target.value)}
            >
                {TRAJECTORY_OPTION_ENTRIES.map(([value, cfg]) => (
                    <option key={value} value={value}>{cfg.label}</option>
                ))}
            </Select>
            <Button
                size="sm"
                colorScheme="teal"
                onClick={submit}
                isLoading={submitting}
                isDisabled={!note.trim() || !trajectory}
            >
                Log
            </Button>
        </HStack>
    );
}

/**
 * One prioritized-indicator row in a working-group card (design handoff v2 §5).
 * The row is a CSS grid; the name IS the goal-view link. Clicking the row (but
 * not the name) toggles an expanded panel with progress updates, an inline
 * composer, and companion plans. Peer-campus comparison chips (D2) sit beneath
 * the name.
 *
 * Props:
 *   si                          — the primary campus's prioritized SI object
 *   peers                       — [{ abbrev, name, status_level }] peers that also prioritize it
 *   campusAbbrev                — primary campus abbrev (for links)
 *   workingGroupPlanIdentifier  — anchor for logging progress
 *   currentUserUniqueId         — author for inline updates
 *   expanded, onToggleExpand    — controlled expand state (owned by the card)
 *   onLog                       — open the ProgressUpdateModal for this SI
 *   onProgressAdded             — refresh callback after an update lands
 */
function IndicatorRow({
    si,
    peers = [],
    campusAbbrev,
    workingGroupPlanIdentifier,
    currentUserUniqueId,
    expanded,
    onToggleExpand,
    onLog,
    onProgressAdded,
}) {
    const compositeKey = si.composite_key;
    const updates = si?.progress?.updates || [];
    const latestNote = updates.length > 0 ? updates[0].note : null;
    const trajectory = latestTrajectory(si);
    const companionPlans = si?.companion_plans || [];
    const companionCount = companionPlans.length;
    const yseIdentifier = si?.progress?.yse_identifier || null;

    const age = updateAgeDays(si);
    const stale = isStale(si);
    const ageText = age === null ? '—' : `${age}d`;

    const stop = (e) => e.stopPropagation();

    return (
        <>
            <Box
                display="grid"
                gridTemplateColumns={INDICATOR_GRID_COLUMNS}
                gap="10px"
                alignItems="center"
                px={5}
                py="10px"
                borderBottomWidth="1px"
                borderColor="gray.100"
                cursor="pointer"
                bg={expanded ? '#F0FBF9' : undefined}
                _hover={{ bg: expanded ? '#F0FBF9' : 'gray.50' }}
                onClick={onToggleExpand}
            >
                <Text fontFamily="mono" fontSize="xs" fontWeight="semibold" color="gray.600">
                    {compositeKey}
                </Text>

                <Box minW={0} textAlign="left">
                    <Link
                        as={RouterLink}
                        to={getGoalViewUrlFromCompositeKey(compositeKey, campusAbbrev)}
                        onClick={stop}
                        display="block"
                        textAlign="left"
                        fontSize="sm"
                        fontWeight="medium"
                        color="teal.700"
                        lineHeight="1.45"
                        _hover={{ textDecoration: 'underline' }}
                        _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', borderRadius: 'sm' }}
                    >
                        {si.success_indicator}
                    </Link>
                    {peers.length > 0 && (
                        <HStack mt={1.5} spacing={1.5} flexWrap="wrap" onClick={stop}>
                            {peers.map((p) => (
                                <PeerChip key={p.abbrev} abbrev={p.abbrev} statusLevel={p.status_level} />
                            ))}
                        </HStack>
                    )}
                    {latestNote && (
                        <Text fontSize="xs" color="gray.600" fontStyle="italic" mt={1.5} lineHeight="1.4">
                            "{latestNote}"
                        </Text>
                    )}
                </Box>

                <Box>
                    <StatusProgression
                        previousStatusLevel={si.previous_status_level}
                        currentStatusLevel={si.status_level}
                    />
                </Box>

                <Box>
                    {trajectory ? (
                        <Badge colorScheme={getTrajectoryColorScheme(trajectory)} fontSize="xs" textTransform="none">
                            {getTrajectoryLabel(trajectory)}
                        </Badge>
                    ) : (
                        <Text fontSize="xs" color="gray.600">—</Text>
                    )}
                </Box>

                {companionCount > 0 ? (
                    <Text fontSize="xs" color="teal.600" fontWeight="medium" whiteSpace="nowrap">
                        {companionCount} plan{companionCount === 1 ? '' : 's'}
                    </Text>
                ) : (
                    <Text fontSize="xs" color="red.600" fontWeight="bold" whiteSpace="nowrap">
                        no plan
                    </Text>
                )}

                <Text
                    fontSize="xs"
                    color={stale ? 'red.600' : 'gray.600'}
                    fontWeight={stale ? 'bold' : 'normal'}
                    whiteSpace="nowrap"
                >
                    {ageText}
                </Text>

                <HStack spacing={1} justify="flex-end" onClick={stop}>
                    <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="teal"
                        onClick={onLog}
                        isDisabled={!yseIdentifier}
                        title={yseIdentifier ? 'Log a progress update' : 'No evidence for this year yet'}
                    >
                        Log
                    </Button>
                    <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="teal"
                        onClick={onToggleExpand}
                        aria-label={`Details for ${compositeKey}`}
                        aria-expanded={expanded}
                    >
                        {expanded ? '▴' : '▾'}
                    </Button>
                </HStack>
            </Box>

            {expanded && (
                <Box
                    px={5}
                    pt={3}
                    pb={4}
                    pl="96px"
                    bg="gray.50"
                    borderBottomWidth="1px"
                    borderColor="gray.100"
                >
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} alignItems="start">
                        {/* Progress updates column */}
                        <Box minW={0}>
                            <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.600" letterSpacing="wide" mb={2}>
                                Progress updates ({updates.length})
                            </Text>
                            {updates.length === 0 ? (
                                <Text fontSize="sm" color="gray.600" fontStyle="italic">No updates logged yet.</Text>
                            ) : (
                                <VStack align="stretch" spacing={0}>
                                    {updates.map((u, idx) => (
                                        <HStack
                                            key={idx}
                                            align="baseline"
                                            spacing={2.5}
                                            py={1.5}
                                            borderBottomWidth={idx === updates.length - 1 ? '0' : '1px'}
                                            borderColor="gray.100"
                                        >
                                            {u.update_date && (
                                                <Text fontFamily="mono" fontSize="xs" color="gray.600" minW="80px" whiteSpace="nowrap">
                                                    {u.update_date}
                                                </Text>
                                            )}
                                            {u.trajectory && (
                                                <Badge colorScheme={getTrajectoryColorScheme(u.trajectory)} fontSize="2xs" textTransform="none">
                                                    {getTrajectoryLabel(u.trajectory)}
                                                </Badge>
                                            )}
                                            <Text fontSize="sm" color="gray.700" flex="1" lineHeight="1.5">"{u.note}"</Text>
                                            {u.author_name && (
                                                <Text fontSize="xs" color="gray.600" whiteSpace="nowrap">— {u.author_name}</Text>
                                            )}
                                        </HStack>
                                    ))}
                                </VStack>
                            )}

                            <InlineComposer
                                workingGroupPlanIdentifier={workingGroupPlanIdentifier}
                                yseIdentifier={yseIdentifier}
                                authorUniqueId={currentUserUniqueId}
                                onProgressAdded={onProgressAdded}
                            />
                        </Box>

                        {/* Companion plans column */}
                        <Box minW={0}>
                            <HStack justify="space-between" align="center" mb={2}>
                                <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.600" letterSpacing="wide">
                                    Companion plans{companionCount > 0 ? ` (${companionCount})` : ''}
                                </Text>
                                {campusAbbrev && (
                                    <Button
                                        as={RouterLink}
                                        to={`/${campusAbbrev}/dashboard/reports/${getUrlFromCompositeKey(compositeKey)}`}
                                        size="xs"
                                        variant="ghost"
                                        colorScheme="teal"
                                    >
                                        + Attach plan
                                    </Button>
                                )}
                            </HStack>
                            {companionCount > 0 ? (
                                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" overflow="hidden" bg="white">
                                    <Box
                                        display="grid"
                                        gridTemplateColumns={COMPANION_GRID}
                                        gap="10px"
                                        px={3}
                                        py={1.5}
                                        bg="gray.50"
                                        borderBottomWidth="1px"
                                        borderColor="gray.100"
                                    >
                                        <Text {...COMPANION_MICRO}>Plan</Text>
                                        <Text {...COMPANION_MICRO}>Status</Text>
                                    </Box>
                                    {companionPlans.map((p, idx) => (
                                        <Box
                                            key={p.unique_id || idx}
                                            display="grid"
                                            gridTemplateColumns={COMPANION_GRID}
                                            gap="10px"
                                            alignItems="center"
                                            px={3}
                                            py={2}
                                            borderBottomWidth={idx === companionPlans.length - 1 ? '0' : '1px'}
                                            borderColor="gray.100"
                                        >
                                            {campusAbbrev && p.unique_id ? (
                                                <Link
                                                    as={RouterLink}
                                                    to={`/${campusAbbrev}/dashboard/plans/${p.unique_id}`}
                                                    fontSize="sm"
                                                    fontWeight="medium"
                                                    color="teal.700"
                                                    lineHeight="1.4"
                                                    _hover={{ textDecoration: 'underline' }}
                                                >
                                                    {p.name || p.description}
                                                </Link>
                                            ) : (
                                                <Text fontSize="sm" fontWeight="medium" color="gray.800" lineHeight="1.4">
                                                    {p.name || p.description}
                                                </Text>
                                            )}
                                            <Box>
                                                <Badge colorScheme={getPlanStatusColorScheme(p)} fontSize="2xs">
                                                    {getPlanStatusLabel(p)}
                                                </Badge>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Box bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="md" px={3} py={2}>
                                    <Text fontSize="sm" color="red.600">
                                        No plans attached yet — this indicator has no active work behind it.
                                    </Text>
                                </Box>
                            )}
                        </Box>
                    </SimpleGrid>
                </Box>
            )}
        </>
    );
}

export default IndicatorRow;
