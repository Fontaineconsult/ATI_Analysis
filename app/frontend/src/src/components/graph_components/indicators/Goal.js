import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import GoalDetails from "../implementation/GoalDetails";
import EvidenceMasterContainer from "../../ati_explorer_containers/EvidenceMasterContainer";

function Goal({ goalData, plans, plansWithProgressNotes, accomplishments, indicators, workingGroup, initialIndicatorNumber }) {
    if (!goalData) return null;

    const { goal_number, name, goal, date_added } = goalData.properties;

    return (
        <Box>
            <Box as="section" className="goal-section" aria-label={`Goal ${goal_number}: ${name}`}>
                <Heading tabIndex={0} as="h2" className="goal-heading">
                    Goal {goal_number}: {name}
                </Heading>
                <Text tabIndex={0} className="goal-text">
                    Goal: {goal}
                </Text>

                {/* Pass all necessary props to GoalDetails for handling logic */}
                <GoalDetails
                    plans={plans}
                    plansWithProgressNotes={plansWithProgressNotes}
                    accomplishments={accomplishments}
                    indicators={indicators}
                    goalNumber={goal_number}
                />
            </Box>

            <Box>
                <EvidenceMasterContainer indicators={indicators} initialIndicatorNumber={initialIndicatorNumber} />
            </Box>
        </Box>
    );
}

export default Goal;