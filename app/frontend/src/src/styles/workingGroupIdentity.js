/**
 * Working-group identity — THE single source of truth for the ATI working-group set and
 * every per-group identity value (design-sense §2 & §8.4). All FE consumers derive from
 * this module; no other file should hardcode the group set, names, codes, dataKeys,
 * colors, or ordering.
 *
 * Six groups: Web (teal.500 / #4966A4) · Instructional Materials (purple.500 / #635098) ·
 * Procurement (coral.500 / #DB5850) · Communication & Training (blue.500) · Governance
 * (green.500) — the last two are 2026-2027 evidence groups, dashboard:false until they
 * activate — plus Steering (oversight; campus-plan only, hex #354A7A). Rendered as a small
 * dot + an accent underline/border wherever a working group is named.
 *
 * Per-group fields: slug, code, name, dataKey, dashboard, accent/accentDark/accentTint
 * (Chakra tokens), hex (raw — for inline SVG/print/email; authored, NOT derived from the
 * token — see Steering), colorScheme, trendKey (reportMetrics), campusPlanOrder (present
 * only for groups that get a WorkingGroupPlan; Steering=0/first).
 *
 * This consolidates the map that previously lived (duplicated) in
 * SubNavbar.js and GoalNavigator.js's WORKING_GROUPS. Resolve by URL slug
 * (`web`), display name (`Web`), or working_group field — campus-plan keys its
 * working_group_plans by display name, the dashboard routes key by slug.
 *
 * Accents are Chakra color tokens (theme.js), not hex — keep them as tokens so
 * `colorScheme`/`bg`/`color` props and the maturity ramp stay disjoint.
 */

