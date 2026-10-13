import { formatChange, formatValue } from './metricFormats';
import { METRIC_TEMPLATES } from './metricTemplates';
import { buildMetricView, decodeMetricValue, getPath, humanize, readMetric } from './metricViewModel';

const SNAPSHOT = {
    schema: 'popetech-metric-snapshot/1',
    org: { slug: 'sfsu', campus: 'sfsu', name: 'San Francisco State University' },
    as_of: '2026-10-12',
    has_data: true,
    source: { endpoint: '/organizations/sfsu/reports/aggregates', retrieved_at: '2026-10-12T19:28:02Z' },
    coverage: { pages: 21960, pages_delta: -2294 },
    errors: {
        incl_contrast: 66049,
        excl_contrast: 11168,
        excl_contrast_per_page: 0.5086,
        categories: {
            contrast: { count: 54881, pages: 14207 },
            linked_documents: { count: 4376, pages: null },
            page_structure: { count: 5124, pages: null },
            other: { count: 0, pages: null },
        },
        types: [
            { key: 'empty_heading', name: 'Empty heading', category: 'page_structure', count: 4908, pages: 1950 },
            { key: 'very_low_contrast', name: 'Very low contrast', category: 'contrast', count: 54881, pages: 14207 },
        ],
    },
    alerts: { total: 398576, per_page: 18.1501 },
};

describe('formats', () => {
    it.each([
        [65429, 'count', '65,429'],
        ['1,112', 'count', '1,112'],
        [0.5086, 'rate', '0.51'],
        [42.31, 'percent', '42.3%'],
        ['2026-10-12T19:28:02Z', 'date', '2026-10-12'],
        [null, 'count', '–'],
        ['x', 'nonsense', 'x'],
    ])('formatValue(%p, %p) is %p', (value, format, expected) => {
        expect(formatValue(value, format)).toBe(expected);
    });

    it('signs changes', () => {
        expect(formatChange(254)).toBe('+254');
        expect(formatChange(-2294)).toBe('-2,294');
        expect(formatChange(0)).toBe('no change');
        expect(formatChange(null)).toBeNull();
    });
});

describe('reading a metric from any payload', () => {
    it.each([
        ['{"a": 1}', { a: 1 }],
        ['"{\\"a\\": 1}"', { a: 1 }],
        ['"\\"\\""', null],
        ['', null],
        [null, null],
        [{ a: 1 }, { a: 1 }],
        ['not json', 'not json'],
    ])('decodes %p', (raw, expected) => {
        expect(decodeMetricValue(raw)).toEqual(expected);
    });

    it('reads a documentation item, an implementation metric and a raw node alike', () => {
        const doc = readMetric({ data: { a: 1 }, value_schema: 's/1', measured_on: '2026-10-12' });
        const impl = readMetric({ value_dict: '{"a": 1}', value_schema: 's/1', measured_on: '2026-10-12' });
        const node = readMetric({ metric: { properties: { value_dict: '{"a": 1}', value_schema: 's/1' } } });
        expect(doc.data).toEqual({ a: 1 });
        expect(impl.data).toEqual({ a: 1 });
        expect(node.data).toEqual({ a: 1 });
        expect(doc.measuredOn).toBe('2026-10-12');
        expect(node.measuredOn).toBeNull();
    });

    it('ignores a measured date that is not a string', () => {
        expect(readMetric({ measured_on: { year: 2026 } }).measuredOn).toBeNull();
    });

    it('walks paths and humanises keys', () => {
        expect(getPath(SNAPSHOT, 'errors.categories.contrast.count')).toBe(54881);
        expect(getPath(SNAPSHOT, 'errors.nope.count')).toBeUndefined();
        expect(humanize('excl_contrast_per_page')).toBe('Excl contrast per page');
    });
});

