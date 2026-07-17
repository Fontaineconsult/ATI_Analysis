/**
 * PARITY test for the working-group SSOT (workingGroupIdentity.js).
 *
 * This is the guardrail for the WG-identity consolidation (P1–P6): every phase replaces a
 * hardcoded literal in some consumer with a value DERIVED from this module. These assertions
 * pin the SSOT's derived values to EXACTLY the literals those consumers use today, so a green
 * suite proves "derive-from-SSOT == old hardcoded value" — i.e. zero behavior change.
 *
 * The expected values below are copied from the current consumers (do not "simplify" them):
 *   - hex:              campus_plan_components/campusPlanConfig.js  WG_ACCENT
 *   - accent tokens:    report_components/reportMetrics.js  WG_DEFS  (== SubNavbar/GoalNavigator)
 *   - dashboard order:  SubNavbar.js allowlist / WORKING_GROUPS_ORDER
 *   - dataKeys:         context/DataContext.js  state shape + transformWorkingGroup
 *   - WG_DEFS shape:    report_components/reportMetrics.js
 *   - campus-plan order:campusPlanConfig.js  WG_ORDER (Steering-first)
 */
import {
    WORKING_GROUP_IDENTITY,
    ALL_WORKING_GROUPS,
    WORKING_GROUP_LIST,
    WORKING_GROUPS_ORDER,
    CODE_TO_SLUG,
    SLUG_TO_CODE,
    NAME_TO_CODE,
    CODE_TO_NAME,
    SLUG_TO_DATAKEY,
    DATAKEY_TO_SLUG,
    CAMPUS_PLAN_ORDER,
    WG_DEFS,
    getWorkingGroupIdentity,
    getWorkingGroupAccent,
    getWgHex,
    makeInitialWgState,
} from './workingGroupIdentity';

// The exact parity values, per group, as the current consumers hardcode them.
const PARITY = {
    web: { slug: 'web', code: 'web', dataKey: 'web', name: 'Web', accent: 'teal.500', hex: '#4966A4', trendKey: 'Web' },
    'instructional-materials': { slug: 'instructional-materials', code: 'ins', dataKey: 'instructionalMaterials', name: 'Instructional Materials', accent: 'purple.500', hex: '#635098', trendKey: 'Instructional Materials' },
    procurement: { slug: 'procurement', code: 'pro', dataKey: 'procurement', name: 'Procurement', accent: 'coral.500', hex: '#DB5850', trendKey: 'Procurement' },
    steering: { slug: 'steering', code: 'ste', dataKey: 'steering', name: 'Steering', hex: '#354A7A' },
};

describe('SSOT — per-group parity fields', () => {
    Object.entries(PARITY).forEach(([slug, want]) => {
        it(`${slug}: slug/code/dataKey/name/hex match current consumers`, () => {
            const wg = WORKING_GROUP_IDENTITY[slug];
            expect(wg).toBeDefined();
            expect(wg.slug).toBe(want.slug);
            expect(wg.code).toBe(want.code);
            expect(wg.dataKey).toBe(want.dataKey);
            expect(wg.name).toBe(want.name);
            expect(wg.hex).toBe(want.hex);
        });
    });

    it('shortLabel matches the current member-admin column headers', () => {
        expect(WORKING_GROUP_IDENTITY.web.shortLabel).toBe('Web');
        expect(WORKING_GROUP_IDENTITY['instructional-materials'].shortLabel).toBe('Ins');
        expect(WORKING_GROUP_IDENTITY.procurement.shortLabel).toBe('Pro');
    });

    it('dashboard groups carry the exact accent token + trendKey used by reportMetrics', () => {
        ['web', 'instructional-materials', 'procurement'].forEach((slug) => {
            expect(WORKING_GROUP_IDENTITY[slug].accent).toBe(PARITY[slug].accent);
            expect(WORKING_GROUP_IDENTITY[slug].trendKey).toBe(PARITY[slug].trendKey);
        });
    });

    it("Steering hex is dark brand blue (#354A7A), NOT the resolve of its orange.500 accent", () => {
        expect(WORKING_GROUP_IDENTITY.steering.hex).toBe('#354A7A');
        expect(WORKING_GROUP_IDENTITY.steering.accent).toBe('orange.500'); // dormant token, intentional mismatch
    });
});

