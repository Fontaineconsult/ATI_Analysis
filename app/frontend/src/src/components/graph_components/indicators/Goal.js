import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import Accomplishment from '../../graph_components/implementation/Accomplishment';  // Import Accomplishment component
import Plan from '../../graph_components/implementation/Plan';
import GoalDetails from "../implementation/GoalDetails";  // Import Plan component

function Goal({ goalData, plans, accomplishments }) {
    if (!goalData) return null; // If no goal data is passed, return nothing

    const { goal_number, name, goal, date_added } = goalData.properties;

    return (
        <Box mb={6} border="1px solid teal" p={4} borderRadius="md" bg="gray.50">
            <Heading as="h4" size="md" mb={4}>
                Goal {goal_number}: {name}
            </Heading>
            <Text><strong>Goal:</strong> {goal}</Text>
            <Text><strong>Date Added:</strong> {new Date(date_added).toLocaleDateString()}</Text>

            {/* Render the grouped Plans and Accomplishments using GoalDetails */}
            <GoalDetails plans={plans} accomplishments={accomplishments} />
        </Box>
    );
}

export default Goal;
