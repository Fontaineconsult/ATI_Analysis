"""Public server-rendered indicator report pages (/ati/reports/public/...).

Two layers: pure sanitizer unit tests (the allowlist security boundary) and
endpoint tests against live data — including the golden pair: the page renders
WITHOUT a session even when AUTH_ENFORCED is on, and never contains an email.
"""
import pytest

from app.public_reports.sanitize import public_report_payload


# ---------------------------------------------------------------------------
# Sanitizer — the allowlist boundary
# ---------------------------------------------------------------------------

RAW = {
    "indicator": {
        "composite_key": "1.1-web", "success_indicator": "Assigned authority…",
        "goal_number": 1, "goal_name": "Web Evaluation", "working_group": "Web",
        "examples_of_evidence": ["A charter"], "override_implementation_requirement": False,
        "removed": False,
    },
    "year": "2025-2026",
    "campus": {"abbreviation": "sfsu", "name": "San Francisco State University"},
    "status": {"status_level": "Defined", "status_value": 2,
               "previous_status_level": "Initiated", "previous_status_value": 1},
    "yse": {
        "administrative_review_complete": True,
        "administrative_review_completed_date": "2026-05-01",
        "admin_review_description": "Reviewer evidence summary for the cycle",
        "ready_for_admin_review": True,
    },
    "people": {
        "implementers": [{
            "unique_id": "p1", "name": "Pat Person", "title": "Director",
            "email": "pat@sfsu.edu", "ati_role": "Lead",
            "roles": [{"handle": "role:auditor", "name": "Auditor"}],
        }],
        "admin_reviewers": [{"name": "Rev Iewer", "email": "rev@sfsu.edu"}],
        "admin_review_completed_by": {"name": "Ann Approver", "email": "ann@sfsu.edu"},
    },
    "admin_review_notes": [{
        "name": "rn1", "content": "Kept review note", "dateCreated": "2026-04-01",
        "created_by": {"name": "Ann Approver", "email": "ann@sfsu.edu"},
    }],
    "recommendations": [
        {
            "recommendation": "Document the intake triage",
            "detail": "Write it down.", "status": "open", "resolution": None,
            "date_created": "2026-08-11", "date_resolved": None,
            "created_by": {"unique_id": "p9", "name": "Rita Reviewer"},
        },
        {
            "recommendation": "Buy a different platform",
            "detail": None, "status": "dismissed",
            "resolution": "Out of scope for this cycle.",
            "date_created": "2026-08-11", "date_resolved": "2026-08-11",
            "created_by": None,
        },
    ],
    "concerns": [
        {
            "concern": "No designated 504 coordinator",
            "detail": "Nobody holds the role.", "status": "open", "resolution": None,
            "date_raised": "2026-08-19", "date_resolved": None,
            "raised_by": {"unique_id": "p8", "name": "Carla Concerned"},
            "became": None,
        },
        {
            "concern": "Vendor portal is unusable",
            "detail": None, "status": "converted",
            "resolution": "Converted to a recommendation.",
            "date_raised": "2026-08-19", "date_resolved": "2026-08-19",
            "raised_by": None,
            "became": {"kind": "recommendation", "text": "Replace the vendor portal"},
        },
        {
            "concern": "Coffee machine is broken",
            "detail": None, "status": "dismissed",
            "resolution": "Not an accessibility matter.",
            "date_raised": "2026-08-19", "date_resolved": "2026-08-19",
            "raised_by": None,
            "became": None,
        },
    ],
    "community_stakeholders": [
        {"name": "9999 Library Community", "note": "INTERNAL stake reasoning"},
    ],
    "implementations": [{
        "type": "Process", "title": "Audit process", "description": "Quarterly.",
        "strength": 3, "control": "external", "retired": True, "retired_date": "2026-06-30", "retired_note": "Superseded.",
        "owner": {"name": "Owen Owner", "email": "owen@sfsu.edu"},
        "accountable_working_group": "Web",
        "accountable_communities": ["9999 Library Community"],
        "dimensions": [{"handle": "d1", "name": "Governance"}],
        "participants": [{"person": {"name": "Team Member"}, "role_handle": "role:tester"}],
        "documents": [{"name": "Audit Report",
                       "file": {"download_url": "/ati/data-api/v1/files/secret"}}],
        "webpages": [{"name": "Public page", "url": "https://example.org/x", "no_longer_exists": False}],
        "notes": [{"name": "impl note", "content": "Kept note", "date_created": "2026-01-01",
                   "created_by": {"name": "Pat Person"}}],
        "messages": [{"name": "impl msg", "content": "Kept message", "date_created": "2026-01-02"}],
        "metrics": [{"name": "Pages audited", "single_value": "40", "comment": "manual"}],
    }],
    "taaps": [],
    "assets": [{
        "title": "Quartex", "asset_identifier": "quartex-sfsu", "unique_id": "a1",
        "asset_class": "vendor_hosted", "scope": "campus",
        "reached_via": ["remediated", "tool"], "description": "Digital collections\nplatform.",
    }],
    "interfaces": [{
        "title": "Primo Discovery", "interface_identifier": "alma--web--search--primo",
        "unique_id": "i1", "function": "search",
        "coverage_domains": ["library"], "audience": ["students"],
        "description": "Catalog search UI.",
    }],
    "tools": [{"title": "Pope Tech", "tool_identifier": "pope-tech", "unique_id": "t1",
               "description": "Automated scanning."}],
    "vendors": [{"name": "Acme", "location": "SF",
                 "sales_contact_name": "S", "sales_contact_email": "sales@acme.test",
                 "technical_contact_name": "T", "technical_contact_email": "tech@acme.test"}],
    "plans": [], "accomplishments": [],
    "notes": [{"name": "yse note", "content": "Year note", "date_created": "2026-02-01"}],
    "messages": [], "metrics": [],
}


