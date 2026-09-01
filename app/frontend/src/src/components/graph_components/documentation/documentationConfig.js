/**
 * Documentation domain config — the single source of truth for the five
 * documentation node types, their two groups, the diagnostic filters, and the
 * vocabulary used to describe how a record is referenced.
 *
 * Mirrors the peopleConfig.js archetype: filters, their predicates and
 * summarize() live together, so the stat strip and the list it filters are
 * driven from one place and cannot disagree about a count.
 *
 * NOTE ON THIS FOLDER. It holds two generations. The files named Documentation*
 * (plus this config) are the new central Documentation area. Of the older
 * generation, exactly two entry points are still live and are deliberately left
 * alone: YSEAnnotationMasterContainer (mounted by SuccessIndicatorDetailPanel)
 * pulls in NoteViewer / MessageViewer / MetricViewer, and GovernanceDetailPanel
 * imports DocumentForm / WebsiteForm. The rest of that generation — the old
 * DocumentationMasterContainer plus the DocumentViewer and WebsiteViewer it was
 * the only importer of — was deleted 2026-08-31 once nothing reached it.
 */

import { TYPE_KEYS } from '../implementation/implementationConfig';
import { GOVERNANCE_TYPE_ORDER } from '../governance/governanceTypes';

// --------------------------------------------------------------------------- //
// Types and groups                                                            //
// --------------------------------------------------------------------------- //

/**
 * `supportsDepreciation` mirrors the schema, not a preference: Metric has no
 * `depreciated` property at all, and update_metric never writes one, so a
 * Deprecate control there would be a no-op that reports success. The server
 * sends the authoritative version of this in meta.type_capabilities; this copy
 * exists so the UI can render before that arrives.
 */
export const DOC_TYPES = {
    documents: {
        key: 'documents', label: 'Document', plural: 'Documents',
        group: 'artifacts', colorScheme: 'blue', supportsDepreciation: true,
    },
    webpages: {
        key: 'webpages', label: 'Webpage', plural: 'Webpages',
        group: 'artifacts', colorScheme: 'teal', supportsDepreciation: true,
    },
    notes: {
        key: 'notes', label: 'Note', plural: 'Notes',
        group: 'annotations', colorScheme: 'purple', supportsDepreciation: true,
    },
    messages: {
        key: 'messages', label: 'Message', plural: 'Messages',
        group: 'annotations', colorScheme: 'orange', supportsDepreciation: true,
    },
    /**
     * Metric is an INCOMPLETE CONCEPT in the ontology, not merely a rare type.
     * Five nodes exist, none has include_in_report true, there is no
     * `depreciated` property, and update_metric writes no flags. Treat thin or
     * odd-looking Metric data as unfinished modelling rather than as records
     * needing reconciliation, and do not build affordances that imply otherwise.
     */
    metrics: {
        key: 'metrics', label: 'Metric', plural: 'Metrics',
        group: 'annotations', colorScheme: 'gray', supportsDepreciation: false,
        incompleteConcept: true,
    },
};

export const DOC_TYPE_ORDER = ['documents', 'webpages', 'notes', 'messages', 'metrics'];

/**
 * The split is behavioural, not cosmetic. Artifacts have a location and rot
 * independently of the graph — a URL 404s whether or not anything changed here.
 * Annotations have no location; what matters for them is whether the report can
 * see them and how many records they are attached to.
 */
export const DOC_GROUPS = {
    artifacts: {
        key: 'artifacts',
        label: 'Artifacts',
        types: ['documents', 'webpages'],
        blurb: 'Records with a location of their own, which can rot independently of the graph.',
    },
    annotations: {
        key: 'annotations',
        label: 'Annotations',
        types: ['notes', 'messages', 'metrics'],
        blurb: 'Records attached to a parent, with no location of their own.',
    },
};

export const DOC_GROUP_ORDER = ['artifacts', 'annotations'];

export const getTypeConfig = (docType) => DOC_TYPES[docType] || null;
export const getTypeLabel = (docType) => DOC_TYPES[docType]?.label || docType;
export const getTypeColor = (docType) => DOC_TYPES[docType]?.colorScheme || 'gray';
export const getGroupForType = (docType) => DOC_TYPES[docType]?.group || null;
export const typesInGroup = (groupKey) => DOC_GROUPS[groupKey]?.types || [];

