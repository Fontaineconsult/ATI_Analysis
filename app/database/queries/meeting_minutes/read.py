#
# MEETING MINUTES READ QUERIES
#
# A MeetingMinutes record is serialized with its derived plan coordinates (campus + year +
# working group, parsed from the anchor WorkingGroupPlan.plan_identifier), the people and
# attached Documents/Webpages, and notes. The "panel" functions return everything the
# embedded MeetingMinutesPanel needs in one round-trip.
#
from app.database.graph_schema import *
from app.database.identifiers import YEAR_PREFIX_LENGTH, make_working_group_plan_identifier
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


def _coords_from_plan_identifier(plan_identifier):
    """'2025-2026-sfsu-web' -> ('2025-2026', 'sfsu', 'web')."""
    if not plan_identifier or len(plan_identifier) <= YEAR_PREFIX_LENGTH:
        return None, None, None
    year = plan_identifier[:YEAR_PREFIX_LENGTH]
    rest = plan_identifier[YEAR_PREFIX_LENGTH + 1:]
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


def _serialize_minutes(m) -> dict:
    data = m.serialize()
    wgp = m.working_group_plan.single()
    wg_node = wgp.working_group.single() if wgp else None
    year, campus, _wg = _coords_from_plan_identifier(wgp.plan_identifier) if wgp else (None, None, None)
    data["working_group_plan_identifier"] = wgp.plan_identifier if wgp else None
    data["working_group"] = wg_node.name if wg_node else None
    data["campus_abbrev"] = campus
    data["academic_year"] = year
    data["recorded_by"] = _person_min(m.recorded_by.single())
    data["documents"] = [d.serialize() for d in m.supporting_documents.all()]
    data["webpages"] = [w.serialize() for w in m.supporting_webpages.all()]
    data["notes"] = [n.serialize() for n in m.notes.all()]
    return data


def _sort_key(serialized):
    # Most recent meeting first; fall back to creation date.
    return serialized.get("meeting_date") or serialized.get("date_created") or ""


def get_meeting_minutes(unique_id: str) -> dict:
    """Return one fully-serialized MeetingMinutes record. Raises NotFoundError if missing."""
    try:
        m = MeetingMinutes.nodes.get(unique_id=unique_id)
    except MeetingMinutes.DoesNotExist:
        raise NotFoundError(f"MeetingMinutes {unique_id!r} not found")
    return _serialize_minutes(m)


def minutes_panel_for_plan(working_group_plan_identifier: str) -> dict:
    """Everything the embedded panel needs for one WorkingGroupPlan: the minutes records,
    most recent first. Raises NotFoundError if the plan doesn't exist."""
    try:
        wgp = WorkingGroupPlan.nodes.get(plan_identifier=working_group_plan_identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(f"WorkingGroupPlan {working_group_plan_identifier!r} not found")
    wg_node = wgp.working_group.single()
    minutes = [_serialize_minutes(m) for m in wgp.meeting_minutes.all()]
    minutes.sort(key=_sort_key, reverse=True)
    return {
        "exists": True,
        "working_group_plan_identifier": working_group_plan_identifier,
        "working_group": wg_node.name if wg_node else None,
        "minutes": minutes,
    }


def minutes_panel_for_working_group(campus_abbrev: str, year_name: str, working_group: str) -> dict:
    """Panel payload resolved from (campus, year, working_group). exists=False when no campus
    plan exists yet (not an error)."""
    from app.database.queries.meeting_minutes.create import WORKING_GROUP_ABBREV
    abbrev = WORKING_GROUP_ABBREV.get(working_group)
    identifier = (
        make_working_group_plan_identifier(year_name, campus_abbrev, abbrev) if abbrev else None
    )
    empty = {
        "exists": False,
        "working_group_plan_identifier": identifier,
        "working_group": working_group,
        "minutes": [],
    }
    if not identifier:
        return empty
    try:
        return minutes_panel_for_plan(identifier)
    except NotFoundError:
        return empty
