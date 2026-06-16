import React from 'react';
import { Box, HStack, Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react';

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
 * Diagnostic strip across the top of the Implementations area (design-sense §3.2):
 * lead with what needs attention. Counts are computed by the container from the
 * already-loaded implementations, so this is purely presentational.
 *
 *   Total              — every implementation across the seven types.
 *   ⚠ No evidence link — implementations not wired to any YearSuccessEvidence
 *                        (orphaned work that won't surface on any indicator).
 *   ⚠ No owner         — implementations with no owned_by Person (unaccountable).
 *   ⚠ Docs deprecated  — implementations with documents but every one marked
 *                        depreciated (no active/live documentation).
 */
function ImplementationStatStrip({ total = 0, noEvidenceCount = 0, noOwnerCount = 0, noActiveDocsCount = 0, loading = false }) {
    const v = (n) => (loading ? '…' : n);
    return (
        <HStack spacing={4} mb={4} align="stretch">
            <StatCard label="Implementations" value={v(total)} help="across all types" accent="teal.400" />
            <StatCard label="⚠ No evidence link" value={v(noEvidenceCount)} help="not tied to any indicator" accent="red.400" />
            <StatCard label="⚠ No owner" value={v(noOwnerCount)} help="no accountable person" accent="orange.400" />
            <StatCard label="⚠ Docs deprecated" value={v(noActiveDocsCount)} help="no active documentation" accent="orange.400" />
        </HStack>
    );
}

export default ImplementationStatStrip;