// --------------------------------------------------------------------------- //
// Predicates                                                                  //
// --------------------------------------------------------------------------- //

/**
 * Coerce a possibly-legacy flag to a real boolean.
 *
 * The server already coerces these in Cypher, which is the only layer that can
 * still tell the string 'False' from the boolean False — neomodel's
 * BooleanProperty.inflate is bool(value), and bool('False') is True. This is a
 * second line of defence for any payload that did not come through the new
 * projection.
 */
export const truthyFlag = (v) => v === true || v === 'True' || v === 'true' || v === 1;

export const inReport = (i) => i?.include_in_report !== false;
export const isHidden = (i) => i?.include_in_report === false;
export const isReportFlagUnset = (i) => i?.include_in_report_set === false;
export const isOrphan = (i) => (i?.reference_count || 0) === 0;
export const isShared = (i) => (i?.parent_count || 0) > 1;
export const hasIntegrityIssue = (i) => Boolean(i?.integrity?.length);

/** Deprecation is tri-state: null means never assessed, which is not "false". */
export const isDeprecated = (i) => truthyFlag(i?.depreciated);
export const isDeprecationUnset = (i) =>
    Object.prototype.hasOwnProperty.call(i || {}, 'depreciated') && i.depreciated === null;

/**
 * Dead mirrors app/public_reports/sanitize.py: a document is dead when
 * deprecated, a webpage when deprecated or gone. An artifact with no location
 * recorded is dead too — nothing can reach it.
 *
 * DELIBERATELY WIDER THAN THE SERVER'S `dead`. read.py keeps its flag in exact
 * parity with sanitize.py, because that one answers "would the published report
 * drop this?". This one answers "can a reader get to it?", and an artifact with
 * no URL, path or file fails that regardless of any flag. Do not "reconcile"
 * them by making read.py match this — that would silently change what the
 * public report sanitizer is understood to do.
 */
export const isDead = (i) =>
    isDeprecated(i)
    || truthyFlag(i?.no_longer_exists)
    || (getGroupForType(i?.doc_type) === 'artifacts' && i?.has_location === false);

/** The one number that is unambiguously wrong: a dead record inside a live report. */
export const isDeadButInReport = (i) => inReport(i) && isDead(i);

/**
 * Curation heuristic, NOT graph truth. 45 Documents named "Minutes PDF" point at
 * https://example.edu/minutes.pdf — meeting-minutes fixtures that leaked into
 * live data — plus a couple named "Test Document". This lives in config rather
 * than in Cypher precisely because the rule should change as records are cleaned
 * up, and it must never drive anything destructive.
 */
export const looksLikeTestFixture = (i) =>
    /example\.(edu|com|org|net)/i.test(i?.url || i?.uri_path || i?.file_path || '')
    || /^test\b/i.test(i?.name || '');

// --------------------------------------------------------------------------- //
// Filters — keys here must match summarizeDocumentation() keys exactly         //
// --------------------------------------------------------------------------- //

export const DOC_FILTERS = {
    all: { key: 'all', label: 'All documentation', predicate: () => true },
    deadButInReport: {
        key: 'deadButInReport', label: 'Dead but in report', predicate: isDeadButInReport,
    },
    orphaned: { key: 'orphaned', label: 'Orphans', predicate: isOrphan },
    shared: { key: 'shared', label: 'Shared', predicate: isShared },
    hidden: { key: 'hidden', label: 'Hidden from report', predicate: isHidden },
    reportFlagUnset: {
        key: 'reportFlagUnset', label: 'Report flag never set', predicate: isReportFlagUnset,
    },
    integrity: {
        key: 'integrity', label: 'Data integrity issues', predicate: hasIntegrityIssue,
    },
    fixtures: {
        key: 'fixtures', label: 'Looks like test data', predicate: looksLikeTestFixture,
    },
};

export const DOC_FILTER_ORDER = [
    'all', 'deadButInReport', 'orphaned', 'shared',
    'hidden', 'reportFlagUnset', 'integrity', 'fixtures',
];

