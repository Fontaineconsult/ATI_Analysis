"""
ATI Cypher MCP server.

Exposes the curated Cypher registry (``query_registry.yaml``) to MCP clients
(Claude Desktop, Claude Code, etc.) as a set of safe, named tools — instead of
handing the model raw Cypher. The registry loader is shared with the terminal
runners (``app.database.cypher_runner.registry``), so both paths agree on what
queries exist. The connection is this package's own (``connection.py``): MCP is one
of the three sanctioned graph access paths (HTTP API, MCP, neo4j-cli) and the only
one under ``cypher_runner`` that opens a Bolt driver.

Layout (see README.md for the full guide):

    mcp/
      server.py            # build_server() + main(); wires features onto FastMCP
      config.py            # env-driven Settings (server name, read/write, transport)
      context.py           # ServerContext: the shared handles features receive
      connection.py        # credential lookup (DATABASE_URL / NEO4J_* / .env)
      executor.py          # persistent Neo4j driver (lazy-connected)
      features/            # one module per capability — THIS is where you extend
        registry_queries.py  # turns every read query in the registry into a tool
        catalog.py           # discovery tools: list_queries / describe_query
        schema_notes.py      # a resource describing the graph's relationships

To add a feature: write ``features/<thing>.py`` exposing ``NAME`` and
``register(mcp, ctx)``, then append the module to ``features.ALL_FEATURES``.
Nothing else changes.
"""

from .server import build_server, main

__all__ = ["build_server", "main"]
