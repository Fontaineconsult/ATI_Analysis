// Maturity status color by status_value (0..5), matching the Status Levels settings view.
export const STATUS_COLORS = {
    '0': 'red',
    '1': 'orange',
    '2': 'yellow',
    '3': 'green',
    '4': 'green',
    '5': 'green', // not 'teal' — that key is the brand-blue alias, and status must stay in the maturity ramp
};

export function getStatusColor(statusValue) {
    return STATUS_COLORS[String(statusValue)] || 'gray';
}

// Priority badge color (priority_level: top | high | neutral | low).
export const PRIORITY_COLORS = {
    top: 'red',
    high: 'orange',
    neutral: 'gray',
    low: 'blue',
};

/**
 * Flatten one indicator wrapper { indicator, evidences: [evidenceData] } into the overview
 * fields the list rows and the detail header need. Reads straight from the compound-query shape.
 */
export function getIndicatorSummary(wrapper) {
    const indicator = wrapper?.indicator?.properties || {};
    const ev = wrapper?.evidences?.[0] || {};
    const evProps = ev?.evidence?.properties || {};
    const statusProps = ev?.statusLevel?.properties || {};

    const annotationCount =
        (ev.has_notes?.length || 0) +
        (ev.has_messages?.length || 0) +
        (ev.has_metrics?.length || 0) +
        (ev.plans?.length || 0);

    return {
        compositeKey: indicator.composite_key,
        description: indicator.success_indicator,
        hasEvidence: Boolean(ev?.evidence),
        yearIdentifier: evProps.year_identifier || null,
        statusLevel: statusProps.status_level || null,
        statusValue: statusProps.status_value ?? null,
        personCount: ev.persons?.length || 0,
        implCount: ev.evidenceTypes?.length || 0,
        annotationCount,
        approved: (ev.adminReviewers?.length || 0) > 0 || Boolean(evProps.administrative_review_complete),
        readyForReview: Boolean(evProps.ready_for_admin_review),
        workedThisYear: Boolean(evProps.worked_on_in_current_year),
        nextYear: Boolean(evProps.will_work_on_next_year),
        priority: evProps.priority_level || null,
    };
}
