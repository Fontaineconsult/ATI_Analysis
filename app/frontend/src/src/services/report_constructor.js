


function generateReport(data) {
    let report = '';

    // Extract indicator information
    const indicatorProps = data.indicator.properties;
    report += `Success Indicator ${indicatorProps.number}: ${indicatorProps.success_indicator}\n`;
    report += `Composite Key: ${indicatorProps.composite_key}\n`;
    report += `Removed: ${indicatorProps.removed ? 'Yes' : 'No'}\n`;
    report += `Date Added: ${indicatorProps.date_added}\n\n`;

    // Process each evidence
    data.evidences.forEach((evidenceItem, index) => {
        report += `Evidence ${index + 1}:\n`;

        // Evidence properties
        const evidenceProps = evidenceItem.evidence.properties;
        report += `  Year Identifier: ${evidenceProps.year_identifier}\n`;

        // Include additional evidence properties if they exist
        if ('administrative_review_complete' in evidenceProps) {
            report += `  Administrative Review Complete: ${evidenceProps.administrative_review_complete ? 'Yes' : 'No'}\n`;
        }
        if ('administrative_review_completed_date' in evidenceProps) {
            report += `  Administrative Review Completed Date: ${evidenceProps.administrative_review_completed_date}\n`;
        }

        // Status Level
        if (evidenceItem.statusLevel) {
            const statusProps = evidenceItem.statusLevel.properties;
            report += `  Status Level: ${statusProps.status_level}\n`;
            // Removed the following lines as per your request:
            // report += `  Status Value: ${statusProps.status_value}\n`;
            // report += `  Description of Procedures: ${statusProps.description_of_procedures}\n`;
            // report += `  Description of Documentation: ${statusProps.description_of_documentation}\n`;
            // report += `  Description of Resources: ${statusProps.description_of_resources}\n`;
            // report += `  Description of Documentation Evidence: ${statusProps.description_of_documentation_evidence}\n`;
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

        report += '\n'; // Add space between evidences
    });

    return report;
}
