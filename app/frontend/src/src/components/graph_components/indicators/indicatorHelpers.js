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

    // Documentation health across the indicator's implementations (evidenceTypes).
    // The documentation pool is documents AND webpages. A document is "active" unless
    // flagged depreciated (stored boolean, or the legacy string "True"); a webpage is
    // "active" unless flagged depreciated OR no_longer_exists (link rot — the page is
    // gone). We flag when ANY implementation has documentation but every item is dead —
    // the same per-implementation rule the implementations view uses
    // (allDocumentsDepreciated), so a report agrees with that view.
    //
    // Compound-query artifacts are filtered out:
    //   - phantom evidenceTypes ({type: null}) left when an SI has zero implementations,
    //   - phantom docs ({document: null}) / webs ({webpage: null}) left when an
    //     implementation has zero of that kind (otherwise the null counts as a spurious
    //     "active" item and suppresses the flag).
    const evidenceTypes = (ev.evidenceTypes || []).filter((et) => et && et.type);
    const isDeprecated = (v) => v === true || v === 'True';
    let totalDocCount = 0;
    let activeDocCount = 0;
    let anyImplAllDepreciated = false;
    for (const et of evidenceTypes) {
        const etDocs = (et.docs || []).filter((d) => d && d.document);
        const etWebs = (et.webs || []).filter((w) => w && w.webpage);
        let etActive = 0;
        let etTotal = 0;
        for (const d of etDocs) {
            etTotal += 1;
            if (!isDeprecated(d.document.properties?.depreciated)) { etActive += 1; }
        }
        for (const w of etWebs) {
            etTotal += 1;
            const wp = w.webpage.properties || {};
            if (!isDeprecated(wp.depreciated) && !isDeprecated(wp.no_longer_exists)) { etActive += 1; }
        }
        totalDocCount += etTotal;
        activeDocCount += etActive;
        if (etTotal > 0 && etActive === 0) anyImplAllDepreciated = true;
    }
    const implCount = evidenceTypes.length;

    // Some indicators are not met through traditional implementation work; when the
    // SI settings flag is set we suppress the missing-implementation diagnostic.
    const overrideImplementationRequirement =
        indicator.override_implementation_requirement === true ||
        indicator.override_implementation_requirement === 'True';

    return {
        compositeKey: indicator.composite_key,
        description: indicator.success_indicator,
        hasEvidence: Boolean(ev?.evidence),
        yearIdentifier: evProps.year_identifier || null,
        statusLevel: statusProps.status_level || null,
        statusValue: statusProps.status_value ?? null,
        personCount: ev.persons?.length || 0,
        implCount,
        noImplementations: implCount === 0,
        overrideImplementationRequirement,
        // Only flag missing implementations when the indicator actually requires them.
        flagMissingImplementation: implCount === 0 && !overrideImplementationRequirement,
        totalDocCount,
        activeDocCount,
        // At least one implementation has documents but every one is depreciated.
        noActiveDocs: anyImplAllDepreciated,
        annotationCount,
        approved: (ev.adminReviewers?.length || 0) > 0 || Boolean(evProps.administrative_review_complete),
        readyForReview: Boolean(evProps.ready_for_admin_review),
        workedThisYear: Boolean(evProps.worked_on_in_current_year),
        nextYear: Boolean(evProps.will_work_on_next_year),
        priority: evProps.priority_level || null,
    };
}
