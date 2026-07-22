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
