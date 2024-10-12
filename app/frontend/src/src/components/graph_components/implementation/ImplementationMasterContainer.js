import React, { useState } from 'react';
import { Box, Button, Flex, Heading, Collapse } from '@chakra-ui/react';

function ImplementationMasterContainer({ initialImplementationType = 'Tracker' }) {
    // Local state for managing which implementation type is selected
    const [selectedImplementationType, setSelectedImplementationType] = useState(initialImplementationType);

    // Local state for handling whether the container is expanded or collapsed
    const [isExpanded, setIsExpanded] = useState(false);

    // List of implementation types
    const implementationTypes = [
        'Tracker',
        'Guidance',
        'Process',
        'Project',
        'Procedure',
        'Internal Policy',
        'Service'
    ];

    // Toggle the expanded/collapsed state
    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <Box mt={6} border="1px solid teal" borderRadius="md">
            {/* Header with a button to expand/collapse the ImplementationMasterContainer */}
            <Flex justify="space-between" align="center" bg="teal.600" color="white" p={4} borderTopRadius="md">
                <Heading as="h5" size="md" textAlign="center" flex="1">Implementation Details</Heading>
                <Button size="sm" onClick={toggleExpand} colorScheme="whiteAlpha" variant="outline" ml={4}>
                    {isExpanded ? 'Collapse' : 'Expand'}
                </Button>
            </Flex>

            {/* Collapse content when not expanded */}
            <Collapse in={isExpanded} animateOpacity>
                <Box p={4}>
                    {/* Implementation type selection buttons */}
                    <Flex wrap="wrap" gap={4} mb={4}>
                        {implementationTypes.map((type) => (
                            <Button
                                key={type}
                                onClick={() => setSelectedImplementationType(type)}  // Set local state
                                colorScheme={selectedImplementationType === type ? 'teal' : 'gray'}
                                aria-pressed={selectedImplementationType === type ? 'true' : 'false'}
                                variant={selectedImplementationType === type ? 'solid' : 'outline'}
                            >
                                {type}
                            </Button>
                        ))}
                    </Flex>

                    {/* Render the current selected implementation type */}
                    <Heading as="h6" size="sm" mb={2}>
                        Currently Viewing: {selectedImplementationType}
                    </Heading>

                    {/* Placeholder for rendering evidence based on selected type */}
                    <Box>
                        {/* Conditionally render content based on selected type */}
                        <p>Content for {selectedImplementationType} will go here.</p>
                    </Box>
                </Box>
            </Collapse>
        </Box>
    );
}

export default ImplementationMasterContainer;
