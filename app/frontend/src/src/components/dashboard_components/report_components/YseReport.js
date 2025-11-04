import React from 'react';

function PlainTextReport({ evidenceItem, indicatorItem }) {
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

    // Function to generate the plain text report
    const generateReportText = () => {
        let report = '';

        // Filter main-level items
        const filteredNotes = filterByIncludeInReport(evidenceItem?.has_notes || [], 'note.properties');
        const filteredMessages = filterByIncludeInReport(evidenceItem?.has_messages || [], 'message.properties');
        const filteredMetrics = filterByIncludeInReport(evidenceItem?.has_metrics || [], 'metric.properties');
        const filteredPlans = filterByIncludeInReport(evidenceItem?.plans || [], 'properties');
        const filteredAdminReviewNotes = filterByIncludeInReport(evidenceItem?.adminReviewNotes || [], 'note.properties');

        // Accomplishments may be wrapped in an accomplishment property or directly have properties
        const filteredAccomplishments = (evidenceItem?.accomplishments || []).filter((item) => {
            if (!item) return false;
            const acc = item.accomplishment || item;
            const props = acc.properties || acc;
            return props.include_in_report !== false;
        });

        // Filter evidenceTypes and their nested content
        const filteredEvidenceTypes = (evidenceItem?.evidenceTypes || []).map((etype) => {
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

        // Indicator Information (if passed separately)
        if (indicatorItem?.properties) {
            report += `${evidenceItem?.evidence?.properties?.year_identifier || indicatorItem.properties.composite_key}\n`;
            report += `${indicatorItem.properties.success_indicator}\n`;
            report += `Composite Key: ${indicatorItem.properties.composite_key}\n`;
            report += `Status: ${indicatorItem.properties.removed ? 'Removed' : 'Active'} | Date Added: ${indicatorItem.properties.date_added}\n\n`;
        }
        // Or if indicator is part of evidenceItem
        else if (evidenceItem?.indicator?.properties) {
            const indicatorProps = evidenceItem.indicator.properties;
            report += `${evidenceItem.evidence.properties.year_identifier}\n`;
            report += `${indicatorProps.success_indicator}\n`;
            report += `Composite Key: ${indicatorProps.composite_key}\n`;
            report += `Status: ${indicatorProps.removed ? 'Removed' : 'Active'} | Date Added: ${indicatorProps.date_added}\n\n`;
        }

        // Evidence Information
        if (evidenceItem?.evidence?.properties) {
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

            // Admin Review Notes
            if (filteredAdminReviewNotes.length > 0) {
                report += `\nAdmin Review Notes:\n`;
                filteredAdminReviewNotes.forEach((noteItem) => {
                    const noteProps = noteItem.note.properties;
                    report += `  • ${noteProps.date_created || 'No date'}`;
                    if (noteItem.created_by?.properties) {
                        report += ` - ${noteItem.created_by.properties.name}`;
                    }
                    report += '\n';
                    report += `    ${noteProps.content}\n`;
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

        // Plans and Accomplishments
        if (filteredPlans.length > 0 || filteredAccomplishments.length > 0) {
            report += `\nPLANS AND ACCOMPLISHMENTS\n`;
            report += `${'='.repeat(50)}\n`;

            // Plans
            if (filteredPlans.length > 0) {
                report += `\nPlans (${filteredPlans.length})\n`;
                report += `${'-'.repeat(20)}\n`;
                filteredPlans.forEach((plan) => {
                    const planProps = plan.properties;

                    // Find related accomplishment if plan is completed
                    const relatedAccomplishment = planProps.plan_status === 'Completed'
                        ? filteredAccomplishments.find(accData => {
                            const acc = accData.accomplishment || accData;
                            const accProps = acc.properties || acc;
                            return (
                                accProps.name === `Accomplished: ${planProps.name}` ||
                                accProps.name?.includes(planProps.name) ||
                                accProps.description?.includes(planProps.name) ||
                                accProps.description?.includes(planProps.description)
                            );
                        })
                        : null;

                    report += `\n• ${planProps.name}\n`;
                    report += `  Status: ${planProps.abandoned ? 'Abandoned' : planProps.plan_status}`;

                    // Add badges/flags
                    const flags = [];
                    if (planProps.is_key_plan) flags.push('Key Plan');
                    if (planProps.is_campus_plan) flags.push('Campus Plan');
                    if (flags.length > 0) {
                        report += ` [${flags.join(', ')}]`;
                    }
                    report += '\n';

                    if (planProps.description) {
                        report += `  Description: ${planProps.description}\n`;
                    }

                    // Show completion notes if available
                    if (planProps.plan_status === 'Completed' && planProps.completion_notes) {
                        report += `  Completion Notes: ${planProps.completion_notes}\n`;
                    }

                    // Show associated accomplishment if plan is completed
                    if (planProps.plan_status === 'Completed' && relatedAccomplishment) {
                        const accData = relatedAccomplishment.accomplishment || relatedAccomplishment;
                        const accProps = accData.properties || accData;
                        report += `  → Accomplishment: ${accProps.description || accProps.name}`;
                        if (planProps.completed_year_name) {
                            report += ` (${planProps.completed_year_name})`;
                        }
                        report += '\n';
                    }

                    // Show abandonment notes if abandoned
                    if (planProps.abandoned && planProps.abandoned_notes) {
                        report += `  Abandonment Notes: ${planProps.abandoned_notes}\n`;
                    }
                });
            }

            // Accomplishments (standalone - not related to plans)
            const standaloneAccomplishments = filteredAccomplishments.filter(accData => {
                const acc = accData.accomplishment || accData;
                const accProps = acc.properties || acc;
                // Filter out accomplishments that are already shown with plans
                return !filteredPlans.some(plan =>
                    plan.properties.plan_status === 'Completed' &&
                    (accProps.name === `Accomplished: ${plan.properties.name}` ||
                     accProps.name?.includes(plan.properties.name) ||
                     accProps.description?.includes(plan.properties.name))
                );
            });

            if (standaloneAccomplishments.length > 0) {
                report += `\nAccomplishments (${standaloneAccomplishments.length})\n`;
                report += `${'-'.repeat(20)}\n`;
                standaloneAccomplishments.forEach((accData) => {
                    const acc = accData.accomplishment || accData;
                    const accProps = acc.properties || acc;

                    report += `\n• ${accProps.name}\n`;
                    if (accProps.description) {
                        report += `  Description: ${accProps.description}\n`;
                    }
                    if (accProps.academic_year || acc.academic_year) {
                        report += `  Academic Year: ${accProps.academic_year || acc.academic_year}\n`;
                    }

                    // Show advanced YSE list if available
                    if (accData.advances_yse_list && accData.advances_yse_list.length > 0) {
                        report += `  Advances YSE: ${accData.advances_yse_list.map(yse =>
                            yse.properties?.year_identifier || yse.year_identifier || yse
                        ).join(', ')}\n`;
                    }
                });
            }
        }

        return report;
    };

    const reportText = generateReportText();

    return (
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
            {(indicatorItem?.properties || evidenceItem?.indicator?.properties) && (
                <>
                    <h2>{evidenceItem?.evidence?.properties?.year_identifier || indicatorItem?.properties?.composite_key}</h2>
                    <h3>Plain Text Report</h3>
                </>
            )}
            <textarea
                style={{ width: '100%', height: '500px', border: '1px solid #ccc' }}
                value={reportText}
                readOnly
                aria-label="Plain text report content"
            />
        </div>
    );
}

export default PlainTextReport;