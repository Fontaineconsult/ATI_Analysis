import React, { useContext } from 'react';
import { Box, Text, Heading, VStack, HStack, Badge, UnorderedList, ListItem } from '@chakra-ui/react';
import { UserContext } from "../../../context/UserContext";
import { StatusLevelContext } from "../../../context/StatusLevelContext";
import {getStatusColor} from "../../../services/utils/tools";

function StatusLevelDetails({ statusDetails }) {
    const { statusLevels } = useContext(StatusLevelContext);

    if (!statusDetails || !statusDetails.status_level) {
        return <Text fontSize="xs">No status details available.</Text>;
    }

    // Find the matching status level from context based on status_level name
    const matchingStatusLevel = statusLevels?.find(
        level => level.status_level === statusDetails.status_level
    );

    // Use the matching status level from context if found, otherwise fall back to statusDetails
    const dataToDisplay = matchingStatusLevel || statusDetails;

    const {
        status_level,
        procedure_descriptions = [],
        procedure_requirements = [],
        documentation_descriptions = [],
        documentation_requirements = [],
        documentation_evidence_descriptions = [],
        documentation_evidence_requirements = [],
        resource_descriptions = [],
        resource_requirements = []
    } = dataToDisplay;

    // Helper function to render descriptions and requirements
    console.log("SDDSFSDF", getStatusColor(status_level))
    const renderSection = (title, descriptions, requirements) => {
        if ((!descriptions || descriptions.length === 0) && (!requirements || requirements.length === 0)) {
            return null;
        }

        return (
            <Box mb={2}>
                <Text fontWeight="semibold" fontSize="xs" color="gray.700" mb={1}>{title}:</Text>
                <Box pl={3}>
                    {descriptions && descriptions.length > 0 && (
                        <UnorderedList spacing={0} styleType="disc" ml={4}>
                            {descriptions.map((item, index) => (
                                <ListItem key={index} fontSize="xs" color="gray.600" lineHeight="1.3">
                                    {item.description}
                                </ListItem>
                            ))}
                        </UnorderedList>
                    )}
                    {requirements && requirements.length > 0 && (
                        <Box mt={1}>
                            <Text fontSize="xs" fontStyle="italic" color="gray.500">
                                Requirements:
                            </Text>
                            <UnorderedList spacing={0} styleType="circle" ml={4}>
                                {requirements.map((req, index) => (
                                    <ListItem key={index} fontSize="xs" color="gray.500" lineHeight="1.3">
                                        {req.requirement_description}
                                    </ListItem>
                                ))}
                            </UnorderedList>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Box p={3} border="1px solid" borderColor="teal.300" borderRadius="md" mb={3} bg="gray.50">
            <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                    Status Level:
                </Text>
                <Badge bg={getStatusColor(status_level)} fontSize="xs">
                    {status_level}
                </Badge>
            </HStack>

            {renderSection("Procedures", procedure_descriptions, procedure_requirements)}
            {renderSection("Documentation", documentation_descriptions, documentation_requirements)}
            {renderSection("Resources", resource_descriptions, resource_requirements)}
            {renderSection("Documentation Evidence", documentation_evidence_descriptions, documentation_evidence_requirements)}
        </Box>
    );
}

export default StatusLevelDetails;