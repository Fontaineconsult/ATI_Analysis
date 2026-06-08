import React from 'react';
import { Box, Heading, Text, VStack, Divider } from '@chakra-ui/react';
import GoalDetails from "../implementation/GoalDetails";
import EvidenceMasterContainer from "../../ati_explorer_containers/EvidenceMasterContainer";

function Goal({ goalData, plans, plansWithProgressNotes, accomplishments, indicators, workingGroup, initialIndicatorNumber }) {
    if (!goalData) return null;

    const { goal_number, name, goal } = goalData.properties;

    return (
        <Box as="section" aria-label={`Goal ${goal_number}: ${name}`} mb={6}>
            {/* Goal header — clean teal section heading + statement, per design-sense */}
            <Box mb={3}>
                <Heading tabIndex={0} as="h3" size="md" color="teal.700" mb={1}>
                    Goal {goal_number}: {name}
                </Heading>
                {goal && (
                    <Text tabIndex={0} fontSize="sm" color="gray.700">
                        {goal}
                    </Text>
                )}
                <Divider mt={3} borderColor="gray.200" />
            </Box>

            {/* The goal's content cards (plans dashboard + the indicator master-detail) */}
            <VStack align="stretch" spacing={3}>
                <GoalDetails
                    plans={plans}
                    plansWithProgressNotes={plansWithProgressNotes}
                    accomplishments={accomplishments}
                    indicators={indicators}
                    goalNumber={goal_number}
                />
                <EvidenceMasterContainer
                    indicators={indicators}
                    initialIndicatorNumber={initialIndicatorNumber}
                />
            </VStack>
        </Box>
    );
}

export default Goal;