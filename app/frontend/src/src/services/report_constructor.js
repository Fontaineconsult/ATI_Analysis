import React from 'react';
import {
    Box,
    Text,
    Heading,
    Badge,
    List,
    ListItem,
    Divider,
    Stack,
    Link,
    VStack,
    HStack,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td
} from '@chakra-ui/react';
import {useNavigate} from "react-router-dom";

let datas = {
    "persons": [
        {
            "id": "201",
            "type": "node",
            "labels": [
                "Person"
            ],
            "properties": {
                "employee_id": "904406079",
                "name": "Ed Daranciang",
                "title": "Web Accessibility Coordinator",
                "email": "eddaranciang@sfsu.edu"
            }
        }
    ],
    "adminReviewers": [],
    "evidence": {
        "id": "495",
        "type": "node",
        "labels": [
            "YearSuccessEvidence"
        ],
        "properties": {
            "year_identifier": "2022-2023-1.12-web"
        }
    },
    "has_notes": [
        {
            "note": {
                "id": "393",
                "type": "node",
                "labels": [
                    "Note"
                ],
                "properties": {
                    "include_in_report": true,
                    "name": "A cool note with a plans",
                    "depreciated": false,
                    "content": "Some cool note stuff"
                }
            },
            "created_by": null
        },
        {
            "note": {
                "id": "508",
                "type": "node",
                "labels": [
                    "Note"
                ],
                "properties": {
                    "include_in_report": true,
                    "date_created": "2024-10-07",
                    "name": "Users may sign up for a verbit account.",
                    "depreciated": false,
                    "content": "Users may sign up for a verbit account.testgtgth"
                }
            },
            "created_by": null
        }
    ],
    "has_messages": [],
    "has_metrics": [],
    "statusLevel": {
        "id": "200",
        "type": "node",
        "labels": [
            "StatusLevel"
        ],
        "properties": {
            "description_of_documentation_evidence": "• Include link to milestones and measures documentation or location of process document on internal drive\n• Include link to documentation or location of process document on internal drive",
            "status_value": "4",
            "description_of_procedures": "Campus has a mature practice.  Additional procedures are in place to track and capture success indicators (milestones and measures of success)",
            "description_of_documentation": "Documentation is complete and fully reflects the standard practice.\n• Documented milestones and measures of success.\n• Process documentation is stored in a campus electronic location and process has been communicated to the campus.",
            "description_of_resources": "Resources have been both identified and allocated.\n• Identified measures of success and collected success data\n• ATI tasks have been added to campus job descriptions\n• New positions have been created as needed.\n• Budget allocated for ATI processes",
            "status_level": "Managed"
        }
    },
    "evidenceTypes": [
        {
            "msgs": [],
            "notes": [],
            "docs": [
                {
                    "id": "308",
                    "type": "node",
                    "labels": [
                        "Document"
                    ],
                    "properties": {
                        "file_path": "",
                        "uri_path": "https://access.sfsu.edu/sites/default/files/documents/Web_Manual_Evaluation_Summary.docx ",
                        "name": "Web Manual Evaluation Summary",
                        "is_administrative_review_documentation": "False",
                        "is_milestone_and_measures_documentation": "False"
                    }
                }
            ],
            "evidenceType": {
                "id": "307",
                "type": "node",
                "labels": [
                    "Guidance"
                ],
                "properties": {
                    "description": "Public Guidance about Manual Web Accessibility Evaluations",
                    "title": "Public Guidance about Manual Web Accessibility Evaluations"
                }
            },
            "webs": [],
            "metrics": [],
            "type": "Guidance"
        },
        {
            "msgs": [],
            "notes": [],
            "docs": [
                {
                    "id": "292",
                    "type": "node",
                    "labels": [
                        "Document"
                    ],
                    "properties": {
                        "file_path": "https://sfsu.box.com/s/5led4xjthrrblh8lbvda4p1chiodjmrc",
                        "uri_path": "",
                        "name": "Web Accessibility Process Document V1",
                        "is_administrative_review_documentation": "False",
                        "is_milestone_and_measures_documentation": "False"
                    }
                }
            ],
            "evidenceType": {
                "id": "293",
                "type": "node",
                "labels": [
                    "Process"
                ],
                "properties": {
                    "description": "This is the primary process for web accessibility at SF State",
                    "title": "Web Accessibility Process"
                }
            },
            "webs": [],
            "metrics": [],
            "type": "Process"
        }
    ]
}



