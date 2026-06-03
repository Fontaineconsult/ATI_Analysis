"""
One-time migration: convert Interface.interface_kind from a scalar string to a list.

`Interface.interface_kind` became multi-valued (an ArrayProperty) so an interface can
play several roles at once. Nodes created before that change stored a single string
(e.g. "web-surface"). The ArrayProperty inflates a bare string character-by-character,
and each character fails the `choices` validation — so reading such a node raises
ValueError and GET /interfaces (and ?uncovered=true) returns 500.

This wraps any scalar interface_kind into a single-element list (["web-surface"]).
Idempotent: nodes whose interface_kind is already a list (or null) are left untouched.
Raw Cypher is used on read so we never trigger the broken inflation on pre-migration
nodes; the scalar/list check is done in Python to stay Neo4j-version-agnostic.

Run with: python -m app.database.tools.migrate_interface_kind_to_list
"""
from app.database.graph_schema import set_connection
from neomodel import db


def migrate_interface_kind_to_list():
    """Wrap every scalar Interface.interface_kind into a single-element list."""
    print("Wrapping scalar Interface.interface_kind values into lists...")
    rows, _ = db.cypher_query("MATCH (i:Interface) RETURN i.interface_identifier, i.interface_kind")
    fixed = 0
    for identifier, kind in rows:
        if kind is not None and not isinstance(kind, list):
            db.cypher_query(
                "MATCH (i:Interface {interface_identifier: $id}) SET i.interface_kind = $val",
                {"id": identifier, "val": [kind]},
            )
            print(f"  {identifier!r}: {kind!r} -> {[kind]!r}")
            fixed += 1
    print(f"  Done. {fixed} node(s) updated.\n")


def verify():
    """Confirm every interface_kind is now a list (or null)."""
    print("Verification (interface_kind by node):")
    rows, _ = db.cypher_query("MATCH (i:Interface) RETURN i.interface_identifier, i.interface_kind")
    clean = True
    for identifier, kind in rows:
        is_ok = kind is None or isinstance(kind, list)
        clean = clean and is_ok
        flag = "" if is_ok else "   <-- STILL SCALAR"
        print(f"  {identifier!r}: {type(kind).__name__} {kind!r}{flag}")
    print("\nAll interface_kind values are list/null — GET /interfaces will inflate cleanly."
          if clean else "\nFAIL: scalar interface_kind values remain.")


if __name__ == "__main__":
    set_connection()
    print("=" * 60)
    print("Interface.interface_kind scalar -> list migration")
    print("=" * 60 + "\n")
    migrate_interface_kind_to_list()
    verify()
