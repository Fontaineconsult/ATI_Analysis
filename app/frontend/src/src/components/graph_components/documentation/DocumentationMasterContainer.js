import React, { useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import DocumentViewer from './DocumentViewer';
import WebsiteViewer from './WebsiteViewer';
import NoteViewer from './NoteViewer';
import MessageViewer from './MessageViewer';
import MetricViewer from './MetricViewer';

function DocumentationMasterViewer({ documentation }) {
    // Destructure evidenceTypes from documentation
    console.log("SDFSDF", documentation)
    const { docs = [], webs = [], notes = [], msgs = [], metrics = [] } = documentation || {};
    const implementation_id = documentation.evidenceType.properties.unique_id;
    const implementation_type = documentation.evidenceType.labels[0];

    // Mapping of document types to their data lists
    const dataLists = {
        Documents: docs,
        Websites: webs,
        Notes: notes,
        Messages: msgs,
        Metrics: metrics
    };

    // List of document types to display in buttons
    const documentTypes = ['Documents', 'Websites', 'Notes', 'Messages', 'Metrics'];

    // Get the list of available types (with non-empty data lists)
    const availableTypes = documentTypes.filter((type) => dataLists[type] && dataLists[type].length > 0);

    // Local state for managing the selected documentation type
    const [selectedType, setSelectedType] = useState(availableTypes.length > 0 ? availableTypes[0] : null);

    // Filtered data based on selected type
    const filteredDocs = dataLists[selectedType] || [];

    // Mapping of selected type to its viewer component
    const viewerComponents = {
        Documents: <DocumentViewer documents={filteredDocs}
                                   implementation_id={implementation_id}
                                   implementation_type={implementation_type} />,
        Websites: <WebsiteViewer websites={filteredDocs} documents={filteredDocs}
                                 implementation_id={implementation_id}
                                 implementation_type={implementation_type} />,
        Notes: <NoteViewer notes={filteredDocs}  />,
        Messages: <MessageViewer messages={filteredDocs} />,
        Metrics: <MetricViewer metrics={filteredDocs} documents={filteredDocs}
                               implementation_id={implementation_id}
                               implementation_type={implementation_type}/>
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
                        disabled={!dataLists[type] || dataLists[type].length === 0}
                    >
                        {type}
                    </Button>
                ))}
            </Flex>

            <Box>
                {selectedType ? (
                    filteredDocs.length > 0 ? (
                        viewerComponents[selectedType]
                    ) : (
                        <Text>No {selectedType} available for this evidence.</Text>
                    )
                ) : (
                    <Text>No documentation available for this evidence.</Text>
                )}
            </Box>
        </Box>
    );
}

export default DocumentationMasterViewer;