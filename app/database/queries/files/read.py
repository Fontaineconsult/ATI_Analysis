"""Read queries for managed files (StoredFile nodes)."""
from app.database.graph_schema import StoredFile
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


def get_stored_file(storage_key):
    """The StoredFile for a content key, or raise NotFoundError."""
    stored_file = StoredFile.nodes.get_or_none(storage_key=storage_key)
    if stored_file is None:
        raise NotFoundError(f"No stored file registered for key {storage_key}")
    return stored_file


def find_orphan_stored_files():
    """StoredFile nodes that no record points at (no incoming has_file edge).

    Returns a list of {storage_key, unique_id}. The GC tool deletes the underlying
    blob and the node for each.
    """
    from neomodel import db
    query = (
        "MATCH (sf:StoredFile) "
        "WHERE NOT (sf)<-[:has_file]-() "
        "RETURN sf.storage_key AS storage_key, sf.unique_id AS unique_id"
    )
    rows, _meta = db.cypher_query(query)
    return [{"storage_key": key, "unique_id": uid} for (key, uid) in rows]
