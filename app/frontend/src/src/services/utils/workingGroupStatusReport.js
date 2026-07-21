// Build an Outlook-safe HTML + plain-text "Working Group Status Report" for one
// campus, to paste into an email asking a third party to confirm/update the info.
//
// Compact, table-structured: one table per working group, GOAL separator rows
// (goal number, name, and description) dividing the indicators, and one row per
// success indicator (its YSE for the year) showing the YSE, its implementations,
// and its notes — each YSE and implementation deep-linked back into the ATI
// database. A blank "Your updates" column invites the recipient's reply.
//
// Outlook (desktop = Word engine) is the constraint, so the HTML uses only:
//   - <table> layout with inline styles AND bgcolor attributes (Outlook honours the
//     attribute over CSS background), web-safe fonts, explicit widths, colspan;
//   - no flex/grid/float, no border-radius/box-shadow, no <style> blocks or classes.
// All interpolated content is HTML-escaped.

import { typeLabel } from '../../components/graph_components/implementation/implementationConfig';

// Render order + the dashboard URL segment for each working group. Exported so the
// UI can render one copy button per working group.
export const STATUS_REPORT_WORKING_GROUPS = [
    { key: 'web', name: 'Web', segment: 'web' },
    { key: 'instructionalMaterials', name: 'Instructional Materials', segment: 'instructional-materials' },
    { key: 'procurement', name: 'Procurement', segment: 'procurement' },
];

// Outlook-safe palette (SFBRN navy brand + calm grays).
const NAVY = '#354A7A';
const LINK = '#40598F';
const BORDER = '#CBD5E0';
const HEAD_BG = '#EDF2F7';
const GOAL_BG = '#E8EDF7';
const TEXT = '#2D3748';
const MUTED = '#718096';
const FONT = 'font-family:Arial,Helvetica,sans-serif;';

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Stored booleans are sometimes the legacy string "True".
const isTrue = (v) => v === true || v === 'True';

// Inline "[no longer available]" / "[deprecated]" flag badges for a doc/webpage.
function flagBadgeHtml(deprecated, gone) {
    let f = '';
    if (gone) f += ` <span style="color:#C53030;font-size:10px;">[no longer available]</span>`;
    if (deprecated) f += ` <span style="color:#C05621;font-size:10px;">[deprecated]</span>`;
    return f;
}

// StatusLevel pill colors — the maturity ramp from data_config.status_levels /
// services/utils/statusColors.js, rendered as Chakra "subtle" badge shades (level.100
// background + level.800 text) so each status reads as a bold, color-coded chip. Hex,
// not Chakra tokens, so they survive in raw email HTML.
const STATUS_BADGE = {
    'not started': { bg: '#FED7D7', fg: '#822727' }, // red
    'initiated':   { bg: '#FEEBC8', fg: '#7B341E' }, // orange
    'defined':     { bg: '#FEFCBF', fg: '#744210' }, // yellow
    'established': { bg: '#C6F6D5', fg: '#22543D' }, // green.100
    'managed':     { bg: '#9AE6B4', fg: '#22543D' }, // green.200
    'optimizing':  { bg: '#68D391', fg: '#1C4532' }, // green.300
};

function statusBadgeHtml(status) {
    const c = STATUS_BADGE[String(status || '').toLowerCase()] || { bg: '#E2E8F0', fg: '#4A5568' };
    return `<span style="display:inline-block;background-color:${c.bg};color:${c.fg};`
        + `font-weight:bold;font-size:11px;padding:2px 8px;border-radius:3px;${FONT}">${esc(status)}</span>`;
}

// "1.2-web" -> { goalNum: '1', indNum: '2' }
function parseCompositeKey(ck) {
    const [numbers = ''] = String(ck || '').split('-');
    const [goalNum, indNum] = numbers.split('.');
    return { goalNum, indNum };
}

