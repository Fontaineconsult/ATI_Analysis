# cypher_runner/cli

The terminal path to the graph. Anyone working from a shell, human or agent, reaches
Neo4j through `neo4j-cli` (https://neo4j.sh, Neo4j Labs), never through Python that
opens its own Bolt driver. This file is both the design note and the install guide.

If you are an agent setting this up on a new computer, follow **Quick install** top
to bottom. Each step has a check. Do not skip a check, do not improvise around a
failed one, and stop where the guide says to ask the user.

---

## The three access paths

| Path | Who uses it | Where the credential lives | Writes |
|---|---|---|---|
| HTTP API | the React app, curl, scripts talking to Flask | the config gateway (web.config in prod, `.env.<env>` in dev), read by `create_app()` | the queries layer and its create functions |
| MCP server | Claude Desktop, Claude Code, IDE clients, once the `ati-graph` server is registered | the server's own environment (`mcp/connection.py`) | registry `mode: write` tools behind `ATI_MCP_ALLOW_WRITE` |
| neo4j-cli | anyone in a terminal, including agent sessions in this repo | the OS keyring, under the CLI's control | `--rw`, which an agent must never add on its own |

There is no fourth path. A `python -c` that imports the driver, a scratch script that
opens a session, `cypher-shell`, or a curl at port 7687 is not an access path, and the
project hook refuses them (see "Enforcement").

---

## Quick install (new computer)

Verified on Windows 11 with PowerShell, 2026-09-25, neo4j-cli v1.14.0. For macOS or
Linux the binary and every command below are the same; only the installer line
differs, and https://neo4j.sh shows it. Do not guess an installer command.

You need three things from the user before you start, and you ask for them once:
the Bolt host (`<host>`, an IP or DNS name), the database username, and the password.
The database name is `ati`. If the user gives you a full `bolt://user:pass@host:7687`
URL, split it yourself. Never read the password out of a file in this repo and never
write it into one.

### Step 1: install the binary

```powershell
irm https://neo4j.sh/install.ps1 | iex
```

Then open a **new** shell. The installer adds `%LOCALAPPDATA%\neo4j-cli` to the user
PATH, and shells opened before the install do not see it.

Check:

```powershell
neo4j-cli --version
```

Expected: a line like `neo4j-cli version v1.14.0`. If the command is not recognised in
the new shell, call it by full path for the rest of this guide:
`$env:LOCALAPPDATA\neo4j-cli\neo4j-cli.exe`. The Python runners find it there on
their own, or wherever the `NEO4J_CLI` environment variable points.

### Step 2: quiet the CLI

```powershell
neo4j-cli config set telemetry false --rw
neo4j-cli config set history-enabled false --rw
```

Check:

```powershell
neo4j-cli config list
```

Expected: `telemetry: false` and `"history-enabled": false`. These two `--rw` flags are
config writes on the local machine, not graph writes; they are the only `--rw` you use
without asking.

### Step 3: store the credential

Ask the user for the host, username and password if you do not have them yet. Then
run this **with the real values substituted**, from the user's own shell if they prefer
to type the password themselves:

```powershell
neo4j-cli credential dbms add --name ati-production --uri bolt://<host>:7687 --username <user> --password <pw> --database ati --rw
neo4j-cli credential dbms use ati-production
```

Check:

```powershell
neo4j-cli credential dbms list
```

Expected: one row named `ati-production`, `default` true, database `ati`. The password
is not shown and you do not need it again. The CLI keeps its state in
`%LOCALAPPDATA%\neo4j\cli\`; **never open `credentials.json`**, the list command is how
you look.

If the server has TLS, use `bolt+s://` (verified certificate) or `bolt+ssc://`
(self-signed) instead of `bolt://` and the cleartext warning in Step 4 goes away.

### Step 4: prove reads work

```powershell
neo4j-cli query 'MATCH (c:Campus) RETURN c.abbreviation AS abbr' --format toon
neo4j-cli query :schema --format toon
```

Expected: the first returns campus abbreviations (`sfsu`, `ssu`, `csueb` on the
production graph). The second prints labels, relationship types and properties. A
line `warning: connecting to 'bolt://...' over cleartext` is normal on a plain
`bolt://` URI and is not an error.

If instead you get `{"error": {...}}` with a connection or authentication message,
the credential is wrong: remove it with `neo4j-cli credential dbms remove
ati-production --rw` and repeat Step 3. Do not retry more than twice; ask the user.

### Step 5: prove the write guard holds

Run this once. It matches nothing, so it is harmless even if the guard failed:

```powershell
neo4j-cli query 'MATCH (n:ZzNoSuchLabelProbe) SET n.probe = 1 RETURN count(n)'
```

Expected: `Error: this command writes; pass --rw to allow it (exit 2)`. That refusal is
the whole point of the design. If the statement runs instead, stop and tell the user.

### Step 6: install the agent skills

```powershell
neo4j-cli skill install --agent claude-code --rw
neo4j-cli skill install neo4j-cypher-skill --agent claude-code --rw
```

Check:

```powershell
neo4j-cli skill list --format table
```

Expected: `claude-code` row shows `installed`; `neo4j-cypher-skill` shows installed for
claude-code. They land in `~/.claude/skills/`. Two cautions. The Cypher skill targets
Cypher 25 on Neo4j 2025.x, and this graph is Neo4j 5.26.2 speaking Cypher 5, so prefer
the CLI's `:schema` output and the EXPLAIN validation in `run_file` over its syntax
advice. Its bundled `scripts/generate_schema.py` opens Bolt from Python; do not run it
here, `neo4j-cli query :schema` does the same job.

### Step 7: prove the project runners use the CLI

Check which virtualenv to use before you run anything. A repository can carry more
than one, and the runners and pytest do not always want the same one. List what is
there, ask the user which is current if more than one answers, and substitute it for
`<venv>` below. CLAUDE.md covers the environment, and `python -m venv <venv>` plus
`<venv>\Scripts\pip install -r requirements-dev.txt` creates one if none exists.

From the repository root:

```powershell
<venv>\Scripts\python.exe -m app.database.cypher_runner.run_query --query list_campuses --table
<venv>\Scripts\python.exe -m app.database.cypher_runner.run_file app\database\batch\auto-assignments\<any file>.cypher
<venv>\Scripts\python.exe -m pytest tests\test_cypher_runner_cli.py -q
```

An `ImportError` while loading `tests/conftest.py` means the pytest line is pointing at
the wrong virtualenv, not that the install failed. Confirm which one holds the test
dependencies and run pytest from that one.

Expected: a campus table, `Validation: N/N statements OK` followed by
`Validate-only mode`, and a green test run. The runners need no `.env`, no
`DATABASE_URL`, and no driver; if one complains that neo4j-cli was not found, Step 1's
PATH note applies.

### Step 8: confirm the hook is armed

`.claude/settings.json` in this repo wires `.claude/hooks/graph_access_gate.py` to run
before every Bash, PowerShell, Write, Edit and MultiEdit call, using
`.venv\Scripts\python.exe`. It needs nothing installed beyond the venv. In a Claude
Code session, this command must be refused with a message that starts
`graph-access-gate:`:

```bash
python -c "from neo4j import GraphDatabase"
```

If it runs, the hook is not loading: check that `.venv` exists and that the session
was started after `.claude/settings.json` was in place.

### Done when

- `neo4j-cli credential dbms list` shows `ati-production` as default.
- A read returns rows, a write without `--rw` is refused.
- Both runners work, and the unit tests pass.
- Nothing you did put a password in a file, a shell history, or a chat message.

### Things you must not do while installing

- Do not create a root `.env` with `NEO4J_URI` or `DATABASE_URL`. The CLI's `.env`
  walk-up would outrank the stored credential.
- Do not run `neo4j-cli config set accept-env-vars true`. Environment variables
  stay ignored so a stray `NEO4J_PASSWORD` in a shell cannot redirect the CLI.
- Do not add `--rw` to a `query` because a command failed. Report the refusal and let
  the user decide.
- Do not read `%LOCALAPPDATA%\neo4j\cli\credentials.json` or `history.jsonl`.

---

## Division of labour on the CLI path

- `neo4j-cli` holds the credential and executes Cypher over Bolt. Read-only by default;
  writes need `--rw`, and its EXPLAIN preflight refuses write statements without it.
- `transport.py` is the only module that spawns the CLI. Cypher goes over stdin, params
  go as `--param key=<json>`, results come back as the CLI's JSON envelope.
- `../registry.py` loads `../query_registry.yaml`, the catalog of vetted reads. It
  imports no driver, so the MCP server shares it.
- `../run_query.py` runs one registry entry through the CLI. `--allow-write` is the only
  thing that passes `--rw`. `--print-command` shows the invocation instead of running it.
- `../run_file.py` validates a batch `.cypher` file by EXPLAIN through the CLI (a read),
  runs any registered gates, and on `--execute` hands the whole file to
  `neo4j-cli query --rw --atomic`, so a failure rolls back everything.
- The `GATES` list in `run_file.py` is where `claude_files/cypher-validation-gates-plan.md`
  lands when its Phase 0 is settled. Nothing is registered yet.
- neomodel create functions in `queries/<domain>/create.py`, Flask, pytest, and the MCP
  server are unchanged. The CLI is the agent's path, not the app's.

## Target

Self-hosted Neo4j 5.26.2 Community over `bolt://`, database `ati`. No Aura. The planner
reports Cypher 5.

## Everyday use

```bash
neo4j-cli query :schema --format toon
neo4j-cli query 'MATCH (c:Campus) RETURN c.abbreviation' --format toon
neo4j-cli query --param wg=Web 'MATCH (g:ATIWorkingGroup {name: $wg}) RETURN g.name' --format toon
python -m app.database.cypher_runner.run_query --list
python -m app.database.cypher_runner.run_query --query yse_status_breakdown_for_year --param academic_year=2026-2027 --table
python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/<file>.cypher
python -m app.database.cypher_runner.run_file app/database/batch/auto-assignments/<file>.cypher --execute
```

Facts about the CLI that shape how the runners behave:

- The JSON envelope is `{columns, rows, truncated, arrays_truncated}` plus `plan` for
  EXPLAIN. A failure prints `{"error": {code, exit_code, message}}`, exit 6 for a
  Cypher validation error.
- It reports **no write counters**. After `--execute`, read back the nodes and edges the
  file touches. A MERGE-idempotent re-run is safe.
- A bare numeric `--param` binds as FLOAT. The runner JSON-encodes every value, so strings
  stay strings; registry Cypher that needs an integer wraps the parameter in `toInteger()`.
- The runners drop the cleartext warning on success and keep it on failure.

## Enforcement

`.claude/hooks/graph_access_gate.py` runs before every Bash, PowerShell, Write, Edit and
MultiEdit call in this repo (wired in `.claude/settings.json`, using the project
`.venv`). It refuses:

- inline Python (`python -c`, `python -`, a heredoc) that names the driver, neomodel,
  the queries layer, `create_app`, or a Bolt address;
- `cypher-shell`, and any command carrying a Bolt URI or port 7687 that is not one of
  the sanctioned entry points (`neo4j-cli`, `pytest`, the Flask app, the admin tools
  under `app/database/tools`, the MCP server, `graph_schema.py`, and read-only search);
- writing a Python file that imports the raw neo4j driver anywhere except the MCP
  executor and the two legacy visualisers that already own one;
- writing a Python file outside `app/` and `tests/` that touches the graph at all.

It says what to use instead. `tests/test_cypher_runner_cli.py` pins the rules.
