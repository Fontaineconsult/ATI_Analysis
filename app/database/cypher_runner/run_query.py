#!/usr/bin/env python3
"""
ATI Cypher query runner.

Runs curated Cypher queries from query_registry.yaml against the ATI Neo4j
graph. Read queries run freely; write queries require an explicit --allow-write
flag. Results print as JSON (default) or a simple table.

Connection
----------
Credentials are read from the environment / a .env file. Two supported styles:

  1. Single neomodel-style URL (matches app/.env.development):
         DATABASE_URL=bolt://<user>:<password>@<host>:7687
     plus optional:
         NEO4J_DATABASE=ati        # defaults to "neo4j" (Aura's default DB)

  2. Split variables:
         NEO4J_URI=bolt://<host>:7687
         NEO4J_USERNAME=<user>
         NEO4J_PASSWORD=<password>
         NEO4J_DATABASE=ati

>>> CREDENTIALS: decide-later <<<
No instance is wired up yet. Until DATABASE_URL (or NEO4J_URI + creds) is set,
--list, --show, and --validate work offline; only --query needs a live DB.

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

Dependencies: pyyaml, neo4j  (pip install neo4j pyyaml)
"""

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

try:
    import yaml
except ImportError:
    sys.exit("Missing dependency: pyyaml  ->  pip install pyyaml")

REGISTRY_PATH = Path(__file__).with_name("query_registry.yaml")


# --------------------------------------------------------------------------- #
# Registry loading                                                            #
# --------------------------------------------------------------------------- #
def load_registry(path: Path = REGISTRY_PATH) -> dict:
    """Load the YAML registry into a name -> entry dict, validating as we go."""
    if not path.exists():
        sys.exit(f"Registry not found: {path}")
    with path.open(encoding="utf-8") as fh:
        entries = yaml.safe_load(fh) or []

    registry, errors = {}, []
    for i, e in enumerate(entries):
        name = e.get("name")
        if not name:
            errors.append(f"entry #{i} has no 'name'")
            continue
        if name in registry:
            errors.append(f"duplicate name '{name}'")
        mode = e.get("mode", "read")
        if mode not in ("read", "write"):
            errors.append(f"'{name}': mode must be read|write, got '{mode}'")
        if not e.get("cypher", "").strip():
            errors.append(f"'{name}': empty cypher")
        e.setdefault("params", [])
        e.setdefault("category", "uncategorized")
        e.setdefault("description", "")
        registry[name] = e

    if errors:
        sys.exit("Registry validation failed:\n  - " + "\n  - ".join(errors))
    return registry


# --------------------------------------------------------------------------- #
# Connection                                                                  #
# --------------------------------------------------------------------------- #
def _load_dotenv_if_present():
    """Best-effort load of app/.env.development without requiring python-dotenv."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    # app/.env.development relative to this file: ../../.env.development
    candidate = Path(__file__).resolve().parents[2] / ".env.development"
    if candidate.exists():
        load_dotenv(candidate)


def resolve_connection():
    """
    Return (uri, auth, database) or exit with a clear message if not configured.
    auth is a (user, password) tuple or None.
    """
    _load_dotenv_if_present()

    # Default mirrors app/web_config.py (the "point to aura" change): Aura's
    # only database is "neo4j". .env.development sets NEO4J_DATABASE explicitly,
    # so this fallback only matters when it's left unset.
    database = os.environ.get("NEO4J_DATABASE", "neo4j")

    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        parsed = urlparse(database_url)
        user = parsed.username
        password = parsed.password
        # Rebuild a clean URI without embedded credentials for the driver.
        netloc = parsed.hostname or ""
        if parsed.port:
            netloc += f":{parsed.port}"
        clean_uri = f"{parsed.scheme}://{netloc}"
        auth = (user, password) if user is not None else None
        return clean_uri, auth, database

    uri = os.environ.get("NEO4J_URI")
    if uri:
        user = os.environ.get("NEO4J_USERNAME")
        password = os.environ.get("NEO4J_PASSWORD")
        auth = (user, password) if user else None
        return uri, auth, database

    sys.exit(
        "No connection configured.\n"
        "Set DATABASE_URL=bolt://user:pass@host:7687 (neomodel style)\n"
        "or NEO4J_URI + NEO4J_USERNAME + NEO4J_PASSWORD, then retry.\n"
        "(Credentials are intentionally 'decide-later' — see the module docstring.)"
    )


def run_cypher(cypher: str, params: dict):
    """Execute cypher against the configured DB and return a list of row dicts."""
    # Resolve connection first so a missing/"decide-later" config produces a
    # clear message even before the driver is installed.
    uri, auth, database = resolve_connection()

    try:
        from neo4j import GraphDatabase
    except ImportError:
        sys.exit("Missing dependency: neo4j  ->  pip install neo4j")

    driver = GraphDatabase.driver(uri, auth=auth)
    try:
        with driver.session(database=database) as session:
            result = session.run(cypher, params or {})
            return [r.data() for r in result]
    finally:
        driver.close()


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
# Output                                                                       #
# --------------------------------------------------------------------------- #
def print_table(rows):
    if not rows:
        print("(no rows)")
        return
    cols = list(rows[0].keys())
    widths = {c: max(len(c), *(len(str(r.get(c, ""))) for r in rows)) for c in cols}
    print("  ".join(c.ljust(widths[c]) for c in cols))
    print("  ".join("-" * widths[c] for c in cols))
    for r in rows:
        print("  ".join(str(r.get(c, "")).ljust(widths[c]) for c in cols))


# --------------------------------------------------------------------------- #
# CLI                                                                          #
# --------------------------------------------------------------------------- #
def main(argv=None):
    ap = argparse.ArgumentParser(description="Run curated ATI Cypher queries.")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--list", action="store_true", help="List all registered queries.")
    g.add_argument("--show", metavar="NAME", help="Print one query's Cypher and params.")
    g.add_argument("--validate", action="store_true", help="Validate the registry and exit.")
    g.add_argument("--query", metavar="NAME", help="Run a query by name.")
    ap.add_argument("--param", action="append", metavar="K=V", help="Query parameter (repeatable).")
    ap.add_argument("--allow-write", action="store_true", help="Permit write-mode queries.")
    ap.add_argument("--table", action="store_true", help="Print rows as a table instead of JSON.")
    args = ap.parse_args(argv)

    registry = load_registry()

    if args.validate:
        print(f"OK — {len(registry)} queries valid.")
        return

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
        return

    if args.show:
        e = registry.get(args.show)
        if not e:
            sys.exit(f"Unknown query '{args.show}'. Try --list.")
        print(json.dumps(
            {"name": e["name"], "category": e["category"], "mode": e["mode"],
             "params": e["params"], "description": e["description"]},
            indent=2))
        print("\n" + e["cypher"].rstrip())
        return

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

    rows = run_cypher(e["cypher"], params)
    if args.table:
        print_table(rows)
    else:
        print(json.dumps(rows, indent=2, default=str))


if __name__ == "__main__":
    main()
