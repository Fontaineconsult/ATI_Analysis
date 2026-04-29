"""
API tests for /campus-plans endpoints.

All tests use the sentinel academic year '9999-9999' and reuse a real campus
('sfsu'). The cleanup_plan_family fixture removes any plan-family node whose
identifier starts with the sentinel — production data is never touched.
"""
import uuid

import pytest
from neomodel import db

from app.database.graph_schema import (
    AcademicYear,
    Campus,
    Plan,
    SuccessIndicator,
    YearSuccessEvidence,
)
from app.database.identifiers import make_yse_identifier
from app.database.queries.committees.create import create_campus_plan
from app.data_config import working_group_names
from tests.conftest import TEST_ACADEMIC_YEAR_NAME


def _find_active_indicator_for_group(working_group_abbrev: str) -> SuccessIndicator:
    """Find any non-removed SuccessIndicator under a Goal owned by the given WG."""
    wg_full_name = working_group_names[working_group_abbrev]
    rows, _ = db.cypher_query(
        """
        MATCH (:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(:Goal)
              -[:supported_by]->(si:SuccessIndicator)
        WHERE si.removed = false OR si.removed IS NULL
        RETURN si LIMIT 1
        """,
        {"wg_name": wg_full_name},
    )
    if not rows:
        raise RuntimeError(f"No active SuccessIndicator found for working group {wg_full_name!r}")
    return SuccessIndicator.inflate(rows[0][0])


def _attach_test_plan(
    year_name: str,
    campus_abbrev: str,
    working_group_abbrev: str,
    *,
    is_campus_plan: bool,
    plan_year: str = None,
    completed_year: str = None,
) -> Plan:
    """
    Build a test Plan that surfaces (or doesn't) via the YSE-Goal-WG traversal
    used by the committees.read query.

    Setup chain:
      Plan (description prefixed with sentinel year for cleanup)
        -[:furthers_yse]-> YSE (in sentinel year, scoped to the given campus
                                and to a SI under a Goal of the target WG)
        -[:in_academic_year]-> AcademicYear  (if plan_year given)
        -[:completed_in_year]-> AcademicYear (if completed_year given)

    Returns the Plan node. The cleanup_plan_family fixture removes the Plan;
    cleanup_yse_family removes the YSE.
    """
    si = _find_active_indicator_for_group(working_group_abbrev)
    year_identifier = make_yse_identifier(year_name, si.composite_key, campus_abbrev)

    # Reuse a sentinel-year YSE if a previous test in the run created one for
    # this exact (year, indicator, campus) combo; otherwise create + wire it up.
    existing = YearSuccessEvidence.nodes.filter(year_identifier=year_identifier)
    if existing:
        yse = existing[0]
    else:
        yse = YearSuccessEvidence(year_identifier=year_identifier)
        yse.save()
        yse.tracks_success_indicator.connect(si)
        yse.campus.connect(Campus.nodes.get(abbreviation=campus_abbrev))
        yse.academic_year.connect(AcademicYear.nodes.get(name=year_name))

    plan = Plan(
        description=f"{year_name}-test-plan-{uuid.uuid4()}",
        is_campus_plan=is_campus_plan,
    )
    plan.save()
    plan.furthered_year_success_indicators.connect(yse)

    if plan_year:
        plan.academic_year.connect(AcademicYear.nodes.get(name=plan_year))
    if completed_year:
        plan.completed_year.connect(AcademicYear.nodes.get(name=completed_year))

    return plan


CAMPUS_ABBREV = "sfsu"  # Reusing a real campus; we never modify it.

# All paths in this file go through the live blueprint, mounted under
# /ati/data-api/v1 (see app/__init__.py).
URL_PREFIX = "/ati/data-api/v1"


