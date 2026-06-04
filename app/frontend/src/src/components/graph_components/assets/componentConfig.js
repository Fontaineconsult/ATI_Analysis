/**
 * Component vocabulary helpers.
 *
 * `kind` lives on the Component (it moved off the Interface — a component is
 * kind-homogeneous and is where WCAG attaches). Labels/keys/order come from
 * app/data_config.py via the fetched vocab registry (GET /settings, key
 * `component_kinds`); this module only adds the presentation colour overlay.
 * Mirrors interfaceConfig.js.
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

const labelFor = (category, key, v) => (v || registry)[category]?.[key] || key;
const optionsFor = (category, colors, v) =>
    Object.entries((v || registry)[category] || {}).map(([key, label]) => ({
        key,
        label,
        colorScheme: colors[key] || 'gray',
    }));

export const getComponentKindLabel = (k, v) => labelFor('component_kinds', k, v);
export const getComponentKindColor = (k) => KIND_COLORS[k] || 'gray';
export const getComponentKindConfig = (k, v) => ({ key: k, label: getComponentKindLabel(k, v), colorScheme: getComponentKindColor(k) });
export const getComponentKindOptions = (v) => optionsFor('component_kinds', KIND_COLORS, v);
