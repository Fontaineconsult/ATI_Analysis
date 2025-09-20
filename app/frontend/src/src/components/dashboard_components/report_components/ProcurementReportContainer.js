import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import ReportGoalContainer from "./ReportGoalContainer";


function ProcurementReportContainer({ procurementData }) {
    if (!procurementData || !procurementData.goals) return null; // Handle cases where data is unavailable

    return (
        <Box mb={6}>


            {/* Loop through the goals and pass each goal, along with its plans and accomplishments, to the Goal component */}
            {procurementData.goals.slice().reverse().map((goalWrapper, index) => (
                <ReportGoalContainer key={index} goalData={goalWrapper} />
            ))}
        </Box>
    );
}


export default ProcurementReportContainer;
