/**
 * Module-level cache of the vocabularies fetched from GET /settings (which serves
 * app/data_config.py — the single source of truth). SettingsContext fills this on
 * mount via setVocab().
 *
 * This exists so the pure label/colour helpers in assetConfig.js / interfaceConfig.js
 * (and the dumb badge components that call them) can resolve a key → label without
 * threading React context through every leaf. Components that need to re-render when
 * the vocab arrives (forms, lists) should read it from useSettings().vocab and pass it
 * to the *Options() helpers; the registry is the default fallback for everything else.
 *
 * Shape: { <category>: { <key>: <label> } | [<value>, ...] }, e.g.
 *   { interface_kinds: { 'web-surface': 'Web Surface', ... }, working_groups: [...] }
 */
export const vocab = {};

export function setVocab(next) {
    if (!next || typeof next !== 'object') return;
    for (const key of Object.keys(next)) {
        vocab[key] = next[key];
    }
}
