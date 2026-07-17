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
 * Dashboard strip across the top of the Assets area. Counts are computed by the
 * container (which already loads assets + elevation) and passed in, so the strip
 * is purely presentational.
 */
function AssetStatStrip({ totalAssets = 0, elevationCount = 0, taapsDueCount = 0, loading = false }) {
    const v = (n) => (loading ? '…' : n);
    return (
        <HStack spacing={4} mb={4} align="stretch">
            <StatCard label="Assets" value={v(totalAssets)} help="logged ICT units" accent="teal.400" />
            <StatCard label="⚠ Elevation" value={v(elevationCount)} help="stewarded, unremediated" accent="red.400" />
            <StatCard label="TAAPs due" value={v(taapsDueCount)} help="review on/before today" accent="orange.400" />
        </HStack>
    );
}

export default AssetStatStrip;
