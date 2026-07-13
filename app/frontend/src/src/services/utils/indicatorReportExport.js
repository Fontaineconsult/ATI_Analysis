// Build an Outlook-safe HTML + plain-text export of a SINGLE-indicator evidence report — the
// same payload IndicatorReportView renders — as clean tables that paste cleanly into an email,
// a Word doc, or a spreadsheet. Mirrors the conventions of workingGroupStatusReport.js:
//   - <table> layout with inline styles + bgcolor attributes, web-safe fonts, explicit widths;
//   - no flex/grid/float, no border-radius/box-shadow, no <style> blocks or classes;
//   - every interpolated value HTML-escaped; a plain-text fallback is produced alongside.

// Outlook-safe palette (shared look with the working-group status report).
const NAVY = '#354A7A';
const LINK = '#40598F';
const BORDER = '#CBD5E0';
const HEAD_BG = '#EDF2F7';
const TEXT = '#2D3748';
const MUTED = '#718096';
const FONT = 'font-family:Arial,Helvetica,sans-serif;';

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isTrue = (v) => v === true || v === 'True';

const CELL = `padding:6px 8px;border:1px solid ${BORDER};vertical-align:top;${FONT}font-size:12px;color:${TEXT};`;
const TH = `padding:6px 8px;border:1px solid ${BORDER};${FONT}font-size:12px;font-weight:bold;color:#4A5568;text-align:left;background-color:${HEAD_BG};`;
const KEYCELL = `${CELL}width:230px;background-color:${HEAD_BG};font-weight:bold;color:${NAVY};`;

const STATUS_BADGE = {
    'not started': { bg: '#FED7D7', fg: '#822727' },
    'initiated':   { bg: '#FEEBC8', fg: '#7B341E' },
    'defined':     { bg: '#FEFCBF', fg: '#744210' },
    'established': { bg: '#C6F6D5', fg: '#22543D' },
    'managed':     { bg: '#9AE6B4', fg: '#22543D' },
    'optimizing':  { bg: '#68D391', fg: '#1C4532' },
};

function statusBadge(status) {
    if (!status) return `<span style="color:${MUTED};">—</span>`;
    const c = STATUS_BADGE[String(status).toLowerCase()] || { bg: '#E2E8F0', fg: '#4A5568' };
    return `<span style="display:inline-block;background-color:${c.bg};color:${c.fg};`
        + `font-weight:bold;font-size:11px;padding:2px 8px;border-radius:3px;${FONT}">${esc(status)}</span>`;
}

const link = (href, text) => `<a href="${esc(href)}" style="color:${LINK};text-decoration:none;">${esc(text)}</a>`;
const linkOrText = (text, href) => (href ? link(href, text) : esc(text));

// Managed uploads carry a root-relative download_url; make it absolute for email.
const artifactHref = (node, origin) => {
    if (node?.file?.download_url) return `${origin || ''}${node.file.download_url}`;
    return node?.uri_path || node?.file_path || null;
};
const implHref = (type, uid, campus, origin) => (campus && type && uid)
    ? `${origin || ''}/ati/${campus}/ati-explorer/implementations/${type}/${uid}` : null;

const dateTail = (d) => (d ? ` <span style="color:${MUTED};font-size:11px;">(${esc(d)})</span>` : '');

// ── generic table helpers ───────────────────────────────────────────────────
function dataTable(headers, rows) {
    if (!rows.length) return '';
    let h = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;${FONT}margin:0 0 12px 0;">`;
    if (headers) {
        h += `<tr bgcolor="${HEAD_BG}">` + headers.map((x) => `<th style="${TH}">${esc(x)}</th>`).join('') + `</tr>`;
    }
    for (const row of rows) {
        h += `<tr>` + row.map((c) => `<td style="${CELL}">${c}</td>`).join('') + `</tr>`;
    }
    return h + `</table>`;
}

function kvTable(pairs) {
    const rows = pairs.filter(([, v]) => v != null && v !== '');
    if (!rows.length) return '';
    let h = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;${FONT}margin:0 0 12px 0;">`;
    for (const [k, v] of rows) h += `<tr><td style="${KEYCELL}">${esc(k)}</td><td style="${CELL}">${v}</td></tr>`;
    return h + `</table>`;
}

