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

/** Query-string keys, one per facet. */
export const FILTER_PARAM = 'attention';
export const STATUS_PARAM = 'status';
export const TREND_PARAM = 'trend';
export const COMMUNITY_PARAM = 'community';
export const SEARCH_PARAM = 'q';

/**
 * Communities of practice holding a stake in an indicator, ANDed.
 *
 * Unlike Status and Trend — where the values are alternatives and OR is the only
 * useful reading — communities are independent claimants, and the question worth
 * asking is which indicators BOTH hold. 20 of the 122 live indicators are shared
 * between two communities; an OR would bury exactly those in the union of two large
 * single-community lists.
 *
 * Matched by name: the URL is meant to be read and pasted by people, and an unknown
 * name is dropped by the parser, so a renamed community degrades to "filter ignored"
 * rather than a broken link.
 */
export function matchesCommunities(summary, selectedNames) {
    if (!selectedNames || selectedNames.length === 0) return true;
    const held = new Set((summary.communities || []).map((c) => c?.name).filter(Boolean));
    return selectedNames.every((name) => held.has(name));
}

/** Every community name present in the loaded data, name-sorted — the picker's options. */
export function availableCommunities(data, wgDataKeys) {
    const names = new Set();
    for (const dataKey of wgDataKeys || []) {
        for (const goal of data?.[dataKey]?.goals || []) {
            for (const ind of goal.indicators || []) {
                for (const c of ind?.indicator?.properties?.communities || []) {
                    if (c?.name) names.add(c.name);
                }
            }
        }
    }
    return [...names].sort();
}

// The trailing status bucket: no evidence for the year, or evidence carrying no
// status — "not yet on the maturity ladder". Defined HERE rather than in
// reportMetrics because the status filter and the distribution chart must bucket
// identically; reportMetrics re-exports it for its existing importers.
export const NO_EVIDENCE = 'No evidence';

/**
 * Which status bucket an indicator falls in — the same rule the distribution chart
 * counts by, so filtering to "Defined" yields exactly the rows the Defined bar
 * measures. Anything off the ladder (no evidence, or a status the vocabulary does
 * not know) lands in NO_EVIDENCE rather than being silently dropped.
 */
export function statusBucket(summary, statusOrder) {
    const onLadder = summary.hasEvidence
        && summary.statusLevel
        && statusOrder.includes(summary.statusLevel);
    return onLadder ? summary.statusLevel : NO_EVIDENCE;
}

// Year-over-year trend buckets, mirroring reportMetrics.tallyTrends — an indicator
// with no comparable prior year is 'unknown', not omitted.
export const TREND_OPTIONS = [
    { key: 'improving', label: 'Improving' },
    { key: 'static', label: 'Static' },
    { key: 'declining', label: 'Declining' },
    { key: 'unknown', label: 'No trend data' },
];

export const TREND_KEYS = TREND_OPTIONS.map((t) => t.key);

export function trendBucket(trendRow) {
    const t = trendRow?.trend;
    return (t === 'improving' || t === 'declining' || t === 'static') ? t : 'unknown';
}

/**
 * Free-text match over an indicator. Matches the DESCRIPTION (the success-indicator
 * text) and also the composite key, so typing "1.1-web" finds the row by its ID —
 * a strict superset of description search that never surprises.
 * Case- and whitespace-insensitive; an empty query matches everything.
 */
export function matchesSearch(summary, q) {
    const needle = (q || '').trim().toLowerCase();
    if (!needle) return true;
    const haystack = `${summary.description || ''} ${summary.compositeKey || ''}`.toLowerCase();
    return haystack.includes(needle);
}

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

/** The whole filter state. Every field optional; this is the "nothing selected" value. */
export const EMPTY_FILTER_STATE = { attention: [], status: [], trend: [], community: [], q: '' };

export function isFilterStateEmpty(state) {
    return !state
        || (!state.attention?.length && !state.status?.length && !state.trend?.length
            && !state.community?.length && !(state.q || '').trim());
}

/**
 * Does one indicator survive the whole filter state?
 *
 * Facets combine with AND (each narrows). WITHIN a facet the rule depends on whether
 * the values are alternatives or independent claims:
 *   Status, Trend        OR  — an indicator sits on one rung and has one direction, so
 *                              picking two can only mean "either"
 *   Attention, Community AND — independent defects / independent claimants, where the
 *                              conjunction is the question worth asking
 */
export function matchesFilterState(summary, trendRow, state, statusOrder) {
    if (!state) return true;
    if (!matchesFilters(summary, state.attention)) return false;
    if (!matchesSearch(summary, state.q)) return false;
    if (state.status?.length && !state.status.includes(statusBucket(summary, statusOrder))) return false;
    if (state.trend?.length && !state.trend.includes(trendBucket(trendRow))) return false;
    if (!matchesCommunities(summary, state.community)) return false;
    return true;
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
export function filterReportData(data, state, ctx) {
    if (!data || isFilterStateEmpty(state)) return data;
    const { wgDataKeys, summarize, findTrend, statusOrder } = ctx;

    const keep = (ind) => matchesFilterState(
        summarize(ind),
        findTrend(data.yoyTrends, ind?.indicator?.properties?.composite_key),
        state,
        statusOrder,
    );

    const out = { ...data };
    for (const dataKey of wgDataKeys) {
        const tree = data[dataKey];
        if (!tree) continue;

        const goals = (tree.goals || [])
            .map((goal) => ({ ...goal, indicators: (goal.indicators || []).filter(keep) }))
            .filter((goal) => goal.indicators.length > 0);

        // A group with no surviving goal is dropped entirely rather than rendered as an
        // empty heading — the page-level empty state speaks for the whole report.
        out[dataKey] = goals.length > 0 ? { ...tree, goals } : undefined;
    }
    return out;
}

/** How many indicators survive the active filters, and how many there were. */
export function countFiltered(data, state, ctx) {
    const { wgDataKeys, summarize, findTrend, statusOrder } = ctx;
    let total = 0;
    let shown = 0;
    for (const dataKey of wgDataKeys) {
        for (const goal of data?.[dataKey]?.goals || []) {
            for (const ind of goal.indicators || []) {
                total += 1;
                const ok = matchesFilterState(
                    summarize(ind),
                    findTrend(data?.yoyTrends, ind?.indicator?.properties?.composite_key),
                    state,
                    statusOrder,
                );
                if (ok) shown += 1;
            }
        }
    }
    return { shown, total };
}
