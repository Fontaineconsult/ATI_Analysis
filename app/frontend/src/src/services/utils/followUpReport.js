// Render a follow-up's stored MARKDOWN as Outlook-safe HTML (plus a plain-text
// fallback) for "paste into an email".
//
// Same constraint set as communityReport.js and workingGroupStatusReport.js —
// Outlook desktop uses the Word engine, so: <table> layout with inline styles
// AND bgcolor attributes, web-safe fonts, no flex/grid, no <style> blocks.
//
// This renders FROM the saved markdown, which is the only source: follow-ups
// are composed by an agent against the notes and source text behind the
// indicators, then saved. The app never regenerates them.
//
// The markdown subset is the one a follow-up is actually written in: headings,
// paragraphs, bullets, pipe tables, horizontal rules, bold, italic and links.
// Anything else passes through as escaped text rather than being silently
// dropped, because this renders text the app did not author and must not
// quietly lose part of.

const NAVY = '#354A7A';
const BORDER = '#CBD5E0';
const HEAD_BG = '#EDF2F7';
const TEXT = '#2D3748';
const MUTED = '#718096';
const FONT = 'font-family:Arial,Helvetica,sans-serif;';

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Inline spans, applied AFTER escaping so the markers themselves are safe.
function inline(text) {
    return esc(text)
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
            `<a href="$2" style="color:${NAVY};">$1</a>`)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[\s(])_([^_]+)_(?=[\s.,;:)]|$)/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code style="font-family:Consolas,monospace;">$1</code>');
}

const plainInline = (text) => String(text ?? '')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[\s(])_([^_]+)_(?=[\s.,;:)]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1');

// Outlook's Word engine ignores margins on <table>, so the air around one has to
// be a real element with a real height. font-size:0 and matching line-height stop
// the &nbsp; from adding its own leading on top.
const spacer = (px) =>
    `<div style="height:${px}px;line-height:${px}px;font-size:0;">&nbsp;</div>`;

const isTableRow = (line) => /^\s*\|.*\|\s*$/.test(line);
const isDivider = (line) => /^\s*\|?[\s:-]*-{2,}[\s:|-]*\|?\s*$/.test(line) && line.includes('-');

// A cell may legitimately contain an escaped pipe. Lookbehind would express
// this in one regex, but it is unavailable in CRA's babel target and in older
// browsers, so escaped pipes are parked on a sentinel and restored after the
// split. The sentinel must be a string no author would type.
const PIPE_SENTINEL = '@@ESCAPED_PIPE@@';

function splitRow(line) {
    return line.trim()
        .replace(/\\\|/g, PIPE_SENTINEL)
        .replace(/^\|/, '').replace(/\|$/, '')
        .split('|')
        .map((c) => c.split(PIPE_SENTINEL).join('|').trim());
}

function tableHtml(rows) {
    const [header, ...body] = rows;
    const th = (label) =>
        `<th align="left" bgcolor="${HEAD_BG}" style="background-color:${HEAD_BG};`
        + `border:1px solid ${BORDER};padding:6px 8px;font-size:11px;color:${TEXT};`
        + `text-transform:uppercase;${FONT}">${inline(label)}</th>`;
    const td = (content) =>
        `<td style="border:1px solid ${BORDER};padding:6px 8px;font-size:12px;color:${TEXT};`
        + `vertical-align:top;${FONT}">${inline(content)}</td>`;
    return spacer(10)
        + '<table cellpadding="0" cellspacing="0" width="100%" '
        + 'style="border-collapse:collapse;">'
        + `<tr>${header.map(th).join('')}</tr>`
        + body.map((r) => `<tr>${r.map(td).join('')}</tr>`).join('')
        + '</table>'
        + spacer(14);
}

/**
 * @param markdown the stored FollowUp body
 * @returns {{html: string, plainText: string, blockCount: number}}
 */
