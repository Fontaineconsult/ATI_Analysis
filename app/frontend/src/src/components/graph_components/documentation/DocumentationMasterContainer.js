import React, { useState } from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import DocumentViewer from './DocumentViewer';
import WebsiteViewer from './WebsiteViewer';
import NoteViewer from './NoteViewer';
import MessageViewer from './MessageViewer';
import MetricViewer from './MetricViewer';

function DocumentationMasterViewer({ documentation }) {
    const { docs = [], webs = [], notes = [], msgs = [], metrics = [] } = documentation || {};
    const implementation_id = documentation?.evidenceType?.properties?.unique_id;
    const implementation_type = documentation?.evidenceType?.labels?.[0] || documentation?.type;

    // Remove the label-based filtering since the data is already categorized
    // The data comes pre-sorted into docs, webs, notes, msgs, metrics arrays
    const dataLists = {
        Documents: docs || [],
        Websites: webs || [],
        Notes: notes || [],
        Messages: msgs || [],
        Metrics: metrics || []
    };

    // Descriptions for each document type
    const descriptions = {
        Documents: "Documents are files or written materials that serve as evidence of implementation activities or progress. They can include policies, reports, meeting minutes, or other official documents related to the ATI.",
        Websites: "Webpages are online pages that provide information or resources relevant to the implementation. They can include public-facing web content, internal portals, or any online resources that support the evidence.",
        Notes: "Notes are general observations, insights, or documentation about the implementation's progress. They help track important details and context over time. They do not count toward documented implementation evidence.",
        Messages: "Messages are communications between two or more parties, such as emails or chat logs. They should include details about the ATI. They do not count toward documented implementation evidence.",
        Metrics: "Metrics are quantitative measurements used to assess progress toward the success indicators. They provide data-driven evidence of implementation, helping to track performance and outcomes over time."
    };

    // List of document types to display in buttons
    const documentTypes = ['Documents', 'Websites', 'Notes', 'Messages', 'Metrics'];

    // Local state for managing the selected documentation type
    const [selectedType, setSelectedType] = useState(documentTypes[0]);

    // Filtered data based on selected type
    const filteredDocsForSelectedType = dataLists[selectedType] || [];


    // Mapping of selected type to its viewer component
    const viewerComponents = {
        Documents: (
            <DocumentViewer
                documents={filteredDocsForSelectedType}
                implementation_id={implementation_id}
                implementation_type={implementation_type}
            />
        ),
        Websites: (
            <WebsiteViewer
                websites={filteredDocsForSelectedType}
                implementation_id={implementation_id}
                implementation_type={implementation_type}
            />
        ),
        Notes: (
            <NoteViewer
                notes={filteredDocsForSelectedType}
                implementation_id={implementation_id}
                implementation_type={implementation_type}
            />
        ),
        Messages: (
            <MessageViewer
                messages={filteredDocsForSelectedType}
                implementation_id={implementation_id}
                implementation_type={implementation_type}
            />
        ),
        Metrics: (
            <MetricViewer
                metrics={filteredDocsForSelectedType}
                implementation_id={implementation_id}
                implementation_type={implementation_type}
            />
        )
    };

    return (
        <Box>
            <Flex wrap="wrap" gap={4} mb={4}>
                {documentTypes.map((type) => {
                    const hasData = dataLists[type] && dataLists[type].length > 0;
                    return (
                        <Button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            colorScheme={selectedType === type ? 'teal' : 'gray'}
                            variant={selectedType === type ? 'solid' : 'outline'}
                            opacity={hasData ? 1 : 0.6}
                        >
                            {type} ({dataLists[type].length})
                        </Button>
                    );
                })}
            </Flex>

            {/* Description box */}
            <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                mb={4}
                border="1px"
                borderColor="gray.200"
            >
                <Text fontSize="sm" color="gray.600">
                    {descriptions[selectedType]}
                </Text>
            </Box>

            {/* ALWAYS render the viewer component - remove the conditional */}
            <Box>
                {viewerComponents[selectedType]}
            </Box>
        </Box>
    );
}

export default DocumentationMasterViewer;