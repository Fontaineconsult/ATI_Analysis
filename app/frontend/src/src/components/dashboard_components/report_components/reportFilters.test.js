/**
 * Attention filters.
 *
 * The load-bearing test here is the LAST describe block: a stat tile's count and the
 * number of rows selecting that tile produces must be the same number. They are
 * computed by different code paths (summarize folds the predicates; the tables filter
 * a tree with them) and the whole point of the shared registry is that those two can
 * never disagree. Everything else is scaffolding around that.
 */
import { computeReportMetrics } from './reportMetrics';
import {
    FILTER_LIST,
    FILTER_ORDER,
    INDICATOR_FILTERS,
    countFiltered,
    filterReportData,
    matchesFilters,
    parseFilterParam,
    serializeFilterParam,
} from './reportFilters';
import { getIndicatorSummary } from '../../graph_components/indicators/indicatorHelpers';

const YEAR = '2025-2026';

// Same wrapper shape reportMetrics.test.js builds — the compound-query shape
// getIndicatorSummary reads.
const ind = (composite_key, opts = {}) => {
    const {
        status = null, value = null, persons = 1, approved = false,
        ready = false, override = false, evidence = true, docs = ['false'], webs = null,
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
        evidenceTypes: (docs === null && webs === null) ? [] : [{
            type: 'Process',
            docs: (docs || []).map((dep) => ({ document: { properties: { depreciated: dep === true } } })),
            webs: (webs || []).map((props) => ({ webpage: { properties: props } })),
        }],
        has_notes: [], has_messages: [], has_metrics: [], plans: [],
    }];
    return wrapper;
};

const tree = (indicators) => ({
    workingGroup: 'Web',
    goals: [{ goal: { properties: { goal_number: 1, name: 'G1' } }, indicators }],
});

const WG_KEYS = ['web', 'procurement', 'instructionalMaterials'];
const summarize = getIndicatorSummary;

describe('URL round-trip', () => {
    it('parses a comma list into canonical order', () => {
        expect(parseFilterParam('ready-for-review,unassigned'))
            .toEqual(['unassigned', 'ready-for-review']);
    });

    it('drops unknown tokens rather than failing, so a stale link still works', () => {
        expect(parseFilterParam('unassigned,not-a-filter,')).toEqual(['unassigned']);
    });

    it('dedupes', () => {
        expect(parseFilterParam('unassigned,unassigned')).toEqual(['unassigned']);
    });

    it.each([null, undefined, ''])('treats %p as no filters', (raw) => {
        expect(parseFilterParam(raw)).toEqual([]);
    });

    it('serialises in a fixed order so the same set always yields the same URL', () => {
        expect(serializeFilterParam(['ready-for-review', 'unassigned']))
            .toBe(serializeFilterParam(['unassigned', 'ready-for-review']));
        expect(serializeFilterParam(['ready-for-review', 'unassigned']))
            .toBe('unassigned,ready-for-review');
    });

    it('round-trips every single filter', () => {
        for (const key of FILTER_ORDER) {
            expect(parseFilterParam(serializeFilterParam([key]))).toEqual([key]);
        }
    });

    it('serialises an empty selection to an empty string, so the param is dropped', () => {
        expect(serializeFilterParam([])).toBe('');
        expect(serializeFilterParam(['bogus'])).toBe('');
    });
});

