#
# QUERY READ QUERIES
#
# A Query is serialized with its derived plan coordinates (campus + academic year +
# working group, parsed from the anchor WorkingGroupPlan.plan_identifier), the YSE it
# addresses, and its people/notes. The "panel" functions return everything an embedded
# QueriesPanel needs in one round-trip: the queries plus the candidate YSE to attach.
#
from neomodel import db

from app.database.graph_schema import *
from app.database.identifiers import (
    YEAR_PREFIX_LENGTH,
    make_campus_plan_identifier,
    make_working_group_plan_identifier,
)
from app.data_config import query_categories, query_statuses
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


def _coords_from_plan_identifier(plan_identifier):
    """'2025-2026-sfsu-web' -> ('2025-2026', 'sfsu', 'web'). (None, None, None) if unparseable."""
    if not plan_identifier or len(plan_identifier) <= YEAR_PREFIX_LENGTH:
        return None, None, None
    year = plan_identifier[:YEAR_PREFIX_LENGTH]
    rest = plan_identifier[YEAR_PREFIX_LENGTH + 1:]  # skip the separator after the year
    if "-" in rest:
        campus, wg = rest.rsplit("-", 1)
    else:
        campus, wg = rest, None
    return year, campus, wg


def _person_min(person):
    if not person:
        return None
    return {
        "unique_id": person.unique_id,
        "name": person.name,
        "title": person.title,
        "email": person.email,
    }


def _serialize_note_with_author(note):
    """Note.serialize() plus the note's author (created_by), so the query
    discussion thread can show who said what."""
    data = note.serialize()
    author = note.created_by.single()
    data["author"] = _person_min(author) if author else None
    return data


def _serialize_addressed_yse(yse):
    si = yse.tracks_success_indicator.single()
    sl = yse.status_level.single()
    return {
        "unique_id": yse.unique_id,
        "year_identifier": yse.year_identifier,
        "composite_key": si.composite_key if si else None,
        "success_indicator": si.success_indicator if si else None,
        "status_level": sl.status_level if sl else None,
    }


def _serialize_query(query) -> dict:
    """Full serialized Query: own fields + display labels + derived plan coords +
    addressed YSE + people + notes."""
    data = query.serialize()

    wgp = query.working_group_plan.single()
    wg_node = wgp.working_group.single() if wgp else None
    year, campus, _wg_abbrev = _coords_from_plan_identifier(wgp.plan_identifier) if wgp else (None, None, None)

    data["category_label"] = query_categories.get(query.category, query.category)
    data["status_label"] = query_statuses.get(query.status, query.status)
    data["working_group_plan_identifier"] = wgp.plan_identifier if wgp else None
    data["working_group"] = wg_node.name if wg_node else None
    data["campus_abbrev"] = campus
    data["academic_year"] = year
    data["addresses_evidence"] = [
        _serialize_addressed_yse(yse) for yse in query.addresses_evidence.all()
    ]
    data["raised_by"] = _person_min(query.query_raised_by.single())
    data["settled_by"] = _person_min(query.query_settled_by.single())
    data["notes"] = [_serialize_note_with_author(n) for n in query.notes.all()]
    return data


def _sort_key(serialized):
    # Open work first, then by most recently raised.
    status_rank = {"open": 0, "in_progress": 1, "settled": 2}
    return (
        status_rank.get(serialized.get("status"), 3),
        serialized.get("date_raised") or "",
    )


# Candidate YSE for the attach dropdown: every (non-removed) SuccessIndicator owned by
# this WGP's working group that already has Year Success Evidence for THIS campus + year.
_CANDIDATE_EVIDENCE_QUERY = """
    MATCH (wgp:WorkingGroupPlan {plan_identifier: $wgp_id})-[:for_working_group]->(wg:ATIWorkingGroup)
    MATCH (wg)-[:responsible_for]->(:Goal)-[:supported_by]->(si:SuccessIndicator)
    WHERE si.removed = false OR si.removed IS NULL
    MATCH (yse:YearSuccessEvidence)-[:tracks]->(si)
    WHERE (yse)-[:evidence_at_campus]->(:Campus {abbreviation: $campus})
      AND (yse)-[:evidence_in_year]->(:AcademicYear {name: $year})
    OPTIONAL MATCH (yse)-[:status_is]->(sl:StatusLevel)
    RETURN DISTINCT yse.year_identifier  AS year_identifier,
                    yse.unique_id        AS unique_id,
                    si.composite_key     AS composite_key,
                    si.success_indicator AS success_indicator,
                    sl.status_level      AS status_level
    ORDER BY composite_key
"""


