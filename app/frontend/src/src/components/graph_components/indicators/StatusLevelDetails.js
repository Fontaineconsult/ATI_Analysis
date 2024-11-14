import React from 'react';
import { Box, Text, Heading } from '@chakra-ui/react';

function StatusLevelDetails({ statusDetails }) {
    if (!statusDetails) {
        return <Text>No status details available.</Text>;
    }

    const { description_of_procedures,
        description_of_documentation,
        description_of_resources,
        description_of_documentation_evidence, status_level } = statusDetails;

    return (
        <Box p={4} border="1px solid teal" borderRadius="md" mb={4}>
            <Heading as="h4" size="md" mb={4}>Status Level: {status_level}</Heading>

            {description_of_procedures && (
                <Box mb={4}>
                    <Text fontWeight="bold">Procedures:</Text>
                    <Text>{description_of_procedures}</Text>
                </Box>
            )}

            {description_of_documentation && (
                <Box mb={4}>
                    <Text fontWeight="bold">Documentation:</Text>
                    <Text>{description_of_documentation}</Text>
                </Box>
            )}

            {description_of_resources && (
                <Box mb={4}>
                    <Text fontWeight="bold">Resources:</Text>
                    <Text>{description_of_resources}</Text>
                </Box>
            )}

            {description_of_documentation_evidence && (
                <Box mb={4}>
                    <Text fontWeight="bold">Documentation Evidence:</Text>
                    <Text>{description_of_documentation_evidence}</Text>
                </Box>
            )}
        </Box>
    );
}

export default StatusLevelDetails;
