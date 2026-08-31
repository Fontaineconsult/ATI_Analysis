"""
Tests for the interview-guides MCP features (interview_guides reads +
interview_guides_write, mirroring test_mcp_communities_write):

  unit         — read tools always register; write tools ONLY when
                 ATI_MCP_ALLOW_WRITE is on. No database.
  integration  — a reversible live round-trip: save a sentinel-titled guide via
                 the tool (people by employee_id, community by name, a real YSE
                 target), read it back, close it to sentinel minutes, then
                 delete everything created.
"""
import asyncio
import json

import pytest

from tests.conftest import TEST_ACADEMIC_YEAR_NAME

READ_TOOLS = (
    "list_interview_guides",
    "get_interview_guide",
    "list_guides_for_community",
)
WRITE_TOOLS = (
    "save_interview_guide",
    "update_interview_guide",
    "close_interview_guide",
)

GUIDE_TITLE = f"{TEST_ACADEMIC_YEAR_NAME} MCP Test Interview Guide"
COMMUNITY_NAME = f"{TEST_ACADEMIC_YEAR_NAME} MCP Guide Community"
EMPLOYEE_ID = f"{TEST_ACADEMIC_YEAR_NAME}-mcp-guide-person"
PERSON_NAME = f"{TEST_ACADEMIC_YEAR_NAME} MCP Guide Test Person"


def _build_with_write(monkeypatch, allow_write: bool):
    monkeypatch.setenv("ATI_MCP_ALLOW_WRITE", "true" if allow_write else "false")
    from app.database.cypher_runner.mcp.server import build_server

    return build_server()


def _tool_names(mcp) -> set:
    tools = getattr(getattr(mcp, "_tool_manager", None), "_tools", {})
    return set(tools)


@pytest.mark.unit
def test_read_tools_register_regardless_of_gate(monkeypatch):
    mcp, _ctx = _build_with_write(monkeypatch, allow_write=False)
    names = _tool_names(mcp)
    for t in READ_TOOLS:
        assert t in names, t


@pytest.mark.unit
def test_write_tools_gated(monkeypatch):
    names_off = _tool_names(_build_with_write(monkeypatch, allow_write=False)[0])
    for t in WRITE_TOOLS:
        assert t not in names_off, t
    names_on = _tool_names(_build_with_write(monkeypatch, allow_write=True)[0])
    for t in WRITE_TOOLS:
        assert t in names_on, t


def _payload(result):
    """FastMCP call_tool returns content blocks; the dict rides as JSON text."""
    block = result[0] if isinstance(result, (list, tuple)) else result
    text = getattr(block, "text", None)
    return json.loads(text) if text else block


@pytest.mark.integration
def test_guide_round_trip(monkeypatch, neo4j_connection, sentinel_academic_year):
    from neomodel import db
    from app.database.graph_schema import Campus, CommunityOfPractice, Person

    campuses = Campus.nodes.all()
    if not campuses:
        pytest.skip("No Campus reference data in the graph")
    campus = campuses[0].abbreviation
    rows, _ = db.cypher_query(
        """
        MATCH (yse:YearSuccessEvidence)-[:tracks]->(si:SuccessIndicator)
        WHERE coalesce(si.removed, false) = false
        RETURN yse.year_identifier LIMIT 1
        """,
    )
    if not rows:
        pytest.skip("No live YSE in the graph")
    target = rows[0][0]

    mcp, _ctx = _build_with_write(monkeypatch, allow_write=True)
    person = Person(name=PERSON_NAME, employee_id=EMPLOYEE_ID, active=False).save()
    community = CommunityOfPractice(name=COMMUNITY_NAME).save()
    try:
        created = _payload(asyncio.run(mcp.call_tool("save_interview_guide", {
            "title": GUIDE_TITLE,
            "campus_abbrev": campus,
            "year_name": TEST_ACADEMIC_YEAR_NAME,
            "content": "# MCP round-trip guide",
            "people_employee_ids": [EMPLOYEE_ID],
            "target_year_identifiers": [target],
            "community_names": [COMMUNITY_NAME],
        })))
        uid = created["unique_id"]
        assert [p["name"] for p in created["prepared_for"]] == [PERSON_NAME]
        assert [t["year_identifier"] for t in created["targets"]] == [target]
        assert [c["name"] for c in created["pertains_to_communities"]] == [COMMUNITY_NAME]
        assert created["resulted_in"] is None

        listed = _payload(asyncio.run(mcp.call_tool("list_guides_for_community", {
            "community_name": COMMUNITY_NAME,
        })))
        assert [g["unique_id"] for g in listed["guides"]] == [uid]

        # Update: replace targets with [], scalars in the same call.
        updated = _payload(asyncio.run(mcp.call_tool("update_interview_guide", {
            "unique_id": uid,
            "title": f"{GUIDE_TITLE} v2",
            "target_year_identifiers": [],
        })))
        assert updated["title"] == f"{GUIDE_TITLE} v2"
        assert updated["targets"] == []
        assert [p["name"] for p in updated["prepared_for"]] == [PERSON_NAME], \
            "omitted lists stay untouched"

        # Close the loop to sentinel minutes, then reopen.
        from app.database.identifiers import make_working_group_plan_identifier
        from app.database.queries.committees.create import create_campus_plan
        from app.database.queries.meeting_minutes.create import create_meeting_minutes
        from app.endpoints.data_api.errors.custom_exceptions import ValidationError
        try:
            create_campus_plan(campus, TEST_ACADEMIC_YEAR_NAME)
        except ValidationError:
            pass
        minutes = create_meeting_minutes(
            title=f"{TEST_ACADEMIC_YEAR_NAME} MCP guide-closure minutes",
            working_group_plan_identifier=make_working_group_plan_identifier(
                TEST_ACADEMIC_YEAR_NAME, campus, "web"),
        )
        closed = _payload(asyncio.run(mcp.call_tool("close_interview_guide", {
            "guide_unique_id": uid,
            "minutes_unique_id": minutes.unique_id,
        })))
        assert closed["resulted_in"]["unique_id"] == minutes.unique_id
        reopened = _payload(asyncio.run(mcp.call_tool("close_interview_guide", {
            "guide_unique_id": uid,
        })))
        assert reopened["resulted_in"] is None
    finally:
        db.cypher_query(
            """
            MATCH (g:InterviewGuide) WHERE g.title STARTS WITH $p DETACH DELETE g
            """, {"p": TEST_ACADEMIC_YEAR_NAME})
        db.cypher_query(
            "MATCH (m:MeetingMinutes) WHERE m.title STARTS WITH $p DETACH DELETE m",
            {"p": TEST_ACADEMIC_YEAR_NAME})
        db.cypher_query(
            "MATCH (cp:CampusPlan) WHERE cp.plan_identifier STARTS WITH $p "
            "OPTIONAL MATCH (cp)-[:has_working_group_plan]->(wgp) DETACH DELETE cp, wgp",
            {"p": TEST_ACADEMIC_YEAR_NAME})
        db.cypher_query(
            "MATCH (p:Person {employee_id: $eid}) DETACH DELETE p", {"eid": EMPLOYEE_ID})
        db.cypher_query(
            "MATCH (c:CommunityOfPractice {name: $n}) DETACH DELETE c", {"n": COMMUNITY_NAME})