const heading = (title, count) =>
    `<h3 style="${FONT}color:${NAVY};font-size:15px;margin:16px 0 6px 0;">${esc(title)}`
    + `${count != null ? ` <span style="color:${MUTED};font-weight:normal;font-size:12px;">(${count})</span>` : ''}</h3>`;

const emptyNote = () => `<p style="${FONT}color:${MUTED};font-size:12px;margin:0 0 12px 0;">None recorded for this year.</p>`;

// ── artifact list (documents/webpages/notes/messages/metrics) ───────────────
function artifactsHtml(o, origin) {
    const items = [];
    (o.documents || []).forEach((d) => {
        const flags = [
            isTrue(d.is_administrative_review_documentation) ? '[admin review]' : '',
            isTrue(d.is_milestone_and_measures_documentation) ? '[milestones]' : '',
            isTrue(d.depreciated) ? '[deprecated]' : '',
        ].filter(Boolean).join(' ');
        items.push(`<b>FILE</b> ${linkOrText(d.name || 'Document', artifactHref(d, origin))}${flags ? ` <span style="color:${MUTED};font-size:11px;">${flags}</span>` : ''}`);
    });
    (o.webpages || []).forEach((w) => {
        if (isTrue(w.no_longer_exists)) {
            items.push(`<b>GONE</b> <s>${esc(w.name || w.url)}</s> <span style="color:#C53030;font-size:11px;">[no longer available]</span>`);
        } else {
            items.push(`<b>WEB</b> ${linkOrText(w.name || w.url, w.url)}${isTrue(w.depreciated) ? ` <span style="color:${MUTED};font-size:11px;">[deprecated]</span>` : ''}`);
        }
    });
    (o.notes || []).forEach((n) => items.push(`<b>NOTE</b> ${esc(n.content)}${dateTail(n.dateCreated || n.date_created)}`));
    (o.messages || []).forEach((m) => {
        const href = artifactHref(m, origin);
        items.push(`<b>MSG</b> ${esc(m.content || m.name)}${href ? ` ${link(href, '[attachment]')}` : ''}${dateTail(m.date_created)}`);
    });
    (o.metrics || []).forEach((m) => {
        const extra = [m.comment, m.academic_year].filter(Boolean).map(esc).join(' · ');
        items.push(`<b>METRIC</b> ${esc(m.name)}: <b>${esc(m.single_value ?? '—')}</b>${extra ? ` <span style="color:${MUTED};font-size:11px;">(${extra})</span>` : ''}`);
    });
    if (!items.length) return `<span style="color:${MUTED};">—</span>`;
    return items.map((i) => `<div style="margin-bottom:3px;">${i}</div>`).join('');
}

