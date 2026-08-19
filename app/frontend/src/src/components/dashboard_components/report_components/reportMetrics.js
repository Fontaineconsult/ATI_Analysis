// Campus-wide report metrics — pure aggregation layer.
//
// The "View Reports" landing computes a high-level read of the whole campus from the
// three working-group trees already loaded in DataContext. Rather than re-deriving any
// per-indicator field, this folds the canonical per-indicator diagnostics from
// getIndicatorSummary (graph_components/indicators/indicatorHelpers.js) — the same source
// the SI list rows and the indicator detail header use — so the overview always agrees
// with the rows below it.
//
// Pure + side-effect-free: easy to unit-test, safe to call inside a useMemo.

import { getIndicatorSummary } from '../../graph_components/indicators/indicatorHelpers';
import { STATUS_LEVELS_ORDER } from '../../../services/utils/statusColors';
import { WG_DEFS } from '../../../styles/workingGroupIdentity';
import { FILTER_LIST, NO_EVIDENCE, statusBucket, trendBucket } from './reportFilters';

// The trailing status-distribution bucket lives in reportFilters now — the status
// filter and this chart must bucket identically or "filter to Defined" would not
// return the rows the Defined bar counts. Re-exported for existing importers.
export { NO_EVIDENCE };

// Working groups in render order (DataContext key, yoyTrends key keyed by name, SFBRN
// identity accent), derived from the WG single-source-of-truth. Re-exported so existing
// consumers/tests keep importing WG_DEFS from here.
export { WG_DEFS };

const pct = (count, total) => (total > 0 ? Math.round((count / total) * 100) : 0);

/**
 * Find an indicator's year-over-year trend row in the yoyTrends payload (keyed by WG name).
 * Matches on `composite_key` — the trends query returns it directly. (The old code parsed it
 * out of `evidence_year_identifier`, which silently never matched: that identifier ends in a
 * campus suffix, e.g. "2025-2026-1.2-web-csueb", so `endsWith('-1.2-web')` was always false.)
 * The `summary` key (not an array) is skipped by the Array.isArray guard.
 *
 * @param {object} yoyTrends    data.yoyTrends (keyed by working-group name)
 * @param {string} compositeKey e.g. "1.2-web"
 * @returns {object|null} the trend row { trend, past_value, current_value, ... } or null
 */
export function findTrendForIndicator(yoyTrends, compositeKey) {
    if (!yoyTrends || !compositeKey) return null;
    for (const rows of Object.values(yoyTrends)) {
        if (!Array.isArray(rows)) continue;
        const row = rows.find((r) => r?.composite_key === compositeKey);
        if (row) return row;
    }
    return null;
}

// Flatten one working-group tree into a flat array of indicator wrappers.
function indicatorsOf(wgData) {
    return (wgData?.goals || []).flatMap((g) => g?.indicators || []);
}

/**
 * Does the current campus+year selection have ANY YearSuccessEvidence at all? A cheap,
 * short-circuiting check over the loaded working-group trees (mirrors getIndicatorSummary's
 * `hasEvidence = Boolean(ev?.evidence)`). Used by the global "no YSE" banner — no need to
 * build the full metrics object just to answer this.
 *
 * @param {object} data DataContext data ({ web, procurement, instructionalMaterials, ... })
 * @returns {boolean}
 */
export function selectionHasYse(data) {
    if (!data) return false;
    return WG_DEFS.some((def) =>
        (data[def.key]?.goals || []).some((g) =>
            (g?.indicators || []).some((ind) => Boolean(ind?.evidences?.[0]?.evidence))
        )
    );
}

/**
 * Fold an array of getIndicatorSummary() results into the metric block shared by the
 * campus-wide read and each per-working-group card.
 *
 * Evidence-quality attention metrics (pending review, unassigned, no-active-docs,
 * missing-implementation, ready-for-review) are scoped to indicators that HAVE evidence
 * for the year — an indicator with no YSE yet is "no evidence" (its own bucket /
 * `withoutEvidence`), not a quality gap. This keeps the attention counts from being
 * inflated by indicators simply not started this year.
 */
