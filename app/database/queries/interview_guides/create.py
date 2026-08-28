#
# INTERVIEW GUIDE CREATE QUERIES
#
# An InterviewGuide anchors to a Campus + AcademicYear directly (guides span working
# groups, so no WorkingGroupPlan anchor — the WG footprint derives from the targets'
# YSEs). This module is the only sanctioned creation path: neomodel cannot enforce
# the required anchors at save time, so create_interview_guide wires them explicitly.
#
from datetime import date, datetime

from app.database.graph_schema import *
from app.database.queries.meeting_minutes.create import (
    _parse_date,
    resolve_communities,
    resolve_people,
)
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def resolve_target_yses(year_identifiers) -> list:
    """year_identifiers -> YearSuccessEvidence nodes, deduped, order kept.

    Rejects a target whose SuccessIndicator is removed — a retired indicator is
    not a valid prep target (same backstop family as stakes / prioritize / drives).
    Raises ValidationError / NotFoundError.
    """
    if not isinstance(year_identifiers, list):
        raise ValidationError("target_year_identifiers must be a list")
    targets = []
    for yid in dict.fromkeys(year_identifiers):
        yse = YearSuccessEvidence.nodes.first_or_none(year_identifier=yid)
        if yse is None:
            raise NotFoundError(f"YearSuccessEvidence {yid!r} not found")
        si = yse.tracks_success_indicator.single()
        if si is not None and si.removed:
            raise ValidationError(
                f"SuccessIndicator {si.composite_key!r} is removed; a retired indicator cannot be a prep target."
            )
        targets.append(yse)
    return targets


def create_interview_guide(title: str,
                           campus_abbrev: str,
                           year_name: str,
                           content: str = None,
                           meeting_date: str = None,
                           source_path: str = None,
                           prepared_for_unique_ids: list = None,
                           target_year_identifiers: list = None,
                           pertains_to_community_unique_ids: list = None) -> InterviewGuide:
    """
    Create an InterviewGuide anchored to a Campus + AcademicYear. `content` is the
    guide body as Markdown; `source_path` names its ontology/interviews/ file twin.

    Everything resolves BEFORE anything saves, so a bad id fails the whole create:
    campus by abbreviation, year by name, people/communities by unique_id, targets
    by YSE year_identifier (removed-SI targets rejected).

    Raises ValidationError on bad input, NotFoundError on a missing node,
    CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")
    if not campus_abbrev:
        raise ValidationError("campus_abbrev is required")
    if not year_name:
        raise ValidationError("year_name is required")

    try:
        campus = Campus.nodes.get(abbreviation=campus_abbrev)
    except Campus.DoesNotExist:
        raise NotFoundError(f"Campus {campus_abbrev!r} not found")
    try:
        year = AcademicYear.nodes.get(name=year_name)
    except AcademicYear.DoesNotExist:
        raise NotFoundError(f"AcademicYear {year_name!r} not found")

    meeting_date_val = _parse_date(meeting_date)
    people = resolve_people(prepared_for_unique_ids or [])
    targets = resolve_target_yses(target_year_identifiers or [])
    communities = resolve_communities(pertains_to_community_unique_ids or [])

    try:
        guide = InterviewGuide(
            title=title.strip(),
            content=(content.strip() if isinstance(content, str) else content) or None,
            meeting_date=meeting_date_val,
            date_created=date.today(),
            source_path=source_path or None,
        )
        guide.save()
        guide.prepared_at_campus.connect(campus)
        guide.prepared_in_year.connect(year)
        for person in people:
            guide.prepared_for.connect(person)
        for yse in targets:
            guide.targets.connect(yse)
        for community in communities:
            guide.pertains_to.connect(community)
        return guide
    except Exception as e:
        raise CrudError(f"Failed to create InterviewGuide: {e}")
