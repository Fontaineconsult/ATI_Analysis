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

// Supporting-documentation health (design-sense §1 — diagnostic-first). A document
// is "active" unless flagged `depreciated`. An implementation whose documents are
// ALL depreciated has no live documentation — a warning we surface on the list row,
// the stat strip, and the detail panel. Zero documents is a distinct state (nothing
// attached), so this predicate deliberately requires at least one document.
export const activeDocumentCount = (impl) =>
    (impl?.supporting_documents || []).filter((d) => d.depreciated !== true).length;

export const allDocumentsDepreciated = (impl) => {
    const docs = impl?.supporting_documents || [];
    return docs.length > 0 && docs.every((d) => d.depreciated === true);
};
