import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import GoalDetails from "../implementation/GoalDetails";
import EvidenceMasterContainer from "../../ati_explorer_containers/EvidenceMasterContainer";

function Goal({ goalData, plans, accomplishments, indicators }) {
    if (!goalData) return null; // If no goal data is passed, return nothing

    const { goal_number, name, goal, date_added } = goalData.properties;

    return (
        <Box as="section" className="goal-section" aria-label={`Goal ${goal_number}: ${name}`}>
            <Heading tabIndex={0} as="h4" className="goal-heading">
                Goal {goal_number}: {name}
            </Heading>
            <Text tabIndex={0} className="goal-text">
                Goal: {goal}
            </Text>

            {/* Render the grouped Plans and Accomplishments using GoalDetails */}
            <GoalDetails plans={plans} accomplishments={accomplishments} indicators={indicators} />

            {/* Render the EvidenceMasterContainer for Success Indicators */}
            <EvidenceMasterContainer indicators={indicators} />
        </Box>
    );
}

export default Goal;
