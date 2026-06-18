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

from . import catalog, registry_queries, schema_notes

ALL_FEATURES = [
    registry_queries,   # the curated Cypher queries, as tools
    catalog,            # discovery: list_queries / describe_query
    schema_notes,       # a resource describing the graph's relationships
]