// Chrome tokens (accent marks IDENTITY only — dot, rail, border — never a
// button; per GoalNavigator/SubNavbar action buttons stay brand teal):
//   accent      — bright .500, the identity color (dots, left rail).
//   accentDark  — .700, for a solid header band with white text (passes
//                 contrast where the bright .500 would not, e.g. coral/purple).
//   accentTint  — .50, for subtle tinted backgrounds.
//   colorScheme — matching Chakra colorScheme name (Badge, etc.).
// Each entry carries every identifier the app needs for a working group:
//   slug      — URL/route segment + /evidence/<slug> path (the primary FE key)
//   code      — 3-letter composite-key/identifier suffix (matches backend data_config)
//   name      — display name + ATIWorkingGroup.name
//   dataKey   — the camelCase key under which DataContext stores this group's data
//   dashboard — true for the ATI measurement areas (goal tabs, evidence, reports). A
//               meta/oversight group like Steering is `false`: it lives ONLY in the
//               (data-driven) Campus Plan, not on the dashboard.
// THIS IS THE SINGLE SOURCE OF TRUTH for the working-group set in the frontend —
// add a new group here (and to backend data_config.WORKING_GROUP_DEFS); every map
// and list below is derived, so no other file should hardcode the group set.
export const WORKING_GROUP_IDENTITY = {
    web: {
        slug: 'web',
        code: 'web',
        name: 'Web',
        shortLabel: 'Web',     // compact label for dense tables (member-admin columns)
        dataKey: 'web',
        dashboard: true,
        accent: 'teal.500',     // brand blue
        accentDark: 'teal.700',
        accentTint: 'teal.50',
        hex: '#4966A4',         // raw hex (= resolved teal.500) for inline SVG/print/email consumers
        colorScheme: 'teal',
        trendKey: 'Web',        // key year-over-year trends are read by (reportMetrics)
        campusPlanOrder: 1,     // Steering-first card order on the campus plan (Steering=0)
    },
    'instructional-materials': {
        slug: 'instructional-materials',
        code: 'ins',
        name: 'Instructional Materials',
        shortLabel: 'Ins',
        dataKey: 'instructionalMaterials',
        dashboard: true,
        accent: 'purple.500',
        accentDark: 'purple.700',
        accentTint: 'purple.50',
        hex: '#635098',         // = resolved purple.500
        colorScheme: 'purple',
        trendKey: 'Instructional Materials',
        campusPlanOrder: 2,
    },
    procurement: {
        slug: 'procurement',
        code: 'pro',
        name: 'Procurement',
        shortLabel: 'Pro',
        dataKey: 'procurement',
        dashboard: true,
        accent: 'coral.500',
        accentDark: 'coral.700',
        accentTint: 'coral.50',
        hex: '#DB5850',         // = resolved coral.500
        colorScheme: 'coral',
        trendKey: 'Procurement',
        campusPlanOrder: 3,
    },
    'communication-training': {
        slug: 'communication-training',
        code: 'com',
        name: 'Communication & Training',
        shortLabel: 'Comm',
        dataKey: 'communicationTraining',
        // Evidence group whose indicators are introduced_in_year=2026-2027; activated
        // (dashboard:true) with the 2026-2027 rollover. activeFromYear year-gates the
        // group on year-scoped surfaces (nav tabs, reports, overview) so it does not
        // render when viewing earlier years.
        dashboard: true,
        activeFromYear: '2026-2027',
        accent: 'blue.500',
        accentDark: 'blue.700',
        accentTint: 'blue.50',
        hex: '#3182CE',         // = resolved blue.500 (standard Chakra); not yet rendered anywhere
        colorScheme: 'blue',
        trendKey: 'Communication & Training',
        // In working_group_abbrevs as of 2026-2027 (backend campus_plan: true) — gets a
        // per-campus WorkingGroupPlan from that year's rollover onward. Earlier years have
        // no com/gov WGPs (not backfilled); the campus plan renders only API-returned WGPs,
        // so old years simply show fewer cards.
        campusPlanOrder: 4,
    },
    governance: {
        slug: 'governance',
        code: 'gov',
        name: 'Governance, Planning & Policies',
        shortLabel: 'Gov',
        dataKey: 'governance',
        // Evidence group activated with the 2026-2027 rollover (see communication-training).
        dashboard: true,
        activeFromYear: '2026-2027',
        accent: 'green.500',
        accentDark: 'green.700',
        accentTint: 'green.50',
        hex: '#38A169',         // = resolved green.500 (standard Chakra)
        colorScheme: 'green',
        trendKey: 'Governance, Planning & Policies',
        // See note on communication-training: campus-plan group as of 2026-2027.
        campusPlanOrder: 5,
    },
    steering: {
        slug: 'steering',
        code: 'ste',
        name: 'Steering',
        shortLabel: 'Steering',
        dataKey: 'steering',
        dashboard: false,       // meta/oversight group — Campus Plan only, not the dashboard
        accent: 'orange.500',
        accentDark: 'orange.700',
        accentTint: 'orange.50',
        // hex is INTENTIONALLY not the resolve of accent (orange.500): the campus plan renders
        // Steering in dark brand blue (#354A7A = teal.700), so hex is authored independently.
        // The orange accent token is dormant (dashboard:false → excluded from every rendered
        // dashboard surface; the campus plan uses hex, not the token).
        hex: '#354A7A',
        colorScheme: 'orange',
        campusPlanOrder: 0,     // Steering leads the campus-plan card order
    },
};

// Full ordered set (includes non-dashboard groups like Steering) — for identity lookups
// and the data-driven Campus Plan, which renders every group that has a WorkingGroupPlan.
const ALL_ORDER = ['web', 'instructional-materials', 'procurement', 'communication-training', 'governance', 'steering'];
export const ALL_WORKING_GROUPS = ALL_ORDER.map((slug) => WORKING_GROUP_IDENTITY[slug]);

// Dashboard-visible working groups (the ATI measurement areas). EVERY dashboard surface
// (nav, evidence fetch, reports, plans/accomplishments, members) iterates THIS list, so a
// `dashboard:false` group is automatically excluded from all of them.
export const WORKING_GROUP_LIST = ALL_WORKING_GROUPS.filter((w) => w.dashboard);

// Dashboard display order (slugs) — used by the SubNavbar path-sync allowlist.
export const WORKING_GROUPS_ORDER = WORKING_GROUP_LIST.map((w) => w.slug);

// Year-aware visibility. A group with `activeFromYear` (com/gov: '2026-2027') is
// hidden on year-scoped surfaces before that year; a group without the field is
// active in every year. Callers with no year in scope pass nothing and get the
// full dashboard list ("YYYY-YYYY" strings compare chronologically).
export const isGroupActiveForYear = (w, year) =>
    !w?.activeFromYear || !year || w.activeFromYear <= year;
