import {
    DOC_TYPES,
    DOC_TYPE_ORDER,
    DOC_GROUPS,
    DOC_GROUP_ORDER,
    DOC_FILTERS,
    DOC_FILTER_ORDER,
    DOC_SORT_ORDER,
    truthyFlag,
    isDeprecated,
    isDeprecationUnset,
    isDead,
    isDeadButInReport,
    isOrphan,
    isShared,
    isReportFlagUnset,
    looksLikeTestFixture,
    filterDocumentation,
    summarizeDocumentation,
    searchDocumentation,
    sortDocumentation,
    parentHref,
    relTypeLabel,
    describeIntegrityCode,
    ATTACHMENT_FAMILIES,
    ATTACHMENT_FAMILY_ORDER,
    ATTACHMENT_LABELS,
    familyForLabel,
    attachmentLabelText,
    filterByAttachment,
    summarizeAttachments,
} from './documentationConfig';

const doc = (over = {}) => ({
    doc_type: 'documents',
    unique_id: 'd1',
    title: 'A doc',
    name: 'A doc',
    include_in_report: true,
    include_in_report_set: true,
    depreciated: false,
    has_location: true,
    reference_count: 1,
    parent_count: 1,
    integrity: [],
    referenced_by: [],
    ...over,
});

describe('truthyFlag — the legacy string-boolean guard', () => {
    // The whole reason the read layer coerces in Cypher: neomodel's
    // BooleanProperty.inflate is bool(value), and bool('False') is True. If this
    // assertion ever fails, deprecated records start reading as live ones.
    it('treats the string "False" as false', () => {
        expect(truthyFlag('False')).toBe(false);
    });

    it('treats real and string truths as true', () => {
        expect(truthyFlag(true)).toBe(true);
        expect(truthyFlag('True')).toBe(true);
        expect(truthyFlag('true')).toBe(true);
    });

    it('treats null and undefined as false', () => {
        expect(truthyFlag(null)).toBe(false);
        expect(truthyFlag(undefined)).toBe(false);
    });
});

describe('deprecation is tri-state', () => {
    it('null means never assessed, which is not deprecated', () => {
        const d = doc({ depreciated: null });
        expect(isDeprecated(d)).toBe(false);
        expect(isDeprecationUnset(d)).toBe(true);
    });

    it('explicit false is assessed and not deprecated', () => {
        expect(isDeprecationUnset(doc({ depreciated: false }))).toBe(false);
    });

    it('a stored string "False" does not read as deprecated', () => {
        expect(isDeprecated(doc({ depreciated: 'False' }))).toBe(false);
    });
});

describe('isDead', () => {
    it('is true for a deprecated record', () => {
        expect(isDead(doc({ depreciated: true }))).toBe(true);
    });

    it('is true for a webpage that no longer exists', () => {
        expect(isDead(doc({ doc_type: 'webpages', no_longer_exists: true }))).toBe(true);
    });

    it('is true for an artifact with no location recorded', () => {
        expect(isDead(doc({ has_location: false }))).toBe(true);
    });

    it('is false for an annotation with no location — they never have one', () => {
        expect(isDead(doc({ doc_type: 'notes', has_location: false }))).toBe(false);
    });
});

describe('isDeadButInReport — the lead attention metric', () => {
    it('flags a dead record that a report still shows', () => {
        expect(isDeadButInReport(doc({ depreciated: true, include_in_report: true }))).toBe(true);
    });

    it('does not flag a dead record already hidden', () => {
        expect(isDeadButInReport(doc({ depreciated: true, include_in_report: false }))).toBe(false);
    });
});

