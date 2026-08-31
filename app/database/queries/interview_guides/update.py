#
# INTERVIEW GUIDE UPDATE QUERIES
#
from datetime import date

from app.database.graph_schema import *
from app.database.queries.meeting_minutes.create import (
    _parse_date,
    resolve_communities,
    resolve_people,
)
from app.database.queries.interview_guides.create import resolve_target_yses
from app.database.queries.interview_guides.read import get_interview_guide
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

# Sentinel so callers can distinguish "field omitted" from "field explicitly cleared".
_UNSET = object()


def _get(unique_id: str) -> InterviewGuide:
    guide = InterviewGuide.nodes.first_or_none(unique_id=unique_id)
    if guide is None:
        raise NotFoundError(f"InterviewGuide {unique_id!r} not found")
    return guide


def update_interview_guide(unique_id: str, title=_UNSET, content=_UNSET,
                           meeting_date=_UNSET, source_path=_UNSET) -> dict:
    """Partial update of the scalar fields. Returns the refreshed record."""
    g = _get(unique_id)
    if title is not _UNSET:
        if not title or not str(title).strip():
            raise ValidationError("title cannot be blank")
        g.title = str(title).strip()
    if content is not _UNSET:
        g.content = (content.strip() if isinstance(content, str) else content) or None
    if meeting_date is not _UNSET:
        g.meeting_date = _parse_date(meeting_date)
    if source_path is not _UNSET:
        g.source_path = source_path or None
    try:
        g.save()
    except Exception as e:
        raise CrudError(f"Failed to update InterviewGuide {unique_id!r}: {e}")
    return get_interview_guide(unique_id)


def set_guide_people(unique_id: str, person_unique_ids: list) -> dict:
    """Full-replace the intended-interviewee set ([] clears). Returns the record."""
    g = _get(unique_id)
    people = resolve_people(person_unique_ids)
    try:
        g.prepared_for.disconnect_all()
        for person in people:
            g.prepared_for.connect(person)
    except Exception as e:
        raise CrudError(f"Failed to set prepared_for on InterviewGuide {unique_id!r}: {e}")
    return get_interview_guide(unique_id)


def set_guide_targets(unique_id: str, target_year_identifiers: list) -> dict:
    """Full-replace the target-YSE set ([] clears; removed-SI targets rejected)."""
    g = _get(unique_id)
    targets = resolve_target_yses(target_year_identifiers)
    try:
        g.targets.disconnect_all()
        for yse in targets:
            g.targets.connect(yse)
    except Exception as e:
        raise CrudError(f"Failed to set targets on InterviewGuide {unique_id!r}: {e}")
    return get_interview_guide(unique_id)


def set_guide_communities(unique_id: str, community_unique_ids: list) -> dict:
    """Full-replace the pertains_to set ([] clears). Returns the record."""
    g = _get(unique_id)
    communities = resolve_communities(community_unique_ids)
    try:
        g.pertains_to.disconnect_all()
        for community in communities:
            g.pertains_to.connect(community)
    except Exception as e:
        raise CrudError(f"Failed to set pertains_to on InterviewGuide {unique_id!r}: {e}")
    return get_interview_guide(unique_id)


def set_guide_resulted_in(unique_id: str, minutes_unique_id) -> dict:
    """Point the closure edge at a MeetingMinutes record, or clear it with None."""
    g = _get(unique_id)
    minutes = None
    if minutes_unique_id:
        minutes = MeetingMinutes.nodes.first_or_none(unique_id=minutes_unique_id)
        if minutes is None:
            raise NotFoundError(f"MeetingMinutes {minutes_unique_id!r} not found")
    try:
        g.resulted_in.disconnect_all()
        if minutes:
            g.resulted_in.connect(minutes)
    except Exception as e:
        raise CrudError(f"Failed to set resulted_in on InterviewGuide {unique_id!r}: {e}")
    return get_interview_guide(unique_id)
