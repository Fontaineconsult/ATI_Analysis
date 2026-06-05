import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Heading, Divider, Button, HStack } from '@chakra-ui/react';
import Goal from '../graph_components/indicators/Goal';

// URL slug -> display name + the key of `data` that holds this group's goals. The three
// working groups render the SAME goal display, so one config replaces the old per-group
// WebData / InstructionalMaterialsData / ProcurementData wrappers and the switch statements.
const WORKING_GROUPS = {
    'web': { name: 'Web', dataKey: 'web' },
    'instructional-materials': { name: 'Instructional Materials', dataKey: 'instructionalMaterials' },
    'procurement': { name: 'Procurement', dataKey: 'procurement' },
};

function GoalNavigator({ data }) {
    const { workingGroup, goalId, campus } = useParams();
    const navigate = useNavigate();

    const config = WORKING_GROUPS[workingGroup];
    const allGoals = (config && data?.[config.dataKey]?.goals) || [];

    // If a goalId is in the URL, show only that goal; otherwise show all.
    const goalsToDisplay = goalId
        ? allGoals.filter((g) => g.goal?.properties?.goal_number === parseInt(goalId, 10))
        : allGoals;

    const allGoalNumbers = allGoals
        .map((g) => g.goal?.properties?.goal_number)
        .filter(Boolean)
        .sort((a, b) => a - b);

    const currentGoalNumber = goalId ? parseInt(goalId, 10) : null;
    const currentIndex = allGoalNumbers.indexOf(currentGoalNumber);

    const handleGoalNavigation = (goalNumber) => {
        navigate(`/${campus}/dashboard/${workingGroup}/goal/${goalNumber}`);
    };

    if (!config) {
        return <Box color="gray.600" fontSize="sm">Please select a valid working group</Box>;
    }

    return (
        <Box>
            {/* Header */}
            <Box mb={4} textAlign="center">
                <Heading size="md" color="teal.700" mb={2}>
                    {config.name} Working Group
                    {goalId && ` - Goal ${goalId}`}
                </Heading>
                <Divider borderColor="gray.200" />
            </Box>

            {/* Goal Navigation Controls - only show if we're viewing a specific goal */}
            {goalId && allGoalNumbers.length > 1 && (
                <Box
                    mb={4}
                    p={3}
                    bg="white"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    boxShadow="sm"
                >
                    <HStack spacing={4} justify="space-between">
                        <Button
                            onClick={() => handleGoalNavigation(allGoalNumbers[currentIndex - 1])}
                            isDisabled={currentIndex <= 0}
                            size="sm"
                            colorScheme="teal"
                            variant="outline"
                            _hover={{ bg: 'teal.50' }}
                        >
                            ← Previous Goal
                        </Button>

                        <HStack spacing={2}>
                            {allGoalNumbers.map((num) => (
                                <Button
                                    key={num}
                                    size="xs"
                                    onClick={() => handleGoalNavigation(num)}
                                    variant={num === currentGoalNumber ? "solid" : "outline"}
                                    colorScheme={num === currentGoalNumber ? "teal" : "gray"}
                                    _hover={{ bg: num === currentGoalNumber ? 'teal.600' : 'gray.50' }}
                                >
                                    Goal {num}
                                </Button>
                            ))}
                        </HStack>

                        <Button
                            onClick={() => handleGoalNavigation(allGoalNumbers[currentIndex + 1])}
                            isDisabled={currentIndex >= allGoalNumbers.length - 1}
                            size="sm"
                            colorScheme="teal"
                            variant="outline"
                            _hover={{ bg: 'teal.50' }}
                        >
                            Next Goal →
                        </Button>
                    </HStack>
                </Box>
            )}

            {/* Goals — same display for every working group */}
            <Box mb={4}>
                {goalsToDisplay.slice().reverse().map((goalWrapper, index) => (
                    <Goal
                        key={goalWrapper.goal?.properties?.unique_id || index}
                        goalData={goalWrapper.goal}
                        plans={goalWrapper.plans}
                        plansWithProgressNotes={goalWrapper.plans_with_progress_notes}
                        accomplishments={goalWrapper.accomplishments}
                        indicators={goalWrapper.indicators}
                    />
                ))}
            </Box>
        </Box>
    );
}

export default GoalNavigator;
