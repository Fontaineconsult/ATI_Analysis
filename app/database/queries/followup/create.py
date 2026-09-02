#
# FOLLOWUP CREATE QUERIES
#
# A FollowUp is the message that chases what a meeting left open. Its required
# anchor is the MeetingMinutes it follows up on; neomodel cannot enforce a
# required RelationshipTo at save time, so this module is the only sanctioned
# creation path and wires the anchor explicitly.
#
# Scope is ONE community of practice at ONE campus — the audience that shares the
# ground being chased. A meeting spanning two communities gets two follow-ups.
#
from datetime import date

from app.database.graph_schema import (
    FollowUp,
    MeetingMinutes,
    InterviewGuide,
    CommunityOfPractice,
    Campus,
    Person,
    YearSuccessEvidence,
    Query,
    Recommendation,
    Concern,
)
from app.data_config import followup_statuses
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def _get_one(cls, label, **kwargs):
    node = cls.nodes.get_or_none(**kwargs)
    if node is None:
        raise NotFoundError(f"{label} not found: {kwargs}")
    return node


def create_follow_up(subject: str,
                     meeting_minutes_id: str,
                     body_markdown: str = None,
                     status: str = "draft",
                     community_name: str = None,
                     campus_abbreviation: str = None,
                     interview_guide_id: str = None,
                     addressed_to_ids: list = None,
                     covers_evidence_identifiers: list = None,
                     includes_query_ids: list = None,
                     includes_recommendation_ids: list = None,
                     includes_concern_ids: list = None,
                     created_by_id: str = None) -> dict:
    """Create a FollowUp anchored to the meeting it chases.

    The ONLY sanctioned creation path: it wires the required `follows_up_on`
    edge and validates the status vocabulary. Everything else is optional and
    connected only when supplied, so a draft can be saved before its recipient
    list or its ask set is final.

    Raises ValidationError on bad input, NotFoundError when a referenced node is
    missing, CrudError on save failure.
    """
    if not subject or not subject.strip():
        raise ValidationError("subject is required")

    if status not in followup_statuses:
        raise ValidationError(
            f"Invalid status {status!r}; must be one of {list(followup_statuses.keys())}"
        )

    minutes = _get_one(MeetingMinutes, "MeetingMinutes", unique_id=meeting_minutes_id)

    try:
        follow_up = FollowUp(
            subject=subject.strip(),
            body_markdown=body_markdown,
            status=status,
            date_created=date.today(),
        ).save()
    except Exception as e:
        raise CrudError(f"Failed to create FollowUp: {e}")

    try:
        follow_up.follows_up_on.connect(minutes)

        if interview_guide_id:
            follow_up.derived_from.connect(
                _get_one(InterviewGuide, "InterviewGuide", unique_id=interview_guide_id))

        if community_name:
            follow_up.pertains_to.connect(
                _get_one(CommunityOfPractice, "CommunityOfPractice", name=community_name))

        if campus_abbreviation:
            follow_up.for_campus.connect(
                _get_one(Campus, "Campus", abbreviation=campus_abbreviation))

        for person_id in addressed_to_ids or []:
            follow_up.addressed_to.connect(
                _get_one(Person, "Person", unique_id=person_id))

        for year_identifier in covers_evidence_identifiers or []:
            follow_up.covers_evidence.connect(
                _get_one(YearSuccessEvidence, "YearSuccessEvidence",
                         year_identifier=year_identifier))

        for query_id in includes_query_ids or []:
            follow_up.includes_query.connect(
                _get_one(Query, "Query", unique_id=query_id))

        for rec_id in includes_recommendation_ids or []:
            follow_up.includes_recommendation.connect(
                _get_one(Recommendation, "Recommendation", unique_id=rec_id))

        for concern_id in includes_concern_ids or []:
            follow_up.includes_concern.connect(
                _get_one(Concern, "Concern", unique_id=concern_id))

        if created_by_id:
            follow_up.created_by.connect(
                _get_one(Person, "Person", unique_id=created_by_id))
    except NotFoundError:
        # The node exists but its edges are incomplete — delete rather than leave
        # a FollowUp with no anchor, which is the invariant this module exists to
        # protect.
        follow_up.delete()
        raise
    except Exception as e:
        follow_up.delete()
        raise CrudError(f"Failed to wire FollowUp relationships: {e}")

    return follow_up.serialize()
