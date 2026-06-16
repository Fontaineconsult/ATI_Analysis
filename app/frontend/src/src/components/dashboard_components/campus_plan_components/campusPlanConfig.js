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

/**
 * Latest trajectory for a prioritized success indicator, or null. The progress
 * updates array is newest-first (mirrors WorkingGroupPlan's read of updates[0]).
 */
export function latestTrajectory(si) {
    const updates = si?.progress?.updates || [];
    return updates.length > 0 ? updates[0].trajectory : null;
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
 */
export function summarizeCampusPlan(plan) {
    const wgps = Array.isArray(plan?.working_group_plans) ? plan.working_group_plans : [];
    let prioritizedIndicators = 0;
    let plans = 0;
    let atRisk = 0;
    for (const wgp of wgps) {
        const sis = wgp.prioritized_success_indicators || [];
        prioritizedIndicators += sis.length;
        plans += (wgp.plans || []).length;
        for (const si of sis) {
            if (AT_RISK_TRAJECTORIES.has(latestTrajectory(si))) atRisk += 1;
        }
    }
    return { workingGroups: wgps.length, prioritizedIndicators, plans, atRisk };
}
