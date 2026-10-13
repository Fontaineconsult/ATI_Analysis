/**
 * Metric templates: how a stored JSON shape maps onto the metric view model.
 *
 * Keyed by Metric.value_schema. A template is plain data: paths into the
 * stored JSON, labels, and format names from metricFormats.js. It holds no
 * components and no functions. Adding a new kind of metric is adding an entry
 * here, never a new display component. A schema with no entry still renders,
 * by shape inference (see metricViewModel.js).
 *
 * Template shape (every key optional except label):
 *   label      What this kind of metric is, e.g. 'Pope Tech scan snapshot'.
 *   emptyWhen  { path, equals, message }  The value holds no data; show message.
 *   context    [{ label, path, format }]  Small facts about the value (who, where).
 *   headline   { label, path, format, change, better }  The one number to read first.
 *   figures    [{ label, path, format, change, better }]  Supporting numbers.
 *   tables     [{ caption, rows, rowLabel, columns, sort, dropZero }]
 *   details    { context, figures, tables }  Shown behind "More detail".
 *
 * Paths are dot paths into the JSON ('errors.categories.contrast.count').
 * `change` is the path of a delta for the same figure. `better` ('lower' or
 * 'higher') says which direction is an improvement.
 *
 * A table's `rows` path may hold a list of objects or an object of objects
 * (the keys become rows). `rowLabel` is { path } for a field on the row, or
 * { vocab } to label object keys from METRIC_VOCABS. Columns are
 * { label, path, format, vocab }. `sort` is { path, dir: 'desc'|'asc' }, and
 * `dropZero` is a path whose zero value hides the row.
 */

/** Label sets templates can refer to by name. Unknown keys are humanised. */
export const METRIC_VOCABS = {
    // PopeTechIntegrator wave_categories.py, category_map_version 1.
    wave_categories: {
        contrast: 'Contrast',
        linked_documents: 'Links to inaccessible documents',
        images: 'Images',
        links_buttons: 'Links and buttons',
        page_structure: 'Page structure',
        forms: 'Forms',
        aria: 'ARIA',
        media: 'Media',
        other: 'Other',
    },
};

export const METRIC_TEMPLATES = {
    'popetech-metric-snapshot/1': {
        label: 'Pope Tech scan snapshot',
        emptyWhen: {
            path: 'has_data',
            equals: false,
            message: 'Pope Tech holds no scan data for this date.',
        },
        context: [
            { label: 'Organization', path: 'org.name' },
        ],
        // Per page, because page counts move between scans: a raw count can
        // fall when sites leave the scan, with nothing fixed.
        headline: {
            label: 'Errors per page, excluding contrast',
            path: 'errors.excl_contrast_per_page',
            format: 'rate',
            better: 'lower',
        },
        figures: [
            { label: 'Errors, excluding contrast', path: 'errors.excl_contrast', format: 'count', better: 'lower' },
            { label: 'Contrast errors', path: 'errors.categories.contrast.count', format: 'count', better: 'lower' },
            { label: 'Pages scanned', path: 'coverage.pages', format: 'count', change: 'coverage.pages_delta' },
        ],
        tables: [
            {
                caption: 'Errors by category',
                rows: 'errors.categories',
                rowLabel: { vocab: 'wave_categories' },
                columns: [{ label: 'Errors', path: 'count', format: 'count' }],
                sort: { path: 'count', dir: 'desc' },
                dropZero: 'count',
            },
        ],
        details: {
            figures: [
                { label: 'Errors, including contrast', path: 'errors.incl_contrast', format: 'count' },
                { label: 'Alerts', path: 'alerts.total', format: 'count' },
                { label: 'Alerts per page', path: 'alerts.per_page', format: 'rate' },
            ],
            tables: [
                {
                    caption: 'Errors by type',
                    rows: 'errors.types',
                    rowLabel: { path: 'name' },
                    columns: [
                        { label: 'Category', path: 'category', vocab: 'wave_categories' },
                        { label: 'Errors', path: 'count', format: 'count' },
                        { label: 'Pages', path: 'pages', format: 'count' },
                    ],
                    sort: { path: 'count', dir: 'desc' },
                },
            ],
            context: [
                { label: 'Retrieved', path: 'source.retrieved_at', format: 'date' },
                { label: 'Source', path: 'source.endpoint' },
            ],
        },
    },
};

export const templateFor = (schema) => (schema && METRIC_TEMPLATES[schema]) || null;
