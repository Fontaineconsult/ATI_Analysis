// Build an Outlook-safe HTML + plain-text report for ONE Community of Practice —
// its member roster and its indicator stakes — to paste into an email (e.g. when
// convening the community or sharing the stakeholder map for an indicator area).
//
// Same constraint set as workingGroupStatusReport.js (Outlook desktop = Word
// engine): <table> layout with inline styles AND bgcolor attributes, web-safe
// fonts, no flex/grid, no <style> blocks. All interpolated content HTML-escaped.
// Consumed by CopyCommunityReportButton via copyRichContent (HTML + text/plain).

const NAVY = '#354A7A';
const BORDER = '#CBD5E0';
const HEAD_BG = '#EDF2F7';
const TEXT = '#2D3748';
const MUTED = '#718096';
const FONT = 'font-family:Arial,Helvetica,sans-serif;';

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const td = (content, extra = '') =>
    `<td style="border:1px solid ${BORDER};padding:6px 8px;font-size:12px;color:${TEXT};` +
    `vertical-align:top;${FONT}${extra}">${content}</td>`;

const th = (label, width) =>
    `<th align="left" bgcolor="${HEAD_BG}" style="background-color:${HEAD_BG};border:1px solid ${BORDER};` +
    `padding:6px 8px;font-size:11px;color:${TEXT};text-transform:uppercase;${FONT}` +
    `${width ? `width:${width};` : ''}">${label}</th>`;

function sectionHeading(label) {
    return `<p style="margin:16px 0 6px 0;font-size:13px;font-weight:bold;color:${NAVY};${FONT}">${label}</p>`;
}

function membersTableHtml(members) {
    if (!members.length) {
        return `<p style="margin:4px 0;font-size:12px;color:${MUTED};${FONT}">No members recorded yet.</p>`;
    }
    const rows = members.map((m) => '<tr>'
        + td(`<strong>${esc(m.name)}</strong>`)
        + td(esc(m.title || '—'))
        + td((m.host_campus || '—').toUpperCase())
        + td(esc(m.note || ''))
        + '</tr>').join('');
    return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">`
        + `<tr>${th('Member', '24%')}${th('Title', '34%')}${th('Campus', '10%')}${th('Note', '32%')}</tr>`
        + rows + '</table>';
}

function stakesTableHtml(stakes) {
    if (!stakes.length) {
        return `<p style="margin:4px 0;font-size:12px;color:${MUTED};${FONT}">No indicator stakes recorded yet.</p>`;
    }
    const rows = stakes.map((s) => '<tr>'
        + td(`<strong>${esc(s.composite_key)}</strong>`, 'white-space:nowrap;')
        + td(esc(s.success_indicator || ''))
        + td(esc(s.note || ''))
        + '</tr>').join('');
    return `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">`
        + `<tr>${th('Indicator', '10%')}${th('Success indicator', '58%')}${th('Why this stake', '32%')}</tr>`
        + rows + '</table>';
}

/**
 * Build the copyable report for one community-detail payload
 * ({name, description, members: [...], stakes: [...]}).
 * Returns { html, plainText, rowCount } — rowCount = members + stakes, so the
 * caller can show "nothing to copy" for a brand-new community.
 */
export function buildCommunityReport(detail) {
    const members = Array.isArray(detail?.members) ? detail.members : [];
    const stakes = Array.isArray(detail?.stakes) ? detail.stakes : [];
    const name = detail?.name || 'Community of Practice';

    const campuses = [...new Set(members.map((m) => m.host_campus).filter(Boolean))]
        .map((c) => c.toUpperCase()).sort();

    const html = `<div style="${FONT}">`
        + `<p style="margin:0 0 2px 0;font-size:16px;font-weight:bold;color:${NAVY};${FONT}">${esc(name)}</p>`
        + `<p style="margin:0 0 4px 0;font-size:11px;color:${MUTED};${FONT}">Community of Practice — ATI stakeholder map`
        + (campuses.length ? ` · ${campuses.join(', ')}` : '') + '</p>'
        + (detail?.description
            ? `<p style="margin:0 0 8px 0;font-size:12px;color:${TEXT};${FONT}">${esc(detail.description)}</p>` : '')
        + sectionHeading(`Members (${members.length})`)
        + membersTableHtml(members)
        + sectionHeading(`Indicator stakes (${stakes.length})`)
        + stakesTableHtml(stakes)
        + '</div>';

    const lines = [
        name,
        `Community of Practice — ATI stakeholder map${campuses.length ? ` · ${campuses.join(', ')}` : ''}`,
    ];
    if (detail?.description) lines.push(detail.description);
    lines.push('', `MEMBERS (${members.length})`);
    members.forEach((m) => lines.push(
        `  - ${m.name}${m.title ? ` — ${m.title}` : ''}`
        + `${m.host_campus ? ` (${m.host_campus.toUpperCase()})` : ''}${m.note ? ` — ${m.note}` : ''}`,
    ));
    lines.push('', `INDICATOR STAKES (${stakes.length})`);
    stakes.forEach((s) => lines.push(
        `  - ${s.composite_key}: ${s.success_indicator || ''}${s.note ? ` — ${s.note}` : ''}`,
    ));

    return { html, plainText: lines.join('\n'), rowCount: members.length + stakes.length };
}

export default buildCommunityReport;