describe('template path', () => {
    const view = buildMetricView({ name: 'Pope Tech', data: SNAPSHOT, value_schema: 'popetech-metric-snapshot/1' });

    it('leads with errors per page', () => {
        expect(view.kind).toBe('template');
        expect(view.schemaLabel).toBe('Pope Tech scan snapshot');
        expect(view.headline).toMatchObject({ label: 'Errors per page, excluding contrast', value: '0.51' });
    });

    it('carries a change with its direction', () => {
        const pages = view.figures.find((f) => f.label === 'Pages scanned');
        expect(pages).toMatchObject({ value: '21,960', change: '-2,294', direction: null });
    });

    it('builds the category table largest first, labelled from the vocabulary, zeros dropped', () => {
        const [table] = view.tables;
        expect(table.caption).toBe('Errors by category');
        expect(table.rows.map((r) => r.label)).toEqual(['Contrast', 'Page structure', 'Links to inaccessible documents']);
        expect(table.rows[0].cells).toEqual(['54,881']);
    });

    it('puts alerts and error types behind details', () => {
        expect(view.details.figures.map((f) => f.label)).toContain('Alerts');
        const types = view.details.tables[0];
        expect(types.rows[0].label).toBe('Very low contrast');
        expect(types.rows[0].cells).toEqual(['Contrast', '54,881', '14,207']);
        expect(view.details.context).toContainEqual({ label: 'Retrieved', value: '2026-10-12' });
    });

    it('reports an empty snapshot with the template message', () => {
        const empty = buildMetricView({ data: { ...SNAPSHOT, has_data: false }, value_schema: 'popetech-metric-snapshot/1' });
        expect(empty.kind).toBe('empty');
        expect(empty.emptyMessage).toMatch(/no scan data/);
    });

    it('accepts any template set, so a new kind of metric is config only', () => {
        const templates = {
            ...METRIC_TEMPLATES,
            'survey/1': { label: 'Survey', headline: { label: 'Responses', path: 'n', format: 'count' } },
        };
        const survey = buildMetricView({ data: { n: 1200 }, value_schema: 'survey/1' }, templates);
        expect(survey.headline).toMatchObject({ label: 'Responses', value: '1,200' });
    });
});

describe('inference path', () => {
    it('lays out unknown JSON by shape', () => {
        const view = buildMetricView({
            data: {
                site: 'library.sfsu.edu',
                score: 87.5,
                issues: 12,
                by_level: { A: { count: 3 }, AA: { count: 9 } },
                pages: [{ url: '/a', errors: 2 }, { url: '/b', errors: 0 }],
            },
            value_schema: 'unknown/1',
        });
        expect(view.kind).toBe('inferred');
        expect(view.context).toContainEqual({ label: 'Site', value: 'library.sfsu.edu' });
        expect(view.figures.map((f) => [f.label, f.value])).toEqual([['Score', '87.5'], ['Issues', '12']]);
        expect(view.tables.map((t) => t.caption)).toEqual(['By level', 'Pages']);
        expect(view.tables[1].rows.map((r) => r.label)).toEqual(['/a', '/b']);
    });

    it('uses single_value as the headline when the JSON has none', () => {
        const view = buildMetricView({ data: { a: 1 }, single_value: '42' });
        expect(view.headline).toMatchObject({ label: 'Value', value: '42' });
    });
});

describe('single value and empty', () => {
    it('shows a single value alone', () => {
        const view = buildMetricView({ single_value: '1234', uri_path: 'https://x.edu/report' });
        expect(view.kind).toBe('single');
        expect(view.headline.value).toBe('1,234');
        expect(view.links).toEqual([{ label: 'Link', href: 'https://x.edu/report', text: 'https://x.edu/report' }]);
    });

    it('keeps text single values as text', () => {
        expect(buildMetricView({ single_value: 'Quarterly' }).headline.value).toBe('Quarterly');
    });

    it('is empty when nothing is stored', () => {
        expect(buildMetricView({ value_dict: '"\\"\\""' }).kind).toBe('empty');
    });
});
