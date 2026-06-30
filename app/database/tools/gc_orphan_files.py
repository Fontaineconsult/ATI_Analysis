"""Garbage-collect orphan file blobs.

Two kinds of orphan, both safe to reclaim:
  (a) StoredFile nodes that nothing references (no incoming has_file edge) — a record
      that used the file was deleted. Its blob is content-addressed and used only by
      this node, so the node + blob are removed.
  (b) On-disk blobs with no StoredFile node at all — e.g. an upload (POST /files) whose
      register step never happened. To avoid deleting an upload that is still mid-flight
      (between the upload call and the register call), these are pruned only with
      --prune-disk and only when older than --min-age-hours (default 24).

DRY RUN by default — pass --apply to actually delete. Run from C:\\www\\ati so the
gateway resolves web.config (FS_LOCAL_ROOT, DATABASE_URL):

    python -m app.database.tools.gc_orphan_files                       # report only
    python -m app.database.tools.gc_orphan_files --apply               # delete orphan nodes+blobs
    python -m app.database.tools.gc_orphan_files --apply --prune-disk  # also prune stale disk-only blobs
"""
import argparse
from datetime import datetime, timezone

# Warm up the data_api package first to dodge the latent circular-import trap (the
# file query modules import custom_exceptions from inside data_api), then connect.
import app.endpoints.data_api  # noqa: F401
from app.database.graph_schema import set_connection
from app.fs import storage
from app.fs.errors import StorageError


def disk_only_keys(on_disk, node_keys):
    """Pure set difference: keys present on disk but with no StoredFile node."""
    return sorted(set(on_disk) - set(node_keys))


def _age_hours(created_iso):
    """Hours since an ISO-8601 timestamp, or None if it can't be parsed."""
    if not created_iso:
        return None
    try:
        dt = datetime.fromisoformat(created_iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return (datetime.now(timezone.utc) - dt).total_seconds() / 3600.0
    except (ValueError, TypeError):
        return None


def main(apply=False, prune_disk=False, min_age_hours=24):
    set_connection()
    from neomodel import db
    from app.database.queries.files.read import find_orphan_stored_files
    from app.database.queries.files.delete import delete_stored_file_node

    orphan_nodes = find_orphan_stored_files()           # StoredFile with no has_file

    on_disk = list(storage.iter_keys())
    have_node = set()
    if on_disk:
        rows, _ = db.cypher_query(
            "MATCH (sf:StoredFile) WHERE sf.storage_key IN $keys RETURN sf.storage_key",
            {"keys": on_disk},
        )
        have_node = {r[0] for r in rows}
    disk_only = disk_only_keys(on_disk, have_node)

    print(f"Orphan StoredFile nodes (no record references them): {len(orphan_nodes)}")
    for o in orphan_nodes:
        print(f"  node {o['unique_id']}  key {o['storage_key']}")
    print(f"On-disk blobs with no StoredFile node: {len(disk_only)}")
    for key in disk_only:
        age = _age_hours(getattr(storage.stat(key), "created", None))
        age_s = f"{age:.1f}h" if age is not None else "unknown age"
        print(f"  blob {key}  ({age_s})")

    if not apply:
        print("\nDRY RUN — nothing deleted. Re-run with --apply.")
        return

    deleted_nodes = deleted_blobs = 0
    for o in orphan_nodes:
        key = o["storage_key"]
        try:
            storage.delete(key)
            deleted_blobs += 1
        except StorageError as e:
            print(f"  ! could not delete blob {key}: {e}")
        if delete_stored_file_node(key):
            deleted_nodes += 1

    if prune_disk:
        for key in disk_only:
            age = _age_hours(getattr(storage.stat(key), "created", None))
            if age is None or age < min_age_hours:
                print(f"  - skipping {key} (too new / unknown age; needs >= {min_age_hours}h)")
                continue
            try:
                storage.delete(key)
                deleted_blobs += 1
            except StorageError as e:
                print(f"  ! could not delete blob {key}: {e}")

    print(f"\nDeleted {deleted_nodes} StoredFile nodes and {deleted_blobs} blobs.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GC orphan file blobs.")
    parser.add_argument("--apply", action="store_true", help="actually delete (default: dry run)")
    parser.add_argument("--prune-disk", action="store_true", help="also prune stale disk-only blobs")
    parser.add_argument("--min-age-hours", type=float, default=24, help="min age for disk-only pruning")
    args = parser.parse_args()
    main(apply=args.apply, prune_disk=args.prune_disk, min_age_hours=args.min_age_hours)