export function filterDocumentation(items, filterKey) {
    const filter = DOC_FILTERS[filterKey] || DOC_FILTERS.all;
    return (items || []).filter(filter.predicate);
}

/**
 * Counts for every filter, computed over the same array the list renders.
 * documentationConfig.test.js asserts mechanically that
 * filterDocumentation(items, k).length === summarizeDocumentation(items)[k]
 * for every k — "the stat strip and the list agree" as a property, not a hope.
 */
export function summarizeDocumentation(items) {
    const list = items || [];
    const summary = { total: list.length, byType: {} };
    DOC_TYPE_ORDER.forEach((t) => { summary.byType[t] = 0; });
    DOC_FILTER_ORDER.forEach((k) => { summary[k] = 0; });

    list.forEach((item) => {
        if (item?.doc_type in summary.byType) summary.byType[item.doc_type] += 1;
        DOC_FILTER_ORDER.forEach((k) => {
            if (DOC_FILTERS[k].predicate(item)) summary[k] += 1;
        });
    });
    return summary;
}

// --------------------------------------------------------------------------- //
// Search                                                                      //
// --------------------------------------------------------------------------- //

/**
 * Searches parent titles as well as the record's own fields, because the primary
 * use is reconciliation: "what do we already hold about X" is usually answered by
 * the thing a record is attached to, not by its own name.
 */
export function searchDocumentation(items, query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return items || [];
    return (items || []).filter((i) => {
        const parents = (i.referenced_by || []).map((r) => r.parent_title || '').join(' ');
        return [
            i.title, i.name, i.url, i.uri_path, i.file_path,
            i.description, i.content_preview, i.composite_key, parents,
        ].join(' ').toLowerCase().includes(q);
    });
}

// --------------------------------------------------------------------------- //
// Sorting — reconciliation clusters near-duplicates, so name and locator win    //
// --------------------------------------------------------------------------- //

const locatorOf = (i) => i.url || i.uri_path || i.file_path || '';

/**
 * No date option, deliberately. 476 of 540 Note.date_created values are stored
 * as strings rather than dates, so any ordering by date would be quietly wrong —
 * worse than offering none.
 */
export const DOC_SORTS = {
    name: {
        key: 'name', label: 'Name (A–Z)',
        compare: (a, b) => String(a.title || '').localeCompare(String(b.title || '')),
    },
    locator: {
        key: 'locator', label: 'Location',
        compare: (a, b) => locatorOf(a).localeCompare(locatorOf(b)),
    },
    references: {
        key: 'references', label: 'Most referenced',
        compare: (a, b) => (b.reference_count || 0) - (a.reference_count || 0),
    },
    type: {
        key: 'type', label: 'Type',
        compare: (a, b) =>
            DOC_TYPE_ORDER.indexOf(a.doc_type) - DOC_TYPE_ORDER.indexOf(b.doc_type)
            || String(a.title || '').localeCompare(String(b.title || '')),
    },
};

export const DOC_SORT_ORDER = ['name', 'locator', 'references', 'type'];

export function sortDocumentation(items, sortKey) {
    const sort = DOC_SORTS[sortKey] || DOC_SORTS.name;
    return [...(items || [])].sort(sort.compare);
}

// --------------------------------------------------------------------------- //
// Reference vocabulary — what makes the "pivot from a parent" job readable      //
// --------------------------------------------------------------------------- //

export const REL_TYPE_LABELS = {
    is_documented_by: 'Documents',
    is_sourced_from: 'Source for',
    has_note: 'Note on',
    has_message: 'Message on',
    has_metric: 'Metric for',
    admin_review_note: 'Admin review note on',
    progress_documented_by: 'Progress update on',
    has_presidents_report: "President's report for",
    describes_asset: 'Describes asset',
    describes_interface: 'Describes interface',
    describes_component: 'Describes component',
    describes_tool: 'Describes tool',
};

export const relTypeLabel = (relType) =>
    REL_TYPE_LABELS[relType] || String(relType || '').replace(/_/g, ' ');

