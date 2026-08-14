"""
Feature registry.

A feature is any module exposing:
    NAME: str
    register(mcp, ctx) -> None      # called once at startup with the FastMCP
                                    # instance and the shared ServerContext

To add a feature: create a module here, COMMIT IT, then append it to
ALL_FEATURES. The order matters — naming a module that isn't on disk raises at
package-import time and takes the whole server down with it, which is not
covered by the resilience below. (That is exactly what merge cc0f5f7 did: it
registered an `implementations_write` module that was never committed on either
branch, so every MCP entry point died on import.)

Order is preserved; a feature that raises during REGISTRATION is logged and
skipped (see server.build_server) so one bad feature can't take down the server.
That safety net starts after import, not before it.
"""

from . import (
    catalog, communities_write, meeting_minutes, meeting_minutes_write, notes_write, ontology,
    ontology_write, people_write, query, query_write, registry_queries, schema_notes,
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
    people_write,           # people & org units: create/update + assignments (write-gated)
    communities_write,      # communities of practice: create/membership/indicator stakes (write-gated)
]
