"""
Migrate existing Interface nodes to the four-coordinate signature.

WHY: Interface identity changed from `locus--title-slug` to the four-coordinate
signature `backing--locus--function--title-slug`, `interface_kind` was removed from
Interface (kind moved to Component), and `function`/`locus` became identity-bearing
properties (function is REQUIRED). Existing Interface nodes therefore:
  - carry a stale `interface_kind` property,
  - have an old-format `interface_identifier`,
  - lack `locus` / `function`.

`function` is an institutional-purpose judgment that CANNOT be derived from old data, and
`title` is now part of the key — so old identifiers cannot be regenerated automatically.
This script is therefore REPORT-FIRST and offers two operator-driven modes:

  report()              READ-ONLY. List every Interface node + its current fields. Run this
                        first to see what (if anything) needs migrating. This is what
                        `python -m app.database.tools.migrate_interface_signature` runs.

  strip_interface_kind()  Remove the stale `interface_kind` property from every Interface.
                        Safe and idempotent (the property is gone from the schema).

  backfill(old_identifier, function, locus=None, dry_run=True)
                        For ONE node: set function (+ locus, defaulting to the old node's
                        locus property or the first segment of the old identifier),
                        recompute interface_identifier via make_interface_identifier
                        (backing taken from the node's presented_by asset, else 'standalone'),
                        detect collisions, and remove interface_kind. dry_run prints the plan
                        without writing.

  purge_disposable(confirm=False)
                        DETACH DELETE every Interface node. For disposable dev data only —
                        recreate via the new UI. Requires confirm=True.

Usage (from project root):
    python -m app.database.tools.migrate_interface_signature           # report only
    python -c "from app.database.tools.migrate_interface_signature import *; set_connection(); strip_interface_kind()"
    python -c "from app.database.tools.migrate_interface_signature import *; set_connection(); backfill('canvas-sfsu-course-view', 'teaching-and-learning', dry_run=False)"
"""
from neomodel import db

from app.database.graph_schema import set_connection
from app.database.identifiers import make_interface_identifier
from app.data_config import functions


def report():
    """READ-ONLY: list every Interface node with its current identity-relevant fields."""
    rows, _ = db.cypher_query(
        """
        MATCH (i:Interface)
        OPTIONAL MATCH (i)-[:presented_by]->(a:Asset)
        RETURN i.interface_identifier  AS identifier,
               i.title                 AS title,
               i.interface_kind        AS interface_kind,
               i.locus                 AS locus,
               i.function              AS function,
               collect(a.asset_identifier) AS backing
        ORDER BY identifier
        """
    )
    print(f"Found {len(rows)} Interface node(s):")
    for r in rows:
        identifier, title, interface_kind, locus, function, backing = r
        needs = []
        if function is None:
            needs.append("function MISSING (required)")
        if locus is None:
            needs.append("locus MISSING")
        if interface_kind is not None:
            needs.append("stale interface_kind present")
        flag = "  <-- " + "; ".join(needs) if needs else "  (ok)"
        print(f"  - {identifier!r} title={title!r} backing={backing} "
              f"locus={locus!r} function={function!r} interface_kind={interface_kind!r}{flag}")
    return rows


def strip_interface_kind():
    """Remove the stale `interface_kind` property from every Interface. Idempotent."""
    rows, _ = db.cypher_query(
        "MATCH (i:Interface) WHERE i.interface_kind IS NOT NULL "
        "REMOVE i.interface_kind RETURN count(i) AS stripped"
    )
    stripped = rows[0][0] if rows else 0
    print(f"Removed interface_kind from {stripped} Interface node(s).")
    return stripped


def backfill(old_identifier: str, function: str, locus: str = None, dry_run: bool = True):
    """
    Backfill function (+ locus) on ONE Interface and regenerate its identifier.

    function MUST be a key of `functions`. locus defaults to the node's existing `locus`
    property, else the first '-' segment of the old identifier. backing is taken from the
    node's presented_by asset (else 'standalone'). Detects collisions before writing.
    """
    if function not in functions:
        raise ValueError(f"function must be one of {list(functions.keys())}; got {function!r}")

    rows, _ = db.cypher_query(
        """
        MATCH (i:Interface {interface_identifier: $id})
        OPTIONAL MATCH (i)-[:presented_by]->(a:Asset)
        RETURN i.title AS title, i.locus AS locus, collect(a.asset_identifier) AS backing
        """,
        {"id": old_identifier},
    )
    if not rows:
        raise ValueError(f"No Interface with interface_identifier {old_identifier!r}")
    title, existing_locus, backing_list = rows[0]
    backing = backing_list[0] if backing_list else "standalone"

    # Slug helper consistent with queries/interfaces/create._slugify.
    import re
    def _slug(v):
        return re.sub(r"[^a-z0-9]+", "-", (v or "").strip().lower()).strip("-")

    locus_val = locus or existing_locus or old_identifier.split("-")[0]
    new_identifier = make_interface_identifier(backing, _slug(locus_val), function, _slug(title or ""))

    # Collision check (excluding this node).
    coll, _ = db.cypher_query(
        "MATCH (j:Interface {interface_identifier: $new}) WHERE j.interface_identifier <> $old RETURN count(j)",
        {"new": new_identifier, "old": old_identifier},
    )
    if coll and coll[0][0]:
        raise ValueError(f"Collision: {new_identifier!r} already exists; resolve manually.")

    print(f"{'[dry-run] ' if dry_run else ''}{old_identifier!r} -> {new_identifier!r} "
          f"(backing={backing}, locus={locus_val!r}, function={function!r}); will set locus/function + drop interface_kind")
    if dry_run:
        return new_identifier

    db.cypher_query(
        """
        MATCH (i:Interface {interface_identifier: $old})
        SET i.interface_identifier = $new,
            i.locus = $locus,
            i.function = $function
        REMOVE i.interface_kind
        """,
        {"old": old_identifier, "new": new_identifier, "locus": locus_val, "function": function},
    )
    print(f"Migrated {old_identifier!r} -> {new_identifier!r}.")
    return new_identifier


def purge_disposable(confirm: bool = False):
    """DETACH DELETE every Interface node (disposable dev data only). Requires confirm=True."""
    if not confirm:
        print("Refusing to purge without confirm=True. This DETACH DELETEs all Interface nodes.")
        return 0
    rows, _ = db.cypher_query("MATCH (i:Interface) DETACH DELETE i RETURN count(i) AS deleted")
    deleted = rows[0][0] if rows else 0
    print(f"Deleted {deleted} Interface node(s).")
    return deleted


if __name__ == "__main__":
    set_connection()
    report()
