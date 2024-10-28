import React from 'react';

function PlainTextReport({ evidenceItem, indicatorItem }) {
    // Function to generate the plain text report
    const generateReportText = () => {
        let report = '';

        // Indicator Information
        if (indicatorItem && indicatorItem.properties) {
            report += `Success Indicator ${indicatorItem.properties.number}\n`;
            report += `${indicatorItem.properties.success_indicator}\n\n`;

            // Composite Key as a minor heading
            report += `--- Composite Key: ${indicatorItem.properties.composite_key} ---\n\n`;

            report += `Removed: ${indicatorItem.properties.removed ? 'Yes' : 'No'}\n`;
            report += `Date Added: ${indicatorItem.properties.date_added}\n\n`;
        }

        // Evidence Information
        if (evidenceItem && evidenceItem.evidence && evidenceItem.evidence.properties) {
            report += `Evidence\n\n`;
            report += `Year Identifier: ${evidenceItem.evidence.properties.year_identifier}\n`;

            if ('administrative_review_complete' in evidenceItem.evidence.properties) {
                report += `Administrative Review Complete: ${
                    evidenceItem.evidence.properties.administrative_review_complete ? 'Yes' : 'No'
                }\n`;
            }
            if ('administrative_review_completed_date' in evidenceItem.evidence.properties) {
                report += `Administrative Review Completed Date: ${evidenceItem.evidence.properties.administrative_review_completed_date}\n`;
            }

            // Status Level
            if (evidenceItem.statusLevel && evidenceItem.statusLevel.properties) {
                report += `Status Level: ${evidenceItem.statusLevel.properties.status_level}\n`;
            }

            // Persons Involved
            if (evidenceItem.persons && evidenceItem.persons.length > 0) {
                report += `\nPersons Involved:\n`;
                evidenceItem.persons.forEach((person) => {
                    if (person && person.properties) {
                        report += `- ${person.properties.name} - ${person.properties.title} (${person.properties.email})\n`;
                    }
                });
            }

            // Admin Reviewers
            if (evidenceItem.adminReviewers && evidenceItem.adminReviewers.length > 0) {
                report += `\nAdmin Reviewers:\n`;
                evidenceItem.adminReviewers.forEach((reviewer) => {
                    if (reviewer && reviewer.properties) {
                        report += `- ${reviewer.properties.name} - ${reviewer.properties.title} (${reviewer.properties.email})\n`;
                    }
                });
            }

            // Notes
            if (evidenceItem.has_notes && evidenceItem.has_notes.length > 0) {
                report += `\nNotes:\n`;
                evidenceItem.has_notes.forEach((noteItem, index) => {
                    if (noteItem && noteItem.note && noteItem.note.properties) {
                        const noteProps = noteItem.note.properties;
                        report += `\nNote ${index + 1}:\n`;
                        report += `Date: ${noteProps.date_created || 'N/A'}\n`;
                        report += `${noteProps.content}\n`;
                        if (noteProps.file_path || noteProps.uri_path) {
                            report += `Attachment: ${noteProps.file_path || noteProps.uri_path}\n`;
                        }
                        if (noteItem.created_by && noteItem.created_by.properties) {
                            report += `Created by: ${noteItem.created_by.properties.name}\n`;
                        }
                    }
                });
            }

            // Messages
            if (evidenceItem.has_messages && evidenceItem.has_messages.length > 0) {
                report += `\nMessages:\n`;
                evidenceItem.has_messages.forEach((messageItem, index) => {
                    if (
                        messageItem &&
                        messageItem.message &&
                        messageItem.message.properties
                    ) {
                        const messageProps = messageItem.message.properties;
                        report += `\nMessage ${index + 1}:\n`;
                        report += `Date: ${messageProps.date_sent || 'N/A'}\n`;
                        report += `${messageProps.content}\n`;
                        if (messageProps.file_path || messageProps.uri_path) {
                            report += `Attachment: ${messageProps.file_path || messageProps.uri_path}\n`;
                        }
                        if (messageItem.created_by && messageItem.created_by.properties) {
                            report += `Sent by: ${messageItem.created_by.properties.name}\n`;
                        }
                    }
                });
            }

            // Metrics
            if (evidenceItem.has_metrics && evidenceItem.has_metrics.length > 0) {
                report += `\nMetrics:\n`;
                evidenceItem.has_metrics.forEach((metricItem) => {
                    if (
                        metricItem &&
                        metricItem.metric &&
                        metricItem.metric.properties
                    ) {
                        report += `- Metric: ${metricItem.metric.properties.name}, Value: ${metricItem.metric.properties.value}\n`;
                        if (metricItem.created_by && metricItem.created_by.properties) {
                            report += `  Recorded by: ${metricItem.created_by.properties.name}\n`;
                        }
                    }
                });
            }

            // Evidence Types
            if (evidenceItem.evidenceTypes && evidenceItem.evidenceTypes.length > 0) {
                report += `\nEvidence Types:\n`;
                evidenceItem.evidenceTypes.forEach((etype, index) => {
                    if (etype) {
                        report += `\nEvidence Type ${index + 1}:\n`;
                        report += `Type: ${etype.type || 'N/A'}\n`;
                        if (etype.evidenceType && etype.evidenceType.properties) {
                            report += `Title: ${etype.evidenceType.properties.title}\n`;
                            report += `Description: ${etype.evidenceType.properties.description}\n`;
                        }

                        // Documents
                        if (etype.docs && etype.docs.length > 0) {
                            report += `\nDocuments:\n`;
                            etype.docs.forEach((doc) => {
                                if (doc && doc.properties) {
                                    report += `- ${doc.properties.name}: ${
                                        doc.properties.file_path || doc.properties.uri_path
                                    }\n`;
                                }
                            });
                        }

                        // Webpages
                        if (etype.webs && etype.webs.length > 0) {
                            report += `\nWebpages:\n`;
                            etype.webs.forEach((web) => {
                                if (web && web.properties) {
                                    report += `- ${web.properties.title}: ${web.properties.url}\n`;
                                }
                            });
                        }

                        // Notes
                        if (etype.notes && etype.notes.length > 0) {
                            report += `\nNotes:\n`;
                            etype.notes.forEach((note, idx) => {
                                if (note && note.properties) {
                                    report += `\nNote ${idx + 1}:\n`;
                                    report += `Date: ${note.properties.date_created || 'N/A'}\n`;
                                    report += `${note.properties.content}\n`;
                                    if (note.properties.file_path || note.properties.uri_path) {
                                        report += `Attachment: ${note.properties.file_path || note.properties.uri_path}\n`;
                                    }
                                }
                            });
                        }

                        // Messages
                        if (etype.msgs && etype.msgs.length > 0) {
                            report += `\nMessages:\n`;
                            etype.msgs.forEach((msg, idx) => {
                                if (msg && msg.properties) {
                                    report += `\nMessage ${idx + 1}:\n`;
                                    report += `Date: ${msg.properties.date_sent || 'N/A'}\n`;
                                    report += `${msg.properties.content}\n`;
                                    if (msg.properties.file_path || msg.properties.uri_path) {
                                        report += `Attachment: ${msg.properties.file_path || msg.properties.uri_path}\n`;
                                    }
                                }
                            });
                        }

                        // Metrics
                        if (etype.metrics && etype.metrics.length > 0) {
                            report += `\nMetrics:\n`;
                            etype.metrics.forEach((metric) => {
                                if (metric && metric.properties) {
                                    report += `- Metric: ${metric.properties.name}, Value: ${metric.properties.value}\n`;
                                }
                            });
                        }
                    }
                });
            }
        }

        return report;
    };

    const reportText = generateReportText();

    return (
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            {indicatorItem && indicatorItem.properties && (
                <>
                    <h4>{`Success Indicator ${indicatorItem.properties.number}`}</h4>
                    <h5>{`Composite Key: ${indicatorItem.properties.composite_key}`}</h5>
                </>
            )}
            <textarea
                style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}
                value={reportText}
                readOnly
            />
        </div>
    );
}

export default PlainTextReport;