describe('reference-derived predicates', () => {
    it('orphaned means nothing points at it', () => {
        expect(isOrphan(doc({ reference_count: 0 }))).toBe(true);
        expect(isOrphan(doc({ reference_count: 1 }))).toBe(false);
    });

    it('shared uses parent_count, not reference_count', () => {
        // A parent could hold the same node via two rel-types; the blast radius
        // is a count of records, not of edges.
        expect(isShared(doc({ reference_count: 2, parent_count: 1 }))).toBe(false);
        expect(isShared(doc({ reference_count: 2, parent_count: 2 }))).toBe(true);
    });

    it('distinguishes an unset report flag from an explicit false', () => {
        expect(isReportFlagUnset(doc({ include_in_report_set: false }))).toBe(true);
        expect(isReportFlagUnset(doc({ include_in_report: false, include_in_report_set: true }))).toBe(false);
    });
});

describe('looksLikeTestFixture', () => {
    it('matches the leaked meeting-minutes fixtures', () => {
        expect(looksLikeTestFixture(doc({ uri_path: 'https://example.edu/minutes.pdf' }))).toBe(true);
    });

    it('matches names beginning with "test"', () => {
        expect(looksLikeTestFixture(doc({ name: 'Test Document' }))).toBe(true);
    });

    it('does not match a real record', () => {
        expect(looksLikeTestFixture(doc({ name: 'Latest Guidance', uri_path: 'https://sfsu.edu/x' }))).toBe(false);
    });
});

describe('the stat strip and the list agree', () => {
    const items = [
        doc({ unique_id: 'a', depreciated: true }),
        doc({ unique_id: 'b', include_in_report: false }),
        doc({ unique_id: 'c', reference_count: 0, parent_count: 0 }),
        doc({ unique_id: 'd', parent_count: 4, reference_count: 4 }),
        doc({ unique_id: 'e', include_in_report_set: false }),
        doc({ unique_id: 'f', integrity: ['string_boolean:depreciated'] }),
        doc({ unique_id: 'g', uri_path: 'https://example.edu/minutes.pdf' }),
        doc({ unique_id: 'h', doc_type: 'notes', has_location: false }),
        doc({ unique_id: 'i', doc_type: 'metrics', has_location: false }),
    ];

    // The mechanical invariant. Every tile's number is produced by the same
    // predicate that produces the list behind it, so the two can never drift.
    it.each(DOC_FILTER_ORDER)('filter "%s" count matches the summary', (key) => {
        expect(filterDocumentation(items, key).length).toBe(summarizeDocumentation(items)[key]);
    });

    it('summary total equals the item count', () => {
        expect(summarizeDocumentation(items).total).toBe(items.length);
    });

    it('byType totals sum to the overall total', () => {
        const summary = summarizeDocumentation(items);
        const summed = Object.values(summary.byType).reduce((a, b) => a + b, 0);
        expect(summed).toBe(summary.total);
    });

    it('an unknown filter key falls back to all rather than throwing', () => {
        expect(filterDocumentation(items, 'nope').length).toBe(items.length);
    });
});

describe('searchDocumentation', () => {
    const items = [
        doc({ unique_id: 'a', title: 'Captioning guide' }),
        doc({ unique_id: 'b', title: 'Something else', referenced_by: [{ parent_title: 'Captioning Process' }] }),
        doc({ unique_id: 'c', title: 'Unrelated' }),
    ];

    it('matches the record’s own fields', () => {
        expect(searchDocumentation(items, 'captioning guide').map((i) => i.unique_id)).toEqual(['a']);
    });

    it('matches on parent titles too — reconciliation searches by what a record is attached to', () => {
        expect(searchDocumentation(items, 'captioning process').map((i) => i.unique_id)).toEqual(['b']);
    });

    it('returns everything for an empty query', () => {
        expect(searchDocumentation(items, '   ')).toHaveLength(3);
    });
});

describe('sortDocumentation', () => {
    it('clusters near-duplicates by locator, which is the reconciliation case', () => {
        const items = [
            doc({ unique_id: 'a', title: 'Zeta', uri_path: 'https://example.edu/minutes.pdf' }),
            doc({ unique_id: 'b', title: 'Alpha', uri_path: 'https://sfsu.edu/other' }),
            doc({ unique_id: 'c', title: 'Mu', uri_path: 'https://example.edu/minutes.pdf' }),
        ];
        expect(sortDocumentation(items, 'locator').map((i) => i.unique_id)).toEqual(['a', 'c', 'b']);
    });

    it('does not mutate the input array', () => {
        const items = [doc({ unique_id: 'b', title: 'B' }), doc({ unique_id: 'a', title: 'A' })];
        sortDocumentation(items, 'name');
        expect(items.map((i) => i.unique_id)).toEqual(['b', 'a']);
    });

    it('offers no date sort — stored dates are unreliable strings', () => {
        expect(DOC_SORT_ORDER).not.toContain('date');
    });
});

