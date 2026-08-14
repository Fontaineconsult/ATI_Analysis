import React from 'react';
import {
    Box,
    Flex,
    Heading,
    HStack,
    Icon,
    SimpleGrid,
    Stat,
    StatHelpText,
    StatLabel,
    StatNumber,
    Text,
    VisuallyHidden,
    VStack,
} from '@chakra-ui/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../../graph_components/common/Card';
import StatusLevelLadder from '../../functional_components/StatusLevelLadder';
import { getStatusColor, STATUS_LEVELS_ORDER } from '../../../services/utils/statusColors';
import { NO_EVIDENCE } from './reportMetrics';
import { FILTER_LIST } from './reportFilters';

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
//
// When `onToggle` is supplied the card becomes a toggle button that filters the report
// below. The interactive variant does NOT use Chakra's <Stat>: that renders a <dl>, and a
// description list is not valid inside a <button> — browsers and screen readers recover
// from it inconsistently. The spans below carry the same three lines with the same styling,
// and the button's accessible name is composed explicitly so the announcement is a
// sentence rather than three orphan fragments.
function StatCard({ label, value, help, accent, warn = false, loading = false, onToggle, active = false }) {
    const display = loading ? '…' : value;
    const numberColor = warn && !loading && value > 0 ? 'red.500' : 'gray.800';

    const frame = {
        bg: active ? 'teal.50' : 'white',
        borderWidth: '1px',
        borderColor: active ? 'teal.400' : 'gray.200',
        borderRadius: 'lg',
        boxShadow: 'sm',
        p: 4,
        borderTopWidth: '3px',
        borderTopColor: accent,
    };

    if (!onToggle) {
        return (
            <Box {...frame}>
                <Stat>
                    <StatLabel fontSize="xs" color="gray.600" textTransform="uppercase">{label}</StatLabel>
                    <StatNumber fontSize="2xl" color={numberColor}>{display}</StatNumber>
                    {help && <StatHelpText fontSize="xs" color="gray.600" mb={0}>{help}</StatHelpText>}
                </Stat>
            </Box>
        );
    }

    return (
        <Box
            as="button"
            type="button"
            onClick={onToggle}
            aria-pressed={active}
            aria-label={`${label}: ${display} ${help}. ${active ? 'Filtering the report by this. Activate to remove.' : 'Activate to filter the report by this.'}`}
            textAlign="left"
            w="100%"
            cursor="pointer"
            transition="border-color 0.15s, background-color 0.15s"
            _hover={{ borderColor: 'teal.400', boxShadow: 'md' }}
            _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500', outlineOffset: '2px' }}
            {...frame}
        >
            {/* aria-hidden: the button's own label already reads all three lines, so
                without this a screen reader announces every value twice. */}
            <Box aria-hidden="true">
                <Text fontSize="xs" color="gray.600" textTransform="uppercase">{label}</Text>
                <Text fontSize="2xl" fontWeight="semibold" color={numberColor} lineHeight="1.2">{display}</Text>
                {help && <Text fontSize="xs" color="gray.600">{help}</Text>}
            </Box>
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
        <HStack as="li" spacing={3} align="center">
            <Text fontSize="xs" color="gray.600" w="92px" flexShrink={0} textAlign="right">{level}</Text>
            {/* Decorative: the adjacent text carries level, count, and percent. */}
            <Box aria-hidden="true" flex="1" bg="gray.100" borderRadius="full" h="14px" overflow="hidden">
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
            <Icon as={m.icon} color={m.color} boxSize={4} aria-hidden="true" />
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
                <Box aria-hidden="true" w="10px" h="10px" borderRadius="full" bg={wg.accent} flexShrink={0} />
                {/* Real h3 so each group's card is reachable from the headings
                    list; fontFamily pinned so the look doesn't change. */}
                <Heading as="h3" fontSize="sm" fontFamily="body" fontWeight="semibold" color="gray.800" m={0}>
                    {wg.name}
                </Heading>
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
                <AttentionBadge count={wg.noActiveDocsCount} label="docs deprecated" scheme="red" />
                <AttentionBadge count={wg.undocumentedCount} label="undocumented" scheme="orange" />
                <AttentionBadge count={wg.missingImplCount} label="no impl." scheme="orange" />
            </Flex>
        </Card>
    );
}

function ReportMetricsOverview({ metrics, loading = false, activeFilters = [], onToggleFilter }) {
    if (!metrics) return null;
    const { campus, byWorkingGroup } = metrics;

    return (
        <VStack as="section" aria-labelledby="status-overview-heading" align="stretch" spacing={4} mb={6}>
            {/* Landmark + heading identity for the whole zone: SR users reach it
                from the landmarks/headings lists; sighted layout is unchanged. */}
            <VisuallyHidden>
                <Heading as="h2" id="status-overview-heading">Status Overview</Heading>
            </VisuallyHidden>
            {/* Row A — attention stat strip. Rendered from the filter registry so a tile
                and the filter it applies can never describe different things. Each tile
                is a toggle when onToggleFilter is supplied. */}
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 6 }} spacing={4}>
                {FILTER_LIST.map((f) => (
                    <StatCard
                        key={f.key}
                        label={f.label}
                        value={campus[f.metric]}
                        help={f.help}
                        accent={f.accent}
                        warn={f.warn}
                        loading={loading}
                        active={activeFilters.includes(f.key)}
                        onToggle={onToggleFilter ? () => onToggleFilter(f.key) : undefined}
                    />
                ))}
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
                <VStack as="ul" listStyleType="none" m={0} p={0} align="stretch" spacing={2}>
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
