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

// The trailing status-distribution bucket: indicators with no evidence for the year (or,
// rarely, evidence with no status assigned) — i.e. "not yet on the maturity ladder".
export const NO_EVIDENCE = 'No evidence';

// Working groups in render order, with the DataContext key, the yoyTrends key (keyed by
// human name), and the SFBRN identity accent (Web=brand blue, IM=purple, Pro=coral).
export const WG_DEFS = [
    { key: 'web', name: 'Web', trendKey: 'Web', accent: 'teal.500' },
    { key: 'instructionalMaterials', name: 'Instructional Materials', trendKey: 'Instructional Materials', accent: 'purple.500' },
    { key: 'procurement', name: 'Procurement', trendKey: 'Procurement', accent: 'coral.500' },
];

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
        const onLadder = s.hasEvidence && s.statusLevel && STATUS_LEVELS_ORDER.includes(s.statusLevel);
        counts[onLadder ? s.statusLevel : NO_EVIDENCE] += 1;
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

    return {
        totalIndicators,
        withEvidence,
        withoutEvidence: totalIndicators - withEvidence,
        coveragePct: pct(withEvidence, totalIndicators),
        statusDistribution,
        avgStatusValue,
        reviewComplete,
        reviewPending: withEvidence - reviewComplete,
        readyForReviewCount: summaries.filter((s) => s.hasEvidence && s.readyForReview && !s.approved).length,
        unassignedCount: summaries.filter((s) => s.hasEvidence && s.personCount === 0 && !s.overrideImplementationRequirement).length,
        noActiveDocsCount: summaries.filter((s) => s.hasEvidence && s.noActiveDocs).length,
        missingImplCount: summaries.filter((s) => s.hasEvidence && s.flagMissingImplementation).length,
    };
}

// Tally YoY trend buckets for a set of indicator wrappers.
function tallyTrends(wrappers, yoyTrends) {
    const trends = { improving: 0, declining: 0, static: 0, unknown: 0 };
    for (const w of wrappers) {
        const compositeKey = w?.indicator?.properties?.composite_key;
        const row = findTrendForIndicator(yoyTrends, compositeKey);
        const t = row?.trend;
        if (t === 'improving' || t === 'declining' || t === 'static') trends[t] += 1;
        else trends.unknown += 1;
    }
    return trends;
}

/**
 * Build the campus-wide + per-working-group metrics object the overview renders.
 *
 * @param {object} data DataContext data ({ web, procurement, instructionalMaterials, yoyTrends })
 * @returns {{ campus: object, byWorkingGroup: object[] }}
 */
export function computeReportMetrics(data) {
    const yoyTrends = data?.yoyTrends;

    const byWorkingGroup = WG_DEFS.map((def) => {
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

    const allWrappers = WG_DEFS.flatMap((def) => indicatorsOf(data?.[def.key]));
    const campus = summarize(allWrappers.map(getIndicatorSummary));

    return { campus, byWorkingGroup };
}

export default computeReportMetrics;
