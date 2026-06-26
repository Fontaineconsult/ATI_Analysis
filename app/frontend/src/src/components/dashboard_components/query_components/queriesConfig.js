// Config-driven labels/colors for the Queries area (design-sense §1.4). Display labels
// come from useSettings().vocab (the backend's PUBLIC_VOCABULARIES) when available; this
// module supplies the colorScheme per value plus a sensible fallback label.

export const STATUS_META = {
    open:        { label: 'Open',        colorScheme: 'orange' },
    in_progress: { label: 'In Progress', colorScheme: 'blue' },
    settled:     { label: 'Settled',     colorScheme: 'green' },
};

export const CATEGORY_META = {
    policy_decision:         { label: 'Policy Decision',         colorScheme: 'purple' },
    resource_request:        { label: 'Resource Request',        colorScheme: 'teal' },
    technical_clarification: { label: 'Technical Clarification', colorScheme: 'cyan' },
    risk_compliance:         { label: 'Risk / Compliance',       colorScheme: 'red' },
    information_gap:         { label: 'Information Gap',          colorScheme: 'gray' },
};

export const STATUS_ORDER = ['open', 'in_progress', 'settled'];

export function getStatusMeta(status) {
    return STATUS_META[status] || { label: status || 'Unknown', colorScheme: 'gray' };
}

export function getCategoryMeta(category) {
    return CATEGORY_META[category] || { label: category || 'Uncategorized', colorScheme: 'gray' };
}

// A vocab dict {key: label} -> [{value, label}] for a <Select>. Falls back to the
// config meta labels when the vocab hasn't loaded.
export function vocabToOptions(vocabDict, fallbackMeta) {
    if (vocabDict && typeof vocabDict === 'object' && Object.keys(vocabDict).length) {
        return Object.entries(vocabDict).map(([value, label]) => ({ value, label }));
    }
    return Object.entries(fallbackMeta || {}).map(([value, meta]) => ({ value, label: meta.label }));
}

// Diagnostic counts for the stat strip.
export function summarizeQueries(queries = []) {
    const summary = { total: queries.length, open: 0, in_progress: 0, settled: 0 };
    for (const q of queries) {
        if (q.status in summary) summary[q.status] += 1;
    }
    return summary;
}
