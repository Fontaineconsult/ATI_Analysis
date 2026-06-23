import {
    computeReportMetrics,
    findTrendForIndicator,
    selectionHasYse,
    WG_DEFS,
    NO_EVIDENCE,
} from './reportMetrics';
import { STATUS_LEVELS_ORDER } from '../../../services/utils/statusColors';

const YEAR = '2025-2026';

// Build an indicator wrapper in the compound-query shape getIndicatorSummary reads.
const ind = (composite_key, opts = {}) => {
    const {
        status = null, value = null, persons = 0, approved = false,
        ready = false, override = false, evidence = true, docs = null,
    } = opts;
    const wrapper = {
        indicator: {
            id: composite_key,
            properties: {
                composite_key,
                success_indicator: `SI ${composite_key}`,
                override_implementation_requirement: override,
            },
        },
    };
    if (!evidence) {
        wrapper.evidences = [];
        return wrapper;
    }
    wrapper.evidences = [{
        evidence: {
            properties: {
                year_identifier: `${YEAR}-${composite_key}`,
                administrative_review_complete: approved,
                ready_for_admin_review: ready,
            },
        },
        statusLevel: status ? { properties: { status_level: status, status_value: value } } : null,
        persons: Array.from({ length: persons }, () => ({ properties: {} })),
        adminReviewers: [],
        // docs === null → no implementations (implCount 0). docs is an array of
        // depreciated-flags → one implementation carrying those documents.
        evidenceTypes: docs === null ? [] : [{
            type: 'Process',
            docs: docs.map((dep) => ({ document: { properties: { depreciated: dep } } })),
        }],
        has_notes: [], has_messages: [], has_metrics: [], plans: [],
    }];
    return wrapper;
};

const wgTree = (indicators) => ({
    workingGroup: 'Web',
    goals: [{ goal: { properties: { goal_number: 1 } }, indicators }],
});

