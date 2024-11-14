import React from 'react';
import {
    Box,
    Text,
    Heading,
    List,
    ListItem,
    Divider,
    Stack,
    Link
} from '@chakra-ui/react';


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
    return (
        <Box p={4}>
            {/* Indicator Information */}
            {evidenceItem.indicator && evidenceItem.indicator.properties && (
                <Box mb={6}>
                    <Heading size="lg">
                        Success Indicator {evidenceItem.indicator.properties.number}
                    </Heading>
                    <Text fontSize="md" mt={2}>
                        {evidenceItem.indicator.properties.success_indicator}
                    </Text>
                    <Text mt={2}>
                        <strong>Composite Key:</strong>{' '}
                        {evidenceItem.indicator.properties.composite_key}
                    </Text>
                    <Text>
                        <strong>Removed:</strong>{' '}
                        {evidenceItem.indicator.properties.removed ? 'Yes' : 'No'}
                    </Text>
                    <Text>
                        <strong>Date Added:</strong>{' '}
                        {evidenceItem.indicator.properties.date_added}
                    </Text>
                </Box>
            )}

            {/* Evidence Information */}
            {evidenceItem.evidence && evidenceItem.evidence.properties && (
                <Box mb={6}>
                    <Heading size="md">Evidence</Heading>
                    <Text mt={2}>
                        <strong>Year Identifier:</strong>{' '}
                        {evidenceItem.evidence.properties.year_identifier}
                    </Text>

                    {/* Include additional evidence properties if they exist */}
                    {'administrative_review_complete' in
                        evidenceItem.evidence.properties && (
                            <Text>
                                <strong>Administrative Review Complete:</strong>{' '}
                                {evidenceItem.evidence.properties.administrative_review_complete
                                    ? 'Yes'
                                    : 'No'}
                            </Text>
                        )}
                    {'administrative_review_completed_date' in
                        evidenceItem.evidence.properties && (
                            <Text>
                                <strong>Administrative Review Completed Date:</strong>{' '}
                                {
                                    evidenceItem.evidence.properties
                                        .administrative_review_completed_date
                                }
                            </Text>
                        )}

                    {/* Status Level */}
                    {evidenceItem.statusLevel &&
                        evidenceItem.statusLevel.properties && (
                            <Text>
                                <strong>Status Level:</strong>{' '}
                                {evidenceItem.statusLevel.properties.status_level}
                            </Text>
                        )}

                    {/* Persons Involved */}
                    {evidenceItem.persons && evidenceItem.persons.length > 0 && (
                        <Box mt={4}>
                            <Text fontWeight="bold">Persons Involved:</Text>
                            <List spacing={2} mt={2}>
                                {evidenceItem.persons.map((person) => {
                                    if (!person || !person.properties) {
                                        return null;
                                    }
                                    return (
                                        <ListItem key={person.id}>
                                            {person.properties.name} - {person.properties.title} (
                                            {person.properties.email})
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </Box>
                    )}

                    {/* Admin Reviewers */}
                    {evidenceItem.adminReviewers &&
                        evidenceItem.adminReviewers.length > 0 && (
                            <Box mt={4}>
                                <Text fontWeight="bold">Admin Reviewers:</Text>
                                <List spacing={2} mt={2}>
                                    {evidenceItem.adminReviewers.map((reviewer) => {
                                        if (!reviewer || !reviewer.properties) {
                                            return null;
                                        }
                                        return (
                                            <ListItem key={reviewer.id}>
                                                {reviewer.properties.name} - {reviewer.properties.title}{' '}
                                                ({reviewer.properties.email})
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Box>
                        )}

                    {/* Notes */}
                    {evidenceItem.has_notes && evidenceItem.has_notes.length > 0 && (
                        <Box mt={4}>
                            <Text fontWeight="bold">Notes:</Text>
                            <Stack spacing={3} mt={2}>
                                {evidenceItem.has_notes.map((noteItem, index) => {
                                    if (
                                        !noteItem ||
                                        !noteItem.note ||
                                        !noteItem.note.properties
                                    ) {
                                        return null;
                                    }
                                    const noteProps = noteItem.note.properties;
                                    return (
                                        <Box key={index} p={3} borderWidth="1px" borderRadius="md">
                                            <Text>
                                                <strong>Date:</strong> {noteProps.date_created || 'N/A'}
                                            </Text>
                                            <Text mt={1}>{noteProps.content}</Text>
                                            {/* Handle file_path or uri_path in notes if they exist */}
                                            {(noteProps.file_path || noteProps.uri_path) && (
                                                <Text mt={1}>
                                                    <strong>Attachment:</strong>{' '}
                                                    <Link
                                                        href={noteProps.file_path || noteProps.uri_path}
                                                        isExternal
                                                        color="teal.500"
                                                    >
                                                        {noteProps.name || 'Link'}
                                                    </Link>
                                                </Text>
                                            )}
                                            {noteItem.created_by &&
                                                noteItem.created_by.properties && (
                                                    <Text mt={1} fontStyle="italic">
                                                        (Created by: {noteItem.created_by.properties.name})
                                                    </Text>
                                                )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}

                    {/* Messages */}
                    {evidenceItem.has_messages &&
                        evidenceItem.has_messages.length > 0 && (
                            <Box mt={4}>
                                <Text fontWeight="bold">Messages:</Text>
                                <Stack spacing={3} mt={2}>
                                    {evidenceItem.has_messages.map((messageItem, index) => {
                                        if (
                                            !messageItem ||
                                            !messageItem.message ||
                                            !messageItem.message.properties
                                        ) {
                                            return null;
                                        }
                                        const messageProps = messageItem.message.properties;
                                        return (
                                            <Box
                                                key={index}
                                                p={3}
                                                borderWidth="1px"
                                                borderRadius="md"
                                            >
                                                <Text>
                                                    <strong>Date:</strong>{' '}
                                                    {messageProps.date_sent || 'N/A'}
                                                </Text>
                                                <Text mt={1}>{messageProps.content}</Text>
                                                {/* Handle file_path or uri_path in messages if they exist */}
                                                {(messageProps.file_path || messageProps.uri_path) && (
                                                    <Text mt={1}>
                                                        <strong>Attachment:</strong>{' '}
                                                        <Link
                                                            href={
                                                                messageProps.file_path || messageProps.uri_path
                                                            }
                                                            isExternal
                                                            color="teal.500"
                                                        >
                                                            {messageProps.name || 'Link'}
                                                        </Link>
                                                    </Text>
                                                )}
                                                {messageItem.created_by &&
                                                    messageItem.created_by.properties && (
                                                        <Text mt={1} fontStyle="italic">
                                                            (Sent by: {messageItem.created_by.properties.name})
                                                        </Text>
                                                    )}
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        )}

                    {/* Metrics */}
                    {evidenceItem.has_metrics &&
                        evidenceItem.has_metrics.length > 0 && (
                            <Box mt={4}>
                                <Text fontWeight="bold">Metrics:</Text>
                                <List spacing={2} mt={2}>
                                    {evidenceItem.has_metrics.map((metricItem, index) => {
                                        if (
                                            !metricItem ||
                                            !metricItem.metric ||
                                            !metricItem.metric.properties
                                        ) {
                                            return null;
                                        }
                                        return (
                                            <ListItem key={index}>
                                                <strong>Metric:</strong>{' '}
                                                {metricItem.metric.properties.name},{' '}
                                                <strong>Value:</strong>{' '}
                                                {metricItem.metric.properties.value}
                                                {metricItem.created_by &&
                                                    metricItem.created_by.properties && (
                                                        <Text fontStyle="italic">
                                                            (Recorded by:{' '}
                                                            {metricItem.created_by.properties.name})
                                                        </Text>
                                                    )}
                                            </ListItem>
                                        );
                                    })}
                                </List>
                            </Box>
                        )}
                </Box>
            )}

            {/* Evidence Types */}
            {evidenceItem.evidenceTypes &&
                evidenceItem.evidenceTypes.length > 0 && (
                    <Box mb={6}>
                        <Heading size="md">Evidence Types</Heading>
                        {evidenceItem.evidenceTypes.map((etype, index) => {
                            if (!etype) {
                                return null;
                            }
                            return (
                                <Box
                                    key={index}
                                    mt={4}
                                    p={4}
                                    borderWidth="1px"
                                    borderRadius="md"
                                >
                                    <Text>
                                        <strong>Type:</strong> {etype.type || 'N/A'}
                                    </Text>
                                    {etype.evidenceType && etype.evidenceType.properties && (
                                        <>
                                            <Text mt={2}>
                                                <strong>Title:</strong>{' '}
                                                {etype.evidenceType.properties.title}
                                            </Text>
                                            <Text mt={1}>
                                                <strong>Description:</strong>{' '}
                                                {etype.evidenceType.properties.description}
                                            </Text>
                                        </>
                                    )}

                                    {/* Documents */}
                                    {etype.docs && etype.docs.length > 0 && (
                                        <Box mt={3}>
                                            <Text fontWeight="bold">Documents:</Text>
                                            <List spacing={2} mt={2}>
                                                {etype.docs.map((doc) => {
                                                    if (!doc || !doc.properties) {
                                                        return null;
                                                    }
                                                    return (
                                                        <ListItem key={doc.id}>
                                                            <Link
                                                                href={
                                                                    doc.properties.file_path ||
                                                                    doc.properties.uri_path
                                                                }
                                                                isExternal
                                                                color="teal.500"
                                                            >
                                                                {doc.properties.name}
                                                            </Link>
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        </Box>
                                    )}

                                    {/* Webpages */}
                                    {etype.webs && etype.webs.length > 0 && (
                                        <Box mt={3}>
                                            <Text fontWeight="bold">Webpages:</Text>
                                            <List spacing={2} mt={2}>
                                                {etype.webs.map((web) => {
                                                    if (!web || !web.properties) {
                                                        return null;
                                                    }
                                                    return (
                                                        <ListItem key={web.id}>
                                                            <Link
                                                                href={web.properties.url}
                                                                isExternal
                                                                color="teal.500"
                                                            >
                                                                {web.properties.title}
                                                            </Link>
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        </Box>
                                    )}

                                    {/* Notes */}
                                    {etype.notes && etype.notes.length > 0 && (
                                        <Box mt={3}>
                                            <Text fontWeight="bold">Notes:</Text>
                                            <Stack spacing={3} mt={2}>
                                                {etype.notes.map((note, idx) => {
                                                    if (!note || !note.properties) {
                                                        return null;
                                                    }
                                                    return (
                                                        <Box
                                                            key={idx}
                                                            p={3}
                                                            borderWidth="1px"
                                                            borderRadius="md"
                                                        >
                                                            <Text>
                                                                <strong>Date:</strong>{' '}
                                                                {note.properties.date_created || 'N/A'}
                                                            </Text>
                                                            <Text mt={1}>{note.properties.content}</Text>
                                                            {/* Handle file_path or uri_path in notes if they exist */}
                                                            {(note.properties.file_path ||
                                                                note.properties.uri_path) && (
                                                                <Text mt={1}>
                                                                    <strong>Attachment:</strong>{' '}
                                                                    <Link
                                                                        href={
                                                                            note.properties.file_path ||
                                                                            note.properties.uri_path
                                                                        }
                                                                        isExternal
                                                                        color="teal.500"
                                                                    >
                                                                        {note.properties.name || 'Link'}
                                                                    </Link>
                                                                </Text>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* Messages */}
                                    {etype.msgs && etype.msgs.length > 0 && (
                                        <Box mt={3}>
                                            <Text fontWeight="bold">Messages:</Text>
                                            <Stack spacing={3} mt={2}>
                                                {etype.msgs.map((msg, idx) => {
                                                    if (!msg || !msg.properties) {
                                                        return null;
                                                    }
                                                    return (
                                                        <Box
                                                            key={idx}
                                                            p={3}
                                                            borderWidth="1px"
                                                            borderRadius="md"
                                                        >
                                                            <Text>
                                                                <strong>Date:</strong>{' '}
                                                                {msg.properties.date_sent || 'N/A'}
                                                            </Text>
                                                            <Text mt={1}>{msg.properties.content}</Text>
                                                            {/* Handle file_path or uri_path in messages if they exist */}
                                                            {(msg.properties.file_path ||
                                                                msg.properties.uri_path) && (
                                                                <Text mt={1}>
                                                                    <strong>Attachment:</strong>{' '}
                                                                    <Link
                                                                        href={
                                                                            msg.properties.file_path ||
                                                                            msg.properties.uri_path
                                                                        }
                                                                        isExternal
                                                                        color="teal.500"
                                                                    >
                                                                        {msg.properties.name || 'Link'}
                                                                    </Link>
                                                                </Text>
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </Box>
                                    )}

                                    {/* Metrics */}
                                    {etype.metrics && etype.metrics.length > 0 && (
                                        <Box mt={3}>
                                            <Text fontWeight="bold">Metrics:</Text>
                                            <List spacing={2} mt={2}>
                                                {etype.metrics.map((metric, idx) => {
                                                    if (!metric || !metric.properties) {
                                                        return null;
                                                    }
                                                    return (
                                                        <ListItem key={idx}>
                                                            <strong>Metric:</strong>{' '}
                                                            {metric.properties.name}, <strong>Value:</strong>{' '}
                                                            {metric.properties.value}
                                                        </ListItem>
                                                    );
                                                })}
                                            </List>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                )}
        </Box>
    );
}

export default GenerateReportComponent;





export { generateReport, GenerateReportComponent };