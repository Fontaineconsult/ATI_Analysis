/**
 * Any Metric, in any of the shapes the app receives it, as one view model.
 *
 * MetricDisplay renders only the view model, so it never knows what a Pope
 * Tech snapshot or a survey result is. The view model comes from, in order:
 *
 *   1. a template for the metric's value_schema (metricTemplates.js)
 *   2. shape inference over the stored JSON, when no template exists
 *   3. single_value alone
 *
 * The record fields (description, comment, link, file) join the same model,
 * so a metric holding only a number and a link renders through the same path.
 */
import { MISSING, formatChange, formatValue, inferFormat } from './metricFormats';
import { METRIC_TEMPLATES, METRIC_VOCABS } from './metricTemplates';

// --------------------------------------------------------------------------- //
// Reading a metric from whichever payload it arrived in                         //
// --------------------------------------------------------------------------- //

/**
 * A stored value as a JS value, or null when it holds nothing.
 *
 * Mirrors Metric.decode_value in graph_schema.py. Reads that return raw node
 * properties hand over the stored JSON string, and older nodes were written
 * pre-encoded one layer deeper (often '""'). Strings are parsed until they stop
 * being JSON, at most three times.
 */
export function decodeMetricValue(value) {
    let data = value;
    for (let i = 0; i < 3; i += 1) {
        if (typeof data !== 'string') break;
        if (!data.trim()) return null;
        try {
            data = JSON.parse(data);
        } catch (e) {
            return data;
        }
    }
    return data === '' || data === undefined ? null : data;
}

const blank = (v) => v === null || v === undefined || v === '';

/**
 * The fields of a metric, from a documentation item ({data, ...}), an
 * implementation metric ({value_dict, ...}) or a raw node ({properties}).
 */
export function readMetric(input) {
    const m = input?.metric?.properties || input?.properties || input?.metric || input || {};
    const data = Object.prototype.hasOwnProperty.call(m, 'data')
        ? m.data
        : decodeMetricValue(m.value_dict);
    return {
        name: m.name || null,
        data: blank(data) ? null : data,
        schema: m.value_schema || null,
        singleValue: blank(m.single_value) ? null : m.single_value,
        // Raw node reads can carry a driver date object; only a string is usable.
        measuredOn: typeof m.measured_on === 'string' && m.measured_on ? m.measured_on.slice(0, 10) : null,
        description: m.description || null,
        comment: m.comment || null,
        uriPath: m.uri_path || null,
        filePath: m.file_path || null,
        file: m.file || null,
    };
}

// --------------------------------------------------------------------------- //
// Helpers                                                                     //
// --------------------------------------------------------------------------- //

export function getPath(obj, path) {
    if (!path) return undefined;
    return String(path).split('.').reduce(
        (acc, part) => (acc === null || acc === undefined ? undefined : acc[part]),
        obj,
    );
}

/** 'excl_contrast_per_page' -> 'Excl contrast per page'. */
export function humanize(key) {
    const text = String(key).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim();
    return text.charAt(0).toUpperCase() + text.slice(1);
}

const vocabLabel = (vocab, key) => METRIC_VOCABS[vocab]?.[key] || humanize(key);

const isScalar = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const numericString = (v) => typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v.replace(/,/g, '')));

/** 'improved', 'worsened' or null, from a delta and which way is better. */
function direction(delta, better) {
    const n = Number(delta);
    if (!better || !Number.isFinite(n) || n === 0) return null;
    const improved = better === 'lower' ? n < 0 : n > 0;
    return improved ? 'improved' : 'worsened';
}

// --------------------------------------------------------------------------- //
// Template -> view model                                                       //
// --------------------------------------------------------------------------- //

function figureFrom(spec, data) {
    const raw = getPath(data, spec.path);
    if (raw === undefined) return null;
    const format = spec.format || inferFormat(raw);
    const delta = spec.change ? getPath(data, spec.change) : undefined;
    return {
        label: spec.label,
        value: formatValue(raw, format),
        raw,
        change: delta === undefined ? null : formatChange(delta, format),
        direction: delta === undefined ? null : direction(delta, spec.better),
    };
}

function contextFrom(specs, data) {
    return (specs || [])
        .map((s) => {
            const raw = getPath(data, s.path);
            return raw === undefined || raw === null || raw === ''
                ? null : { label: s.label, value: formatValue(raw, s.format || 'text') };
        })
        .filter(Boolean);
}

