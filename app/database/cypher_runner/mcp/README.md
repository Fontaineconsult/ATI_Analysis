# ATI Cypher — MCP server

Exposes the curated Cypher registry (`../query_registry.yaml`) to MCP clients
(Claude Desktop, Claude Code, IDE extensions) as **safe, named tools**. The model
picks from the vetted catalog instead of writing raw Cypher. Connection and
registry handling are reused from `../run_query.py`, so the CLI and the MCP
server always agree on credentials and on what queries exist.

## Install

```bash
pip install "mcp[cli]" neo4j pyyaml python-dotenv
```

Credentials come from the same place as everything else — `app/.env.development`
(`DATABASE_URL` + `NEO4J_DATABASE`). No separate config.

## Run / debug

```bash
# Build and list the tools that would be exposed — no database needed
python -m app.database.cypher_runner.mcp --self-test

# Same, plus verify the live Neo4j/Aura connection
python -m app.database.cypher_runner.mcp --check-db

# Run the server over stdio (this is what a client launches)
python -m app.database.cypher_runner.mcp
```

## Register with a client

**Claude Code:**

```bash
claude mcp add ati-graph -- \
  "C:\Users\Fonta\PycharmProjects\ATI_Analysis\.venv\Scripts\python.exe" \
  -m app.database.cypher_runner.mcp
```

Run it from the repo root (or set `cwd`) so the module path resolves. Point
`command` at this project's venv interpreter (the one that has `mcp`, `neo4j`,
and `pyyaml` installed) — adjust the path if your checkout lives elsewhere.

**Claude Desktop** (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ati-graph": {
      "command": "C:\\Users\\Fonta\\PycharmProjects\\ATI_Analysis\\.venv\\Scripts\\python.exe",
      "args": ["-m", "app.database.cypher_runner.mcp"],
      "cwd": "C:\\Users\\Fonta\\PycharmProjects\\ATI_Analysis"
    }
  }
}
```

The DB password lives only in the server's environment (`.env.development`) — it
is never sent to the model.

## Settings (env vars)

| Var | Default | Meaning |
|---|---|---|
| `ATI_MCP_SERVER_NAME` | `ati-graph` | Name advertised to the client |
| `ATI_MCP_ALLOW_WRITE` | `false` | Expose `mode: write` registry queries as tools |
| `ATI_MCP_TRANSPORT` | `stdio` | `stdio` \| `sse` \| `streamable-http` |
| `ATI_MCP_CATEGORIES` | (all) | Comma-separated allowlist, e.g. `evidence,indicators` |

Read-only is the default and the safe choice. Turn on writes only deliberately.

## What's exposed

- **Tools** — one per `read` query in the registry (e.g. `yse_status_breakdown_for_year`,
  `indicators_for_working_group`, `list_campuses`), plus `list_queries` /
  `describe_query` for discovery.
- **Resource** — `ati-graph://schema`, the relationship map of the graph.

## Adding capability

This package is built around a small provider pattern so growth is cheap.

### Add a new query (most common)

Just edit `../query_registry.yaml` — append a `read` entry and it becomes a tool
on next start. No code here changes. Validate with:

```bash
python -m app.database.cypher_runner.run_query --validate
```

### Add a new kind of feature (tools / resources / prompts)

Create `features/<thing>.py`:

```python
NAME = "my_feature"

def register(mcp, ctx):
    # ctx.registry  -> the validated query catalog
    # ctx.executor  -> ctx.executor.run(cypher, params) for the live graph
    # ctx.settings  -> resolved env settings

    @mcp.tool(name="campuses_with_no_evidence", description="Campuses missing current-year YSE.")
    def campuses_with_no_evidence() -> list:
        return ctx.executor.run("MATCH (c:Campus) WHERE NOT (c)<-[:evidence_at_campus]-() RETURN c.abbreviation AS campus")
```

Then add it to `ALL_FEATURES` in `features/__init__.py`. A feature that raises at
registration is logged and skipped, so experiments can't break the server.

The same `register(mcp, ctx)` hook works for MCP **resources** (`@mcp.resource(...)`,
see `features/schema_notes.py`) and **prompts** (`@mcp.prompt(...)`).