describe('parentHref', () => {
    it('links a parent type that has an explorer area', () => {
        expect(parentHref('sfsu', { parent_label: 'Process', parent_id: 'x1' }))
            .toBe('/sfsu/ati-explorer/implementations/x1');
    });

    it('returns null for a parent with no route, so the UI renders text not a dead link', () => {
        expect(parentHref('sfsu', { parent_label: 'YearSuccessEvidence', parent_id: 'y1' })).toBeNull();
    });

    it('returns null for an unknown label', () => {
        expect(parentHref('sfsu', { parent_label: 'Nonsense', parent_id: 'z' })).toBeNull();
    });
});

describe('vocabulary', () => {
    it('names every rel type the read layer can emit', () => {
        ['is_documented_by', 'is_sourced_from', 'has_note', 'has_message',
            'has_metric', 'admin_review_note', 'progress_documented_by'].forEach((rt) => {
            expect(relTypeLabel(rt)).not.toContain('_');
        });
    });

    it('falls back readably for an unknown rel type', () => {
        expect(relTypeLabel('some_new_edge')).toBe('some new edge');
    });

    it('explains an integrity code with its field', () => {
        expect(describeIntegrityCode('string_boolean:depreciated'))
            .toBe('Stored as text, not a boolean — depreciated');
    });
});

describe('type and group registries', () => {
    it('every type belongs to exactly one group', () => {
        const grouped = DOC_GROUP_ORDER.flatMap((g) => DOC_GROUPS[g].types);
        expect(grouped.sort()).toEqual([...DOC_TYPE_ORDER].sort());
    });

    it('Metric does not support deprecation — it has no such property', () => {
        expect(DOC_TYPES.metrics.supportsDepreciation).toBe(false);
    });

    it('every other type does', () => {
        DOC_TYPE_ORDER.filter((t) => t !== 'metrics').forEach((t) => {
            expect(DOC_TYPES[t].supportsDepreciation).toBe(true);
        });
    });

    it('every filter key has a matching entry in the order list', () => {
        expect(DOC_FILTER_ORDER.sort()).toEqual(Object.keys(DOC_FILTERS).sort());
    });
});

// --------------------------------------------------------------------------- //
// Attachment families                                                          //
// --------------------------------------------------------------------------- //

const attached = (id, labels, over = {}) => doc({
    unique_id: id,
    reference_labels: labels,
    reference_count: labels.length,
    parent_count: labels.length,
    ...over,
});

