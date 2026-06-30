#
# MEETING MINUTES DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError


def delete_meeting_minutes(unique_id: str) -> bool:
    """
    Delete a MeetingMinutes record and its private has_note notes. Linked Document/Webpage
    nodes are shared records and are left intact (only the edges are removed when the node
    is deleted).

    Raises NotFoundError if the record is missing, CrudError on failure.
    """
    try:
        m = MeetingMinutes.nodes.get(unique_id=unique_id)
    except MeetingMinutes.DoesNotExist:
        raise NotFoundError(f"MeetingMinutes {unique_id!r} not found")

    try:
        for note in m.notes.all():
            note.delete()
        m.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete MeetingMinutes {unique_id!r}: {e}")