function generateReport(evidenceItem) {
    let report = '';

    // If the evidenceItem has an indicator, extract indicator information
    if (evidenceItem.indicator) {
        const indicatorProps = evidenceItem.indicator.properties;
        report += `Success Indicator ${indicatorProps.number}: ${indicatorProps.success_indicator}\n`;
        report += `Composite Key: ${indicatorProps.composite_key}\n`;
        report += `Removed: ${indicatorProps.removed ? 'Yes' : 'No'}\n`;
        report += `Date Added: ${indicatorProps.date_added}\n\n`;
    }

    // Since we're working with a single evidence item, process it directly
    report += `Evidence:\n`;

    // Evidence properties
    const evidenceProps = evidenceItem.evidence.properties;
    report += `  Year Identifier: ${evidenceProps.year_identifier}\n`;

    // Status Level
    if (evidenceItem.statusLevel) {
        const statusProps = evidenceItem.statusLevel.properties;
        report += `  Status Level: ${statusProps.status_level}\n`;
    }

    // Persons involved
    if (evidenceItem.persons && evidenceItem.persons.length > 0) {
        report += `  Persons Involved:\n`;
        evidenceItem.persons.forEach((person) => {
            const personProps = person.properties;
            report += `    - Name: ${personProps.name}, Title: ${personProps.title}, Email: ${personProps.email}\n`;
        });
    }

    // Admin Reviewers
    if (evidenceItem.adminReviewers && evidenceItem.adminReviewers.length > 0) {
        report += `  Admin Reviewers:\n`;
        evidenceItem.adminReviewers.forEach((reviewer) => {
            const reviewerProps = reviewer.properties;
            report += `    - Name: ${reviewerProps.name}, Title: ${reviewerProps.title}, Email: ${reviewerProps.email}\n`;
        });
    }

    // Notes
    if (evidenceItem.has_notes && evidenceItem.has_notes.length > 0) {
        report += `  Notes:\n`;
        evidenceItem.has_notes.forEach((noteItem) => {
            const noteProps = noteItem.note.properties;
            const noteDate = noteProps.date_created || 'N/A';
            report += `    - ${noteDate}: ${noteProps.content}\n`;
            if (noteItem.created_by) {
                const creatorProps = noteItem.created_by.properties;
                report += `      (Created by: ${creatorProps.name})\n`;
            }
        });
    }

    // Messages
    if (evidenceItem.has_messages && evidenceItem.has_messages.length > 0) {
        report += `  Messages:\n`;
        evidenceItem.has_messages.forEach((messageItem) => {
            const messageProps = messageItem.message.properties;
            const messageDate = messageProps.date_sent || 'N/A';
            report += `    - ${messageDate}: ${messageProps.content}\n`;
            if (messageItem.created_by) {
                const creatorProps = messageItem.created_by.properties;
                report += `      (Sent by: ${creatorProps.name})\n`;
            }
        });
    }

    // Metrics
    if (evidenceItem.has_metrics && evidenceItem.has_metrics.length > 0) {
        report += `  Metrics:\n`;
        evidenceItem.has_metrics.forEach((metricItem) => {
            const metricProps = metricItem.metric.properties;
            report += `    - Metric: ${metricProps.name}, Value: ${metricProps.value}\n`;
            if (metricItem.created_by) {
                const creatorProps = metricItem.created_by.properties;
                report += `      (Recorded by: ${creatorProps.name})\n`;
            }
        });
    }

    // Evidence Types
    if (evidenceItem.evidenceTypes && evidenceItem.evidenceTypes.length > 0) {
        report += `  Evidence Types:\n`;
        evidenceItem.evidenceTypes.forEach((etype) => {
            report += `    - Type: ${etype.type || 'N/A'}\n`;
            if (etype.evidenceType) {
                const etypeProps = etype.evidenceType.properties;
                report += `      Title: ${etypeProps.title}\n`;
                report += `      Description: ${etypeProps.description}\n`;
            }

            // Documents
            if (etype.docs && etype.docs.length > 0) {
                report += `      Documents:\n`;
                etype.docs.forEach((doc) => {
                    const docProps = doc.properties;
                    report += `        * ${docProps.name}: ${docProps.file_path || docProps.uri_path}\n`;
                });
            }

            // Notes
            if (etype.notes && etype.notes.length > 0) {
                report += `      Notes:\n`;
                etype.notes.forEach((note) => {
                    const noteProps = note.properties;
                    const noteDate = noteProps.date_created || 'N/A';
                    report += `        * ${noteDate}: ${noteProps.content}\n`;
                });
            }

            // Messages
            if (etype.msgs && etype.msgs.length > 0) {
                report += `      Messages:\n`;
                etype.msgs.forEach((msg) => {
                    const msgProps = msg.properties;
                    const msgDate = msgProps.date_sent || 'N/A';
                    report += `        * ${msgDate}: ${msgProps.content}\n`;
                });
            }

            // Metrics
            if (etype.metrics && etype.metrics.length > 0) {
                report += `      Metrics:\n`;
                etype.metrics.forEach((metric) => {
                    const metricProps = metric.properties;
                    report += `        * Metric: ${metricProps.name}, Value: ${metricProps.value}\n`;
                });
            }

            // Webpages
            if (etype.webs && etype.webs.length > 0) {
                report += `      Webpages:\n`;
                etype.webs.forEach((web) => {
                    const webProps = web.properties;
                    report += `        * ${webProps.title}: ${webProps.url}\n`;
                });
            }
        });
    }

    report += '\n'; // Add space after the evidence

    return report;
}

