"""
Meeting mode's data path: the two edges and the appends behind the notes pad.

  open_meeting_minutes_for_day  one MeetingMinutes per working group per day,
                                returned unchanged when it already exists
  append_minutes_entry          a timestamped, attributed Markdown line under
                                the plan's heading; asserts minutes -[discusses]-> Plan
  link_subtask_to_minutes       subtask -[raised_in]-> MeetingMinutes ("Make task")
  add_plan(minutes_unique_id)   plan -[raised_in]-> MeetingMinutes ("New plan"), and the
                                created plan comes back so it can go on stage
  tasks_board                   carries completed_at (the "since last meeting" count)

Everything is sentinel-scoped (9999-9999 campus plan; ZZZ-TEST prefixed
plans and people) and torn down by id or prefix, never by label.
"""
import pytest
from neomodel import db

from conftest import TEST_ACADEMIC_YEAR_NAME

from app.database.graph_schema import (
    AcademicYear, AsanaSubtask, Campus, Person, Plan, YearSuccessEvidence,
)
from app.database.identifiers import make_working_group_plan_identifier
from app.database.queries.committees.create import create_campus_plan
from app.database.queries.asana.update import link_subtask_to_minutes
from app.database.queries.implementation.create import add_plan
from app.database.queries.meeting_minutes.create import (
    create_meeting_minutes,
    open_meeting_minutes_for_day,
)
from app.database.queries.meeting_minutes.read import get_meeting_minutes
from app.database.queries.meeting_minutes.update import append_minutes_entry
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError

pytestmark = [pytest.mark.integration]

SENTINEL = "ZZZ-TEST meeting mode"


@pytest.fixture
def cleanup_minutes(neo4j_connection):
    ids = []
    yield ids
    if ids:
        db.cypher_query(
            "MATCH (m:MeetingMinutes) WHERE m.unique_id IN $ids DETACH DELETE m",
            {"ids": ids},
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


@pytest.fixture
def sentinel_plans(neo4j_connection):
    a = Plan(name=f"{SENTINEL} plan A", description=f"{SENTINEL} description A").save()
    b = Plan(name=f"{SENTINEL} plan B", description=f"{SENTINEL} description B").save()
    yield a, b
    db.cypher_query(
        """
        MATCH (p:Plan) WHERE p.description STARTS WITH $prefix
        OPTIONAL MATCH (p)-[:has_asana_subtask]->(s:AsanaSubtask)
        DETACH DELETE s, p
        """,
        {"prefix": SENTINEL},
    )


@pytest.fixture
def sentinel_person(neo4j_connection):
    p = Person(name=f"{SENTINEL} Recorder", email="zzz-test-recorder@example.edu").save()
    yield p
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )


# --- open_meeting_minutes_for_day ------------------------------------------------

def test_open_for_day_creates_then_reuses(sentinel_web_plan, sentinel_person, cleanup_minutes):
    first, created = open_meeting_minutes_for_day(
        sentinel_web_plan["campus_abbrev"], TEST_ACADEMIC_YEAR_NAME, "web",
        meeting_date="2099-05-05", recorded_by_unique_id=sentinel_person.unique_id,
    )
    cleanup_minutes.append(first.unique_id)
    assert created is True
    assert first.title == "Web working group, 2099-05-05"

    again, created_again = open_meeting_minutes_for_day(
        sentinel_web_plan["campus_abbrev"], TEST_ACADEMIC_YEAR_NAME, "web",
        meeting_date="2099-05-05",
    )
    assert created_again is False
    assert again.unique_id == first.unique_id

    data = get_meeting_minutes(first.unique_id)
    assert data["recorded_by"]["unique_id"] == sentinel_person.unique_id
    assert data["discussed_plans"] == []


def test_open_for_day_is_per_day(sentinel_web_plan, cleanup_minutes):
    m1, _ = open_meeting_minutes_for_day(
        sentinel_web_plan["campus_abbrev"], TEST_ACADEMIC_YEAR_NAME, "web", meeting_date="2099-05-06",
    )
    cleanup_minutes.append(m1.unique_id)
    m2, created = open_meeting_minutes_for_day(
        sentinel_web_plan["campus_abbrev"], TEST_ACADEMIC_YEAR_NAME, "web", meeting_date="2099-05-07",
    )
    cleanup_minutes.append(m2.unique_id)
    assert created is True
    assert m2.unique_id != m1.unique_id


