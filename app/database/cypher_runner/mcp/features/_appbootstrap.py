"""
Shared, lazy app bootstrap for the features that reach the neomodel-backed queries layer.

The ontology read/write features call the app's queries functions in-process. As everywhere
in this codebase, the ENTRY POINT must warm up data_api (so the queries modules' import of
`custom_exceptions` doesn't trip the circular load) and configure neomodel before any query
runs. The MCP server is that entry point here.

This is the ONE place the MCP server reaches into the app, and the dependency is strictly
one-way: features import the queries layer; the queries layer never imports anything under
``cypher_runner/mcp``. Bootstrapping is idempotent and lazy — called on the first DB-backed
tool call, never at import or registration time, so the read-only Cypher registry path and
``--self-test`` stay app-free.
"""

_BOOTSTRAPPED = False


def ensure_app() -> None:
    global _BOOTSTRAPPED
    if _BOOTSTRAPPED:
        return
    # Fully resolve the data_api package first (it eagerly imports every endpoint module),
    # so the subsequent queries-layer imports see a complete package.
    import app.endpoints.data_api  # noqa: F401
    from app.database.graph_schema import set_connection

    set_connection()
    _BOOTSTRAPPED = True
