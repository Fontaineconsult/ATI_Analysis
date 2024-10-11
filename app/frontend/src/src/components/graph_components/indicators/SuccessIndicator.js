import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';

// StatusLevel Component
function StatusLevel({ statusLevelDetails }) {
    return (
        <Box>
            <Text textAlign="right">
                <strong>Status Level:</strong> {statusLevelDetails.status_level}
            </Text>
        </Box>
    );
}

// SuccessIndicator Component
function SuccessIndicator({ indicatorData, statusLevel }) {
    if (!indicatorData) return null;

    const { success_indicator, date_added, composite_key } = indicatorData.properties;

    // Access the status level details from the statusLevel object
    const statusLevelDetails = statusLevel?.properties || {};

    return (
        <Box mb={4} p={4} border="1px solid teal" borderRadius="md" bg="gray.50">
            {/* Horizontal layout for indicator and status level */}
            <Flex justify="space-between" align="center" mb={2}>
                {/* Indicator Heading on the Left */}
                <Heading as="h6" size="sm">
                    Indicator: {composite_key}
                </Heading>

                {/* Status Level on the Right */}
                {statusLevel && <StatusLevel statusLevelDetails={statusLevelDetails} />}
            </Flex>

            {/* Indicator Details */}
            <Text><strong>Description:</strong> {success_indicator}</Text>
            <Text><strong>Date Added:</strong> {new Date(date_added).toLocaleDateString()}</Text>
        </Box>
    );
}

export default SuccessIndicator;