def test_open_for_day_missing_plan():
    with pytest.raises(NotFoundError):
        open_meeting_minutes_for_day("zz-no-campus", TEST_ACADEMIC_YEAR_NAME, "web")


# --- append_minutes_entry --------------------------------------------------------

def _minutes(sentinel_web_plan, cleanup_minutes, content=None):
    m = create_meeting_minutes(
        title="Meeting mode append", content=content,
        working_group_plan_identifier=sentinel_web_plan["wgp_identifier"],
        meeting_date="2099-05-08",
    )
    cleanup_minutes.append(m.unique_id)
    return m


def test_append_writes_heading_line_and_edge(sentinel_web_plan, sentinel_plans, sentinel_person, cleanup_minutes):
    plan_a, _ = sentinel_plans
    m = _minutes(sentinel_web_plan, cleanup_minutes)

    result = append_minutes_entry(
        m.unique_id, "Frank confirmed two of three leads.",
        plan_unique_id=plan_a.unique_id, author_unique_id=sentinel_person.unique_id,
        clock="10:04",
    )
    expected_line = f"- 10:04 {sentinel_person.name}: Frank confirmed two of three leads."
    assert result["appended_line"] == expected_line
    assert result["content"] == f"### {plan_a.name}\n{expected_line}"
    assert [p["unique_id"] for p in result["discussed_plans"]] == [plan_a.unique_id]

    # Plan-side accessor sees the same edge.
    plan_a.refresh()
    assert [x.unique_id for x in plan_a.discussed_in.all()] == [m.unique_id]


def test_append_shares_heading_and_moves_between_plans(sentinel_web_plan, sentinel_plans, cleanup_minutes):
    plan_a, plan_b = sentinel_plans
    m = _minutes(sentinel_web_plan, cleanup_minutes, content="# Agenda\n\n- opening")

    append_minutes_entry(m.unique_id, "first on A", plan_unique_id=plan_a.unique_id, clock="10:00")
    append_minutes_entry(m.unique_id, "second on A", plan_unique_id=plan_a.unique_id, clock="10:01")
    append_minutes_entry(m.unique_id, "then B", plan_unique_id=plan_b.unique_id, clock="10:02", kind="decision")
    result = append_minutes_entry(m.unique_id, "back to A", plan_unique_id=plan_a.unique_id, clock="10:03", kind="ask")

    assert result["content"] == (
        "# Agenda\n\n- opening\n\n"
        f"### {plan_a.name}\n- 10:00 first on A\n- 10:01 second on A\n\n"
        f"### {plan_b.name}\n- 10:02 Decision: then B\n\n"
        f"### {plan_a.name}\n- 10:03 Ask: back to A"
    )
    # One edge per plan no matter how many entries.
    assert sorted(p["unique_id"] for p in result["discussed_plans"]) == sorted([plan_a.unique_id, plan_b.unique_id])
    rows, _ = db.cypher_query(
        "MATCH (m:MeetingMinutes {unique_id: $id})-[r:discusses]->(:Plan) RETURN count(r)",
        {"id": m.unique_id},
    )
    assert rows[0][0] == 2


def test_append_without_plan_is_a_plain_line(sentinel_web_plan, cleanup_minutes):
    m = _minutes(sentinel_web_plan, cleanup_minutes)
    result = append_minutes_entry(m.unique_id, "general remark\nwith a break", clock="09:59")
    assert result["content"] == "- 09:59 general remark with a break"
    assert result["discussed_plans"] == []


def test_append_validates(sentinel_web_plan, sentinel_plans, cleanup_minutes):
    plan_a, _ = sentinel_plans
    m = _minutes(sentinel_web_plan, cleanup_minutes)
    with pytest.raises(ValidationError):
        append_minutes_entry(m.unique_id, "   ")
    with pytest.raises(ValidationError):
        append_minutes_entry(m.unique_id, "x", kind="shout")
    with pytest.raises(NotFoundError):
        append_minutes_entry(m.unique_id, "x", plan_unique_id="no-such-plan")
    with pytest.raises(NotFoundError):
        append_minutes_entry("no-such-minutes", "x", plan_unique_id=plan_a.unique_id)