function summarize(summaries) {
    const totalIndicators = summaries.length;
    const withEvidence = summaries.filter((s) => s.hasEvidence).length;

    // Status distribution: every rung seeded to 0 so the bars render in full order even
    // when a rung is empty; the trailing NO_EVIDENCE bucket catches the rest. Always
    // totals totalIndicators.
    const counts = {};
    STATUS_LEVELS_ORDER.forEach((lvl) => { counts[lvl] = 0; });
    counts[NO_EVIDENCE] = 0;
    for (const s of summaries) {
        counts[statusBucket(s, STATUS_LEVELS_ORDER)] += 1;
    }
    const statusDistribution = [...STATUS_LEVELS_ORDER, NO_EVIDENCE].map((level) => ({
        level,
        count: counts[level],
        pct: pct(counts[level], totalIndicators),
    }));

    // Average maturity over indicators that carry a numeric status_value. Never treat a
    // missing status as 0 — that would drag the mean down with not-yet-started indicators.
    let sum = 0;
    let n = 0;
    for (const s of summaries) {
        // Guard null/undefined/'' explicitly — Number(null) and Number('') are 0 (finite),
        // which would silently count a status-less indicator as a 0 and drag the mean down.
        if (s.statusValue === null || s.statusValue === undefined || s.statusValue === '') continue;
        const v = Number(s.statusValue);
        if (Number.isFinite(v)) { sum += v; n += 1; }
    }
    const avgStatusValue = n > 0 ? sum / n : null;

    const reviewComplete = summaries.filter((s) => s.hasEvidence && s.approved).length;

    // Attention counts are derived from the SAME predicates the tables filter on, so a
    // tile reading "91" is by construction the number of rows selecting it produces.
    // These used to be inline `.filter()` calls here, duplicating the logic that the
    // filter would have needed — a tile and its own filter disagreeing is the failure
    // mode this indirection exists to prevent.
    const attention = {};
    for (const f of FILTER_LIST) {
        attention[f.metric] = summaries.filter((s) => f.match(s)).length;
    }

    return {
        totalIndicators,
        withEvidence,
        withoutEvidence: totalIndicators - withEvidence,
        coveragePct: pct(withEvidence, totalIndicators),
        statusDistribution,
        avgStatusValue,
        reviewComplete,
        ...attention,
    };
}

// Tally YoY trend buckets for a set of indicator wrappers.
function tallyTrends(wrappers, yoyTrends) {
    const trends = { improving: 0, declining: 0, static: 0, unknown: 0 };
    for (const w of wrappers) {
        const compositeKey = w?.indicator?.properties?.composite_key;
        trends[trendBucket(findTrendForIndicator(yoyTrends, compositeKey))] += 1;
    }
    return trends;
}

/**
 * Build the campus-wide + per-working-group metrics object the overview renders.
 *
 * @param {object} data DataContext data ({ web, procurement, instructionalMaterials, yoyTrends })
 * @param {string} [year] selected academic year — year-gated groups (com/gov,
 *   activeFromYear on their WG_DEFS entry) are excluded when viewing earlier
 *   years. Omitted year = all groups (back-compat).
 * @returns {{ campus: object, byWorkingGroup: object[] }}
 */
export function computeReportMetrics(data, year) {
    const yoyTrends = data?.yoyTrends;
    const defs = WG_DEFS.filter((def) => !def.activeFromYear || !year || def.activeFromYear <= year);

    const byWorkingGroup = defs.map((def) => {
        const wrappers = indicatorsOf(data?.[def.key]);
        const summaries = wrappers.map(getIndicatorSummary);
        return {
            key: def.key,
            name: def.name,
            accent: def.accent,
            ...summarize(summaries),
            trends: tallyTrends(wrappers, yoyTrends),
        };
    });

    const allWrappers = defs.flatMap((def) => indicatorsOf(data?.[def.key]));
    const campus = summarize(allWrappers.map(getIndicatorSummary));

    return { campus, byWorkingGroup };
}

export default computeReportMetrics;
