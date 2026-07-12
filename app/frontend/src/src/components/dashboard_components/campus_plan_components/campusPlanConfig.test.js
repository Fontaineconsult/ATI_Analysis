/**
 * Pure-function unit tests for the campus-plan domain config. No React, no
 * mocking — just the diagnostic/vocabulary helpers that drive the stat strip,
 * the working-group card order, and the per-row age/trajectory cells.
 */
import {
    STALE_DAYS,
    WG_ACCENT,
    latestTrajectory,
    updateAgeDays,
    isStale,
    isAtRisk,
    summarizeCampusPlan,
    orderWorkingGroupPlans,
    getWgAccent,
    getTrajectoryLabel,
    getTrajectoryColorScheme,
} from './campusPlanConfig';

// A prioritized-indicator shape with the given newest-first progress updates.
const si = (updates, extra = {}) => ({ progress: { updates }, ...extra });
// ISO string for a date `n` whole days before *now* — used for the isStale
// boundary, which reads the real clock (not injectable).
const daysAgoISO = (n) => new Date(Date.now() - n * 86400000).toISOString();

describe('latestTrajectory', () => {
    it('returns the newest (index-0) update trajectory', () => {
        expect(latestTrajectory(si([{ trajectory: 'improving' }, { trajectory: 'stagnant' }]))).toBe('improving');
    });
    it('is null when there are no updates', () => {
        expect(latestTrajectory(si([]))).toBeNull();
    });
    it('is null when progress is absent', () => {
        expect(latestTrajectory({})).toBeNull();
        expect(latestTrajectory(undefined)).toBeNull();
    });
});

describe('updateAgeDays', () => {
    const now = new Date('2026-07-11T12:00:00Z');

    it('floors whole days since the most recent update', () => {
        expect(updateAgeDays(si([{ update_date: '2026-07-01' }]), now)).toBe(10);
    });
    it('clamps future-dated updates to 0', () => {
        expect(updateAgeDays(si([{ update_date: '2026-08-01' }]), now)).toBe(0);
    });
    it('is null when never updated', () => {
        expect(updateAgeDays(si([]), now)).toBeNull();
    });
    it('is null when the newest update has no date', () => {
        expect(updateAgeDays(si([{ trajectory: 'improving' }]), now)).toBeNull();
    });
    it('is null when the date is unparseable', () => {
        expect(updateAgeDays(si([{ update_date: 'not-a-date' }]), now)).toBeNull();
    });
    it('is null when progress is absent', () => {
        expect(updateAgeDays({}, now)).toBeNull();
    });
    it('reads the boundary exactly', () => {
        // 30 whole days → not yet past the STALE_DAYS threshold; 31 → past it.
        expect(updateAgeDays(si([{ update_date: '2026-06-11' }]), new Date('2026-07-11T00:00:00Z'))).toBe(30);
        expect(updateAgeDays(si([{ update_date: '2026-06-10' }]), new Date('2026-07-11T00:00:00Z'))).toBe(31);
    });
});

describe('isStale', () => {
    it('flags an indicator whose last update is older than STALE_DAYS', () => {
        expect(isStale(si([{ update_date: daysAgoISO(STALE_DAYS + 1) }]))).toBe(true);
    });
    it('does not flag an indicator updated within STALE_DAYS', () => {
        expect(isStale(si([{ update_date: daysAgoISO(STALE_DAYS - 1) }]))).toBe(false);
    });
    it('treats the exact boundary as not-stale (age must exceed STALE_DAYS)', () => {
        expect(isStale(si([{ update_date: daysAgoISO(STALE_DAYS) }]))).toBe(false);
    });
    it('never flags a never-updated indicator (no created-date to judge from)', () => {
        expect(isStale(si([]))).toBe(false);
        expect(isStale({})).toBe(false);
    });
});

describe('isAtRisk', () => {
    it.each(['at_risk', 'failing'])('is true when latest trajectory is %s', (t) => {
        expect(isAtRisk(si([{ trajectory: t }]))).toBe(true);
    });
    it.each(['improving', 'on_track', 'stagnant'])('is false when latest trajectory is %s', (t) => {
        expect(isAtRisk(si([{ trajectory: t }]))).toBe(false);
    });
    it('is false when never updated', () => {
        expect(isAtRisk(si([]))).toBe(false);
    });
});

