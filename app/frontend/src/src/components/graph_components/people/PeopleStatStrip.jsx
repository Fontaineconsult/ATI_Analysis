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
                <StatLabel fontSize="xs" color="gray.600" textTransform="uppercase">{label}</StatLabel>
                <StatNumber fontSize="2xl" color="gray.800">{value}</StatNumber>
                {help && <StatHelpText fontSize="xs" color="gray.600" mb={0}>{help}</StatHelpText>}
            </Stat>
        </Box>
    );
}

/**
 * Diagnostic strip for the People area (design-sense §3.2). Counts are computed
 * by the container from the already-loaded individuals, so this is presentational.
 *
 *   Active People       — every active person.
 *   Approvers           — active people who can sign off YSEs (governance capacity).
 *   ⚠ No working group  — active people on no ATI working group (unaffiliated).
 */
function PeopleStatStrip({ total = 0, approvers = 0, noWorkingGroup = 0, loading = false }) {
    const v = (n) => (loading ? '…' : n);
    return (
        <HStack spacing={4} mb={4} align="stretch">
            <StatCard label="Active People" value={v(total)} help="active in the ATI" accent="teal.400" />
            <StatCard label="Approvers" value={v(approvers)} help="can sign off YSEs" accent="purple.400" />
            <StatCard label="⚠ No working group" value={v(noWorkingGroup)} help="not on any committee" accent="orange.400" />
        </HStack>
    );
}

export default PeopleStatStrip;
