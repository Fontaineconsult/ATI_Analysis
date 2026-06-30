"""Delete the graph-side StoredFile node.

Deleting the node does NOT remove the blob bytes — blobs are content-addressed and
may be shared, so the on-disk object is reclaimed separately by the GC tool
(app/database/tools/gc_orphan_files.py).
"""
from app.database.graph_schema import StoredFile
from app.endpoints.data_api.errors.custom_exceptions import CrudError


def delete_stored_file_node(storage_key):
    """Remove the StoredFile node (idempotent). Returns True if a node was deleted."""
    stored_file = StoredFile.nodes.get_or_none(storage_key=storage_key)
    if stored_file is None:
        return False
    try:
        stored_file.delete()
        return True
    except Exception as e:
        raise CrudError("Failed to delete stored file node", e)
