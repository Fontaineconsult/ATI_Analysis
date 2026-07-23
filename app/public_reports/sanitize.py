"""Allowlist projection of the indicator-report payload for the public pages.

This is the security boundary: the template renders ONLY what this module
copies. Approved exclusions (2026-07 public-evidence-report scope):
  - No emails anywhere (people keep name/title/roles; vendors keep
    name/location only — all contact fields dropped).
  - Admin review: outcome only (complete flag, date, completer's name) —
    review notes, descriptions and reviewer assignments stay internal.
  - No file download URLs (the files endpoint is auth-guarded; documents
    list by name only). Webpage URLs stay — they're public web addresses.
  - Notes, messages and metrics ARE included (per approved scope), riding
    the payload's existing year / include_in_report curation.
"""


def _s(value):
    """None-safe string passthrough (dates arrive as date objects or strings)."""
    return str(value) if value is not None else None


def _person(p):
    if not p:
        return None
    return {
        'name': p.get('name'),
        'title': p.get('title'),
        'ati_role': p.get('ati_role'),
        'roles': [r.get('name') for r in (p.get('roles') or []) if r.get('name')],
    }


def _annotation(item):
    """Note/message/metric — content plus attribution, no file links."""
    if not item:
        return None
    created_by = item.get('created_by')
    if isinstance(created_by, dict):
        created_by = created_by.get('name')
    return {
        'name': item.get('name'),
        'content': item.get('content'),
        'date': _s(item.get('date_created')),
        'created_by': created_by,
        'single_value': item.get('single_value'),
        'comment': item.get('comment'),
        'metric_type': item.get('metric_type'),
    }


def _implementation(im):
    return {
        'type': im.get('type'),
        'title': im.get('title'),
        # Cross-link to the public implementation page (identifier only — safe).
        'public_url': (
            f"/ati/reports/public/implementation/{im.get('type')}/{im.get('unique_id')}"
            if im.get('type') and im.get('unique_id') else None
        ),
        'description': im.get('description'),
        'strength': im.get('strength'),
        'retired': bool(im.get('retired')),
        'retired_date': _s(im.get('retired_date')),
        'retired_note': im.get('retired_note'),
        'owner': (im.get('owner') or {}).get('name'),
        'accountable_working_group': im.get('accountable_working_group'),
        'dimensions': [d.get('name') for d in (im.get('dimensions') or []) if d.get('name')],
        'participants': [
            {
                'name': (p.get('person') or {}).get('name'),
                'role': (p.get('role_handle') or '').replace('role:', '') or None,
            }
            for p in (im.get('participants') or [])
            if (p.get('person') or {}).get('name')
        ],
        'documents': [d.get('name') for d in (im.get('documents') or []) if d.get('name')],
        'webpages': [
            {'name': w.get('name') or w.get('url'), 'url': w.get('url'),
             'gone': bool(w.get('no_longer_exists'))}
            for w in (im.get('webpages') or [])
        ],
        'notes': [_annotation(n) for n in (im.get('notes') or [])],
        'messages': [_annotation(m) for m in (im.get('messages') or [])],
        'metrics': [_annotation(m) for m in (im.get('metrics') or [])],
    }


_WG_SUFFIX_TO_SEGMENT = {'web': 'web', 'ins': 'instructional-materials', 'pro': 'procurement'}


def _public_indicator_url(composite_key, campus_abbrev, year):
    """Build the public report URL for an evidence link's indicator, or None
    when the composite key doesn't parse (defensive — never breaks the page)."""
    try:
        numbers, suffix = composite_key.split('-', 1)
        goal, si = numbers.split('.', 1)
        segment = _WG_SUFFIX_TO_SEGMENT[suffix]
        return f"/ati/reports/public/{campus_abbrev}/{year}/{segment}/{int(goal)}/{int(si)}"
    except (AttributeError, KeyError, ValueError):
        return None


