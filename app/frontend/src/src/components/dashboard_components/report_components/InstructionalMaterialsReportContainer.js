import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import ReportGoalContainer from "./ReportGoalContainer";


function InstructionalMaterialsReportContainer({ instructionalMaterialsData }) {
    if (!instructionalMaterialsData || !instructionalMaterialsData.goals) return null; // Handle cases where data is unavailable

    return (
        <Box mb={6}>
            <Heading as="h3" size="lg" mb={4}>
                Goals and Success Indicators for the INS Working Group
            </Heading>


            {/* Loop through the goals and pass each goal, along with its plans and accomplishments, to the Goal component */}
            {instructionalMaterialsData.goals.slice().reverse().map((goalWrapper, index) => (
                <ReportGoalContainer key={index} goalData={goalWrapper} />
            ))}
        </Box>
    );
}


export default InstructionalMaterialsReportContainer;
