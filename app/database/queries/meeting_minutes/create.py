#
# MEETING MINUTES CREATE QUERIES
#
# A MeetingMinutes record anchors to a WorkingGroupPlan (which encodes campus + year +
# working group). This module is the only sanctioned creation path: neomodel cannot enforce
# the required anchor at save time, so create_meeting_minutes wires it explicitly.
#
from datetime import date, datetime

from app.database.graph_schema import *
from app.database.identifiers import make_working_group_plan_identifier
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# Accepts working-group abbrevs, full names, AND the frontend route segments, all normalized
# to the 3-letter code used in WorkingGroupPlan.plan_identifier. (Kept local so this feature
# stays isolated from the Query CRUD.)
WORKING_GROUP_ABBREV = {
    "web": "web", "pro": "pro", "ins": "ins",
    "Web": "web", "Procurement": "pro", "Instructional Materials": "ins",
    "procurement": "pro", "instructional-materials": "ins",
}


def _resolve_working_group_plan(working_group_plan_identifier=None, campus_abbrev=None,
                                year_name=None, working_group=None) -> WorkingGroupPlan:
    """Resolve the anchor WorkingGroupPlan by identifier, or build it from
    (year, campus, working_group). Raises ValidationError / NotFoundError."""
    identifier = working_group_plan_identifier
    if not identifier:
        if not (campus_abbrev and year_name and working_group):
            raise ValidationError(
                "Provide working_group_plan_identifier, or campus_abbrev + year_name + working_group"
            )
        abbrev = WORKING_GROUP_ABBREV.get(working_group)
        if not abbrev:
            raise ValidationError(
                f"Unknown working group {working_group!r}; expected one of {sorted(set(WORKING_GROUP_ABBREV))}"
            )
        identifier = make_working_group_plan_identifier(year_name, campus_abbrev, abbrev)

    try:
        return WorkingGroupPlan.nodes.get(plan_identifier=identifier)
    except WorkingGroupPlan.DoesNotExist:
        raise NotFoundError(
            f"WorkingGroupPlan {identifier!r} not found — a campus plan must exist for that "
            f"campus and year before meeting minutes can be recorded under it"
        )


def _parse_date(value):
    """'YYYY-MM-DD' -> date, None for blank, passthrough for a date. Raises ValidationError."""
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise ValidationError(f"meeting_date must be 'YYYY-MM-DD'; got {value!r}")


def resolve_people(person_unique_ids) -> list:
    """unique_ids -> Person nodes, deduped, order kept. Raises on bad input/missing."""
    if not isinstance(person_unique_ids, list):
        raise ValidationError("person_unique_ids must be a list")
    people = []
    for pid in dict.fromkeys(person_unique_ids):
        try:
            people.append(Person.nodes.get(unique_id=pid))
        except Person.DoesNotExist:
            raise NotFoundError(f"Person {pid!r} not found")
    return people


def resolve_communities(community_unique_ids) -> list:
    """unique_ids -> CommunityOfPractice nodes, deduped, order kept. Raises on bad input/missing."""
    if not isinstance(community_unique_ids, list):
        raise ValidationError("community_unique_ids must be a list")
    communities = []
    for cid in dict.fromkeys(community_unique_ids):
        try:
            communities.append(CommunityOfPractice.nodes.get(unique_id=cid))
        except CommunityOfPractice.DoesNotExist:
            raise NotFoundError(f"CommunityOfPractice {cid!r} not found")
    return communities


def create_meeting_minutes(title: str,
                           content: str = None,
                           working_group_plan_identifier: str = None,
                           campus_abbrev: str = None,
                           year_name: str = None,
                           working_group: str = None,
                           meeting_date: str = None,
                           recorded_by_unique_id: str = None,
                           participant_unique_ids: list = None,
                           pertains_to_community_unique_ids: list = None) -> MeetingMinutes:
    """
    Create a MeetingMinutes record anchored to a WorkingGroupPlan. `content` is the minutes
    body as Markdown. Identify the anchor with `working_group_plan_identifier` or the
    (campus_abbrev, year_name, working_group) triple.

    `participant_unique_ids` wires Person -[participated_in]-> minutes (people the
    transcript shows were present, not idle mentions); `pertains_to_community_unique_ids`
    wires minutes -[pertains_to]-> CommunityOfPractice (multiple expected). Both resolve
    before anything is saved, so a bad id fails the whole create.

    Raises ValidationError on bad input, NotFoundError if the plan/person/community is
    missing, CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")

    wgp = _resolve_working_group_plan(
        working_group_plan_identifier, campus_abbrev, year_name, working_group
    )
    meeting_date_val = _parse_date(meeting_date)

    recorder = None
    if recorded_by_unique_id:
        try:
            recorder = Person.nodes.get(unique_id=recorded_by_unique_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person {recorded_by_unique_id!r} not found")

    participants = resolve_people(participant_unique_ids or [])
    communities = resolve_communities(pertains_to_community_unique_ids or [])

    try:
        minutes = MeetingMinutes(
            title=title.strip(),
            content=(content.strip() if isinstance(content, str) else content) or None,
            meeting_date=meeting_date_val,
            date_created=date.today(),
        )
        minutes.save()
        minutes.working_group_plan.connect(wgp)
        if recorder:
            minutes.recorded_by.connect(recorder)
        for person in participants:
            minutes.participants.connect(person)
        for community in communities:
            minutes.pertains_to.connect(community)
        return minutes
    except Exception as e:
        raise CrudError(f"Failed to create MeetingMinutes: {e}")
