"""Standalone runner for batch .cypher files (app/database/batch/, auto-assignments/).

The one sanctioned way to validate and execute batch Cypher FILES against the graph —
independent of any session tooling or ad-hoc scripts. Sibling of run_query.py, which
runs single curated queries from query_registry.yaml; this module runs whole
statement files (ontology-ingest output, migrations, seeds). Connection settings come
from the config gateway (web.config in production, .env.<FLASK_ENV> in development),
so this runs anywhere the app runs with no hardcoded credentials.

Usage:
    python -m app.database.cypher_runner.run_file <file.cypher>             # validate only
    python -m app.database.cypher_runner.run_file <file.cypher> --execute   # validate, then run

Behavior:
    - VALIDATE (always): every statement is EXPLAIN-planned server-side (read-only).
      Any failure lists the statement number and error; nothing is ever executed
      unless the whole file validates.
    - EXECUTE (--execute): statements run in file order, one transaction each.
      Per-statement write counters are printed for statements that created
      something, then totals. On error the runner STOPS at the failing statement
      and reports it; batch files are MERGE-idempotent by convention, so re-running
      the fixed file is safe (completed statements simply match).

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
from urllib.parse import unquote, urlparse

# Stdlib + driver + config gateway ONLY — no graph_schema/neomodel imports, so the
# runner never touches the data_api import cycle and needs no warm-up accommodation.
from neo4j import GraphDatabase

from app.config_gateway import config


def split_statements(source: str) -> list[str]:
    """Split a batch .cypher file into executable statements.

    Drops full-line // comments, then splits on ';' at end-of-line. This is the
    same contract the auto-assignments ingest files are written against.
    """
    no_comments = "\n".join(
        line for line in source.splitlines() if not line.strip().startswith("//")
    )
    return [s.strip() for s in re.split(r";\s*\n", no_comments) if s.strip()]


def build_driver():
    """Driver + database name from the config gateway's DATABASE_URL.

    The URL embeds credentials (bolt://user:pass@host:port) the way neomodel
    consumes it; the raw neo4j driver wants them separate, so parse them out.
    """
    url = config.get("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL is not configured (config gateway found nothing).")
        sys.exit(2)
    parsed = urlparse(url)
    auth = (unquote(parsed.username or ""), unquote(parsed.password or ""))
    bare_url = f"{parsed.scheme}://{parsed.hostname}:{parsed.port or 7687}"
    database = config.get("NEO4J_DATABASE", "ati")
    return GraphDatabase.driver(bare_url, auth=auth), database


def first_line(stmt: str, width: int = 78) -> str:
    return stmt.splitlines()[0][:width]


def validate(session, statements: list[str]) -> bool:
    failures = 0
    for i, stmt in enumerate(statements, 1):
        try:
            session.run("EXPLAIN " + stmt).consume()
        except Exception as exc:  # driver raises many types; report them all uniformly
            failures += 1
            print(f"  FAIL #{i:03d} [{first_line(stmt)}]")
            print(f"       {exc}")
    print(f"Validation: {len(statements) - failures}/{len(statements)} statements OK")
    return failures == 0


def execute(session, statements: list[str]) -> bool:
    total_nodes = total_rels = total_props = 0
    total_labels = total_deleted_nodes = total_deleted_rels = 0
    for i, stmt in enumerate(statements, 1):
        try:
            counters = session.run(stmt).consume().counters
        except Exception as exc:
            print(f"\nEXECUTION FAILED at statement #{i:03d} [{first_line(stmt)}]")
            print(f"  {exc}")
            print(
                "  Statements before this one are committed. Batch files are "
                "MERGE-idempotent by convention - fix the file and re-run; completed "
                "statements will match instead of duplicating."
            )
            return False
        total_nodes += counters.nodes_created
        total_rels += counters.relationships_created
        total_props += counters.properties_set
        total_labels += counters.labels_added
        total_deleted_nodes += counters.nodes_deleted
        total_deleted_rels += counters.relationships_deleted
        if counters.nodes_created or counters.relationships_created or counters.labels_added:
            print(
                f"  #{i:03d} +{counters.nodes_created}n "
                f"+{counters.relationships_created}r "
                f"+{counters.labels_added}L  [{first_line(stmt, 70)}]"
            )
    print(
        f"Execution complete: nodes created={total_nodes}, "
        f"relationships created={total_rels}, properties set={total_props}, "
        f"labels added={total_labels}, deleted={total_deleted_nodes}n/{total_deleted_rels}r"
    )
    if not any((total_nodes, total_rels, total_props, total_labels,
                total_deleted_nodes, total_deleted_rels)):
        print("  (no writes - every MERGE matched existing data; idempotent re-run)")
    return True


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        prog="cypher_runner",
        description="Validate (EXPLAIN) and optionally execute a batch .cypher file.",
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

    driver, database = build_driver()
    try:
        with driver.session(database=database) as session:
            if not validate(session, statements):
                return 1
            if not args.execute:
                print("Validate-only mode; pass --execute to run.")
                return 0
            return 0 if execute(session, statements) else 1
    finally:
        driver.close()


if __name__ == "__main__":
    sys.exit(main())
