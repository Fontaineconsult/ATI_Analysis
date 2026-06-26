"""
Tests for the transcript-annotation MCP capability.

Two layers:

  unit         — the write tools (annotate_yse / annotate_implementation) register ONLY when
                 ATI_MCP_ALLOW_WRITE is on, and the discovery tools register unconditionally.
                 Also checks the deterministic note-name generator. No database.
  integration  — a reversible live round-trip: build the server with writes on, call each
                 annotate tool against a sentinel-year YSE / Process, assert the note landed
                 (and, for the implementation, that the academic year was recorded on the
                 DocumentedByRel), then delete everything created.

The integration test follows the suite's isolation rule: all created nodes are scoped to the
sentinel academic year (9999-9999) and removed in a finally block; `cleanup_yse_family` is the
backstop for the YSE.
"""
import asyncio

import pytest

from tests.conftest import TEST_ACADEMIC_YEAR_NAME


# --------------------------------------------------------------------------- #
# Helpers                                                                      #
# --------------------------------------------------------------------------- #
def _build_with_write(monkeypatch, allow_write: bool):
    """Build a fresh MCP server with ATI_MCP_ALLOW_WRITE forced on/off. No DB touched."""
    monkeypatch.setenv("ATI_MCP_ALLOW_WRITE", "true" if allow_write else "false")
    from app.database.cypher_runner.mcp.server import build_server

    return build_server()


def _tool_names(mcp) -> set:
    """The registered tool names, via the same internal manager server.py reports from."""
    tools = getattr(getattr(mcp, "_tool_manager", None), "_tools", {})
    return set(tools)


# --------------------------------------------------------------------------- #
# Unit — gating / registration (no DB)                                         #
# --------------------------------------------------------------------------- #
@pytest.mark.unit
def test_discovery_tools_always_registered(monkeypatch):
    """The 5 transcript-discovery queries are read-only and present regardless of the write gate."""
    mcp, ctx = _build_with_write(monkeypatch, allow_write=False)
    try:
        names = _tool_names(mcp)
        for tool in (
            "yse_catalog_for_year",
            "search_implementations",
            "search_success_indicators",
            "notes_for_yse",
            "notes_for_implementation",
        ):
            assert tool in names, f"discovery tool {tool!r} should always register"
    finally:
        ctx.executor.close()


@pytest.mark.unit
def test_annotate_tools_absent_without_write_gate(monkeypatch):
    mcp, ctx = _build_with_write(monkeypatch, allow_write=False)
    try:
        names = _tool_names(mcp)
        assert "annotate_yse" not in names
        assert "annotate_implementation" not in names
    finally:
        ctx.executor.close()


@pytest.mark.unit
def test_annotate_tools_present_with_write_gate(monkeypatch):
    mcp, ctx = _build_with_write(monkeypatch, allow_write=True)
    try:
        names = _tool_names(mcp)
        assert "annotate_yse" in names
        assert "annotate_implementation" in names
    finally:
        ctx.executor.close()


@pytest.mark.unit
def test_generated_note_name_is_deterministic_and_target_scoped():
    """Same (content, target) -> same name (idempotent); different target -> different name."""
    from app.database.cypher_runner.mcp.features.notes_write import _generate_name

    content = "Discussed remediation backlog for the captioning service."
    a1 = _generate_name(content, None, "yse:2025-2026-1.1-web-sfsu")
    a2 = _generate_name(content, None, "yse:2025-2026-1.1-web-sfsu")
    b = _generate_name(content, None, "yse:2025-2026-1.1-web-ssu")
    assert a1 == a2          # deterministic
    assert a1 != b           # target-scoped
    # different content -> different name even with the same title/target
    c = _generate_name(content + " More.", None, "yse:2025-2026-1.1-web-sfsu")
    assert c != a1


@pytest.mark.unit
def test_build_note_dict_rejects_empty_content():
    from app.database.cypher_runner.mcp.features.notes_write import _build_note_dict

    with pytest.raises(ValueError):
        _build_note_dict("   ", None, "yse:x", None, None)


# --------------------------------------------------------------------------- #
# Integration — reversible live round-trip                                     #
# --------------------------------------------------------------------------- #
@pytest.mark.integration
def test_annotate_yse_and_implementation_round_trip(
    monkeypatch, sentinel_academic_year, cleanup_yse_family
):
    """Call the real registered tools against sentinel nodes; assert the notes attach; clean up."""
    from neomodel import db
    from app.database.graph_schema import YearSuccessEvidence, Process

    mcp, ctx = _build_with_write(monkeypatch, allow_write=True)

    yid = f"{TEST_ACADEMIC_YEAR_NAME}-annot-test-web-sfsu"
    proc = None
    try:
        # --- arrange: a sentinel YSE and a sentinel Process ------------------
        yse = YearSuccessEvidence(year_identifier=yid).save()
        yse.academic_year.connect(sentinel_academic_year)
        proc = Process(title=f"{TEST_ACADEMIC_YEAR_NAME}-annot-test-process").save()

        # --- act: invoke the registered MCP tools ----------------------------
        asyncio.run(mcp.call_tool("annotate_yse", {
            "year_identifier": yid,
            "content": "Captioning backlog discussed; owner to report next month.",
            "title": "Captioning backlog",
        }))
        asyncio.run(mcp.call_tool("annotate_implementation", {
            "implementation_id": proc.unique_id,
            "implementation_type": "Process",
            "content": "Agreed to add an automated caption QA step.",
            "academic_year": TEST_ACADEMIC_YEAR_NAME,
            "title": "Caption QA step",
        }))

        # --- assert: the YSE note attached via has_note ----------------------
        yse_notes, _ = db.cypher_query(
            "MATCH (:YearSuccessEvidence {year_identifier:$y})-[:has_note]->(n:Note) "
            "RETURN n.content",
            {"y": yid},
        )
        assert any("Captioning backlog discussed" in row[0] for row in yse_notes), \
            "annotate_yse should create a has_note edge to a Note"

        # --- assert: the implementation note attached, year recorded ---------
        impl_notes, _ = db.cypher_query(
            "MATCH (:Process {unique_id:$id})-[r:is_documented_by]->(n:Note) "
            "RETURN n.content, r.included_in_years",
            {"id": proc.unique_id},
        )
        assert impl_notes, "annotate_implementation should create an is_documented_by edge"
        content, included_years = impl_notes[0]
        assert "automated caption QA" in content
        assert TEST_ACADEMIC_YEAR_NAME in (included_years or []), \
            "academic_year should be recorded in DocumentedByRel.included_in_years"

    finally:
        # Delete the notes via traversal from the test nodes (scoped, safe), then the Process.
        # The YSE itself is removed by cleanup_yse_family.
        db.cypher_query(
            "MATCH (:YearSuccessEvidence {year_identifier:$y})-[:has_note]->(n:Note) DETACH DELETE n",
            {"y": yid},
        )
        if proc is not None:
            db.cypher_query(
                "MATCH (:Process {unique_id:$id})-[:is_documented_by]->(n:Note) DETACH DELETE n",
                {"id": proc.unique_id},
            )
            db.cypher_query("MATCH (p:Process {unique_id:$id}) DETACH DELETE p",
                            {"id": proc.unique_id})
        ctx.executor.close()