@pytest.mark.unit
def test_sanitizer_strips_all_emails_and_internal_review_content():
    clean = public_report_payload(RAW)
    flat = str(clean)
    assert "@" not in flat, "no email address may survive the sanitizer"
    assert "INTERNAL" not in flat, "community stake notes must not survive"
    assert "secret" not in flat, "file download URLs must not survive"
    assert "admin_reviewers" not in clean.get("review", {})


@pytest.mark.unit
def test_sanitizer_keeps_notes_messages_and_report_facts():
    clean = public_report_payload(RAW)
    impl = clean["implementations"][0]
    assert impl["notes"][0]["content"] == "Kept note"
    assert impl["messages"][0]["content"] == "Kept message"
    assert impl["strength"] == 3 and impl["retired"] is True
    assert impl["control"] == "external", "the control flag must survive sanitization"
    assert impl["accountable_communities"] == ["9999 Library Community"]
    # Stakeholders survive as names only; the fixture's sole impl is retired, so
    # no community is accountable for evidenced work.
    assert clean["communities"] == {"accountable": [],
                                    "stakeholders": ["9999 Library Community"]}
    assert impl["documents"] == ["Audit Report"]
    assert impl["webpages"][0]["url"] == "https://example.org/x"
    assert clean["notes"][0]["content"] == "Year note"
    assert clean["review"] == {
        "complete": True, "ready": True,
        "completed_date": "2026-05-01", "completed_by": "Ann Approver",
        "evidence_summary": "Reviewer evidence summary for the cycle",
        "notes": [{"content": "Kept review note", "date": "2026-04-01"}],
    }
    assert clean["vendors"] == [{"name": "Acme", "location": "SF"}]
    # ICT Touched by This Work mirrors the internal report's table columns.
    assert clean["assets"] == [{
        "title": "Quartex", "identifier": "quartex-sfsu", "asset_class": "vendor_hosted",
        "scope": "campus", "reached_via": ["remediated", "tool"],
        "description": "Digital collections\nplatform.",
    }]
    assert clean["interfaces"] == [{
        "title": "Primo Discovery", "identifier": "alma--web--search--primo",
        "function": "search", "coverage_domains": ["library"], "audience": ["students"],
        "description": "Catalog search UI.",
    }]
    assert clean["tools"] == [{"title": "Pope Tech", "identifier": "pope-tech",
                               "description": "Automated scanning."}]
    assert len(clean["recommendations"]) == 1, "dismissed recommendations never reach a report"
    rec = clean["recommendations"][0]
    assert rec["recommendation"] == "Document the intake triage"
    assert rec["status"] == "open"
    assert "created_by" not in rec, "creator attribution stays off the public page"
    assert "Rita Reviewer" not in str(clean)
    assert "Buy a different platform" not in str(clean)

    # Concerns follow the same public-surface rules as recommendations.
    assert len(clean["concerns"]) == 2, "dismissed concerns never reach a report"
    con = clean["concerns"][0]
    assert con["concern"] == "No designated 504 coordinator"
    assert con["status"] == "open"
    assert "raised_by" not in con, "who raised it stays off the public page"
    assert "Carla Concerned" not in str(clean)
    assert "Coffee machine is broken" not in str(clean)
    # A converted concern publishes what it became, so the disposition is legible.
    converted = clean["concerns"][1]
    assert converted["became"] == "Replace the vendor portal"
    assert converted["became_kind"] == "recommendation"
    assert clean["implementers"][0] == {"name": "Pat Person", "title": "Director",
                                        "ati_role": "Lead", "roles": ["Auditor"]}


# ---------------------------------------------------------------------------
# Endpoint — live data, no session
# ---------------------------------------------------------------------------

PUBLIC_URL = "/ati/reports/public/sfsu/2025-2026/web/1/1"


@pytest.mark.api
def test_public_report_renders(flask_client):
    import re
    resp = flask_client.get(PUBLIC_URL)
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "1.1-web" in html
    assert "Evidence Graph" in html
    # Email-shaped strings only — a bare "@" also matches CSS @media rules.
    emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", html)
    assert not emails, f"public page must contain no email addresses: {emails[:3]}"
    # Sign-in-to-edit deep link into the authenticated app. AuthGate renders the
    # login screen AT that URL and then the app at the same URL — so this plain
    # link IS the whole post-login-redirect story.
    assert 'href="/ati/sfsu/dashboard/reports/web/1/1"' in html
    assert "Sign in to edit" in html
    # The Evidence Graph lockup is served by the blueprint's own static folder.
    assert "/ati/reports/public/static/sfbrn-logo-light-eg.svg" in html


