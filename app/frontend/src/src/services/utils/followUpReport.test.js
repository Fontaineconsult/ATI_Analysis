import { buildFollowUpMarkdown } from './followUpMarkdown';
import { buildFollowUpReport } from './followUpReport';

const ROWS = [
    {
        composite_key: '8.11-ins',
        success_indicator: 'Campus has integrated accessibility into faculty orientations.',
        status_level: 'Defined',
        evidence: [{ title: 'Annual Back to the Bay Workshops', type: 'Guidance', strength: 3 }],
        queries: [],
        recommendations: [],
        concerns: [],
    },
    {
        composite_key: '8.12-ins',
        success_indicator: 'Developed a process that integrates accessibility information into faculty development.',
        status_level: 'Established',
        evidence: [{ title: 'Accessibility Compliance for DT&L', type: 'Guidance', strength: null }],
        queries: [
            { question: 'Did the Title II series run again?', category: 'information_gap', answerable_by: 'Dawna Komorosky' },
            { question: 'Please send the attendee list.', category: 'artifact_request', answerable_by: null },
        ],
        recommendations: [{ recommendation: 'Add accessibility as a Learning Circle focus area.' }],
        concerns: [],
    },
];

const META = {
    meetingTitle: 'Faculty Development CoP',
    meetingDate: '2026-08-31',
    recipients: [{ name: 'Dawna Komorosky' }, { name: 'Cheryl Saelee' }],
    community: 'Faculty Development',
    campus: 'csueb',
    senderName: 'Daniel Fontaine',
};

describe('buildFollowUpMarkdown', () => {
    it('counts every ask across all three kinds', () => {
        expect(buildFollowUpMarkdown(ROWS, META).askCount).toBe(3);
    });

    it('names the community and campus in the subject', () => {
        const { subject } = buildFollowUpMarkdown(ROWS, META);
        expect(subject).toContain('Faculty Development CoP');
        expect(subject).toContain('Faculty Development · CSUEB');
    });

    it('greets recipients by first name', () => {
        expect(buildFollowUpMarkdown(ROWS, META).markdown).toContain('Hi Dawna, Cheryl,');
    });

    it('phrases an artifact request as a send, not a question', () => {
        const { markdown } = buildFollowUpMarkdown(ROWS, META);
        expect(markdown).toContain('**Please send:** Please send the attendee list.');
        expect(markdown).toContain('**Question:** Did the Title II series run again?');
    });

    it('attributes an ask to its owner when one is recorded', () => {
        expect(buildFollowUpMarkdown(ROWS, META).markdown).toContain('_(Dawna Komorosky)_');
    });

    it('reports unrated evidence honestly rather than as a number', () => {
        expect(buildFollowUpMarkdown(ROWS, META).markdown).toContain('| Guidance | unrated |');
    });

    it('does not claim an indicator is fine when it merely has no recorded asks', () => {
        // 8.11 has no asks, but its gaps live in prose notes. Saying "nothing
        // outstanding" would launder that into a clean bill of health.
        const { markdown } = buildFollowUpMarkdown(ROWS, META);
        expect(markdown).toContain('_Nothing is recorded as outstanding against this indicator._');
        expect(markdown).not.toMatch(/no gaps|all clear|complete/i);
    });

    it('survives an empty table', () => {
        const { markdown, askCount } = buildFollowUpMarkdown([], {});
        expect(askCount).toBe(0);
        expect(markdown).toContain('Hi all,');
    });

    it('escapes a pipe in a title so the table does not break', () => {
        const rows = [{ ...ROWS[0], evidence: [{ title: 'A | B', type: 'Guidance', strength: 1 }] }];
        expect(buildFollowUpMarkdown(rows, META).markdown).toContain('A \\| B');
    });
});

describe('buildFollowUpReport', () => {
    const render = () => buildFollowUpReport(buildFollowUpMarkdown(ROWS, META).markdown);

    it('renders headings, tables and lists', () => {
        const { html } = render();
        expect(html).toContain('<table');
        expect(html).toContain('<ul');
        expect(html).toContain('8.11-ins');
    });

    it('uses inline styles and bgcolor so Outlook renders it', () => {
        const { html } = render();
        expect(html).toContain('border-collapse:collapse');
        expect(html).toContain('bgcolor=');
        expect(html).not.toContain('<style');
        expect(html).not.toContain('display:flex');
    });

    it('escapes HTML in content rather than emitting it', () => {
        const { html } = buildFollowUpReport('A <script>alert(1)</script> line');
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('<script>');
    });

    it('renders an escaped pipe as a literal pipe inside one cell', () => {
        const { html } = buildFollowUpReport('| H |\n| --- |\n| A \\| B |');
        expect(html).toContain('A | B');
        // one header cell and one body cell — the escape must not split the row
        expect((html.match(/<td/g) || []).length).toBe(1);
    });

    it('drops the divider row instead of rendering it as data', () => {
        const { html } = buildFollowUpReport('| H |\n| --- |\n| v |');
        expect(html).not.toContain('---');
    });

    it('produces a plain-text fallback with no markup', () => {
        const { plainText } = render();
        expect(plainText).toContain('8.11-ins');
        expect(plainText).not.toContain('<');
        expect(plainText).not.toContain('**');
    });

    it('reports empty content rather than returning a blank body', () => {
        const { html, blockCount } = buildFollowUpReport('');
        expect(blockCount).toBe(0);
        expect(html).toContain('no content yet');
    });

    it('renders bold and links', () => {
        const { html } = buildFollowUpReport('**bold** and [a link](https://example.org)');
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('href="https://example.org"');
    });
});
