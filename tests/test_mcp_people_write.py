"""
Tests for the people & org-units MCP write capability (people_write feature).

Two layers, mirroring test_mcp_notes_annotation:

  unit         — the ten write tools register ONLY when ATI_MCP_ALLOW_WRITE is on. No database.
  integration  — a reversible live round-trip: create a sentinel-named Person / Vendor /
                 Department through the registered tools, exercise update + assignment tools,
                 assert the nodes and edges landed, then delete everything created.

Isolation: Person/Vendor/Department are not year-scoped, so the sentinel-year cleanup fixtures
don't cover them. Every node this test creates carries the sentinel year name (9999-9999) in its
business key, and the finally block deletes exactly those keys — it cannot match production data.
Real ATIWorkingGroup nodes are only connected to (edges vanish with our nodes), never modified.
"""
import asyncio

import pytest

from tests.conftest import TEST_ACADEMIC_YEAR_NAME

PEOPLE_WRITE_TOOLS = (
    "create_person",
    "update_person",
    "assign_person_to_working_group",
    "assign_person_to_department",
    "assign_person_to_college",
    "assign_person_to_vendor",
    "create_department",
    "create_college",
    "create_vendor",
    "update_vendor",
)

EMPLOYEE_ID = f"{TEST_ACADEMIC_YEAR_NAME}-mcp-person"
PERSON_NAME = f"{TEST_ACADEMIC_YEAR_NAME} MCP Test Person"
VENDOR_NAME = f"{TEST_ACADEMIC_YEAR_NAME} MCP Test Vendor"
VENDOR_RENAMED = f"{TEST_ACADEMIC_YEAR_NAME} MCP Test Vendor (renamed)"
DEPARTMENT_NAME = f"{TEST_ACADEMIC_YEAR_NAME} MCP Test Department"


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
def test_people_write_tools_absent_without_write_gate(monkeypatch):
    mcp, ctx = _build_with_write(monkeypatch, allow_write=False)
    try:
        names = _tool_names(mcp)
        for tool in PEOPLE_WRITE_TOOLS:
            assert tool not in names, f"{tool!r} must not register without the write gate"
    finally:
        ctx.executor.close()


@pytest.mark.unit
def test_people_write_tools_present_with_write_gate(monkeypatch):
    mcp, ctx = _build_with_write(monkeypatch, allow_write=True)
    try:
        names = _tool_names(mcp)
        for tool in PEOPLE_WRITE_TOOLS:
            assert tool in names, f"{tool!r} should register with the write gate on"
    finally:
        ctx.executor.close()


# --------------------------------------------------------------------------- #
# Integration — reversible live round-trip                                     #
# --------------------------------------------------------------------------- #
@pytest.mark.integration
def test_people_and_org_units_round_trip(monkeypatch):
    """Create person/vendor/department via the registered tools, update + assign, clean up."""
    from neomodel import db

    mcp, ctx = _build_with_write(monkeypatch, allow_write=True)
    try:
        # --- people: create with one membership, update, add a second one ----
        asyncio.run(mcp.call_tool("create_person", {
            "employee_id": EMPLOYEE_ID,
            "name": PERSON_NAME,
            "email": "mcp-test@example.edu",
            "title": "Test Fixture",
            "working_groups": ["Web"],
        }))
        asyncio.run(mcp.call_tool("update_person", {
            "employee_id": EMPLOYEE_ID,
            "title": "Updated Test Fixture",
        }))
        asyncio.run(mcp.call_tool("assign_person_to_working_group", {
            "employee_id": EMPLOYEE_ID,
            "working_group_name": "Procurement",
        }))

        rows, _ = db.cypher_query(
            "MATCH (p:Person {employee_id:$e}) "
            "OPTIONAL MATCH (p)-[:participates_in]->(w:ATIWorkingGroup) "
            "RETURN p.title, collect(w.name)",
            {"e": EMPLOYEE_ID},
        )
        assert rows, "create_person should have created the Person"
        title, wgs = rows[0]
        assert title == "Updated Test Fixture", "update_person should patch only passed fields"
        assert {"Web", "Procurement"} <= set(wgs), \
            "assign_person_to_working_group must ADD a membership, not replace"

        # --- vendor: create, employ the person, rename -----------------------
        asyncio.run(mcp.call_tool("create_vendor", {"name": VENDOR_NAME, "location": "Remote"}))
        asyncio.run(mcp.call_tool("assign_person_to_vendor", {
            "vendor_name": VENDOR_NAME,
            "employee_id": EMPLOYEE_ID,
        }))
        asyncio.run(mcp.call_tool("update_vendor", {
            "name": VENDOR_NAME,
            "new_name": VENDOR_RENAMED,
        }))
        rows, _ = db.cypher_query(
            "MATCH (v:Vendor {name:$n})-[:employs]->(p:Person {employee_id:$e}) RETURN v.name",
            {"n": VENDOR_RENAMED, "e": EMPLOYEE_ID},
        )
        assert rows, "employs edge should survive the vendor rename"

        # --- department: create, employ the person ---------------------------
        asyncio.run(mcp.call_tool("create_department", {"name": DEPARTMENT_NAME}))
        asyncio.run(mcp.call_tool("assign_person_to_department", {
            "department_name": DEPARTMENT_NAME,
            "employee_id": EMPLOYEE_ID,
        }))
        rows, _ = db.cypher_query(
            "MATCH (d:Department {name:$n})-[:employs]->(p:Person {employee_id:$e}) RETURN d.name",
            {"n": DEPARTMENT_NAME, "e": EMPLOYEE_ID},
        )
        assert rows, "assign_person_to_department should create the employs edge"

    finally:
        # Exact-key cleanup of everything this test can have created.
        db.cypher_query("MATCH (p:Person {employee_id:$e}) DETACH DELETE p", {"e": EMPLOYEE_ID})
        db.cypher_query("MATCH (v:Vendor) WHERE v.name IN $names DETACH DELETE v",
                        {"names": [VENDOR_NAME, VENDOR_RENAMED]})
        db.cypher_query("MATCH (d:Department {name:$n}) DETACH DELETE d", {"n": DEPARTMENT_NAME})
        ctx.executor.close()
