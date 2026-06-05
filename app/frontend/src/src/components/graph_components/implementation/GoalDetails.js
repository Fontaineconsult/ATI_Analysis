import React, { useState, useContext } from 'react';
import { Box, Flex, Text, Button, Heading } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import Plan from './Plan';
import GoalPlanLinks from './GoalPlanLinks';
import { DataContext } from '../../../context/DataContext';
import { SettingsContext } from '../../../context/SettingsContext';

// A goal-level card holding the goal's plans as a compact, linkable list.
// Accomplishments are no longer shown inline here — the goal view stays dense,
// and full plan review/edit happens on the dedicated plans page (reached by
// clicking a plan name; see GoalPlanLinks).
const PanelCard = ({ children }) => (
    <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" boxShadow="sm" p={3}>
        {children}
    </Box>
);

function GoalDetails({ plans, indicators, goalNumber }) {
    const { loadSingleWorkingGroupData } = useContext(DataContext);
    const { currentAcademicYear, currentWorkingGroup } = useContext(SettingsContext);
    const [showNewPlan, setShowNewPlan] = useState(false);

    // Flatten goal-level and indicator-level plans into one list for the compact
    // display. Both shapes carry their fields under `.properties`.
    const allPlans = [
        ...(plans || []),
        ...(indicators || []).flatMap((indicator) => indicator.evidences?.[0]?.plans || []),
    ];

    const handleRefresh = () => {
        loadSingleWorkingGroupData(currentWorkingGroup);
        setShowNewPlan(false);
    };

    return (
        <Box mt={2}>
            <PanelCard>
                <Flex justify="space-between" align="center" mb={2}>
                    <Heading size="xs" color="teal.700" textTransform="uppercase" letterSpacing="wide">
                        Plans ({allPlans.length})
                    </Heading>
                    <Button
                        size="xs"
                        colorScheme="teal"
                        leftIcon={<FaPlus />}
                        onClick={() => setShowNewPlan(!showNewPlan)}
                        variant={showNewPlan ? 'outline' : 'solid'}
                    >
                        {showNewPlan ? 'Cancel' : 'Add Plan'}
                    </Button>
                </Flex>

                {showNewPlan && (
                    <Plan
                        isNew
                        goalNumber={goalNumber}
                        workingGroup={currentWorkingGroup}
                        academicYear={currentAcademicYear}
                        onSuccess={handleRefresh}
                        onCancel={() => setShowNewPlan(false)}
                    />
                )}

                {allPlans.length > 0 ? (
                    <GoalPlanLinks plans={allPlans} />
                ) : (
                    !showNewPlan && (
                        <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                            No plans available for this goal.
                        </Text>
                    )
                )}
            </PanelCard>
        </Box>
    );
}

export default GoalDetails;
