#!/usr/bin/env python3
"""
ATI Cypher query runner: the CLI-path front end for the curated registry.

Runs named queries from query_registry.yaml through ``neo4j-cli``. This process never
opens Bolt and never sees a credential; the CLI holds the connection in the OS keyring
and executes the Cypher. Read queries run freely. Write queries need ``--allow-write``,
which is what passes the CLI's ``--rw`` flag; without it the CLI's EXPLAIN preflight
refuses the statement.

Three access paths reach the graph, and this is the third:
  1. the HTTP API (Flask endpoints over queries/<domain>, neomodel),
  2. the MCP server (app.database.cypher_runner.mcp, its own driver),
  3. neo4j-cli, for anyone working from a terminal. This module and run_file.py wrap it.

Usage
-----
    python -m app.database.cypher_runner.run_query --list
    python -m app.database.cypher_runner.run_query --show yses_by_campus_for_year
    python -m app.database.cypher_runner.run_query --validate
    python -m app.database.cypher_runner.run_query --query list_campuses
    python -m app.database.cypher_runner.run_query --query indicators_for_working_group \
        --param working_group=Web
    python -m app.database.cypher_runner.run_query --query set_yse_status \
        --param year_identifier="2025-2026 1.1-web" --param status_level=Initiated --allow-write
    python -m app.database.cypher_runner.run_query --query list_campuses --print-command

``--list``, ``--show`` and ``--validate`` need neither the CLI nor a database.
``--print-command`` shows the neo4j-cli invocation instead of running it; the Cypher is
printed after it because the runner feeds it over stdin.

Dependencies: pyyaml, and neo4j-cli on PATH (or NEO4J_CLI pointing at the binary).
"""

import argparse
import json
import shlex
import sys

from .cli import transport
from .registry import REGISTRY_PATH, load_registry  # noqa: F401  (re-exported for callers)


# --------------------------------------------------------------------------- #
# Param parsing                                                               #
# --------------------------------------------------------------------------- #
def parse_params(pairs):
    """Turn ['k=v', ...] into {'k': v}, coercing ints/floats/bools/null."""
    out = {}
    for pair in pairs or []:
        if "=" not in pair:
            sys.exit(f"Bad --param '{pair}', expected key=value")
        key, raw = pair.split("=", 1)
        out[key] = _coerce(raw)
    return out


def _coerce(raw: str):
    low = raw.lower()
    if low in ("true", "false"):
        return low == "true"
    if low in ("null", "none"):
        return None
    for cast in (int, float):
        try:
            return cast(raw)
        except ValueError:
            pass
    return raw


# --------------------------------------------------------------------------- #
# Execution through neo4j-cli                                                 #
# --------------------------------------------------------------------------- #
def run_registry_query(entry: dict, params: dict, *, allow_write: bool, table: bool) -> int:
    """Run one registry entry through the CLI, stream its output, return the exit code."""
    try:
        result = transport.run(
            entry["cypher"],
            params,
            rw=allow_write,
            fmt="table" if table else "json",
            check=False,
        )
    except transport.CliNotFound as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    sys.stdout.write(result.stdout)
    if not result.stdout.endswith("\n"):
        sys.stdout.write("\n")
    if result.ok:
        warnings = result.warnings()
        if warnings:
            print(warnings, file=sys.stderr)
    else:
        print(f"neo4j-cli failed: {result.error_message()}", file=sys.stderr)
        if result.stderr.strip():
            print(result.stderr.rstrip(), file=sys.stderr)
    return result.returncode


def print_command(entry: dict, params: dict, *, allow_write: bool, table: bool) -> None:
    try:
        cmd = transport.build_command(
            params, rw=allow_write, fmt="table" if table else "json",
        )
    except transport.CliNotFound:
        cmd = transport.build_command(
            params, rw=allow_write, fmt="table" if table else "json", cli=transport.CLI_NAME,
        )
    print("# stdin carries the Cypher below")
    print(" ".join(shlex.quote(part) for part in cmd))
    print()
    print(entry["cypher"].rstrip())


# --------------------------------------------------------------------------- #
# CLI                                                                          #
# --------------------------------------------------------------------------- #
def _utf8_console() -> None:
    """The CLI's table format uses box-drawing characters; a cp1252 console cannot
    print them. Output is UTF-8 regardless of the console code page."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


def main(argv=None):
    _utf8_console()
    ap = argparse.ArgumentParser(description="Run curated ATI Cypher queries through neo4j-cli.")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--list", action="store_true", help="List all registered queries.")
    g.add_argument("--show", metavar="NAME", help="Print one query's Cypher and params.")
    g.add_argument("--validate", action="store_true", help="Validate the registry and exit.")
    g.add_argument("--query", metavar="NAME", help="Run a query by name.")
    ap.add_argument("--param", action="append", metavar="K=V", help="Query parameter (repeatable).")
    ap.add_argument("--allow-write", action="store_true",
                    help="Permit write-mode queries (passes --rw to neo4j-cli).")
    ap.add_argument("--table", action="store_true", help="Print rows as a table instead of JSON.")
    ap.add_argument("--print-command", action="store_true",
                    help="With --query: print the neo4j-cli invocation instead of running it.")
    args = ap.parse_args(argv)

    registry = load_registry()

    if args.validate:
        print(f"OK — {len(registry)} queries valid.")
        return 0

    if args.list:
        by_cat = {}
        for e in registry.values():
            by_cat.setdefault(e["category"], []).append(e)
        for cat in sorted(by_cat):
            print(f"\n[{cat}]")
            for e in sorted(by_cat[cat], key=lambda x: x["name"]):
                tag = " (write)" if e["mode"] == "write" else ""
                params = f"  params: {', '.join(e['params'])}" if e["params"] else ""
                print(f"  {e['name']}{tag} — {e['description']}{params}")
        return 0

    if args.show:
        e = registry.get(args.show)
        if not e:
            sys.exit(f"Unknown query '{args.show}'. Try --list.")
        print(json.dumps(
            {"name": e["name"], "category": e["category"], "mode": e["mode"],
             "params": e["params"], "description": e["description"]},
            indent=2))
        print("\n" + e["cypher"].rstrip())
        return 0

    # --query
    e = registry.get(args.query)
    if not e:
        sys.exit(f"Unknown query '{args.query}'. Try --list.")
    if e["mode"] == "write" and not args.allow_write:
        sys.exit(f"'{args.query}' is a write query. Re-run with --allow-write to permit it.")

    params = parse_params(args.param)
    missing = [p for p in e["params"] if p not in params]
    if missing:
        sys.exit(f"Missing required param(s): {', '.join(missing)}\n"
                 f"  expected: {', '.join(e['params'])}")

    if args.print_command:
        print_command(e, params, allow_write=args.allow_write, table=args.table)
        return 0
    return run_registry_query(e, params, allow_write=args.allow_write, table=args.table)


if __name__ == "__main__":
    sys.exit(main())
