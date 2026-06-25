// Build an Outlook-safe HTML + plain-text "Working Group Status Report" for one
// campus, to paste into an email asking a third party to confirm/update the info.
//
// Compact, table-structured: one table per working group, one row per success
// indicator (its YSE for the year), showing the YSE, its implementations, and its
// notes — each YSE and implementation deep-linked back into the ATI database so the
// recipient can open the record. A blank "Your updates" column invites their reply.
//
// Outlook (desktop = Word engine) is the constraint, so the HTML uses only:
//   - <table> layout with inline styles AND bgcolor attributes (Outlook honours the
//     attribute over CSS background), web-safe fonts, explicit widths;
//   - no flex/grid/float, no border-radius/box-shadow, no <style> blocks or classes.
// All interpolated content is HTML-escaped.

import { typeLabel } from '../../components/graph_components/implementation/implementationConfig';

// Render order + the dashboard URL segment for each working group.
const WG_ORDER = [
    { key: 'web', name: 'Web', segment: 'web' },
    { key: 'instructionalMaterials', name: 'Instructional Materials', segment: 'instructional-materials' },
    { key: 'procurement', name: 'Procurement', segment: 'procurement' },
];

// Outlook-safe palette (SFBRN navy brand + calm grays).
const NAVY = '#354A7A';
const LINK = '#40598F';
const BORDER = '#CBD5E0';
const HEAD_BG = '#EDF2F7';
const TEXT = '#2D3748';
const MUTED = '#718096';
const FONT = 'font-family:Arial,Helvetica,sans-serif;';

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const indicatorsOf = (wgData) => (wgData?.goals || []).flatMap((g) => g?.indicators || []);

// "1.2-web" -> { goalNum: '1', indNum: '2' }
function parseCompositeKey(ck) {
    const [numbers = ''] = String(ck || '').split('-');
    const [goalNum, indNum] = numbers.split('.');
    return { goalNum, indNum };
}

// Flatten the loaded campus/year working-group trees into per-WG row sets.
function collectSections(data, { campus, year, origin }) {
    const base = `${origin || ''}/ati/${campus || ''}`;
    const yseLink = (ck, segment) => {
        const { goalNum, indNum } = parseCompositeKey(ck);
        return (campus && goalNum && indNum) ? `${base}/dashboard/${segment}/goal/${goalNum}/${indNum}` : null;
    };
    const implLink = (type, uid) => (campus && type && uid)
        ? `${base}/ati-explorer/implementations/${type}/${uid}` : null;

    return WG_ORDER.map((wg) => {
        const rows = [];
        for (const wrapper of indicatorsOf(data?.[wg.key])) {
            const ind = wrapper?.indicator?.properties || {};
            const ck = ind.composite_key || '';
            for (const ev of (wrapper?.evidences || [])) {
                const yse = ev?.evidence?.properties || {};
                const impls = (ev?.evidenceTypes || [])
                    .filter((et) => et && et.type && et.evidenceType?.properties)
                    .map((et) => ({
                        title: et.evidenceType.properties.title || '(untitled)',
                        typeLabel: typeLabel(et.type),
                        link: implLink(et.type, et.evidenceType.properties.unique_id),
                    }));
                const notes = (ev?.has_notes || [])
                    .filter((n) => n?.note?.properties?.content)
                    .map((n) => ({
                        content: n.note.properties.content,
                        author: n.created_by?.properties?.name || null,
                        date: n.note.properties.date_created || null,
                    }));
                rows.push({
                    ck,
                    description: ind.success_indicator || '',
                    yseLink: yseLink(ck, wg.segment),
                    year: yse.year_identifier || year || null,
                    status: ev?.statusLevel?.properties?.status_level || null,
                    impls,
                    notes,
                });
            }
        }
        return { ...wg, rows };
    }).filter((s) => s.rows.length > 0);
}

