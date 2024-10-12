import React from 'react';
import { Box, Text } from '@chakra-ui/react';

function DocumentationMasterViewer({ documentation }) {
    if (!documentation) {
        return <Text>No documentation available.</Text>;
    }

    return (
        <Box>
            <Text fontWeight="bold">Evidence Type:</Text>
            <Text>{documentation.type || 'Unknown Type'}</Text>
            <Text fontWeight="bold">Title:</Text>
            <Text>{documentation.evidenceType?.properties?.title || 'Untitled Evidence'}</Text>
            {/* Add more fields as needed */}
        </Box>
    );
}

export default DocumentationMasterViewer;
