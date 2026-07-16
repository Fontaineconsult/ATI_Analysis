// WorkingGroupReportContainer.js
// Generic per-working-group report body — replaces the near-identical
// Web/InstructionalMaterials/Procurement report containers so any working group
// (including new ones) renders from the single registry-driven overview.
import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import ReportGoalContainer from "./ReportGoalContainer";

function WorkingGroupReportContainer({ data, name }) {
    if (!data || !data.goals) {
        return (
            <Box p={4}>
                <Text color="gray.600" fontSize="sm">No data available for {name} Working Group</Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={4}>
            <Heading as="h2" size="md" color="teal.700">
                {name} Working Group - Goals and Success Indicators
            </Heading>

            {data.goals.slice().reverse().map((goalWrapper, index) => (
                <ReportGoalContainer key={index} goalData={goalWrapper} />
            ))}
        </VStack>
    );
}

export default WorkingGroupReportContainer;
