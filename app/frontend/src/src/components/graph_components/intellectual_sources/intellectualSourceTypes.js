/**
 * STRUCTURAL registry for IntellectualSource (a single node type). Structure ONLY — field
 * schema + a color token, matching principleTypes.js. Prose beyond the labels here comes
 * from the descriptor context.
 *
 * An intellectual source carries NO authority. That is the whole distinction from
 * Governance, and it is why this is its own tab rather than a governance type: nothing here
 * obliges a campus to do anything. It is read material a campus draws on when authoring an
 * implementation, or when an existing one turns out to be behind what the field knows.
 */

/** Provenance: where the source lives and what it says. */
export const PROVENANCE_FIELDS = [
    {
        name: 'url',
        label: 'URL',
        type: 'text',
        helpText: 'The canonical location. Leave empty for a synthesized source drawn from several places, and record those under Sources instead.',
    },
    {
        name: 'raw_text',
        label: 'Source Text (Markdown)',
        type: 'markdown',
        helpText: 'The full text of the source, so it is readable rather than just cited. For paywalled or SSO-walled sources, paste the content rather than summarising the abstract.',
    },
];

/** Attribution: a principle grounded in scholarship has to say whose. */
export const ATTRIBUTION_FIELDS = [
    { name: 'author', label: 'Author', type: 'text' },
    { name: 'publisher', label: 'Publisher', type: 'text' },
    {
        name: 'published_date',
        label: 'Published',
        type: 'date',
        helpText: "A source's age is what says whether the field has moved on.",
    },
    {
        name: 'citation',
        label: 'Citation',
        type: 'text',
        helpText: 'The full formal citation, where an author plus a publisher does not let a reader find the work again.',
    },
];

export const INTELLECTUAL_SOURCE_FIELDS = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'description_short', label: 'Short Description', type: 'textarea' },
    { name: 'description_full', label: 'Full Description', type: 'textarea' },
    ...ATTRIBUTION_FIELDS,
    ...PROVENANCE_FIELDS,
];

/** Every field the form patches, in form order. `name` is handled separately (required). */
export const EDITABLE_FIELD_NAMES = INTELLECTUAL_SOURCE_FIELDS
    .filter((f) => f.name !== 'name')
    .map((f) => f.name);

/**
 * Pink rather than the governance red or the principle cyan. The colour is the fastest
 * signal that a row on this tab carries no authority.
 */
export const INTELLECTUAL_SOURCE_COLOR = 'pink';
