import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Heading, Divider, Button, HStack } from '@chakra-ui/react';
import WebData from '../ati_explorer_containers/WebData';
import InstructionalMaterialsData from '../ati_explorer_containers/InstructionalMaterialsData';
import ProcurementData from '../ati_explorer_containers/ProcurementData';

function GoalNavigator({ data }) {
    const { workingGroup, goalId } = useParams();
    const navigate = useNavigate();

    // Helper function to get the working group display name
    const getWorkingGroupName = () => {
        switch(workingGroup) {
            case 'web':
                return 'Web';
            case 'instructional-materials':
                return 'Instructional Materials';
            case 'procurement':
                return 'Procurement';
            default:
                return '';
        }
    };

    // Get the appropriate data based on working group
    const getWorkingGroupData = () => {
        switch(workingGroup) {
            case 'web':
                return data.web;
            case 'instructional-materials':
                return data.instructionalMaterials;
            case 'procurement':
                return data.procurement;
            default:
                return null;
        }
    };

    const workingGroupData = getWorkingGroupData();

    // If we have goalId in the URL, filter to show only that goal
    let goalsToDisplay = workingGroupData?.goals || [];

    if (goalId) {
        // Find the specific goal by goal_number
        const specificGoal = goalsToDisplay.find(g =>
            g.goal?.properties?.goal_number === parseInt(goalId)
        );
        goalsToDisplay = specificGoal ? [specificGoal] : [];
    }

    // Get all goal numbers for navigation
    const allGoalNumbers = workingGroupData?.goals?.map(g =>
        g.goal?.properties?.goal_number
    ).filter(Boolean).sort((a, b) => a - b) || [];

    const currentGoalNumber = goalId ? parseInt(goalId) : null;
    const currentIndex = allGoalNumbers.indexOf(currentGoalNumber);

    const handleGoalNavigation = (goalNumber) => {
        navigate(`/ati-explorer/${workingGroup}/goal/${goalNumber}`);
    };

    // Function to render the appropriate working group component
    const renderWorkingGroupContent = () => {
        // Pass the filtered goals data
        const filteredData = {
            ...workingGroupData,
            goals: goalsToDisplay
        };

        switch(workingGroup) {
            case 'web':
                return <WebData webData={filteredData} />;
            case 'instructional-materials':
                return <InstructionalMaterialsData instructionalMaterialsData={filteredData} />;
            case 'procurement':
                return <ProcurementData procurementData={filteredData} />;
            default:
                return <Box color="gray.600" fontSize="sm">Please select a valid working group</Box>;
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box mb={6} textAlign="center">
                <Heading size="lg" color="teal.700" mb={3}>
                    {getWorkingGroupName()} Working Group
                    {goalId && ` - Goal ${goalId}`}
                </Heading>
                <Divider borderColor="gray.200" />
            </Box>

            {/* Goal Navigation Controls - only show if we're viewing a specific goal */}
            {goalId && allGoalNumbers.length > 1 && (
                <Box
                    mb={6}
                    p={4}
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

            {/* Main content area */}
            <Box>
                {renderWorkingGroupContent()}
            </Box>
        </Box>
    );
}

export default GoalNavigator;