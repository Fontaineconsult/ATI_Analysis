import React from 'react';
import { Box, Flex, Heading, Text } from '@chakra-ui/react';
import DropdownSelect from '../../functional_components/DropdownSelect';
import { useStatusLevels } from '../../../hooks/useStatusLevels';

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


function SuccessIndicator({ indicatorData, evidenceData }) {
    console.log("DSFDSFDSF",evidenceData)
    const { statusLevels, updateStatus } = useStatusLevels();  // Access status levels and update function
    const { success_indicator, date_added, composite_key } = indicatorData.properties;
    const {year_identifier} = evidenceData.evidence.properties;
    const {status_level} = evidenceData.statusLevel.properties;
    const handleStatusChange = (newStatus) => {
        // Call the context method to update the status level in the backend
        updateStatus(year_identifier, newStatus);
    };

    return (
        <Box mb={4} p={4} border="1px solid teal" borderRadius="md" bg="gray.50">
            {/* Horizontal layout for indicator and status level */}
            <Flex justify="space-between" align="center" mb={2}>
                {/* Indicator Heading on the Left */}
                <Heading as="h6" size="sm">
                    Indicator: {composite_key}
                </Heading>

                {/* Status Level Dropdown on the Right */}
                <DropdownSelect
                    options={statusLevels.map((level) => level.status_level)}  // Provide status levels as options
                    initialValue={status_level}  // Initial status level
                    onChange={handleStatusChange}  // Handle status change
                />
            </Flex>

            {/* Indicator Details */}
            <Text><strong>Description:</strong> {success_indicator}</Text>
            <Text><strong>Date Added:</strong> {new Date(date_added).toLocaleDateString()}</Text>
        </Box>
    );
}

export default SuccessIndicator;

