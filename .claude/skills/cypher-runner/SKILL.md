---
name: cypher-runner
description: Use when querying the ATI Neo4j knowledge graph with Cypher from a terminal — listing or running curated queries about goals, success indicators, YearSuccessEvidence, campuses, people, working groups, implementations, governance, or documentation, or validating and executing a batch .cypher file. Triggered by requests like "run a cypher query", "what does the graph say about…", "list success indicators for Web", "YSE status breakdown for 2025-2026", "how many nodes by label", "validate this batch file", or "add a query to the registry".
---

# Cypher runner

Run curated Cypher against the ATI knowledge graph through a vetted registry, and run
batch `.cypher` files, from a terminal. Both go through `neo4j-cli`. Read queries run
freely; writes are gated twice, once by the runner flag and once by the CLI.

## The three access paths

The graph has three sanctioned access paths and this skill is the third.

1. **HTTP API.** Flask endpoints over `app/database/queries/<domain>` (neomodel). The
   app's path.
2. **MCP server.** `app/database/cypher_runner/mcp`, its own driver and credential.
   Claude Desktop and IDE clients.
3. **neo4j-cli.** Anyone in a terminal, including an agent session in this repo. The
   credential is in the OS keyring; no Python here opens Bolt or sees a password.

Not an access path: `python -c` with the driver or neomodel, a scratch script that opens
a session, `cypher-shell`, a curl at port 7687. The project hook refuses them and points
back here. Do not look for a way round it. If a question needs Cypher the registry does
not have, run it with `neo4j-cli query` directly, and add it to the registry if it will
be asked again.

The code lives at `app/database/cypher_runner/`:
- `query_registry.yaml` — the catalog of named queries (the source of truth).
- `registry.py` — the loader; no driver, shared with the MCP server.
- `run_query.py` — runs one registry entry through `neo4j-cli`.
- `run_file.py` — validates (EXPLAIN through the CLI) and executes whole `.cypher`
  statement files (e.g. `app/database/batch/auto-assignments/` ontology-ingest output).
  `--execute` hands the file to `neo4j-cli query --rw --atomic`.
- `cli/transport.py` — the one module that spawns the CLI. `cli/README.md` has the
  setup and the enforcement rules.

## Connection

`neo4j-cli` must be installed with a stored credential (`neo4j-cli credential dbms list`
shows it). `--list`, `--show` and `--validate` work with no CLI and no database. The
binary is found on PATH, then at the installer's default location, or via `NEO4J_CLI`.

## Usage

Run from the repo root so the module path resolves:

```bash
python -m app.database.cypher_runner.run_query --list
python -m app.database.cypher_runner.run_query --show yses_by_campus_for_year
python -m app.database.cypher_runner.run_query --validate
python -m app.database.cypher_runner.run_query --query list_campuses
python -m app.database.cypher_runner.run_query --query indicators_for_working_group --param working_group=Web
python -m app.database.cypher_runner.run_query --query yse_status_breakdown_for_year --param academic_year=2025-2026 --table
python -m app.database.cypher_runner.run_query --query list_campuses --print-command   # show the neo4j-cli call
```

Write queries (e.g. `set_yse_status`) require `--allow-write`, which is what passes
`--rw` to the CLI. Ask before running one.

```bash
python -m app.database.cypher_runner.run_query --query set_yse_status \
  --param year_identifier="2025-2026 1.1-web" --param status_level=Initiated --allow-write
```

Batch files:

```bash
python -m app.database.cypher_runner.run_file <file.cypher>             # validate only
python -m app.database.cypher_runner.run_file <file.cypher> --execute   # validate, then run atomically
```

Direct Cypher, when the registry has no entry:

```bash
neo4j-cli query :schema --format toon
neo4j-cli query 'MATCH (c:Campus) RETURN c.abbreviation' --format toon
neo4j-cli query --param wg=Web 'MATCH (g:ATIWorkingGroup {name: $wg}) RETURN g' --format toon
```

## How to work with it

1. **Discover first.** Run `--list` to see what's available, grouped by category (schema, indicators, evidence, implementation, individuals, organizational_units, governance, documentation, compound, write_examples).
2. **Inspect before running.** `--show <name>` prints the Cypher and the params it expects.
3. **Pass values as params, never inline.** Use `--param key=value`. The runner coerces `true/false`, `null`, ints, and floats; everything else stays a string. Every value is JSON-encoded for the CLI, so a numeric-looking string stays a string. A number binds as FLOAT on the CLI side; registry Cypher that needs an integer wraps the param in `toInteger()`.
4. **Prefer JSON output** for downstream processing; add `--table` for a quick human-readable view.
5. **Default to read.** Only reach for write queries when the task clearly calls for a mutation, and always with `--allow-write`.
6. **Validation is EXPLAIN.** It proves the Cypher parses and plans, not that a MATCH binds anything. Bind-check anchors before `--execute`; the gates plan will make the runner do it.
7. **No write counters.** The CLI does not report nodes or edges created. After `--execute`, read back what the file touched. A MERGE-idempotent re-run is safe.

## Adding a query

Append an entry to `query_registry.yaml` (copy an existing one). Required fields: `name` (unique), `category`, `description`, `mode` (`read`|`write`), `params` (list of `$param` names, or `[]`), and `cypher`. Set `mode: write` honestly for anything that creates, deletes, merges, or sets. Then run `--validate` to confirm the registry still loads. New read entries become MCP tools on the server's next start.

## Schema notes (so new queries use correct directions)

Relationship directions mirror `app/database/graph_schema.py`:
- `(ATIWorkingGroup)-[:responsible_for]->(Goal)-[:supported_by]->(SuccessIndicator)`
- `(YearSuccessEvidence)-[:tracks]->(SuccessIndicator)`, `-[:evidence_in_year]->(AcademicYear)`, `-[:evidence_at_campus]->(Campus)`, `-[:status_is]->(StatusLevel)`
- `(Process|Project|Procedure|Service|Guidance|Tracking|InternalPolicy)-[:is_evidence_for]->(YearSuccessEvidence)`
- `(Person)-[:participates_in]->(ATIWorkingGroup)`, `-[:works_at_campus]->(Campus)`, `-[:implements]->(YearSuccessEvidence)`
- `(Department|College)-[:operates_under_campus]->(Campus)`
- `(Law|Case|Directive|ExternalPolicy|Memo|Guideline)-[:informs]->(Goal)`
- `(anything)-[:is_documented_by]->(Document|Webpage|Note|Message)`

Most active nodes carry a `removed` or `depreciated` boolean — filter them out in reporting queries with `coalesce(n.removed, false) = false`.

## Where this file lives

The canonical copy is `app/database/cypher_runner/SKILL.md`, next to the code. `.claude/skills/cypher-runner/SKILL.md` is a verbatim copy so the skill is discoverable in a session; when one changes, copy it over the other.
