import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import GoalDetails from "../implementation/GoalDetails";
import EvidenceMasterContainer from "../../ati_explorer_containers/EvidenceMasterContainer";  // Import EvidenceMasterContainer

function Goal({ goalData, plans, accomplishments, indicators }) {  // Pass indicators as prop
    if (!goalData) return null; // If no goal data is passed, return nothing

    const { goal_number, name, goal, date_added } = goalData.properties;

    return (
        <Box as={"section"} mb={6} border="1px solid teal" p={4} borderRadius="md" bg="gray.50" aria-label={`Goal ${goal_number}: ${name}`}>
            <Heading tabIndex={0} as="h4" size="md" mb={4}>
                Goal {goal_number}: {name}
            </Heading>
            <Text tabIndex={0} mb={4}><strong>Goal:</strong> {goal}</Text>
            {/* Render the grouped Plans and Accomplishments using GoalDetails */}
            <GoalDetails plans={plans} accomplishments={accomplishments} indicators={indicators}/>

            {/* Render the EvidenceMasterContainer for Success Indicators */}
            <EvidenceMasterContainer indicators={indicators} />
        </Box>
    );
}

export default Goal;
