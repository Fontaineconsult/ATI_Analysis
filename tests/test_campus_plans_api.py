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
    StatusLevel,
    SuccessIndicator,
    WorkingGroupPlan,
    YearSuccessEvidence,
)
from app.database.identifiers import make_working_group_plan_identifier, make_yse_identifier
from app.database.queries.committees.create import create_campus_plan
from app.data_config import working_group_names
from tests.conftest import TEST_ACADEMIC_YEAR_NAME, TEST_PREVIOUS_ACADEMIC_YEAR_NAME


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
        # Available indicators are populated from real reference data — at least
        # one active indicator should exist for each working group.
        assert isinstance(wgp["available_indicators"], list)
        assert len(wgp["available_indicators"]) > 0


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
def test_get_campus_plan_surfaces_companion_plans_per_prioritized_indicator(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A prioritized SI's companion_plans list contains every campus-plan Plan
    that furthers a YSE (for this campus + year) tracking that SI."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)

    si = _find_active_indicator_for_group("web")
    web_wgp_id = make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")
    web_wgp = WorkingGroupPlan.nodes.get(plan_identifier=web_wgp_id)
    web_wgp.prioritized_success_indicators.connect(si)

    # Build a sentinel-year YSE for this SI + campus, then a campus-plan Plan
    # that furthers it — the SI now has a companion plan via the YSE bridge.
    year_id = make_yse_identifier(TEST_ACADEMIC_YEAR_NAME, si.composite_key, CAMPUS_ABBREV)
    yse = YearSuccessEvidence(year_identifier=year_id)
    yse.save()
    yse.tracks_success_indicator.connect(si)
    yse.campus.connect(Campus.nodes.get(abbreviation=CAMPUS_ABBREV))
    yse.academic_year.connect(AcademicYear.nodes.get(name=TEST_ACADEMIC_YEAR_NAME))

    plan = Plan(
        description=f"{TEST_ACADEMIC_YEAR_NAME}-test-plan-{uuid.uuid4()}",
        name="Companion Plan A",
        is_campus_plan=True,
    )
    plan.save()
    plan.furthered_year_success_indicators.connect(yse)

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )

    assert len(web_wgp_resp["prioritized_success_indicators"]) == 1
    surfaced = web_wgp_resp["prioritized_success_indicators"][0]
    assert surfaced["unique_id"] == si.unique_id
    assert len(surfaced["companion_plans"]) == 1
    assert surfaced["companion_plans"][0]["unique_id"] == plan.unique_id
    assert surfaced["companion_plans"][0]["name"] == "Companion Plan A"


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_companion_plans_empty_when_no_match(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A prioritized SI with no matching campus-plan Plan returns []."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)

    si = _find_active_indicator_for_group("web")
    web_wgp_id = make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")
    web_wgp = WorkingGroupPlan.nodes.get(plan_identifier=web_wgp_id)
    web_wgp.prioritized_success_indicators.connect(si)

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )

    assert len(web_wgp_resp["prioritized_success_indicators"]) == 1
    assert web_wgp_resp["prioritized_success_indicators"][0]["companion_plans"] == []


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
def test_post_add_prioritized_indicator_returns_201(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    """Adding a prioritized indicator wires the WGP-SI edge and surfaces in GET."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    si = _find_active_indicator_for_group("web")
    web_wgp_id = make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={
            "action": "add_prioritized_indicator",
            "working_group_plan_identifier": web_wgp_id,
            "indicator_composite_key": si.composite_key,
        },
    )
    assert resp.status_code == 201

    # GET reflects the new prioritization.
    get_resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp = next(
        w for w in get_resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    assert any(
        s["composite_key"] == si.composite_key
        for s in web_wgp["prioritized_success_indicators"]
    )


@pytest.mark.integration
@pytest.mark.api
def test_post_add_prioritized_indicator_is_idempotent(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    """Re-adding the same indicator does not duplicate the edge."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    si = _find_active_indicator_for_group("web")
    web_wgp_id = make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")
    payload = {
        "action": "add_prioritized_indicator",
        "working_group_plan_identifier": web_wgp_id,
        "indicator_composite_key": si.composite_key,
    }

    assert flask_client.post(f"{URL_PREFIX}/campus-plans", json=payload).status_code == 201
    assert flask_client.post(f"{URL_PREFIX}/campus-plans", json=payload).status_code == 201

    get_resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp = next(
        w for w in get_resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    matches = [s for s in web_wgp["prioritized_success_indicators"] if s["composite_key"] == si.composite_key]
    assert len(matches) == 1


@pytest.mark.integration
@pytest.mark.api
def test_post_add_prioritized_indicator_unknown_wgp_returns_404(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    si = _find_active_indicator_for_group("web")

    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={
            "action": "add_prioritized_indicator",
            "working_group_plan_identifier": "nonexistent-wgp",
            "indicator_composite_key": si.composite_key,
        },
    )
    assert resp.status_code == 404


@pytest.mark.integration
@pytest.mark.api
def test_post_add_prioritized_indicator_unknown_indicator_returns_404(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    web_wgp_id = make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={
            "action": "add_prioritized_indicator",
            "working_group_plan_identifier": web_wgp_id,
            "indicator_composite_key": "9.9-bogus",
        },
    )
    assert resp.status_code == 404


def _prioritize_si_with_yse(year_name: str, campus_abbrev: str, working_group_abbrev: str):
    """Helper for progress-update tests: prioritize an SI on the matching WGP
    and ensure a sentinel-year YSE exists for it. Returns (wgp_id, yse_id, si)."""
    si = _find_active_indicator_for_group(working_group_abbrev)
    wgp_id = make_working_group_plan_identifier(year_name, campus_abbrev, working_group_abbrev)
    wgp = WorkingGroupPlan.nodes.get(plan_identifier=wgp_id)
    wgp.prioritized_success_indicators.connect(si)

    yse_id = make_yse_identifier(year_name, si.composite_key, campus_abbrev)
    existing = YearSuccessEvidence.nodes.filter(year_identifier=yse_id)
    if existing:
        yse = existing[0]
    else:
        yse = YearSuccessEvidence(year_identifier=yse_id)
        yse.save()
        yse.tracks_success_indicator.connect(si)
        yse.campus.connect(Campus.nodes.get(abbreviation=campus_abbrev))
        yse.academic_year.connect(AcademicYear.nodes.get(name=year_name))

    return wgp_id, yse_id, si


@pytest.mark.integration
@pytest.mark.api
def test_post_add_progress_update_returns_201_and_surfaces_in_get(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A logged ProgressUpdate surfaces under the prioritized indicator's `progress`."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    wgp_id, yse_id, si = _prioritize_si_with_yse(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={
            "action": "add_progress_update",
            "working_group_plan_identifier": wgp_id,
            "yse_identifier": yse_id,
            "note": "Started audit of top 100 pages",
            "trajectory": "improving",
        },
    )
    assert resp.status_code == 201
    assert "unique_id" in resp.get_json()["data"]

    get_resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in get_resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    surfaced = next(
        s for s in web_wgp_resp["prioritized_success_indicators"] if s["unique_id"] == si.unique_id
    )
    progress = surfaced["progress"]
    assert progress["yse_identifier"] == yse_id
    assert progress["update_count"] == 1
    assert len(progress["updates"]) == 1
    assert progress["updates"][0]["trajectory"] == "improving"
    assert progress["updates"][0]["note"] == "Started audit of top 100 pages"
    assert progress["updates"][0]["author_name"] is None  # no author_unique_id passed


@pytest.mark.integration
@pytest.mark.api
def test_post_add_progress_update_count_increments(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """Multiple updates increment update_count and `latest` reflects most recent."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    wgp_id, yse_id, si = _prioritize_si_with_yse(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    for note, traj in [("First note", "stagnant"), ("Second note", "improving")]:
        flask_client.post(
            f"{URL_PREFIX}/campus-plans",
            json={
                "action": "add_progress_update",
                "working_group_plan_identifier": wgp_id,
                "yse_identifier": yse_id,
                "note": note,
                "trajectory": traj,
            },
        )

    get_resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in get_resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    progress = next(
        s for s in web_wgp_resp["prioritized_success_indicators"] if s["unique_id"] == si.unique_id
    )["progress"]
    assert progress["update_count"] == 2
    assert len(progress["updates"]) == 2
    # Both updates have the same date (today) so order between them is undefined,
    # but both notes should be in the list.
    notes = {u["note"] for u in progress["updates"]}
    assert notes == {"First note", "Second note"}


@pytest.mark.integration
@pytest.mark.api
def test_post_add_progress_update_invalid_trajectory_returns_400(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    wgp_id, yse_id, _ = _prioritize_si_with_yse(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={
            "action": "add_progress_update",
            "working_group_plan_identifier": wgp_id,
            "yse_identifier": yse_id,
            "note": "Update",
            "trajectory": "bogus_value",
        },
    )
    assert resp.status_code == 400
    assert "trajectory" in resp.get_json()["error"].lower()


@pytest.mark.integration
@pytest.mark.api
def test_post_add_progress_update_unknown_yse_returns_404(
    flask_client, sentinel_academic_year, cleanup_plan_family
):
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    wgp_id = make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    resp = flask_client.post(
        f"{URL_PREFIX}/campus-plans",
        json={
            "action": "add_progress_update",
            "working_group_plan_identifier": wgp_id,
            "yse_identifier": "9999-9999-bogus-yse",
            "note": "Update",
        },
    )
    assert resp.status_code == 404


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_surfaces_status_level_per_prioritized_indicator(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A YSE wired to a StatusLevel surfaces that level on the prioritized SI."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    wgp_id, yse_id, si = _prioritize_si_with_yse(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    yse = YearSuccessEvidence.nodes.get(year_identifier=yse_id)
    defined_status = StatusLevel.nodes.get(status_level="Defined")
    yse.status_level.connect(defined_status)

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    surfaced = next(
        s for s in web_wgp_resp["prioritized_success_indicators"] if s["unique_id"] == si.unique_id
    )
    assert surfaced["status_level"] == "Defined"


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_surfaces_previous_year_status_per_prioritized_indicator(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A YSE in the previous academic year wired to a StatusLevel surfaces
    on the prioritized SI as previous_status_level — alongside the current
    year's status — so the UI can show year-over-year progression."""
    # Make sure the previous-year AcademicYear node exists. neomodel's
    # get_or_create uses MERGE with a fresh unique_id, which conflicts with
    # an already-saved node — same try/get pattern as sentinel_academic_year.
    try:
        AcademicYear.nodes.get(name=TEST_PREVIOUS_ACADEMIC_YEAR_NAME)
    except AcademicYear.DoesNotExist:
        AcademicYear(name=TEST_PREVIOUS_ACADEMIC_YEAR_NAME).save()

    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    wgp_id, current_yse_id, si = _prioritize_si_with_yse(
        TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web"
    )

    # Wire CURRENT-year YSE to "Defined"
    current_yse = YearSuccessEvidence.nodes.get(year_identifier=current_yse_id)
    current_yse.status_level.connect(StatusLevel.nodes.get(status_level="Defined"))

    # Build PREVIOUS-year YSE for the same SI + campus, wire to "Initiated"
    previous_yse_id = make_yse_identifier(
        TEST_PREVIOUS_ACADEMIC_YEAR_NAME, si.composite_key, CAMPUS_ABBREV
    )
    previous_yse = YearSuccessEvidence(year_identifier=previous_yse_id)
    previous_yse.save()
    previous_yse.tracks_success_indicator.connect(si)
    previous_yse.campus.connect(Campus.nodes.get(abbreviation=CAMPUS_ABBREV))
    previous_yse.academic_year.connect(
        AcademicYear.nodes.get(name=TEST_PREVIOUS_ACADEMIC_YEAR_NAME)
    )
    previous_yse.status_level.connect(StatusLevel.nodes.get(status_level="Initiated"))

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    surfaced = next(
        s for s in web_wgp_resp["prioritized_success_indicators"] if s["unique_id"] == si.unique_id
    )

    assert surfaced["status_level"] == "Defined"
    assert surfaced["previous_status_level"] == "Initiated"


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_previous_status_null_when_no_previous_year_yse(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """No YSE in the previous academic year → previous_status_level is null
    while current-year status still surfaces normally."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    wgp_id, current_yse_id, si = _prioritize_si_with_yse(
        TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web"
    )

    current_yse = YearSuccessEvidence.nodes.get(year_identifier=current_yse_id)
    current_yse.status_level.connect(StatusLevel.nodes.get(status_level="Defined"))

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    surfaced = next(
        s for s in web_wgp_resp["prioritized_success_indicators"] if s["unique_id"] == si.unique_id
    )

    assert surfaced["status_level"] == "Defined"
    assert surfaced["previous_status_level"] is None


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_status_level_null_when_yse_has_no_status(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """A prioritized SI whose YSE has no status_is edge returns status_level=None."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    _, _, si = _prioritize_si_with_yse(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    surfaced = next(
        s for s in web_wgp_resp["prioritized_success_indicators"] if s["unique_id"] == si.unique_id
    )
    assert surfaced["status_level"] is None


@pytest.mark.integration
@pytest.mark.api
def test_get_campus_plan_available_indicators_carry_status_level(
    flask_client, sentinel_academic_year, cleanup_plan_family, cleanup_yse_family
):
    """The modal-picker indicator list also surfaces status_level when wired."""
    create_campus_plan(CAMPUS_ABBREV, TEST_ACADEMIC_YEAR_NAME)
    _, yse_id, si = _prioritize_si_with_yse(TEST_ACADEMIC_YEAR_NAME, CAMPUS_ABBREV, "web")

    yse = YearSuccessEvidence.nodes.get(year_identifier=yse_id)
    yse.status_level.connect(StatusLevel.nodes.get(status_level="Initiated"))

    resp = flask_client.get(f"{URL_PREFIX}/campus-plans/{CAMPUS_ABBREV}/{TEST_ACADEMIC_YEAR_NAME}")
    web_wgp_resp = next(
        w for w in resp.get_json()["data"]["working_group_plans"] if w["working_group"] == "Web"
    )
    matching_available = next(
        i for i in web_wgp_resp["available_indicators"] if i["unique_id"] == si.unique_id
    )
    assert matching_available["status_level"] == "Initiated"


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
