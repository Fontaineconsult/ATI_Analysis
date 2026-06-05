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
