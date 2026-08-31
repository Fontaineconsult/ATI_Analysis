#
# INTERVIEW GUIDE DELETE QUERIES
#
from app.database.graph_schema import InterviewGuide
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError
from neomodel import db


def delete_interview_guide(unique_id: str) -> bool:
    """Detach-delete one guide. People / targets / communities / minutes survive —
    only the guide node and its edges go."""
    guide = InterviewGuide.nodes.first_or_none(unique_id=unique_id)
    if guide is None:
        raise NotFoundError(f"InterviewGuide {unique_id!r} not found")
    try:
        db.cypher_query(
            "MATCH (g:InterviewGuide {unique_id: $uid}) DETACH DELETE g",
            {"uid": unique_id},
        )
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete InterviewGuide {unique_id!r}: {e}")
