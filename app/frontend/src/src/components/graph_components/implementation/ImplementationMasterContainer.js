import React, { useState, useEffect } from 'react';
import { Box, Button, Flex, Heading, Collapse, Text } from '@chakra-ui/react';
import EvidenceTypeMasterList from '../evidence/EvidenceTypeMasterList';

function ImplementationMasterContainer({ evidenceData = {},
                                           compositeKey}) {


    // Destructure evidenceTypes or use an empty array if none are present
    const { evidenceTypes = [] } = evidenceData;

    // Local state for managing which implementation type is selected
    const [selectedImplementationType, setSelectedImplementationType] = useState(null);

    // Local state for handling whether the container is expanded or collapsed
    const [isExpanded, setIsExpanded] = useState(false);

    // List of implementation types
    const implementationTypes = [
        'Tracker',
        'Guidance',
        'Process',
        'Project',
        'Procedure',
        'InternalPolicy',
        'Service',

    ];

    // Effect to reset selectedImplementationType when no evidenceTypes match or when container is collapsed
    useEffect(() => {
        if (!evidenceTypes.length) {
            setSelectedImplementationType(null);  // No evidence, clear the selection
        } else if (!isTypeAvailable(selectedImplementationType)) {
            setSelectedImplementationType(null);  // Selected type is invalid, clear the selection
        }
    }, [evidenceTypes, selectedImplementationType]);

    // Automatically select the first available implementation type when expanded
    useEffect(() => {
        if (isExpanded && evidenceTypes.length && !selectedImplementationType) {
            const firstAvailableType = implementationTypes.find(isTypeAvailable);
            if (firstAvailableType) {
                setSelectedImplementationType(firstAvailableType);  // Set the first available type
            }
        }
    }, [isExpanded, evidenceTypes]);

    // Toggle the expanded/collapsed state
    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    // Check if the implementation type exists in the evidenceTypes array
    const isTypeAvailable = (type) => {
        return evidenceTypes.some(evidenceType => {
            // Check both the direct `type` and the nested `evidenceType.type` for a match
            const directTypeMatch = evidenceType.type && evidenceType.type === type;
            const nestedTypeMatch = evidenceType.evidenceType?.properties?.title === type;
            return directTypeMatch || nestedTypeMatch;
        });
    };

    // Filter the evidenceTypes based on the currently selected implementation type
    const filteredEvidence = evidenceTypes.filter(evidenceType => {
        const directTypeMatch = evidenceType.type && evidenceType.type === selectedImplementationType;
        const nestedTypeMatch = evidenceType.evidenceType?.properties?.title === selectedImplementationType;
        return directTypeMatch || nestedTypeMatch;
    });

    return (
        <Box
            tabIndex={0}
            role="region" // Define this as a region for screen readers
            aria-labelledby="implementation-container-heading"
            aria-expanded={isExpanded} // Let the screen reader know whether it is expanded
            border="1px solid teal"
            borderRadius="md"
            mt={6}
        >
            {/* Header with a button to expand/collapse the ImplementationMasterContainer */}
            <Flex justify="space-between" align="center" bg="teal.600" color="white" p={4} borderTopRadius="md">
                <Heading
                    as="h5"
                    size="md"
                    textAlign="center"
                    flex="1"
                    id="implementation-container-heading"
                >
                    Implementation Details for {compositeKey}
                </Heading>
                <Button
                    size="sm"
                    onClick={toggleExpand}
                    colorScheme="whiteAlpha"
                    variant="outline"
                    aria-controls="implementation-content" // Controls the collapse/expand content
                    aria-expanded={isExpanded} // Reflect the expanded/collapsed state
                    ml={4}
                >
                    {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
            </Flex>

            {/* Collapse content when not expanded */}
            <Collapse in={isExpanded} animateOpacity id="implementation-content">
                <Box p={4}>
                    {/* Implementation type selection buttons */}
                    {evidenceTypes.length > 0 ? (
                        <Flex wrap="wrap" gap={4} mb={4}>
                            {implementationTypes.map((type) => (
                                <Button
                                    key={type}
                                    onClick={() => setSelectedImplementationType(type)}  // Set local state
                                    colorScheme={selectedImplementationType === type ? 'teal' : 'gray'}
                                    aria-pressed={selectedImplementationType === type ? 'true' : 'false'}
                                    variant={selectedImplementationType === type ? 'solid' : 'outline'}
                                    isDisabled={!isTypeAvailable(type)}  // Disable if the type is not in evidenceTypes
                                >
                                    {type}
                                </Button>
                            ))}
                        </Flex>
                    ) : (
                        <Text>No Implementation Types Available</Text>
                    )}

                    {/* Render the current selected implementation type */}
                    {selectedImplementationType ? (
                        <Heading as="h6" size="sm" mb={2}>
                            Currently Viewing: {selectedImplementationType}
                        </Heading>
                    ) : (
                        <Text>No Implementation Type Selected</Text>
                    )}

                    {/* Render filtered evidence data based on selected type, or fallback if no evidence */}
                    <Box>
                        {filteredEvidence.length > 0 ? (
                            <EvidenceTypeMasterList evidence={filteredEvidence} />
                        ) : (
                            <Text>No Implementation Assigned to this Success Indicator</Text>  // Fallback message
                        )}
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}

export default ImplementationMasterContainer;

