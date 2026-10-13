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
 *   reference   Guidance / Tracking / InternalPolicy — no participant team and no
 *               accountable working group, but they DO carry an accountable
 *               community (someone answers for keeping them current).
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

// Evidence control — who operates the practice, RELATIVE to this evidence's
// owners (the same implementation can be internal to one campus/WG's evidence
// and external to another's). Mirrors data_config.evidence_control_choices;
// absent/null = unspecified. External marks a dependency on a practice the
// owners don't directly control (another unit, SFBRN, the CO, a vendor).
export const EVIDENCE_CONTROL_OPTIONS = [
    { value: 'internal', label: 'Internal', colorScheme: 'teal', description: 'The evidence owners operate this practice themselves.' },
    { value: 'external', label: 'External', colorScheme: 'purple', description: "The owners rely on a practice they don't directly control (another unit, SFBRN, the CO, a vendor)." },
];

export const controlConfig = (value) => {
    if (value === null || value === undefined || value === '') return null;
    return EVIDENCE_CONTROL_OPTIONS.find((o) => o.value === value) || null;
};

// Capability tiers (Sets for O(1) membership). Source: update.py constants.
const DOING_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service']);
const DIMENSION_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service', 'InternalPolicy', 'Guidance']);
const PARTICIPANT_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service']);
const ACCOUNTABLE_WG_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service']);
// Community accountability is WIDER than the working-group edge and wider than
// participants: "which community answers for this being current" is a fair question
// about a guidance page, a policy or a register, none of which perform remediation
// work. Mirrors _COMMUNITY_ACCOUNTABLE_TYPES in queries/implementation/update.py.
const ACCOUNTABLE_COMMUNITY_TYPES = new Set([
    'Process', 'Project', 'Procedure', 'Service', 'Guidance', 'InternalPolicy', 'Tracking',
]);
const ASSET_TYPES = new Set(['Process', 'Project', 'Procedure', 'Service']);

export const isDoing = (type) => DOING_TYPES.has(type);
export const isDimensioned = (type) => DIMENSION_TYPES.has(type);
export const hasParticipants = (type) => PARTICIPANT_TYPES.has(type);
export const hasAccountableWorkingGroup = (type) => ACCOUNTABLE_WG_TYPES.has(type);
export const hasAccountableCommunity = (type) => ACCOUNTABLE_COMMUNITY_TYPES.has(type);
export const hasAssets = (type) => ASSET_TYPES.has(type);

const BY_KEY = Object.fromEntries(IMPLEMENTATION_TYPES.map((t) => [t.key, t]));

export const typeLabel = (type) => BY_KEY[type]?.label || type;
export const typeColor = (type) => BY_KEY[type]?.colorScheme || 'gray';
export const isValidType = (type) => Boolean(BY_KEY[type]);

// Supporting-documentation health (design-sense §1, diagnostic-first).
//
// What counts as documentation depends on the implementation type. For most
// types the pool is documents AND webpages. A Tracking is a record kept over
// time, so the metrics it holds are its documentation too. Notes and messages
// are annotations and never count. Mirrors data_config.documentation_pools on
// the server, which the indicator report and the public report use.
//
// A document is "active" unless flagged `depreciated`; a webpage is "active"
// unless flagged `depreciated` OR `no_longer_exists` (link rot, the page is
// gone); a metric has no deprecation and is always active. An implementation
// whose whole pool is dead has no live documentation, a warning surfaced on the
// list row, the stat strip and the detail panel. Zero attached items is a
// distinct state (nothing attached), so allDocumentsDepreciated needs at least one.
const docIsActive = (d) => d?.depreciated !== true;
const webIsActive = (w) => w?.depreciated !== true && w?.no_longer_exists !== true;

const POOL_KINDS = {
    documents: { field: 'supporting_documents', isActive: docIsActive },
    webpages: { field: 'supporting_webpages', isActive: webIsActive },
    metrics: { field: 'supporting_metrics', isActive: () => true },
};

export const DOCUMENTATION_RULES = {
    default: {
        pool: ['documents', 'webpages'],
        noun: 'documents or webpages',
        undocumented: 'No documents or webpages are attached to this implementation, so the practice is undocumented. Notes and messages don\'t count as documentation.',
    },
    Tracking: {
        pool: ['documents', 'webpages', 'metrics'],
        noun: 'metrics, documents or webpages',
        undocumented: 'No metrics, documents or webpages are attached, so nothing shows what this tracking records. Notes and messages don\'t count as documentation.',
    },
};

/** The documentation rule for a type: which kinds count, and how to say it is missing. */
export const documentationRule = (type) => DOCUMENTATION_RULES[type] || DOCUMENTATION_RULES.default;

/** Everything in the type's documentation pool, live or dead. */
export const documentationCount = (impl, type = impl?.type) =>
    documentationRule(type).pool.reduce(
        (sum, kind) => sum + (impl?.[POOL_KINDS[kind].field]?.length || 0), 0);

export const activeDocumentCount = (impl, type = impl?.type) =>
    documentationRule(type).pool.reduce(
        (sum, kind) => sum + (impl?.[POOL_KINDS[kind].field] || []).filter(POOL_KINDS[kind].isActive).length, 0);

export const allDocumentsDepreciated = (impl, type = impl?.type) =>
    documentationCount(impl, type) > 0 && activeDocumentCount(impl, type) === 0;

// The sibling gap: NO documentation at all, by the type's rule.
export const isUndocumented = (impl, type = impl?.type) => documentationCount(impl, type) === 0;

// Campus scoping: an implementation belongs to a campus if it's wired to that campus,
// or not yet assigned to any (orphans stay visible — matching the list's default).
// Shared by ImplementationList's filter AND the parent's category/stat counts so the
// counts always agree with what the list shows.
export const implementationInCampus = (impl, campus) => {
    const cs = Array.isArray(impl?.campuses) ? impl.campuses : [];
    return cs.length === 0 || (Boolean(campus) && cs.includes(campus));
};