@pytest.mark.unit
def test_implementation_sanitizer_strips_emails_and_builds_cross_links():
    from app.public_reports.sanitize import public_implementation_payload

    raw = {
        "type": "Process", "unique_id": "abc123", "title": "Audit process",
        "description": "Quarterly.", "retired": False,
        "owned_by": [{"name": "Owen Owner", "email": "owen@sfsu.edu", "employee_id": "E1"}],
        "supporting_documents": [{"name": "Report", "depreciated": False,
                                  "file": {"download_url": "/ati/data-api/v1/files/secret"}}],
        "supporting_webpages": [{"name": "Page", "url": "https://example.org/p"}],
        "supporting_notes": [{"name": "n", "content": "Kept note",
                              "created_by": {"name": "Pat", "email": "pat@sfsu.edu"}}],
        "supporting_messages": [], "supporting_metrics": [],
        "is_evidence_for": [{
            "year_identifier": "2025-2026-1.1-web-sfsu", "unique_id": "y1", "strength": 2, "control": "internal",
            "success_indicator": "Assigned authority…", "indicator_composite_key": "1.1-web",
            "campus": {"abbreviation": "sfsu", "name": "SFSU"},
        }],
        "dimensions": [], "participants": [{"person": {"name": "Team"}, "role_handle": "role:dev", "note": None}],
        "assets": [], "interfaces": [], "tools": [], "campuses": ["sfsu"],
    }
    clean = public_implementation_payload(raw)
    flat = str(clean)
    assert "@" not in flat
    assert "secret" not in flat
    assert clean["owners"] == ["Owen Owner"]
    assert clean["notes"][0] == {"name": "n", "content": "Kept note", "date": None, "created_by": "Pat"}
    ev = clean["evidence_for"][0]
    assert ev["public_url"] == "/ati/reports/public/sfsu/2025-2026/web/1/1"
    assert ev["strength"] == 2 and ev["year"] == "2025-2026"
    assert ev["control"] == "internal"


@pytest.mark.api
def test_public_implementation_page_renders_and_cross_links(flask_client):
    import re
    # Discover a real implementation through the public indicator page's link.
    report_html = flask_client.get(PUBLIC_URL).get_data(as_text=True)
    m = re.search(r'href="(/ati/reports/public/implementation/\w+/[\w-]+)"', report_html)
    assert m, "public report should cross-link at least one implementation"
    impl_url = m.group(1)

    resp = flask_client.get(impl_url)
    assert resp.status_code == 200
    html = resp.get_data(as_text=True)
    assert "Evidence For" in html
    assert "Sign in to edit" in html
    # Round trip: the implementation page links back to public indicator reports.
    assert "/ati/reports/public/sfsu/" in html
    emails = re.findall(r"[\w.+-]+@[\w-]+\.[\w.-]+", html)
    assert not emails, f"public implementation page must contain no emails: {emails[:3]}"


@pytest.mark.api
def test_public_implementation_unknown_type_or_uid_404(flask_client):
    assert flask_client.get("/ati/reports/public/implementation/NotAType/abc").status_code == 404
    assert flask_client.get("/ati/reports/public/implementation/Process/no-such-uid").status_code == 404


@pytest.mark.api
def test_public_logo_asset_is_served(flask_client):
    resp = flask_client.get("/ati/reports/public/static/sfbrn-logo-light-eg.svg")
    assert resp.status_code == 200
    assert b"<svg" in resp.data


@pytest.mark.api
def test_public_report_renders_without_auth_even_when_enforced(flask_client):
    app = flask_client.application
    original = app.config.get("AUTH_ENFORCED", False)
    app.config["AUTH_ENFORCED"] = True
    try:
        # Data API is locked…
        locked = flask_client.get("/ati/data-api/v1/settings")
        assert locked.status_code == 401
        # …but the public report is not.
        resp = flask_client.get(PUBLIC_URL)
        assert resp.status_code == 200
    finally:
        app.config["AUTH_ENFORCED"] = original


@pytest.mark.api
def test_public_report_kill_switch(flask_client):
    app = flask_client.application
    app.config["PUBLIC_REPORTS_ENABLED"] = False
    try:
        assert flask_client.get(PUBLIC_URL).status_code == 404
    finally:
        app.config["PUBLIC_REPORTS_ENABLED"] = True


@pytest.mark.api
def test_short_form_redirects_to_explicit_url(flask_client):
    resp = flask_client.get("/ati/reports/public/web/1/1")
    assert resp.status_code == 302
    assert "/ati/reports/public/sfsu/" in resp.headers["Location"]
    assert "/web/1/1" in resp.headers["Location"]


@pytest.mark.api
def test_unknown_working_group_and_year_404(flask_client):
    assert flask_client.get("/ati/reports/public/sfsu/2025-2026/nope/1/1").status_code == 404
    assert flask_client.get("/ati/reports/public/sfsu/1900-1901/web/1/1").status_code == 404
