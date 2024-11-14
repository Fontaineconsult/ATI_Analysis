import React from 'react';
import { Box, Text, Heading } from '@chakra-ui/react';

function Accomplishment({ accomplishmentData }) {
    if (!accomplishmentData) return null;  // If no accomplishment data is available, return null

    const { name, accomplishment_description } = accomplishmentData.properties;

    return (
        <Box mb={4} border="1px solid teal" p={3} borderRadius="md" bg="gray.50">
            <Heading as="h5" size="sm" mb={2}>
                Accomplishment: {name}
            </Heading>
            <Text><strong>Description:</strong> {accomplishment_description}</Text>
        </Box>
    );
}

export default Accomplishment;