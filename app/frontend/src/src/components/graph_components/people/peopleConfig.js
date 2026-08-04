/**
 * People domain config — the single source of truth for working-group vocab,
 * badge colors, diagnostic filters, and the person form shape. Mirrors the
 * self-contained archetype (governanceTypes.js): every People UI piece (list,
 * stat strip, badges, form, detail) imports from here instead of hardcoding.
 *
 * Working-group colors are the brand identity trio (design-sense §2):
 * Web = teal (brand blue) · Instructional Materials = purple · Procurement = coral.
 */

export const WORKING_GROUPS = {
    web: {
        key: 'web',
        name: 'Web',
        abbrev: 'WEB',
        colorScheme: 'teal',
        compositeKeySuffixes: ['web'],
    },
    ins: {
        key: 'ins',
        name: 'Instructional Materials',
        abbrev: 'IM',
        colorScheme: 'purple',
        compositeKeySuffixes: ['ins', 'instructional-materials', 'instructional materials'],
    },
    pro: {
        key: 'pro',
        name: 'Procurement',
        abbrev: 'PRO',
        colorScheme: 'coral',
        compositeKeySuffixes: ['pro', 'procurement'],
    },
};

export const WORKING_GROUP_ORDER = ['web', 'ins', 'pro'];

export const WORKING_GROUP_NAMES = WORKING_GROUP_ORDER.map((k) => WORKING_GROUPS[k].name);

export function getWorkingGroupConfig(name) {
    if (!name) return null;
    const lower = String(name).trim().toLowerCase();
    return (
        Object.values(WORKING_GROUPS).find(
            (wg) => wg.name.toLowerCase() === lower || wg.key === lower,
        ) || null
    );
}

export function getWorkingGroupColor(name) {
    return getWorkingGroupConfig(name)?.colorScheme || 'gray';
}

export function getWorkingGroupAbbrev(name) {
    return getWorkingGroupConfig(name)?.abbrev || String(name || '').toUpperCase();
}

/**
 * Working group inferred from an indicator composite key ("7.6-web" → "Web").
 * Unrecognized suffixes are title-cased as-is; missing suffix → "Other".
 */
export function workingGroupFromCompositeKey(compositeKey) {
    if (!compositeKey) return 'Other';
    const suffix = compositeKey.split('-').slice(1).join('-').trim().toLowerCase();
    if (!suffix) return 'Other';
    const wg = Object.values(WORKING_GROUPS).find((w) => w.compositeKeySuffixes.includes(suffix));
    if (wg) return wg.name;
    return suffix.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Normalize person.workingGroups ([{name}] or [string]) to an array of names. */
export function personWorkingGroups(person) {
    if (!person || !Array.isArray(person.workingGroups)) return [];
    return person.workingGroups
        .map((wg) => (typeof wg === 'string' ? wg : wg?.name))
        .filter(Boolean);
}

/**
 * Invisible-labor signal at roster level: the person holds at least one role
 * that is not in their position description. (The full held ∪ worked view
 * lives in RoleHoldingsEditor; the roster serialization carries held roles.)
 */
export function hasRoleNotInPd(person) {
    if (!person || !Array.isArray(person.roles)) return false;
    return person.roles.some((r) => !r.in_position_description);
}

/**
 * Stat-strip filters. `all` is the neutral state; the rest are diagnostic
 * slices the tiles toggle. Predicates run over roster-shaped person objects.
 */
export const PERSON_FILTERS = {
    all: { key: 'all', label: 'All active people', predicate: () => true },
    approvers: {
        key: 'approvers',
        label: 'Approvers',
        predicate: (p) => !!p.can_approve_yse,
    },
    noWorkingGroup: {
        key: 'noWorkingGroup',
        label: 'No working group',
        predicate: (p) => personWorkingGroups(p).length === 0,
    },
    roleNotInPd: {
        key: 'roleNotInPd',
        label: 'Role not in PD',
        predicate: (p) => hasRoleNotInPd(p),
    },
};

export function filterPeople(people, filterKey) {
    const filter = PERSON_FILTERS[filterKey] || PERSON_FILTERS.all;
    return (people || []).filter(filter.predicate);
}

/** Counts for the diagnostic stat strip, computed over the active roster. */
export function summarizePeople(people) {
    const list = people || [];
    return {
        total: list.length,
        approvers: list.filter(PERSON_FILTERS.approvers.predicate).length,
        noWorkingGroup: list.filter(PERSON_FILTERS.noWorkingGroup.predicate).length,
        roleNotInPd: list.filter(PERSON_FILTERS.roleNotInPd.predicate).length,
    };
}

/**
 * Text fields for PersonForm, in render order. host_campus (campus select),
 * the status booleans, and working groups are structural and handled by the
 * form itself.
 *   readOnlyInEdit — employee_id is the business key; immutable once created.
 */
export const PERSON_FORM_FIELDS = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'employee_id', label: 'Employee ID', type: 'text', required: true, readOnlyInEdit: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'title', label: 'Title', type: 'text' },
    { name: 'ati_role', label: 'ATI Role', type: 'text' },
];

export const PERSON_STATUS_FIELDS = [
    { name: 'active', label: 'Active Member' },
    { name: 'non_committee_member_active', label: 'Active Non-Committee Member' },
    { name: 'can_approve_yse', label: 'Can Approve YSE' },
];

// ---------------------------------------------------------------------------
// Communities of practice — the sibling tab of the People area. Cross-campus
// groupings by shared functional area; freely creatable data, not a vocabulary.
// ---------------------------------------------------------------------------

/** Normalize person.communities ([{unique_id, name, note}]) to that array. */
export function personCommunities(person) {
    if (!person || !Array.isArray(person.communities)) return [];
    return person.communities.filter(Boolean);
}

/**
 * Community-list filters for the stat strip. Predicates run over list-shaped
 * community objects ({unique_id, name, member_count, campuses}).
 */
export const COMMUNITY_FILTERS = {
    all: { key: 'all', label: 'All communities', predicate: () => true },
    empty: {
        key: 'empty',
        label: 'Empty communities',
        predicate: (c) => !c.member_count,
    },
};

export function filterCommunities(communities, filterKey) {
    const filter = COMMUNITY_FILTERS[filterKey] || COMMUNITY_FILTERS.all;
    return (communities || []).filter(filter.predicate);
}

/**
 * Counts for the Communities stat strip. `communities` is the list payload;
 * `people` is the active roster (used for the membership-coverage diagnostics —
 * how many active people belong to at least one community, and how many to none).
 */
export function summarizeCommunities(communities, people) {
    const list = communities || [];
    const roster = people || [];
    const inCommunity = roster.filter((p) => personCommunities(p).length > 0).length;
    return {
        total: list.length,
        emptyCommunities: list.filter(COMMUNITY_FILTERS.empty.predicate).length,
        peopleInCommunity: inCommunity,
        peopleInNone: roster.length - inCommunity,
    };
}