def public_implementation_payload(impl):
    """Allowlist projection of one implementation (area-list shape) for the
    public page. Same exclusions as the indicator report: no emails, no file
    download URLs; notes/messages/metrics included."""
    def _created_by(item):
        cb = item.get('created_by')
        return cb.get('name') if isinstance(cb, dict) else None

    evidence_for = []
    for link in (impl.get('is_evidence_for') or []):
        campus = (link.get('campus') or {})
        year = (link.get('year_identifier') or '')[:9] or None
        evidence_for.append({
            'composite_key': link.get('indicator_composite_key'),
            'success_indicator': link.get('success_indicator'),
            'campus': campus.get('abbreviation'),
            'campus_name': campus.get('name'),
            'year': year,
            'strength': link.get('strength'),
            'public_url': _public_indicator_url(
                link.get('indicator_composite_key'), campus.get('abbreviation'), year,
            ) if campus.get('abbreviation') and year else None,
        })
    evidence_for.sort(key=lambda e: (e['year'] or '', e['composite_key'] or ''), reverse=True)

    return {
        'type': impl.get('type'),
        'unique_id': impl.get('unique_id'),
        'title': impl.get('title'),
        'description': impl.get('description'),
        'retired': bool(impl.get('retired')),
        'retired_date': _s(impl.get('retired_date')),
        'retired_note': impl.get('retired_note'),
        'owners': [p.get('name') for p in (impl.get('owned_by') or []) if p.get('name')],
        'dimensions': [d.get('name') for d in (impl.get('dimensions') or []) if d.get('name')],
        'participants': [
            {
                'name': (p.get('person') or {}).get('name'),
                'role': (p.get('role_handle') or '').replace('role:', '') or None,
                'note': p.get('note'),
            }
            for p in (impl.get('participants') or [])
            if (p.get('person') or {}).get('name')
        ],
        'campuses': impl.get('campuses') or [],
        'evidence_for': evidence_for,
        'documents': [
            {'name': d.get('name'), 'deprecated': bool(d.get('depreciated'))}
            for d in (impl.get('supporting_documents') or []) if d.get('name')
        ],
        'webpages': [
            {'name': w.get('name') or w.get('url'), 'url': w.get('url'),
             'gone': bool(w.get('no_longer_exists')), 'deprecated': bool(w.get('depreciated'))}
            for w in (impl.get('supporting_webpages') or [])
        ],
        'notes': [
            {'name': n.get('name'), 'content': n.get('content'),
             'date': _s(n.get('date_created')), 'created_by': _created_by(n)}
            for n in (impl.get('supporting_notes') or [])
        ],
        'messages': [
            {'name': m.get('name'), 'content': m.get('content'),
             'date': _s(m.get('date_created')), 'created_by': _created_by(m)}
            for m in (impl.get('supporting_messages') or [])
        ],
        'metrics': [
            {'name': m.get('name'), 'single_value': m.get('single_value'),
             'comment': m.get('comment'), 'metric_type': m.get('metric_type')}
            for m in (impl.get('supporting_metrics') or [])
        ],
        'assets': [
            {'title': a.get('title'), 'identifier': a.get('asset_identifier')}
            for a in (impl.get('assets') or [])
        ],
        'interfaces': [
            {'title': i.get('title'), 'identifier': i.get('interface_identifier')}
            for i in (impl.get('interfaces') or [])
        ],
        'tools': [
            {'title': t.get('title'), 'identifier': t.get('tool_identifier')}
            for t in (impl.get('tools') or [])
        ],
    }


def public_report_payload(report):
    indicator = report.get('indicator') or {}
    status = report.get('status') or {}
    yse = report.get('yse') or {}
    people = report.get('people') or {}
    completed_by = people.get('admin_review_completed_by') or {}

    return {
        'indicator': {
            'composite_key': indicator.get('composite_key'),
            'success_indicator': indicator.get('success_indicator'),
            'goal_number': indicator.get('goal_number'),
            'goal_name': indicator.get('goal_name'),
            'working_group': indicator.get('working_group'),
            'examples_of_evidence': indicator.get('examples_of_evidence') or [],
            'override_implementation_requirement': bool(indicator.get('override_implementation_requirement')),
        },
        'year': report.get('year'),
        'campus': {
            'abbreviation': (report.get('campus') or {}).get('abbreviation'),
            'name': (report.get('campus') or {}).get('name'),
        },
        'status': {
            'status_level': status.get('status_level'),
            'previous_status_level': status.get('previous_status_level'),
        },
        'review': {
            'complete': bool(yse.get('administrative_review_complete')),
            'completed_date': _s(yse.get('administrative_review_completed_date')),
            'completed_by': completed_by.get('name'),
        },
        'implementers': [_person(p) for p in (people.get('implementers') or [])],
        'implementations': [_implementation(im) for im in (report.get('implementations') or [])],
        'taaps': [
            {
                'title': t.get('title'),
                'description': t.get('description'),
                'outcome': t.get('outcome'),
                'active': bool(t.get('active')),
                'review_due': _s(t.get('review_due')),
                'notes': [_annotation(n) for n in (t.get('notes') or [])],
                'messages': [_annotation(m) for m in (t.get('messages') or [])],
            }
            for t in (report.get('taaps') or [])
        ],
        'assets': [
            {'title': a.get('title'), 'identifier': a.get('asset_identifier')}
            for a in (report.get('assets') or [])
        ],
        'interfaces': [
            {'title': i.get('title'), 'identifier': i.get('interface_identifier')}
            for i in (report.get('interfaces') or [])
        ],
        'tools': [
            {'title': t.get('title'), 'identifier': t.get('tool_identifier')}
            for t in (report.get('tools') or [])
        ],
        'vendors': [
            {'name': v.get('name'), 'location': v.get('location')}
            for v in (report.get('vendors') or [])
        ],
        'plans': [
            {
                'name': p.get('name'),
                'status': p.get('plan_status'),
                'is_key_plan': bool(p.get('is_key_plan')),
                'abandoned_notes': p.get('abandoned_notes'),
            }
            for p in (report.get('plans') or [])
        ],
        'accomplishments': [
            {'name': a.get('name'), 'description': a.get('description')}
            for a in (report.get('accomplishments') or [])
        ],
        'notes': [_annotation(n) for n in (report.get('notes') or [])],
        'messages': [_annotation(m) for m in (report.get('messages') or [])],
        'metrics': [_annotation(m) for m in (report.get('metrics') or [])],
    }