// ── section renderers ───────────────────────────────────────────────────────
function overviewHtml(report) {
    const { indicator, status, yse } = report;
    const prev = status?.previous_status_level;
    const curr = status?.status_level;
    const maturity = (prev || curr) ? `${statusBadge(prev)} &rarr; ${statusBadge(curr)}` : null;

    let h = kvTable([
        ['Working group', esc(indicator.working_group)],
        ['Goal', `Goal ${esc(indicator.goal_number)} — ${esc(indicator.goal_name)}`],
        ['Maturity (prev → current)', maturity],
        ['Priority', yse?.priority_level ? esc(yse.priority_level) : null],
        ['Worked on this year', yse?.worked_on_in_current_year ? 'Yes' : null],
        ['Continuing next year', yse?.will_work_on_next_year ? 'Yes' : null],
        ['Ready for admin review', yse?.ready_for_admin_review ? 'Yes' : null],
        ['Documentation status', yse?.documentation_status ? esc(yse.documentation_status) : null],
        ['Resources status', yse?.resources_status ? esc(yse.resources_status) : null],
        ['Implementation plan status', yse?.implementation_plan_status ? esc(yse.implementation_plan_status) : null],
        ['Exempt from implementation evidence', indicator.override_implementation_requirement ? 'Yes' : null],
    ]);

    // Administrative review block.
    const people = report.people || {};
    const parts = [`<b>${yse?.administrative_review_complete ? 'Complete' : 'Pending'}</b>`];
    if (yse?.administrative_review_completed_date) parts.push(esc(yse.administrative_review_completed_date));
    if (people.admin_review_completed_by?.name) parts.push(`by ${esc(people.admin_review_completed_by.name)}`);
    if ((people.admin_reviewers || []).length) parts.push(`reviewers: ${people.admin_reviewers.map((r) => esc(r.name)).join(', ')}`);
    h += `<p style="${FONT}font-size:12px;color:${TEXT};margin:0 0 6px 0;"><b style="color:${NAVY};">Administrative review:</b> ${parts.join(' · ')}</p>`;
    if (yse?.admin_review_description && yse.admin_review_description !== 'No Review') {
        h += `<p style="${FONT}font-size:12px;color:${TEXT};margin:0 0 6px 0;">${esc(yse.admin_review_description)}</p>`;
    }
    (report.admin_review_notes || []).forEach((n) => {
        const meta = [n.created_by?.name, n.dateCreated].filter(Boolean).map(esc).join(' · ');
        h += `<p style="${FONT}font-size:12px;color:${TEXT};margin:0 0 4px 12px;">• ${esc(n.content)}${meta ? ` <span style="color:${MUTED};font-size:11px;">— ${meta}</span>` : ''}</p>`;
    });
    return h;
}

function peopleHtml(report) {
    const impl = report.people?.implementers || [];
    if (!impl.length) return emptyNote();
    return dataTable(['Name', 'Title', 'Roles', 'Email'], impl.map((p) => [
        esc(p.name),
        p.title ? esc(p.title) : `<span style="color:${MUTED};">—</span>`,
        (p.roles || []).map((r) => esc(r.name)).join(', ') || `<span style="color:${MUTED};">—</span>`,
        p.email ? link(`mailto:${p.email}`, p.email) : `<span style="color:${MUTED};">—</span>`,
    ]));
}

function implementationsHtml(report, campus, origin) {
    const impls = report.implementations || [];
    if (!impls.length) {
        return report.indicator?.override_implementation_requirement
            ? `<p style="${FONT}color:${MUTED};font-size:12px;">Exempt from implementation evidence.</p>`
            : emptyNote();
    }
    return dataTable(['Implementation', 'Owner', 'Accountable', 'Team', 'Evidence'], impls.map((im) => {
        const href = implHref(im.type, im.unique_id, campus, origin);
        let title = `<b>${esc(im.type)}</b> — ${linkOrText(im.title, href)}`;
        if (isTrue(im.no_active_documents)) title += ` <span style="color:#C05621;font-size:11px;">⚠ no active docs</span>`;
        const dims = (im.dimensions || []).map((d) => esc(d.name)).join(', ');
        if (dims) title += `<div style="color:${MUTED};font-size:11px;">${dims}</div>`;
        if (im.description) title += `<div style="font-size:11px;margin-top:3px;">${esc(im.description)}</div>`;
        const team = (im.participants || []).map((p) => {
            const role = p.role_handle ? ` · ${esc(p.role_handle.replace(/^role:/, ''))}` : '';
            const note = p.note ? ` <span style="color:${MUTED};font-size:11px;">(${esc(p.note)})</span>` : '';
            return `${esc(p.person?.name)}${role}${note}`;
        }).join('<br>') || `<span style="color:${MUTED};">—</span>`;
        const remediates = (im.remediates_interfaces || []).map((i) => esc(i.title)).join(', ');
        const evidence = artifactsHtml(im, origin) + (remediates ? `<div style="font-size:11px;color:${MUTED};margin-top:3px;">Remediates: ${remediates}</div>` : '');
        return [
            title,
            im.owner?.name ? esc(im.owner.name) : `<span style="color:${MUTED};">—</span>`,
            im.accountable_working_group ? esc(im.accountable_working_group) : `<span style="color:${MUTED};">—</span>`,
            team,
            evidence,
        ];
    }));
}

