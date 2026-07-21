"""
Tests for the MeetingMinutes domain (working-group meeting records).

All test data is scoped to the sentinel academic year 9999-9999: a sentinel CampusPlan (which
seeds the WorkingGroupPlans) anchors the records. Cleanup removes the MeetingMinutes, their
notes, and any test-created attached Documents/Webpages by the captured unique_ids — never a
blanket delete.
"""
import pytest

from conftest import TEST_ACADEMIC_YEAR_NAME

from neomodel import db

from app.database.graph_schema import Campus
from app.database.identifiers import make_working_group_plan_identifier
from app.database.queries.committees.create import create_campus_plan
from app.database.queries.meeting_minutes.create import create_meeting_minutes
from app.database.queries.meeting_minutes.read import (
    get_meeting_minutes,
    minutes_panel_for_plan,
    minutes_panel_for_working_group,
)
from app.database.queries.meeting_minutes.update import (
    update_meeting_minutes,
    attach_document,
    attach_webpage,
    detach_document,
    add_minutes_note,
)
from app.database.queries.meeting_minutes.delete import delete_meeting_minutes
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError


pytestmark = [pytest.mark.integration]


@pytest.fixture
def cleanup_minutes(neo4j_connection):
    """Detach-delete every MeetingMinutes (with its notes + any attached Documents/Webpages,
    which the tests create fresh) whose unique_id the test appends. Order-independent."""
    ids = []
    yield ids
    if ids:
        db.cypher_query(
            """
            MATCH (m:MeetingMinutes) WHERE m.unique_id IN $ids
            OPTIONAL MATCH (m)-[:has_note]->(n:Note)
            OPTIONAL MATCH (m)-[:is_documented_by]->(att)
            DETACH DELETE m, n, att
            """,
            {"ids": ids},
        )
    # test_endpoint_flow deletes its minutes THROUGH the endpoint, which (by
    # design — attachments can be shared) leaves the attached Webpage behind as
    # an orphan the id-based cleanup above can no longer reach. Its unique-url
    # constraint then 500s the NEXT run's attach. Sweep the reserved test
    # domain unconditionally — example.edu can never be production data.
    db.cypher_query(
        "MATCH (w:Webpage) WHERE w.url STARTS WITH 'https://example.edu/' DETACH DELETE w"
    )


@pytest.fixture
def sentinel_web_plan(sentinel_academic_year, cleanup_plan_family):
    campuses = Campus.nodes.all()
    if not campuses:
        pytest.skip("No Campus reference data in the graph")
    campus_abbrev = campuses[0].abbreviation
    try:
        create_campus_plan(campus_abbrev, TEST_ACADEMIC_YEAR_NAME)
    except ValidationError:
        pass
    return {
        "campus_abbrev": campus_abbrev,
        "wgp_identifier": make_working_group_plan_identifier(TEST_ACADEMIC_YEAR_NAME, campus_abbrev, "web"),
    }


# --- Query layer -------------------------------------------------------------------

def test_create_and_get(sentinel_web_plan, cleanup_minutes):
    m = create_meeting_minutes(
        title="Web WG — sentinel meeting",
        content="# Agenda\n\n- Item one\n- Item two\n\n**Decision:** ship it.",
        working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
        meeting_date="2099-01-15",
    )
    cleanup_minutes.append(m.unique_id)

    data = get_meeting_minutes(m.unique_id)
    assert data["title"] == "Web WG — sentinel meeting"
    assert data["meeting_date"] == "2099-01-15"
    assert "Decision" in data["content"]
    assert data["working_group"] == "Web"
    assert data["academic_year"] == TEST_ACADEMIC_YEAR_NAME
    assert data["campus_abbrev"] == sentinel_web_plan["campus_abbrev"]
    assert data["date_created"]


def test_create_requires_title(sentinel_web_plan, cleanup_minutes):
    with pytest.raises(ValidationError):
        create_meeting_minutes(title="   ", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])


def test_create_missing_plan(cleanup_minutes):
    with pytest.raises(NotFoundError):
        create_meeting_minutes(title="x", working_group_plan_identifier=f"{TEST_ACADEMIC_YEAR_NAME}-nope-web")


