import React, { useContext, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Correctly import RouterLink
import {
    Box,
    Heading,
    Text,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    VStack,
    Spinner,
    TableContainer,
    Table,
    Thead,
    Tr,
    Th,
    Tbody,
    Td,
    List,
    ListItem, Link, Flex
} from '@chakra-ui/react';
import { DataContext } from '../../../context/DataContext';
import { StatusLevelContext } from '../../../context/StatusLevelContext'; // Import StatusLevelContext

const calculateStatistics = (data) => {
    const stats = {
        workingGroups: {
            web: { goals: 0, indicators: 0 },
            instructionalMaterials: { goals: 0, indicators: 0 },
            procurement: { goals: 0, indicators: 0 }
        },
        statusLevels: {
            'Not Started': 0,
            Initiated: 0,
            Defined: 0,
            Established: 0,
            Managed: 0,
            Optimizing: 0
        },
        unassignedEvidence: 0
    };

    // Function to process each working group
    const processWorkingGroup = (workingGroupData) => {
        if (!workingGroupData || !workingGroupData.goals) return { goals: 0, indicators: 0 };

        const groupStats = {
            goals: workingGroupData.goals.length,
            indicators: 0
        };

        // Process each goal
        workingGroupData.goals.forEach((goal) => {
            if (!goal.indicators) return;

            groupStats.indicators += goal.indicators.length;

            // Process each indicator's evidence for status levels and unassigned
            goal.indicators.forEach((indicator) => {
                if (!indicator.evidences) return;

                indicator.evidences.forEach((evidenceObj) => {
                    // Count status levels
                    if (evidenceObj.statusLevel?.properties?.status_level) {
                        stats.statusLevels[evidenceObj.statusLevel.properties.status_level]++;
                    }

                    // Count unassigned evidence
                    if (!evidenceObj.persons || evidenceObj.persons.length === 0) {
                        stats.unassignedEvidence++;
                    }
                });
            });
        });

        return groupStats;
    };

    // Process each working group
    if (data.web) {
        stats.workingGroups.web = processWorkingGroup(data.web);
    }
    if (data.instructionalMaterials) {
        stats.workingGroups.instructionalMaterials = processWorkingGroup(data.instructionalMaterials);
    }
    if (data.procurement) {
        stats.workingGroups.procurement = processWorkingGroup(data.procurement);
    }

    return stats;
};

function ATIOverview() {
    const { data, loadAllIndividuals, loading } = useContext(DataContext);
    const [stats, setStats] = useState(null);
    const { statusLevels, loading: statusLevelsLoading, error: statusLevelsError } = useContext(StatusLevelContext); // Use StatusLevelContext

    useEffect(() => {
        loadAllIndividuals();
    }, []);

    useEffect(() => {
        if (data && !loading) {
            setStats(calculateStatistics(data));
        }
    }, [data, loading]);

    const activeMembers = data?.individuals?.filter((member) => member.active) || [];

    return (
        <Box maxW="1000px" mx="auto" p={6}>
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                ATI Overview
            </Heading>

            <Accordion
                allowToggle
                defaultIndex={[0]}
                sx={{
                    '.chakra-accordion__item': {
                        borderRadius: 'md',
                        mb: 2,
                        border: '1px solid',
                        borderColor: 'gray.200'
                    },
                    '.chakra-accordion__button': {
                        bg: 'gray.50',
                        _hover: {
                            bg: 'gray.100'
                        },
                        px: 6,
                        py: 4
                    },
                    '.chakra-accordion__panel': {
                        px: 6,
                        pb: 6
                    }
                }}
            >

                {/* Instructions Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">
                                Instructions
                            </Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <Box
                            borderLeft="4px"
                            borderColor="teal.400"
                            pl={4}
                            py={2}
                            bg="gray.50"
                            borderRadius="md"
                            boxShadow="sm"
                        >
                            <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={2}>
                                Using this ATI Reporting Tool

                            </Text>
                            <List spacing={2} pl={4} styleType="decimal" textAlign="left">
                                <ListItem color="gray.700">Scroll down to 'Committee Members' and find your name. Based on the working groups assigned, please review the corresponding working group overview. These assignments are not final and if you feel your work intersects with success indicators in other working groups please let me know and feel free to engage with them.</ListItem>
                                <ListItem color="gray.700"> Select a working group (<Link as={RouterLink} colorPalette="teal" variant="underline" to="/ati-explorer/web">Web</Link>,{' '}
                                    <Link as={RouterLink}  colorPalette="teal" variant="underline" to="/ati-explorer/instructional-materials">Instructional Materials</Link>, or{' '}
                                    <Link as={RouterLink}  colorPalette="teal" variant="underline" to="/ati-explorer/procurement">Procurement</Link>)

                                </ListItem>
                                <ListItem color="gray.700">Scroll through the list of success indicators and familiarize yourself with our responsibilities.</ListItem>
                                <ListItem color="gray.700">Click on the "Annotations" button to add  notes, messages, or plans. Add anything you can think of that may help guide our efforts next year.</ListItem>
                                <ListItem color="gray.700">Our goal is to collect evidence of <i>implementations</i> for success indicators. I've classified implementations into seven categories: 'Tracker', 'Guidance', 'Process', 'Project', 'Procedure', 'Internal Policy', and 'Service'. You don't yet have the ability to code these yourself, so simply indicate in a note which class applies. These are explained in detail in the 'ATI Knowledge Organization' section. When adding notes, try to think of any evidence you can provide that fits into these categories.</ListItem>
                                <ListItem color="gray.700">In accordance with the chancellor's office directive, Daniel will lower status levels to better reflect the reality of our existing ATI implementations. Please review the status level definitions to better understand how we are instructed to measure our evidence.</ListItem>
                                <ListItem color="gray.700">Please reach out to Daniel on teams or email if you have any questions or encounter issues with this tool.</ListItem>
                            </List>
                        </Box>
                    </AccordionPanel>
                </AccordionItem>

                {/* ATI Overview Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">
                                ATI Overview
                            </Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <VStack align="stretch" spacing={6} width="100%">
                            {/* Vision and Purpose */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={2}>
                                    Vision and Purpose
                                </Text>
                                <Text lineHeight="tall" color="gray.700" textAlign="left">
                                    The Accessible Technology Initiative (ATI) represents the CSU's commitment to providing
                                    equal access to information technology and services for all students, staff, faculty, and the
                                    general public, as mandated by the ADA, Section 504, and Section 508 of the Rehabilitation Act.
                                </Text>
                            </Box>

                            {/* Core Principles */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={2}>
                                    Core Principles
                                </Text>
                                <List spacing={2} pl={4} styleType="disc" textAlign="left">
                                    <ListItem color="gray.700">
                                        Technology accessibility is an institution-wide responsibility requiring leadership
                                        commitment
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Technology must provide equal access and benefits for individuals with disabilities
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Universal Design principles should reduce the need for individual accommodations
                                    </ListItem>
                                </List>
                            </Box>

                            {/* Priority Areas */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                    Three Priority Areas
                                </Text>

                                <VStack align="stretch" spacing={4}>
                                    {/* Web Accessibility */}
                                    <Box>
                                        <Text fontSize="md" fontWeight="semibold" color="teal.600" mb={2}>
                                            1. Web Accessibility
                                        </Text>
                                        <List spacing={1} pl={6} styleType="disc" textAlign="left">
                                            <ListItem color="gray.700">Evaluation and repair of inaccessible content</ListItem>
                                            <ListItem color="gray.700">
                                                Ensuring new development complies with Section 508
                                            </ListItem>
                                            <ListItem color="gray.700">Ongoing monitoring and maintenance</ListItem>
                                        </List>
                                    </Box>

                                    {/* Instructional Materials */}
                                    <Box>
                                        <Text fontSize="md" fontWeight="semibold" color="teal.600" mb={2}>
                                            2. Instructional Materials
                                        </Text>
                                        <List spacing={1} pl={6} styleType="disc" textAlign="left">
                                            <ListItem color="gray.700">Timely adoption of accessible materials</ListItem>
                                            <ListItem color="gray.700">LMS and course website accessibility</ListItem>
                                            <ListItem color="gray.700">Support for faculty in creating accessible content</ListItem>
                                        </List>
                                    </Box>

                                    {/* Procurement */}
                                    <Box>
                                        <Text fontSize="md" fontWeight="semibold" color="teal.600" mb={2}>
                                            3. Procurement
                                        </Text>
                                        <List spacing={1} pl={6} styleType="disc" textAlign="left">
                                            <ListItem color="gray.700">Section 508 compliance for all ICT purchases</ListItem>
                                            <ListItem color="gray.700">Creation of Equally Effective Access Plans</ListItem>
                                            <ListItem color="gray.700">Training for procurement stakeholders</ListItem>
                                        </List>
                                    </Box>
                                </VStack>
                            </Box>

                            {/* Implementation Strategy */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={2}>
                                    Implementation Strategy
                                </Text>
                                <List spacing={2} pl={4} styleType="disc" textAlign="left">
                                    <ListItem color="gray.700">
                                        Uses a "capabilities maturity" approach focused on continuous improvement
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Requires strong administrative support through executive sponsorship
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Employs prioritization of projects based on impact and available resources
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Documents progress through annual reporting and assessment
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Focuses on both immediate accessibility needs and long-term institutional change
                                    </ListItem>
                                </List>
                            </Box>

                            {/* Campus Requirements */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={2}>
                                    Campus Requirements
                                </Text>
                                <List spacing={2} pl={4} styleType="disc" textAlign="left">
                                    <ListItem color="gray.700">Appoint an ATI executive sponsor</ListItem>
                                    <ListItem color="gray.700">Establish a campus ATI committee</ListItem>
                                    <ListItem color="gray.700">Develop and maintain annual implementation plans</ListItem>
                                    <ListItem color="gray.700">Submit regular progress reports</ListItem>
                                    <ListItem color="gray.700">
                                        Achieve baseline status of "Established" for key success indicators
                                    </ListItem>
                                </List>
                            </Box>
                        </VStack>
                    </AccordionPanel>
                </AccordionItem>

                {/* Status Levels Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">
                                Status Levels
                            </Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        {statusLevelsLoading ? (
                            <Spinner />
                        ) : statusLevelsError ? (
                            <Text color="red.500">{statusLevelsError}</Text>
                        ) : (
                            <VStack align="stretch" spacing={6}>
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

                                        return (
                                            <Box
                                                key={level.unique_id}
                                                borderLeft="4px"
                                                borderColor="teal.400"
                                                pl={4}
                                                py={2}
                                                bg="gray.50"
                                                borderRadius="md"
                                                boxShadow="sm"
                                            >
                                                {/* Status Level Name and Value */}
                                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={4}>
                                                    {level.status_level} ({level.status_value})
                                                </Text>

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
                                                            mb={4}
                                                            align="start"
                                                            direction={{ base: 'column', md: 'row' }}
                                                        >
                                                            {/* Left Box: Category Name */}
                                                            <Box
                                                                width={{ base: '100%', md: '30%' }}
                                                                pr={{ md: 4 }}
                                                                mb={{ base: 2, md: 0 }}
                                                            >
                                                                <Text fontWeight="semibold" fontSize="md" color="teal.600">
                                                                    {category.name}
                                                                </Text>
                                                            </Box>

                                                            {/* Right Box: Descriptions and Requirements */}
                                                            <Box width={{ base: '100%', md: '70%' }} textAlign="left">
                                                                {category.descriptions && category.descriptions.length > 0 && (
                                                                    <Box mb={2}>
                                                                        <Text fontWeight="semibold">Descriptions:</Text>
                                                                        <List spacing={1} pl={4} styleType="disc">
                                                                            {category.descriptions.map((item, index) => (
                                                                                <ListItem key={index} color="gray.700">
                                                                                    {item.description}
                                                                                </ListItem>
                                                                            ))}
                                                                        </List>
                                                                    </Box>
                                                                )}
                                                                {category.requirements && category.requirements.length > 0 && (
                                                                    <Box mb={2}>
                                                                        <Text fontWeight="semibold">Requirements:</Text>
                                                                        <List spacing={1} pl={4} styleType="disc">
                                                                            {category.requirements.map((item, index) => (
                                                                                <ListItem key={index} color="gray.700">
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
                                                        mb={4}
                                                        align="start"
                                                        direction={{ base: 'column', md: 'row' }}
                                                    >
                                                        {/* Left Box: Category Name */}
                                                        <Box
                                                            width={{ base: '100%', md: '30%' }}
                                                            pr={{ md: 4 }}
                                                            mb={{ base: 2, md: 0 }}
                                                        >
                                                            <Text fontWeight="semibold" fontSize="md" color="teal.600">
                                                                Notes
                                                            </Text>
                                                        </Box>

                                                        {/* Right Box: Notes Content */}
                                                        <Box width={{ base: '100%', md: '70%' }} textAlign="left">
                                                            <List spacing={1} pl={4} styleType="disc">
                                                                {level.notes.map((note, index) => (
                                                                    <ListItem key={index} color="gray.700">
                                                                        {note.content}
                                                                    </ListItem>
                                                                ))}
                                                            </List>
                                                        </Box>
                                                    </Flex>
                                                )}
                                            </Box>
                                        );
                                    })}
                            </VStack>
                        )}
                    </AccordionPanel>
                </AccordionItem>

                {/* Statistics Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">
                                Statistics
                            </Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        {loading || !stats ? (
                            <Spinner />
                        ) : (
                            <VStack align="stretch" spacing={6}>
                                {/* Working Group Metrics */}
                                <Box
                                    borderLeft="4px"
                                    borderColor="teal.400"
                                    pl={4}
                                    py={2}
                                    bg="gray.50"
                                    borderRadius="md"
                                    boxShadow="sm"
                                >
                                    <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                        Working Group Metrics
                                    </Text>
                                    <TableContainer>
                                        <Table variant="simple" size="sm">
                                            <Thead bg="gray.100">
                                                <Tr>
                                                    <Th>Working Group</Th>
                                                    <Th isNumeric>Goals</Th>
                                                    <Th isNumeric>Success Indicators</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                <Tr>
                                                    <Td>Web</Td>
                                                    <Td isNumeric>{stats.workingGroups.web.goals}</Td>
                                                    <Td isNumeric>{stats.workingGroups.web.indicators}</Td>
                                                </Tr>
                                                <Tr>
                                                    <Td>Instructional Materials</Td>
                                                    <Td isNumeric>{stats.workingGroups.instructionalMaterials.goals}</Td>
                                                    <Td isNumeric>{stats.workingGroups.instructionalMaterials.indicators}</Td>
                                                </Tr>
                                                <Tr>
                                                    <Td>Procurement</Td>
                                                    <Td isNumeric>{stats.workingGroups.procurement.goals}</Td>
                                                    <Td isNumeric>{stats.workingGroups.procurement.indicators}</Td>
                                                </Tr>
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </Box>

                                {/* Status Assignments */}
                                <Box
                                    borderLeft="4px"
                                    borderColor="teal.400"
                                    pl={4}
                                    py={2}
                                    bg="gray.50"
                                    borderRadius="md"
                                    boxShadow="sm"
                                >
                                    <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                        Status Assignments
                                    </Text>
                                    <TableContainer>
                                        <Table variant="simple" size="sm">
                                            <Thead bg="gray.100">
                                                <Tr>
                                                    <Th>Status Level</Th>
                                                    <Th isNumeric>Count</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {Object.entries(stats.statusLevels).map(([status, count]) => (
                                                    <Tr key={status}>
                                                        <Td>{status}</Td>
                                                        <Td isNumeric>{count}</Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </Box>

                                {/* Unassigned Evidence */}
                                <Box
                                    borderLeft="4px"
                                    borderColor="teal.400"
                                    pl={4}
                                    py={2}
                                    bg="gray.50"
                                    borderRadius="md"
                                    boxShadow="sm"
                                >
                                    <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={2}>
                                        Implementation Assignment
                                    </Text>
                                    <Text color="gray.700" mb={2}>
                                        Year Success Evidence nodes with no implementing person assigned:{' '}
                                        <Text as="span" fontWeight="bold">
                                            {stats.unassignedEvidence}
                                        </Text>
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Evidence nodes should have at least one person assigned to track implementation progress.
                                    </Text>
                                </Box>
                            </VStack>
                        )}
                    </AccordionPanel>
                </AccordionItem>

                {/* Committee Members Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">
                                Committee Members
                            </Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        {loading ? (
                            <Spinner size="md" />
                        ) : (
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                    Active Committee Members
                                </Text>
                                <TableContainer>
                                    <Table variant="simple" size="sm">
                                        <Thead bg="gray.100">
                                            <Tr>
                                                <Th>Name</Th>
                                                <Th>Role</Th>
                                                <Th>Groups</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {activeMembers.map((member) => (
                                                <Tr key={member.employee_id}>
                                                    <Td>{member.name}</Td>
                                                    <Td>{member.ati_role || 'Member'}</Td>
                                                    <Td>
                                                        {member.workingGroups
                                                            ?.map((group) =>
                                                                group.name === 'Instructional Materials'
                                                                    ? 'Ins'
                                                                    : group.name === 'Procurement'
                                                                        ? 'Pro'
                                                                        : 'Web'
                                                            )
                                                            .join(', ')}
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        )}
                    </AccordionPanel>
                </AccordionItem>

                {/* Knowledge Graph Overview Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">
                                ATI Knowledge Graph Overview
                            </Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <VStack align="stretch" spacing={6}>
                            {/* What is a Knowledge Graph */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontWeight="bold" fontSize="lg" color="teal.700" mb={2}>
                                    What is a Knowledge Graph?
                                </Text>
                                <Text color="gray.700" mb={4}>
                                    A knowledge graph is a network of interconnected data points and their relationships. Unlike
                                    traditional databases that store information in tables, knowledge graphs represent data as
                                    nodes (entities) connected by edges (relationships), allowing for complex relationship mapping
                                    and intuitive data exploration.
                                </Text>
                                <Text fontWeight="bold" fontSize="lg" color="teal.700" mb={2}>
                                    ATI Knowledge Organization
                                </Text>
                                <Text color="gray.700">
                                    The ATI Knowledge Graph structures accessibility initiatives through interconnected layers of
                                    governance, implementation, and evidence. At its core, it connects three primary working groups
                                    (Web, Instructional Materials, and Procurement) to specific goals and success indicators that
                                    measure progress toward accessibility compliance.
                                </Text>
                            </Box>

                            {/* Implementation Definitions */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontWeight="bold" fontSize="lg" color="teal.700" mb={2}>
                                    Implementation Definitions
                                </Text>
                                <Text color="gray.700" mb={4}>
                                    The ATI Knowledge Graph includes various implementation and documentation types that help structure and support accessibility initiatives. Below are simplified descriptions of each type:
                                </Text>

                                {/* Implementations */}
                                <Text fontWeight="semibold" fontSize="md" color="teal.600" mb={2}>
                                    Implementations
                                </Text>
                                <VStack align="stretch" spacing={3} mb={4}>
                                    <Box>
                                        <Text fontWeight="bold" color="teal.700">
                                            Internal Policy
                                        </Text>
                                        <Text color="gray.700">
                                            A set of rules and guidelines developed to ensure compliance with accessibility standards within the organization.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="teal.700">
                                            Process
                                        </Text>
                                        <Text color="gray.700">
                                            A series of actions or steps taken to achieve a specific accessibility goal or outcome. Likely in the form of an internal process document.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="teal.700">
                                            Project
                                        </Text>
                                        <Text color="gray.700">
                                            A temporary, focused effort to create a specific product or result that enhances accessibility. For example, the <Link href={'https://access.sfsu.edu/drupal-pdf-accessibility-review'}>Drupal PDF Accessibility Review.</Link>
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="teal.700">
                                            Procedure
                                        </Text>
                                        <Text color="gray.700">
                                            Detailed instructions on how to perform tasks to meet accessibility objectives consistently.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="teal.700">
                                            Service
                                        </Text>
                                        <Text color="gray.700">
                                            Ongoing support or assistance provided to ensure accessibility for individuals with disabilities. Example: <Link href={'https://access.sfsu.edu/amqc'}>accessible media quick converter</Link>.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="teal.700">
                                            Guidance
                                        </Text>
                                        <Text color="gray.700">
                                            Practical information like tips, power point presentations or FAQs that help users navigate accessibility resources and best practices.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="teal.700">
                                            Tracking
                                        </Text>
                                        <Text color="gray.700">
                                            Monitoring the progress of accessibility initiatives and implementations.
                                        </Text>
                                    </Box>
                                </VStack>
                            </Box>

                            {/* Power for Enterprise Technology Governance */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontWeight="bold" fontSize="lg" color="teal.700" mb={2}>
                                    Power for Enterprise Technology Governance
                                </Text>
                                <List spacing={2} pl={4} styleType="disc" textAlign="left">
                                    <ListItem color="gray.700">
                                        Captures complex relationships between people, processes, and documentation
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Enables tracking of historical changes and decision-making processes
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Facilitates discovery of indirect relationships and dependencies
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Supports compliance by maintaining clear audit trails
                                    </ListItem>
                                    <ListItem color="gray.700">
                                        Allows for flexible data modeling as requirements evolve
                                    </ListItem>
                                </List>
                            </Box>

                            {/* Graph Example Image */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <img
                                    src={require('../../../assets/img/graph-example.png')}
                                    alt="Instructional Materials Graph Example"
                                    style={{
                                        width: '100%',
                                        maxWidth: '800px',
                                        height: 'auto',
                                        margin: '0 auto',
                                        display: 'block',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Text fontSize="sm" color="gray.600" textAlign="center" mt={2}>
                                    Example: Instructional Materials Knowledge Graph Structure
                                </Text>
                            </Box>

                            {/* ATI Knowledge Organization Relationships */}
                            <Box
                                borderLeft="4px"
                                borderColor="teal.400"
                                pl={4}
                                py={2}
                                bg="gray.50"
                                borderRadius="md"
                                boxShadow="sm"
                            >
                                <Text fontWeight="bold" fontSize="lg" color="teal.700" mb={4}>
                                    ATI Knowledge Organization
                                </Text>
                                <Text color="gray.700" mb={4}>
                                    The ATI Knowledge Graph structures accessibility initiatives through the following key
                                    relationships:
                                </Text>
                                <VStack align="stretch" spacing={4}>
                                    {/* Relationship Items */}
                                    {[
                                        {
                                            title: 'Working Group Structure',
                                            description:
                                                'Organizes the three main areas: Web, Instructional Materials, and Procurement',
                                            code: `ATIWorkingGroup --[responsible_for]--> Goal <--[supported_by]-- SuccessIndicator`
                                        },
                                        {
                                            title: 'Evidence Collection',
                                            description:
                                                'Tracks annual progress and compliance through yearly evidence nodes',
                                            code: `SuccessIndicator <--[tracks]-- YearSuccessEvidence --[evidence_in_year]--> AcademicYear`
                                        },
                                        {
                                            title: 'Implementation Tracking',
                                            description:
                                                'Links concrete implementations to success indicators',
                                            code: `YearSuccessEvidence <--[is_evidence_for]-- {Process, Project, Service, Procedure, ...}`
                                        },
                                        {
                                            title: 'Documentation Chain',
                                            description:
                                                'Maintains comprehensive documentation and evidence trail',
                                            code: `Implementation <--[is_documented_by]-- {Document, Webpage, Note, Message, Metric}`
                                        },
                                        {
                                            title: 'Committee Oversight',
                                            description:
                                                'Assigns responsibility and tracks contributions to accessibility goals',
                                            code: `Person --[implements]--> YearSuccessEvidence`
                                        }
                                    ].map((item, index) => (
                                        <Box key={index}>
                                            <Text fontWeight="semibold" color="teal.600" mb={2}>
                                                {item.title}
                                            </Text>
                                            <Box
                                                bg="gray.100"
                                                p={3}
                                                borderRadius="md"
                                                fontFamily="mono"
                                                fontSize="sm"
                                                border="1px"
                                                borderColor="gray.200"
                                            >
                                                <Text color="gray.800">{item.code}</Text>
                                            </Box>
                                            <Text fontSize="sm" color="gray.600" mt={2}>
                                                {item.description}
                                            </Text>
                                        </Box>
                                    ))}
                                </VStack>
                            </Box>
                        </VStack>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box>
    );
}

export default ATIOverview;
