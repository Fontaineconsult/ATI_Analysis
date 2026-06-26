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
claude mcp add ati-graph -s local -e ATI_MCP_ALLOW_WRITE=true -- \
  "C:\Users\Fonta\PycharmProjects\ATI_Analysis\.venv314\Scripts\python.exe" \
  -m app.database.cypher_runner.mcp
```

Run it from the repo root (or set `cwd`) so the module path resolves.

> **Interpreter — use `.venv314`, not `.venv`.** The read-only Cypher path works under
> any interpreter with `mcp`/`neo4j`/`pyyaml`, but the **write** tools (`annotate_*`,
> `set_yse_status`, ontology writes) call the queries layer, which configures neomodel via
> `get_config()` — **neomodel ≥ 6** (Python 3.14 `.venv314`). The older `.venv`
> (neomodel 5.3.2) lacks `get_config`, so reads succeed but every write fails with
> `cannot import name 'get_config' from 'neomodel'`. This is the same env the Flask app
> and pytest use. Drop `-e ATI_MCP_ALLOW_WRITE=true` if you want read-only.

**Claude Desktop** (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ati-graph": {
      "command": "C:\\Users\\Fonta\\PycharmProjects\\ATI_Analysis\\.venv314\\Scripts\\python.exe",
      "args": ["-m", "app.database.cypher_runner.mcp"],
      "cwd": "C:\\Users\\Fonta\\PycharmProjects\\ATI_Analysis",
      "env": { "ATI_MCP_ALLOW_WRITE": "true" }
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

## Transcript annotation

An agent can dissect a meeting transcript and record notes against the right
`YearSuccessEvidence` (YSE) and implementation nodes. Two halves:

**Discovery (read, always on)** — resolve fuzzy transcript text to exact node keys:

| Tool | Param | Returns |
|---|---|---|
| `yse_catalog_for_year` | `academic_year` | every YSE for the year: `year_identifier`, indicator, campus, working group, status — the YSE match table |
| `search_implementations` | `search_text` | implementation matches with `type` + `id` (and which YSEs they evidence) |
| `search_success_indicators` | `search_text` | indicators by text/`composite_key` |
| `notes_for_yse` | `year_identifier` | notes already on a YSE (dedup check) |
| `notes_for_implementation` | `implementation_id` | notes already on an implementation |

**Write (gated by `ATI_MCP_ALLOW_WRITE`)** — thin wrappers over the sanctioned
`add_note()`; they auto-generate a unique note name from `(content, target)` so
re-running a transcript is idempotent:

- `annotate_yse(year_identifier, content, title?, date_created?, name?)` —
  attaches via `has_note` (not year-scoped).
- `annotate_implementation(implementation_id, implementation_type, content, academic_year, title?, include_in_year?, name?)` —
  attaches via `is_documented_by`, scoped to `academic_year` (`DocumentedByRel`).

Typical flow: `yse_catalog_for_year(year)` + `search_implementations(text)` /
`search_success_indicators(text)` to resolve mentions → optionally
`notes_for_yse` / `notes_for_implementation` to avoid duplicates → `annotate_*`.

**Assignment rule — YSE is the default; implementations are strict.** Attach a note to an
**implementation** only when the transcript contains a **direct or near-direct reference to that
implementation's name** *and* the note is genuinely about that node. A passing name-drop in a list
does not qualify (e.g. listing "the DSS content remediation" while describing a different team's
opt-out program is not grounds for a note on the *Accessible Content Remediation (DSS)* node). For
everything else — process descriptions, staffing/capacity, tool changes, governance/plan status —
**default to `annotate_yse`** on the most specific matching success indicator. When in doubt, pick
the YSE. Also prefer capturing the *delta* over what existing notes already say (check
`notes_for_yse` / `notes_for_implementation` first) rather than restating prior-year evidence.

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
