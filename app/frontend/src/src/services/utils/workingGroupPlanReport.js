// Build an Outlook-safe HTML + plain-text summary of ONE working-group card on the
// campus plan (one working group at one campus), to paste into an email: the
// group's leads and members, its prioritized indicators, and the communities of
// practice whose stakes land in the group.
//
// Same constraint set as communityReport.js (Outlook desktop = Word engine):
// <table> layout with inline styles AND bgcolor attributes, web-safe fonts, no
// flex/grid, no <style> blocks. All interpolated content HTML-escaped.
// Consumed by CopyWorkingGroupPlanButton via copyRichContent.
//
// The caller passes lists already filtered to the campus, so the copy matches
// what the card shows.

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

const table = (headerCells, rows) =>
    `<table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">`
    + `<tr>${headerCells}</tr>${rows}</table>`;

const sectionHeading = (label) =>
    `<p style="margin:16px 0 6px 0;font-size:13px;font-weight:bold;color:${NAVY};${FONT}">${label}</p>`;

const empty = (text) =>
    `<p style="margin:4px 0;font-size:12px;color:${MUTED};${FONT}">${text}</p>`;

const maturity = (si) => {
    const prev = si.previous_status_level;
    const curr = si.status_level;
    if (prev && curr && prev !== curr) return `${prev} → ${curr}`;
    return curr || prev || 'Not reviewed';
};

const activePlans = (si) => (si.companion_plans || []).filter((p) => !p.abandoned);

const planLine = (p) => `${p.name}${p.plan_status ? ` (${p.plan_status})` : ''}`;

/**
 * Build the copyable summary for one working-group card.
 *
 * Input:
 *   workingGroup    group name ("Instructional Materials")
 *   planIdentifier  "2025-2026-ssu-ins"
 *   campusName      "Sonoma State"
 *   leads           [{name, title}]
 *   members         [{name, title}], this campus only, leads excluded
 *   indicators      the prioritized indicators [{composite_key, success_indicator,
 *                   status_level, previous_status_level, companion_plans}]
 *   communities     [{name, members: [{name}], stakes: [{composite_key}]}],
 *                   members already filtered to this campus
 *
 * Returns { html, plainText, rowCount } so the caller can say "nothing to copy".
 */
export function buildWorkingGroupPlanReport({
    workingGroup = 'Working group',
    planIdentifier = '',
    campusName = '',
    leads = [],
    members = [],
    indicators = [],
    communities = [],
} = {}) {
    const title = campusName ? `${workingGroup} · ${campusName}` : workingGroup;
    const subtitle = `ATI working group plan${planIdentifier ? ` ${planIdentifier}` : ''}`;
    const people = [
        ...leads.map((p) => ({ ...p, role: 'Lead' })),
        ...members.map((p) => ({ ...p, role: 'Member' })),
    ];

    const peopleHtml = people.length
        ? table(
            th('Name', '30%') + th('Role', '12%') + th('Title', '58%'),
            people.map((p) => '<tr>'
                + td(`<strong>${esc(p.name)}</strong>`)
                + td(esc(p.role))
                + td(esc(p.title || ''))
                + '</tr>').join(''),
        )
        : empty('No leads or members recorded.');

    const indicatorsHtml = indicators.length
        ? table(
            th('Indicator', '10%') + th('Success indicator', '46%') + th('Maturity', '16%') + th('Plans', '28%'),
            indicators.map((si) => '<tr>'
                + td(`<strong>${esc(si.composite_key)}</strong>`, 'white-space:nowrap;')
                + td(esc(si.success_indicator || ''))
                + td(esc(maturity(si)))
                + td(activePlans(si).map((p) => esc(planLine(p))).join('<br>') || 'No plan')
                + '</tr>').join(''),
        )
        : empty('No indicators prioritized.');

    const communitiesHtml = communities.length
        ? table(
            th('Community', '24%') + th(`People at ${esc(campusName || 'this campus')}`, '36%') + th('Indicator stakes', '40%'),
            communities.map((c) => '<tr>'
                + td(`<strong>${esc(c.name)}</strong>`)
                + td((c.members || []).map((m) => esc(m.name)).join(', ') || 'Nobody at this campus')
                + td((c.stakes || []).map((s) => esc(s.composite_key)).join(', '))
                + '</tr>').join(''),
        )
        : empty('No community holds a stake in this group\'s indicators.');

    const html = `<div style="${FONT}">`
        + `<p style="margin:0 0 2px 0;font-size:16px;font-weight:bold;color:${NAVY};${FONT}">${esc(title)}</p>`
        + `<p style="margin:0 0 4px 0;font-size:11px;color:${MUTED};${FONT}">${esc(subtitle)}</p>`
        + sectionHeading(`Leads &amp; members (${people.length})`)
        + peopleHtml
        + sectionHeading(`Prioritized indicators (${indicators.length})`)
        + indicatorsHtml
        + sectionHeading(`Communities of practice (${communities.length})`)
        + communitiesHtml
        + '</div>';

    const lines = [title, subtitle, '', `LEADS & MEMBERS (${people.length})`];
    people.forEach((p) => lines.push(`  - ${p.name} (${p.role})${p.title ? `: ${p.title}` : ''}`));
    lines.push('', `PRIORITIZED INDICATORS (${indicators.length})`);
    indicators.forEach((si) => {
        lines.push(`  - ${si.composite_key}: ${si.success_indicator || ''}`);
        lines.push(`      Maturity: ${maturity(si)}`);
        const plans = activePlans(si);
        lines.push(`      Plans: ${plans.length ? plans.map(planLine).join('; ') : 'No plan'}`);
    });
    lines.push('', `COMMUNITIES OF PRACTICE (${communities.length})`);
    communities.forEach((c) => {
        const names = (c.members || []).map((m) => m.name).join(', ') || 'Nobody at this campus';
        const keys = (c.stakes || []).map((s) => s.composite_key).join(', ');
        lines.push(`  - ${c.name}: ${names}${keys ? ` | Stakes: ${keys}` : ''}`);
    });

    return {
        html,
        plainText: lines.join('\n'),
        rowCount: people.length + indicators.length + communities.length,
    };
}

export default buildWorkingGroupPlanReport;
