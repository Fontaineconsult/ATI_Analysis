// Config for the Ontology Browser — labels, colors, and small helpers, in one place
// (design-sense §1.4: config-driven labels & colors, never hardcoded per component).

// Descriptor kinds — mirrors data_config.descriptor_kinds. colorScheme drives the badge.
export const DESCRIPTOR_KIND_META = {
    node_type:   { label: 'Node Type',         colorScheme: 'teal' },
    field:       { label: 'Field',             colorScheme: 'purple' },
    field_value: { label: 'Field Value',       colorScheme: 'blue' },
    rel_type:    { label: 'Relationship Type', colorScheme: 'orange' },
};

// Relationship direction → a glyph + label (the engine emits to | from | both).
export const DIRECTION_META = {
    to:   { symbol: '→', label: 'to' },
    from: { symbol: '←', label: 'from' },
    both: { symbol: '↔', label: 'both' },
};

// Coverage % → a semantic accent (red→amber→green). Used for stat-strip top borders and
// coverage badges. NOT the maturity ramp — this is a generic completeness signal.
export function coverageAccent(pct) {
    if (pct == null) return 'gray.400';
    if (pct < 40) return 'red.400';
    if (pct < 70) return 'orange.400';
    return 'green.400';
}

export function coverageColorScheme(pct) {
    if (pct == null) return 'gray';
    if (pct < 40) return 'red';
    if (pct < 70) return 'orange';
    return 'green';
}

// Element kinds where full description coverage is the GOAL vs opt-in (salient only).
// node_type / rel_type are expected to be fully described; field / field_value are
// described only where salient (see ontology_health docstring).
export const COVERAGE_GOAL_KINDS = ['node_type', 'rel_type'];

export const KIND_ORDER = ['node_type', 'field', 'field_value', 'rel_type'];
