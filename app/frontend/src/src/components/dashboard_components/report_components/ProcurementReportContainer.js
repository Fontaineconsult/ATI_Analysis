// ProcurementReportContainer.js
import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import ReportGoalContainer from "./ReportGoalContainer";

function ProcurementReportContainer({ procurementData }) {
    if (!procurementData || !procurementData.goals) {
        return (
            <Box p={4}>
                <Text color="gray.500" fontSize="sm">No data available for Procurement Working Group</Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={4}>
            <Heading as="h2" size="md" color="teal.700">
                Procurement Working Group - Goals and Success Indicators
            </Heading>

            {procurementData.goals.slice().reverse().map((goalWrapper, index) => (
                <ReportGoalContainer key={index} goalData={goalWrapper} />
            ))}
        </VStack>
    );
}

export default ProcurementReportContainer;