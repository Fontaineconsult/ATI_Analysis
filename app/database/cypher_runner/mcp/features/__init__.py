"""
Feature registry.

A feature is any module exposing:
    NAME: str
    register(mcp, ctx) -> None      # called once at startup with the FastMCP
                                    # instance and the shared ServerContext

To add a feature: create a module here, then append it to ALL_FEATURES.
Order is preserved; a feature that raises during registration is logged and
skipped (see server.build_server) so one bad feature can't take down the server.
"""

from . import (
    catalog, meeting_minutes, meeting_minutes_write, notes_write, ontology, ontology_write,
    query, query_write, registry_queries, schema_notes,
)

ALL_FEATURES = [
    registry_queries,       # the curated Cypher queries, as tools
    catalog,                # discovery: list_queries / describe_query
    schema_notes,           # a resource describing the graph's relationships
    ontology,               # the ontology itself: node types/fields/descriptions + health (read)
    query,                  # pending questions (Query): reads
    meeting_minutes,        # working-group meeting records (MeetingMinutes): reads
    ontology_write,         # descriptive-layer edits (write-gated; ATI_MCP_ALLOW_WRITE)
    notes_write,            # transcript annotation: attach notes to YSE/implementations (write-gated)
    query_write,            # pending questions (Query): create/update/settle/link/delete (write-gated)
    meeting_minutes_write,  # meeting records: record/update/link/delete (write-gated)
]
