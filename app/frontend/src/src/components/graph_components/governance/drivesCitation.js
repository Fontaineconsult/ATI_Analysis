/**
 * The `drives` edge's citation, as a single shared definition.
 *
 * Mirrors DrivesRel in app/database/graph_schema.py. Defined once because the edge is
 * authored from BOTH ends — the Governance area asks "what does this instrument
 * drive?", the dashboard's indicator view asks "what drives this indicator?" — and a
 * citation schema that differed between the two would let the same edge be described
 * two ways.
 *
 * The `fields` array drives both the add form and the read view inside
 * AnnotatedAttachmentSelector.
 */

export const CITATION_FIELDS = [
    {
        name: 'provision',
        label: 'Provision',
        type: 'text',
        mono: true,
        display: 'badge',
        placeholder: 'e.g. E202.7.2 · WCAG 2.1 SC 1.2.4 · §7405(d)(1)',
    },
    {
        name: 'quote',
        label: 'Quote',
        type: 'textarea',
        rows: 3,
        display: 'quote',
        placeholder: "The operative sentence, verbatim from the instrument's captured text.",
    },
    {
        name: 'note',
        label: 'Note',
        type: 'text',
        display: 'muted',
        placeholder: "Why this provision maps to the indicator's requirement (optional).",
    },
];

/**
 * A `drives` edge with neither a provision nor a quote asserts exactness without
 * evidence — the decay into `informs` that the two-edge split exists to prevent.
 */
export function isUncited(link) {
    return !(link.provision || '').trim() && !(link.quote || '').trim();
}

// Surfaced as a TEXT badge, never colour alone.
export const UNCITED_FLAG = {
    when: isUncited,
    label: 'Uncited',
    colorScheme: 'orange',
    tooltip:
        'A drives edge asserts the instrument states this requirement. Without a provision or a quote that claim cannot be checked.',
};
