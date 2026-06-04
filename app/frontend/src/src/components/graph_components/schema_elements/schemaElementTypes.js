/**
 * STRUCTURAL registry for SchemaElement (meta-scaffold). Structure ONLY — input field
 * schema, render order, and Chakra color tokens. NO human prose: kind labels and element
 * descriptions come from the descriptor context (describeFieldValue('element_kind', kind),
 * describeNodeType, describeField). Mirrors governanceTypes.js, minus the prose.
 *
 * Field schema:
 *   name      Backend property name.
 *   type      "text" | "textarea" | "date".
 *   required  Defaults to false.
 */
const _IDENTITY_FIELDS = [
    { name: 'handle', type: 'text', required: true },  // e.g. label:Tool / rel:develops / field:Asset.scope
    { name: 'name', type: 'text' },
];

export const SCHEMA_ELEMENT_KINDS = {
    node_label: { key: 'node_label', colorScheme: 'purple', fields: _IDENTITY_FIELDS },
    rel_type:   { key: 'rel_type',   colorScheme: 'orange', fields: _IDENTITY_FIELDS },
    field:      { key: 'field',      colorScheme: 'blue',   fields: _IDENTITY_FIELDS },
};

export const SCHEMA_ELEMENT_KIND_ORDER = ['node_label', 'rel_type', 'field'];

export function getSchemaElementKindConfig(kind) {
    return SCHEMA_ELEMENT_KINDS[kind] || null;
}

export function getSchemaElementKindColorScheme(kind) {
    return SCHEMA_ELEMENT_KINDS[kind]?.colorScheme || 'gray';
}

// Humanized fallback when no descriptor exists yet for this element_kind value.
export function humanizeKind(kind) {
    return (kind || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Handle-prefix suggestions surfaced as the create form's placeholder, per kind.
export const HANDLE_PLACEHOLDER = {
    node_label: 'label:Tool',
    rel_type: 'rel:develops',
    field: 'field:Asset.scope',
};
