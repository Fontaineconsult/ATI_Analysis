import React from 'react';
import {
    Box,
    Flex,
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
import {useNavigate, useParams} from "react-router-dom";
import {navigateToIndicator} from "./utils/tools";
import { getStatusBackgroundColor, getStatusTextColor } from "./utils/statusColors";
import EvidenceQualityPanel from "../components/dashboard_components/report_components/EvidenceQualityPanel";

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
            if (etype.evidenceType?.properties?.retired) {
                report += ' (RETIRED)';
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
    const { campus } = useParams();

    // Get academic year from evidenceItem
    const academicYear = evidenceItem.currentAcademicYear || "2024-2025";

    const handleImplementationClick = (type, uniqueId) => {
        if (uniqueId) {
            navigate(`/${campus}/ati-explorer/implementations/${type}/${uniqueId}`);
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

    const filteredPlans = filterByIncludeInReport(evidenceItem?.plans || [], 'properties');
    const filteredAccomplishments = filterByIncludeInReport(evidenceItem?.accomplishments || [], 'properties');

    // Filter main-level items
    const filteredNotes = filterByIncludeInReport(evidenceItem.has_notes || [], 'note.properties');
    const filteredMessages = filterByIncludeInReport(evidenceItem.has_messages || [], 'message.properties');
    const filteredMetrics = filterByIncludeInReport(evidenceItem.has_metrics || [], 'metric.properties');

    // Filter evidenceTypes with year-based filtering for docs and webs
    const filteredEvidenceTypes = (evidenceItem.evidenceTypes || []).map((etype) => {
        return {
            ...etype,
            // Filter docs based on included_in_years
            docs: (etype.docs || []).filter(doc => {
                // If no relationship data or included_in_years is null/undefined, include the doc
                if (!doc.relationship || !doc.relationship.included_in_years) {
                    return true;
                }
                // Check if current academic year is in the included_in_years array
                return doc.relationship.included_in_years.includes(academicYear);
            }),

            // Filter webs based on included_in_years
            webs: (etype.webs || []).filter(web => {
                // If no relationship data or included_in_years is null/undefined, include the web
                if (!web.relationship || !web.relationship.included_in_years) {
                    return true;
                }
                // Check if current academic year is in the included_in_years array
                return web.relationship.included_in_years.includes(academicYear);
            }),

            // For notes with relationship data, apply same logic
            notes: (etype.notes || []).filter(note => {
                // If the note itself doesn't exist, filter it out
                if (!note || !note.note) return false;

                // If it has relationship data with included_in_years, check the year
                if (note.relationship && note.relationship.included_in_years) {
                    return note.relationship.included_in_years.includes(academicYear);
                }

                // If no relationship data, include it
                return true;
            }),

            // For messages with relationship data, apply same logic
            msgs: (etype.msgs || []).filter(msg => {
                // If the message itself doesn't exist, filter it out
                if (!msg || !msg.message) return false;

                // If it has relationship data with included_in_years, check the year
                if (msg.relationship && msg.relationship.included_in_years) {
                    return msg.relationship.included_in_years.includes(academicYear);
                }

                // If no relationship data, include it
                return true;
            }),

            // Keep metrics as is for now (they don't have year filtering in your data)
            metrics: filterByIncludeInReport(etype.metrics || [], 'properties'),
        };
    }).filter(et => {
        const hasContent = et.docs?.length || et.webs?.length ||
            et.notes?.length || et.msgs?.length || et.metrics?.length;
        return hasContent;
    });
    console.log("EEE", evidenceItem)

    return (
        <Box p={6} bg="gray.50" fontSize="sm" textAlign="left">
            <Flex
                direction={{ base: 'column', lg: 'row' }}
                gap={6}
                align="flex-start"
            >
                <Box flex={{ base: 'none', lg: 3 }} w="100%" minW="0">
                    <VStack align="stretch" spacing={6}>

                {/* Indicator Information - Header Section */}
                {evidenceItem.indicator?.properties && (
                    <Box
                        p={5}
                        bg="white"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                    >
                        <Heading
                            as="h2"
                            size="md"
                            color="teal.700"
                            mb={3}
                            cursor="pointer"
                            _hover={{ color: 'teal.600', textDecoration: 'underline' }}
                            onClick={() => navigateToIndicator(navigate, evidenceItem.indicator.properties.composite_key, campus)}
                        >
                            {evidenceItem.evidence.properties.year_identifier}
                        </Heading>
                        <VStack align="stretch" spacing={2}>
                            <Text fontSize="sm" color="gray.700">
                                {evidenceItem.indicator.properties.success_indicator}
                            </Text>
                            <HStack spacing={4} fontSize="xs" color="gray.600">
                                <Text>
                                    <Text as="span" fontWeight="semibold">Composite Key:</Text>{' '}
                                    {evidenceItem.indicator.properties.composite_key}
                                </Text>
                                <Text>
                                    <Text as="span" fontWeight="semibold">Status:</Text>{' '}
                                    {evidenceItem.indicator.properties.removed ? 'Removed' : 'Active'}
                                </Text>
                                <Text>
                                    <Text as="span" fontWeight="semibold">Date Added:</Text>{' '}
                                    {evidenceItem.indicator.properties.date_added}
                                </Text>
                            </HStack>
                        </VStack>
                    </Box>
                )}

                {/* Evidence Information Section */}
                {evidenceItem.evidence?.properties && (
                    <Box
                        p={5}
                        bg="white"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                    >
                        <Heading as="h3" size="sm" color="teal.700" mb={4}>
                            Evidence Information
                        </Heading>

                        <VStack align="stretch" spacing={3}>
                            {/* Basic Evidence Info */}
                            <Box>
                                <HStack spacing={4} fontSize="xs" color="gray.700" flexWrap="wrap">
                                    <Text>
                                        <Text as="span" fontWeight="semibold">Year:</Text>{' '}
                                        {evidenceItem.evidence.properties.year_identifier}
                                    </Text>
                                    {evidenceItem.statusLevel?.properties && (
                                        <HStack spacing={2}>
                                            <Text fontWeight="semibold">Status Level:</Text>
                                            <Badge
                                                color={getStatusTextColor(evidenceItem.statusLevel.properties.status_level)}
                                                bg={getStatusBackgroundColor(evidenceItem.statusLevel.properties.status_level)}
                                            >
                                                {evidenceItem.statusLevel.properties.status_level}
                                            </Badge>
                                        </HStack>
                                    )}
                                    {'administrative_review_complete' in evidenceItem.evidence.properties && (
                                        <Text>
                                            <Text as="span" fontWeight="semibold">Admin Review:</Text>{' '}
                                            {evidenceItem.evidence.properties.administrative_review_complete ? 'Complete' : 'Pending'}
                                            {evidenceItem.evidence.properties.administrative_review_completed_date &&
                                                ` (${evidenceItem.evidence.properties.administrative_review_completed_date})`
                                            }
                                        </Text>
                                    )}
                                </HStack>
                            </Box>

                            {/* Evidence Summary */}
                            {'admin_review_description' in evidenceItem.evidence.properties &&
                                evidenceItem.evidence.properties.admin_review_description &&
                                evidenceItem.evidence.properties.admin_review_description !== "No Review" && (
                                    <Box
                                        p={3}
                                        bg="blue.50"
                                        borderRadius="md"
                                        borderLeft="4px solid"
                                        borderLeftColor="blue.400"
                                    >
                                        <Text fontSize="xs" fontWeight="semibold" color="blue.800" mb={1}>
                                            Evidence Summary
                                        </Text>
                                        <Text fontSize="xs" color="gray.700">
                                            {evidenceItem.evidence.properties.admin_review_description}
                                        </Text>
                                    </Box>
                                )}

                            {/* Admin Review Notes */}
                            {evidenceItem.adminReviewNotes?.length > 0 && (
                                <Box>
                                    <Heading as="h4" size="xs" color="gray.700" mb={2}>
                                        Reviewer Notes
                                    </Heading>
                                    <Stack spacing={2}>
                                        {evidenceItem.adminReviewNotes.map((noteItem, index) => (
                                            <Box
                                                key={noteItem.note?.id || index}
                                                p={3}
                                                bg="purple.50"
                                                borderRadius="md"
                                                borderLeft="3px solid"
                                                borderLeftColor="purple.300"
                                            >
                                                <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={1}>
                                                    {noteItem.note?.properties?.date_created || 'No date'}
                                                    {noteItem.created_by?.properties?.name && (
                                                        <Text as="span" fontWeight="normal" color="gray.600">
                                                            {' - '}{noteItem.created_by.properties.name}
                                                        </Text>
                                                    )}
                                                </Text>
                                                <Text fontSize="xs" color="gray.700">
                                                    {noteItem.note?.properties?.content}
                                                </Text>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            <Divider />

                            {/* Persons and Reviewers */}
                            <HStack align="start" spacing={6}>
                                {/* Persons Involved */}
                                {evidenceItem.persons?.length > 0 && (
                                    <Box flex="1">
                                        <Heading as="h4" size="xs" color="gray.700" mb={2}>
                                            Persons Involved
                                        </Heading>
                                        <VStack align="stretch" spacing={1}>
                                            {evidenceItem.persons.map((person) => (
                                                <Text key={person.id} fontSize="xs" color="gray.700" pl={3}>
                                                    • {person.properties.name} - {person.properties.title}
                                                    {person.properties.ati_role && ` (${person.properties.ati_role})`}
                                                    {person.properties.email && ` - ${person.properties.email}`}
                                                </Text>
                                            ))}
                                        </VStack>
                                    </Box>
                                )}

                                {/* Admin Reviewers */}
                                {evidenceItem.adminReviewers?.length > 0 && (
                                    <Box flex="1">
                                        <Heading as="h4" size="xs" color="gray.700" mb={2}>
                                            Admin Reviewers
                                        </Heading>
                                        <VStack align="stretch" spacing={1}>
                                            {evidenceItem.adminReviewers.map((reviewer) => (
                                                <Text key={reviewer.id} fontSize="xs" color="gray.700" pl={3}>
                                                    • {reviewer.properties.name} - {reviewer.properties.title}
                                                </Text>
                                            ))}
                                        </VStack>
                                    </Box>
                                )}
                            </HStack>
                        </VStack>
                    </Box>
                )}

                {/* Plans and Accomplishments Section */}
                {(filteredPlans.length > 0 || filteredAccomplishments.length > 0) && (
                    <Box
                        p={5}
                        bg="white"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                    >
                        <Heading as="h3" size="sm" color="teal.700" mb={4}>
                            Plans and Accomplishments
                        </Heading>

                        <VStack align="stretch" spacing={4}>
                            {/* Plans */}
                            {filteredPlans.length > 0 && (
                                <Box>
                                    <Heading as="h4" size="xs" color="gray.700" mb={3}>
                                        Plans ({filteredPlans.length})
                                    </Heading>
                                    <Stack spacing={3}>
                                        {filteredPlans.map((plan, index) => (
                                            <Box
                                                key={plan.id || index}
                                                p={3}
                                                bg="gray.50"
                                                borderRadius="md"
                                                borderLeft="3px solid"
                                                borderLeftColor="teal.300"
                                            >
                                                <HStack spacing={2} mb={2} flexWrap="wrap">
                                                    <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                                                        {plan.properties.name}
                                                    </Text>
                                                    <Badge
                                                        fontSize="10px"
                                                        colorScheme={
                                                            plan.properties.plan_status === 'Completed' ? 'green' :
                                                                plan.properties.plan_status === 'In Progress' ? 'blue' :
                                                                    plan.properties.abandoned ? 'red' : 'gray'
                                                        }
                                                    >
                                                        {plan.properties.abandoned ? 'Abandoned' : plan.properties.plan_status}
                                                    </Badge>
                                                    {plan.properties.is_key_plan && (
                                                        <Badge colorScheme="purple" fontSize="10px">Key Plan</Badge>
                                                    )}
                                                    {plan.properties.is_campus_plan && (
                                                        <Badge colorScheme="green" fontSize="10px">Campus Plan</Badge>
                                                    )}
                                                </HStack>
                                                <Text fontSize="xs" color="gray.700">
                                                    {plan.properties.description}
                                                </Text>
                                                {plan.properties.abandoned && plan.properties.abandoned_notes && (
                                                    <Text fontSize="xs" color="red.600" mt={2}>
                                                        <Text as="span" fontWeight="semibold">Abandonment Notes:</Text>{' '}
                                                        {plan.properties.abandoned_notes}
                                                    </Text>
                                                )}
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            {/* Accomplishments */}
                            {filteredAccomplishments.length > 0 && (
                                <Box>
                                    <Heading as="h4" size="xs" color="gray.700" mb={3}>
                                        Accomplishments ({filteredAccomplishments.length})
                                    </Heading>
                                    <Stack spacing={3}>
                                        {filteredAccomplishments.map((accomplishment, index) => (
                                            <Box
                                                key={accomplishment.id || index}
                                                p={3}
                                                bg="gray.50"
                                                borderRadius="md"
                                                borderLeft="3px solid"
                                                borderLeftColor="blue.300"
                                            >
                                                <HStack spacing={2} mb={2}>
                                                    <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                                                        {accomplishment.properties.name}
                                                    </Text>
                                                    <Badge colorScheme="blue" fontSize="10px">
                                                        Completed
                                                    </Badge>
                                                </HStack>
                                                <Text fontSize="xs" color="gray.700">
                                                    {accomplishment.properties.description}
                                                </Text>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </VStack>
                    </Box>
                )}

                {/* Notes Section */}
                {filteredNotes.length > 0 && (
                    <Box
                        p={5}
                        bg="white"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                    >
                        <Heading as="h3" size="sm" color="teal.700" mb={4}>
                            Notes ({filteredNotes.length})
                        </Heading>
                        <Stack spacing={3}>
                            {filteredNotes.map((noteItem, index) => {
                                const noteProps = noteItem.note.properties;
                                return (
                                    <Box
                                        key={noteItem.note.id || index}
                                        p={3}
                                        bg="gray.50"
                                        borderRadius="md"
                                        borderLeft="3px solid"
                                        borderLeftColor="gray.300"
                                    >
                                        <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={1}>
                                            {noteProps.date_created || 'No date'}
                                            {noteItem.created_by?.properties && (
                                                <Text as="span" fontWeight="normal" color="gray.600">
                                                    {' - '}{noteItem.created_by.properties.name}
                                                </Text>
                                            )}
                                        </Text>
                                        <Text fontSize="xs" color="gray.700">
                                            {noteProps.content}
                                        </Text>
                                        {(noteProps.file_path || noteProps.uri_path) && (
                                            <Link
                                                href={noteProps.file_path || noteProps.uri_path}
                                                isExternal
                                                color="teal.600"
                                                fontSize="xs"
                                                mt={2}
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
                )}

                {/* Messages Section */}
                {filteredMessages.length > 0 && (
                    <Box
                        p={5}
                        bg="white"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                    >
                        <Heading as="h3" size="sm" color="teal.700" mb={4}>
                            Messages ({filteredMessages.length})
                        </Heading>
                        <Stack spacing={3}>
                            {filteredMessages.map((messageItem, index) => {
                                const messageProps = messageItem.message.properties;
                                return (
                                    <Box
                                        key={messageItem.message.id || index}
                                        p={3}
                                        bg="gray.50"
                                        borderRadius="md"
                                        borderLeft="3px solid"
                                        borderLeftColor="gray.300"
                                    >
                                        <Text fontSize="xs" fontWeight="semibold" color="gray.700" mb={1}>
                                            {messageProps.date_sent || 'No date'}
                                            {messageItem.created_by?.properties && (
                                                <Text as="span" fontWeight="normal" color="gray.600">
                                                    {' - '}{messageItem.created_by.properties.name}
                                                </Text>
                                            )}
                                        </Text>
                                        <Text fontSize="xs" color="gray.700">
                                            {messageProps.content}
                                        </Text>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                {/* Metrics Section */}
                {filteredMetrics.length > 0 && (
                    <Box
                        p={5}
                        bg="white"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                    >
                        <Heading as="h3" size="sm" color="teal.700" mb={4}>
                            Metrics ({filteredMetrics.length})
                        </Heading>
                        <VStack align="stretch" spacing={2}>
                            {filteredMetrics.map((metricItem, index) => (
                                <Box key={metricItem.metric.id || index} p={2} bg="gray.50" borderRadius="md">
                                    <Text fontSize="xs" color="gray.700">
                                        <Text as="span" fontWeight="semibold">{metricItem.metric.properties.name}:</Text>{' '}
                                        {metricItem.metric.properties.value || metricItem.metric.properties.single_value}
                                        {metricItem.created_by?.properties && (
                                            <Text as="span" color="gray.600"> ({metricItem.created_by.properties.name})</Text>
                                        )}
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    </Box>
                )}

                {/* Implementation Evidence Section */}
                {filteredEvidenceTypes.length > 0 && (
                    <Box
                        p={5}
                        bg="white"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="gray.200"
                        boxShadow="sm"
                    >
                        <Heading as="h3" size="sm" color="teal.700" mb={4}>
                            Implementation Evidence
                        </Heading>
                        <Stack spacing={4}>
                            {filteredEvidenceTypes.map((etype, index) => (
                                <Box
                                    key={index}
                                    p={4}
                                    bg="gray.50"
                                    borderRadius="md"
                                    borderLeft="4px solid"
                                    borderLeftColor="teal.400"
                                    className={etype.evidenceType?.properties?.retired ? 'retired' : undefined}
                                >
                                    <HStack spacing={2} mb={3}>
                                        <Badge colorScheme="teal" fontSize="xs">
                                            {etype.type}
                                        </Badge>
                                        {etype.evidenceType?.properties?.retired && (
                                            <Badge
                                                colorScheme="gray"
                                                variant="solid"
                                                fontSize="xs"
                                                title={etype.evidenceType.properties.retired_note || 'This implementation has been retired'}
                                            >
                                                Retired{etype.evidenceType.properties.retired_date ? ` ${String(etype.evidenceType.properties.retired_date)}` : ''}
                                            </Badge>
                                        )}
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
                                        <Text fontSize="xs" color="gray.700" mb={3}>
                                            {etype.evidenceType.properties.description}
                                        </Text>
                                    )}

                                    <VStack align="stretch" spacing={3}>
                                        {/* Documents */}
                                        {etype.docs?.length > 0 && (
                                            <Box>
                                                <Text fontSize="xs" color="gray.700" fontWeight="semibold" mb={2}>
                                                    Documents
                                                </Text>
                                                <Stack spacing={2} pl={3}>
                                                    {etype.docs.map((doc) => {
                                                        const docProps = doc.document?.properties;
                                                        if (!docProps) return null;
                                                        return (
                                                            <Box key={doc.document.id}>
                                                                <HStack spacing={2} align="baseline" flexWrap="wrap">
                                                                    <Link
                                                                        href={docProps.file_path || docProps.uri_path}
                                                                        isExternal
                                                                        color="teal.600"
                                                                        fontSize="xs"
                                                                    >
                                                                        • {docProps.name}
                                                                    </Link>
                                                                    <HStack spacing={1}>
                                                                        {(docProps.is_administrative_review_documentation === "True" || docProps.is_administrative_review_documentation === true) && (
                                                                            <Badge colorScheme="purple" fontSize="10px">Admin Review</Badge>
                                                                        )}
                                                                        {(docProps.is_milestone_and_measures_documentation === "True" || docProps.is_milestone_and_measures_documentation === true) && (
                                                                            <Badge colorScheme="blue" fontSize="10px">Milestones</Badge>
                                                                        )}
                                                                        {(docProps.depreciated === true) && (
                                                                            <Badge colorScheme="orange" fontSize="10px">Depreciated</Badge>
                                                                        )}
                                                                    </HStack>
                                                                </HStack>
                                                                {docProps.description && (
                                                                    <Text fontSize="xs" color="gray.600" pl={3} mt={1}>
                                                                        {docProps.description}
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        )}

                                        {/* Webpages */}
                                        {etype.webs?.length > 0 && (
                                            <Box>
                                                <Text fontSize="xs" color="gray.700" fontWeight="semibold" mb={2}>
                                                    Webpages
                                                </Text>
                                                <Stack spacing={2} pl={3}>
                                                    {etype.webs.map((web) => {
                                                        const webProps = web.webpage?.properties;
                                                        if (!webProps) return null;
                                                        return (
                                                            <Box key={web.webpage.id}>
                                                                <HStack spacing={2} align="baseline" flexWrap="wrap">
                                                                    <Link
                                                                        href={webProps.url}
                                                                        isExternal
                                                                        color="teal.600"
                                                                        fontSize="xs"
                                                                    >
                                                                        • {webProps.name || webProps.title}
                                                                    </Link>
                                                                    <HStack spacing={1}>
                                                                        {(webProps.no_longer_exists === true) && (
                                                                            <Badge colorScheme="red" fontSize="10px">No Longer Exists</Badge>
                                                                        )}
                                                                        {(webProps.depreciated === true) && (
                                                                            <Badge colorScheme="orange" fontSize="10px">Depreciated</Badge>
                                                                        )}
                                                                    </HStack>
                                                                </HStack>
                                                                {webProps.description && (
                                                                    <Text fontSize="xs" color="gray.600" pl={3} mt={1}>
                                                                        {webProps.description}
                                                                    </Text>
                                                                )}
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                            </Box>
                                        )}

                                        {/* Implementation Notes */}
                                        {etype.notes?.length > 0 && (
                                            <Box>
                                                <Text fontSize="xs" color="gray.700" fontWeight="semibold" mb={2}>
                                                    Notes
                                                </Text>
                                                <Stack spacing={1} pl={3}>
                                                    {etype.notes.map((note, idx) => (
                                                        <Text key={idx} fontSize="xs" color="gray.700">
                                                            • {note.note?.properties?.date_created || 'No date'}: {note.note?.properties?.content}
                                                        </Text>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}

                                        {/* Implementation Messages */}
                                        {etype.msgs?.length > 0 && (
                                            <Box>
                                                <Text fontSize="xs" color="gray.700" fontWeight="semibold" mb={2}>
                                                    Messages
                                                </Text>
                                                <Stack spacing={1} pl={3}>
                                                    {etype.msgs.map((msg, idx) => (
                                                        <Text key={idx} fontSize="xs" color="gray.700">
                                                            • {msg.message?.properties?.date_sent || 'No date'}: {msg.message?.properties?.content}
                                                        </Text>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}

                                        {/* Implementation Metrics */}
                                        {etype.metrics?.length > 0 && (
                                            <Box>
                                                <Text fontSize="xs" color="gray.700" fontWeight="semibold" mb={2}>
                                                    Metrics
                                                </Text>
                                                <Stack spacing={1} pl={3}>
                                                    {etype.metrics.map((metric, idx) => (
                                                        <Text key={idx} fontSize="xs" color="gray.700">
                                                            • {metric.properties.name}: <Text as="span" fontWeight="semibold">{metric.properties.value || metric.properties.single_value}</Text>
                                                        </Text>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        )}
                                    </VStack>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}
                    </VStack>
                </Box>

                {/* Right column: Evidence Quality Criteria (sticky on lg+) */}
                <Box
                    flex={{ base: 'none', lg: 1 }}
                    w={{ base: '100%', lg: 'auto' }}
                    minW={{ lg: '280px' }}
                    position={{ lg: 'sticky' }}
                    top={{ lg: 6 }}
                    alignSelf={{ lg: 'flex-start' }}
                >
                    {evidenceItem.statusLevel?.properties?.status_level && (
                        <EvidenceQualityPanel
                            currentStatusLevelName={evidenceItem.statusLevel.properties.status_level}
                        />
                    )}
                </Box>
            </Flex>
        </Box>
    );

}
export { generateReport, GenerateReportComponent };