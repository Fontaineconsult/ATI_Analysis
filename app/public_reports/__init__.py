"""Unauthenticated, server-rendered indicator report pages.

Mounted at /ati/reports/public by create_app(). These pages assume the
campus-IP network perimeter — they carry NO session auth — so everything they
render passes through the sanitize.public_report_payload allowlist first: the
template never sees the raw report payload, and a field added to the internal
report cannot leak here by default.

Routing note: werkzeug ranks these static-prefix rules above the React
catch-all (/ati/<path:path>) automatically, so no special ordering is needed.
Links INTO these pages from the React app must be plain <a href> full-page
loads — React Router would otherwise swallow the path client-side.
"""
from flask import Blueprint, abort, current_app, redirect, render_template, url_for

from app.data_config import academic_years

public_reports = Blueprint(
    'public_reports', __name__,
    template_folder='templates',
    # Own static folder (served at <url_prefix>/static/...) — the app-level
    # static_folder points at the React build, which doesn't carry the raw
    # brand SVGs. app/frontend/tooling/make-eg-logo.js regenerates the copy
    # here alongside the frontend assets.
    static_folder='static',
)

# URL segment → composite-key working-group suffix (mirrors the React report
# routes' segment names).
_WG_SEGMENTS = {
    'web': 'web',
    'instructional-materials': 'ins',
    'procurement': 'pro',
}

_DEFAULT_CAMPUS = 'sfsu'


def _current_year():
    """Latest academic year in the vocabulary (YYYY-YYYY sorts lexically)."""
    return max(academic_years)


@public_reports.route('/<wg>/<int:goal>/<int:indicator>')
def indicator_report_default(wg, goal, indicator):
    """Short form — redirect to the explicit campus/year URL so shared links
    are stable archives rather than moving targets."""
    if not current_app.config.get('PUBLIC_REPORTS_ENABLED', True):
        abort(404)
    if wg not in _WG_SEGMENTS:
        abort(404)
    return redirect(url_for(
        'public_reports.indicator_report',
        campus=_DEFAULT_CAMPUS, year=_current_year(),
        wg=wg, goal=goal, indicator=indicator,
    ))


@public_reports.route('/<campus>/<year>/<wg>/<int:goal>/<int:indicator>')
def indicator_report(campus, year, wg, goal, indicator):
    if not current_app.config.get('PUBLIC_REPORTS_ENABLED', True):
        abort(404)
    if wg not in _WG_SEGMENTS or year not in academic_years:
        abort(404)

    # Imported at request time: the queries layer needs the data_api package
    # warmed up, which create_app() guarantees by the time requests arrive.
    from app.database.queries.compound_queries.get_indicator_report import get_indicator_report
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError
    from app.public_reports.sanitize import public_report_payload

    composite_key = f"{goal}.{indicator}-{_WG_SEGMENTS[wg]}"
    try:
        report = get_indicator_report(composite_key, year, campus_abbreviation=campus)
    except (NotFoundError, ValidationError):
        abort(404)

    # Deep link into the authenticated app's report view. No next= plumbing is
    # needed: AuthGate renders the login screen AT this URL when a session is
    # required, and after sign-in the app renders the same URL — the user lands
    # on this exact report. (The app's year selector defaults to the current
    # year; past-year reports need the year switched after arrival.)
    edit_url = f"/ati/{campus}/dashboard/reports/{wg}/{goal}/{indicator}"

    return render_template('public_report.html', r=public_report_payload(report), edit_url=edit_url)


@public_reports.route('/implementation/<impl_type>/<unique_id>')
def implementation_detail(impl_type, unique_id):
    """Public view of one implementation — its identity, evidence links (with
    cross-links to the public indicator reports), documentation names, and
    annotations. Not campus/year-scoped: the implementation node is shared."""
    if not current_app.config.get('PUBLIC_REPORTS_ENABLED', True):
        abort(404)

    from app.database.queries.implementation.read import get_implementation_detail
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError
    from app.public_reports.sanitize import public_implementation_payload

    try:
        impl = get_implementation_detail(impl_type, unique_id)
    except ValidationError:
        abort(404)
    if impl is None:
        abort(404)

    edit_url = f"/ati/{_DEFAULT_CAMPUS}/ati-explorer/implementations/{impl_type}/{unique_id}"
    return render_template(
        'public_implementation.html',
        im=public_implementation_payload(impl),
        edit_url=edit_url,
    )


@public_reports.route('/community/<unique_id>')
def community_review_spread_default(unique_id):
    """Short form — redirect to the explicit campus/year URL, same contract as
    the indicator short form: shared links resolve to stable archives."""
    if not current_app.config.get('PUBLIC_REPORTS_ENABLED', True):
        abort(404)
    return redirect(url_for(
        'public_reports.community_review_spread',
        campus=_DEFAULT_CAMPUS, year=_current_year(), unique_id=unique_id,
    ))


