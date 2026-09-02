// Build the DRAFT markdown for a post-meeting follow-up, grouped by success
// indicator: what the record holds for each one, and what would close the gap.
//
// Markdown is the stored form (FollowUp.body_markdown) because it stays
// readable and diffable, and because the message is meant to be edited before
// it goes out. The email HTML is rendered FROM this markdown at copy time
// (followUpReport.js), so an edit here survives into the sent message.
//
// The generator states what is on file and what is outstanding. It does not
// characterise an indicator as fine or lacking — an empty ask list can mean the
// gaps were written as prose notes rather than as chaseable asks, and claiming
// "nothing outstanding" would launder that into a clean bill of health.

const STRENGTH_LABEL = {
    0: 'no contribution',
    1: 'indirect',
    2: 'partial',
    3: 'full',
};

function strengthText(strength) {
    if (strength === null || strength === undefined) return 'unrated';
    return STRENGTH_LABEL[strength] ?? String(strength);
}

// Pipe tables break when a cell contains an unescaped pipe.
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

function evidenceSection(evidence) {
    if (!evidence || !evidence.length) {
        return '_No implementation evidence is currently linked._\n';
    }
    const rows = evidence
        .map((e) => `| ${cell(e.title)} | ${cell(e.type)} | ${strengthText(e.strength)} |`)
        .join('\n');
    return [
        '| Evidence on file | Type | Strength |',
        '| --- | --- | --- |',
        rows,
    ].join('\n') + '\n';
}

function asksSection(row) {
    const items = [];
    (row.queries || []).forEach((q) => {
        const owner = q.answerable_by ? ` _(${cell(q.answerable_by)})_` : '';
        const kind = q.category === 'artifact_request' ? 'Please send' : 'Question';
        items.push(`- **${kind}:** ${cell(q.question)}${owner}`);
    });
    (row.recommendations || []).forEach((r) => {
        const text = typeof r === 'string' ? r : r.recommendation;
        items.push(`- **Recommendation:** ${cell(text)}`);
    });
    (row.concerns || []).forEach((c) => {
        const text = typeof c === 'string' ? c : c.concern;
        items.push(`- **Concern:** ${cell(text)}`);
    });

    if (!items.length) {
        return '_Nothing is recorded as outstanding against this indicator._\n';
    }
    return items.join('\n') + '\n';
}

/**
 * @param rows  the gap table (from fetchFollowUpTable)
 * @param meta  {meetingTitle, meetingDate, recipients:[{name}], community, campus, senderName}
 * @returns {{subject: string, markdown: string, askCount: number}}
 */
export function buildFollowUpMarkdown(rows = [], meta = {}) {
    const {
        meetingTitle = 'our meeting',
        meetingDate = '',
        recipients = [],
        community = '',
        campus = '',
        senderName = '',
    } = meta;

    const askCount = rows.reduce((n, r) => n
        + (r.queries?.length || 0)
        + (r.recommendations?.length || 0)
        + (r.concerns?.length || 0), 0);

    const names = recipients.map((p) => p.name?.split(' ')[0]).filter(Boolean);
    const greeting = names.length ? `Hi ${names.join(', ')},` : 'Hi all,';

    const scope = [community, campus ? campus.toUpperCase() : ''].filter(Boolean).join(' · ');
    const subject = `Follow-up: ${meetingTitle}${scope ? ` (${scope})` : ''}`;

    const head = [
        greeting,
        '',
        `Thank you for ${meetingDate ? `meeting on ${meetingDate}` : 'your time'}. `
        + 'Below is what the record now holds for each success indicator we covered, '
        + 'and what is still outstanding against it.',
        '',
        'Corrections are as useful as additions — if something below is wrong or out of '
        + 'date, that is worth knowing before it reaches a report.',
        '',
    ].join('\n');

    const body = rows.map((row) => [
        `## ${row.composite_key} — ${row.success_indicator || ''}`.trim(),
        '',
        `**Current status:** ${row.status_level || 'not set'}`,
        '',
        evidenceSection(row.evidence),
        '',
        '**To close**',
        '',
        asksSection(row),
    ].join('\n')).join('\n---\n\n');

    const tail = [
        '',
        '---',
        '',
        'If anything here should be attributed differently, or belongs to someone else '
        + 'entirely, please say so and I will re-route it.',
        '',
        senderName ? `Thanks,\n${senderName}` : 'Thanks,',
        '',
    ].join('\n');

    return {
        subject,
        markdown: head + body + tail,
        askCount,
    };
}
