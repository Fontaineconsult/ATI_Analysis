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
            RETURN c.unique_id, c.name, c.description, member_count, campuses,
                   size([(c)-[:has_stake_in]->(:SuccessIndicator) | 1]) AS stake_count
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
                "stake_count": r[5],
            }
            for r in rows
        ]
    except Exception as e:
        raise CrudError(f"Failed to retrieve communities: {e}")


def get_community(unique_id: str) -> dict:
    """One community with its member roster (campus + membership note per member)
    and its indicator stakes (the has_stake_in edges, note included)."""
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

        stake_rows, _ = db.cypher_query(
            """
            MATCH (c:CommunityOfPractice {unique_id: $uid})-[r:has_stake_in]->(si:SuccessIndicator)
            RETURN si.composite_key, si.success_indicator, r.note
            ORDER BY si.composite_key
            """,
            {"uid": community.unique_id},
        )
        stakes = [
            {"composite_key": r[0], "success_indicator": r[1], "note": r[2]}
            for r in stake_rows
        ]
        return {**community.serialize(), "members": members, "stakes": stakes}
    except Exception as e:
        raise CrudError(f"Failed to retrieve community {unique_id!r}: {e}")


def get_communities_by_working_group() -> list:
    """
    Which communities of practice fit each working group — derived entirely from
    the graph, no mapping tables: a community fits a WG through where its
    indicator stakes land,

        (wg)-[:responsible_for]->(:Goal)-[:supported_by]->(si)<-[:has_stake_in]-(c)

    weighted by stake_count (communities are ordered strongest-fit first within
    each group; a community holding stakes in several groups appears under each).

    People model: each community's explicit member_of_community roster is its
    LEADS — deliberately a handful. The broader body of people is derived from
    the working group itself (participates_in), returned once per WG as
    working_group_members and shared by every community in that group.

    WG order and abbreviations follow the registry (data_config.WORKING_GROUP_DEFS).
    """
    from app.data_config import WORKING_GROUP_DEFS

    try:
        rows, _ = db.cypher_query(
            """
            MATCH (wg:ATIWorkingGroup)
            OPTIONAL MATCH (wg)-[:responsible_for]->(:Goal)-[:supported_by]->
                           (si:SuccessIndicator)<-[:has_stake_in]-(c:CommunityOfPractice)
            WITH wg, c, count(DISTINCT si) AS stake_count
            ORDER BY stake_count DESC, toLower(c.name)
            WITH wg,
                 [x IN collect({
                    name: c.name,
                    unique_id: c.unique_id,
                    stake_count: stake_count,
                    leads: [(lead:Person)-[m:member_of_community]->(c) |
                              {name: lead.name, title: lead.title,
                               employee_id: lead.employee_id,
                               campus: head([(lead)-[:works_at_campus]->(ca:Campus) | ca.abbreviation]),
                               note: m.note}]
                 }) WHERE x.name IS NOT NULL] AS communities
            OPTIONAL MATCH (p:Person)-[:participates_in]->(wg)
            WHERE p.active OR p.non_committee_member_active
            WITH wg, communities, p
            ORDER BY toLower(p.name)
            RETURN wg.name AS working_group,
                   communities,
                   [x IN collect(DISTINCT {name: p.name, title: p.title,
                                           employee_id: p.employee_id,
                                           campus: head([(p)-[:works_at_campus]->(ca:Campus) | ca.abbreviation])})
                    WHERE x.name IS NOT NULL] AS working_group_members
            """
        )
    except Exception as e:
        raise CrudError(f"Failed to derive communities by working group: {e}")

    order = {d["name"]: i for i, d in enumerate(WORKING_GROUP_DEFS)}
    abbrev = {d["name"]: d["abbrev"] for d in WORKING_GROUP_DEFS}
    results = [
        {
            "working_group": r[0],
            "abbreviation": abbrev.get(r[0]),
            "communities": r[1],
            "working_group_members": r[2],
        }
        for r in rows
    ]
    results.sort(key=lambda r: order.get(r["working_group"], len(order)))
    return results