describe('summarizeCampusPlan', () => {
    // Date-bearing SIs use a very old date so `stale` is deterministic regardless
    // of when the suite runs; non-stale SIs are never-updated (age null).
    const plan = {
        working_group_plans: [
            {
                working_group: 'Web',
                prioritized_success_indicators: [
                    si([{ update_date: '2000-01-01', trajectory: 'at_risk' }]),   // stale + at-risk
                    si([{ update_date: '2000-01-01', trajectory: 'improving' }]), // stale only
                ],
                plans: [{ unique_id: 'a' }, { unique_id: 'b' }],
            },
            {
                working_group: 'Procurement',
                prioritized_success_indicators: [si([])], // never updated: neither stale nor at-risk
                plans: [],
            },
            { working_group: 'Steering', prioritized_success_indicators: [], plans: [] },
        ],
    };

    it('rolls up counts across all working-group plans', () => {
        expect(summarizeCampusPlan(plan)).toEqual({
            workingGroups: 3,
            prioritizedIndicators: 3,
            plans: 2,
            atRisk: 1,
            stale: 2,
        });
    });

    it('returns all-zero counts for a null / empty plan', () => {
        expect(summarizeCampusPlan(null)).toEqual({
            workingGroups: 0, prioritizedIndicators: 0, plans: 0, atRisk: 0, stale: 0,
        });
        expect(summarizeCampusPlan({ working_group_plans: [] })).toEqual({
            workingGroups: 0, prioritizedIndicators: 0, plans: 0, atRisk: 0, stale: 0,
        });
    });
});

describe('orderWorkingGroupPlans', () => {
    it('sorts into the canonical Steering → Web → Instructional Materials → Procurement order', () => {
        const input = [
            { working_group: 'Procurement' },
            { working_group: 'Steering' },
            { working_group: 'Web' },
            { working_group: 'Instructional Materials' },
        ];
        expect(orderWorkingGroupPlans(input).map((w) => w.working_group)).toEqual([
            'Steering', 'Web', 'Instructional Materials', 'Procurement',
        ]);
    });
    it('sorts unknown groups last, alphabetically', () => {
        const input = [
            { working_group: 'Zebra' },
            { working_group: 'Web' },
            { working_group: 'Apple' },
        ];
        expect(orderWorkingGroupPlans(input).map((w) => w.working_group)).toEqual(['Web', 'Apple', 'Zebra']);
    });
    it('does not mutate the input array', () => {
        const input = [{ working_group: 'Procurement' }, { working_group: 'Steering' }];
        const before = input.map((w) => w.working_group);
        orderWorkingGroupPlans(input);
        expect(input.map((w) => w.working_group)).toEqual(before);
    });
    it('handles null / undefined gracefully', () => {
        expect(orderWorkingGroupPlans(null)).toEqual([]);
        expect(orderWorkingGroupPlans(undefined)).toEqual([]);
    });
});

describe('getWgAccent', () => {
    it('returns the configured accent for each known group', () => {
        expect(getWgAccent('Steering')).toBe(WG_ACCENT.Steering);
        expect(getWgAccent('Web')).toBe(WG_ACCENT.Web);
        expect(getWgAccent('Instructional Materials')).toBe(WG_ACCENT['Instructional Materials']);
        expect(getWgAccent('Procurement')).toBe(WG_ACCENT.Procurement);
    });
    it('falls back to neutral gray for unknown groups', () => {
        expect(getWgAccent('Nope')).toBe('#718096');
        expect(getWgAccent(undefined)).toBe('#718096');
    });
});

describe('trajectory labels/colors', () => {
    it('maps known trajectories to friendly labels + color schemes', () => {
        expect(getTrajectoryLabel('at_risk')).toBe('At Risk');
        expect(getTrajectoryColorScheme('at_risk')).toBe('orange');
    });
    it('degrades gracefully for unknown trajectories', () => {
        expect(getTrajectoryLabel('mystery')).toBe('mystery');
        expect(getTrajectoryLabel(null)).toBeNull();
        expect(getTrajectoryColorScheme('mystery')).toBe('gray');
    });
});
