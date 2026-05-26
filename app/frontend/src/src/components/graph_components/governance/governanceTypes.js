/**
 * Governance type metadata used by every governance UI piece (list filter,
 * type picker, form, detail panel, badge). One place to add a new type or
 * tweak field ordering. Backend keys live alongside frontend labels and
 * colors so a single import covers everything a component needs.
 *
 * Field schema:
 *   name      Backend property name (matches the neomodel attribute).
 *   label     Visible label.
 *   type      "text" | "textarea" | "date".
 *   required  Defaults to false.
 */
export const GOVERNANCE_TYPES = {
    law: {
        key: 'law',
        label: 'Law',
        plural: 'Laws',
        colorScheme: 'red',
        description: 'Enforceable rule established by legislative authority.',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'effective_date', label: 'Effective Date', type: 'date' },
            { name: 'last_updated', label: 'Last Updated', type: 'date' },
            { name: 'relevant_sections', label: 'Relevant Sections', type: 'text' },
            { name: 'legislative_authority', label: 'Legislative Authority', type: 'text' },
        ],
    },
    case: {
        key: 'case',
        label: 'Case',
        plural: 'Cases',
        colorScheme: 'purple',
        description: 'Legal decision interpreting accessibility law.',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'effective_date', label: 'Effective Date', type: 'date' },
            { name: 'ruling', label: 'Ruling', type: 'textarea' },
            { name: 'legislative_authority', label: 'Legislative Authority', type: 'text' },
        ],
    },
    directive: {
        key: 'directive',
        label: 'Directive',
        plural: 'Directives',
        colorScheme: 'orange',
        description: 'Official instruction guiding implementation.',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'effective_date', label: 'Effective Date', type: 'date' },
            { name: 'last_updated', label: 'Last Updated', type: 'date' },
            { name: 'source_institution', label: 'Source Institution', type: 'text' },
        ],
    },
    external_policy: {
        key: 'external_policy',
        label: 'External Policy',
        plural: 'External Policies',
        colorScheme: 'blue',
        description: 'External principles governing accessibility decisions.',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'effective_date', label: 'Effective Date', type: 'date' },
            { name: 'last_updated', label: 'Last Updated', type: 'date' },
        ],
    },
    memo: {
        key: 'memo',
        label: 'Memo',
        plural: 'Memos',
        colorScheme: 'yellow',
        description: 'Internal communication conveying decisions or updates.',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'authored_date', label: 'Authored Date', type: 'date' },
        ],
    },
    guideline: {
        key: 'guideline',
        label: 'Guideline',
        plural: 'Guidelines',
        colorScheme: 'teal',
        description: 'Recommended practices and standards (e.g. WCAG).',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'effective_date', label: 'Effective Date', type: 'date' },
            { name: 'last_updated', label: 'Last Updated', type: 'date' },
        ],
    },
};

export const GOVERNANCE_TYPE_ORDER = ['law', 'case', 'directive', 'external_policy', 'memo', 'guideline'];

export function getGovernanceTypeConfig(typeKey) {
    return GOVERNANCE_TYPES[typeKey] || null;
}

export function getGovernanceTypeLabel(typeKey) {
    return GOVERNANCE_TYPES[typeKey]?.label || typeKey;
}

export function getGovernanceTypeColorScheme(typeKey) {
    return GOVERNANCE_TYPES[typeKey]?.colorScheme || 'gray';
}