function rowsOf(source) {
    if (Array.isArray(source)) return source.map((item, i) => ({ key: String(i), item }));
    if (isPlainObject(source)) return Object.entries(source).map(([key, item]) => ({ key, item }));
    return [];
}

function tableFrom(spec, data) {
    let rows = rowsOf(getPath(data, spec.rows));
    if (!rows.length) return null;

    if (spec.dropZero) {
        const kept = rows.filter(({ item }) => Number(getPath(item, spec.dropZero)) !== 0);
        // When every row is zero, keep them all so the table never reads as missing.
        if (kept.length) rows = kept;
    }
    if (spec.sort) {
        const sign = spec.sort.dir === 'asc' ? 1 : -1;
        rows = [...rows].sort((a, b) =>
            sign * ((Number(getPath(a.item, spec.sort.path)) || 0) - (Number(getPath(b.item, spec.sort.path)) || 0)));
    }

    const label = ({ key, item }) => {
        if (spec.rowLabel?.vocab) return vocabLabel(spec.rowLabel.vocab, key);
        if (spec.rowLabel?.path) return String(getPath(item, spec.rowLabel.path) ?? key);
        return humanize(key);
    };
    const cell = (column, item) => {
        const raw = getPath(item, column.path);
        if (column.vocab && !blank(raw)) return vocabLabel(column.vocab, raw);
        return formatValue(raw, column.format || inferFormat(raw));
    };

    // A column with no value in any row says nothing; leave it out.
    const columns = (spec.columns || []).filter((c) =>
        rows.some(({ item }) => !blank(getPath(item, c.path))));

    return {
        caption: spec.caption,
        columns: columns.map((c) => ({ label: c.label, numeric: c.format !== 'text' && !c.vocab })),
        rows: rows.map((r) => ({ key: r.key, label: label(r), cells: columns.map((c) => cell(c, r.item)) })),
    };
}

function sectionFrom(spec, data) {
    return {
        context: contextFrom(spec?.context, data),
        figures: (spec?.figures || []).map((f) => figureFrom(f, data)).filter(Boolean),
        tables: (spec?.tables || []).map((t) => tableFrom(t, data)).filter(Boolean),
    };
}

function fromTemplate(template, data) {
    const main = sectionFrom(template, data);
    return {
        kind: 'template',
        schemaLabel: template.label,
        headline: template.headline ? figureFrom(template.headline, data) : null,
        ...main,
        details: sectionFrom(template.details, data),
    };
}

// --------------------------------------------------------------------------- //
// Shape inference, for JSON with no template                                   //
// --------------------------------------------------------------------------- //

const MAX_FIGURES = 6;

/** A list of objects, or an object whose values are all objects, as a table. */
function inferTable(caption, source) {
    const rows = rowsOf(source).filter(({ item }) => isPlainObject(item));
    if (!rows.length) return null;
    const keys = [];
    rows.forEach(({ item }) => Object.entries(item).forEach(([k, v]) => {
        if (isScalar(v) && !keys.includes(k)) keys.push(k);
    }));
    if (!keys.length) return null;
    // A list keyed by position reads better labelled by its first text field.
    const labelKey = Array.isArray(source)
        ? keys.find((k) => rows.every(({ item }) => typeof item[k] === 'string')) : null;
    const columns = keys.filter((k) => k !== labelKey);
    return {
        caption,
        columns: columns.map((k) => ({ label: humanize(k), numeric: rows.some(({ item }) => typeof item[k] === 'number') })),
        rows: rows.map(({ key, item }) => ({
            key,
            label: labelKey ? String(item[labelKey]) : humanize(key),
            cells: columns.map((k) => formatValue(item[k], inferFormat(item[k]))),
        })),
    };
}