function ictHtml(report, origin) {
    const { assets = [], interfaces = [], tools = [], vendors = [] } = report;
    if (!assets.length && !interfaces.length && !tools.length && !vendors.length) return emptyNote();
    let h = '';
    if (assets.length) {
        h += dataTable(['Asset', 'Class', 'Scope', 'Reached via', 'Description'], assets.map((a) => [
            `${esc(a.title)}<div style="color:${MUTED};font-size:11px;font-family:monospace;">${esc(a.asset_identifier)}</div>`,
            a.asset_class ? esc(a.asset_class.replace(/_/g, ' ')) : '—',
            a.scope ? esc(a.scope) : '—',
            (a.reached_via || []).map(esc).join(', ') || '—',
            a.description ? esc(a.description) : '—',
        ]));
    }
    if (interfaces.length) {
        h += dataTable(['Interface', 'Function', 'Coverage / Audience', 'Description'], interfaces.map((i) => [
            `${esc(i.title)}<div style="color:${MUTED};font-size:11px;font-family:monospace;">${esc(i.interface_identifier)}</div>`,
            i.function ? esc(i.function) : '—',
            [...(i.coverage_domains || []), ...(i.audience || [])].map(esc).join(', ') || '—',
            i.description ? esc(i.description) : '—',
        ]));
    }
    if (tools.length) {
        h += dataTable(['Tool', 'Identifier', 'Description'], tools.map((t) => [
            esc(t.title),
            t.tool_identifier ? `<span style="font-family:monospace;">${esc(t.tool_identifier)}</span>` : '—',
            t.description ? esc(t.description) : '—',
        ]));
    }
    if (vendors.length) {
        h += dataTable(['Vendor', 'Location', 'Contacts'], vendors.map((v) => {
            const contacts = [
                v.sales_contact_email ? `Sales: ${link(`mailto:${v.sales_contact_email}`, v.sales_contact_email)}` : '',
                v.technical_contact_email ? `Tech: ${link(`mailto:${v.technical_contact_email}`, v.technical_contact_email)}` : '',
            ].filter(Boolean).join('<br>') || '—';
            return [esc(v.name), v.location ? esc(v.location) : '—', contacts];
        }));
    }
    return h;
}

function taapsHtml(report, origin) {
    const taaps = report.taaps || [];
    if (!taaps.length) return emptyNote();
    return dataTable(['Plan', 'Owner', 'Signed by', 'Covers', 'Review due', 'Evidence'], taaps.map((t) => [
        `${esc(t.title)}${t.description ? `<div style="font-size:11px;margin-top:3px;">${esc(t.description)}</div>` : ''}`,
        t.owner?.name ? esc(t.owner.name) : '—',
        (t.signed_by || []).map((s) => esc(s.name)).join(', ') || '—',
        (t.covers_assets || []).map((a) => esc(a.title)).join(', ') || '—',
        t.review_due ? esc(t.review_due) : '—',
        artifactsHtml(t, origin),
    ]));
}

function plansHtml(report) {
    const plans = report.plans || [];
    const accs = report.accomplishments || [];
    if (!plans.length && !accs.length) return emptyNote();
    let h = '';
    if (plans.length) {
        h += dataTable(['Plan', 'Status', 'Description'], plans.map((p) => {
            const flags = [p.is_key_plan ? 'Key' : '', p.is_campus_plan ? 'Campus plan' : ''].filter(Boolean).join(', ');
            const statusText = p.abandoned ? 'Abandoned' : (p.plan_status || '—');
            return [
                `${esc(p.name)}${flags ? ` <span style="color:${MUTED};font-size:11px;">(${flags})</span>` : ''}`,
                esc(statusText),
                p.description ? esc(p.description) : '—',
            ];
        }));
    }
    if (accs.length) {
        h += dataTable(['Accomplishment', 'Description'], accs.map((a) => [esc(a.name), a.description ? esc(a.description) : '—']));
    }
    return h;
}

function yseArtifactsHtml(report, origin) {
    const { notes = [], messages = [], metrics = [] } = report;
    if (!notes.length && !messages.length && !metrics.length) return emptyNote();
    return artifactsHtml({ notes, messages, metrics }, origin);
}

