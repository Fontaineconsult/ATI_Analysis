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
    Link, GridItem, VStack, HStack
} from '@chakra-ui/react';
import {Grid} from "lucide-react";


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

    // Filter evidenceTypes
    const filteredEvidenceTypes = (evidenceItem.evidenceTypes || []).map((etype) => {
        return {
            ...etype,
            docs: filterByIncludeInReport(etype.docs, 'properties'),
            webs: filterByIncludeInReport(etype.webs, 'properties'),
            notes: filterByIncludeInReport(etype.notes, 'properties'),
            msgs: filterByIncludeInReport(etype.msgs, 'properties'),
            metrics: filterByIncludeInReport(etype.metrics, 'properties'),
        };
    }).filter(et => et);

    return (
        <Box p={4} bg="white" fontSize="sm">
            <VStack align="stretch" spacing={4} textAlign="left">

                {/* Indicator Information */}
                {evidenceItem.indicator?.properties && (
                    <Box textAlign="left">
                        <Heading size="md" color="gray.800" mb={2} textAlign="left">
                            Success Indicator {evidenceItem.indicator.properties.number}
                        </Heading>
                        <Text mb={1} textAlign="left">{evidenceItem.indicator.properties.success_indicator}</Text>
                        <Text fontSize="xs" color="gray.600" textAlign="left">
                            <strong>Composite Key:</strong> {evidenceItem.indicator.properties.composite_key}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textAlign="left">
                            <strong>Status:</strong> {evidenceItem.indicator.properties.removed ? 'Removed' : 'Active'}
                        </Text>
                        <Text fontSize="xs" color="gray.600" textAlign="left">
                            <strong>Date Added:</strong> {evidenceItem.indicator.properties.date_added}
                        </Text>
                    </Box>
                )}

                <Divider />

                {/* Evidence Information */}
                {evidenceItem.evidence?.properties && (
                    <Box textAlign="left">
                        <Heading size="sm" color="gray.700" mb={2} textAlign="left">
                            Evidence Information
                        </Heading>

                        <Text fontSize="xs" mb={1} textAlign="left">
                            <strong>Year:</strong> {evidenceItem.evidence.properties.year_identifier}
                        </Text>
                        {evidenceItem.statusLevel?.properties && (
                            <Text fontSize="xs" mb={1} textAlign="left">
                                <strong>Status Level:</strong> {evidenceItem.statusLevel.properties.status_level}
                            </Text>
                        )}
                        {'administrative_review_complete' in evidenceItem.evidence.properties && (
                            <Text fontSize="xs" mb={2} textAlign="left">
                                <strong>Admin Review:</strong> {
                                evidenceItem.evidence.properties.administrative_review_complete ? 'Complete' : 'Pending'
                            }
                                {evidenceItem.evidence.properties.administrative_review_completed_date &&
                                    ` (${evidenceItem.evidence.properties.administrative_review_completed_date})`
                                }
                            </Text>
                        )}

                        {/* Persons Involved */}
                        {evidenceItem.persons?.length > 0 && (
                            <Box mb={2} textAlign="left">
                                <Text fontWeight="bold" fontSize="xs" textAlign="left">Persons Involved:</Text>
                                <List spacing={0} fontSize="xs" ml={4} styleType="none">
                                    {evidenceItem.persons.map((person) => {
                                        if (!person?.properties) return null;
                                        return (
                                            <ListItem key={person.id} textAlign="left">
                                                {person.properties.name} - {person.properties.title} ({person.properties.email})
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Box>
                        )}

                        {/* Admin Reviewers */}
                        {evidenceItem.adminReviewers?.length > 0 && (
                            <Box mb={2} textAlign="left">
                                <Text fontWeight="bold" fontSize="xs" textAlign="left">Admin Reviewers:</Text>
                                <List spacing={0} fontSize="xs" ml={4} styleType="none">
                                    {evidenceItem.adminReviewers.map((reviewer) => {
                                        if (!reviewer?.properties) return null;
                                        return (
                                            <ListItem key={reviewer.id} textAlign="left">
                                                {reviewer.properties.name} - {reviewer.properties.title} ({reviewer.properties.email})
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Notes */}
                {filteredNotes.length > 0 && (
                    <>
                        <Divider />
                        <Box textAlign="left">
                            <Heading size="sm" color="gray.700" mb={2} textAlign="left">
                                Notes ({filteredNotes.length})
                            </Heading>
                            <Stack spacing={2}>
                                {filteredNotes.map((noteItem, index) => {
                                    if (!noteItem?.note?.properties) return null;
                                    const noteProps = noteItem.note.properties;
                                    return (
                                        <Box key={index} pl={4} fontSize="xs" textAlign="left">
                                            <Text textAlign="left">
                                                <strong>{noteProps.date_created || 'No date'}:</strong> {noteProps.content}
                                                {noteItem.created_by?.properties && (
                                                    <Text as="span" color="gray.500"> (by {noteItem.created_by.properties.name})</Text>
                                                )}
                                            </Text>
                                            {(noteProps.file_path || noteProps.uri_path) && (
                                                <Link
                                                    href={noteProps.file_path || noteProps.uri_path}
                                                    isExternal
                                                    color="teal.600"
                                                    fontSize="xs"
                                                    display="block"
                                                    ml={4}
                                                    textAlign="left"
                                                >
                                                    Attachment: {noteProps.name || 'Link'}
                                                </Link>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </>
                )}

                {/* Messages */}
                {filteredMessages.length > 0 && (
                    <>
                        <Divider />
                        <Box textAlign="left">
                            <Heading size="sm" color="gray.700" mb={2} textAlign="left">
                                Messages ({filteredMessages.length})
                            </Heading>
                            <Stack spacing={2}>
                                {filteredMessages.map((messageItem, index) => {
                                    if (!messageItem?.message?.properties) return null;
                                    const messageProps = messageItem.message.properties;
                                    return (
                                        <Box key={index} pl={4} fontSize="xs" textAlign="left">
                                            <Text textAlign="left">
                                                <strong>{messageProps.date_sent || 'No date'}:</strong> {messageProps.content}
                                                {messageItem.created_by?.properties && (
                                                    <Text as="span" color="gray.500"> (sent by {messageItem.created_by.properties.name})</Text>
                                                )}
                                            </Text>
                                            {(messageProps.file_path || messageProps.uri_path) && (
                                                <Link
                                                    href={messageProps.file_path || messageProps.uri_path}
                                                    isExternal
                                                    color="teal.600"
                                                    fontSize="xs"
                                                    display="block"
                                                    ml={4}
                                                    textAlign="left"
                                                >
                                                    Attachment: {messageProps.name || 'Link'}
                                                </Link>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </>
                )}

                {/* Metrics */}
                {filteredMetrics.length > 0 && (
                    <>
                        <Divider />
                        <Box textAlign="left">
                            <Heading size="sm" color="gray.700" mb={2} textAlign="left">
                                Metrics ({filteredMetrics.length})
                            </Heading>
                            <List spacing={0} fontSize="xs" ml={4} styleType="none">
                                {filteredMetrics.map((metricItem, index) => {
                                    if (!metricItem?.metric?.properties) return null;
                                    return (
                                        <ListItem key={index} textAlign="left">
                                            <strong>{metricItem.metric.properties.name}:</strong> {metricItem.metric.properties.value}
                                            {metricItem.created_by?.properties && (
                                                <Text as="span" color="gray.500" ml={2}>
                                                    (by {metricItem.created_by.properties.name})
                                                </Text>
                                            )}
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Box>
                    </>
                )}

                {/* Evidence Types / Implementation Evidence */}
                {filteredEvidenceTypes.length > 0 && (
                    <>
                        <Divider />
                        <Box>
                            <Heading size="sm" color="gray.700" mb={2}>
                                Implementation Evidence
                            </Heading>
                            <Stack spacing={3}>
                                {filteredEvidenceTypes.map((etype, index) => {
                                    if (!etype) return null;
                                    const { docs, webs, notes, msgs, metrics } = etype;

                                    // Skip if this evidence type has no content
                                    if (!docs?.length && !webs?.length && !notes?.length && !msgs?.length && !metrics?.length) {
                                        return null;
                                    }

                                    return (
                                        <Box key={index} pl={4}>
                                            <Text fontWeight="bold" fontSize="xs" mb={1}>
                                                {etype.type || 'Unknown Type'}
                                                {etype.evidenceType?.properties?.title &&
                                                    `: ${etype.evidenceType.properties.title}`
                                                }
                                            </Text>

                                            {etype.evidenceType?.properties?.description && (
                                                <Text fontSize="xs" color="gray.600" mb={1} pl={4}>
                                                    {etype.evidenceType.properties.description}
                                                </Text>
                                            )}

                                            {/* Documents */}
                                            {docs?.length > 0 && (
                                                <Box pl={4} mb={1}>
                                                    <Text fontWeight="semibold" fontSize="xs">Documents:</Text>
                                                    {docs.map((doc) => {
                                                        if (!doc?.properties) return null;
                                                        return (
                                                            <Link
                                                                key={doc.id}
                                                                href={doc.properties.file_path || doc.properties.uri_path}
                                                                isExternal
                                                                color="teal.600"
                                                                fontSize="xs"
                                                                display="block"
                                                                pl={2}
                                                            >
                                                                {doc.properties.name}
                                                            </Link>
                                                        );
                                                    })}
                                                </Box>
                                            )}

                                            {/* Webpages */}
                                            {webs?.length > 0 && (
                                                <Box pl={4} mb={1}>
                                                    <Text fontWeight="semibold" fontSize="xs">Webpages:</Text>
                                                    {webs.map((web) => {
                                                        if (!web?.properties) return null;
                                                        return (
                                                            <Link
                                                                key={web.id}
                                                                href={web.properties.url}
                                                                isExternal
                                                                color="teal.600"
                                                                fontSize="xs"
                                                                display="block"
                                                                pl={2}
                                                            >
                                                                {web.properties.title}
                                                            </Link>
                                                        );
                                                    })}
                                                </Box>
                                            )}

                                            {/* Implementation Notes */}
                                            {notes?.length > 0 && (
                                                <Box pl={4} mb={1}>
                                                    <Text fontWeight="semibold" fontSize="xs">Notes:</Text>
                                                    {notes.map((note, idx) => {
                                                        if (!note?.properties) return null;
                                                        return (
                                                            <Box key={idx} pl={2} fontSize="xs">
                                                                <Text>
                                                                    <strong>{note.properties.date_created || 'No date'}:</strong> {note.properties.content}
                                                                </Text>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            )}

                                            {/* Implementation Messages */}
                                            {msgs?.length > 0 && (
                                                <Box pl={4} mb={1}>
                                                    <Text fontWeight="semibold" fontSize="xs">Messages:</Text>
                                                    {msgs.map((msg, idx) => {
                                                        if (!msg?.properties) return null;
                                                        return (
                                                            <Box key={idx} pl={2} fontSize="xs">
                                                                <Text>
                                                                    <strong>{msg.properties.date_sent || 'No date'}:</strong> {msg.properties.content}
                                                                </Text>
                                                            </Box>
                                                        );
                                                    })}
                                                </Box>
                                            )}

                                            {/* Implementation Metrics */}
                                            {metrics?.length > 0 && (
                                                <Box pl={4} mb={1}>
                                                    <Text fontWeight="semibold" fontSize="xs">Metrics:</Text>
                                                    {metrics.map((metric, idx) => {
                                                        if (!metric?.properties) return null;
                                                        return (
                                                            <Text key={idx} pl={2} fontSize="xs">
                                                                <strong>{metric.properties.name}:</strong> {metric.properties.value}
                                                            </Text>
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    </>
                )}
            </VStack>
        </Box>
    );
}




export { generateReport, GenerateReportComponent };