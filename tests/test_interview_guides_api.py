"""
InterviewGuide — the stakeholder-interview prep document as a graph node (the
upstream twin of MeetingMinutes: plan vs record).

Isolation: guides and people/communities created here are sentinel-titled
(9999-9999...); the guide anchors to the sentinel AcademicYear and a REAL Campus
(read-only reuse). Targets reuse REAL YearSuccessEvidence nodes read-only — the
guide's detach-delete severs its edges and touches nothing else.
"""
import pytest
from neomodel import db

from conftest import TEST_ACADEMIC_YEAR_NAME

SENTINEL = "9999-9999"
GUIDE_TITLE = f"{SENTINEL} Test Interview Guide"
PERSON_NAME = f"{SENTINEL} Test Interviewee"
COMMUNITY_NAME = f"{SENTINEL} Test Guide Community"

pytestmark = [pytest.mark.integration]


@pytest.fixture
def cleanup_guides(neo4j_connection):
    yield
    db.cypher_query(
        "MATCH (g:InterviewGuide) WHERE g.title STARTS WITH $prefix DETACH DELETE g",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (c:CommunityOfPractice) WHERE c.name STARTS WITH $prefix DETACH DELETE c",
        {"prefix": SENTINEL},
    )


@pytest.fixture
def guide_fixtures(sentinel_academic_year, cleanup_guides):
    """A real campus, a sentinel person + community, and two real live-SI YSEs."""
    from app.database.graph_schema import Campus, CommunityOfPractice, Person

    campuses = Campus.nodes.all()
    if not campuses:
        pytest.skip("No Campus reference data in the graph")
    rows, _ = db.cypher_query(
        """
        MATCH (yse:YearSuccessEvidence)-[:tracks]->(si:SuccessIndicator)
        WHERE coalesce(si.removed, false) = false
          AND NOT yse.year_identifier STARTS WITH $sentinel
        RETURN yse.year_identifier LIMIT 2
        """,
        {"sentinel": SENTINEL},
    )
    if len(rows) < 2:
        pytest.skip("Not enough live YSEs in the graph")
    return {
        "campus": campuses[0].abbreviation,
        "person": Person(name=PERSON_NAME, active=False).save(),
        "community": CommunityOfPractice(name=COMMUNITY_NAME).save(),
        "targets": [r[0] for r in rows],
    }


def test_create_and_read_full_projection(guide_fixtures):
    from app.database.queries.interview_guides.create import create_interview_guide
    from app.database.queries.interview_guides.read import get_interview_guide

    f = guide_fixtures
    g = create_interview_guide(
        title=GUIDE_TITLE,
        campus_abbrev=f["campus"],
        year_name=TEST_ACADEMIC_YEAR_NAME,
        content="# Interview: someone\n\n## Targets\n- things",
        meeting_date="2099-06-01",
        source_path="app/database/ontology/interviews/9999-test.md",
        prepared_for_unique_ids=[f["person"].unique_id],
        target_year_identifiers=f["targets"],
        pertains_to_community_unique_ids=[f["community"].unique_id],
    )

    data = get_interview_guide(g.unique_id)
    assert data["title"] == GUIDE_TITLE
    assert data["campus_abbrev"] == f["campus"]
    assert data["academic_year"] == TEST_ACADEMIC_YEAR_NAME
    assert data["meeting_date"] == "2099-06-01"
    assert [p["name"] for p in data["prepared_for"]] == [PERSON_NAME]
    assert sorted(t["year_identifier"] for t in data["targets"]) == sorted(f["targets"])
    assert all(t["composite_key"] for t in data["targets"])
    assert data["working_groups"], "WG footprint derives from targets"
    assert [c["name"] for c in data["pertains_to_communities"]] == [COMMUNITY_NAME]
    assert data["resulted_in"] is None


