/**
 * Campus Plan domain config (design-sense §1.4 — config-driven labels & colors).
 *
 * Single source of truth for the campus-plan area's vocabularies and the
 * diagnostic summary. Plan-status colors are NOT duplicated here — they live in
 * styles/planStatusColors.js (getPlanStatusColorScheme); this file only owns the
 * trajectory vocabulary and the plan-status *ordering* used by the badge rows.
 */

// Indicator trajectory vocabulary. Keys mirror data_config.trajectory_choices.
// Trajectory is a semantic (status-like) signal, so saturated colors are
// sanctioned here (design-sense §2 — saturated color carries meaning).
export const TRAJECTORY_CONFIG = {
    improving: { label: 'Improving', colorScheme: 'green' },
    on_track:  { label: 'On Track',  colorScheme: 'blue' },
    stagnant:  { label: 'Stagnant',  colorScheme: 'yellow' },
    at_risk:   { label: 'At Risk',   colorScheme: 'orange' },
    failing:   { label: 'Failing',   colorScheme: 'red' },
};

export function getTrajectoryLabel(trajectory) {
    return TRAJECTORY_CONFIG[trajectory]?.label || trajectory || null;
}

export function getTrajectoryColorScheme(trajectory) {
    return TRAJECTORY_CONFIG[trajectory]?.colorScheme || 'gray';
}

// Trajectories that mean an indicator needs attention — drives the stat strip's
// "⚠ At-Risk" diagnostic count.
export const AT_RISK_TRAJECTORIES = new Set(['at_risk', 'failing']);

// Display order for the per-working-group plan-status badge row. The *colors*
// for each status come from getPlanStatusColorScheme — never re-derived here.
export const PLAN_STATUS_ORDER = ['In Progress', 'Not Started', 'On Hold', 'Completed', 'Abandoned'];

// Days without a progress update before a prioritized indicator is flagged
// "stale" in the stat strip / row age cell (design handoff v2 §2).
export const STALE_DAYS = 30;

// Working-group card order + identity accent colors (design handoff v2 §5).
// Keyed by ATIWorkingGroup.name. Steering leads as the oversight body; it is a
// real 4th working group present in the graph (see the campus-plan payload's
// working_group_plans). Keep these in sync with the SubNavbar dots / GoalNavigator.
export const WG_ORDER = ['Steering', 'Web', 'Instructional Materials', 'Procurement'];

export const WG_ACCENT = {
    Steering: '#354A7A',
    Web: '#4966A4',
    'Instructional Materials': '#635098',
    Procurement: '#DB5850',
};

export function getWgAccent(workingGroupName) {
    return WG_ACCENT[workingGroupName] || '#718096'; // neutral gray fallback
}

/**
 * Sort a campus plan's working_group_plans into the canonical card order
 * (Steering, Web, Instructional Materials, Procurement). Unknown groups sort
 * last, alphabetically. Non-mutating.
 */
export function orderWorkingGroupPlans(wgps) {
    const rank = (name) => {
        const i = WG_ORDER.indexOf(name);
        return i === -1 ? WG_ORDER.length : i;
    };
    return [...(wgps || [])].sort((a, b) => {
        const r = rank(a?.working_group) - rank(b?.working_group);
        return r !== 0 ? r : String(a?.working_group).localeCompare(String(b?.working_group));
    });
}

/**
 * Latest trajectory for a prioritized success indicator, or null. The progress
 * updates array is newest-first (mirrors WorkingGroupPlan's read of updates[0]).
 */
export function latestTrajectory(si) {
    const updates = si?.progress?.updates || [];
    return updates.length > 0 ? updates[0].trajectory : null;
}

/**
 * Whole days since a success indicator's most recent progress update, or null
 * when it has never been updated. Updates are newest-first. Future-dated updates
 * clamp to 0. `now` is injectable for tests.
 */
export function updateAgeDays(si, now = new Date()) {
    const updates = si?.progress?.updates || [];
    if (updates.length === 0) return null;
    const raw = updates[0].update_date;
    if (!raw) return null;
    const then = new Date(raw);
    if (Number.isNaN(then.getTime())) return null;
    const ms = now.getTime() - then.getTime();
    return ms < 0 ? 0 : Math.floor(ms / 86400000);
}

/**
 * An indicator is "stale" when its last update is older than STALE_DAYS. A
 * never-updated indicator is NOT counted stale — with no created-date we can't
 * tell "added yesterday" from "cold for a year", so we keep the metric to
 * indicators that had activity and went quiet (age cell shows "—" for those).
 */
export function isStale(si) {
    const age = updateAgeDays(si);
    return age !== null && age > STALE_DAYS;
}

/** True when the indicator's latest trajectory is at-risk or failing. */
export function isAtRisk(si) {
    return AT_RISK_TRAJECTORIES.has(latestTrajectory(si));
}

/**
 * Diagnostic roll-up for the campus-plan stat strip. Computed from the loaded
 * plan so the strip itself stays presentational (design-sense §3.2).
 *
 *   workingGroups        — number of working-group plans on this campus plan.
 *   prioritizedIndicators— total prioritized indicators across all groups.
 *   plans                — total campus-plan-flagged Plans across all groups.
 *   atRisk               — prioritized indicators whose latest trajectory is
 *                          at_risk/failing (the attention metric).
 *   stale                — prioritized indicators with no update in > STALE_DAYS.
 */
export function summarizeCampusPlan(plan) {
    const wgps = Array.isArray(plan?.working_group_plans) ? plan.working_group_plans : [];
    let prioritizedIndicators = 0;
    let plans = 0;
    let atRisk = 0;
    let stale = 0;
    for (const wgp of wgps) {
        const sis = wgp.prioritized_success_indicators || [];
        prioritizedIndicators += sis.length;
        plans += (wgp.plans || []).length;
        for (const si of sis) {
            if (isAtRisk(si)) atRisk += 1;
            if (isStale(si)) stale += 1;
        }
    }
    return { workingGroups: wgps.length, prioritizedIndicators, plans, atRisk, stale };
}