function renderHtml(sections, { campusLabel, year }) {
    const cell = (w) => `padding:6px 8px;border:1px solid ${BORDER};vertical-align:top;${FONT}font-size:12px;color:${TEXT};width:${w};`;
    const th = (w) => `padding:6px 8px;border:1px solid ${BORDER};${FONT}font-size:12px;font-weight:bold;color:#4A5568;text-align:left;width:${w};background-color:${HEAD_BG};`;

    let html = `<div style="${FONT}font-size:13px;color:${TEXT};">`;
    html += `<h2 style="${FONT}color:${NAVY};font-size:18px;margin:0 0 4px 0;">ATI Working Group Status &mdash; ${esc(campusLabel)}${year ? ` &middot; ${esc(year)}` : ''}</h2>`;
    html += `<p style="${FONT}font-size:13px;color:${TEXT};margin:0 0 14px 0;">Below is the current status for each success indicator. <b>Please review and reply with any updates</b> &mdash; corrections to the implementations, their status, or new notes (use the "Your updates" column or just reply inline). The links open each record in the ATI database.</p>`;

    if (sections.length === 0) {
        html += `<p style="${FONT}color:${MUTED};">No working-group evidence found for this campus and year.</p></div>`;
        return html;
    }

    for (const s of sections) {
        html += `<h3 style="${FONT}color:${NAVY};font-size:15px;margin:16px 0 6px 0;">${esc(s.name)} <span style="color:${MUTED};font-weight:normal;font-size:12px;">(${s.rows.length})</span></h3>`;
        html += `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;${FONT}">`;
        html += `<tr bgcolor="${HEAD_BG}">`;
        html += `<th style="${th('26%')}">Indicator</th>`;
        html += `<th style="${th('28%')}">Implementations</th>`;
        html += `<th style="${th('30%')}">Notes</th>`;
        html += `<th style="${th('16%')}">Your updates</th>`;
        html += `</tr>`;

        for (const r of s.rows) {
            const ckNode = r.yseLink
                ? `<a href="${esc(r.yseLink)}" style="color:${LINK};text-decoration:none;font-weight:bold;">${esc(r.ck)}</a>`
                : `<b>${esc(r.ck)}</b>`;
            let indCell = `${ckNode} ${esc(r.description)}`;
            const meta = [r.status ? `Status: ${esc(r.status)}` : null, r.year ? esc(r.year) : null].filter(Boolean).join(' &middot; ');
            if (meta) indCell += `<div style="color:${MUTED};font-size:11px;margin-top:3px;">${meta}</div>`;

            const implCell = r.impls.length
                ? r.impls.map((im) => {
                    const name = im.link
                        ? `<a href="${esc(im.link)}" style="color:${LINK};text-decoration:none;">${esc(im.title)}</a>`
                        : esc(im.title);
                    return `${name} <span style="color:${MUTED};font-size:11px;">(${esc(im.typeLabel)})</span>`;
                }).join('<br>')
                : `<span style="color:${MUTED};">&mdash;</span>`;

            const notesCell = r.notes.length
                ? r.notes.map((n) => {
                    const head = [n.date ? esc(n.date) : null, n.author ? esc(n.author) : null].filter(Boolean).join(' &middot; ');
                    return `${head ? `<span style="color:${MUTED};font-size:11px;">${head}</span><br>` : ''}${esc(n.content)}`;
                }).join('<br><br>')
                : `<span style="color:${MUTED};">&mdash;</span>`;

            html += `<tr>`;
            html += `<td style="${cell('26%')}">${indCell}</td>`;
            html += `<td style="${cell('28%')}">${implCell}</td>`;
            html += `<td style="${cell('30%')}">${notesCell}</td>`;
            html += `<td style="${cell('16%')}">&nbsp;</td>`;
            html += `</tr>`;
        }
        html += `</table>`;
    }
    html += `</div>`;
    return html;
}

function renderPlainText(sections, { campusLabel, year }) {
    let t = `ATI Working Group Status — ${campusLabel}${year ? ` · ${year}` : ''}\n`;
    t += `Please review and reply with any updates (implementations, status, notes). Links open each record in the ATI database.\n`;
    if (sections.length === 0) {
        t += `\nNo working-group evidence found for this campus and year.\n`;
        return t;
    }
    for (const s of sections) {
        t += `\n=== ${s.name} (${s.rows.length}) ===\n`;
        for (const r of s.rows) {
            const meta = [r.status ? `Status: ${r.status}` : null, r.year || null].filter(Boolean).join(' · ');
            t += `\n${r.ck} — ${r.description}${meta ? `  [${meta}]` : ''}\n`;
            if (r.yseLink) t += `  YSE: ${r.yseLink}\n`;
            t += `  Implementations:\n`;
            if (r.impls.length) {
                for (const im of r.impls) t += `    - ${im.title} (${im.typeLabel})${im.link ? ` — ${im.link}` : ''}\n`;
            } else t += `    (none)\n`;
            t += `  Notes:\n`;
            if (r.notes.length) {
                for (const n of r.notes) {
                    const head = [n.date, n.author].filter(Boolean).join(' · ');
                    t += `    - ${head ? `${head}: ` : ''}${n.content}\n`;
                }
            } else t += `    (none)\n`;
        }
    }
    return t;
}

/**
 * @param {object} data    DataContext data ({ web, procurement, instructionalMaterials })
 * @param {{campus?:string, year?:string, origin?:string}} opts
 * @returns {{ html:string, plainText:string, rowCount:number, sectionCount:number }}
 */
export function buildWorkingGroupStatusReport(data, { campus, year, origin } = {}) {
    const sections = collectSections(data, { campus, year, origin });
    const campusLabel = (campus || '').toUpperCase() || 'Campus';
    return {
        html: renderHtml(sections, { campusLabel, year }),
        plainText: renderPlainText(sections, { campusLabel, year }),
        sectionCount: sections.length,
        rowCount: sections.reduce((acc, s) => acc + s.rows.length, 0),
    };
}

export default buildWorkingGroupStatusReport;
