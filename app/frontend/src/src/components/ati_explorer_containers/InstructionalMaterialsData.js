import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import Goal from "../graph_components/indicators/Goal";

function InstructionalMaterialsData({ instructionalMaterialsData }) {

    if (!instructionalMaterialsData || !instructionalMaterialsData.goals) return null; // Handle cases where data is unavailable

    return (
        <Box mb={6}>


            {/* Loop through the goals and pass each goal, along with its plans and accomplishments, to the Goal component */}
            {instructionalMaterialsData.goals.slice().reverse().map((goalWrapper, index) => (
                <Goal
                    key={index}
                    goalData={goalWrapper.goal}
                    plans={goalWrapper.plans}
                    accomplishments={goalWrapper.accomplishments}
                    indicators={goalWrapper.indicators}
                />
            ))}
        </Box>
    );
}


export default InstructionalMaterialsData;
