import React, {useContext, useEffect, useState} from 'react';
import {
    Box,
    Heading,
    Text,
    Link,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon,
    Divider,
    VStack, Spinner, TableContainer, Table, Thead, Tr, Th, Tbody, Td
} from '@chakra-ui/react';
import {DataContext} from "../../../context/DataContext";

const calculateStatistics = (data) => {
    const stats = {
        workingGroups: {
            web: { goals: 0, indicators: 0 },
            instructionalMaterials: { goals: 0, indicators: 0 },
            procurement: { goals: 0, indicators: 0 }
        },
        statusLevels: {
            'Not Started': 0,
            'Initiated': 0,
            'Defined': 0,
            'Established': 0,
            'Managed': 0,
            'Optimizing': 0
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
        <Box width="1000px" mx="auto" p={6}>
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                ATI Overview
            </Heading>

            <Accordion
                width="1000px"
                sx={{
                    width: '100%',  // Add width to sx
                    '.chakra-accordion__item': {
                        width: '100%',
                        borderRadius: 'md',
                        mb: 2,
                        border: '1px solid',
                        borderColor: 'gray.200'
                    },
                    '.chakra-accordion__panel': {
                        width: '100%',
                        px: 6,
                        pb: 6
                    },
                    '.chakra-accordion__button': {
                        width: '100%',
                        bg: 'gray.50',
                        _hover: {
                            bg: 'gray.100'
                        }
                    }
                }}

                allowToggle defaultIndex={[0]}>
                {/* ATI Overview Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">ATI Overview</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={6}>
                        <VStack align="stretch" spacing={8} width="100%">
                            {/* Vision and Purpose */}
                            <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                    Vision and Purpose
                                </Text>
                                <Text lineHeight="tall" color="gray.700">
                                    The Accessible Technology Initiative (ATI) represents the CSU's commitment to providing
                                    equal access to information technology and services for all students, staff, faculty,
                                    and the general public, as mandated by the ADA, Section 504, and Section 508 of the
                                    Rehabilitation Act.
                                </Text>
                            </Box>

                            {/* Core Principles */}
                            <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                    Core Principles
                                </Text>
                                <VStack align="start" spacing={3} pl={4}>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Technology accessibility is an institution-wide responsibility requiring leadership commitment
                                    </Text>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Technology must provide equal access and benefits for individuals with disabilities
                                    </Text>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Universal Design principles should reduce the need for individual accommodations
                                    </Text>
                                </VStack>
                            </Box>

                            {/* Priority Areas */}
                            <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={4}>
                                    Three Priority Areas
                                </Text>

                                <VStack align="stretch" spacing={6}>
                                    <Box>
                                        <Text fontSize="md" fontWeight="semibold" color="teal.600" mb={2}>
                                            1. Web Accessibility
                                        </Text>
                                        <VStack align="start" spacing={2} pl={6}>
                                            <Text lineHeight="tall" color="gray.700">• Evaluation and repair of inaccessible content</Text>
                                            <Text lineHeight="tall" color="gray.700">• Ensuring new development complies with Section 508</Text>
                                            <Text lineHeight="tall" color="gray.700">• Ongoing monitoring and maintenance</Text>
                                        </VStack>
                                    </Box>

                                    <Box>
                                        <Text fontSize="md" fontWeight="semibold" color="teal.600" mb={2}>
                                            2. Instructional Materials
                                        </Text>
                                        <VStack align="start" spacing={2} pl={6}>
                                            <Text lineHeight="tall" color="gray.700">• Timely adoption of accessible materials</Text>
                                            <Text lineHeight="tall" color="gray.700">• LMS and course website accessibility</Text>
                                            <Text lineHeight="tall" color="gray.700">• Support for faculty in creating accessible content</Text>
                                        </VStack>
                                    </Box>

                                    <Box>
                                        <Text fontSize="md" fontWeight="semibold" color="teal.600" mb={2}>
                                            3. Procurement
                                        </Text>
                                        <VStack align="start" spacing={2} pl={6}>
                                            <Text lineHeight="tall" color="gray.700">• Section 508 compliance for all ICT purchases</Text>
                                            <Text lineHeight="tall" color="gray.700">• Creation of Equally Effective Access Plans</Text>
                                            <Text lineHeight="tall" color="gray.700">• Training for procurement stakeholders</Text>
                                        </VStack>
                                    </Box>
                                </VStack>
                            </Box>

                            {/* Implementation Strategy */}
                            <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                    Implementation Strategy
                                </Text>
                                <VStack align="start" spacing={3} pl={4}>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Uses a "capabilities maturity" approach focused on continuous improvement
                                    </Text>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Requires strong administrative support through executive sponsorship
                                    </Text>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Employs prioritization of projects based on impact and available resources
                                    </Text>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Documents progress through annual reporting and assessment
                                    </Text>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Focuses on both immediate accessibility needs and long-term institutional change
                                    </Text>
                                </VStack>
                            </Box>

                            {/* Campus Requirements */}
                            <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                    Campus Requirements
                                </Text>
                                <VStack align="start" spacing={3} pl={4}>
                                    <Text lineHeight="tall" color="gray.700">• Appoint an ATI executive sponsor</Text>
                                    <Text lineHeight="tall" color="gray.700">• Establish a campus ATI committee</Text>
                                    <Text lineHeight="tall" color="gray.700">• Develop and maintain annual implementation plans</Text>
                                    <Text lineHeight="tall" color="gray.700">• Submit regular progress reports</Text>
                                    <Text lineHeight="tall" color="gray.700">
                                        • Achieve baseline status of "Established" for key success indicators
                                    </Text>
                                </VStack>
                            </Box>
                        </VStack>
                    </AccordionPanel>
                </AccordionItem>
                {/* Instructions Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">Instructions</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Text>Using this ATI reporting tool:</Text>
                        <VStack align="start" mt={2} pl={4}>
                            <Text>1. Select a working group (Web, Instructional Materials, or Procurement)</Text>
                            <Text>2. Review success indicators for your area</Text>
                            <Text>3. Add notes, messages, or plans to document progress</Text>
                            <Text>4. Update status levels as work progresses</Text>
                            <Text>5. Attach evidence and documentation as needed</Text>
                        </VStack>
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
                    <AccordionPanel pb={6}>
                        {loading || !stats ? (
                            <Spinner />
                        ) : (
                            <VStack align="stretch" spacing={8}>
                                {/* Goals and Indicators by Group */}
                                <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                    <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                        Working Group Metrics
                                    </Text>
                                    <TableContainer>
                                        <Table variant="simple" size="sm">
                                            <Thead bg="gray.50">
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

                                {/* Implementation Status */}
                                <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                    <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                        Status Assignments
                                    </Text>
                                    <TableContainer>
                                        <Table variant="simple" size="sm">
                                            <Thead bg="gray.50">
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
                                <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                    <Text fontSize="lg" fontWeight="bold" color="teal.700" mb={3}>
                                        Implementation Assignment
                                    </Text>
                                    <Text mb={2}>
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
                            <Heading as="h3" size="md">Committee Members</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        {loading ? (
                            <Spinner size="md" />
                        ) : (
                            <>
                                <TableContainer>
                                    <Table variant="simple" size="sm">
                                        <Thead>
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
                                                        {member.workingGroups?.map(group =>
                                                            group.name === 'Instructional Materials' ? 'Ins' :
                                                                group.name === 'Procurement' ? 'Pro' :
                                                                    'Web'
                                                        ).join(', ')}
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </AccordionPanel>
                </AccordionItem>

                {/* Important Stats Section */}
                {/* Knowledge Graph Overview Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">ATI Knowledge Graph Overview</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        {/* What is a Knowledge Graph */}
                        <Box mb={4}>
                            <Text fontWeight="bold" mb={2}>What is a Knowledge Graph?</Text>
                            <Text mb={4}>
                                A knowledge graph is a network of interconnected data points and their relationships. Unlike
                                traditional databases that store information in tables, knowledge graphs represent data as
                                nodes (entities) connected by edges (relationships), allowing for complex relationship mapping
                                and intuitive data exploration.
                            </Text>
                            <Box mb={4}>
                                <Text fontWeight="bold" mb={2}>ATI Knowledge Organization</Text>
                                <Text mb={4}>
                                    The ATI Knowledge Graph structures accessibility initiatives through interconnected layers of governance, implementation, and evidence.
                                    At its core, it connects three primary working groups (Web, Instructional Materials, and Procurement) to specific goals and success
                                    indicators that measure progress toward accessibility compliance. Each success indicator is tracked annually through year-specific
                                    evidence nodes, which link to concrete implementations like processes, procedures, projects, and services that demonstrate how the
                                    campus is meeting its accessibility obligations. Supporting documentation, including notes, messages, and metrics, are attached to
                                    these implementations, creating a complete audit trail for each accessibility requirement. This structure allows committee members,
                                    assigned through person nodes with specific roles and working group relationships, to effectively track progress, collaborate on
                                    initiatives, and maintain comprehensive documentation of ATI efforts over time.
                                </Text>
                            </Box>
                            {/* Why it's Powerful */}
                            <Box mb={4}>
                                <Text fontWeight="bold" mb={2}>Power for Enterprise Technology Governance</Text>
                                <VStack align="start" spacing={2} pl={4}>
                                    <Text>• Captures complex relationships between people, processes, and documentation</Text>
                                    <Text>• Enables tracking of historical changes and decision-making processes</Text>
                                    <Text>• Facilitates discovery of indirect relationships and dependencies</Text>
                                    <Text>• Supports compliance by maintaining clear audit trails</Text>
                                    <Text>• Allows for flexible data modeling as requirements evolve</Text>
                                </VStack>
                            </Box>
                            <Box mb={4}>
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
                        </Box>

                        {/* What it Tracks */}
                        <Box mb={4}>
                            <Text fontWeight="bold" fontSize="lg" mb={4}>ATI Knowledge Organization</Text>
                            <Text mb={6} lineHeight="tall">
                                The ATI Knowledge Graph structures accessibility initiatives through the following key relationships:
                            </Text>

                            <VStack align="stretch" spacing={6} pl={4}>
                                <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                    <Text fontWeight="semibold" mb={2} color="teal.700">Working Group Structure</Text>
                                    <Box
                                        bg="gray.50"
                                        p={3}
                                        borderRadius="md"
                                        fontFamily="mono"
                                        fontSize="sm"
                                        border="1px"
                                        borderColor="gray.200"
                                    >
                                        <Text color="gray.800">
                                            ATIWorkingGroup --[responsible_for]--&gt; Goal &lt;--[supported_by]-- SuccessIndicator
                                        </Text>
                                    </Box>
                                    <Text fontSize="sm" color="gray.600" mt={3} lineHeight="tall">
                                        Organizes the three main areas: Web, Instructional Materials, and Procurement
                                    </Text>
                                </Box>

                                <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                    <Text fontWeight="semibold" mb={2} color="teal.700">Evidence Collection</Text>
                                    <Box
                                        bg="gray.50"
                                        p={3}
                                        borderRadius="md"
                                        fontFamily="mono"
                                        fontSize="sm"
                                        border="1px"
                                        borderColor="gray.200"
                                    >
                                        <Text color="gray.800">
                                            SuccessIndicator &lt;--[tracks]-- YearSuccessEvidence --[evidence_in_year]--&gt; AcademicYear
                                        </Text>
                                    </Box>
                                    <Text fontSize="sm" color="gray.600" mt={3} lineHeight="tall">
                                        Tracks annual progress and compliance through yearly evidence nodes
                                    </Text>
                                </Box>

                                <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                    <Text fontWeight="semibold" mb={2} color="teal.700">Implementation Tracking</Text>
                                    <Box
                                        bg="gray.50"
                                        p={3}
                                        borderRadius="md"
                                        fontFamily="mono"
                                        fontSize="sm"
                                        border="1px"
                                        borderColor="gray.200"
                                    >
                                        <Text color="gray.800">
                                            YearSuccessEvidence &lt;--[is_evidence_for]-- {'{Process, Project, Service, Procedure, ...}'}
                                        </Text>
                                    </Box>
                                    <Text fontSize="sm" color="gray.600" mt={3} lineHeight="tall">
                                        Links concrete implementations to success indicators
                                    </Text>
                                </Box>

                                <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                    <Text fontWeight="semibold" mb={2} color="teal.700">Documentation Chain</Text>
                                    <Box
                                        bg="gray.50"
                                        p={3}
                                        borderRadius="md"
                                        fontFamily="mono"
                                        fontSize="sm"
                                        border="1px"
                                        borderColor="gray.200"
                                    >
                                        <Text color="gray.800">
                                            Implementation &lt;--[is_documented_by]-- {'{Document, Webpage, Note, Message, Metric}'}
                                        </Text>
                                    </Box>
                                    <Text fontSize="sm" color="gray.600" mt={3} lineHeight="tall">
                                        Maintains comprehensive documentation and evidence trail
                                    </Text>
                                </Box>

                                <Box borderLeft="2px" borderColor="teal.200" pl={4} py={2}>
                                    <Text fontWeight="semibold" mb={2} color="teal.700">Committee Oversight</Text>
                                    <Box
                                        bg="gray.50"
                                        p={3}
                                        borderRadius="md"
                                        fontFamily="mono"
                                        fontSize="sm"
                                        border="1px"
                                        borderColor="gray.200"
                                    >
                                        <Text color="gray.800">
                                            Person --[implements]--&gt; YearSuccessEvidence
                                        </Text>
                                    </Box>
                                    <Text fontSize="sm" color="gray.600" mt={3} lineHeight="tall">
                                        Assigns responsibility and tracks contributions to accessibility goals
                                    </Text>
                                </Box>
                            </VStack>
                        </Box>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box>
    );
}

export default ATIOverview;