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