def test_bad_meeting_date(sentinel_web_plan, cleanup_minutes):
    with pytest.raises(ValidationError):
        create_meeting_minutes(
            title="x", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
            meeting_date="15/01/2099",
        )


def test_create_by_campus_year_working_group(sentinel_web_plan, cleanup_minutes):
    m = create_meeting_minutes(
        title="via triple",
        campus_abbrev=sentinel_web_plan["campus_abbrev"],
        year_name=TEST_ACADEMIC_YEAR_NAME,
        working_group="web",
    )
    cleanup_minutes.append(m.unique_id)
    assert get_meeting_minutes(m.unique_id)["working_group_plan_identifier"] == sentinel_web_plan["wgp_identifier"]


def test_update(sentinel_web_plan, cleanup_minutes):
    m = create_meeting_minutes(title="orig", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_minutes.append(m.unique_id)
    updated = update_meeting_minutes(m.unique_id, title="new title", content="## updated body")
    assert updated["title"] == "new title"
    assert updated["content"] == "## updated body"


def test_attach_and_detach(sentinel_web_plan, cleanup_minutes):
    m = create_meeting_minutes(title="docs", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_minutes.append(m.unique_id)

    after_doc = attach_document(m.unique_id, "Minutes PDF", uri_path="https://example.edu/minutes.pdf")
    assert len(after_doc["documents"]) == 1
    doc_id = after_doc["documents"][0]["unique_id"]

    after_web = attach_webpage(m.unique_id, "Recording", "https://example.edu/recording")
    assert len(after_web["webpages"]) == 1

    after_detach = detach_document(m.unique_id, doc_id)
    assert len(after_detach["documents"]) == 0


def test_panel_and_note(sentinel_web_plan, cleanup_minutes):
    m = create_meeting_minutes(title="panel", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_minutes.append(m.unique_id)
    add_minutes_note(m.unique_id, "follow up with vendor")

    panel = minutes_panel_for_plan(sentinel_web_plan["wgp_identifier"])
    assert panel["exists"] is True
    assert panel["working_group"] == "Web"
    one = next((item for item in panel["minutes"] if item["unique_id"] == m.unique_id), None)
    assert one is not None
    assert len(one["notes"]) == 1


def test_panel_missing_plan_empty():
    panel = minutes_panel_for_working_group("zzz-nocampus", TEST_ACADEMIC_YEAR_NAME, "web")
    assert panel["exists"] is False
    assert panel["minutes"] == []


def test_delete(sentinel_web_plan, cleanup_minutes):
    m = create_meeting_minutes(title="del", working_group_plan_identifier=sentinel_web_plan["wgp_identifier"])
    cleanup_minutes.append(m.unique_id)
    assert delete_meeting_minutes(m.unique_id) is True
    with pytest.raises(NotFoundError):
        get_meeting_minutes(m.unique_id)


# --- Endpoint layer ----------------------------------------------------------------

@pytest.mark.api
def test_endpoint_flow(flask_client, sentinel_web_plan, cleanup_minutes):
    base = "/ati/data-api/v1/meeting-minutes"

    resp = flask_client.post(base, json={
        "action": "create_meeting_minutes",
        "title": "Endpoint minutes",
        "content": "## endpoint\n- a\n- b",
        "working_group_plan_identifier": sentinel_web_plan["wgp_identifier"],
        "meeting_date": "2099-03-01",
    })
    assert resp.status_code == 201, resp.get_json()
    uid = resp.get_json()["data"]["unique_id"]
    cleanup_minutes.append(uid)

    resp = flask_client.get(f"{base}/plan/{sentinel_web_plan['wgp_identifier']}")
    assert resp.status_code == 200
    assert any(item["unique_id"] == uid for item in resp.get_json()["data"]["minutes"])

    resp = flask_client.put(base, json={
        "action": "attach_webpage", "unique_id": uid, "url": "https://example.edu/rec", "name": "Rec",
    })
    assert resp.status_code == 201

    resp = flask_client.delete(f"{base}/{uid}")
    assert resp.status_code == 200

    resp = flask_client.get(f"{base}/item/{uid}")
    assert resp.status_code == 404
