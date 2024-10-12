import React from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';

function EvidenceTypeMasterList({ evidence }) {
    if (!evidence || evidence.length === 0) {
        return <Text>No evidence available for this type.</Text>;
    }

    return (
        <Box mt={4} aria-label="Evidence Type List" role="list">
            {/* Render each evidence item */}
            {evidence.map((evidenceItem, index) => (
                <Flex
                    key={index}
                    justify="space-between"
                    align="center"
                    p={1}  // Add padding for better readability
                    bg={index % 2 === 0 ? 'gray.100' : 'gray.200'}  // Alternate background color for distinction
                    borderRadius="md"  // Add rounded corners
                    mb={3}  // Add margin between items
                    boxShadow="sm"  // Add shadow for slight elevation effect
                    role="listitem"

                    aria-label={`Evidence item ${index + 1}`}
                >
                    {/* Evidence type */}
                    <Text flex="1" fontWeight="bold" aria-label="Evidence Type">
                        {evidenceItem.type || 'Unknown Type'}
                    </Text>

                    {/* Evidence title */}
                    <Text flex="3" aria-label="Evidence Title">
                        {evidenceItem.evidenceType?.properties?.title || 'Untitled Evidence'}
                    </Text>

                    <Text flex="3" aria-label="Evidence Title">
                        Documentation:
                    </Text>

                    {/* View Evidence button */}
                    <Button
                        colorScheme="teal"
                        size="sm"
                        aria-label={`View Documentation ${evidenceItem.evidenceType?.properties?.title || 'Untitled Evidence'}`}
                    >
                        View Documentation
                    </Button>
                </Flex>
            ))}
        </Box>
    );
}

export default EvidenceTypeMasterList;
