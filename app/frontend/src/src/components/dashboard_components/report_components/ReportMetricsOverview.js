import React from 'react';
import {
    Box,
    Flex,
    HStack,
    Icon,
    SimpleGrid,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
    Text,
    VStack,
} from '@chakra-ui/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../../graph_components/common/Card';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import { getStatusColor, STATUS_LEVELS_ORDER } from '../../../services/utils/statusColors';
import { NO_EVIDENCE } from './reportMetrics';

/*
 * The campus-wide overview that heads the "View Reports" landing. Purely presentational —
 * it renders the metrics object computed by reportMetrics.computeReportMetrics. Three bands:
 *   A. Attention stat strip — the evidence-quality gaps that need action (red when > 0).
 *   B. Campus status distribution — where every indicator sits on the maturity ladder.
 *   C. Per-working-group breakdown — coverage, average maturity, and YoY trend per group.
 * Canon styling (design-sense / SFBRN): teal.* brand accent, the red→green maturity ramp
 * for status, white gray.200 cards.
 */

// Stat strip card — the shared canon pattern (AssetStatStrip / PeopleStatStrip): white card
// with a 3px colored top border. `warn` paints the number red once the count is non-zero,
// so a gap reads as "needs attention" at a glance.
function StatCard({ label, value, help, accent, warn = false, loading = false }) {
    const display = loading ? '…' : value;
    const numberColor = warn && !loading && value > 0 ? 'red.500' : 'gray.800';
    return (
        <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="sm"
            p={4}
            borderTopWidth="3px"
            borderTopColor={accent}
        >
            <Stat>
                <StatLabel fontSize="xs" color="gray.600" textTransform="uppercase">{label}</StatLabel>
                <StatNumber fontSize="2xl" color={numberColor}>{display}</StatNumber>
                {help && <StatHelpText fontSize="xs" color="gray.600" mb={0}>{help}</StatHelpText>}
            </Stat>
        </Box>
    );
}

// status_value (0..5) → the matching maturity level name for the ladder.
const avgToLevel = (avg) => {
    if (avg == null) return null;
    const idx = Math.min(STATUS_LEVELS_ORDER.length - 1, Math.max(0, Math.round(avg)));
    return STATUS_LEVELS_ORDER[idx];
};

// One row of the campus status-distribution bar chart.
function DistributionRow({ level, count, pct }) {
    const isNone = level === NO_EVIDENCE;
    const barColor = isNone ? 'gray.300' : getStatusColor(level);
    return (
        <HStack spacing={3} align="center">
            <Text fontSize="xs" color="gray.600" w="92px" flexShrink={0} textAlign="right">{level}</Text>
            <Box flex="1" bg="gray.100" borderRadius="full" h="14px" overflow="hidden">
                <Box h="100%" w={`${pct}%`} bg={barColor} borderRadius="full" transition="width 0.2s" />
            </Box>
            <Text fontSize="xs" color="gray.700" w="74px" flexShrink={0}>
                {count}<Text as="span" color="gray.600"> ({pct}%)</Text>
            </Text>
        </HStack>
    );
}

const TREND_META = {
    improving: { icon: TrendingUp, color: 'green.500', label: 'Improving' },
    static: { icon: Minus, color: 'gray.600', label: 'Static' },
    declining: { icon: TrendingDown, color: 'red.500', label: 'Declining' },
};

function TrendChip({ kind, value }) {
    const m = TREND_META[kind];
    return (
        <HStack spacing={1} align="center">
            <Icon as={m.icon} color={m.color} boxSize={4} />
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">{value}</Text>
            <Text fontSize="2xs" color="gray.600">{m.label}</Text>
        </HStack>
    );
}

