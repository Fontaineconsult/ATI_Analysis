/**
 * Single source of truth for the implementation type taxonomy and its capability
 * tiers — the config layer the design-sense §9 recipe calls for (mirrors
 * assetConfig.js / governanceTypes.js). Replaces the type arrays that were
 * duplicated across ImplementationTypeOverview, the canon embedded container,
 * the explorer shell, and AssetsMasterContainer's REMEDIATING_TYPES.
 *
 * Tiers mirror the backend split in
 * app/database/queries/implementation/update.py — keep the two in sync:
 *   doing       Process / Project / Procedure / Service — carry participants
 *               (worked_on), accountable working group, and remediated
 *               assets/interfaces.
 *   classified  doing + InternalPolicy + Guidance — carry AMM dimensions
 *               (classified_under).
 *   reference   Guidance / Tracking / InternalPolicy — no team/accountability.
 * Every type carries an owner (owned_by), evidence links (is_evidence_for), and
 * supporting documentation.
 *
 * Colours are the presentation overlay only (calm, single-accent house style):
 * teal = brand, others reserved for categorical type identity.
 */

export const IMPLEMENTATION_TYPES = [
    { key: 'Process', label: 'Process', colorScheme: 'teal' },
    { key: 'Project', label: 'Project', colorScheme: 'blue' },
    { key: 'Procedure', label: 'Procedure', colorScheme: 'cyan' },
    { key: 'Service', label: 'Service', colorScheme: 'green' },
    { key: 'Guidance', label: 'Guidance', colorScheme: 'purple' },
    { key: 'InternalPolicy', label: 'Internal Policy', colorScheme: 'orange' },
    { key: 'Tracking', label: 'Tracking', colorScheme: 'gray' },
];

// Canonical display order of the type keys.
export const TYPE_KEYS = IMPLEMENTATION_TYPES.map((t) => t.key);

// Evidence strength — the 0-3 rating carried on an is_evidence_for link
// (implementation → YSE). Mirrors data_config.evidence_strength_levels (also
// served via GET /settings); absent/null = unrated. Colors: 0 reads as a
// warning (why is this linked?), 3 as solid evidence.
export const EVIDENCE_STRENGTH_LEVELS = [
    { value: 0, label: 'No Contribution', colorScheme: 'red', description: 'Does not address any requirement of the success indicator — review whether the link belongs at all.' },
    { value: 1, label: 'Indirect Support', colorScheme: 'orange', description: 'Supports the success indicator indirectly — enabling or adjacent work that does not itself address the indicator’s requirements.' },
    { value: 2, label: 'Partial', colorScheme: 'blue', description: 'Directly addresses some, but not all, of the success indicator’s requirements.' },
    { value: 3, label: 'Full', colorScheme: 'green', description: 'Directly and completely addresses the success indicator’s requirements.' },
];

// null/undefined/non-numeric → null (unrated); else the level config.
export const strengthConfig = (value) => {
    if (value === null || value === undefined || value === '') return null;
    return EVIDENCE_STRENGTH_LEVELS.find((l) => l.value === Number(value)) || null;
};

// Capability tiers (Sets for O(1) membership). Source: update.py constants.
const DOING_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service']);
const DIMENSION_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service', 'InternalPolicy', 'Guidance']);
const PARTICIPANT_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service']);
const ACCOUNTABLE_WG_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service']);
const ASSET_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service']);

export const isDoing = (type) => DOING_TYPES.has(type);
export const isDimensioned = (type) => DIMENSION_TYPES.has(type);
export const hasParticipants = (type) => PARTICIPANT_TYPES.has(type);
export const hasAccountableWorkingGroup = (type) => ACCOUNTABLE_WG_TYPES.has(type);
export const hasAssets = (type) => ASSET_TYPES.has(type);

const BY_KEY = Object.fromEntries(IMPLEMENTATION_TYPES.map((t) => [t.key, t]));

export const typeLabel = (type) => BY_KEY[type]?.label || type;
export const typeColor = (type) => BY_KEY[type]?.colorScheme || 'gray';
export const isValidType = (type) => Boolean(BY_KEY[type]);

// Supporting-documentation health (design-sense §1 — diagnostic-first). The
// documentation pool is documents AND webpages. A document is "active" unless
// flagged `depreciated`; a webpage is "active" unless flagged `depreciated` OR
// `no_longer_exists` (link rot — the page is gone). An implementation whose whole
// pool is dead has no live documentation — a warning we surface on the list row,
// the stat strip, and the detail panel. Zero attached items is a distinct state
// (nothing attached), so these predicates require at least one document or webpage.
const docIsActive = (d) => d?.depreciated !== true;
const webIsActive = (w) => w?.depreciated !== true && w?.no_longer_exists !== true;

export const activeDocumentCount = (impl) =>
    (impl?.supporting_documents || []).filter(docIsActive).length +
    (impl?.supporting_webpages || []).filter(webIsActive).length;

export const allDocumentsDepreciated = (impl) => {
    const total =
        (impl?.supporting_documents?.length || 0) +
        (impl?.supporting_webpages?.length || 0);
    return total > 0 && activeDocumentCount(impl) === 0;
};

// Campus scoping: an implementation belongs to a campus if it's wired to that campus,
// or not yet assigned to any (orphans stay visible — matching the list's default).
// Shared by ImplementationList's filter AND the parent's category/stat counts so the
// counts always agree with what the list shows.
export const implementationInCampus = (impl, campus) => {
    const cs = Array.isArray(impl?.campuses) ? impl.campuses : [];
    return cs.length === 0 || (Boolean(campus) && cs.includes(campus));
};