# --- link_subtask_to_minutes -----------------------------------------------------

def test_link_subtask_to_minutes(sentinel_web_plan, sentinel_plans, cleanup_minutes):
    plan_a, _ = sentinel_plans
    m = _minutes(sentinel_web_plan, cleanup_minutes)
    sub = AsanaSubtask(asana_gid=f"{SENTINEL}-gid-1", name="Recruit Sonoma lead").save()
    plan_a.asana_subtasks.connect(sub)

    row = link_subtask_to_minutes(plan_a.unique_id, sub.asana_gid, m.unique_id)
    assert row["raised_in"]["unique_id"] == m.unique_id
    assert row["raised_in"]["meeting_date"] == "2099-05-08"

    with pytest.raises(NotFoundError):
        link_subtask_to_minutes(plan_a.unique_id, sub.asana_gid, "no-such-minutes")
    with pytest.raises(NotFoundError):
        link_subtask_to_minutes(plan_a.unique_id, "not-on-plan", m.unique_id)


# --- endpoint layer --------------------------------------------------------------

@pytest.mark.api
def test_endpoint_open_and_append(flask_client, sentinel_web_plan, sentinel_plans, cleanup_minutes):
    plan_a, _ = sentinel_plans
    base = "/ati/data-api/v1/meeting-minutes"

    resp = flask_client.post(base, json={
        "action": "open_meeting_minutes_for_day",
        "campus_abbrev": sentinel_web_plan["campus_abbrev"],
        "year_name": TEST_ACADEMIC_YEAR_NAME,
        "working_group": "web",
        "meeting_date": "2099-05-09",
    })
    assert resp.status_code == 201, resp.get_json()
    uid = resp.get_json()["data"]["unique_id"]
    cleanup_minutes.append(uid)

    resp = flask_client.post(base, json={
        "action": "open_meeting_minutes_for_day",
        "campus_abbrev": sentinel_web_plan["campus_abbrev"],
        "year_name": TEST_ACADEMIC_YEAR_NAME,
        "working_group": "web",
        "meeting_date": "2099-05-09",
    })
    assert resp.status_code == 200
    assert resp.get_json()["data"]["unique_id"] == uid

    resp = flask_client.put(base, json={
        "action": "append_entry", "unique_id": uid,
        "text": "cadence is monthly", "plan_unique_id": plan_a.unique_id,
        "kind": "decision", "clock": "10:07",
    })
    assert resp.status_code == 200, resp.get_json()
    data = resp.get_json()["data"]
    assert data["appended_line"] == "- 10:07 Decision: cadence is monthly"
    assert data["discussed_plans"][0]["unique_id"] == plan_a.unique_id

    resp = flask_client.put(base, json={"action": "append_entry", "unique_id": uid, "text": ""})
    assert resp.status_code == 400

    resp = flask_client.post(base, json={"action": "open_meeting_minutes_for_day", "campus_abbrev": "x"})
    assert resp.status_code == 400


# --- add_plan with minutes_unique_id ("New plan" on stage) ---------------------

@pytest.fixture
def sentinel_yse(sentinel_web_plan, sentinel_academic_year):
    """A YearSuccessEvidence in the sentinel year at the fixture campus, so a
    plan can be created through add_plan the way meeting mode does (by
    furthered_yse_identifier). Plans with the SENTINEL description prefix are
    torn down with it."""
    campus = Campus.nodes.get(abbreviation=sentinel_web_plan["campus_abbrev"])
    year = AcademicYear.nodes.get(name=TEST_ACADEMIC_YEAR_NAME)
    identifier = f"{TEST_ACADEMIC_YEAR_NAME}-zz.9-zzz-{campus.abbreviation}"
    db.cypher_query(
        "MATCH (y:YearSuccessEvidence {year_identifier: $id}) DETACH DELETE y", {"id": identifier},
    )
    yse = YearSuccessEvidence(year_identifier=identifier).save()
    yse.campus.connect(campus)
    yse.academic_year.connect(year)
    yield yse
    db.cypher_query(
        """
        MATCH (p:Plan) WHERE p.description STARTS WITH $prefix
        OPTIONAL MATCH (p)-[:has_asana_subtask]->(s:AsanaSubtask)
        DETACH DELETE s, p
        """,
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (y:YearSuccessEvidence {year_identifier: $id}) DETACH DELETE y", {"id": identifier},
    )


