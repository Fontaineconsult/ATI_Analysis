"""Standalone runner for batch .cypher files (app/database/batch/, auto-assignments/).

The one sanctioned way to validate and execute batch Cypher FILES from a terminal.
Sibling of run_query.py, which runs single curated queries from query_registry.yaml;
this module runs whole statement files (ontology-ingest output, migrations, seeds).

This process never opens Bolt. Every statement goes to ``neo4j-cli``, which holds the
credential in the OS keyring and refuses writes unless it is told ``--rw``. Validation
here is what stays in Python; execution is delegated.

Usage:
    python -m app.database.cypher_runner.run_file <file.cypher>             # validate only
    python -m app.database.cypher_runner.run_file <file.cypher> --execute   # validate, then run

Behavior:
    - VALIDATE (always): every statement is EXPLAIN-planned server-side through the
      CLI, which is a read and needs no --rw. The whole file is sent in one call first;
      if anything fails, statements are re-planned one at a time so the report names
      the statement and its error. Then the registered GATES run (see below). Nothing
      is ever executed unless the whole file validates.
    - EXECUTE (--execute): the file runs as ONE atomic transaction via
      ``neo4j-cli query --rw --atomic``. A failure anywhere rolls back everything, so a
      partially applied file cannot happen. The CLI reports no write counters, so the
      runner prints the statement count and tells you to read back what matters;
      batch files are MERGE-idempotent by convention and a re-run is safe.

Gates:
    ``GATES`` is the hook point for claude_files/cypher-validation-gates-plan.md.
    Each gate is a callable ``(statements: list[str]) -> list[str]`` returning failure
    messages; any message blocks execution. None are registered yet, because Phase 0
    of that plan (schema and graph must agree) is still open.

File contract (matches the app/database/batch conventions):
    - Full-line comments start with //  (inline // is NOT stripped).
    - A statement ends with ';' at END OF LINE. Semicolons inside string literals
      are safe as long as they are not the last character on a line.
    - Statements must be self-contained (MATCH their own anchors); the runner
      provides no parameters and no cross-statement state.

Exit codes: 0 success, 1 validation/execution failure, 2 usage/config error.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Callable

from .cli import transport

Gate = Callable[[list[str]], list[str]]
GATES: list[Gate] = []


def split_statements(source: str) -> list[str]:
    """Split a batch .cypher file into executable statements.

    Drops full-line // comments, then splits on ';' at end-of-line. This is the
    same contract the auto-assignments ingest files are written against.
    """
    no_comments = "\n".join(
        line for line in source.splitlines() if not line.strip().startswith("//")
    )
    return [s.strip() for s in re.split(r";\s*\n", no_comments) if s.strip()]


def first_line(stmt: str, width: int = 78) -> str:
    return stmt.splitlines()[0][:width]


def _explain(statements: list[str]) -> transport.CliResult:
    return transport.run(
        transport.join_statements("EXPLAIN " + s for s in statements),
        fmt="json",
        check=False,
    )


def validate(statements: list[str]) -> bool:
    """EXPLAIN every statement through the CLI. One call when the file is clean; one
    call per statement when it is not, so the failing statement gets named."""
    batch = _explain(statements)
    if batch.ok:
        print(f"Validation: {len(statements)}/{len(statements)} statements OK")
        return True

    failures = 0
    for i, stmt in enumerate(statements, 1):
        single = _explain([stmt])
        if single.ok:
            continue
        failures += 1
        print(f"  FAIL #{i:03d} [{first_line(stmt)}]")
        print(f"       {single.error_message()}")
    if failures == 0:
        # The batch failed for a reason no single statement reproduces (connection,
        # credential, CLI). Surface the batch error rather than claiming success.
        print(f"  FAIL (whole file) {batch.error_message()}")
        failures = 1
    print(f"Validation: {len(statements) - failures}/{len(statements)} statements OK")
    return False


def run_gates(statements: list[str]) -> bool:
    problems: list[str] = []
    for gate in GATES:
        problems.extend(gate(statements))
    for p in problems:
        print(f"  GATE {p}")
    if problems:
        print(f"Gates: {len(problems)} problem(s); nothing executed.")
    return not problems


def execute(statements: list[str]) -> bool:
    result = transport.run(
        transport.join_statements(statements), rw=True, atomic=True, fmt="json", check=False,
    )
    if not result.ok:
        print("\nEXECUTION FAILED (atomic transaction rolled back; nothing was written)")
        print(f"  {result.error_message()}")
        if result.warnings():
            print(f"  {result.warnings()}")
        return False
    print(
        f"Execution complete: {len(statements)} statement(s) committed in one transaction."
    )
    print(
        "  neo4j-cli reports no write counters. Read back the nodes and edges this file "
        "touches to confirm what changed; a MERGE-idempotent re-run is safe."
    )
    return True


def main(argv=None) -> int:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(
        prog="cypher_runner",
        description="Validate (EXPLAIN via neo4j-cli) and optionally execute a batch .cypher file.",
    )
    parser.add_argument("file", help="path to the .cypher file")
    parser.add_argument(
        "--execute",
        action="store_true",
        help="run the statements after validation passes (default: validate only)",
    )
    args = parser.parse_args(argv)

    path = Path(args.file)
    if not path.is_file():
        print(f"ERROR: no such file: {path}")
        return 2
    statements = split_statements(path.read_text(encoding="utf-8"))
    if not statements:
        print(f"ERROR: no statements found in {path}")
        return 2
    print(f"{path.name}: {len(statements)} statements")

    try:
        transport.find_cli()
    except transport.CliNotFound as exc:
        print(f"ERROR: {exc}")
        return 2

    if not validate(statements):
        return 1
    if not run_gates(statements):
        return 1
    if not args.execute:
        print("Validate-only mode; pass --execute to run.")
        return 0
    return 0 if execute(statements) else 1


if __name__ == "__main__":
    sys.exit(main())
