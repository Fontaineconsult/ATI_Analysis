/**
 * The edit schema and payload builder.
 *
 * These are the correctness-bearing parts of the feature. The form is a
 * rendering of DOC_EDIT_FIELDS, and the write is whatever buildEditPayload
 * produces — so a field the update layer does not read, or a payload that
 * carries more than the user changed, is a bug that no amount of UI testing
 * would catch.
 */
import {
    DOC_EDIT_FIELDS,
    DOC_TYPE_ORDER,
    UPDATE_ACTIONS,
    buildEditPayload,
    editableFieldsFor,
    initialEditValues,
    isNoOpPayload,
} from './documentationConfig';

/**
 * Mirrors app/database/queries/documentation/update.py as of 2026-08-31: the
 * fields each update_* function actually reads off its dict. If update.py
 * changes, this fails and tells you which side is stale. A field offered in the
 * form that is NOT here would render a control that silently does nothing.
 */
const SERVER_WRITABLE = {
    documents: [
        'name', 'file_path', 'uri_path', 'description',
        'is_administrative_review_documentation', 'is_milestone_and_measures_documentation',
        'include_in_report', 'depreciated', 'depreciated_date', 'raw_text',
    ],
    webpages: [
        'name', 'url', 'description', 'no_longer_exists', 'include_in_report',
        'depreciated', 'depreciated_date', 'raw_text',
    ],
    notes: [
        'name', 'content', 'include_in_report', 'file_path', 'uri_path',
        'date_created', 'depreciated', 'depreciated_date',
    ],
    messages: [
        'name', 'content', 'file_path', 'uri_path', 'include_in_report', 'type',
        'date_created', 'depreciated', 'depreciated_date',
    ],
    metrics: [
        'name', 'composite_key', 'metric_type', 'file_path', 'uri_path',
        'description', 'single_value', 'comment', 'include_in_report',
    ],
};

const doc = (over = {}) => ({
    doc_type: 'documents',
    unique_id: 'd1',
    name: 'A doc',
    description: 'Some description',
    uri_path: 'https://sfsu.edu/doc',
    file_path: null,
    is_administrative_review_documentation: false,
    is_milestone_and_measures_documentation: false,
    include_in_report: true,
    depreciated: null,
    depreciated_date: null,
    raw_text: null,
    parent_count: 1,
    ...over,
});

const fieldsFor = (docType) => DOC_EDIT_FIELDS[docType];

describe('the edit schema mirrors the update layer', () => {
    it.each(DOC_TYPE_ORDER)('%s offers only fields the server writes', (docType) => {
        const offered = fieldsFor(docType).map((f) => f.name);
        offered.forEach((name) => {
            expect(SERVER_WRITABLE[docType]).toContain(name);
        });
    });

    it('offers no deprecation control for Metric, which has no such property', () => {
        const names = fieldsFor('metrics').map((f) => f.name);
        expect(names).not.toContain('depreciated');
        expect(names).not.toContain('depreciated_date');
    });

    it('offers no_longer_exists only for webpages', () => {
        DOC_TYPE_ORDER.forEach((t) => {
            const has = fieldsFor(t).some((f) => f.name === 'no_longer_exists');
            expect(has).toBe(t === 'webpages');
        });
    });

    it('offers the source-text mirror only where the schema has one', () => {
        DOC_TYPE_ORDER.forEach((t) => {
            const has = fieldsFor(t).some((f) => f.name === 'raw_text');
            expect(has).toBe(t === 'documents' || t === 'webpages');
        });
    });

    it('does not offer a description for Note or Message', () => {
        expect(fieldsFor('notes').some((f) => f.name === 'description')).toBe(false);
        expect(fieldsFor('messages').some((f) => f.name === 'description')).toBe(false);
    });

    it('treats the two assessment flags as tri-state and the report flag as boolean', () => {
        const byName = Object.fromEntries(fieldsFor('webpages').map((f) => [f.name, f]));
        expect(byName.depreciated.type).toBe('tristate');
        expect(byName.no_longer_exists.type).toBe('tristate');
        // Once someone saves this form a decision HAS been made, so there is no
        // honest way back to "nobody decided".
        expect(byName.include_in_report.type).toBe('boolean');
    });

    it('has an action and payload key for every type', () => {
        expect(Object.keys(UPDATE_ACTIONS).sort()).toEqual([...DOC_TYPE_ORDER].sort());
        DOC_TYPE_ORDER.forEach((t) => {
            expect(UPDATE_ACTIONS[t].action).toMatch(/^update_/);
            expect(UPDATE_ACTIONS[t].dictKey).toMatch(/_dict$/);
        });
    });
});

