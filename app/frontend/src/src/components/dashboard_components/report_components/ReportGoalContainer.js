import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';
import {sortCompositeKeys} from "../../../services/utils/sorters";
import SuccessIndicator from "../../graph_components/indicators/SuccessIndicator";
import YseReport from "./YseReport";


function ReportGoalContainer({ goalData }) {  // Pass indicators as prop
    if (!goalData) return null; // If no goal data is passed, return nothing

    const { goal , plans, accomplishments, date_added, indicators } = goalData;

    return (
        <Box as={"section"} mb={6} border="1px solid teal" p={4} borderRadius="md" bg="gray.50" aria-label={`Goal ${goal.properties.goal_number}: ${goal.properties.name}`}>
            <Heading tabIndex={0} as="h4" size="md" mb={4}>
                Goal {goal.properties.goal_number}: {goal.properties.name}
            </Heading>
            <Text tabIndex={0} mb={4}><strong>Goal:</strong> {goal.properties.goal}</Text>
            {indicators
                .sort(sortCompositeKeys)
                .map((indicator, index) => {

                    return indicator ? (
                        <YseReport
                            key={index}
                            evidenceItem={indicator.evidences[0]}
                            indicatorItem={indicator.indicator}
                        />
                    ) : (
                        <p>No Indicator</p>
                    );
                })}
        </Box>
    );
}

export default ReportGoalContainer;