// Small red/orange attention pill; hidden when its count is zero to keep calm groups quiet.
function AttentionBadge({ count, label, scheme = 'red' }) {
    if (!count) return null;
    return (
        <Box
            px={2} py={0.5}
            borderRadius="full"
            bg={`${scheme}.50`}
            borderWidth="1px"
            borderColor={`${scheme}.200`}
        >
            <Text fontSize="2xs" color={`${scheme}.700`} fontWeight="semibold">{count} {label}</Text>
        </Box>
    );
}

function WorkingGroupCard({ wg }) {
    return (
        <Card>
            <HStack spacing={2} mb={3} align="center">
                <Box w="10px" h="10px" borderRadius="full" bg={wg.accent} flexShrink={0} />
                <Text fontSize="sm" fontWeight="semibold" color="gray.800">{wg.name}</Text>
            </HStack>

            <Box mb={3}>
                <StatusLevelLadder level={avgToLevel(wg.avgStatusValue)} variant="compact" />
            </Box>

            <Text fontSize="xs" color="gray.600" mb={3}>
                <Text as="span" fontWeight="semibold" color="gray.800">{wg.withEvidence}</Text>
                {' / '}{wg.totalIndicators} with evidence
                <Text as="span" color="gray.600"> ({wg.coveragePct}%)</Text>
            </Text>

            <HStack spacing={4} mb={3} flexWrap="wrap">
                <TrendChip kind="improving" value={wg.trends.improving} />
                <TrendChip kind="static" value={wg.trends.static} />
                <TrendChip kind="declining" value={wg.trends.declining} />
            </HStack>

            <Flex gap={2} flexWrap="wrap">
                <AttentionBadge count={wg.reviewPending} label="pending" scheme="orange" />
                <AttentionBadge count={wg.unassignedCount} label="unassigned" scheme="red" />
                <AttentionBadge count={wg.noActiveDocsCount} label="no docs" scheme="red" />
                <AttentionBadge count={wg.missingImplCount} label="no impl." scheme="orange" />
            </Flex>
        </Card>
    );
}

function ReportMetricsOverview({ metrics, loading = false }) {
    if (!metrics) return null;
    const { campus, byWorkingGroup } = metrics;

    return (
        <VStack align="stretch" spacing={4} mb={6}>
            {/* Row A — attention stat strip */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 5 }} spacing={4}>
                <StatCard label="⚠ Pending Review" value={campus.reviewPending} help="awaiting admin review" accent="orange.400" warn loading={loading} />
                <StatCard label="⚠ Unassigned" value={campus.unassignedCount} help="no person assigned" accent="red.400" warn loading={loading} />
                <StatCard label="⚠ No Active Docs" value={campus.noActiveDocsCount} help="all docs deprecated" accent="red.400" warn loading={loading} />
                <StatCard label="⚠ Missing Implementation" value={campus.missingImplCount} help="no implementations" accent="orange.400" warn loading={loading} />
                <StatCard label="Ready for Review" value={campus.readyForReviewCount} help="queued for sign-off" accent="teal.400" loading={loading} />
            </SimpleGrid>

            {/* Row B — campus status distribution */}
            <Card title="Campus Status Distribution">
                <HStack justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                    <Text fontSize="xs" color="gray.600">
                        {campus.withEvidence} of {campus.totalIndicators} indicators have evidence this year
                    </Text>
                    <HStack spacing={2} align="center">
                        <Text fontSize="2xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Avg maturity</Text>
                        <StatusLevelLadder level={avgToLevel(campus.avgStatusValue)} variant="full" />
                    </HStack>
                </HStack>
                <VStack align="stretch" spacing={2}>
                    {campus.statusDistribution.map((d) => (
                        <DistributionRow key={d.level} level={d.level} count={d.count} pct={d.pct} />
                    ))}
                </VStack>
            </Card>

            {/* Row C — per-working-group breakdown */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {byWorkingGroup.map((wg) => (
                    <WorkingGroupCard key={wg.key} wg={wg} />
                ))}
            </SimpleGrid>
        </VStack>
    );
}

export default ReportMetricsOverview;
