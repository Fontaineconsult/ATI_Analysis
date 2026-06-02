/**
 * Asset / TAAP vocabulary + form metadata. One source of truth for every assets
 * UI piece (list grouping, badges, forms, detail). Mirrors governanceTypes.js
 * and the vocabularies in app/data_config.py (asset_classes, asset_scopes,
 * taap_outcomes) plus the §508 stewardship capacities on the Asset node. Add a
 * scope/class/outcome or tweak a field in one place and the UI follows.
 */

// Scope is part of asset identity; it is the primary grouping dimension for the
// list. Keys match data_config.asset_scopes.
export const ASSET_SCOPES = {
    systemwide: { key: 'systemwide', label: 'Systemwide', colorScheme: 'purple' },
    regional:   { key: 'regional',   label: 'Regional',   colorScheme: 'cyan' },
    campus:     { key: 'campus',     label: 'Campus',     colorScheme: 'teal' },
    vendor:     { key: 'vendor',     label: 'Vendor',     colorScheme: 'orange' },
};
export const ASSET_SCOPE_ORDER = ['systemwide', 'regional', 'campus', 'vendor'];

// Asset class — what kind of ICT the asset is. Keys match data_config.asset_classes.
export const ASSET_CLASSES = {
    institutional_system: { key: 'institutional_system', label: 'Institutional System',      colorScheme: 'blue' },
    employee_content:     { key: 'employee_content',     label: 'Employee-Authored Content', colorScheme: 'green' },
    third_party_service:  { key: 'third_party_service',  label: 'Third-Party Service',       colorScheme: 'orange' },
    infrastructure:       { key: 'infrastructure',       label: 'Infrastructure',            colorScheme: 'gray' },
};
export const ASSET_CLASS_ORDER = ['institutional_system', 'employee_content', 'third_party_service', 'infrastructure'];

// §508 stewardship capacities. Keys match the stewardship keys returned by
// queries/assets/read.py and accepted by the assign_steward / unassign_steward
// PUT actions.
export const STEWARDSHIP_CAPACITIES = [
    { key: 'procured_by',   label: 'Procured by' },
    { key: 'developed_by',  label: 'Developed by' },
    { key: 'maintained_by', label: 'Maintained by' },
    { key: 'used_by',       label: 'Used by' },
];

// A capacity can be held by a Person OR an OrgUnit; holder_type picks which side.
export const HOLDER_TYPES = [
    { key: 'person',   label: 'Person' },
    { key: 'org_unit', label: 'Org Unit' },
];

// TAAP outcome — the equivalent-facilitation result (Title II §35.205). Keys
// match data_config.taap_outcomes.
export const TAAP_OUTCOMES = {
    equally_effective:     { key: 'equally_effective',     label: 'Equally Effective',     colorScheme: 'green' },
    non_equal_alternative: { key: 'non_equal_alternative', label: 'Non-Equal Alternative', colorScheme: 'yellow' },
    referral:              { key: 'referral',              label: 'Referral',              colorScheme: 'red' },
};
export const TAAP_OUTCOME_ORDER = ['equally_effective', 'non_equal_alternative', 'referral'];

// ---- Form field definitions -------------------------------------------------
// `select` fields name their option set via `options` (resolved in the form).
// Asset `locus` is intentionally NOT here — AssetForm renders it scope-aware and
// only on create, since it builds the immutable asset_identifier.
export const ASSET_FIELDS = [
    { name: 'title',       label: 'Title',       type: 'text',     required: true },
    { name: 'scope',       label: 'Scope',       type: 'select',   required: true, options: 'scopes' },
    { name: 'asset_class', label: 'Asset Class', type: 'select',   options: 'classes' },
    { name: 'version',     label: 'Version',     type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
];

export const TAAP_FIELDS = [
    { name: 'title',          label: 'Title',          type: 'text',     required: true },
    { name: 'outcome',        label: 'Outcome',        type: 'select',   options: 'outcomes' },
    { name: 'effective_date', label: 'Effective Date', type: 'date' },
    { name: 'review_due',     label: 'Review Due',     type: 'date' },
    { name: 'description',    label: 'Description',     type: 'textarea' },
    { name: 'active',         label: 'Active',         type: 'boolean' },
];

// ---- helpers ----------------------------------------------------------------
// Backend DateProperty values are serialized by Flask's default JSON provider as
// RFC-1123 strings ("Mon, 01 Jun 2026 00:00:00 GMT"), not "YYYY-MM-DD". Normalize
// to an ISO date for <input type="date">, display, and sorting. Handles ISO,
// RFC-1123, and Date inputs; returns '' for anything unparseable.
export function toISODate(value) {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export const getScopeConfig = (k) => ASSET_SCOPES[k] || null;
export const getScopeLabel = (k) => ASSET_SCOPES[k]?.label || k;
export const getScopeColor = (k) => ASSET_SCOPES[k]?.colorScheme || 'gray';
export const getClassConfig = (k) => ASSET_CLASSES[k] || null;
export const getClassLabel = (k) => ASSET_CLASSES[k]?.label || k;
export const getClassColor = (k) => ASSET_CLASSES[k]?.colorScheme || 'gray';
export const getOutcomeLabel = (k) => TAAP_OUTCOMES[k]?.label || k;
export const getOutcomeColor = (k) => TAAP_OUTCOMES[k]?.colorScheme || 'gray';
export const getCapacityLabel = (k) => STEWARDSHIP_CAPACITIES.find((c) => c.key === k)?.label || k;
