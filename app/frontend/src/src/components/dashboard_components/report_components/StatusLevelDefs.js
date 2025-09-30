import React, { useContext } from 'react';
import {
    Box,
    Text,
    VStack,
    Spinner,
    Flex,
    List,
    ListItem,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    HStack,
    Heading
} from '@chakra-ui/react';
import { StatusLevelContext } from '../../../context/StatusLevelContext';

// Helper function to get status color
const getStatusColor = (statusLevel) => {
    const level = statusLevel?.toLowerCase();
    switch(level) {
        case 'not started':
            return '#E53E3E'; // red.500
        case 'initiated':
            return '#ED8936'; // orange.500
        case 'defined':
            return '#ECC94B'; // yellow.500
        case 'established':
            return '#41b441'; // green.400
        case 'managed':
            return '#246f24'; // green.600
        case 'optimizing':
            return '#157744'; // green.700
        default:
            return '#718096'; // gray.500
    }
};

// Helper function to get subtle background color
const getStatusBackgroundColor = (statusLevel) => {
    const level = statusLevel?.toLowerCase();
    switch(level) {
        case 'not started':
            return 'red.50';
        case 'initiated':
            return 'orange.50';
        case 'defined':
            return 'yellow.50';
        case 'established':
            return 'green.50';
        case 'managed':
            return 'green.100';
        case 'optimizing':
            return 'teal.50';
        default:
            return 'gray.50';
    }
};

const StatusLevels = () => {
    const { statusLevels, loading: statusLevelsLoading, error: statusLevelsError } = useContext(StatusLevelContext);

    if (statusLevelsLoading) {
        return (
            <Box display="flex" justifyContent="center" py={8}>
                <Spinner size="lg" color="teal.500" />
            </Box>
        );
    }

    if (statusLevelsError) {
        return (
            <Box p={4}>
                <Text color="red.500" fontSize="sm">{statusLevelsError}</Text>
            </Box>
        );
    }

    return (
        <Box mt={6}>
            <Heading size="md" color="teal.700" mb={4}>
                Status Level Definitions
            </Heading>
            <Accordion allowMultiple>
                {statusLevels
                    .sort((a, b) => a.status_value - b.status_value)
                    .map((level) => {
                        // Prepare categories array
                        const categories = [
                            {
                                name: 'Procedures',
                                descriptions: level.procedure_descriptions,
                                requirements: level.procedure_requirements,
                            },
                            {
                                name: 'Resources',
                                descriptions: level.resource_descriptions,
                                requirements: level.resource_requirements,
                            },
                            {
                                name: 'Documentation',
                                descriptions: level.documentation_descriptions,
                                requirements: level.documentation_requirements,
                            },
                            {
                                name: 'Documentation Evidence',
                                descriptions: level.documentation_evidence_descriptions,
                                requirements: level.documentation_evidence_requirements,
                            },
                        ];

                        const statusColor = getStatusColor(level.status_level);
                        const statusBgColor = getStatusBackgroundColor(level.status_level);

                        return (
                            <AccordionItem
                                key={level.unique_id}
                                borderWidth="1px"
                                borderColor="gray.200"
                                borderRadius="lg"
                                mb={2}
                                overflow="hidden"
                            >
                                <h2>
                                    <AccordionButton
                                        bg="white"
                                        _hover={{ bg: statusBgColor }}
                                        _expanded={{ bg: statusBgColor }}
                                        py={3}
                                        px={4}
                                        position="relative"
                                    >
                                        {/* Subtle left border indicator */}
                                        <Box
                                            position="absolute"
                                            left={0}
                                            top={0}
                                            bottom={0}
                                            width="3px"
                                            bg={statusColor}
                                        />

                                        <Box as="span" flex="1" textAlign="left" pl={2}>
                                            <HStack spacing={3}>
                                                {/* Small color dot indicator */}

                                                <Text fontSize="sm" fontWeight="bold" color="gray.700">
                                                    {level.status_level}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    (Level {level.status_value})
                                                </Text>
                                            </HStack>
                                        </Box>
                                        <AccordionIcon color="gray.600" />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4} bg="white" px={4}>
                                    <VStack align="stretch" spacing={3} pt={2}>
                                        {/* Categories Display */}
                                        {categories.map((category) => {
                                            const hasContent =
                                                (category.descriptions && category.descriptions.length > 0) ||
                                                (category.requirements && category.requirements.length > 0);

                                            if (!hasContent) {
                                                return null;
                                            }

                                            return (
                                                <Flex
                                                    key={category.name}
                                                    align="start"
                                                    direction={{ base: 'column', md: 'row' }}
                                                    borderBottomWidth="1px"
                                                    borderColor="gray.100"
                                                    pb={3}
                                                >
                                                    {/* Left Box: Category Name */}
                                                    <Box
                                                        width={{ base: '100%', md: '30%' }}
                                                        pr={{ md: 4 }}
                                                        mb={{ base: 2, md: 0 }}
                                                    >
                                                        <Text fontWeight="semibold" fontSize="xs" color="gray.600" textTransform="uppercase">
                                                            {category.name}
                                                        </Text>
                                                    </Box>

                                                    {/* Right Box: Descriptions and Requirements */}
                                                    <Box width={{ base: '100%', md: '70%' }} textAlign="left">
                                                        {category.descriptions && category.descriptions.length > 0 && (
                                                            <Box mb={2}>
                                                                <Text fontWeight="medium" fontSize="xs" color="gray.600" mb={1}>
                                                                    Descriptions:
                                                                </Text>
                                                                <List spacing={1} pl={4} styleType="disc">
                                                                    {category.descriptions.map((item, index) => (
                                                                        <ListItem key={index} color="gray.700" fontSize="xs">
                                                                            {item.description}
                                                                        </ListItem>
                                                                    ))}
                                                                </List>
                                                            </Box>
                                                        )}
                                                        {category.requirements && category.requirements.length > 0 && (
                                                            <Box>
                                                                <Text fontWeight="medium" fontSize="xs" color="gray.600" mb={1}>
                                                                    Requirements:
                                                                </Text>
                                                                <List spacing={1} pl={4} styleType="disc">
                                                                    {category.requirements.map((item, index) => (
                                                                        <ListItem key={index} color="gray.700" fontSize="xs">
                                                                            {item.requirement_description}
                                                                        </ListItem>
                                                                    ))}
                                                                </List>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Flex>
                                            );
                                        })}

                                        {/* Notes Section */}
                                        {level.notes?.length > 0 && (
                                            <Flex
                                                align="start"
                                                direction={{ base: 'column', md: 'row' }}
                                                pt={2}
                                            >
                                                {/* Left Box: Category Name */}
                                                <Box
                                                    width={{ base: '100%', md: '30%' }}
                                                    pr={{ md: 4 }}
                                                    mb={{ base: 2, md: 0 }}
                                                >
                                                    <Text fontWeight="semibold" fontSize="xs" color="gray.600" textTransform="uppercase">
                                                        Notes
                                                    </Text>
                                                </Box>

                                                {/* Right Box: Notes Content */}
                                                <Box width={{ base: '100%', md: '70%' }} textAlign="left">
                                                    <List spacing={1} pl={4} styleType="disc">
                                                        {level.notes.map((note, index) => (
                                                            <ListItem key={index} color="gray.700" fontSize="xs">
                                                                {note.content}
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Box>
                                            </Flex>
                                        )}
                                    </VStack>
                                </AccordionPanel>
                            </AccordionItem>
                        );
                    })}
            </Accordion>
        </Box>
    );
};

export default StatusLevels;