#
# COMMUNITY OF PRACTICE UPDATE QUERIES
#
from datetime import date

from neomodel import db

from app.database.graph_schema import CommunityOfPractice, Person, SuccessIndicator
from app.database.queries.communities.read import get_community_node
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError, ValidationError


def update_community(unique_id: str, data: dict) -> CommunityOfPractice:
    """Update a community's name and/or description. Renames must stay unique."""
    community = get_community_node(unique_id)

    if "name" in data and data["name"] is not None:
        name = (data["name"] or "").strip()
        if not name:
            raise ValidationError("Community name cannot be empty.")
        existing = CommunityOfPractice.nodes.first_or_none(name=name)
        if existing and existing.unique_id != community.unique_id:
            raise ValidationError(f"A community named {name!r} already exists.")
        community.name = name
    if "description" in data:
        community.description = data["description"]

    try:
        community.save()
        return community
    except Exception as e:
        raise CrudError(f"Failed to update community {unique_id!r}: {e}")


def set_person_communities(employee_id: str, memberships: list) -> Person:
    """
    Replace a person's community memberships (in_communities) with the given set —
    the same replace-semantics as set_person_role_holdings. Each membership is
    {community_id, note?}; the optional note (the person's stake in the area) lives
    on the member_of_community edge (CommunityMembershipRel).

    Raises ValidationError on a bad list / missing community_id, NotFoundError if the
    person or any community is missing, CrudError on failure. Returns the person node.
    """
    if not employee_id:
        raise ValidationError("employee_id is required")
    if memberships is None:
        memberships = []
    if not isinstance(memberships, list):
        raise ValidationError("communities must be a list of memberships")

    try:
        person = Person.nodes.get(employee_id=employee_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"Person with employee_id {employee_id!r} not found")

    # Resolve all communities up front so a bad id fails before we mutate any edges.
    resolved = []
    for m in memberships:
        m = m or {}
        community_id = m.get("community_id")
        if not community_id:
            raise ValidationError("each membership requires a community_id")
        community = CommunityOfPractice.nodes.first_or_none(unique_id=community_id)
        if community is None:
            raise NotFoundError(f"Community {community_id!r} not found")
        resolved.append((community, m))

    try:
        person.in_communities.disconnect_all()
        seen = set()
        for community, m in resolved:
            if community.unique_id in seen:
                continue
            seen.add(community.unique_id)
            person.in_communities.connect(community, {
                "note": m.get("note"),
                "added_date": date.today(),
            })
        return person
    except Exception as e:
        raise CrudError(f"Failed to set community memberships for {employee_id!r}: {e}")


def add_community_stake(community_unique_id: str, composite_key: str, note: str = None) -> bool:
    """
    Add a `has_stake_in` edge from the community to the SuccessIndicator identified
    by `composite_key` — the community's practice area holds a stake in what the
    indicator measures, so its members are that indicator's stakeholders.

    Idempotent (MERGE): re-adding refreshes the note only when one is provided.
    Modeled on committees.update.add_prioritized_indicator.

    Raises NotFoundError if either node is missing, CrudError on failure.
    """
    community = get_community_node(community_unique_id)

    try:
        SuccessIndicator.nodes.get(composite_key=composite_key)
    except SuccessIndicator.DoesNotExist:
        raise NotFoundError(f"SuccessIndicator {composite_key!r} not found")

    try:
        db.cypher_query(
            """
            MATCH (c:CommunityOfPractice {unique_id: $community_id})
            MATCH (si:SuccessIndicator {composite_key: $si_key})
            MERGE (c)-[r:has_stake_in]->(si)
            ON CREATE SET r.added_date = date()
            SET r.note = coalesce($note, r.note)
            """,
            {
                "community_id": community.unique_id,
                "si_key": composite_key,
                "note": note,
            },
        )
        return True
    except Exception as e:
        raise CrudError(
            f"Failed to add stake in {composite_key!r} for community {community_unique_id!r}: {e}"
        )


def remove_community_stake(community_unique_id: str, composite_key: str) -> bool:
    """
    Remove the community's `has_stake_in` edge to the SuccessIndicator. The inverse
    of `add_community_stake`; idempotent — removing an absent edge is a no-op.

    Raises NotFoundError if the community is missing, CrudError on failure.
    """
    community = get_community_node(community_unique_id)

    try:
        db.cypher_query(
            """
            MATCH (c:CommunityOfPractice {unique_id: $community_id})
                  -[r:has_stake_in]->
                  (si:SuccessIndicator {composite_key: $si_key})
            DELETE r
            """,
            {"community_id": community.unique_id, "si_key": composite_key},
        )
        return True
    except Exception as e:
        raise CrudError(
            f"Failed to remove stake in {composite_key!r} for community {community_unique_id!r}: {e}"
        )
