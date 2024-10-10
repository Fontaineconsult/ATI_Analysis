import React from 'react';
import { Box, Heading, Text } from '@chakra-ui/react';

function InstructionalMaterialsData({ instructionalData }) {
    return (
        <Box mb={6}>
            <Heading as="h3" size="lg" mb={4}>
                Instructional Materials Data
            </Heading>
            <Text fontSize="md">{JSON.stringify(instructionalData, null, 2)}</Text> {/* Render instructional materials data */}
        </Box>
    );
}

export default InstructionalMaterialsData;
