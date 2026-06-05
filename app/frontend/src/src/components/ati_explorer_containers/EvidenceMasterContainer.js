import React, { useMemo, useState } from 'react';
import { Box, Flex, Heading, Wrap, WrapItem, Badge } from '@chakra-ui/react';
import SuccessIndicatorList from '../graph_components/indicators/SuccessIndicatorList';
import SuccessIndicatorDetailPanel from '../graph_components/indicators/SuccessIndicatorDetailPanel';
import { getIndicatorSummary, getStatusColor } from '../graph_components/indicators/indicatorHelpers';
import { sortCompositeKeys } from '../../services/utils/sorters';

/**
 * Goal-level success-indicator view. Master–detail (Principles model): a compact list of all the
 * goal's indicators on the left (with overview badges), the selected indicator flattened for
 * read/edit on the right. A summary bar shows the goal's status distribution at a glance.
 */
function EvidenceMasterContainer({ indicators }) {
    const sorted = useMemo(
        () => (indicators || []).filter((w) => w?.indicator).slice().sort(sortCompositeKeys),
        [indicators],
    );

    const [selectedKey, setSelectedKey] = useState(null);

    // Resolve the selected wrapper, defaulting to the first indicator.
    const selectedWrapper = useMemo(() => {
        if (sorted.length === 0) return null;
        return sorted.find((w) => w.indicator?.properties?.composite_key === selectedKey) || sorted[0];
    }, [sorted, selectedKey]);

    // Goal status distribution (count per status level) + approved / no-evidence tallies.
    const summary = useMemo(() => {
        const byStatus = new Map(); // status_level -> { count, value }
        let noEvidence = 0;
        let approved = 0;
        for (const w of sorted) {
            const s = getIndicatorSummary(w);
            if (!s.hasEvidence) { noEvidence += 1; continue; }
            if (s.approved) approved += 1;
            const label = s.statusLevel || 'Unknown';
            const entry = byStatus.get(label) || { count: 0, value: s.statusValue };
            entry.count += 1;
            byStatus.set(label, entry);
        }
        const ordered = Array.from(byStatus.entries())
            .map(([label, v]) => ({ label, ...v }))
            .sort((a, b) => (Number(a.value) || 0) - (Number(b.value) || 0));
        return { ordered, noEvidence, approved };
    }, [sorted]);

    if (!indicators || indicators.length === 0) return null;

    return (
        <Box mt={4} aria-label={`(${sorted.length}) Success Indicators`}>
            {/* Summary bar */}
            <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
                <Heading as="h5" size="sm" color="teal.700">
                    Success Indicators ({sorted.length})
                </Heading>
                <Wrap spacing={2}>
                    {summary.ordered.map(({ label, count, value }) => (
                        <WrapItem key={label}>
                            <Badge colorScheme={getStatusColor(value)} borderRadius="full" px={2} fontSize="2xs">
                                {count} {label}
                            </Badge>
                        </WrapItem>
                    ))}
                    {summary.approved > 0 && (
                        <WrapItem>
                            <Badge colorScheme="green" variant="subtle" fontSize="2xs">{summary.approved} approved</Badge>
                        </WrapItem>
                    )}
                    {summary.noEvidence > 0 && (
                        <WrapItem>
                            <Badge colorScheme="gray" variant="outline" fontSize="2xs">{summary.noEvidence} no evidence</Badge>
                        </WrapItem>
                    )}
                </Wrap>
            </Flex>

            {/* Master–detail */}
            <Flex gap={4} align="flex-start">
                <Box flex="1" minW="0" maxW="400px">
                    <SuccessIndicatorList
                        indicators={sorted}
                        selectedKey={selectedWrapper?.indicator?.properties?.composite_key || null}
                        onSelect={setSelectedKey}
                    />
                </Box>
                <Box flex="2" minW="0">
                    <SuccessIndicatorDetailPanel wrapper={selectedWrapper} />
                </Box>
            </Flex>
        </Box>
    );
}

export default EvidenceMasterContainer;