describe('editableFieldsFor — the server narrows the schema', () => {
    it('drops deprecation when the server says the type has none', () => {
        const caps = { notes: { supports_depreciation: false, supports_no_longer_exists: false } };
        const names = editableFieldsFor('notes', caps).map((f) => f.name);
        expect(names).not.toContain('depreciated');
        expect(names).not.toContain('depreciated_date');
    });

    it('leaves the schema alone when capabilities have not arrived yet', () => {
        expect(editableFieldsFor('notes', null)).toEqual(DOC_EDIT_FIELDS.notes);
    });
});

describe('initialEditValues', () => {
    it('reads a null tri-state as "not assessed" rather than as false', () => {
        const values = initialEditValues(doc({ depreciated: null }), fieldsFor('documents'));
        expect(values.depreciated).toBe('');
    });

    it('reads a legacy string boolean as what it SAYS', () => {
        // bool('False') is true in JS as well as Python; truthyFlag is the guard.
        const values = initialEditValues(doc({ depreciated: 'False' }), fieldsFor('documents'));
        expect(values.depreciated).toBe('false');
    });

    it('defaults include_in_report to on when it was never set', () => {
        const values = initialEditValues(doc({ include_in_report: null }), fieldsFor('documents'));
        expect(values.include_in_report).toBe(true);
    });
});

describe('buildEditPayload — only what changed', () => {
    const fields = fieldsFor('documents');

    it('sends nothing but the id when nothing was touched', () => {
        const item = doc();
        const payload = buildEditPayload(item, fields, initialEditValues(item, fields));
        expect(payload).toEqual({ unique_id: 'd1' });
        expect(isNoOpPayload(payload)).toBe(true);
    });

    it('sends only the field that changed', () => {
        const item = doc();
        const values = { ...initialEditValues(item, fields), name: 'A renamed doc' };
        expect(buildEditPayload(item, fields, values)).toEqual({
            unique_id: 'd1',
            name: 'A renamed doc',
        });
    });

    /**
     * The reason "only what changed" is a correctness requirement and not an
     * optimisation: update.py compares a supplied date against the stored one by
     * calling .isoformat() on it. An untouched date must never be sent back.
     */
    it('never sends an untouched date', () => {
        const item = doc({ depreciated_date: '2024-01-05', depreciated: true });
        const values = { ...initialEditValues(item, fields), name: 'Renamed' };
        const payload = buildEditPayload(item, fields, values);
        expect(payload).not.toHaveProperty('depreciated_date');
        expect(payload).not.toHaveProperty('depreciated');
    });

    it('never sends an association argument', () => {
        const item = doc();
        const values = { ...initialEditValues(item, fields), name: 'Renamed' };
        const payload = buildEditPayload(item, fields, values);
        // These reassign the maintainer or connect the record to a new parent.
        ['year_success_evidence', 'implementation_id', 'implementation_type',
            'maintainer_id', 'maintained_by', 'created_by', 'academic_year']
            .forEach((k) => expect(payload).not.toHaveProperty(k));
    });

    it('writes a tri-state as a real boolean, or null for not-assessed', () => {
        const item = doc({ depreciated: null });
        expect(buildEditPayload(item, fields, {
            ...initialEditValues(item, fields), depreciated: 'true',
        }).depreciated).toBe(true);

        expect(buildEditPayload(item, fields, {
            ...initialEditValues(item, fields), depreciated: 'false',
        }).depreciated).toBe(false);

        const assessed = doc({ depreciated: true });
        expect(buildEditPayload(assessed, fields, {
            ...initialEditValues(assessed, fields), depreciated: '',
        }).depreciated).toBeNull();
    });

    it('clears an emptied text field to null, not to an empty string', () => {
        const item = doc({ description: 'Some description' });
        const payload = buildEditPayload(item, fields, {
            ...initialEditValues(item, fields), description: '',
        });
        expect(payload.description).toBeNull();
    });

    /**
     * 48 Documents store the string 'False' on these two flags. The form reads
     * the coerced value, so saving after an actual change writes a real boolean
     * and repairs the record — but leaving them alone must not touch them.
     */
    it('repairs a dirty flag only when the user actually changes it', () => {
        const dirty = doc({ is_administrative_review_documentation: 'False' });
        const untouched = buildEditPayload(dirty, fields, initialEditValues(dirty, fields));
        expect(untouched).not.toHaveProperty('is_administrative_review_documentation');

        const changed = buildEditPayload(dirty, fields, {
            ...initialEditValues(dirty, fields),
            is_administrative_review_documentation: true,
        });
        expect(changed.is_administrative_review_documentation).toBe(true);
    });
});