// Flatten the loaded campus/year working-group trees into per-WG -> per-goal -> rows.
function collectSections(data, { campus, year, origin }, wgList) {
    const base = `${origin || ''}/ati/${campus || ''}`;
    const yseLink = (ck, segment) => {
        const { goalNum, indNum } = parseCompositeKey(ck);
        return (campus && goalNum && indNum) ? `${base}/dashboard/${segment}/goal/${goalNum}/${indNum}` : null;
    };
    const implLink = (type, uid) => (campus && type && uid)
        ? `${base}/ati-explorer/implementations/${type}/${uid}` : null;

    const buildRow = (wrapper, ev, segment) => {
        const ind = wrapper?.indicator?.properties || {};
        const ck = ind.composite_key || '';
        const yse = ev?.evidence?.properties || {};
        const impls = (ev?.evidenceTypes || [])
            .filter((et) => et && et.type && et.evidenceType?.properties)
            .map((et) => ({
                title: et.evidenceType.properties.title || '(untitled)',
                typeLabel: typeLabel(et.type),
                retired: isTrue(et.evidenceType.properties.retired),
                retiredDate: et.evidenceType.properties.retired_date
                    ? String(et.evidenceType.properties.retired_date) : null,
                strength: (et.strength === null || et.strength === undefined) ? null : Number(et.strength),
                link: implLink(et.type, et.evidenceType.properties.unique_id),
                docs: (et.docs || [])
                    .filter((d) => d && d.document?.properties)
                    .map((d) => ({
                        name: d.document.properties.name || '(untitled)',
                        deprecated: isTrue(d.document.properties.depreciated),
                    })),
                webs: (et.webs || [])
                    .filter((w) => w && w.webpage?.properties)
                    .map((w) => ({
                        name: w.webpage.properties.name || w.webpage.properties.url || '(untitled)',
                        url: w.webpage.properties.url || null,
                        deprecated: isTrue(w.webpage.properties.depreciated),
                        gone: isTrue(w.webpage.properties.no_longer_exists),
                    })),
            }));
        const notes = (ev?.has_notes || [])
            .filter((n) => n?.note?.properties?.content)
            .map((n) => ({
                content: n.note.properties.content,
                author: n.created_by?.properties?.name || null,
                date: n.note.properties.date_created || null,
            }));
        // YSE-level assignments — Person -[:implements]-> YearSuccessEvidence.
        const people = (ev?.persons || [])
            .filter((p) => p?.properties?.name)
            .map((p) => ({
                name: p.properties.name,
                title: p.properties.title || null,
                email: p.properties.email || null,
            }));
        return {
            ck,
            description: ind.success_indicator || '',
            yseLink: yseLink(ck, segment),
            year: yse.year_identifier || year || null,
            status: ev?.statusLevel?.properties?.status_level || null,
            people,
            impls,
            notes,
        };
    };

    return wgList.map((wg) => {
        const goals = [];
        for (const goal of (data?.[wg.key]?.goals || [])) {
            const gp = goal?.goal?.properties || {};
            const rows = [];
            for (const wrapper of (goal?.indicators || [])) {
                for (const ev of (wrapper?.evidences || [])) {
                    rows.push(buildRow(wrapper, ev, wg.segment));
                }
            }
            if (rows.length) {
                goals.push({
                    number: gp.goal_number ?? null,
                    name: gp.name || '',
                    description: gp.goal || '',
                    rows,
                });
            }
        }
        return { ...wg, goals };
    }).filter((s) => s.goals.length > 0);
}

const rowCountOf = (s) => s.goals.reduce((a, g) => a + g.rows.length, 0);

