/**
 * Working-group identity — single source of truth for the brand accent trio that
 * marks the three ATI working groups (design-sense §2 & §8.4).
 *
 * Web = teal.500 (brand blue) · Instructional Materials = purple.500 ·
 * Procurement = coral.500. Rendered as a small dot + an accent underline/border
 * wherever a working group is named.
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
        dataKey: 'web',
        dashboard: true,
        accent: 'teal.500',     // brand blue
        accentDark: 'teal.700',
        accentTint: 'teal.50',
        colorScheme: 'teal',
    },
    'instructional-materials': {
        slug: 'instructional-materials',
        code: 'ins',
        name: 'Instructional Materials',
        dataKey: 'instructionalMaterials',
        dashboard: true,
        accent: 'purple.500',
        accentDark: 'purple.700',
        accentTint: 'purple.50',
        colorScheme: 'purple',
    },
    procurement: {
        slug: 'procurement',
        code: 'pro',
        name: 'Procurement',
        dataKey: 'procurement',
        dashboard: true,
        accent: 'coral.500',
        accentDark: 'coral.700',
        accentTint: 'coral.50',
        colorScheme: 'coral',
    },
    steering: {
        slug: 'steering',
        code: 'ste',
        name: 'Steering',
        dataKey: 'steering',
        dashboard: false,       // meta/oversight group — Campus Plan only, not the dashboard
        accent: 'orange.500',
        accentDark: 'orange.700',
        accentTint: 'orange.50',
        colorScheme: 'orange',
    },
};

// Full ordered set (includes non-dashboard groups like Steering) — for identity lookups
// and the data-driven Campus Plan, which renders every group that has a WorkingGroupPlan.
const ALL_ORDER = ['web', 'instructional-materials', 'procurement', 'steering'];
export const ALL_WORKING_GROUPS = ALL_ORDER.map((slug) => WORKING_GROUP_IDENTITY[slug]);

// Dashboard-visible working groups (the ATI measurement areas). EVERY dashboard surface
// (nav, evidence fetch, reports, plans/accomplishments, members) iterates THIS list, so a
// `dashboard:false` group is automatically excluded from all of them.
export const WORKING_GROUP_LIST = ALL_WORKING_GROUPS.filter((w) => w.dashboard);

// Dashboard display order (slugs) — used by the SubNavbar path-sync allowlist.
export const WORKING_GROUPS_ORDER = WORKING_GROUP_LIST.map((w) => w.slug);

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
    return { slug: null, name: raw, accent: 'gray.400', accentDark: 'gray.700', accentTint: 'gray.50', colorScheme: 'gray' };
}

const NEUTRAL_IDENTITY = { slug: null, name: '', accent: 'gray.400', accentDark: 'gray.700', accentTint: 'gray.50', colorScheme: 'gray' };

/** Just the accent token for a working group (convenience for dots/borders). */
export function getWorkingGroupAccent(key) {
    return getWorkingGroupIdentity(key).accent;
}
