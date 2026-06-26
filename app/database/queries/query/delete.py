#
# QUERY DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError


def delete_query(unique_id: str) -> bool:
    """
    Delete a Query and its private has_note notes. The addressed YSE, the anchor
    WorkingGroupPlan, and any linked Person are shared reference data and are left intact
    (only the edges to them are removed when the node is deleted).

    Raises NotFoundError if the query is missing, CrudError on failure.
    """
    try:
        query = Query.nodes.get(unique_id=unique_id)
    except Query.DoesNotExist:
        raise NotFoundError(f"Query {unique_id!r} not found")

    try:
        for note in query.notes.all():
            note.delete()
        query.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete Query {unique_id!r}: {e}")