describe('SSOT — the dashboard set is exactly the current three, in order', () => {
    it('WORKING_GROUP_LIST slugs == SubNavbar order', () => {
        expect(WORKING_GROUP_LIST.map((w) => w.slug)).toEqual([
            'web', 'instructional-materials', 'procurement',
        ]);
    });
    it('WORKING_GROUPS_ORDER mirrors it (SubNavbar path-sync allowlist)', () => {
        expect(WORKING_GROUPS_ORDER).toEqual(['web', 'instructional-materials', 'procurement']);
    });
    it('only the three are dashboard:true; com/gov/steering are not', () => {
        const dash = ALL_WORKING_GROUPS.filter((w) => w.dashboard).map((w) => w.slug);
        expect(dash).toEqual(['web', 'instructional-materials', 'procurement']);
    });
});

describe('SSOT — derived lookup maps', () => {
    it('CODE_TO_SLUG / SLUG_TO_CODE round-trip for the dashboard trio', () => {
        expect(CODE_TO_SLUG).toMatchObject({ web: 'web', ins: 'instructional-materials', pro: 'procurement' });
        expect(SLUG_TO_CODE).toMatchObject({ web: 'web', 'instructional-materials': 'ins', procurement: 'pro' });
    });
    it('SLUG_TO_DATAKEY == DataContext.transformWorkingGroup mapping', () => {
        expect(SLUG_TO_DATAKEY['web']).toBe('web');
        expect(SLUG_TO_DATAKEY['instructional-materials']).toBe('instructionalMaterials');
        expect(SLUG_TO_DATAKEY['procurement']).toBe('procurement');
    });
    it('DATAKEY_TO_SLUG is the inverse', () => {
        expect(DATAKEY_TO_SLUG['instructionalMaterials']).toBe('instructional-materials');
    });
    it('NAME_TO_CODE / CODE_TO_NAME resolve display names', () => {
        expect(NAME_TO_CODE['Instructional Materials']).toBe('ins');
        expect(CODE_TO_NAME['ins']).toBe('Instructional Materials');
    });
});

describe('SSOT — campus-plan order is Steering-first (== campusPlanConfig.WG_ORDER)', () => {
    it('CAMPUS_PLAN_ORDER names match WG_ORDER exactly', () => {
        expect(CAMPUS_PLAN_ORDER.map((w) => w.name)).toEqual([
            'Steering', 'Web', 'Instructional Materials', 'Procurement',
        ]);
    });
    it('com/gov are excluded (no campusPlanOrder — not on campus plans)', () => {
        expect(CAMPUS_PLAN_ORDER.map((w) => w.slug)).not.toContain('communication-training');
        expect(CAMPUS_PLAN_ORDER.map((w) => w.slug)).not.toContain('governance');
    });
    it('each campus-plan group exposes its hex (WG_ACCENT parity)', () => {
        const hexByName = Object.fromEntries(CAMPUS_PLAN_ORDER.map((w) => [w.name, w.hex]));
        expect(hexByName).toEqual({
            Steering: '#354A7A',
            Web: '#4966A4',
            'Instructional Materials': '#635098',
            Procurement: '#DB5850',
        });
    });
});

describe('SSOT — WG_DEFS matches reportMetrics parity exactly', () => {
    it('shape + values == the old reportMetrics.WG_DEFS literal', () => {
        expect(WG_DEFS).toEqual([
            { key: 'web', name: 'Web', trendKey: 'Web', accent: 'teal.500' },
            { key: 'instructionalMaterials', name: 'Instructional Materials', trendKey: 'Instructional Materials', accent: 'purple.500' },
            { key: 'procurement', name: 'Procurement', trendKey: 'Procurement', accent: 'coral.500' },
        ]);
    });
});

describe('SSOT — helper functions', () => {
    it('makeInitialWgState == DataContext initial WG slice', () => {
        expect(makeInitialWgState()).toEqual({ web: null, instructionalMaterials: null, procurement: null });
    });
    it('getWgHex resolves by slug and by display name', () => {
        expect(getWgHex('web')).toBe('#4966A4');
        expect(getWgHex('Instructional Materials')).toBe('#635098');
        expect(getWgHex('steering')).toBe('#354A7A');
    });
    it('getWgHex falls back to neutral gray for unknown keys (never undefined)', () => {
        expect(getWgHex('nope')).toBe('#718096');
        expect(getWgHex(undefined)).toBe('#718096');
    });
    it('getWorkingGroupAccent resolves the token', () => {
        expect(getWorkingGroupAccent('procurement')).toBe('coral.500');
    });
    it('getWorkingGroupIdentity resolves by slug OR display name to the same entry', () => {
        expect(getWorkingGroupIdentity('procurement')).toBe(getWorkingGroupIdentity('Procurement'));
    });
});
