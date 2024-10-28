import React from 'react';
import { Box, Text, Heading, Flex, Divider } from '@chakra-ui/react';

function Plan({ planData }) {
    if (!planData) return null;  // Return null if no plan data is available
    console.log("EEEE", planData)
    // Destructure all properties from the plan data
    const {
        name,
        description,
        is_key_plan,
        is_campus_plan,
        abandoned,
        abandoned_notes,
        plan_status
    } = planData.properties;

    return (
        <Box tabIndex={0} mb={4} border="1px solid teal" p={3} borderRadius="md" bg="gray.50">
            <Flex align="center" justify="space-between" wrap="wrap">
                <Heading as="h5" size="sm" mb={2}>
                    {name}
                </Heading>
                <Text fontSize="sm" color="gray.600">
                    <strong>Status:</strong> {plan_status || 'Not specified'}
                </Text>
            </Flex>

            <Divider my={2} />

            <Flex direction="row" wrap="wrap" gap={4}>
                <Text fontSize="sm"><strong>Description:</strong> {description}</Text>
                <Text fontSize="sm"><strong>Key Plan:</strong> {is_key_plan ? 'Yes' : 'No'}</Text>
                <Text fontSize="sm"><strong>Campus Plan:</strong> {is_campus_plan ? 'Yes' : 'No'}</Text>
                <Text fontSize="sm"><strong>Abandoned:</strong> {abandoned ? 'Yes' : 'No'}</Text>
                {abandoned && (
                    <Text fontSize="sm"><strong>Abandoned Notes:</strong> {abandoned_notes || 'None provided'}</Text>
                )}
            </Flex>
        </Box>
    );
}

export default Plan;