describe('attachment families', () => {
    it('claims every label exactly once', () => {
        const all = ATTACHMENT_FAMILY_ORDER.flatMap((k) => ATTACHMENT_FAMILIES[k].labels);
        expect(new Set(all).size).toBe(all.length);
        expect(all.sort()).toEqual([...ATTACHMENT_LABELS].sort());
    });

    /**
     * Mirrors tests/test_documentation_api.py::test_attachable_labels_match_the_frontend_families.
     * That test reads the labels off graph_schema; this one asserts the config
     * agrees. If a new node type gains a RelationshipTo a documentation class,
     * the Python side fails first and points here.
     */
    it('covers every label the schema allows to attach', () => {
        expect([...ATTACHMENT_LABELS].sort()).toEqual([
            'Accomplishment', 'Asset', 'CampusPlan', 'Case', 'Component',
            'Directive', 'ExternalPolicy', 'Guidance', 'Guideline', 'Interface',
            'InternalPolicy', 'Law', 'MeetingMinutes', 'Memo', 'Plan',
            'PositionDescription', 'Procedure', 'Process', 'ProgressUpdate', 'Project', 'Query',
            'Service', 'StatusLevel', 'SuccessIndicator', 'TAAP', 'Tool',
            'Tracking', 'WorkingGroupPlan', 'YearSuccessEvidence',
        ]);
    });

    it('routes the two policy labels to different families', () => {
        // The pair most likely to be conflated: an InternalPolicy is a campus
        // practice, an ExternalPolicy is an instrument imposed on it.
        expect(familyForLabel('InternalPolicy')).toBe('implementations');
        expect(familyForLabel('ExternalPolicy')).toBe('governance');
    });

    it('sends an unknown label to Other rather than dropping it', () => {
        expect(familyForLabel('SomeFutureNode')).toBe('other');
    });

    it('spaces Pascal labels for reading', () => {
        expect(attachmentLabelText('YearSuccessEvidence')).toBe('Year Evidence');
        expect(attachmentLabelText('MeetingMinutes')).toBe('Meeting Minutes');
        expect(attachmentLabelText('Law')).toBe('Law');
        expect(attachmentLabelText('TAAP')).toBe('TAAP');
    });
});

describe('filterByAttachment', () => {
    const items = [
        attached('a', ['Process']),
        attached('b', ['Law', 'Guidance']),
        attached('c', ['YearSuccessEvidence']),
        attached('d', []),
    ];

    it('is a no-op with nothing selected', () => {
        expect(filterByAttachment(items, [])).toHaveLength(4);
        expect(filterByAttachment(items, undefined)).toHaveLength(4);
    });

    it('ORs within the facet', () => {
        expect(filterByAttachment(items, ['Process', 'Law']).map((i) => i.unique_id))
            .toEqual(['a', 'b']);
    });

    it('matches a record on any one of its labels', () => {
        expect(filterByAttachment(items, ['Guidance']).map((i) => i.unique_id)).toEqual(['b']);
    });

    it('never matches an orphan', () => {
        const ids = filterByAttachment(items, ATTACHMENT_LABELS).map((i) => i.unique_id);
        expect(ids).not.toContain('d');
    });

    it('ignores a label nothing carries', () => {
        expect(filterByAttachment(items, ['Nonexistent'])).toEqual([]);
    });
});

describe('summarizeAttachments', () => {
    const items = [
        attached('a', ['Process', 'Service']),
        attached('b', ['Process']),
        attached('c', ['Law']),
        attached('d', ['SomeFutureNode']),
        attached('e', []),
    ];

    it('counts records, not edges, and only families with data', () => {
        const { families } = summarizeAttachments(items);
        const byKey = Object.fromEntries(families.map((f) => [f.key, f]));

        expect(Object.keys(byKey).sort()).toEqual(['governance', 'implementations', 'other']);
        expect(byKey.implementations.members.map((m) => [m.label, m.count]))
            .toEqual([['Process', 2], ['Service', 1]]);
    });

    it('deduplicates a record attached to two labels in one family', () => {
        // a carries both Process and Service: the member counts sum to 3, but
        // only two RECORDS are attached to an implementation.
        const { families } = summarizeAttachments(items);
        const impl = families.find((f) => f.key === 'implementations');
        expect(impl.members.reduce((n, m) => n + m.count, 0)).toBe(3);
        expect(impl.total).toBe(2);
    });

    it('surfaces an unmapped label under Other instead of losing it', () => {
        const other = summarizeAttachments(items).families.find((f) => f.key === 'other');
        expect(other.members.map((m) => m.label)).toEqual(['SomeFutureNode']);
    });

    it('returns nothing to render when everything is an orphan', () => {
        expect(summarizeAttachments([attached('x', [])]).families).toEqual([]);
        expect(summarizeAttachments([]).families).toEqual([]);
    });

    it('the facet total always matches what the filter would return', () => {
        const { families } = summarizeAttachments(items);
        families.forEach((family) => {
            const labels = family.members.map((m) => m.label);
            expect(filterByAttachment(items, labels)).toHaveLength(family.total);
        });
    });
});
