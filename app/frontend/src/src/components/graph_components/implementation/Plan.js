import React from 'react';
import { Box, Text, Heading, Flex, Divider } from '@chakra-ui/react';
import '../../../styles/App.css';

function Plan({ planData }) {
    if (!planData) return null;  // Return null if no plan data is available

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
        <Box tabIndex={0} className="plan-card">
            <Flex className="plan-header">
                <Heading as="h5" size="sm">
                    {name}
                </Heading>
                <Text className="plan-status">
                    <strong>Status:</strong> {plan_status || 'Not specified'}
                </Text>
            </Flex>

            <Divider my={2} />

            <Flex className="plan-content-row">
                <Text className="plan-label">Description:</Text><Text>{description}</Text>
                <Text className="plan-label">Key Plan:</Text><Text>{is_key_plan ? 'Yes' : 'No'}</Text>
                <Text className="plan-label">Campus Plan:</Text><Text>{is_campus_plan ? 'Yes' : 'No'}</Text>
                <Text className="plan-label">Abandoned:</Text><Text>{abandoned ? 'Yes' : 'No'}</Text>
                {abandoned && (
                    <>
                        <Text className="plan-label">Abandoned Notes:</Text>
                        <Text>{abandoned_notes || 'None provided'}</Text>
                    </>
                )}
            </Flex>
        </Box>
    );
}

export default Plan;
