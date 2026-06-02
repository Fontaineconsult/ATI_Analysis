---
name: cypher-runner
description: Use when querying the ATI Neo4j knowledge graph with Cypher — listing or running curated queries about goals, success indicators, YearSuccessEvidence, campuses, people, working groups, implementations, governance, or documentation. Triggered by requests like "run a cypher query", "what does the graph say about…", "list success indicators for Web", "YSE status breakdown for 2025-2026", "how many nodes by label", or "add a query to the registry".
---

# Cypher runner

Run curated Cypher against the ATI knowledge graph through a vetted registry, instead of hand-writing queries each time. Read queries run freely; write queries are gated behind an explicit flag.

The code lives at `app/database/cypher_runner/`:
- `query_registry.yaml` — the catalog of named queries (the source of truth).
- `run_query.py` — the executor / CLI.

## Connection (decide-later)

Credentials are **not** wired up yet. The runner reads them from the environment or `app/.env.development`:

- Preferred (matches the app): `DATABASE_URL=bolt://<user>:<password>@<host>:7687` and optional `NEO4J_DATABASE` (defaults to `ati`).
- Or split: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`.

Until one of those is set, `--list`, `--show`, and `--validate` work offline; only `--query` needs a live database. Dependencies: `pip install neo4j pyyaml`.

## Usage

Run from the repo root so the module path resolves:

```bash
python -m app.database.cypher_runner.run_query --list
python -m app.database.cypher_runner.run_query --show yses_by_campus_for_year
python -m app.database.cypher_runner.run_query --validate
python -m app.database.cypher_runner.run_query --query list_campuses
python -m app.database.cypher_runner.run_query --query indicators_for_working_group --param working_group=Web
python -m app.database.cypher_runner.run_query --query yse_status_breakdown_for_year --param academic_year=2025-2026 --table
```

Write queries (e.g. `set_yse_status`) require `--allow-write`:

```bash
python -m app.database.cypher_runner.run_query --query set_yse_status \
  --param year_identifier="2025-2026 1.1-web" --param status_level=Initiated --allow-write
```

## How to work with it

1. **Discover first.** Run `--list` to see what's available, grouped by category (schema, indicators, evidence, implementation, individuals, organizational_units, governance, documentation, compound, write_examples).
2. **Inspect before running.** `--show <name>` prints the Cypher and the params it expects.
3. **Pass values as params, never inline.** Use `--param key=value`. The runner coerces `true/false`, `null`, ints, and floats automatically; everything else stays a string.
4. **Prefer JSON output** for downstream processing; add `--table` for a quick human-readable view.
5. **Default to read.** Only reach for write queries when the task clearly calls for a mutation, and always with `--allow-write`.

## Adding a query

Append an entry to `query_registry.yaml` (copy an existing one). Required fields: `name` (unique), `category`, `description`, `mode` (`read`|`write`), `params` (list of `$param` names, or `[]`), and `cypher`. Set `mode: write` honestly for anything that creates, deletes, merges, or sets. Then run `--validate` to confirm the registry still loads.

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

## Installing as a Claude skill

To make this discoverable as a project skill, copy this folder's `SKILL.md` into `.claude/skills/cypher-runner/SKILL.md` (the `.claude/skills/` directory is where project skills live, alongside `semester-migration`). The runner and registry can stay under `app/database/cypher_runner/`; the SKILL.md paths point there.
