import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import ReportGoalContainer from "./ReportGoalContainer";


function WebReportContainer({ webData }) {
    if (!webData || !webData.goals) return null; // Handle cases where data is unavailable
    console.log(webData)
    return (
        <Box mb={6}>
            <Heading as="h3" size="lg" mb={4}>
                Goals and Success Indicators for the WEB Working Group
            </Heading>


            {/* Loop through the goals and pass each goal, along with its plans and accomplishments, to the Goal component */}
            {webData.goals.slice().reverse().map((goalWrapper, index) => (
                <ReportGoalContainer key={index} goalData={goalWrapper} />
            ))}
        </Box>
    );
}


export default WebReportContainer;
