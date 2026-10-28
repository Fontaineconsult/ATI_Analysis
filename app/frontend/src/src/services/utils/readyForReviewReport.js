// Build an Outlook-safe HTML + plain-text list of the success indicators in ONE working
// group that are marked ready for administrative review and not yet approved, to paste
// into an email asking a reviewer to work through them. One row per indicator: the
// indicator (composite key + text), its status, and a link to its review page.
//
// "Ready for review" is the same test the report rows use: getIndicatorSummary's
// readyForReview and not approved. Outlook constraints are the same as
// workingGroupStatusReport: table layout, inline styles plus bgcolor, no classes.

import { getIndicatorSummary } from '../../components/graph_components/indicators/indicatorHelpers';
import { esc, statusBadgeHtml } from './workingGroupStatusReport';

const NAVY = '#354A7A';
const LINK = '#40598F';
const BORDER = '#CBD5E0';
const HEAD_BG = '#EDF2F7';
const TEXT = '#2D3748';
const MUTED = '#718096';
const FONT = 'font-family:Arial,Helvetica,sans-serif;';

// "6.9-ins" -> [6, 9], for goal-then-indicator ordering.
const keyOrder = (ck) => String(ck || '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);

/**
 * @param {object} workingGroupData  one DataContext working-group tree ({ workingGroup, goals })
 * @param {{campus:string, slug:string, name?:string, year?:string, origin?:string}} opts
 *        slug — the working group's URL segment (e.g. 'instructional-materials')
 * @returns {{ html:string, plainText:string, rowCount:number }}
 */
export function buildReadyForReviewReport(workingGroupData, { campus, slug, name, year, origin = '' } = {}) {
    const groupName = name || workingGroupData?.workingGroup || 'Working group';
    const reviewUrl = (goalNum, indNum) =>
        `${origin}/ati/${campus}/dashboard/reports/approve/${slug}/${goalNum}/${indNum}`;

    const rows = [];
    for (const goal of (workingGroupData?.goals || [])) {
        for (const wrapper of (goal?.indicators || [])) {
            const s = getIndicatorSummary(wrapper);
            if (!s.readyForReview || s.approved || !s.compositeKey) continue;
            const [goalNum, indNum] = keyOrder(s.compositeKey);
            rows.push({
                ck: s.compositeKey,
                description: s.description || '',
                status: s.statusLevel || 'No status',
                url: reviewUrl(goalNum, indNum),
            });
        }
    }
    rows.sort((a, b) => {
        const [ag, ai] = keyOrder(a.ck);
        const [bg, bi] = keyOrder(b.ck);
        return ag - bg || ai - bi;
    });

    const campusLabel = (campus || '').toUpperCase();
    const title = `${groupName} indicators ready for review`
        + `${campusLabel ? ` · ${campusLabel}` : ''}${year ? ` · ${year}` : ''}`;

    const cell = (w) => `padding:6px 8px;border:1px solid ${BORDER};vertical-align:top;${FONT}font-size:12px;color:${TEXT};width:${w};`;
    const th = (w) => `padding:6px 8px;border:1px solid ${BORDER};${FONT}font-size:12px;font-weight:bold;color:#4A5568;text-align:left;width:${w};background-color:${HEAD_BG};`;

    let html = `<div style="${FONT}font-size:13px;color:${TEXT};">`;
    html += `<h3 style="${FONT}color:${NAVY};font-size:15px;margin:0 0 6px 0;">${esc(title)} <span style="color:${MUTED};font-weight:normal;font-size:12px;">(${rows.length})</span></h3>`;
    html += `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;${FONT}">`;
    html += `<tr bgcolor="${HEAD_BG}"><th style="${th('62%')}">Indicator</th><th style="${th('16%')}">Status</th><th style="${th('22%')}">Review</th></tr>`;
    for (const r of rows) {
        html += `<tr>`
            + `<td style="${cell('62%')}"><b>${esc(r.ck)}</b> ${esc(r.description)}</td>`
            + `<td style="${cell('16%')}">${statusBadgeHtml(r.status)}</td>`
            + `<td style="${cell('22%')}"><a href="${esc(r.url)}" style="color:${LINK};text-decoration:none;">Review ${esc(r.ck)}</a></td>`
            + `</tr>`;
    }
    html += `</table></div>`;

    let plainText = `${title} (${rows.length})\n`;
    for (const r of rows) {
        plainText += `\n${r.ck} ${r.description}\n  Status: ${r.status}\n  Review: ${r.url}\n`;
    }

    return { html, plainText, rowCount: rows.length };
}

export default buildReadyForReviewReport;
