import React from 'react';
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
    VStack
} from '@chakra-ui/react';

function ATIOverview() {
    return (
        <Box maxW="800px" mx="auto" p={6}>
            {/* Main Heading */}
            <Heading as="h2" size="xl" mb={6} textAlign="center">
                About This Project
            </Heading>

            {/* Accordion for content sections */}
            <Accordion allowToggle defaultIndex={[0]}>
                {/* Project Overview Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">Project Overview</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Text>
                            FIRST PRINCIPLAS!~!

                            This internal enterprise knowledge graph system is designed to manage and structure large datasets
                            related to business processes, making data more accessible, searchable, and linked across departments.
                            It helps streamline workflows and provides valuable insights into company operations.
                        </Text>
                    </AccordionPanel>
                </AccordionItem>

                {/* Knowledge Graph Architecture Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">Knowledge Graph Architecture</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Text>
                            The knowledge graph is built on a graph database architecture using Neo4j. The graph structure consists of
                            nodes (representing entities such as people, documents, and processes) and edges (representing relationships
                            between these nodes). This allows for highly efficient querying and visualizing complex relationships,
                            making it easier to understand dependencies and relationships between different data points.
                        </Text>
                    </AccordionPanel>
                </AccordionItem>

                {/* Technologies Used Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">Technologies Used</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <VStack align="start">
                            <Text><strong>Frontend:</strong> React (with Chakra UI)</Text>
                            <Text><strong>Backend:</strong> Python (Flask, FastAPI)</Text>
                            <Text><strong>Database:</strong> Neo4j for graph database, PostgreSQL for other relational data</Text>
                            <Text><strong>Data Visualization:</strong> D3.js for custom graph visualizations</Text>
                            <Text><strong>Deployment:</strong> Docker, Kubernetes for scalable containerized applications</Text>
                        </VStack>
                    </AccordionPanel>
                </AccordionItem>

                {/* Data Sources Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">Data Sources and Integration</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Text>
                            Data is ingested from multiple sources:
                        </Text>
                        <VStack align="start" mt={2}>
                            <Text>- **Internal ERP Systems**: Business, financial, and operational data from our internal ERP systems</Text>
                            <Text>- **External APIs**: Market data and compliance information from third-party APIs</Text>
                            <Text>- **Manual Inputs**: User-generated data such as meeting notes and feedback, linked to relevant processes</Text>
                        </VStack>
                    </AccordionPanel>
                </AccordionItem>

                {/* Access Control Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">Access Control and Security</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Text>
                            The system implements strict role-based access control (RBAC) using OAuth2 for authentication.
                            Only authorized users can access specific datasets, and all data is encrypted both in transit and at rest.
                        </Text>
                    </AccordionPanel>
                </AccordionItem>

                {/* Documentation Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">Documentation and Resources</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Text>
                            For more details about the system architecture, API design, and best practices, please refer to our internal documentation:
                        </Text>
                        <Link href="https://internal.documentation.url" color="teal.500" isExternal mt={2}>
                            View Documentation
                        </Link>
                    </AccordionPanel>
                </AccordionItem>

                {/* Contact Section */}
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="md">Contact Information</Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Text>
                            For support or to report issues with the system, please contact:
                        </Text>
                        <Link href="mailto:devteam@company.com" color="teal.500" mt={2}>
                            devteam@company.com
                        </Link>
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box>
    );
}

export default ATIOverview;
