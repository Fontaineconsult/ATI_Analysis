import React from 'react';
import { Box, Text, Heading } from '@chakra-ui/react';

function Plan({ planData }) {
    if (!planData) return null;  // If no plan data is available, return null

    const { name, plan_description, is_key_plan } = planData.properties;

    return (
        <Box mb={4} border="1px solid teal" p={3} borderRadius="md" bg="gray.50">
            <Heading as="h5" size="sm" mb={2}>
                Plan: {name}
            </Heading>
            <Text><strong>Description:</strong> {plan_description}</Text>
            <Text><strong>Key Plan:</strong> {is_key_plan ? 'Yes' : 'No'}</Text>
        </Box>
    );
}

export default Plan;