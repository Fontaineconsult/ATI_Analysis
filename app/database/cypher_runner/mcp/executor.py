"""
Neo4j execution for the MCP server.

A thin wrapper that holds ONE driver open for the life of the server (the CLI
runner opens/closes a driver per call, which is wrong for a long-lived process).
Connection resolution is delegated to ``run_query.resolve_connection`` so the
MCP server and the CLI agree on exactly how credentials are read — including the
Aura case, where the embedded credentials in ``DATABASE_URL`` are stripped and
passed as an auth tuple (the bare neo4j driver rejects creds inside the URI).

Connection is lazy: importing this module, building the server, and registering
tools all work with no database present. The driver is created on first query,
so misconfiguration surfaces as a clean tool error rather than a boot failure.
"""

import json
from typing import Any, Dict, List, Optional


class GraphExecutor:
    def __init__(self) -> None:
        self._driver = None
        self._database: Optional[str] = None

    def _ensure(self) -> None:
        if self._driver is not None:
            return

        # Imported lazily: keeps `import ...mcp` free of the yaml/neo4j chain,
        # and lets us translate the CLI's sys.exit into a tool-friendly error.
        from ..run_query import resolve_connection

        try:
            uri, auth, database = resolve_connection()
        except SystemExit as exc:  # resolve_connection exits on missing config
            raise RuntimeError(
                str(exc) or "Neo4j connection is not configured (set DATABASE_URL)."
            ) from None

        try:
            from neo4j import GraphDatabase
        except ImportError as exc:  # pragma: no cover - environment dependent
            raise RuntimeError("Missing dependency: neo4j  ->  pip install neo4j") from exc

        self._driver = GraphDatabase.driver(uri, auth=auth)
        self._database = database

    def run(self, cypher: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Execute Cypher and return JSON-safe row dicts."""
        self._ensure()
        with self._driver.session(database=self._database) as session:
            rows = [record.data() for record in session.run(cypher, params or {})]
        # Neo4j temporal/spatial/node values aren't natively JSON-serializable;
        # round-trip through json with a str fallback so every tool result is
        # something the MCP layer can hand back without choking.
        return json.loads(json.dumps(rows, default=str))

    def verify(self) -> bool:
        """Open the connection and run a trivial query — used by --check."""
        self.run("RETURN 1 AS ok")
        return True

    def close(self) -> None:
        if self._driver is not None:
            self._driver.close()
            self._driver = None
