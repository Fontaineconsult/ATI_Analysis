/**
 * STRUCTURAL registry for Principle (a single node type). Structure ONLY — field schema +
 * a color token. Prose (field labels, descriptions, help) comes from the descriptor context.
 */
export const PRINCIPLE_FIELDS = [
    { name: 'handle', type: 'text', required: true },           // e.g. principle:closest-to-capacity
    { name: 'name', type: 'text', required: true },
    { name: 'description_short', type: 'textarea' },            // concise statement (UI default)
    { name: 'description_full', type: 'textarea' },             // full rationale (the whole idea)
];

export const PRINCIPLE_COLOR = 'cyan';

// Grounding kind is DERIVED (not stored) from whether `derives_from` reaches Governance vs
// IntellectualSource — used only for the source badge + optional list grouping.
export function deriveGroundingKind(principle) {
    const g = principle?.grounded_in?.governance?.length || 0;
    const s = principle?.grounded_in?.intellectual_sources?.length || 0;
    if (g && s) return 'mixed';
    if (g) return 'law_grounded';
    if (s) return 'theory_grounded';
    return 'ungrounded';
}

export const GROUNDING_KIND_META = {
    law_grounded:    { label: 'Law-grounded', color: 'red' },
    theory_grounded: { label: 'Theory-grounded', color: 'purple' },
    mixed:           { label: 'Mixed grounding', color: 'orange' },
    ungrounded:      { label: 'Ungrounded', color: 'gray' },
};