/**
 * Parent label -> explorer area. null means no route exists for that type, in
 * which case the reference renders as plain text rather than a link that 404s.
 */
export const PARENT_ROUTES = {
    Process: 'implementations', Procedure: 'implementations', Service: 'implementations',
    Guidance: 'implementations', Project: 'implementations', InternalPolicy: 'implementations',
    Tracking: 'implementations', TAAP: 'assets',
    Law: 'governance', Case: 'governance', Directive: 'governance',
    ExternalPolicy: 'governance', Memo: 'governance', Guideline: 'governance',
    Asset: 'assets', Interface: 'assets', Component: 'assets', Tool: 'assets',
    SuccessIndicator: 'indicators',
    YearSuccessEvidence: null, MeetingMinutes: null, CampusPlan: null,
    Plan: null, ProgressUpdate: null, Query: null, StatusLevel: null,
    Accomplishment: null, WorkingGroupPlan: null,
};

export function parentHref(campus, reference) {
    const area = PARENT_ROUTES[reference?.parent_label];
    if (!area || !campus || !reference?.parent_id) return null;
    return `/${campus}/ati-explorer/${area}/${encodeURIComponent(reference.parent_id)}`;
}

// --------------------------------------------------------------------------- //
// Attachment families — "what is this documenting?"                            //
// --------------------------------------------------------------------------- //

/**
 * The question this answers is the one the type chips cannot: not "what KIND of
 * record is this" but "what is it attached to". A Note and a Document are
 * different types and identical in purpose when both hang off the same Guidance
 * page; two Documents are the same type and unrelated when one documents a Law
 * and the other a Service.
 *
 * The 28 labels below are exhaustive against the schema: they are every label
 * that declares a RelationshipTo one of the five documentation classes (verified
 * by introspecting graph_schema, not by reading the graph — a family must not
 * disappear because today's data happens to be empty). StoredFile is excluded on
 * purpose: `has_file` points FROM a document, so it is a location, not a parent.
 *
 * Implementation and governance members are imported from their own configs
 * rather than retyped, so adding a type there flows through to this filter.
 * Governance keys are snake_case while the node label is Pascal — the one
 * conversion is done here, once.
 */

const pascal = (key) => String(key).split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export const ATTACHMENT_FAMILIES = {
    implementations: {
        key: 'implementations',
        label: 'Implementations',
        colorScheme: 'teal',
        blurb: 'The practices themselves — what the campus does.',
        labels: TYPE_KEYS,
    },
    governance: {
        key: 'governance',
        label: 'Governance',
        colorScheme: 'red',
        blurb: 'The instruments that require the work.',
        labels: GOVERNANCE_TYPE_ORDER.map(pascal),
    },
    evidence: {
        key: 'evidence',
        label: 'Evidence',
        colorScheme: 'blue',
        blurb: 'Year evidence, indicators and the status bar they are graded against.',
        labels: ['YearSuccessEvidence', 'SuccessIndicator', 'StatusLevel'],
    },
    planning: {
        key: 'planning',
        label: 'Plans & minutes',
        colorScheme: 'purple',
        blurb: 'What was planned, reported and met about.',
        labels: ['CampusPlan', 'WorkingGroupPlan', 'Plan', 'ProgressUpdate',
                 'Accomplishment', 'MeetingMinutes'],
    },
    assets: {
        key: 'assets',
        label: 'Assets',
        colorScheme: 'orange',
        blurb: 'The things being made accessible.',
        labels: ['Asset', 'Interface', 'Component', 'Tool', 'TAAP'],
    },
    inquiry: {
        key: 'inquiry',
        label: 'Open questions',
        colorScheme: 'gray',
        blurb: 'Questions still being settled.',
        labels: ['Query'],
    },
};

export const ATTACHMENT_FAMILY_ORDER = [
    'implementations', 'governance', 'evidence', 'planning', 'assets', 'inquiry',
];

/** Anything the families don't claim still has to be selectable, never dropped. */
export const OTHER_FAMILY = {
    key: 'other',
    label: 'Other',
    colorScheme: 'gray',
    blurb: 'Parent types with no family of their own yet.',
    labels: [],
};

