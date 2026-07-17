// InstructionalMaterialsReportContainer.js
import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import ReportGoalContainer from "./ReportGoalContainer";

function InstructionalMaterialsReportContainer({ instructionalMaterialsData }) {
    if (!instructionalMaterialsData || !instructionalMaterialsData.goals) {
        return (
            <Box p={4}>
                <Text color="gray.600" fontSize="sm">No data available for Instructional Materials Working Group</Text>
            </Box>
        );
    }

    return (
        <VStack align="stretch" spacing={4}>
            <Heading as="h2" size="md" color="teal.700">
                Instructional Materials Working Group - Goals and Success Indicators
            </Heading>

            {instructionalMaterialsData.goals.slice().reverse().map((goalWrapper, index) => (
                <ReportGoalContainer key={index} goalData={goalWrapper} />
            ))}
        </VStack>
    );
}

export default InstructionalMaterialsReportContainer;