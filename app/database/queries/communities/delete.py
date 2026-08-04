#
# COMMUNITY OF PRACTICE DELETE QUERIES
#
from neomodel import db

from app.database.queries.communities.read import get_community_node
from app.endpoints.data_api.errors.custom_exceptions import CrudError


def delete_community(unique_id: str) -> None:
    """Delete a community; membership edges go with it. Members themselves are untouched."""
    community = get_community_node(unique_id)
    try:
        db.cypher_query(
            "MATCH (c:CommunityOfPractice {unique_id: $uid}) DETACH DELETE c",
            {"uid": community.unique_id},
        )
    except Exception as e:
        raise CrudError(f"Failed to delete community {unique_id!r}: {e}")
