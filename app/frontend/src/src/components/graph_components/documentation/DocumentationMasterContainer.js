import React, { useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import DocumentViewer from './DocumentViewer';
import WebsiteViewer from './WebsiteViewer';
import NoteViewer from './NoteViewer';
import MessageViewer from './MessageViewer';
import MetricViewer from './MetricViewer';

function DocumentationMasterViewer({ documentation }) {
    // Destructure evidenceTypes from documentation
    const { docs = [], webs = [], notes = [], msgs = [], metrics = [] } = documentation || {};

    // Local state for managing the selected documentation type
    const [selectedType, setSelectedType] = useState('Document');

    // List of document types to display in buttons
    const documentTypes = ['Documents', 'Websites', 'Notes', 'Messages', 'Metrics'];

    // Filtered data based on selected type
    const filteredDocs = {
        Documents: docs,
        Websites: webs,
        Notes: notes,
        Messages: msgs,
        Metric: metrics
    }[selectedType] || [];

    // Mapping of selected type to its viewer component
    const viewerComponents = {
        Documents: <DocumentViewer documents={filteredDocs} />,
        Websites: <WebsiteViewer websites={filteredDocs} />,
        Notes: <NoteViewer notes={filteredDocs} />,
        Messages: <MessageViewer messages={filteredDocs} />,
        Metrics: <MetricViewer metrics={filteredDocs} />
    };

    return (
        <Box>
            <Flex wrap="wrap" gap={4} mb={4}>
                {documentTypes.map((type) => (
                    <Button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        colorScheme={selectedType === type ? 'teal' : 'gray'}
                        variant={selectedType === type ? 'solid' : 'outline'}
                    >
                        {type}
                    </Button>
                ))}
            </Flex>

            <Box>
                {filteredDocs.length > 0 ? (
                    viewerComponents[selectedType]
                ) : (
                    <Text>No {selectedType} available for this evidence.</Text>
                )}
            </Box>
        </Box>
    );
}

export default DocumentationMasterViewer;