describe('matchesFilters', () => {
    it('matches everything when nothing is active', () => {
        expect(matchesFilters(summarize(ind('1.1-web')), [])).toBe(true);
    });

    it('ANDs: an indicator must satisfy every active filter', () => {
        const readyOnly = summarize(ind('1.1-web', { ready: true }));
        expect(matchesFilters(readyOnly, ['ready-for-review'])).toBe(true);
        expect(matchesFilters(readyOnly, ['ready-for-review', 'unassigned'])).toBe(false);

        const readyAndUnassigned = summarize(ind('1.2-web', { ready: true, persons: 0 }));
        expect(matchesFilters(readyAndUnassigned, ['ready-for-review', 'unassigned'])).toBe(true);
    });

    it('never matches an indicator with no evidence — that is "not started", not a gap', () => {
        const none = summarize(ind('1.3-web', { evidence: false }));
        for (const f of FILTER_LIST) {
            expect(f.match(none)).toBe(false);
        }
    });

    it('exempts override_implementation_requirement indicators from Unassigned', () => {
        expect(INDICATOR_FILTERS.unassigned.match(summarize(ind('1.4-web', { persons: 0 })))).toBe(true);
        expect(INDICATOR_FILTERS.unassigned.match(
            summarize(ind('1.5-web', { persons: 0, override: true })))).toBe(false);
    });

    it('treats an approved indicator as neither pending nor ready', () => {
        const approved = summarize(ind('1.6-web', { approved: true, ready: true }));
        expect(INDICATOR_FILTERS['pending-review'].match(approved)).toBe(false);
        expect(INDICATOR_FILTERS['ready-for-review'].match(approved)).toBe(false);
    });
});

describe('filterReportData', () => {
    const data = {
        web: tree([
            ind('1.1-web', { ready: true }),
            ind('1.2-web'),
            ind('1.3-web', { persons: 0 }),
        ]),
        yoyTrends: { Web: [] },
    };

    it('returns the identical object when nothing is active, so memos stay stable', () => {
        expect(filterReportData(data, [], WG_KEYS, summarize)).toBe(data);
    });

    it('keeps only matching indicators', () => {
        const out = filterReportData(data, ['ready-for-review'], WG_KEYS, summarize);
        expect(out.web.goals[0].indicators.map((i) => i.indicator.properties.composite_key))
            .toEqual(['1.1-web']);
    });

    it('drops goals left with no indicators, and groups left with no goals', () => {
        const out = filterReportData(data, ['missing-implementation'], WG_KEYS, summarize);
        expect(out.web).toBeUndefined();
    });

    it('does not mutate the source tree', () => {
        const before = data.web.goals[0].indicators.length;
        filterReportData(data, ['ready-for-review'], WG_KEYS, summarize);
        expect(data.web.goals[0].indicators).toHaveLength(before);
    });

    it('preserves non-working-group keys like yoyTrends', () => {
        const out = filterReportData(data, ['ready-for-review'], WG_KEYS, summarize);
        expect(out.yoyTrends).toBe(data.yoyTrends);
    });
});

describe('countFiltered', () => {
    const data = { web: tree([ind('1.1-web', { ready: true }), ind('1.2-web'), ind('1.3-web')]) };

    it('reports shown vs total', () => {
        expect(countFiltered(data, ['ready-for-review'], WG_KEYS, summarize)).toEqual({ shown: 1, total: 3 });
    });

    it('counts everything when unfiltered', () => {
        expect(countFiltered(data, [], WG_KEYS, summarize)).toEqual({ shown: 3, total: 3 });
    });
});

// The invariant the shared registry exists to guarantee.
describe('a tile count equals the rows its filter produces', () => {
    // One indicator per diagnostic, plus decoys that trip none of them.
    const data = {
        web: tree([
            ind('1.1-web', { ready: true }),                       // ready + pending
            ind('1.2-web', { persons: 0 }),                        // unassigned + pending
            ind('1.3-web', { docs: [true] }),                      // docs deprecated + pending
            ind('1.4-web', { docs: [], webs: [] }),                // undocumented impl + pending
            ind('1.5-web', { docs: null, webs: null }),            // missing implementation + pending
            ind('1.6-web', { approved: true }),                    // clean, approved
            ind('1.7-web', { evidence: false }),                   // not started
        ]),
    };

    const metrics = computeReportMetrics(data);

    it.each(FILTER_LIST.map((f) => [f.key, f]))('%s', (_key, f) => {
        const tile = metrics.campus[f.metric];
        const { shown } = countFiltered(data, [f.key], WG_KEYS, summarize);
        expect(shown).toBe(tile);
    });

    it('every tile metric is actually published by computeReportMetrics', () => {
        for (const f of FILTER_LIST) {
            expect(metrics.campus[f.metric]).toEqual(expect.any(Number));
        }
    });
});
