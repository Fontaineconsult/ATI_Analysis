/*
 * The canonical rich report fixture — one get_indicator_report payload both page suites
 * render. The point is drift protection: a change to the payload contract, or a
 * regression in a shared block, fails BOTH suites instead of whichever one happened to
 * model that field. Extend it here, not by re-declaring fields in a page test.
 */
export const REPORT = {
    indicator: {
        composite_key: '1.2-web',
        goal_number: 1,
        goal_name: 'Accessible web presence',
        success_indicator: 'Top pages meet WCAG 2.1 AA.',
        working_group: 'Web',
        override_implementation_requirement: false,
    },
    year: '2025-2026',
    campus: { abbreviation: 'sfsu', name: 'San Francisco State University' },
    status: { status_level: 'Defined', previous_status_level: 'Initiated' },
    yse: {
        administrative_review_complete: true,
        administrative_review_completed_date: '2026-03-01',
        admin_review_description: 'Reviewed against the rubric.',
        priority_level: 'High',
        documentation_status: 'in_progress',
        worked_on_in_current_year: true,
        will_work_on_next_year: true,
        ready_for_admin_review: true,
    },
    people: {
        implementers: [{ unique_id: 'p1', name: 'Ivy Implementer', title: 'Web Lead', email: 'ivy@example.edu', roles: [{ handle: 'role:lead', name: 'Lead' }] }],
        admin_review_completed_by: { unique_id: 'r2', name: 'Reviewer Rita' },
    },
    admin_review_notes: [
        { unique_id: 'an1', content: 'Needs more evidence next year.', dateCreated: '2026-02-01', created_by: { unique_id: 'a1', name: 'Ann Admin' } },
    ],
    implementations: [
        {
            type: 'Process', unique_id: 'i1', title: 'Homepage audit process', description: 'Quarterly audit.',
            owner: { name: 'Owen Owner' }, accountable_working_group: 'Web', dimensions: [],
            documents: [{ unique_id: 'd1', name: 'Audit Report', file: { download_url: '/ati/data-api/v1/files/abc?name=audit.pdf', size: 2048, uploaded_date: '2026-01-02' }, file_path: null, uri_path: null }],
            webpages: [{ unique_id: 'w1', name: 'Old audit page', url: 'https://example.invalid/old', no_longer_exists: true }],
            notes: [],
            messages: [{ unique_id: 'm1', content: 'Kickoff email to the team', date_created: '2026-01-05', file: { download_url: '/ati/data-api/v1/files/msg1?name=email.eml' } }],
            metrics: [],
            participants: [{ person: { unique_id: 'p2', name: 'Pat Participant' }, role_handle: 'role:auditor', note: 'ran the manual pass' }],
            remediates_interfaces: [],
        },
    ],
    taaps: [
        {
            unique_id: 't1', title: 'Interim access plan', owner: { name: 'Tia Owner' },
            signed_by: [{ unique_id: 's1', name: 'Sam Signer' }], covers_assets: [],
            documents: [], webpages: [],
            notes: [{ unique_id: 'tn1', content: 'Signed off by the committee.', dateCreated: '2026-01-10' }],
            messages: [],
        },
    ],
    assets: [], interfaces: [],
    tools: [{ unique_id: 'tool1', title: 'Pope Tech', tool_identifier: 'pope-tech' }],
    vendors: [{ unique_id: 'v1', name: 'Acme Accessibility', sales_contact_email: 'sales@acme.test' }],
    plans: [{ unique_id: 'pl1', name: 'Remediation plan', plan_status: 'In Progress', is_key_plan: true }],
    accomplishments: [],
    notes: [],
    messages: [{ unique_id: 'ym1', content: 'Year-level status message', date_created: '2026-04-01', file: { download_url: '/ati/data-api/v1/files/yse1?name=y.pdf' } }],
    metrics: [],
};
