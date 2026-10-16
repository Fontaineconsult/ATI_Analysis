// Build a minimal Outlook-safe HTML + plain-text table for ONE working group of
// the active campus + year: one row per success indicator with exactly three
// columns, SI (composite key), Name (the indicator text), and Status (the YSE's
// status level for the year). Nothing else: no goals, links, implementations,
// people, or notes. This is the "paste a status list into an email or a doc"
// companion to workingGroupStatusReport.js, which carries the full detail.
//
// Same Outlook constraints as the full report: <table> layout, inline styles
// plus bgcolor attributes, web-safe fonts, no classes or <style> blocks. All
// interpolated content is HTML-escaped.

import { WORKING_GROUP_LIST } from '../../styles/workingGroupIdentity';
import { statusBadgeHtml } from './workingGroupStatusReport';

const NAVY = '#354A7A';
const BORDER = '#CBD5E0';
const HEAD_BG = '#EDF2F7';
const TEXT = '#2D3748';
const MUTED = '#718096';
const FONT = 'font-family:Arial,Helvetica,sans-serif;';

// Status shown when a YSE carries no status level, matching the dashboard table.
const DEFAULT_STATUS = 'Not Started';

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// "1.12-web" -> [1, 12] for ordering; unknown parts sort last.
function sortKey(ck) {
    const [numbers = ''] = String(ck || '').split('-');
    const [g, i] = numbers.split('.');
    const n = (v) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : Number.MAX_SAFE_INTEGER);
    return [n(g), n(i)];
}

// Flatten one working group's goals into { ck, name, status } rows in goal /
// indicator order. The first YSE on each indicator is the year's evidence, the
// same read the report tables make.
export function collectStatusRows(data, workingGroup) {
    const wg = WORKING_GROUP_LIST.find((w) => w.dataKey === workingGroup);
    if (!wg) return [];
    const rows = [];
    for (const goal of (data?.[wg.dataKey]?.goals || [])) {
        for (const wrapper of (goal?.indicators || [])) {
            const ind = wrapper?.indicator?.properties || {};
            if (!ind.composite_key) continue;
            const status = wrapper?.evidences?.[0]?.statusLevel?.properties?.status_level;
            rows.push({
                ck: ind.composite_key,
                name: ind.success_indicator || '',
                status: status || DEFAULT_STATUS,
            });
        }
    }
    return rows.sort((a, b) => {
        const [ag, ai] = sortKey(a.ck);
        const [bg, bi] = sortKey(b.ck);
        return ag - bg || ai - bi;
    });
}

function renderHtml(rows, { heading, campusLabel, year }) {
    const cell = (w) => `padding:6px 8px;border:1px solid ${BORDER};vertical-align:top;${FONT}font-size:12px;color:${TEXT};width:${w};`;
    const th = (w) => `padding:6px 8px;border:1px solid ${BORDER};${FONT}font-size:12px;font-weight:bold;color:#4A5568;text-align:left;width:${w};background-color:${HEAD_BG};`;

    let html = `<div style="${FONT}font-size:13px;color:${TEXT};">`;
    html += `<h3 style="${FONT}color:${NAVY};font-size:15px;margin:0 0 6px 0;">${esc(heading)} &mdash; ${esc(campusLabel)}${year ? ` &middot; ${esc(year)}` : ''}</h3>`;
    if (!rows.length) {
        html += `<p style="${FONT}color:${MUTED};">No success indicators for this working group.</p></div>`;
        return html;
    }
    html += `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;${FONT}">`;
    html += `<tr bgcolor="${HEAD_BG}">`
        + `<th style="${th('12%')}">SI</th>`
        + `<th style="${th('68%')}">Name</th>`
        + `<th style="${th('20%')}">Status</th>`
        + `</tr>`;
    for (const r of rows) {
        html += `<tr>`
            + `<td style="${cell('12%')}"><b>${esc(r.ck)}</b></td>`
            + `<td style="${cell('68%')}">${esc(r.name)}</td>`
            + `<td style="${cell('20%')}">${statusBadgeHtml(r.status)}</td>`
            + `</tr>`;
    }
    html += `</table></div>`;
    return html;
}

function renderPlainText(rows, { heading, campusLabel, year }) {
    let t = `${heading} — ${campusLabel}${year ? ` · ${year}` : ''}\n`;
    if (!rows.length) return `${t}\nNo success indicators for this working group.\n`;
    t += `\nSI\tName\tStatus\n`;
    for (const r of rows) t += `${r.ck}\t${r.name}\t${r.status}\n`;
    return t;
}

/**
 * @param {object} data   DataContext data (per-working-group trees keyed by dataKey)
 * @param {{workingGroup:string, campus?:string, year?:string}} opts
 *        workingGroup — a WORKING_GROUP_LIST dataKey ('web', 'instructionalMaterials', ...)
 * @returns {{ html:string, plainText:string, rowCount:number, name:string|null }}
 */
export function buildWorkingGroupStatusTable(data, { workingGroup, campus, year } = {}) {
    const wg = WORKING_GROUP_LIST.find((w) => w.dataKey === workingGroup) || null;
    const rows = collectStatusRows(data, workingGroup);
    const campusLabel = (campus || '').toUpperCase() || 'Campus';
    const heading = wg ? `${wg.name} Success Indicators` : 'Success Indicators';
    return {
        html: renderHtml(rows, { heading, campusLabel, year }),
        plainText: renderPlainText(rows, { heading, campusLabel, year }),
        rowCount: rows.length,
        name: wg?.name || null,
    };
}

export default buildWorkingGroupStatusTable;