function renderRowHtml(r, cell) {
    const ckNode = r.yseLink
        ? `<a href="${esc(r.yseLink)}" style="color:${LINK};text-decoration:none;font-weight:bold;">${esc(r.ck)}</a>`
        : `<b>${esc(r.ck)}</b>`;
    let indCell = `${ckNode} ${esc(r.description)}`;
    const bits = [];
    if (r.status) bits.push(statusBadgeHtml(r.status));
    if (r.year) bits.push(`<span style="color:${MUTED};font-size:11px;">${esc(r.year)}</span>`);
    if (bits.length) indCell += `<div style="margin-top:5px;">${bits.join('&nbsp;&nbsp;')}</div>`;

    // YSE-level assignments — who owns this indicator's evidence. One bullet per person.
    indCell += `<div style="font-size:11px;color:${TEXT};margin-top:4px;">`
        + `<span style="color:${NAVY};font-weight:bold;">Assigned:</span>`;
    if (r.people.length) {
        for (const p of r.people) {
            const nm = p.email
                ? `<a href="mailto:${esc(p.email)}" style="color:${LINK};text-decoration:none;">${esc(p.name)}</a>`
                : esc(p.name);
            indCell += `<div style="margin-left:12px;color:${TEXT};">&bull;&nbsp;${nm}`
                + `${p.title ? ` <span style="color:${MUTED};">(${esc(p.title)})</span>` : ''}</div>`;
        }
    } else {
        indCell += ` <span style="color:${MUTED};font-style:italic;">Unassigned</span>`;
    }
    indCell += `</div>`;

    const implCell = r.impls.length
        ? r.impls.map((im) => {
            const name = im.link
                ? `<a href="${esc(im.link)}" style="color:${LINK};text-decoration:none;">${esc(im.title)}</a>`
                : esc(im.title);
            const STRENGTH_LABELS = { 0: 'No Contribution', 1: 'Indirect Support', 2: 'Partial', 3: 'Full' };
            const strengthBadge = im.strength !== null
                ? ` <span style="background:#EBF8FF;color:#2C5282;border-radius:3px;padding:0 4px;font-size:11px;font-weight:600;">STRENGTH ${im.strength} — ${STRENGTH_LABELS[im.strength] || ''}</span>`
                : '';
            const retiredBadge = im.retired
                ? ` <span style="background:#EDF2F7;color:#4A5568;border-radius:3px;padding:0 4px;font-size:11px;font-weight:600;">RETIRED${im.retiredDate ? ` ${esc(im.retiredDate)}` : ''}</span>`
                : '';
            let block = `<div style="margin-bottom:5px;">${name} <span style="color:${MUTED};font-size:11px;">(${esc(im.typeLabel)})</span>${strengthBadge}${retiredBadge}`;
            const sub = [];
            for (const d of im.docs) {
                sub.push(`${esc(d.name)}${flagBadgeHtml(d.deprecated, false)}`);
            }
            for (const w of im.webs) {
                const wn = w.url
                    ? `<a href="${esc(w.url)}" style="color:${LINK};text-decoration:none;">${esc(w.name)}</a>`
                    : esc(w.name);
                sub.push(`${wn}${flagBadgeHtml(w.deprecated, w.gone)}`);
            }
            for (const item of sub) {
                block += `<div style="margin-left:12px;color:${TEXT};font-size:11px;">&bull;&nbsp;${item}</div>`;
            }
            block += `</div>`;
            return block;
        }).join('')
        : `<span style="color:${MUTED};">&mdash;</span>`;

    const notesCell = r.notes.length
        ? r.notes.map((n) => {
            const head = [n.date ? esc(n.date) : null, n.author ? esc(n.author) : null].filter(Boolean).join(' &middot; ');
            return `${head ? `<span style="color:${MUTED};font-size:11px;">${head}</span><br>` : ''}${esc(n.content)}`;
        }).join('<br><br>')
        : `<span style="color:${MUTED};">&mdash;</span>`;

    return `<tr>`
        + `<td style="${cell('26%')}">${indCell}</td>`
        + `<td style="${cell('28%')}">${implCell}</td>`
        + `<td style="${cell('30%')}">${notesCell}</td>`
        + `<td style="${cell('16%')}">&nbsp;</td>`
        + `</tr>`;
}

function renderHtml(sections, { campusLabel, year, heading }) {
    const cell = (w) => `padding:6px 8px;border:1px solid ${BORDER};vertical-align:top;${FONT}font-size:12px;color:${TEXT};width:${w};`;
    const th = (w) => `padding:6px 8px;border:1px solid ${BORDER};${FONT}font-size:12px;font-weight:bold;color:#4A5568;text-align:left;width:${w};background-color:${HEAD_BG};`;
    const goalCell = `padding:7px 8px;border:1px solid ${BORDER};border-top:2px solid ${NAVY};${FONT}background-color:${GOAL_BG};`;

    let html = `<div style="${FONT}font-size:13px;color:${TEXT};">`;
    html += `<h2 style="${FONT}color:${NAVY};font-size:18px;margin:0 0 4px 0;">${esc(heading)} &mdash; ${esc(campusLabel)}${year ? ` &middot; ${esc(year)}` : ''}</h2>`;
    html += `<p style="${FONT}font-size:13px;color:${TEXT};margin:0 0 14px 0;">Below is the current status for each success indicator, grouped by goal. <b>Please review and reply with any updates</b> &mdash; corrections to the implementations, their status, or new notes (use the "Your updates" column or just reply inline). The links open each record in the ATI database.</p>`;

    if (sections.length === 0) {
        html += `<p style="${FONT}color:${MUTED};">No working-group evidence found for this campus and year.</p></div>`;
        return html;
    }

    for (const s of sections) {
        html += `<h3 style="${FONT}color:${NAVY};font-size:15px;margin:16px 0 6px 0;">${esc(s.name)} <span style="color:${MUTED};font-weight:normal;font-size:12px;">(${rowCountOf(s)})</span></h3>`;
        html += `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;${FONT}">`;
        html += `<tr bgcolor="${HEAD_BG}">`;
        html += `<th style="${th('26%')}">Indicator</th>`;
        html += `<th style="${th('28%')}">Implementations</th>`;
        html += `<th style="${th('30%')}">Notes</th>`;
        html += `<th style="${th('16%')}">Your updates</th>`;
        html += `</tr>`;

        for (const g of s.goals) {
            // Goal separator — full-width banner with number/name + description.
            html += `<tr><td colspan="4" bgcolor="${GOAL_BG}" style="${goalCell}">`;
            html += `<span style="${FONT}font-size:13px;font-weight:bold;color:${NAVY};">Goal ${g.number != null ? esc(g.number) : ''}${g.name ? `: ${esc(g.name)}` : ''}</span>`;
            if (g.description) html += `<div style="${FONT}font-size:11px;color:${TEXT};margin-top:3px;font-weight:normal;">${esc(g.description)}</div>`;
            html += `</td></tr>`;
            for (const r of g.rows) html += renderRowHtml(r, cell);
        }
        html += `</table>`;
    }
    html += `</div>`;
    return html;
}

