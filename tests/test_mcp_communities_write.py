"""
Tests for the communities-of-practice MCP write capability (communities_write feature).

Two layers, mirroring test_mcp_people_write:

  unit         — the four write tools register ONLY when ATI_MCP_ALLOW_WRITE is on. No database.
  integration  — a reversible live round-trip: create a sentinel-named community + person via
                 the tools, add a membership and an indicator stake, assert the edges landed,
                 then delete everything created.

Isolation: the community and person carry the sentinel year name (9999-9999) in their business
keys; the finally block deletes exactly those keys. The real SuccessIndicator used as a stake
target is shared reference data — only the has_stake_in edge is created, and it vanishes with
the sentinel community.
"""
import asyncio

import pytest

from tests.conftest import TEST_ACADEMIC_YEAR_NAME

COMMUNITIES_WRITE_TOOLS = (
    "create_community",
    "assign_person_to_community",
    "add_community_stake",
    "remove_community_stake",
)

COMMUNITY_NAME = f"{TEST_ACADEMIC_YEAR_NAME} MCP Test Community"
EMPLOYEE_ID = f"{TEST_ACADEMIC_YEAR_NAME}-mcp-community-person"
PERSON_NAME = f"{TEST_ACADEMIC_YEAR_NAME} MCP Community Test Person"


def _build_with_write(monkeypatch, allow_write: bool):
    """Build a fresh MCP server with ATI_MCP_ALLOW_WRITE forced on/off. No DB touched."""
    monkeypatch.setenv("ATI_MCP_ALLOW_WRITE", "true" if allow_write else "false")
    from app.database.cypher_runner.mcp.server import build_server

    return build_server()


def _tool_names(mcp) -> set:
    tools = getattr(getattr(mcp, "_tool_manager", None), "_tools", {})
    return set(tools)


# --------------------------------------------------------------------------- #
# Unit — gating / registration (no DB)                                         #
# --------------------------------------------------------------------------- #
@pytest.mark.unit
def test_communities_write_tools_absent_without_write_gate(monkeypatch):
    mcp, ctx = _build_with_write(monkeypatch, allow_write=False)
    try:
        names = _tool_names(mcp)
        for tool in COMMUNITIES_WRITE_TOOLS:
            assert tool not in names, f"{tool!r} must not register without the write gate"
    finally:
        ctx.executor.close()


@pytest.mark.unit
def test_communities_write_tools_present_with_write_gate(monkeypatch):
    mcp, ctx = _build_with_write(monkeypatch, allow_write=True)
    try:
        names = _tool_names(mcp)
        for tool in COMMUNITIES_WRITE_TOOLS:
            assert tool in names, f"{tool!r} should register with the write gate on"
    finally:
        ctx.executor.close()


# --------------------------------------------------------------------------- #
# Integration — reversible live round-trip                                     #
# --------------------------------------------------------------------------- #
@pytest.mark.integration
def test_communities_round_trip(monkeypatch):
    """Create community + person, add membership + stake, verify, remove, clean up."""
    from neomodel import db

    mcp, ctx = _build_with_write(monkeypatch, allow_write=True)
    try:
        from app.database.graph_schema import SuccessIndicator

        si = SuccessIndicator.nodes.filter(removed=False).first()

        asyncio.run(mcp.call_tool("create_community", {
            "name": COMMUNITY_NAME,
            "description": "MCP round-trip fixture",
        }))
        asyncio.run(mcp.call_tool("create_person", {
            "employee_id": EMPLOYEE_ID,
            "name": PERSON_NAME,
            "email": "mcp-community-test@example.edu",
            "title": "Test Fixture",
        }))
        asyncio.run(mcp.call_tool("assign_person_to_community", {
            "employee_id": EMPLOYEE_ID,
            "community_name": COMMUNITY_NAME,
            "note": "round-trip member",
        }))
        asyncio.run(mcp.call_tool("add_community_stake", {
            "community_name": COMMUNITY_NAME,
            "composite_key": si.composite_key,
            "note": "round-trip stake",
        }))

        rows, _ = db.cypher_query(
            """
            MATCH (c:CommunityOfPractice {name: $name})
            RETURN size([(p:Person)-[:member_of_community]->(c) | 1]) AS members,
                   [(c)-[s:has_stake_in]->(si) | {key: si.composite_key, note: s.note}] AS stakes
            """,
            {"name": COMMUNITY_NAME},
        )
        members, stakes = rows[0]
        assert members == 1
        assert stakes == [{"key": si.composite_key, "note": "round-trip stake"}]

        asyncio.run(mcp.call_tool("remove_community_stake", {
            "community_name": COMMUNITY_NAME,
            "composite_key": si.composite_key,
        }))
        rows, _ = db.cypher_query(
            "MATCH (c:CommunityOfPractice {name: $name})-[s:has_stake_in]->() RETURN count(s)",
            {"name": COMMUNITY_NAME},
        )
        assert rows[0][0] == 0
    finally:
        db.cypher_query(
            "MATCH (c:CommunityOfPractice {name: $name}) DETACH DELETE c",
            {"name": COMMUNITY_NAME},
        )
        db.cypher_query(
            "MATCH (p:Person {employee_id: $eid}) DETACH DELETE p",
            {"eid": EMPLOYEE_ID},
        )
        ctx.executor.close()
