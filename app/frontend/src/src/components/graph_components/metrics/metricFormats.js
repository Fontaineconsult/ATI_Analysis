/**
 * The fixed set of value formats a metric template may name.
 *
 * Templates pick a format by name and never supply formatting code, so every
 * metric across the app writes a count, a rate or a date the same way.
 */

export const MISSING = '–';

const isBlank = (v) => v === null || v === undefined || v === '';

const toNumber = (v) => {
    if (typeof v === 'number') return v;
    // Pope Tech and other sources send counts as "1,112".
    const n = Number(String(v).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
};

export const METRIC_FORMATS = {
    /** Whole numbers with separators: 65429 -> "65,429". */
    count: (v) => {
        const n = toNumber(v);
        return n === null ? String(v) : Math.round(n).toLocaleString('en-US');
    },
    /** A ratio such as errors per page, to two places: 0.5086 -> "0.51". */
    rate: (v) => {
        const n = toNumber(v);
        return n === null ? String(v) : n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    },
    /** A number already on a 0-100 scale: 42.31 -> "42.3%". */
    percent: (v) => {
        const n = toNumber(v);
        return n === null ? String(v) : `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`;
    },
    /** An ISO date or timestamp, shown as its date: "2026-10-12T19:28:02Z" -> "2026-10-12". */
    date: (v) => String(v).slice(0, 10),
    text: (v) => String(v),
};

export const FORMAT_NAMES = Object.keys(METRIC_FORMATS);

/** A value in a named format. Unknown formats fall back to text. */
export function formatValue(value, format = 'text') {
    if (isBlank(value)) return MISSING;
    const fn = METRIC_FORMATS[format] || METRIC_FORMATS.text;
    return fn(value);
}

/** A change in the same format, signed: 254 -> "+254", -2294 -> "-2,294". */
export function formatChange(value, format = 'count') {
    if (isBlank(value)) return null;
    const n = toNumber(value);
    if (n === null || n === 0) return n === 0 ? 'no change' : null;
    const body = formatValue(Math.abs(n), format);
    return `${n > 0 ? '+' : '-'}${body}`;
}

/** Best guess at a format for a value with no template: numbers are counts or rates. */
export function inferFormat(value) {
    const n = typeof value === 'number' ? value : null;
    if (n === null) return 'text';
    return Number.isInteger(n) ? 'count' : 'rate';
}
