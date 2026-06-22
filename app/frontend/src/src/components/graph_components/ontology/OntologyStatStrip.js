import React from 'react';
import { Box, HStack, Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react';
import { coverageAccent } from './ontologyConfig';

// One stat card with a colored top-border accent (design-sense §3.2).
function StatCard({ label, value, help, accent }) {
    return (
        <Box
            flex="1"
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
                <StatLabel fontSize="xs" color="gray.500" textTransform="uppercase">{label}</StatLabel>
                <StatNumber fontSize="2xl" color="gray.800">{value}</StatNumber>
                {help && <StatHelpText fontSize="xs" color="gray.500" mb={0}>{help}</StatHelpText>}
            </Stat>
        </Box>
    );
}

/**
 * Diagnostic strip for the Ontology Browser. Leads with the attention metric — what is
 * UNDESCRIBED — because the soul of the app is "where are the gaps?" (design-sense §1.1).
 * Counts are computed by the container from the health report and passed in.
 */
function OntologyStatStrip({ health, loading = false }) {
    const v = (n) => (loading ? '…' : n);
    const cov = health?.coverage || {};
    const nodeType = cov.node_type || {};
    const relType = cov.rel_type || {};
    const principles = health?.principles || {};

    const undescribedNodeTypes = nodeType.undescribed_count ?? 0;
    const orphanCount = (health?.orphan_descriptors || []).length;
    const inertCount = (principles.inert || []).length;

    return (
        <HStack spacing={4} mb={4} align="stretch">
            <StatCard
                label="Coverage"
                value={loading ? '…' : `${health?.overall_coverage_pct ?? 0}%`}
                help="elements described"
                accent={coverageAccent(health?.overall_coverage_pct)}
            />
            <StatCard
                label="⚠ Undescribed types"
                value={v(undescribedNodeTypes)}
                help={`of ${nodeType.total ?? 0} node types`}
                accent={undescribedNodeTypes > 0 ? 'red.400' : 'green.400'}
            />
            <StatCard
                label="⚠ Orphan descriptors"
                value={v(orphanCount)}
                help="point at missing elements"
                accent={orphanCount > 0 ? 'red.400' : 'green.400'}
            />
            <StatCard
                label="Rel-type coverage"
                value={loading ? '…' : `${relType.coverage_pct ?? 0}%`}
                help={`${relType.described ?? 0}/${relType.total ?? 0} described`}
                accent={coverageAccent(relType.coverage_pct)}
            />
            <StatCard
                label="Principles"
                value={v(principles.total ?? 0)}
                help={`${inertCount} shape nothing`}
                accent={inertCount > 0 ? 'orange.400' : 'green.400'}
            />
        </HStack>
    );
}

export default OntologyStatStrip;