def test_create_requires_anchor_and_is_atomic(guide_fixtures):
    from app.database.graph_schema import InterviewGuide
    from app.database.queries.interview_guides.create import create_interview_guide
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError

    f = guide_fixtures
    with pytest.raises(ValidationError):
        create_interview_guide(title="  ", campus_abbrev=f["campus"], year_name=TEST_ACADEMIC_YEAR_NAME)
    with pytest.raises(ValidationError):
        create_interview_guide(title=GUIDE_TITLE, campus_abbrev=None, year_name=TEST_ACADEMIC_YEAR_NAME)
    with pytest.raises(NotFoundError):
        create_interview_guide(title=GUIDE_TITLE, campus_abbrev="zzz-nope", year_name=TEST_ACADEMIC_YEAR_NAME)
    # A bad target fails the WHOLE create — nothing half-made.
    with pytest.raises(NotFoundError):
        create_interview_guide(
            title=GUIDE_TITLE, campus_abbrev=f["campus"], year_name=TEST_ACADEMIC_YEAR_NAME,
            target_year_identifiers=["no-such-yse"],
        )
    assert InterviewGuide.nodes.first_or_none(title=GUIDE_TITLE) is None


def test_removed_indicator_rejected_as_target(guide_fixtures):
    from app.database.queries.interview_guides.create import create_interview_guide
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    rows, _ = db.cypher_query(
        """
        MATCH (yse:YearSuccessEvidence)-[:tracks]->(si:SuccessIndicator {removed: true})
        RETURN yse.year_identifier LIMIT 1
        """,
    )
    if not rows:
        pytest.skip("No YSE tracking a removed SuccessIndicator in the graph")
    with pytest.raises(ValidationError):
        create_interview_guide(
            title=GUIDE_TITLE, campus_abbrev=guide_fixtures["campus"],
            year_name=TEST_ACADEMIC_YEAR_NAME,
            target_year_identifiers=[rows[0][0]],
        )


def test_setters_full_replace_and_resulted_in(guide_fixtures, cleanup_plan_family):
    from app.database.queries.interview_guides.create import create_interview_guide
    from app.database.queries.interview_guides.update import (
        set_guide_communities,
        set_guide_people,
        set_guide_resulted_in,
        set_guide_targets,
        update_interview_guide,
    )
    from app.database.queries.meeting_minutes.create import create_meeting_minutes
    from app.database.queries.committees.create import create_campus_plan
    from app.database.identifiers import make_working_group_plan_identifier
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    f = guide_fixtures
    g = create_interview_guide(
        title=GUIDE_TITLE, campus_abbrev=f["campus"], year_name=TEST_ACADEMIC_YEAR_NAME,
    )

    after = set_guide_people(g.unique_id, [f["person"].unique_id])
    assert [p["unique_id"] for p in after["prepared_for"]] == [f["person"].unique_id]
    assert set_guide_people(g.unique_id, [])["prepared_for"] == []

    after = set_guide_targets(g.unique_id, [f["targets"][0]])
    assert [t["year_identifier"] for t in after["targets"]] == [f["targets"][0]]
    assert set_guide_targets(g.unique_id, [])["targets"] == []

    after = set_guide_communities(g.unique_id, [f["community"].unique_id])
    assert [c["unique_id"] for c in after["pertains_to_communities"]] == [f["community"].unique_id]

    # Closure: prep -> minutes, then cleared.
    try:
        create_campus_plan(f["campus"], TEST_ACADEMIC_YEAR_NAME)
    except ValidationError:
        pass
    wgp_id = make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, f["campus"], "web")
    minutes = create_meeting_minutes(
        title=f"{SENTINEL} guide-closure minutes", working_group_plan_identifier=wgp_id,
    )
    try:
        after = set_guide_resulted_in(g.unique_id, minutes.unique_id)
        assert after["resulted_in"]["unique_id"] == minutes.unique_id
        after = set_guide_resulted_in(g.unique_id, None)
        assert after["resulted_in"] is None
    finally:
        db.cypher_query(
            "MATCH (m:MeetingMinutes) WHERE m.title STARTS WITH $p DETACH DELETE m",
            {"p": SENTINEL},
        )

    # Scalar update keeps the sentinel semantics.
    after = update_interview_guide(g.unique_id, title=f"{GUIDE_TITLE} v2", meeting_date=None)
    assert after["title"] == f"{GUIDE_TITLE} v2"
    assert after["meeting_date"] is None


