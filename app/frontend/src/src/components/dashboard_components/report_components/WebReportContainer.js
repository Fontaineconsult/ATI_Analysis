// WebReportContainer.js
import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import ReportGoalContainer from "./ReportGoalContainer";

function WebReportContainer({ webData }) {
    if (!webData || !webData.goals) {
        return (
            <Box p={4}>
                <Text color="gray.500" fontSize="sm">No data available for Web Working Group</Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={4}>
            <Heading as="h2" size="md" color="teal.700">
                Web Working Group - Goals and Success Indicators
            </Heading>

            {webData.goals.slice().reverse().map((goalWrapper, index) => (
                <ReportGoalContainer key={index} goalData={goalWrapper} />
            ))}
        </VStack>
    );
}

export default WebReportContainer;