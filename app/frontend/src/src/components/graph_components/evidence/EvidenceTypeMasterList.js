import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import DocumentationMasterViewer from "../documentation/DocumentationMasterContainer";

function EvidenceTypeMasterList({ evidence }) {
    const { isOpen, onOpen, onClose } = useDisclosure();  // Chakra UI hook for modal control
    const [selectedEvidence, setSelectedEvidence] = useState(null);  // State to track the currently selected evidence

    // Handle opening the modal and setting the selected evidence
    const handleViewDocumentation = (evidenceItem) => {
        setSelectedEvidence(evidenceItem);
        onOpen();  // Open the modal
    };

    // Count the number of evidence items
    const evidenceCount = evidence?.length || 0;

    // Inform screen readers of the list summary when it is focused
    useEffect(() => {
        if (evidenceCount === 0) return;
        const listBox = document.getElementById('evidence-list');
        listBox.setAttribute('aria-label', `Evidence list with ${evidenceCount} items`);
    }, [evidenceCount]);

    if (evidenceCount === 0) {
        return <Text>No evidence available for this type.</Text>;
    }

    return (
        <Box
            mt={4}
            id="evidence-list"
            tabIndex={0}  // Make the container focusable for keyboard users
            role="list"
            aria-live="polite"  // Update screen readers about changes in the list
        >

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
                    aria-label={`Evidence item ${index + 1} of ${evidenceCount}`}
                >
                    {/* Evidence type */}
                    <Text flex="1" fontWeight="bold" aria-label="Evidence Type">
                        {evidenceItem.type || 'Unknown Type'}
                    </Text>

                    {/* Evidence title */}
                    <Text flex="3" aria-label="Evidence Title">
                        {evidenceItem.evidenceType?.properties?.title || 'Untitled Evidence'}
                    </Text>

                    <Text flex="3" aria-label="Documentation">
                        Documentation:
                    </Text>

                    {/* View Evidence button */}
                    <Button
                        colorScheme="teal"
                        size="sm"
                        onClick={() => handleViewDocumentation(evidenceItem)}  // Handle button click to open modal
                        aria-label={`View Documentation for ${evidenceItem.evidenceType?.properties?.title || 'Untitled Evidence'}`}
                    >
                        View Documentation
                    </Button>
                </Flex>
            ))}

            {/* Modal for viewing documentation */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Documentation Viewer</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {/* Pass the selected evidence to the DocumentationMasterViewer */}
                        <DocumentationMasterViewer documentation={selectedEvidence} />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}

export default EvidenceTypeMasterList;
