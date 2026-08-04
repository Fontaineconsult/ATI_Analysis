#
# COMMUNITY OF PRACTICE READ QUERIES
#
# The list view carries member counts and the campuses represented (derived from
# members' works_at_campus edges — the community node itself is campus-agnostic).
#
from neomodel import db

from app.database.graph_schema import CommunityOfPractice
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError


def get_community_node(unique_id: str) -> CommunityOfPractice:
    """The CommunityOfPractice node itself. Raises NotFoundError if missing."""
    community = CommunityOfPractice.nodes.first_or_none(unique_id=unique_id)
    if community is None:
        raise NotFoundError(f"Community {unique_id!r} not found")
    return community


def get_all_communities() -> list:
    """All communities ordered by name, each with member count and campuses represented."""
    try:
        rows, _ = db.cypher_query(
            """
            MATCH (c:CommunityOfPractice)
            OPTIONAL MATCH (p:Person)-[:member_of_community]->(c)
            OPTIONAL MATCH (p)-[:works_at_campus]->(campus:Campus)
            WITH c, count(DISTINCT p) AS member_count,
                 [a IN collect(DISTINCT campus.abbreviation) WHERE a IS NOT NULL] AS campuses
            RETURN c.unique_id, c.name, c.description, member_count, campuses
            ORDER BY toLower(c.name)
            """
        )
        return [
            {
                "unique_id": r[0],
                "name": r[1],
                "description": r[2],
                "member_count": r[3],
                "campuses": sorted(r[4]),
            }
            for r in rows
        ]
    except Exception as e:
        raise CrudError(f"Failed to retrieve communities: {e}")


def get_community(unique_id: str) -> dict:
    """One community with its member roster (campus + membership note per member)."""
    community = get_community_node(unique_id)
    try:
        members = []
        for person in community.members.all():
            rel = community.members.relationship(person)
            campus = person.host_campus.single()
            members.append({
                "unique_id": person.unique_id,
                "employee_id": person.employee_id,
                "name": person.name,
                "email": person.email,
                "title": person.title,
                "host_campus": campus.abbreviation if campus else None,
                "note": rel.note if rel else None,
            })
        members.sort(key=lambda m: (m["name"] or "").lower())
        return {**community.serialize(), "members": members}
    except Exception as e:
        raise CrudError(f"Failed to retrieve community {unique_id!r}: {e}")