def _candidate_evidence(working_group_plan_identifier):
    year, campus, _wg = _coords_from_plan_identifier(working_group_plan_identifier)
    if not (year and campus):
        return []
    rows, _ = db.cypher_query(
        _CANDIDATE_EVIDENCE_QUERY,
        {"wgp_id": working_group_plan_identifier, "campus": campus, "year": year},
    )
    return [
        {
            "year_identifier": year_identifier,
            "unique_id": unique_id,
            "composite_key": composite_key,
            "success_indicator": success_indicator,
            "status_level": status_level,
        }
        for year_identifier, unique_id, composite_key, success_indicator, status_level in rows
    ]


def get_query(unique_id: str) -> dict:
    """Return one fully-serialized Query. Raises NotFoundError if it doesn't exist."""
    try:
        query = Query.nodes.get(unique_id=unique_id)
    except Query.DoesNotExist:
        raise NotFoundError(f"Query {unique_id!r} not found")
    return _serialize_query(query)


def query_panel_for_plan(working_group_plan_identifier: str) -> dict:
    """Everything an embedded QueriesPanel needs for one WorkingGroupPlan, in one
    round-trip: the queries (open work first) and the candidate YSE to attach. Raises
    NotFoundError if the plan doesn't exist."""
    try:
        wgp = WorkingGroupPlan.nodes.get(plan_identifier=working_group_plan_identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(f"WorkingGroupPlan {working_group_plan_identifier!r} not found")

    wg_node = wgp.working_group.single()
    queries = [_serialize_query(q) for q in wgp.queries.all()]
    queries.sort(key=_sort_key)
    return {
        "exists": True,
        "working_group_plan_identifier": working_group_plan_identifier,
        "working_group": wg_node.name if wg_node else None,
        "queries": queries,
        "candidate_evidence": _candidate_evidence(working_group_plan_identifier),
    }


def query_panel_for_working_group(campus_abbrev: str, year_name: str, working_group: str) -> dict:
    """Panel payload for the working-group dashboard, resolved from (campus, year,
    working_group) so the frontend never builds the identifier. When no campus plan
    exists yet, returns exists=False with empty lists (not an error)."""
    from app.database.queries.query.create import WORKING_GROUP_ABBREV
    abbrev = WORKING_GROUP_ABBREV.get(working_group)
    identifier = (
        make_working_group_plan_identifier(year_name, campus_abbrev, abbrev) if abbrev else None
    )
    empty = {
        "exists": False,
        "working_group_plan_identifier": identifier,
        "working_group": working_group,
        "queries": [],
        "candidate_evidence": [],
    }
    if not identifier:
        return empty
    try:
        return query_panel_for_plan(identifier)
    except NotFoundError:
        return empty


def list_queries_for_campus(campus_abbrev: str, year_name: str) -> dict:
    """All of a campus+year's queries grouped by working group. Returns an empty
    grouping (not an error) when the campus plan doesn't exist yet."""
    plan_identifier = make_campus_plan_identifier(year_name, campus_abbrev)
    try:
        plan = CampusPlan.nodes.get(plan_identifier=plan_identifier)
    except CampusPlan.DoesNotExist:
        return {"campus_abbrev": campus_abbrev, "academic_year": year_name, "working_groups": []}

    groups = []
    for wgp in plan.working_group_plans.all():
        wg_node = wgp.working_group.single()
        serialized = [_serialize_query(q) for q in wgp.queries.all()]
        serialized.sort(key=_sort_key)
        groups.append({
            "working_group": wg_node.name if wg_node else None,
            "working_group_plan_identifier": wgp.plan_identifier,
            "queries": serialized,
        })
    return {"campus_abbrev": campus_abbrev, "academic_year": year_name, "working_groups": groups}