export function buildFollowUpReport(markdown) {
    const lines = String(markdown ?? '').split(/\r?\n/);
    const html = [];
    const plain = [];
    let i = 0;
    let blockCount = 0;

    // A question is where the reader is expected to do something, so it gets its
    // own line — a question buried mid-paragraph reads as commentary and gets
    // skimmed past. Applied only in paragraphs: a '?' inside a table cell or a
    // heading is not a sentence boundary.
    const breakAfterQuestions = (h) => h.replace(/\?\s+(?=[A-Z"'(‘“])/g, '?<br />');
    const para = (t) =>
        `<p style="margin:0 0 12px 0;font-size:12px;color:${TEXT};line-height:1.6;${FONT}">`
        + breakAfterQuestions(inline(t)) + '</p>';

    while (i < lines.length) {
        const line = lines[i];

        if (!line.trim()) { i += 1; continue; }

        // Horizontal rule — the separator between indicators.
        if (/^\s*---+\s*$/.test(line) && !isTableRow(line)) {
            html.push(spacer(8) + `<hr style="border:0;border-top:1px solid ${BORDER};margin:0;" />` + spacer(16));
            plain.push('', '—'.repeat(40), '');
            i += 1; blockCount += 1;
            continue;
        }

        // Headings.
        const heading = /^(#{1,4})\s+(.*)$/.exec(line);
        if (heading) {
            const level = heading[1].length;
            const size = level <= 2 ? 14 : 13;
            html.push(
                spacer(level <= 2 ? 18 : 12)
                + `<p style="margin:0 0 10px 0;font-size:${size}px;font-weight:bold;`
                + `color:${NAVY};${FONT}">${inline(heading[2])}</p>`
            );
            plain.push('', plainInline(heading[2]), '='.repeat(plainInline(heading[2]).length));
            i += 1; blockCount += 1;
            continue;
        }

        // Pipe table: a header row, an optional divider, then body rows.
        if (isTableRow(line)) {
            const collected = [];
            while (i < lines.length && isTableRow(lines[i])) {
                if (!isDivider(lines[i])) collected.push(splitRow(lines[i]));
                i += 1;
            }
            if (collected.length) {
                html.push(tableHtml(collected));
                collected.forEach((r) => plain.push(r.map(plainInline).join('  |  ')));
                plain.push('');
                blockCount += 1;
            }
            continue;
        }

        // Bullet list.
        if (/^\s*[-*]\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
                i += 1;
            }
            html.push(
                `<ul style="margin:0 0 14px 20px;padding:0;font-size:12px;color:${TEXT};${FONT}">`
                + items.map((it) => `<li style="margin:0 0 6px 0;line-height:1.6;">${inline(it)}</li>`).join('')
                + '</ul>'
            );
            items.forEach((it) => plain.push(`  - ${plainInline(it)}`));
            plain.push('');
            blockCount += 1;
            continue;
        }

        // Paragraph — consecutive non-empty lines that start no other block.
        const buf = [];
        while (i < lines.length && lines[i].trim()
               && !/^(#{1,4})\s/.test(lines[i])
               && !/^\s*[-*]\s+/.test(lines[i])
               && !isTableRow(lines[i])
               && !/^\s*---+\s*$/.test(lines[i])) {
            buf.push(lines[i].trim());
            i += 1;
        }
        if (buf.length) {
            html.push(para(buf.join(' ')));
            plain.push(
                plainInline(buf.join(' ')).replace(/\?\s+(?=[A-Z"'(])/g, '?\n'),
                '',
            );
            blockCount += 1;
        }
    }

    if (!blockCount) {
        html.push(`<p style="margin:6px 0;font-size:12px;color:${MUTED};${FONT}">This follow-up has no content yet.</p>`);
        plain.push('This follow-up has no content yet.');
    }

    return {
        html: `<div style="${FONT}color:${TEXT};">${html.join('')}</div>`,
        plainText: plain.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
        blockCount,
    };
}
