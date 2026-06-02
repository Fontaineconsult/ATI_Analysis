/**
 * Asset / TAAP helpers.
 *
 * Vocabulary labels, keys, and order (asset scopes, asset classes, TAAP outcomes) come
 * from app/data_config.py via the fetched vocab registry (GET /settings) — they are NOT
 * hardcoded here. Editing a vocabulary is a one-file change in data_config.py; this
 * module only adds the presentation colour overlay. Unknown keys fall back to gray.
 *
 * The §508 stewardship capacities and holder types below are NOT in data_config — they
 * are frontend-only structural constants tied to the assign_steward API contract, so
 * they stay hardcoded. `toISODate` is a date utility, also unchanged.
 *
 * Usage:
 *   - Badges: call get*Label / get*Color (read the module registry).
 *   - Forms / lists: call get*Options(vocab) passing the reactive vocab from
 *     useSettings() so they re-render once /settings has loaded.
 */
import { vocab as registry } from './vocabRegistry';

// Presentation only — colour per vocab key. Labels/keys/order are data_config's job.
const SCOPE_COLORS = { systemwide: 'purple', regional: 'cyan', campus: 'teal', vendor: 'orange' };
const CLASS_COLORS = {
    institutional_system: 'blue',
    employee_content: 'green',
    third_party_service: 'orange',
    infrastructure: 'gray',
};
const OUTCOME_COLORS = {
    equally_effective: 'green',
    non_equal_alternative: 'yellow',
    referral: 'red',
};

const labelFor = (category, key, v) => (v || registry)[category]?.[key] || key;
const optionsFor = (category, colors, v) =>
    Object.entries((v || registry)[category] || {}).map(([key, label]) => ({
        key,
        label,
        colorScheme: colors[key] || 'gray',
    }));

// scope — the primary grouping dimension for the asset list
export const getScopeLabel = (k, v) => labelFor('asset_scopes', k, v);
export const getScopeColor = (k) => SCOPE_COLORS[k] || 'gray';
export const getScopeConfig = (k, v) => ({ key: k, label: getScopeLabel(k, v), colorScheme: getScopeColor(k) });
export const getScopeOptions = (v) => optionsFor('asset_scopes', SCOPE_COLORS, v);

// asset class
export const getClassLabel = (k, v) => labelFor('asset_classes', k, v);
export const getClassColor = (k) => CLASS_COLORS[k] || 'gray';
export const getClassConfig = (k, v) => ({ key: k, label: getClassLabel(k, v), colorScheme: getClassColor(k) });
export const getClassOptions = (v) => optionsFor('asset_classes', CLASS_COLORS, v);

// TAAP outcome
export const getOutcomeLabel = (k, v) => labelFor('taap_outcomes', k, v);
export const getOutcomeColor = (k) => OUTCOME_COLORS[k] || 'gray';
export const getOutcomeOptions = (v) => optionsFor('taap_outcomes', OUTCOME_COLORS, v);

// ---- §508 stewardship (frontend-only structural constants; NOT in data_config) ------
// Keys match the stewardship keys returned by queries/assets/read.py and accepted by
// the assign_steward / unassign_steward PUT actions.
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

export const getCapacityLabel = (k) => STEWARDSHIP_CAPACITIES.find((c) => c.key === k)?.label || k;

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
