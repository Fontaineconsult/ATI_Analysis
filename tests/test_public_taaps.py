"""Public TAAP register (/ati/reports/public/taaps, /taaps.json, /taap/<id>).

Two layers, as for the other public pages: the sanitizer allowlist as a pure
unit test, then endpoint tests on sentinel data. The golden rules: the pages
render without a session even when AUTH_ENFORCED is on; drafts never appear;
and the only place an email may survive is inside the product-specific
accessibility statement, which the form instructs campuses to publish.
"""
import re

import pytest
from neomodel import db

SENTINEL = "9999-9999"
ASSET_ID = f"{SENTINEL}-public-taap-asset"
UNIT_NAME = f"{SENTINEL} Public TAAP Department"
VENDOR_NAME = f"{SENTINEL} Zebra Vendor"
SIGNER_NAME = f"{SENTINEL} Public TAAP Signer"
CAMPUS = "sfsu"
PUBLIC_TITLE = "Sentinel Zebrascope"
DRAFT_TITLE = "Sentinel Draft Lensware"

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")


# ---------------------------------------------------------------------------
# Sanitizer — the allowlist boundary
# ---------------------------------------------------------------------------

RAW_ROW = {
    "taap_identifier": "zebrascope-sfsu--biology--2026", "title": "Zebrascope",
    "campus": "sfsu", "campus_name": "San Francisco State University", "academic_year": "2026-2027",
    "asset_identifier": "zebrascope-sfsu", "asset_title": "Zebrascope", "asset_version": "4",
    "vendor": "Zebra Vendor", "requesting_unit": "Department of Biology",
    "outcome": "non_equal_alternative", "institutional_risk": "moderate",
    "accommodation_requirement": "moderate",
    "affected_user_groups": ["blindness", "low_vision"],
    "requirements_met": ["same_information", "no_disparate_burden"],
    "distribution_actions": ["point_of_access", "acr_repository"],
    "known_barriers": "Images lack text alternatives.",
    "accessibility_statement": "Barriers exist for screen reader users. Contact help@sfsu.edu for assistance.",
    "creation_date": "2026-09-02", "effective_date": "2026-09-05", "review_due": "2027-09-02",
    "taap_status": "signed", "template_version": "3.2 051225", "score": 1.5,
    # Fields the query never selects, planted here to prove the allowlist drops them anyway.
    "vendor_contact": "sales@zebra.test", "misc_notes": "Sara M. met Pat (pat@sfsu.edu).",
    "proposed_alternative": "Email prof@sfsu.edu or call 555-0100.",
    "signed_by": [{"name": "Dean Person", "email": "dean@sfsu.edu"}],
}


@pytest.mark.unit
def test_taap_sanitizer_allowlist_and_labels():
    from app.public_reports.sanitize import public_taap_payload

    clean = public_taap_payload(RAW_ROW)
    for dropped in ("vendor_contact", "misc_notes", "signed_by", "score"):
        assert dropped not in clean
    assert clean["proposed_alternative"] == RAW_ROW["proposed_alternative"]
    assert clean["outcome_label"] == "Partially Equally Effective"
    assert clean["affected_user_groups"] == ["Blindness", "Low Vision"]
    assert clean["requirements_met_count"] == 2 and clean["requirements_total"] == 6
    assert clean["statement_posted_at_point_of_access"] is True
    assert clean["status_label"] == "Signed"
    assert clean["public_url"] == "/ati/reports/public/taap/zebrascope-sfsu--biology--2026"
    # The statement and the alternative are the sanctioned carriers of a contact address.
    without_contact_fields = {k: v for k, v in clean.items()
                              if k not in ("accessibility_statement", "proposed_alternative")}
    assert not EMAIL_RE.search(str(without_contact_fields)), "no email outside the statement and alternative"
    assert "help@sfsu.edu" in clean["accessibility_statement"]


