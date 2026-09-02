import { buildFollowUpReport } from './followUpReport';

// A follow-up as Claude Code writes it: indicator headings, an evidence table,
// and the asks underneath. The fixture is literal markdown because nothing in
// the app composes this any more — the renderer's whole job is to take saved
// text it did not produce and make it paste into an email.
const SAVED = [
    'Hi Dawna, Cheryl,',
    '',
    'Thank you for meeting on 2026-08-31. One thing outstanding from each area:',
    '',
    '## 8.11-ins — Campus has integrated accessibility into faculty orientations.',
    '',
    '**Current status:** Defined',
    '',
    '| Evidence on file | Type | Strength |',
    '| --- | --- | --- |',
    '| Annual Back to the Bay Workshops | Guidance | full |',
    '',
    '**To close**',
    '',
    '- **Please send:** the Back to the Bay attendee list and slide deck you offered.',
    '- **Question:** whose job is the accessibility segment of orientation?',
    '',
    '---',
    '',
    'Thanks,',
    'Daniel Fontaine',
].join('\n');

describe('buildFollowUpReport', () => {
    it('renders headings, tables and lists', () => {
        const { html } = buildFollowUpReport(SAVED);
        expect(html).toContain('<table');
        expect(html).toContain('<ul');
        expect(html).toContain('8.11-ins');
    });

    it('uses inline styles and bgcolor so Outlook renders it', () => {
        const { html } = buildFollowUpReport(SAVED);
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
        // The author escapes a pipe so it does not split the row; it must come
        // back as a pipe, in a single cell.
        const { html } = buildFollowUpReport('| H |\n| --- |\n| A \\| B |');
        expect(html).toContain('A | B');
        expect((html.match(/<td/g) || []).length).toBe(1);
    });

    it('drops the divider row instead of rendering it as data', () => {
        const { html } = buildFollowUpReport('| H |\n| --- |\n| v |');
        expect(html).not.toContain('---');
    });

    it('renders a horizontal rule as a rule, not an empty table', () => {
        const { html } = buildFollowUpReport('one\n\n---\n\ntwo');
        expect(html).toContain('<hr');
        expect(html).not.toContain('<table');
    });

    it('produces a plain-text fallback with no markup', () => {
        const { plainText } = buildFollowUpReport(SAVED);
        expect(plainText).toContain('8.11-ins');
        expect(plainText).toContain('attendee list');
        expect(plainText).not.toContain('<');
        expect(plainText).not.toContain('**');
    });

    it('reports empty content rather than returning a blank body', () => {
        const { html, blockCount } = buildFollowUpReport('');
        expect(blockCount).toBe(0);
        expect(html).toContain('no content yet');
    });

    it('survives a null body', () => {
        expect(() => buildFollowUpReport(null)).not.toThrow();
        expect(buildFollowUpReport(null).blockCount).toBe(0);
    });

    it('renders bold and links', () => {
        const { html } = buildFollowUpReport('**bold** and [a link](https://example.org)');
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('href="https://example.org"');
    });
});