@public_reports.route('/community/<campus>/<year>/<unique_id>')
def community_review_spread(campus, year, unique_id):
    """A community of practice's review spread: every indicator it holds a stake
    in, with that campus/year's review state, each linking to the public evidence
    report. The shareable answer to "what of ours needs reviewing" — communities
    are campus-agnostic, so the campus in the URL picks whose evidence the stakes
    resolve to."""
    if not current_app.config.get('PUBLIC_REPORTS_ENABLED', True):
        abort(404)
    if year not in academic_years:
        abort(404)

    from app.database.queries.communities.read import get_community_review_spread
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
    from app.public_reports.sanitize import public_community_payload

    try:
        spread = get_community_review_spread(unique_id, year, campus)
    except NotFoundError:
        abort(404)

    edit_url = f"/ati/{campus}/ati-explorer/people/communities/{unique_id}"
    return render_template(
        'public_community.html',
        c=public_community_payload(spread),
        edit_url=edit_url,
    )


# ---------------------------------------------------------------------------
# TAAPs — the public register of Temporary Alternate Access Plans
# ---------------------------------------------------------------------------
# Plans in force (signed, under review, renewed) are public; drafts never appear.
# The eligibility rule lives in queries/assets/read.py::search_public_taaps and the
# field allowlist in sanitize.public_taap_payload. Pages are cacheable for five
# minutes: the register changes a few times a month, not per request.

_TAAP_CACHE = 'public, max-age=300'


def _taap_filters(args):
    """The register's query-string contract, shared by the HTML and JSON routes."""
    return {
        'q': (args.get('q') or '').strip() or None,
        'campus': (args.get('campus') or '').strip() or None,
        'year': (args.get('year') or '').strip() or None,
        'outcome': (args.get('outcome') or '').strip() or None,
        'group': (args.get('group') or '').strip() or None,
        'status': (args.get('status') or '').strip() or None,
        'page': args.get('page', 1),
    }


def _taap_search(filters):
    from app.database.queries.assets.read import search_public_taaps

    return search_public_taaps(
        q=filters['q'], campus=filters['campus'], academic_year=filters['year'],
        outcome=filters['outcome'], user_group=filters['group'], status=filters['status'],
        page=filters['page'],
    )


def _taap_filter_options():
    from app.data_config import taap_outcomes, taap_user_groups
    from app.database.queries.assets.read import PUBLIC_TAAP_STATUSES, public_taap_campuses
    from app.data_config import taap_statuses

    return {
        'campuses': public_taap_campuses(),
        'years': sorted(academic_years, reverse=True),
        'outcomes': taap_outcomes,
        'groups': taap_user_groups,
        'statuses': {k: taap_statuses[k] for k in PUBLIC_TAAP_STATUSES},
    }


@public_reports.route('/taaps')
def taap_register():
    """Searchable register of public TAAPs. Free text runs against the
    taap_public_search full-text index (plan, covered asset, vendor); filters
    narrow by campus, academic year, outcome, affected user group and status."""
    if not current_app.config.get('PUBLIC_REPORTS_ENABLED', True):
        abort(404)
    from flask import make_response, request
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError
    from app.public_reports.sanitize import public_taap_search_payload

    filters = _taap_filters(request.args)
    try:
        result = _taap_search(filters)
    except ValidationError:
        abort(400)
    payload = public_taap_search_payload(result, filters)
    html = render_template(
        'public_taaps.html', s=payload, options=_taap_filter_options(),
        edit_url=f"/ati/{filters['campus'] or _DEFAULT_CAMPUS}/ati-explorer/assets/taaps",
    )
    response = make_response(html)
    response.headers['Cache-Control'] = _TAAP_CACHE
    return response


@public_reports.route('/taaps.json')
def taap_register_json():
    """The register as JSON, same query-string contract as /taaps, for campus
    pages that embed the plans affecting their users."""
    if not current_app.config.get('PUBLIC_REPORTS_ENABLED', True):
        abort(404)
    from flask import jsonify, request
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError
    from app.public_reports.sanitize import public_taap_search_payload

    filters = _taap_filters(request.args)
    try:
        result = _taap_search(filters)
    except ValidationError as e:
        response = jsonify({'error': str(e)})
        response.status_code = 400
        return response
    response = jsonify(public_taap_search_payload(result, filters))
    response.headers['Cache-Control'] = _TAAP_CACHE
    return response


@public_reports.route('/taap/<taap_identifier>')
def taap_detail(taap_identifier):
    """One public plan: the stable address a product's accessibility statement
    can point at. 404 for unknown identifiers and for plans not yet in force."""
    if not current_app.config.get('PUBLIC_REPORTS_ENABLED', True):
        abort(404)
    from flask import make_response
    from app.database.queries.assets.read import get_public_taap
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
    from app.public_reports.sanitize import public_taap_payload

    try:
        row = get_public_taap(taap_identifier)
    except NotFoundError:
        abort(404)
    plan = public_taap_payload(row)
    html = render_template(
        'public_taap.html', t=plan,
        edit_url=f"/ati/{plan['campus'] or _DEFAULT_CAMPUS}/ati-explorer/assets/taaps/{taap_identifier}",
    )
    response = make_response(html)
    response.headers['Cache-Control'] = _TAAP_CACHE
    return response
