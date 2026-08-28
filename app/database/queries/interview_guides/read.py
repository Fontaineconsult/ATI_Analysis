#
# INTERVIEW GUIDE READ QUERIES
#
from app.database.graph_schema import *
from app.database.queries.meeting_minutes.read import _person_min
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
from neomodel import db


def _target_row(yse) -> dict:
    """One target projected with its indicator identity and current status."""
    si = yse.tracks_success_indicator.single()
    sl = yse.status_level.single()
    return {
        "year_identifier": yse.year_identifier,
        "unique_id": yse.unique_id,
        "composite_key": si.composite_key if si else None,
        "success_indicator": si.success_indicator if si else None,
        "status_level": sl.status_level if sl else None,
    }


def _working_groups_from_targets(target_rows) -> list:
    """Derive the WG footprint from the targets' composite-key suffixes
    (the guide has no WGP anchor by design — guides span working groups)."""
    from app.data_config import WORKING_GROUP_DEFS
    by_abbrev = {d["abbrev"]: d["name"] for d in WORKING_GROUP_DEFS}
    seen = []
    for row in target_rows:
        ck = row.get("composite_key") or ""
        suffix = ck.rsplit("-", 1)[-1] if "-" in ck else None
        name = by_abbrev.get(suffix)
        if name and name not in seen:
            seen.append(name)
    return seen


def _serialize_guide(g) -> dict:
    data = g.serialize()
    campus = g.prepared_at_campus.single()
    year = g.prepared_in_year.single()
    data["campus_abbrev"] = campus.abbreviation if campus else None
    data["academic_year"] = year.name if year else None
    data["prepared_for"] = sorted(
        (_person_min(p) for p in g.prepared_for.all()),
        key=lambda p: (p["name"] or "").lower(),
    )
    data["targets"] = sorted(
        (_target_row(yse) for yse in g.targets.all()),
        key=lambda t: (t["composite_key"] or "", t["year_identifier"] or ""),
    )
    data["working_groups"] = _working_groups_from_targets(data["targets"])
    data["pertains_to_communities"] = sorted(
        ({"unique_id": c.unique_id, "name": c.name} for c in g.pertains_to.all()),
        key=lambda c: (c["name"] or "").lower(),
    )
    minutes = g.resulted_in.single()
    data["resulted_in"] = (
        {"unique_id": minutes.unique_id, "title": minutes.title,
         "meeting_date": minutes.meeting_date.isoformat() if minutes.meeting_date else None}
        if minutes else None
    )
    return data


def _sort_key(serialized):
    # Soonest/most recent planned meeting first; fall back to creation date.
    return serialized.get("meeting_date") or serialized.get("date_created") or ""


def get_interview_guide(unique_id: str) -> dict:
    """Return one fully-serialized InterviewGuide. Raises NotFoundError if missing."""
    guide = InterviewGuide.nodes.first_or_none(unique_id=unique_id)
    if guide is None:
        raise NotFoundError(f"InterviewGuide {unique_id!r} not found")
    return _serialize_guide(guide)


def guides_panel_for_campus_year(campus_abbrev: str, year_name: str) -> dict:
    """All guides anchored to one campus + year, newest planned meeting first."""
    rows, _ = db.cypher_query(
        """
        MATCH (g:InterviewGuide)-[:prepared_at_campus]->(:Campus {abbreviation: $campus}),
              (g)-[:prepared_in_year]->(:AcademicYear {name: $year})
        RETURN g.unique_id
        """,
        {"campus": campus_abbrev, "year": year_name},
    )
    guides = []
    for (uid,) in rows:
        g = InterviewGuide.nodes.first_or_none(unique_id=uid)
        if g:
            guides.append(_serialize_guide(g))
    guides.sort(key=_sort_key, reverse=True)

    # Closure candidates: every minutes record under this campus+year's plans,
    # so the edit modal can point resulted_in without a per-WG fetch dance.
    mrows, _ = db.cypher_query(
        """
        MATCH (m:MeetingMinutes)-[:minutes_under_plan]->(wgp:WorkingGroupPlan)
        WHERE wgp.plan_identifier STARTS WITH $yc
        RETURN m.unique_id, m.title, toString(m.meeting_date)
        ORDER BY coalesce(m.meeting_date, date('1900-01-01')) DESC
        """,
        {"yc": f"{year_name}-{campus_abbrev}-"},
    )
    minutes_candidates = [
        {"unique_id": r[0], "title": r[1], "meeting_date": r[2]} for r in mrows
    ]
    return {"campus_abbrev": campus_abbrev, "academic_year": year_name,
            "guides": guides, "minutes_candidates": minutes_candidates}


def guides_for_community(community_unique_id: str) -> list:
    """Guides pertaining to one community of practice, newest first."""
    community = CommunityOfPractice.nodes.first_or_none(unique_id=community_unique_id)
    if community is None:
        raise NotFoundError(f"Community {community_unique_id!r} not found")
    guides = [_serialize_guide(g) for g in community.pertaining_guides.all()]
    guides.sort(key=_sort_key, reverse=True)
    return guides