@pytest.mark.unit
def test_taap_search_envelope_pages_and_echoes_filters():
    from app.public_reports.sanitize import public_taap_search_payload

    env = public_taap_search_payload(
        {"total": 51, "page": 2, "page_size": 25, "items": [RAW_ROW]},
        {"q": "zebra", "campus": None, "year": "", "outcome": "non_equal_alternative", "page": 2},
    )
    assert env["pages"] == 3 and env["page"] == 2 and env["total"] == 51
    assert env["filters"] == {"q": "zebra", "outcome": "non_equal_alternative", "page": 2}
    assert env["items"][0]["title"] == "Zebrascope"


@pytest.mark.unit
def test_lucene_escaping_and_prefixing():
    from app.database.queries.assets.read import _fulltext_query

    assert _fulltext_query("hand") == "hand*"
    assert _fulltext_query("caption audio") == "caption* OR audio*"
    assert _fulltext_query('a:b (c)') == "a\\:b* OR \\(c\\)*"
    assert _fulltext_query("   ") == ""


# ---------------------------------------------------------------------------
# Endpoints — sentinel data, no session
# ---------------------------------------------------------------------------

@pytest.fixture
def public_taap_fixture(neo4j_connection, sentinel_academic_year):
    from app.database.graph_schema import Asset, Department, Person, Vendor
    from app.database.queries.assets.create import create_taap
    from app.database.queries.assets.update import assign_signer_to_taap, assign_vendor_to_asset

    asset = Asset(asset_identifier=ASSET_ID, title=PUBLIC_TITLE, scope="campus").save()
    Vendor(name=VENDOR_NAME).save()
    assign_vendor_to_asset(ASSET_ID, VENDOR_NAME)
    Department(name=UNIT_NAME).save()
    signer = Person(name=SIGNER_NAME, email="signer@sfsu.test").save()

    public = create_taap(
        title=PUBLIC_TITLE, asset_identifier=ASSET_ID, campus_abbrev=CAMPUS,
        requesting_unit=UNIT_NAME, creation_date="2026-09-02", review_due="2027-09-02",
        academic_year=SENTINEL, taap_status="signed", outcome="non_equal_alternative",
        affected_user_groups=["blindness"], requirements_met=["same_information"],
        known_barriers="Sentinel zebra captions missing.",
        accessibility_statement="Sentinel statement. Contact zebrahelp@sfsu.test for help.",
        proposed_alternative="Instructor sentinelprof@sfsu.test will provide alternatives.",
        misc_notes="Sentinel notes mention sentinelnotes@sfsu.test.",
        vendor_contact="sentinelvendor@zebra.test",
    )
    assign_signer_to_taap(public.taap_identifier, signer.unique_id, role="department_head", signed_date="2026-09-05")
    # A second, unsigned plan for the same unit a year later: must never be public.
    draft = create_taap(
        title=DRAFT_TITLE, asset_identifier=ASSET_ID, campus_abbrev=CAMPUS,
        requesting_unit=UNIT_NAME, creation_date="2027-09-02", academic_year=SENTINEL,
        taap_status="draft",
    )
    yield {"public": public.taap_identifier, "draft": draft.taap_identifier}

    db.cypher_query("MATCH (n:TAAP) WHERE n.taap_identifier STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Asset) WHERE n.asset_identifier STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Vendor) WHERE n.name STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:OrgUnit) WHERE n.name STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})
    db.cypher_query("MATCH (n:Person) WHERE n.name STARTS WITH $p DETACH DELETE n", {"p": SENTINEL})


pytestmark_api = [pytest.mark.integration, pytest.mark.api]


@pytest.mark.integration
@pytest.mark.api
def test_register_json_lists_public_plans_only(flask_client, public_taap_fixture):
    resp = flask_client.get(f"/ati/reports/public/taaps.json?year={SENTINEL}&campus={CAMPUS}")
    assert resp.status_code == 200
    assert resp.headers["Cache-Control"] == "public, max-age=300"
    data = resp.get_json()
    ids = [t["taap_identifier"] for t in data["items"]]
    assert public_taap_fixture["public"] in ids
    assert public_taap_fixture["draft"] not in ids, "an unsigned plan must not be public"
    item = next(t for t in data["items"] if t["taap_identifier"] == public_taap_fixture["public"])
    assert item["vendor"] == VENDOR_NAME
    assert item["requesting_unit"] == UNIT_NAME
    assert item["affected_user_groups"] == ["Blindness"]
    flat = str({k: v for k, v in item.items() if k not in ("accessibility_statement", "proposed_alternative")})
    assert not EMAIL_RE.search(flat), "no contact leaks outside the statement and alternative"
    assert "sentinelnotes" not in str(data) and "sentinelvendor" not in str(data)


@pytest.mark.integration
@pytest.mark.api
def test_register_json_filters_and_rejects_bad_values(flask_client, public_taap_fixture):
    hit = flask_client.get(f"/ati/reports/public/taaps.json?year={SENTINEL}&group=blindness").get_json()
    assert public_taap_fixture["public"] in [t["taap_identifier"] for t in hit["items"]]
    miss = flask_client.get(f"/ati/reports/public/taaps.json?year={SENTINEL}&group=photosensitivity").get_json()
    assert public_taap_fixture["public"] not in [t["taap_identifier"] for t in miss["items"]]
    assert flask_client.get("/ati/reports/public/taaps.json?outcome=not-a-grade").status_code == 400
    assert flask_client.get("/ati/reports/public/taaps.json?status=draft").status_code == 400, \
        "draft is not a public status and cannot be asked for"


@pytest.mark.integration
@pytest.mark.api
def test_register_free_text_finds_plan_by_barrier_and_vendor(flask_client, public_taap_fixture):
    by_barrier = flask_client.get(f"/ati/reports/public/taaps.json?year={SENTINEL}&q=zebra+caption").get_json()
    assert public_taap_fixture["public"] in [t["taap_identifier"] for t in by_barrier["items"]]
    by_vendor = flask_client.get(f"/ati/reports/public/taaps.json?year={SENTINEL}&q=zebra+vendor").get_json()
    assert public_taap_fixture["public"] in [t["taap_identifier"] for t in by_vendor["items"]]


@pytest.mark.integration
@pytest.mark.api
def test_register_and_detail_pages_render_without_session(flask_client, public_taap_fixture):
    flask_client.application.config["AUTH_ENFORCED"] = True
    try:
        page = flask_client.get(f"/ati/reports/public/taaps?year={SENTINEL}&q=zebrascope")
        assert page.status_code == 200
        html = page.get_data(as_text=True)
        assert PUBLIC_TITLE in html and DRAFT_TITLE not in html
        assert "Sign in to edit" in html
        assert f"/ati/reports/public/taap/{public_taap_fixture['public']}" in html

        detail = flask_client.get(f"/ati/reports/public/taap/{public_taap_fixture['public']}")
        assert detail.status_code == 200
        html = detail.get_data(as_text=True)
        assert "Product-specific accessibility statement" in html
        assert "zebrahelp@sfsu.test" in html, "the statement is published verbatim"
        assert "Proposed alternative" in html and "sentinelprof@sfsu.test" in html, "the alternative is published verbatim"
        emails = set(EMAIL_RE.findall(html))
        assert emails == {"zebrahelp@sfsu.test", "sentinelprof@sfsu.test"},             f"only the statement's and alternative's contacts may appear: {emails}"
        assert "sentinelnotes" not in html and "sentinelvendor" not in html and SIGNER_NAME not in html
        assert f'href="/ati/{CAMPUS}/ati-explorer/assets/taaps/{public_taap_fixture["public"]}"' in html
    finally:
        flask_client.application.config["AUTH_ENFORCED"] = False


@pytest.mark.integration
@pytest.mark.api
def test_detail_404_for_draft_and_unknown(flask_client, public_taap_fixture):
    assert flask_client.get(f"/ati/reports/public/taap/{public_taap_fixture['draft']}").status_code == 404
    assert flask_client.get("/ati/reports/public/taap/no-such-plan").status_code == 404
