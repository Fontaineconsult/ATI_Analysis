// Attention filters for the View Reports landing — ONE definition of each
// diagnostic, shared by the stat tiles that count it and the tables that filter on it.
//
// These predicates used to live inline inside reportMetrics.summarize(). Reading them
// there and re-deriving them in the tables would let a tile say "91" while the filtered
// list showed a different number, and nothing would flag the drift. Everything below is
// pure so both consumers can call it freely.
//
// Each entry:
//   key      URL token — stable, kebab-case; changing one breaks shared links
//   metric   the field summarize() publishes for this filter (tile value)
//   label    tile + chip label
//   help     tile sub-label
//   accent   tile top-border colour
//   warn     paint the count red once non-zero (a gap needing action)
//   match    (summary from getIndicatorSummary) => boolean
//
// Every predicate is scoped to hasEvidence: an indicator with no YearSuccessEvidence
// for the year is "not started", not a quality gap, and counting it as one would
// inflate every tile with indicators nobody has begun.

export const INDICATOR_FILTERS = {
    'pending-review': {
        key: 'pending-review',
        metric: 'reviewPending',
        label: '⚠ Pending Review',
        help: 'awaiting admin review',
        accent: 'orange.400',
        warn: true,
        match: (s) => s.hasEvidence && !s.approved,
    },
    unassigned: {
        key: 'unassigned',
        metric: 'unassignedCount',
        label: '⚠ Unassigned',
        help: 'no person assigned',
        accent: 'red.400',
        warn: true,
        match: (s) => s.hasEvidence && s.personCount === 0 && !s.overrideImplementationRequirement,
    },
    'docs-deprecated': {
        key: 'docs-deprecated',
        metric: 'noActiveDocsCount',
        label: '⚠ Docs Deprecated',
        help: 'all docs deprecated',
        accent: 'red.400',
        warn: true,
        match: (s) => s.hasEvidence && s.noActiveDocs,
    },
    undocumented: {
        key: 'undocumented',
        metric: 'undocumentedCount',
        label: '⚠ Undocumented',
        help: 'impls with no docs/webpages',
        accent: 'orange.400',
        warn: true,
        match: (s) => s.hasEvidence && s.undocumentedImplCount > 0,
    },
    'missing-implementation': {
        key: 'missing-implementation',
        metric: 'missingImplCount',
        label: '⚠ Missing Implementation',
        help: 'no implementations',
        accent: 'orange.400',
        warn: true,
        match: (s) => s.hasEvidence && s.flagMissingImplementation,
    },
    'ready-for-review': {
        key: 'ready-for-review',
        metric: 'readyForReviewCount',
        label: 'Ready for Review',
        help: 'queued for sign-off',
        accent: 'teal.400',
        warn: false,
        match: (s) => s.hasEvidence && s.readyForReview && !s.approved,
    },
};

// Render + URL-serialisation order. Serialising in a fixed order means the same set of
// filters always produces the same URL, so two people sharing a link share a string.
export const FILTER_ORDER = [
    'pending-review',
    'unassigned',
    'docs-deprecated',
    'undocumented',
    'missing-implementation',
    'ready-for-review',
];

export const FILTER_LIST = FILTER_ORDER.map((k) => INDICATOR_FILTERS[k]);

/** The query-string key. Namespaced so status/working-group facets can be added later. */
export const FILTER_PARAM = 'attention';

export function isValidFilterKey(key) {
    return Object.prototype.hasOwnProperty.call(INDICATOR_FILTERS, key);
}

/**
 * Parse the query-string value into an ordered, deduped, validated key list.
 * Unknown tokens are DROPPED rather than throwing — a stale or hand-edited link
 * should degrade to the filters it still understands, not a broken page.
 */
export function parseFilterParam(raw) {
    if (!raw) return [];
    const seen = new Set(
        String(raw)
            .split(',')
            .map((t) => t.trim())
            .filter((t) => isValidFilterKey(t)),
    );
    return FILTER_ORDER.filter((k) => seen.has(k));
}

/** Serialise back to a query-string value; '' means "no filters" (drop the param). */
export function serializeFilterParam(keys) {
    const seen = new Set((keys || []).filter(isValidFilterKey));
    return FILTER_ORDER.filter((k) => seen.has(k)).join(',');
}

/**
 * AND semantics: each active filter NARROWS the set.
 *
 * Chosen over OR because these are diagnostics and the useful question is
 * conjunctive — "which of the ready-for-review ones are also undocumented?" A union
 * would answer "anything wrong anywhere", which the unfiltered report already shows.
 * The filter bar states the resulting count so a narrowing to zero reads as a real
 * answer rather than a broken page.
 */
export function matchesFilters(summary, activeKeys) {
    if (!activeKeys || activeKeys.length === 0) return true;
    return activeKeys.every((k) => INDICATOR_FILTERS[k]?.match(summary));
}

/**
 * Narrow a DataContext tree to the indicators matching `activeKeys`, dropping goals
 * and working groups left with nothing.
 *
 * Filtering HERE rather than inside the table's render functions is deliberate: the
 * tables already carry a careful heading hierarchy (h2 page → h3 group → h4 goal →
 * h5 row) and roving arrow-key navigation, and skipping rows mid-render would leave
 * empty goal cards and orphan group headings in that outline. Handing the tables a
 * smaller tree keeps their structure honest — what is announced is what is there.
 *
 * Returns the original object untouched when no filters are active, so the common
 * case costs nothing and referential equality is preserved for memo consumers.
 *
 * @param {object} data       DataContext data (per-WG trees keyed by dataKey, + yoyTrends)
 * @param {string[]} activeKeys
 * @param {string[]} wgDataKeys the DataContext keys holding working-group trees
 * @param {function} summarize (indicatorWrapper) => summary
 */
export function filterReportData(data, activeKeys, wgDataKeys, summarize) {
    if (!data || !activeKeys || activeKeys.length === 0) return data;

    const out = { ...data };
    for (const dataKey of wgDataKeys) {
        const tree = data[dataKey];
        if (!tree) continue;

        const goals = (tree.goals || [])
            .map((goal) => ({
                ...goal,
                indicators: (goal.indicators || []).filter((ind) => matchesFilters(summarize(ind), activeKeys)),
            }))
            .filter((goal) => goal.indicators.length > 0);

        // A group with no surviving goal is dropped entirely rather than rendered as an
        // empty heading — the page-level empty state speaks for the whole report.
        out[dataKey] = goals.length > 0 ? { ...tree, goals } : undefined;
    }
    return out;
}

/** How many indicators survive the active filters, and how many there were. */
export function countFiltered(data, activeKeys, wgDataKeys, summarize) {
    let total = 0;
    let shown = 0;
    for (const dataKey of wgDataKeys) {
        for (const goal of data?.[dataKey]?.goals || []) {
            for (const ind of goal.indicators || []) {
                total += 1;
                if (matchesFilters(summarize(ind), activeKeys)) shown += 1;
            }
        }
    }
    return { shown, total };
}