# -- GET /campus-plans/<campus>/<year> -----------------------------------------


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_returns_200_with_full_shape(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")

    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "success"

    data = body["data"]
    assert data["plan_identifier"] == f"{TEST_ACADEMIC_YEAR_NAME}-{CAMPUS_ABBREV}"
    assert data["academic_year"] == TEST_ACADEMIC_YEAR_NAME
    assert data["campus"]["abbreviation"] == CAMPUS_ABBREV

    # A fresh plan has no president's report attached yet
    assert data["presidents_report"] is None

    # Three child WorkingGroupPlans, one per group
    wgps = data["working_group_plans"]
    assert len(wgps) == 3
    wg_names = {wgp["working_group"] for wgp in wgps}
    assert wg_names == {"Web", "Procurement", "Instructional Materials"}

    # Each child has the expected identifier shape and starts empty.
    for wgp in wgps:
        assert wgp["plan_identifier"].startswith(f"{TEST_ACADEMIC_YEAR_NAME}-{CAMPUS_ABBREV}-")
        assert wgp["prioritized_success_indicators"] == []
        assert wgp["group_leads"] == []
        assert wgp["plans"] == []  # No campus-plan plans attached yet


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_surfaces_campus_plan_plans_per_group(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A Plan furthering a YSE under a WG's Goal, with is_campus_plan=True,
    appears in that WG's `plans` list — and nowhere else. The Plan's
    academic_year (creation/target year) surfaces via the WGP query."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    plan = _attach_test_plan(
        TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web",
        is_campus_plan=True,
        plan_year=TEST_ACADEMIC_YEAR_NAME,  # uses sentinel year for cleanup parity
    )

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    assert resp.status_code == 200

    wgps = resp.get_json()["data"]["working_group_plans"]
    web_wgp = next(w for w in wgps if w["working_group"] == "Web")
    pro_wgp = next(w for w in wgps if w["working_group"] == "Procurement")

    assert len(web_wgp["plans"]) == 1
    payload = web_wgp["plans"][0]
    assert payload["description"] == plan.description
    assert payload["is_campus_plan"] is True
    assert payload["academic_year"] == TEST_ACADEMIC_YEAR_NAME
    assert payload["completed_year"] is None  # not completed
    assert pro_wgp["plans"] == []


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_surfaces_completed_year_when_set(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A Plan with completed_in_year set returns that year alongside academic_year."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    _attach_test_plan(
        TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web",
        is_campus_plan=True,
        plan_year=TEST_ACADEMIC_YEAR_NAME,
        completed_year=TEST_ACADEMIC_YEAR_NAME,
    )

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp = next(w for w in resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web")

    assert web_wgp["plans"][0]["academic_year"] == TEST_ACADEMIC_YEAR_NAME
    assert web_wgp["plans"][0]["completed_year"] == TEST_ACADEMIC_YEAR_NAME


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_filters_out_non_campus_plan_plans(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A Plan that furthers a YSE under the right WG but is NOT flagged
    is_campus_plan should not surface in the response."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    _attach_test_plan(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web", is_campus_plan=False)

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    wgps = resp.get_json()["data"]["working_group_plans"]
    web_wgp = next(w for w in wgps if w["working_group"] == "Web")

    assert web_wgp["plans"] == []


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_returns_404_when_missing(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    # No plan created; GET should 404.
    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    assert resp.status_code == 404
    body = resp.get_json()
    assert body["status"] == "error"
    assert "not found" in body["error"].lower()


# -- POST /campus-plans (action: create_campus_plan) ---------------------------


@pytest.mark.integration
@pytest.mark.api
def test_post_create_campus_plan_returns_201(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    payload = {
        "action": "create_campus_plan",
        "campus_abbrev": CAMPUS_ABBREV,
        "year_name": TEST_ACADEMIC_YEAR_NAME,
    }
    resp = flask_client.post(f"{URL_PREFIX}/campus-plans", json=payload)

    assert resp.status_code == 201
    body = resp.get_json()
    assert body["status"] == "success"
    assert body["data"]["plan_identifier"] == f"{TEST_ACADEMIC_YEAR_NAME}-{CAMPUS_ABBREV}"


@pytest.mark.integration
@pytest.mark.api
def test_post_create_campus_plan_persists_three_children(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    """After POST, a follow-up GET returns the parent + 3 WorkingGroupPlans."""
    payload = {
        "action": "create_campus_plan",
        "campus_abbrev": CAMPUS_ABBREV,
        "year_name": TEST_ACADEMIC_YEAR_NAME,
    }
    flask_client.post(f"{URL_PREFIX}/campus-plans", json=payload)

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    assert resp.status_code == 200
    assert len(resp.get_json()["data"]["working_group_plans"]) == 3


@pytest.mark.integration
@pytest.mark.api
def test_post_missing_required_fields_returns_400(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={"action": "create_campus_plan", "campus_abbrev": CAMPUS_ABBREV},  # year_name missing
    )
    assert resp.status_code == 400
    body = resp.get_json()
    assert body["status"] == "error"
    assert "year_name" in body["error"]


@pytest.mark.integration
@pytest.mark.api
def test_post_missing_action_returns_400(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    resp = flask_client.post(f"{URL_PREFIX}/campus-plans", json={"campus_abbrev": CAMPUS_ABBREV})
    assert resp.status_code == 400
    assert "action" in resp.get_json()["error"].lower()


@pytest.mark.integration
@pytest.mark.api
def test_post_unknown_action_returns_400(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={"action": "bogus_action", "campus_abbrev": CAMPUS_ABBREV, "year_name": TEST_ACADEMIC_YEAR_NAME},
    )
    assert resp.status_code == 400
    assert "unknown action" in resp.get_json()["error"].lower()


@pytest.mark.integration
@pytest.mark.api
def test_post_duplicate_campus_plan_returns_400(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    payload = {
        "action": "create_campus_plan",
        "campus_abbrev": CAMPUS_ABBREV,
        "year_name": TEST_ACADEMIC_YEAR_NAME,
    }
    first = flask_client.post(f"{URL_PREFIX}/campus-plans", json=payload)
    assert first.status_code == 201

    second = flask_client.post(f"{URL_PREFIX}/campus-plans", json=payload)
    assert second.status_code == 400
    assert "already exists" in second.get_json()["error"]


@pytest.mark.integration
@pytest.mark.api
def test_post_unknown_campus_returns_404(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={
            "action": "create_campus_plan",
            "campus_abbrev": "nonexistent",
            "year_name": TEST_ACADEMIC_YEAR_NAME,
        },
    )
    assert resp.status_code == 404
    assert "Campus" in resp.get_json()["error"]