export const workingGroupsForYear = (year) =>
    WORKING_GROUP_LIST.filter((w) => isGroupActiveForYear(w, year));

// Derived lookup maps — built from the FULL set so non-dashboard groups (e.g. Steering in
// the Campus Plan) still resolve by code / slug / name.
export const CODE_TO_SLUG = Object.fromEntries(ALL_WORKING_GROUPS.map((w) => [w.code, w.slug]));
export const SLUG_TO_CODE = Object.fromEntries(ALL_WORKING_GROUPS.map((w) => [w.slug, w.code]));
export const NAME_TO_CODE = Object.fromEntries(ALL_WORKING_GROUPS.map((w) => [w.name, w.code]));
export const CODE_TO_NAME = Object.fromEntries(ALL_WORKING_GROUPS.map((w) => [w.code, w.name]));
export const SLUG_TO_DATAKEY = Object.fromEntries(ALL_WORKING_GROUPS.map((w) => [w.slug, w.dataKey]));
export const DATAKEY_TO_SLUG = Object.fromEntries(ALL_WORKING_GROUPS.map((w) => [w.dataKey, w.slug]));

// Map a display name → slug so name-keyed data (campus-plan working_group_plans)
// resolves to the same identity as slug-keyed routes.
const NAME_TO_SLUG = Object.values(WORKING_GROUP_IDENTITY).reduce((acc, wg) => {
    acc[wg.name.toLowerCase()] = wg.slug;
    return acc;
}, {});

/**
 * Resolve a working group's identity from a slug ('web'), a display name
 * ('Web', 'Instructional Materials'), or a working_group field — case-insensitive.
 * Returns a neutral gray identity for unknown keys so callers never crash.
 */
export function getWorkingGroupIdentity(key) {
    if (!key) return NEUTRAL_IDENTITY;
    const raw = String(key).trim();
    const bySlug = WORKING_GROUP_IDENTITY[raw.toLowerCase()];
    if (bySlug) return bySlug;
    const slug = NAME_TO_SLUG[raw.toLowerCase()];
    if (slug) return WORKING_GROUP_IDENTITY[slug];
    return { slug: null, name: raw, accent: 'gray.400', accentDark: 'gray.700', accentTint: 'gray.50', hex: '#718096', colorScheme: 'gray' };
}

const NEUTRAL_IDENTITY = { slug: null, name: '', accent: 'gray.400', accentDark: 'gray.700', accentTint: 'gray.50', hex: '#718096', colorScheme: 'gray' };

/** Just the accent token for a working group (convenience for dots/borders). */
export function getWorkingGroupAccent(key) {
    return getWorkingGroupIdentity(key).accent;
}

/** Raw hex color for a working group (for inline SVG / print / email — where a Chakra
 *  token can't be resolved). Neutral gray (#718096) for unknown keys. */
export function getWgHex(key) {
    return getWorkingGroupIdentity(key).hex;
}

// Campus-plan card order — the groups that get a per-campus WorkingGroupPlan (those with a
// campusPlanOrder), sorted Steering-first. This is authored order, NOT ALL_ORDER (which is
// Steering-last), so deriving campusPlanConfig.WG_ORDER from this preserves current behavior.
// Yields: [Steering, Web, Instructional Materials, Procurement].
export const CAMPUS_PLAN_ORDER = ALL_WORKING_GROUPS
    .filter((w) => w.campusPlanOrder != null)
    .sort((a, b) => a.campusPlanOrder - b.campusPlanOrder);

// reportMetrics WG_DEFS shape: { key: <dataKey>, name, trendKey, accent } for each dashboard
// group. Consolidates the literal array previously hardcoded in reportMetrics.js.
export const WG_DEFS = WORKING_GROUP_LIST.map((w) => ({
    key: w.dataKey,
    name: w.name,
    trendKey: w.trendKey ?? w.name,
    accent: w.accent,
    // Present only on year-gated groups (com/gov) so legacy entries keep their shape.
    ...(w.activeFromYear ? { activeFromYear: w.activeFromYear } : {}),
}));

/** Fresh DataContext state slice for the dashboard working groups: { [dataKey]: null }.
 *  Callers merge in non-WG keys (indicators, implementations, ...). */
export function makeInitialWgState() {
    return Object.fromEntries(WORKING_GROUP_LIST.map((w) => [w.dataKey, null]));
}