// ── plain-text fallback ─────────────────────────────────────────────────────
function plainText(report, campus, origin) {
    const { indicator, status, yse } = report;
    const L = [];
    L.push(`${indicator.composite_key} — ${indicator.success_indicator}`);
    L.push(`Goal ${indicator.goal_number}: ${indicator.goal_name} · ${indicator.working_group} · ${(campus || '').toUpperCase()} · ${report.year}`);
    L.push('');
    L.push('STATUS & ADMIN REVIEW');
    L.push(`  Maturity: ${status?.previous_status_level || '—'} -> ${status?.status_level || '—'}`);
    const flags = [
        yse?.priority_level ? `Priority: ${yse.priority_level}` : null,
        yse?.worked_on_in_current_year ? 'Worked on this year' : null,
        yse?.will_work_on_next_year ? 'Continuing next year' : null,
        yse?.ready_for_admin_review ? 'Ready for admin review' : null,
        yse?.documentation_status ? `Docs: ${yse.documentation_status}` : null,
        yse?.resources_status ? `Resources: ${yse.resources_status}` : null,
        yse?.implementation_plan_status ? `Plan: ${yse.implementation_plan_status}` : null,
    ].filter(Boolean);
    if (flags.length) L.push(`  ${flags.join(' · ')}`);
    const rev = [`Admin review: ${yse?.administrative_review_complete ? 'Complete' : 'Pending'}`];
    if (yse?.administrative_review_completed_date) rev.push(yse.administrative_review_completed_date);
    if (report.people?.admin_review_completed_by?.name) rev.push(`by ${report.people.admin_review_completed_by.name}`);
    L.push(`  ${rev.join(' · ')}`);
    (report.admin_review_notes || []).forEach((n) => L.push(`    • ${n.content}${n.created_by?.name ? ` — ${n.created_by.name}` : ''}`));

    const people = report.people?.implementers || [];
    L.push('', `PEOPLE (${people.length})`);
    if (people.length) people.forEach((p) => L.push(`  • ${p.name}${p.title ? ` (${p.title})` : ''}${p.email ? ` <${p.email}>` : ''}${(p.roles || []).length ? ` [${p.roles.map((r) => r.name).join(', ')}]` : ''}`));
    else L.push('  (none)');

    const artifactLines = (o, pad) => {
        (o.documents || []).forEach((d) => L.push(`${pad}FILE ${d.name || 'Document'}${artifactHref(d, origin) ? ` — ${artifactHref(d, origin)}` : ''}${isTrue(d.depreciated) ? ' [deprecated]' : ''}`));
        (o.webpages || []).forEach((w) => L.push(`${pad}${isTrue(w.no_longer_exists) ? 'GONE' : 'WEB'} ${w.name || w.url}${!isTrue(w.no_longer_exists) && w.url ? ` — ${w.url}` : ''}${isTrue(w.no_longer_exists) ? ' [no longer available]' : ''}`));
        (o.notes || []).forEach((n) => L.push(`${pad}NOTE ${n.content}`));
        (o.messages || []).forEach((m) => L.push(`${pad}MSG ${m.content || m.name}${artifactHref(m, origin) ? ` — ${artifactHref(m, origin)}` : ''}`));
        (o.metrics || []).forEach((m) => L.push(`${pad}METRIC ${m.name}: ${m.single_value ?? '—'}`));
    };

    const impls = report.implementations || [];
    L.push('', `IMPLEMENTATION EVIDENCE (${impls.length})`);
    if (impls.length) {
        impls.forEach((im) => {
            L.push(`  - [${im.type}] ${im.title}${implHref(im.type, im.unique_id, campus, origin) ? ` — ${implHref(im.type, im.unique_id, campus, origin)}` : ''}`);
            if (im.owner?.name) L.push(`      Owner: ${im.owner.name}`);
            if (im.accountable_working_group) L.push(`      Accountable: ${im.accountable_working_group}`);
            (im.participants || []).forEach((p) => L.push(`      Team: ${p.person?.name}${p.role_handle ? ` · ${p.role_handle.replace(/^role:/, '')}` : ''}${p.note ? ` (${p.note})` : ''}`));
            artifactLines(im, '      ');
        });
    } else L.push(report.indicator?.override_implementation_requirement ? '  (exempt from implementation evidence)' : '  (none)');

    const ict = [
        ...(report.assets || []).map((a) => `  Asset: ${a.title} [${a.asset_identifier}]`),
        ...(report.interfaces || []).map((i) => `  Interface: ${i.title} [${i.interface_identifier}]`),
        ...(report.tools || []).map((t) => `  Tool: ${t.title}${t.tool_identifier ? ` [${t.tool_identifier}]` : ''}`),
        ...(report.vendors || []).map((v) => `  Vendor: ${v.name}${v.sales_contact_email ? ` <${v.sales_contact_email}>` : ''}`),
    ];
    L.push('', `ICT FOOTPRINT`);
    L.push(ict.length ? ict.join('\n') : '  (none)');

    const taaps = report.taaps || [];
    L.push('', `TEMPORARY ALTERNATE ACCESS PLANS (${taaps.length})`);
    if (taaps.length) taaps.forEach((t) => {
        L.push(`  - ${t.title}${t.owner?.name ? ` — owner ${t.owner.name}` : ''}${(t.signed_by || []).length ? ` — signed ${t.signed_by.map((s) => s.name).join(', ')}` : ''}`);
        artifactLines(t, '      ');
    });
    else L.push('  (none)');

    const plans = report.plans || [];
    const accs = report.accomplishments || [];
    L.push('', `PLANS & ACCOMPLISHMENTS`);
    if (plans.length || accs.length) {
        plans.forEach((p) => L.push(`  Plan: ${p.name} [${p.abandoned ? 'Abandoned' : (p.plan_status || '—')}]`));
        accs.forEach((a) => L.push(`  Accomplishment: ${a.name}`));
    } else L.push('  (none)');

    L.push('', `NOTES, MESSAGES & METRICS`);
    const yseArts = { notes: report.notes || [], messages: report.messages || [], metrics: report.metrics || [] };
    if (yseArts.notes.length || yseArts.messages.length || yseArts.metrics.length) artifactLines(yseArts, '  ');
    else L.push('  (none)');

    return L.join('\n');
}

