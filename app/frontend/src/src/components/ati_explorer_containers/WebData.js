import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import Goal from '../graph_components/indicators/Goal';


function WebData({ webData }) {
    if (!webData || !webData.goals) return null; // Handle cases where data is unavailable

    return (
        <Box mb={6}>


            {/* Loop through the goals and pass each goal, along with its plans and accomplishments, to the Goal component */}
            {webData.goals.slice().reverse().map((goalWrapper, index) => (
                <Goal
                    key={index}
                    goalData={goalWrapper.goal}
                    plans={goalWrapper.plans}
                    plansWithProgressNotes={goalWrapper.plans_with_progress_notes}
                    accomplishments={goalWrapper.accomplishments}
                    indicators={goalWrapper.indicators}
                />
            ))}
        </Box>
    );
}

export default WebData;