import React from 'react';
import { Box, HStack, Stat, StatHelpText, StatLabel, StatNumber } from '@chakra-ui/react';

import { summarizeCampusPlan } from './campusPlanConfig';

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
 * Diagnostic strip for the Campus Plan area (design-sense §3.2). Presentational:
 * counts are rolled up from the loaded plan via summarizeCampusPlan. Leads with
 * the structural counts and ends with the attention metric (⚠ At-Risk), mirroring
 * PeopleStatStrip.
 */
function CampusPlanStatStrip({ plan, loading = false }) {
    const { workingGroups, prioritizedIndicators, plans, atRisk } = summarizeCampusPlan(plan);
    const v = (n) => (loading ? '…' : n);
    return (
        <HStack spacing={4} mb={6} align="stretch">
            <StatCard label="Working Groups" value={v(workingGroups)} help="planning on this campus" accent="teal.400" />
            <StatCard label="Prioritized Indicators" value={v(prioritizedIndicators)} help="across all groups" accent="purple.400" />
            <StatCard label="Plans" value={v(plans)} help="campus-plan plans" accent="teal.400" />
            <StatCard label="⚠ At-Risk" value={v(atRisk)} help="at-risk / failing trajectory" accent="orange.400" />
        </HStack>
    );
}

export default CampusPlanStatStrip;