function inferFromObject(data) {
    const view = { context: [], figures: [], tables: [] };
    const overflow = { context: [], figures: [], tables: [] };

    const addScalar = (label, value) => {
        if (typeof value === 'number') {
            const target = view.figures.length < MAX_FIGURES ? view.figures : overflow.figures;
            target.push({ label, value: formatValue(value, inferFormat(value)), raw: value, change: null, direction: null });
        } else if (!blank(value)) {
            view.context.push({ label, value: formatValue(value, 'text') });
        }
    };

    Object.entries(data).forEach(([key, value]) => {
        const label = humanize(key);
        if (isScalar(value)) {
            addScalar(label, value);
        } else if (Array.isArray(value) && value.every(isScalar)) {
            view.context.push({ label, value: value.join(', ') || MISSING });
        } else {
            const table = inferTable(label, value);
            if (table) {
                view.tables.push(table);
            } else if (isPlainObject(value)) {
                // One level of nesting flattens into "Group: field"; deeper is raw JSON only.
                Object.entries(value).forEach(([k, v]) => {
                    if (isScalar(v)) addScalar(`${label}: ${humanize(k)}`, v);
                });
            }
        }
    });
    return { ...view, details: overflow };
}

function fromInference(data) {
    if (isScalar(data)) {
        return {
            kind: 'inferred',
            headline: { label: 'Value', value: formatValue(data, inferFormat(data)), raw: data, change: null, direction: null },
            context: [], figures: [], tables: [],
            details: { context: [], figures: [], tables: [] },
        };
    }
    if (Array.isArray(data)) {
        const table = inferTable('Values', data);
        return {
            kind: 'inferred',
            headline: null,
            context: table ? [] : [{ label: 'Values', value: data.map(String).join(', ') }],
            figures: [],
            tables: table ? [table] : [],
            details: { context: [], figures: [], tables: [] },
        };
    }
    return { kind: 'inferred', headline: null, ...inferFromObject(data) };
}

// --------------------------------------------------------------------------- //
// The view model                                                              //
// --------------------------------------------------------------------------- //

function singleValueHeadline(value) {
    const format = numericString(value) ? (String(value).includes('.') ? 'rate' : 'count') : 'text';
    return { label: 'Value', value: formatValue(value, format), raw: value, change: null, direction: null };
}

function linksFrom(record) {
    const links = [];
    if (record.uriPath) {
        links.push({ label: 'Link', href: /^https?:\/\//i.test(record.uriPath) ? record.uriPath : null, text: record.uriPath });
    }
    if (record.file?.download_url) {
        links.push({ label: 'File', href: record.file.download_url, text: record.file.original_filename || 'Download' });
    }
    if (record.filePath) links.push({ label: 'File path', href: null, text: record.filePath });
    return links;
}

/**
 * The view model for one metric.
 *
 * {
 *   kind          'template' | 'inferred' | 'single' | 'empty'
 *   name, schema, schemaLabel, measuredOn
 *   emptyMessage  set when the value says it holds no data
 *   headline      { label, value, change, direction } | null
 *   context       [{ label, value }]
 *   figures       [{ label, value, change, direction }]
 *   tables        [{ caption, columns: [{ label, numeric }], rows: [{ key, label, cells }] }]
 *   details       { context, figures, tables }   behind "More detail"
 *   raw           the decoded JSON, or null
 *   description, comment, links
 * }
 */
export function buildMetricView(input, templates = METRIC_TEMPLATES) {
    const record = readMetric(input);
    const base = {
        name: record.name,
        schema: record.schema,
        schemaLabel: null,
        measuredOn: record.measuredOn,
        emptyMessage: null,
        raw: record.data,
        description: record.description,
        comment: record.comment,
        links: linksFrom(record),
    };
    const empty = { headline: null, context: [], figures: [], tables: [], details: { context: [], figures: [], tables: [] } };

    const template = record.schema ? templates[record.schema] : null;

    if (template && record.data !== null && typeof record.data === 'object') {
        const when = template.emptyWhen;
        if (when && getPath(record.data, when.path) === when.equals) {
            return { ...base, ...empty, kind: 'empty', schemaLabel: template.label, emptyMessage: when.message };
        }
        const view = fromTemplate(template, record.data);
        if (!view.headline && record.singleValue !== null) view.headline = singleValueHeadline(record.singleValue);
        return { ...base, ...view };
    }

    if (record.data !== null) {
        const view = fromInference(record.data);
        if (!view.headline && record.singleValue !== null) view.headline = singleValueHeadline(record.singleValue);
        return { ...base, ...view };
    }

    if (record.singleValue !== null) {
        return { ...base, ...empty, kind: 'single', headline: singleValueHeadline(record.singleValue) };
    }

    return { ...base, ...empty, kind: 'empty' };
}

/** True when the details section has anything to show. */
export const hasDetails = (view) => Boolean(
    view.details.context.length || view.details.figures.length || view.details.tables.length || view.raw !== null,
);