def test_panels(guide_fixtures):
    from app.database.queries.interview_guides.create import create_interview_guide
    from app.database.queries.interview_guides.read import (
        guides_for_community,
        guides_panel_for_campus_year,
    )

    f = guide_fixtures
    g = create_interview_guide(
        title=GUIDE_TITLE, campus_abbrev=f["campus"], year_name=TEST_ACADEMIC_YEAR_NAME,
        pertains_to_community_unique_ids=[f["community"].unique_id],
    )

    panel = guides_panel_for_campus_year(f["campus"], TEST_ACADEMIC_YEAR_NAME)
    assert any(x["unique_id"] == g.unique_id for x in panel["guides"])

    rows = guides_for_community(f["community"].unique_id)
    assert [x["unique_id"] for x in rows] == [g.unique_id]


def test_delete(guide_fixtures):
    from app.database.graph_schema import Person
    from app.database.queries.interview_guides.create import create_interview_guide
    from app.database.queries.interview_guides.delete import delete_interview_guide
    from app.database.queries.interview_guides.read import get_interview_guide
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    f = guide_fixtures
    g = create_interview_guide(
        title=GUIDE_TITLE, campus_abbrev=f["campus"], year_name=TEST_ACADEMIC_YEAR_NAME,
        prepared_for_unique_ids=[f["person"].unique_id],
        target_year_identifiers=[f["targets"][0]],
    )
    assert delete_interview_guide(g.unique_id) is True
    with pytest.raises(NotFoundError):
        get_interview_guide(g.unique_id)
    # The person (and the real YSE) survive the guide's deletion.
    assert Person.nodes.first_or_none(unique_id=f["person"].unique_id) is not None


# --- Endpoint layer ----------------------------------------------------------------

@pytest.mark.api
def test_endpoint_flow(flask_client, guide_fixtures):
    f = guide_fixtures
    base = "/ati/data-api/v1/interview-guides"

    resp = flask_client.post(base, json={
        "action": "create_interview_guide",
        "title": GUIDE_TITLE,
        "campus_abbrev": f["campus"],
        "year_name": TEST_ACADEMIC_YEAR_NAME,
        "content": "## endpoint guide",
        "meeting_date": "2099-07-01",
        "prepared_for_unique_ids": [f["person"].unique_id],
        "target_year_identifiers": [f["targets"][0]],
        "pertains_to_community_unique_ids": [f["community"].unique_id],
    })
    assert resp.status_code == 201, resp.get_json()
    created = resp.get_json()["data"]
    uid = created["unique_id"]
    assert [p["unique_id"] for p in created["prepared_for"]] == [f["person"].unique_id]
    assert [t["year_identifier"] for t in created["targets"]] == [f["targets"][0]]
    assert [c["unique_id"] for c in created["pertains_to_communities"]] == [f["community"].unique_id]

    resp = flask_client.get(f"{base}/campus/{f['campus']}/{TEST_ACADEMIC_YEAR_NAME}")
    assert resp.status_code == 200
    assert any(g["unique_id"] == uid for g in resp.get_json()["data"]["guides"])

    resp = flask_client.get(f"{base}/community/{f['community'].unique_id}")
    assert resp.status_code == 200
    assert [g["unique_id"] for g in resp.get_json()["data"]["guides"]] == [uid]

    # Full-replace via PUT; non-list payload is a 400.
    resp = flask_client.put(base, json={
        "action": "set_prepared_for", "unique_id": uid, "person_unique_ids": [],
    })
    assert resp.status_code == 200
    assert resp.get_json()["data"]["prepared_for"] == []
    resp = flask_client.put(base, json={
        "action": "set_targets", "unique_id": uid, "target_year_identifiers": "x",
    })
    assert resp.status_code == 400

    resp = flask_client.put(base, json={
        "action": "update_interview_guide", "unique_id": uid, "title": f"{GUIDE_TITLE} renamed",
    })
    assert resp.status_code == 200
    assert resp.get_json()["data"]["title"] == f"{GUIDE_TITLE} renamed"

    resp = flask_client.delete(f"{base}/{uid}")
    assert resp.status_code == 200
    resp = flask_client.get(f"{base}/item/{uid}")
    assert resp.status_code == 404