describe('computeReportMetrics', () => {
    test('null / empty data yields zeroed campus + three working groups', () => {
        for (const input of [null, undefined, {}]) {
            const m = computeReportMetrics(input);
            expect(m.campus.totalIndicators).toBe(0);
            expect(m.campus.withEvidence).toBe(0);
            expect(m.campus.avgStatusValue).toBeNull();
            // six maturity rungs + the trailing "No evidence" bucket
            expect(m.campus.statusDistribution).toHaveLength(STATUS_LEVELS_ORDER.length + 1);
            expect(m.campus.statusDistribution.every((d) => d.count === 0 && d.pct === 0)).toBe(true);
            expect(m.byWorkingGroup).toHaveLength(3);
            expect(m.byWorkingGroup.map((w) => w.key)).toEqual(WG_DEFS.map((d) => d.key));
        }
    });

    describe('a mixed Web working group', () => {
        const data = {
            web: wgTree([
                ind('1.1-web', { status: 'Established', value: 3, persons: 1, approved: true, docs: [false] }),
                ind('1.2-web', { status: 'Initiated', value: 1, persons: 0, ready: true, docs: [true] }),
                ind('1.5-web', { evidence: false }),
                ind('1.3-web', { status: 'Defined', value: 2, persons: 1, docs: null }),
                ind('1.4-web', { status: 'Managed', value: 4, persons: 0, override: true, docs: null }),
            ]),
            procurement: null,
            instructionalMaterials: { goals: [] },
            // Real trend rows are keyed by composite_key; their year_identifier carries a
            // campus suffix (the bug the fix addresses), so matching must use composite_key.
            yoyTrends: {
                Web: [
                    { composite_key: '1.1-web', evidence_year_identifier: `${YEAR}-1.1-web-sfsu`, trend: 'improving' },
                    { composite_key: '1.2-web', evidence_year_identifier: `${YEAR}-1.2-web-sfsu`, trend: 'declining' },
                ],
                summary: { total_indicators: 2 },
            },
        };
        const m = computeReportMetrics(data);
        const c = m.campus;

        test('counts evidence coverage', () => {
            expect(c.totalIndicators).toBe(5);
            expect(c.withEvidence).toBe(4);
            expect(c.withoutEvidence).toBe(1);
        });

        test('status distribution buckets each indicator once and totals to all', () => {
            const by = Object.fromEntries(c.statusDistribution.map((d) => [d.level, d.count]));
            expect(by.Established).toBe(1);
            expect(by.Initiated).toBe(1);
            expect(by.Defined).toBe(1);
            expect(by.Managed).toBe(1);
            expect(by[NO_EVIDENCE]).toBe(1);
            expect(by['Not Started']).toBe(0);
            const sum = c.statusDistribution.reduce((acc, d) => acc + d.count, 0);
            expect(sum).toBe(c.totalIndicators);
        });

        test('average maturity ignores indicators with no status (never counts them as 0)', () => {
            // (3 + 1 + 2 + 4) / 4 = 2.5 — the no-evidence indicator is excluded, not 0.
            expect(c.avgStatusValue).toBeCloseTo(2.5, 5);
        });

        test('review counts use evidence as the denominator', () => {
            expect(c.reviewComplete).toBe(1);
            expect(c.reviewPending).toBe(3);
            expect(c.readyForReviewCount).toBe(1); // 1.2-web: ready and not yet approved
        });

        test('attention metrics are scoped to indicators that have evidence', () => {
            expect(c.unassignedCount).toBe(1);   // 1.2-web (no person); 1.4-web excluded (override)
            expect(c.noActiveDocsCount).toBe(1); // 1.2-web (its only doc is depreciated)
            expect(c.missingImplCount).toBe(1);  // 1.3-web (no impl); 1.4-web excluded (override); 1.5-web has no evidence
        });

        test('per-working-group breakdown mirrors campus for the single populated group', () => {
            const web = m.byWorkingGroup.find((w) => w.key === 'web');
            expect(web.totalIndicators).toBe(5);
            expect(web.coveragePct).toBe(80);
            expect(web.trends).toEqual({ improving: 1, declining: 1, static: 0, unknown: 3 });
            // empty groups stay at zero and never throw on a null tree
            expect(m.byWorkingGroup.find((w) => w.key === 'procurement').totalIndicators).toBe(0);
            expect(m.byWorkingGroup.find((w) => w.key === 'instructionalMaterials').totalIndicators).toBe(0);
        });
    });
});

describe('selectionHasYse', () => {
    test('false for null / empty / no-evidence data', () => {
        expect(selectionHasYse(null)).toBe(false);
        expect(selectionHasYse({})).toBe(false);
        expect(selectionHasYse({ web: wgTree([ind('1.1-web', { evidence: false })]) })).toBe(false);
    });

    test('true as soon as any indicator in any working group has evidence', () => {
        expect(selectionHasYse({ web: wgTree([ind('1.1-web', { status: 'Defined', value: 2 })]) })).toBe(true);
        // evidence only in procurement, web/IM empty
        expect(selectionHasYse({
            web: wgTree([ind('1.1-web', { evidence: false })]),
            procurement: wgTree([ind('1.1-pro', { status: 'Initiated', value: 1 })]),
        })).toBe(true);
    });
});

describe('findTrendForIndicator', () => {
    const yoyTrends = {
        Web: [{ composite_key: '2.1-web', evidence_year_identifier: `${YEAR}-2.1-web-sfsu`, trend: 'improving' }],
        summary: { total_indicators: 1 },
    };

    test('matches on composite_key', () => {
        expect(findTrendForIndicator(yoyTrends, '2.1-web')?.trend).toBe('improving');
    });

    test('does not match the campus-suffixed year identifier', () => {
        // Guards the original bug: matching must not key off evidence_year_identifier.
        expect(findTrendForIndicator(yoyTrends, '2.1-web-sfsu')).toBeNull();
    });

    test('returns null when absent or given no input', () => {
        expect(findTrendForIndicator(yoyTrends, '9.9-web')).toBeNull();
        expect(findTrendForIndicator(null, '2.1-web')).toBeNull();
        expect(findTrendForIndicator(yoyTrends, null)).toBeNull();
    });
});
