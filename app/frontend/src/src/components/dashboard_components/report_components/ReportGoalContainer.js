// ReportGoalContainer.js
import React from 'react';
import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { sortCompositeKeys } from "../../../services/utils/sorters";
import YseReport from "./YseReport";

function ReportGoalContainer({ goalData }) {
    if (!goalData) return null;

    const { goal, plans, accomplishments, date_added, indicators } = goalData;

    return (
        <Box
            as="section"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="lg"
            p={4}
            bg="white"
            boxShadow="sm"
            _hover={{ boxShadow: "md" }}
            transition="box-shadow 0.2s"
            aria-label={`Goal ${goal.properties.goal_number}: ${goal.properties.name}`}
        >
            <VStack align="stretch" spacing={3}>
                <Heading as="h3" size="sm" color="gray.700" tabIndex={0}>
                    Goal {goal.properties.goal_number}: {goal.properties.name}
                </Heading>

                <Text fontSize="xs" color="gray.600" tabIndex={0}>
                    {goal.properties.goal}
                </Text>

                <VStack align="stretch" spacing={3} mt={2}>
                    {indicators && indicators.length > 0 ? (
                        indicators
                            .sort(sortCompositeKeys)
                            .map((indicator, index) => (
                                indicator ? (
                                    <YseReport
                                        key={index}
                                        evidenceItem={indicator.evidences[0]}
                                        indicatorItem={indicator.indicator}
                                    />
                                ) : (
                                    <Text key={index} color="gray.500" fontSize="sm">
                                        No indicator data available
                                    </Text>
                                )
                            ))
                    ) : (
                        <Text color="gray.500" fontSize="sm">
                            No indicators available for this goal
                        </Text>
                    )}
                </VStack>
            </VStack>
        </Box>
    );
}

export default ReportGoalContainer;