/**
 * Build the copy-paste export for one single-indicator report.
 * @param {object} report  the get_indicator_report payload (as IndicatorReportView receives)
 * @param {{origin?:string}} opts
 * @returns {{ html:string, plainText:string }}
 */
export function buildIndicatorReport(report, { origin } = {}) {
    if (!report || !report.indicator) return { html: '', plainText: '' };
    const campus = report.campus?.abbreviation || '';
    const campusLabel = report.campus?.name || campus.toUpperCase() || 'Campus';
    const ind = report.indicator;

    let html = `<div style="${FONT}font-size:13px;color:${TEXT};">`;
    html += `<h2 style="${FONT}color:${NAVY};font-size:18px;margin:0 0 2px 0;">`
        + `<span style="font-family:monospace;">${esc(ind.composite_key)}</span> — ${esc(ind.success_indicator)}</h2>`;
    html += `<p style="${FONT}font-size:12px;color:${MUTED};margin:0 0 14px 0;">`
        + `Goal ${esc(ind.goal_number)}: ${esc(ind.goal_name)} · ${esc(ind.working_group)} · ${esc(campusLabel)} · ${esc(report.year)}</p>`;

    html += heading('Status & Administrative Review') + overviewHtml(report);
    html += heading('People', (report.people?.implementers || []).length) + peopleHtml(report);
    html += heading('Implementation Evidence', (report.implementations || []).length) + implementationsHtml(report, campus, origin);
    html += heading('ICT Footprint') + ictHtml(report, origin);
    html += heading('Temporary Alternate Access Plans', (report.taaps || []).length) + taapsHtml(report, origin);
    html += heading('Plans & Accomplishments') + plansHtml(report);
    html += heading('Notes, Messages & Metrics') + yseArtifactsHtml(report, origin);
    html += `</div>`;

    return { html, plainText: plainText(report, campus, origin) };
}

export default buildIndicatorReport;
