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
import {getEditUrlFromCompositeKey} from "./utils/tools";

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

    // Indicator Information
    if (evidenceItem.indicator?.properties) {
        const indicatorProps = evidenceItem.indicator.properties;
        report += `${evidenceItem.evidence.properties.year_identifier}\n`;
        report += `${indicatorProps.success_indicator}\n`;
        report += `Composite Key: ${indicatorProps.composite_key}\n`;
        report += `Status: ${indicatorProps.removed ? 'Removed' : 'Active'} | Date Added: ${indicatorProps.date_added}\n\n`;
    }

    // Evidence Information
    if (evidenceItem.evidence?.properties) {
        report += `EVIDENCE INFORMATION\n`;
        report += `${'='.repeat(50)}\n`;

        const evidenceProps = evidenceItem.evidence.properties;
        report += `Year: ${evidenceProps.year_identifier}\n`;

        if (evidenceItem.statusLevel?.properties) {
            report += `Status Level: ${evidenceItem.statusLevel.properties.status_level}\n`;
        }

        if ('administrative_review_complete' in evidenceProps) {
            report += `Admin Review: ${evidenceProps.administrative_review_complete ? 'Complete' : 'Pending'}`;
            if (evidenceProps.administrative_review_completed_date) {
                report += ` (${evidenceProps.administrative_review_completed_date})`;
            }
            report += '\n';
        }

        // Persons Involved
        if (evidenceItem.persons?.length > 0) {
            report += `\nPersons Involved:\n`;
            evidenceItem.persons.forEach((person) => {
                const personProps = person.properties;
                report += `  • ${personProps.name} - ${personProps.title} (${personProps.email})\n`;
            });
        }

        // Admin Reviewers
        if (evidenceItem.adminReviewers?.length > 0) {
            report += `\nAdmin Reviewers:\n`;
            evidenceItem.adminReviewers.forEach((reviewer) => {
                const reviewerProps = reviewer.properties;
                report += `  • ${reviewerProps.name} - ${reviewerProps.title}\n`;
            });
        }
        report += '\n';
    }

    // Notes
    if (filteredNotes.length > 0) {
        report += `NOTES (${filteredNotes.length})\n`;
        report += `${'='.repeat(50)}\n`;
        filteredNotes.forEach((noteItem) => {
            const noteProps = noteItem.note.properties;
            report += `${noteProps.date_created || 'No date'}`;
            if (noteItem.created_by?.properties) {
                report += ` - ${noteItem.created_by.properties.name}`;
            }
            report += '\n';
            report += `  ${noteProps.content}\n`;
            if (noteProps.file_path || noteProps.uri_path) {
                report += `  Attachment: ${noteProps.name || 'Attachment'} - ${noteProps.file_path || noteProps.uri_path}\n`;
            }
            report += '\n';
        });
    }

    // Messages
    if (filteredMessages.length > 0) {
        report += `MESSAGES (${filteredMessages.length})\n`;
        report += `${'='.repeat(50)}\n`;
        filteredMessages.forEach((messageItem) => {
            const messageProps = messageItem.message.properties;
            report += `${messageProps.date_sent || 'No date'}`;
            if (messageItem.created_by?.properties) {
                report += ` - ${messageItem.created_by.properties.name}`;
            }
            report += '\n';
            report += `  ${messageProps.content}\n\n`;
        });
    }

    // Metrics
    if (filteredMetrics.length > 0) {
        report += `METRICS (${filteredMetrics.length})\n`;
        report += `${'='.repeat(50)}\n`;
        filteredMetrics.forEach((metricItem) => {
            const metricProps = metricItem.metric.properties;
            report += `  • ${metricProps.name}: ${metricProps.value}`;
            if (metricItem.created_by?.properties) {
                report += ` (${metricItem.created_by.properties.name})`;
            }
            report += '\n';
        });
        report += '\n';
    }

    // Implementation Evidence
    if (filteredEvidenceTypes.length > 0) {
        report += `IMPLEMENTATION EVIDENCE\n`;
        report += `${'='.repeat(50)}\n`;

        filteredEvidenceTypes.forEach((etype) => {
            report += `\n[${etype.type}] `;
            if (etype.evidenceType?.properties?.title) {
                report += etype.evidenceType.properties.title;
            }
            report += '\n';

            if (etype.evidenceType?.properties?.description) {
                report += `  ${etype.evidenceType.properties.description}\n`;
            }

            // Documents
            if (etype.docs?.length > 0) {
                report += `\n  Documents:\n`;
                etype.docs.forEach((doc) => {
                    const docProps = doc.properties;
                    report += `    • ${docProps.name}`;

                    // Add badges as text
                    const badges = [];
                    if (docProps.is_administrative_review_documentation === "True" || docProps.is_administrative_review_documentation === true) {
                        badges.push('Admin Review');
                    }
                    if (docProps.is_milestone_and_measures_documentation === "True" || docProps.is_milestone_and_measures_documentation === true) {
                        badges.push('Milestones');
                    }
                    if (docProps.depreciated === true) {
                        badges.push('Depreciated');
                    }
                    if (badges.length > 0) {
                        report += ` [${badges.join(', ')}]`;
                    }
                    report += '\n';
                    report += `      ${docProps.file_path || docProps.uri_path}\n`;
                });
            }

            // Webpages
            if (etype.webs?.length > 0) {
                report += `\n  Webpages:\n`;
                etype.webs.forEach((web) => {
                    const webProps = web.properties;
                    report += `    • ${webProps.name || webProps.title}`;

                    // Add badges as text
                    const badges = [];
                    if (webProps.no_longer_exists === true) {
                        badges.push('No Longer Exists');
                    }
                    if (webProps.depreciated === true) {
                        badges.push('Depreciated');
                    }
                    if (badges.length > 0) {
                        report += ` [${badges.join(', ')}]`;
                    }
                    report += '\n';
                    report += `      ${webProps.url}\n`;
                    if (webProps.description) {
                        report += `      ${webProps.description}\n`;
                    }
                });
            }

            // Implementation Notes
            if (etype.notes?.length > 0) {
                report += `\n  Notes:\n`;
                etype.notes.forEach((note) => {
                    const noteProps = note.properties;
                    report += `    • ${noteProps.date_created || 'No date'}: ${noteProps.content}\n`;
                });
            }

            // Implementation Messages
            if (etype.msgs?.length > 0) {
                report += `\n  Messages:\n`;
                etype.msgs.forEach((msg) => {
                    const msgProps = msg.properties;
                    report += `    • ${msgProps.date_sent || 'No date'}: ${msgProps.content}\n`;
                });
            }

            // Implementation Metrics
            if (etype.metrics?.length > 0) {
                report += `\n  Metrics:\n`;
                etype.metrics.forEach((metric) => {
                    const metricProps = metric.properties;
                    report += `    • ${metricProps.name}: ${metricProps.value}\n`;
                });
            }
        });
    }

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
                            <Heading as="h2"
                                     size="md"
                                     color="gray.800"
                                     cursor="pointer"
                                     _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                                     onClick={() => {
                                         const editUrl = getEditUrlFromCompositeKey(evidenceItem.indicator.properties.composite_key);
                                         const [pathname, hash] = editUrl.split('#');

                                         navigate(pathname + '#' + hash);

                                         setTimeout(() => {
                                             if (hash) {
                                                 const element = document.getElementById(hash);
                                                 if (element) {
                                                     element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                 } else {
                                                     setTimeout(() => {
                                                         const retryElement = document.getElementById(hash);
                                                         if (retryElement) {
                                                             retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                         }
                                                     }, 300);
                                                 }
                                             }
                                         }, 100);
                                     }}
                            >
                                {evidenceItem.evidence.properties.year_identifier}
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
                        <Box height="16px" />
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
                        <Box height="16px" />
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
                        <Box height="16px" />
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
                        <Box height="16px" />
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
                        <Box height="16px" />
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
                                                    <Text fontSize="xs" color="gray.700" fontWeight="semibold">
                                                        Documents:
                                                    </Text>
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
                                                    <Text fontSize="xs" color="gray.700" fontWeight="semibold">
                                                        Webpages:
                                                    </Text>
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

                                            {/* Implementation Notes, Messages, and Metrics */}
                                            {etype.notes?.length > 0 && (
                                                <Box>
                                                    <Text fontSize="xs" color="gray.700" fontWeight="semibold">
                                                        Notes:
                                                    </Text>
                                                    {etype.notes.map((note, idx) => (
                                                        <Text key={idx} fontSize="xs" color="gray.700" pl={3}>
                                                            • {note.properties.date_created || 'No date'}: {note.properties.content}
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}

                                            {etype.msgs?.length > 0 && (
                                                <Box>
                                                    <Text fontSize="xs" color="gray.700" fontWeight="semibold">
                                                        Messages:
                                                    </Text>
                                                    {etype.msgs.map((msg, idx) => (
                                                        <Text key={idx} fontSize="xs" color="gray.700" pl={3}>
                                                            • {msg.properties.date_sent || 'No date'}: {msg.properties.content}
                                                        </Text>
                                                    ))}
                                                </Box>
                                            )}

                                            {etype.metrics?.length > 0 && (
                                                <Box>
                                                    <Text fontSize="xs" color="gray.700" fontWeight="semibold">
                                                        Metrics:
                                                    </Text>
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