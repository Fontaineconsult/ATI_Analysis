/**
 * Interface vocabulary helpers.
 *
 * Labels, keys, and order come from app/data_config.py via the fetched vocab registry
 * (GET /settings) — they are NOT hardcoded here. Editing a vocabulary is a one-file
 * change in data_config.py; this module only adds the presentation colour overlay,
 * which is a frontend concern. Unknown keys fall back to a gray badge.
 *
 * Usage:
 *   - Badges (dumb leaves): call get*Label / get*Color — they read the module registry.
 *   - Forms / lists: call get*Options(vocab) passing the reactive vocab from
 *     useSettings() so they re-render once /settings has loaded.
 */
import { vocab as registry } from './vocabRegistry';

// Presentation only — colour per vocab key. Labels/keys/order are data_config's job.
const KIND_COLORS = {
    'web-surface': 'blue',
    'structured-document': 'purple',
    'time-based-media': 'pink',
    'interactive-component': 'teal',
    'static-non-text': 'gray',
};
const COVERAGE_DOMAIN_COLORS = {
    'library-assets': 'cyan',
    'social-media': 'blue',
    'marketing-communications': 'orange',
    'publisher-content': 'purple',
    'course-content': 'green',
    'emerging-instructional-tech': 'pink',
};
const AUDIENCE_COLORS = {
    students: 'teal',
    employees: 'blue',
    'applicants-for-employment': 'cyan',
    'prospective-students': 'purple',
    'general-public': 'orange',
};
const PROVENANCE_COLORS = {
    declared: 'blue',
    enacted: 'green',
    both: 'purple',
};

// label for a key in a category dict (falls back to the key itself).
const labelFor = (category, key, v) => (v || registry)[category]?.[key] || key;

// [{key,label,colorScheme}] for a category dict, in data_config definition order.
const optionsFor = (category, colors, v) =>
    Object.entries((v || registry)[category] || {}).map(([key, label]) => ({
        key,
        label,
        colorScheme: colors[key] || 'gray',
    }));

// kind
export const getKindLabel = (k, v) => labelFor('interface_kinds', k, v);
export const getKindColor = (k) => KIND_COLORS[k] || 'gray';
export const getKindConfig = (k, v) => ({ key: k, label: getKindLabel(k, v), colorScheme: getKindColor(k) });
export const getKindOptions = (v) => optionsFor('interface_kinds', KIND_COLORS, v);

// coverage domain
export const getCoverageDomainLabel = (k, v) => labelFor('coverage_domains', k, v);
export const getCoverageDomainColor = (k) => COVERAGE_DOMAIN_COLORS[k] || 'gray';
export const getCoverageDomainOptions = (v) => optionsFor('coverage_domains', COVERAGE_DOMAIN_COLORS, v);

// audience (multi-valued)
export const getAudienceLabel = (k, v) => labelFor('audiences', k, v);
export const getAudienceColor = (k) => AUDIENCE_COLORS[k] || 'gray';
export const getAudienceOptions = (v) => optionsFor('audiences', AUDIENCE_COLORS, v);

// provenance
export const getProvenanceLabel = (k, v) => labelFor('interface_provenances', k, v);
export const getProvenanceColor = (k) => PROVENANCE_COLORS[k] || 'gray';
export const getProvenanceOptions = (v) => optionsFor('interface_provenances', PROVENANCE_COLORS, v);