function GenerateReportComponent({ evidenceItem }) {


    const navigate = useNavigate();


    const handleImplementationClick = (type, uniqueId) => {
        if (uniqueId) {
            navigate(`/ati-explorer/implementations/${type}/${uniqueId}`);
        }
    };

    // Helper function to filter arrays based on include_in_report
    const filterByIncludeInReport = (array, itemKey = 'properties') => {
        return (array || []).filter((item) => {
            if (!item) return false;

            // Handle nested property access for notes/messages/metrics
            if (itemKey.includes('.')) {
                const keys = itemKey.split('.');
                let value = item;
                for (const key of keys) {
                    value = value?.[key];
                    if (!value) return false;
                }
                return value.include_in_report !== false;
            }

            if (!item[itemKey]) return false;
            if (item[itemKey].include_in_report === false) return false;
            return true;
        });
    };

    // Filter main-level items
    const filteredNotes = filterByIncludeInReport(evidenceItem.has_notes || [], 'note.properties');
    const filteredMessages = filterByIncludeInReport(evidenceItem.has_messages || [], 'message.properties');
    const filteredMetrics = filterByIncludeInReport(evidenceItem.has_metrics || [], 'metric.properties');

    // Filter evidenceTypes and their nested content
    const filteredEvidenceTypes = (evidenceItem.evidenceTypes || []).map((etype) => {
        return {
            ...etype,
            docs: filterByIncludeInReport(etype.docs, 'properties'),
            webs: filterByIncludeInReport(etype.webs, 'properties'),
            notes: filterByIncludeInReport(etype.notes, 'properties'),
            msgs: filterByIncludeInReport(etype.msgs, 'properties'),
            metrics: filterByIncludeInReport(etype.metrics, 'properties'),
        };
    }).filter(et => {
        const hasContent = et.docs?.length || et.webs?.length ||
            et.notes?.length || et.msgs?.length || et.metrics?.length;
        return hasContent;
    });

    return (
        <Box p={4} bg="white" fontSize="sm" textAlign="left">
            <VStack align="stretch" spacing={0}>

                {/* Indicator Information */}
                {evidenceItem.indicator?.properties && (
                    <>
                        <Box>
                            <Heading as="h2" size="md" color="gray.800">
                                Success Indicator {evidenceItem.indicator.properties.number}
                            </Heading>
                            <Text fontSize="sm" color="gray.700" mb={1}>
                                {evidenceItem.indicator.properties.success_indicator}
                            </Text>
                            <Text fontSize="xs" color="gray.700">
                                <Text as="span" fontWeight="semibold">Composite Key:</Text> {evidenceItem.indicator.properties.composite_key}
                            </Text>
                            <Text fontSize="xs" color="gray.700">
                                <Text as="span" fontWeight="semibold">Status:</Text> {evidenceItem.indicator.properties.removed ? 'Removed' : 'Active'} |
                                <Text as="span" fontWeight="semibold"> Date Added:</Text> {evidenceItem.indicator.properties.date_added}
                            </Text>
                        </Box>
                        <Box height="16px" /> {/* Visual break */}
                    </>
                )}

                {/* Evidence Information */}
                {evidenceItem.evidence?.properties && (
                    <>
                        <Box>
                            <Heading as="h3" size="sm" color="teal.700" mb={2}>
                                Evidence Information
                            </Heading>

                            <Text fontSize="xs" color="gray.700" mb={1}>
                                <Text as="span" fontWeight="semibold">Year:</Text> {evidenceItem.evidence.properties.year_identifier}
                            </Text>
                            {evidenceItem.statusLevel?.properties && (
                                <Text fontSize="xs" color="gray.700" mb={1}>
                                    <Text as="span" fontWeight="semibold">Status Level:</Text> {evidenceItem.statusLevel.properties.status_level}
                                </Text>
                            )}
                            {'administrative_review_complete' in evidenceItem.evidence.properties && (
                                <Text fontSize="xs" color="gray.700" mb={2}>
                                    <Text as="span" fontWeight="semibold">Admin Review:</Text> {
                                    evidenceItem.evidence.properties.administrative_review_complete ? 'Complete' : 'Pending'
                                }
                                    {evidenceItem.evidence.properties.administrative_review_completed_date &&
                                        ` (${evidenceItem.evidence.properties.administrative_review_completed_date})`
                                    }
                                </Text>
                            )}

                            {/* Persons */}
                            {evidenceItem.persons?.length > 0 && (
                                <Box mb={2}>
                                    <Heading as="h4" size="xs" color="gray.700" mb={1}>
                                        Persons Involved:
                                    </Heading>
                                    {evidenceItem.persons.map((person) => (
                                        <Text key={person.id} fontSize="xs" color="gray.700" pl={3}>
                                            • {person.properties.name} - {person.properties.title} ({person.properties.email})
                                        </Text>
                                    ))}
                                </Box>
                            )}

                            {/* Admin Reviewers */}
                            {evidenceItem.adminReviewers?.length > 0 && (
                                <Box>
                                    <Heading as="h4" size="xs" color="gray.700" mb={1}>
                                        Admin Reviewers:
                                    </Heading>
                                    {evidenceItem.adminReviewers.map((reviewer) => (
                                        <Text key={reviewer.id} fontSize="xs" color="gray.700" pl={3}>
                                            • {reviewer.properties.name} - {reviewer.properties.title}
                                        </Text>
                                    ))}
                                </Box>
                            )}
                        </Box>
                        <Box height="16px" /> {/* Visual break */}
                    </>
                )}

                {/* Notes */}
                {filteredNotes.length > 0 && (
                    <>
                        <Box>
                            <Heading as="h3" size="sm" color="teal.700" mb={2}>
                                Notes ({filteredNotes.length})
                            </Heading>
                            <Stack spacing={2}>
                                {filteredNotes.map((noteItem, index) => {
                                    const noteProps = noteItem.note.properties;
                                    return (
                                        <Box key={index} pl={3} borderLeft="3px solid" borderLeftColor="gray.200">
                                            <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                                                {noteProps.date_created || 'No date'}
                                                {noteItem.created_by?.properties &&
                                                    <Text as="span" fontWeight="normal"> - {noteItem.created_by.properties.name}</Text>
                                                }
                                            </Text>
                                            <Text fontSize="xs" color="gray.700" mt={1}>
                                                {noteProps.content}
                                            </Text>
                                            {(noteProps.file_path || noteProps.uri_path) && (
                                                <Link
                                                    href={noteProps.file_path || noteProps.uri_path}
                                                    isExternal
                                                    color="teal.600"
                                                    fontSize="xs"
                                                    mt={1}
                                                    display="inline-block"
                                                >
                                                    📎 {noteProps.name || 'Attachment'}
                                                </Link>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                        <Box height="16px" /> {/* Visual break */}
                    </>
                )}

                {/* Messages */}
                {filteredMessages.length > 0 && (
                    <>
                        <Box>
                            <Heading as="h3" size="sm" color="teal.700" mb={2}>
                                Messages ({filteredMessages.length})
                            </Heading>
                            <Stack spacing={2}>
                                {filteredMessages.map((messageItem, index) => {
                                    const messageProps = messageItem.message.properties;
                                    return (
                                        <Box key={index} pl={3} borderLeft="3px solid" borderLeftColor="gray.200">
                                            <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                                                {messageProps.date_sent || 'No date'}
                                                {messageItem.created_by?.properties &&
                                                    <Text as="span" fontWeight="normal"> - {messageItem.created_by.properties.name}</Text>
                                                }
                                            </Text>
                                            <Text fontSize="xs" color="gray.700" mt={1}>
                                                {messageProps.content}
                                            </Text>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                        <Box height="16px" /> {/* Visual break */}
                    </>
                )}

                {/* Metrics */}
                {filteredMetrics.length > 0 && (
                    <>
                        <Box>
                            <Heading as="h3" size="sm" color="teal.700" mb={2}>
                                Metrics ({filteredMetrics.length})
                            </Heading>
                            <Stack spacing={1}>
                                {filteredMetrics.map((metricItem, index) => (
                                    <Text key={index} fontSize="xs" color="gray.700" pl={3}>
                                        • <Text as="span" fontWeight="semibold">{metricItem.metric.properties.name}:</Text>{' '}
                                        {metricItem.metric.properties.value}
                                        {metricItem.created_by?.properties &&
                                            <Text as="span" color="gray.700"> ({metricItem.created_by.properties.name})</Text>
                                        }
                                    </Text>
                                ))}
                            </Stack>
                        </Box>
                        <Box height="16px" /> {/* Visual break */}
                    </>
                )}

                {/* Implementation Evidence */}
                {filteredEvidenceTypes.length > 0 && (
                    <>
                        <Box>
                            <Heading as="h3" size="sm" color="teal.700" mb={2}>
                                Implementation Evidence
                            </Heading>
                            <Stack spacing={3}>
                                {filteredEvidenceTypes.map((etype, index) => (
                                    <Box key={index} pl={3} borderLeft="3px solid" borderLeftColor="teal.200">
                                        <HStack spacing={2} mb={2}>
                                            <Badge colorScheme="teal" fontSize="xs">
                                                {etype.type}
                                            </Badge>
                                            {etype.evidenceType?.properties?.title && (
                                                <Heading
                                                    as="h4"
                                                    size="xs"
                                                    color="gray.700"
                                                    cursor="pointer"
                                                    _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                                                    onClick={() => handleImplementationClick(
                                                        etype.type,
                                                        etype.evidenceType?.properties?.unique_id
                                                    )}
                                                >
                                                    {etype.evidenceType.properties.title}
                                                </Heading>
                                            )}
                                        </HStack>

                                        {etype.evidenceType?.properties?.description && (
                                            <Text fontSize="xs" color="gray.700" mb={2}>
                                                {etype.evidenceType.properties.description}
                                            </Text>
                                        )}

                                        <Stack spacing={2}>
                                            {/* Documents */}
                                            {etype.docs?.length > 0 && (
                                                <Box>
                                                    <Heading as="h5" size="xs" color="gray.700" fontWeight="semibold">
                                                        Documents:
                                                    </Heading>
                                                    <Stack spacing={1} pl={3}>
                                                        {etype.docs.map((doc) => (
                                                            <Box key={doc.id}>
                                                                <HStack spacing={2} align="baseline">
                                                                    <Link
                                                                        href={doc.properties.file_path || doc.properties.uri_path}
                                                                        isExternal
                                                                        color="teal.600"
                                                                        fontSize="xs"
                                                                    >
                                                                        • {doc.properties.name}
                                                                    </Link>
                                                                    <HStack spacing={1}>
                                                                        {(doc.properties.is_administrative_review_documentation === "True" || doc.properties.is_administrative_review_documentation === true) &&
                                                                            <Badge colorScheme="purple" fontSize="10px">Admin Review</Badge>
                                                                        }
                                                                        {(doc.properties.is_milestone_and_measures_documentation === "True" || doc.properties.is_milestone_and_measures_documentation === true) &&
                                                                            <Badge colorScheme="blue" fontSize="10px">Milestones</Badge>
                                                                        }
                                                                        {(doc.properties.depreciated === true) &&
                                                                            <Badge colorScheme="orange" fontSize="10px">Depreciated</Badge>
                                                                        }
                                                                    </HStack>
                                                                </HStack>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}

                                            {/* Webpages */}
                                            {etype.webs?.length > 0 && (
                                                <Box>
                                                    <Heading as="h5" size="xs" color="gray.700" fontWeight="semibold">
                                                        Webpages:
                                                    </Heading>
                                                    <Stack spacing={1} pl={3}>
                                                        {etype.webs.map((web) => (
                                                            <Box key={web.id}>
                                                                <HStack spacing={2} align="baseline">
                                                                    <Link
                                                                        href={web.properties.url}
                                                                        isExternal
                                                                        color="teal.600"
                                                                        fontSize="xs"
                                                                    >
                                                                        • {web.properties.name || web.properties.title}
                                                                    </Link>
                                                                    <HStack spacing={1}>
                                                                        {(web.properties.no_longer_exists === true) &&
                                                                            <Badge colorScheme="red" fontSize="10px">No Longer Exists</Badge>
                                                                        }
                                                                        {(web.properties.depreciated === true) &&
                                                                            <Badge colorScheme="orange" fontSize="10px">Depreciated</Badge>
                                                                        }
                                                                    </HStack>
                                                                </HStack>
                                                                {web.properties.description && (
                                                                    <Text fontSize="xs" color="gray.700" pl={3} mt={1}>
                                                                        {web.properties.description}
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}

                                            {/* Implementation Notes */}
                                            {etype.notes?.length > 0 && (
                                                <Box>
                                                    <Heading as="h5" size="xs" color="gray.700" fontWeight="semibold">
                                                        Notes:
                                                    </Heading>
                                                    {etype.notes.map((note, idx) => (
                                                        <Text key={idx} fontSize="xs" color="gray.700" pl={3}>
                                                            • {note.properties.date_created || 'No date'}: {note.properties.content}
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}

                                            {/* Implementation Messages */}
                                            {etype.msgs?.length > 0 && (
                                                <Box>
                                                    <Heading as="h5" size="xs" color="gray.700" fontWeight="semibold">
                                                        Messages:
                                                    </Heading>
                                                    {etype.msgs.map((msg, idx) => (
                                                        <Text key={idx} fontSize="xs" color="gray.700" pl={3}>
                                                            • {msg.properties.date_sent || 'No date'}: {msg.properties.content}
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}

                                            {/* Implementation Metrics */}
                                            {etype.metrics?.length > 0 && (
                                                <Box>
                                                    <Heading as="h5" size="xs" color="gray.700" fontWeight="semibold">
                                                        Metrics:
                                                    </Heading>
                                                    {etype.metrics.map((metric, idx) => (
                                                        <Text key={idx} fontSize="xs" color="gray.700" pl={3}>
                                                            • {metric.properties.name}: <Text as="span" fontWeight="semibold">{metric.properties.value}</Text>
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </>
                )}
            </VStack>
        </Box>
    );
}
export { generateReport, GenerateReportComponent };