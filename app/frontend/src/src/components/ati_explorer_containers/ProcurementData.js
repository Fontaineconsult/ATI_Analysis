import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

function ProcurementData({ procurementData }) {
    return (
        <Box mb={6}>
            <Heading as="h3" size="lg" mb={4}>
                Procurement Data
            </Heading>
            <Text fontSize="md">{JSON.stringify(procurementData, null, 2)}</Text> {/* Render procurement data */}
        </Box>
    );
}

export default ProcurementData;