def test_add_plan_records_the_meeting_it_was_raised_in(sentinel_web_plan, sentinel_yse, sentinel_person, cleanup_minutes):
    m = _minutes(sentinel_web_plan, cleanup_minutes)

    created = add_plan({
        "name": f"{SENTINEL} raised plan",
        "description": f"{SENTINEL} raised in the meeting",
        "academic_year_name": TEST_ACADEMIC_YEAR_NAME,
        "furthered_yse_identifier": sentinel_yse.year_identifier,
        "plan_status": "In Progress",
        "minutes_unique_id": m.unique_id,
    })
    # The created plan comes back, so the caller can put it on stage.
    assert isinstance(created, dict)
    assert created["unique_id"]
    assert created["plan_status"] == "In Progress"

    plan = Plan.nodes.get(unique_id=created["unique_id"])
    assert plan.raised_in.single().unique_id == m.unique_id
    assert [y.year_identifier for y in plan.furthered_year_success_indicators.all()] == [sentinel_yse.year_identifier]

    data = get_meeting_minutes(m.unique_id)
    assert [p["unique_id"] for p in data["raised_plans"]] == [plan.unique_id]
    # Raised is not discussed until a line lands under the plan's heading.
    assert data["discussed_plans"] == []

    result = append_minutes_entry(
        m.unique_id, "New plan: raised plan", plan_unique_id=plan.unique_id,
        author_unique_id=sentinel_person.unique_id, kind="decision", clock="10:12",
    )
    assert result["appended_line"] == f"- 10:12 {sentinel_person.name}: Decision: New plan: raised plan"
    assert [p["unique_id"] for p in result["discussed_plans"]] == [plan.unique_id]
    assert [p["unique_id"] for p in result["raised_plans"]] == [plan.unique_id]


def test_add_plan_without_minutes_has_no_origin(sentinel_yse):
    created = add_plan({
        "name": f"{SENTINEL} desk plan",
        "description": f"{SENTINEL} created at the desk",
        "academic_year_name": TEST_ACADEMIC_YEAR_NAME,
        "furthered_yse_identifier": sentinel_yse.year_identifier,
    })
    plan = Plan.nodes.get(unique_id=created["unique_id"])
    assert plan.raised_in.single() is None
    assert plan.plan_status == "Not Started"


def test_add_plan_with_unknown_minutes_creates_nothing(sentinel_yse):
    description = f"{SENTINEL} never created"
    with pytest.raises(NotFoundError):
        add_plan({
            "name": f"{SENTINEL} orphan",
            "description": description,
            "academic_year_name": TEST_ACADEMIC_YEAR_NAME,
            "furthered_yse_identifier": sentinel_yse.year_identifier,
            "minutes_unique_id": "no-such-minutes",
        })
    assert Plan.nodes.get_or_none(description=description) is None


@pytest.mark.api
def test_endpoint_create_plan_returns_the_plan(flask_client, sentinel_web_plan, sentinel_yse, cleanup_minutes):
    m = _minutes(sentinel_web_plan, cleanup_minutes)
    payload = {
        "action": "add_plan",
        "name": f"{SENTINEL} endpoint plan",
        "description": f"{SENTINEL} created through POST /plans",
        "academic_year_name": TEST_ACADEMIC_YEAR_NAME,
        "furthered_yse_identifier": sentinel_yse.year_identifier,
        "plan_status": "In Progress",
        "minutes_unique_id": m.unique_id,
    }
    resp = flask_client.post("/ati/data-api/v1/plans", json=payload)
    assert resp.status_code == 201, resp.get_json()
    body = resp.get_json()
    assert body["status"] == "success"
    plan = body["data"]["plan"]
    assert plan["unique_id"]
    assert plan["name"] == payload["name"]
    assert Plan.nodes.get(unique_id=plan["unique_id"]).raised_in.single().unique_id == m.unique_id

    resp = flask_client.post("/ati/data-api/v1/plans", json={
        **payload, "description": f"{SENTINEL} bad minutes", "minutes_unique_id": "no-such-minutes",
    })
    assert resp.status_code == 404