const LABEL_TO_FAMILY = ATTACHMENT_FAMILY_ORDER.reduce((map, key) => {
    ATTACHMENT_FAMILIES[key].labels.forEach((label) => { map[label] = key; });
    return map;
}, {});

export const familyForLabel = (parentLabel) => LABEL_TO_FAMILY[parentLabel] || 'other';

export const ATTACHMENT_LABELS = Object.keys(LABEL_TO_FAMILY);

/** Node labels are Pascal; only a few need spacing to read as English. */
const LABEL_OVERRIDES = {
    InternalPolicy: 'Internal Policy',
    ExternalPolicy: 'External Policy',
    YearSuccessEvidence: 'Year Evidence',
    SuccessIndicator: 'Success Indicator',
    StatusLevel: 'Status Level',
    CampusPlan: 'Campus Plan',
    WorkingGroupPlan: 'Working Group Plan',
    ProgressUpdate: 'Progress Update',
    MeetingMinutes: 'Meeting Minutes',
    TAAP: 'TAAP',
};

export const attachmentLabelText = (parentLabel) =>
    LABEL_OVERRIDES[parentLabel] || String(parentLabel || '').replace(/([a-z])([A-Z])/g, '$1 $2');

/**
 * OR within the facet, AND with every other filter — the standard contract, and
 * the one that makes "Implementations + Governance" mean "attached to either",
 * which is what selecting two families looks like it should do.
 *
 * Matches on `reference_labels` (distinct parent labels, derived server-side),
 * so a record attached to the same label twice is not counted twice and an
 * orphan matches nothing.
 */
export function filterByAttachment(items, parentLabels) {
    const wanted = new Set(parentLabels || []);
    if (!wanted.size) return items || [];
    return (items || []).filter((i) =>
        (i.reference_labels || []).some((l) => wanted.has(l)));
}

/**
 * Facet counts, in RECORDS not edges — 1647 YSE edges across 504 notes would
 * otherwise put a number on the chip that no possible list can match.
 *
 * Counted over the items passed in (the current group, after the diagnostic
 * filter) but deliberately BEFORE the attachment selection itself, so a chip
 * always says how many records selecting it would add rather than collapsing to
 * zero the moment something else is picked.
 *
 * Only families with a non-zero count are returned: the empty ones are real
 * schema families, but a row of zeroes is noise in a 420px column.
 */
export function summarizeAttachments(items) {
    const counts = {};
    (items || []).forEach((item) => {
        (item.reference_labels || []).forEach((label) => {
            counts[label] = (counts[label] || 0) + 1;
        });
    });

    const families = [...ATTACHMENT_FAMILY_ORDER, 'other'].map((key) => {
        const config = key === 'other' ? OTHER_FAMILY : ATTACHMENT_FAMILIES[key];
        const known = key === 'other'
            ? Object.keys(counts).filter((l) => familyForLabel(l) === 'other').sort()
            : config.labels;
        const members = known
            .filter((label) => counts[label])
            .map((label) => ({ label, text: attachmentLabelText(label), count: counts[label] }));
        return {
            ...config,
            members,
            // Records, deduplicated across the family's labels, are counted
            // below — summing member counts would double-count a Document
            // attached to both a Process and a Service.
            total: (items || []).filter((i) => (i.reference_labels || [])
                .some((l) => known.includes(l))).length,
        };
    }).filter((f) => f.members.length);

    return { counts, families };
}

// --------------------------------------------------------------------------- //
// Integrity codes                                                             //
// --------------------------------------------------------------------------- //

/**
 * Server-emitted codes are `family:field`. These render as chips so a defective
 * record announces itself instead of being silently normalised.
 */
export const INTEGRITY_LABELS = {
    string_boolean: 'Stored as text, not a boolean',
    unparseable_date: 'Unreadable date',
    depreciated_date_without_flag: 'Has a deprecation date but is not deprecated',
    missing_title: 'No name or URL',
};

export function describeIntegrityCode(code) {
    const [family, field] = String(code || '').split(':');
    const label = INTEGRITY_LABELS[family] || family;
    return field ? `${label} — ${field}` : label;
}
