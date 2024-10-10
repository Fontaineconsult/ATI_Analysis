import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

function WebData({ webData }) {
    return (
        <Box mb={6}>
            <Heading as="h3" size="lg" mb={4}>
                Web Data
            </Heading>
            <Text fontSize="md">{JSON.stringify(webData, null, 2)}</Text> {/* Render web data */}
        </Box>
    );
}

export default WebData;