function renderPlainText(sections, { campusLabel, year, heading }) {
    let t = `${heading} — ${campusLabel}${year ? ` · ${year}` : ''}\n`;
    t += `Please review and reply with any updates (implementations, status, notes). Links open each record in the ATI database.\n`;
    if (sections.length === 0) {
        t += `\nNo working-group evidence found for this campus and year.\n`;
        return t;
    }
    for (const s of sections) {
        t += `\n=== ${s.name} (${rowCountOf(s)}) ===\n`;
        for (const g of s.goals) {
            t += `\n-- Goal ${g.number != null ? g.number : ''}${g.name ? `: ${g.name}` : ''} --\n`;
            if (g.description) t += `${g.description}\n`;
            for (const r of g.rows) {
                const meta = [r.status ? `Status: ${r.status}` : null, r.year || null].filter(Boolean).join(' · ');
                t += `\n${r.ck} — ${r.description}${meta ? `  [${meta}]` : ''}\n`;
                if (r.yseLink) t += `  YSE: ${r.yseLink}\n`;
                if (r.people.length) {
                    t += `  Assigned:\n`;
                    for (const p of r.people) {
                        t += `        • ${p.name}${p.title ? ` (${p.title})` : ''}${p.email ? ` <${p.email}>` : ''}\n`;
                    }
                } else {
                    t += `  Assigned: (unassigned)\n`;
                }
                t += `  Implementations:\n`;
                if (r.impls.length) {
                    for (const im of r.impls) {
                        t += `    - ${im.title} (${im.typeLabel})${im.strength !== null ? ` [Strength ${im.strength}]` : ''}${im.retired ? ` (RETIRED${im.retiredDate ? ` ${im.retiredDate}` : ''})` : ''}${im.link ? ` — ${im.link}` : ''}\n`;
                        for (const d of im.docs) {
                            t += `        • ${d.name}${d.deprecated ? ' [deprecated]' : ''}\n`;
                        }
                        for (const w of im.webs) {
                            const flags = `${w.gone ? ' [no longer available]' : ''}${w.deprecated ? ' [deprecated]' : ''}`;
                            t += `        • ${w.name}${w.url ? ` (${w.url})` : ''}${flags}\n`;
                        }
                    }
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
    }
    return t;
}

/**
 * @param {object} data    DataContext data ({ web, procurement, instructionalMaterials })
 * @param {{campus?:string, year?:string, origin?:string, workingGroup?:string}} opts
 *        workingGroup — a STATUS_REPORT_WORKING_GROUPS key ('web' | 'instructionalMaterials'
 *        | 'procurement'); when set, only that group is included. Omit for all three.
 * @returns {{ html:string, plainText:string, rowCount:number, sectionCount:number }}
 */
export function buildWorkingGroupStatusReport(data, { campus, year, origin, workingGroup } = {}) {
    const wgList = workingGroup
        ? STATUS_REPORT_WORKING_GROUPS.filter((w) => w.key === workingGroup)
        : STATUS_REPORT_WORKING_GROUPS;
    const sections = collectSections(data, { campus, year, origin }, wgList);
    const campusLabel = (campus || '').toUpperCase() || 'Campus';
    const wgName = workingGroup
        ? (STATUS_REPORT_WORKING_GROUPS.find((w) => w.key === workingGroup)?.name || null)
        : null;
    const heading = wgName ? `ATI ${wgName} Status` : 'ATI Working Group Status';
    return {
        html: renderHtml(sections, { campusLabel, year, heading }),
        plainText: renderPlainText(sections, { campusLabel, year, heading }),
        sectionCount: sections.length,
        rowCount: sections.reduce((acc, s) => acc + rowCountOf(s), 0),
    };
}

export default buildWorkingGroupStatusReport;
