"""
Feature: FollowUp writes — save and send the post-meeting chase (write-gated).

The write complement to the ``followups`` reads. ``save_follow_up`` is how a
message composed by the /follow-up skill lands in the graph;
``mark_follow_up_sent`` records that it actually went out.

Recording WHICH asks a follow-up carried is the point of this tool, not a
detail. Without `query_unique_ids` and friends, a follow-up is an inert blob of
text and "what have we chased, and what came back" stays an archaeology
exercise. The ask ids come from the ``meeting_followup_table`` query.

Sent-ness matters for the same reason: an ask still open under a follow-up that
was SENT is a non-response worth escalating, while the same ask on a draft is
just an unfinished chase. Do not mark sent until it has been.

Identifier conventions:
  people      -> employee_id (matching people_write / interview_guides_write;
                 resolved internally to the Person)
  minutes     -> MeetingMinutes unique_id
  guides      -> InterviewGuide unique_id
  communities -> full CommunityOfPractice.name (resolved internally)
  evidence    -> YSE year_identifier ('2025-2026-8.11-ins-csueb')
  asks        -> Query / Recommendation / Concern unique_id

Registers only when ATI_MCP_ALLOW_WRITE is on; descriptions are [WRITE]-prefixed.
"""

import contextlib
import sys
from datetime import datetime
from typing import List, Optional

from ._appbootstrap import ensure_app

NAME = "followups_write"


def _quiet():
    """Redirect stdout to stderr while a queries function runs (stdio-transport safety)."""
    return contextlib.redirect_stdout(sys.stderr)


def _people_uids(employee_ids):
    """employee_ids -> Person unique_ids, order kept. Raises NotFoundError on a miss."""
    from app.database.graph_schema import Person
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    uids = []
    for eid in employee_ids or []:
        person = Person.nodes.first_or_none(employee_id=eid)
        if person is None:
            raise NotFoundError(f"Person with employee_id {eid!r} not found")
        uids.append(person.unique_id)
    return uids


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    def save_follow_up(
        subject: str,
        meeting_minutes_id: str,
        body_markdown: str,
        community_name: Optional[str] = None,
        campus_abbreviation: Optional[str] = None,
        interview_guide_id: Optional[str] = None,
        recipient_employee_ids: Optional[List[str]] = None,
        covers_year_identifiers: Optional[List[str]] = None,
        query_unique_ids: Optional[List[str]] = None,
        recommendation_unique_ids: Optional[List[str]] = None,
        concern_unique_ids: Optional[List[str]] = None,
        created_by_employee_id: Optional[str] = None,
    ) -> dict:
        """Save a composed follow-up message against the meeting it chases.

        `body_markdown` is the message as written — stored verbatim, rendered to
        email-ready HTML in the browser, and never regenerated. Scope it to ONE
        community x campus slice; a meeting spanning two communities gets two
        follow-ups to two rooms rather than one message nobody owns.

        Pass `query_unique_ids` / `recommendation_unique_ids` /
        `concern_unique_ids` for every ask the message actually makes (ids come
        from meeting_followup_table). That wiring is what lets a later read say
        which chases were answered. `generated_at` is stamped automatically.

        Saves as a DRAFT — call mark_follow_up_sent once it has genuinely gone
        out."""
        ensure_app()
        from app.database.queries.followup.create import create_follow_up as _create
        from app.database.queries.followup.read import get_follow_up as _get

        created_by = _people_uids([created_by_employee_id])[0] if created_by_employee_id else None

        with _quiet():
            created = _create(
                subject=subject,
                meeting_minutes_id=meeting_minutes_id,
                body_markdown=body_markdown,
                status="draft",
                community_name=community_name,
                campus_abbreviation=campus_abbreviation,
                interview_guide_id=interview_guide_id,
                addressed_to_ids=_people_uids(recipient_employee_ids),
                covers_evidence_identifiers=covers_year_identifiers or [],
                includes_query_ids=query_unique_ids or [],
                includes_recommendation_ids=recommendation_unique_ids or [],
                includes_concern_ids=concern_unique_ids or [],
                created_by_id=created_by,
            )
        return _get(created["unique_id"])

    def update_follow_up(
        unique_id: str,
        subject: Optional[str] = None,
        body_markdown: Optional[str] = None,
        restamp_generated_at: bool = False,
    ) -> dict:
        """Correct a follow-up's subject or body. Only supplied fields change.

        Set `restamp_generated_at` when the body was RE-COMPOSED against a
        changed graph: a rewritten message keeping its old timestamp would claim
        to describe evidence it never saw. Leave it false for a typo fix."""
        ensure_app()
        from app.database.queries.followup.update import update_follow_up as _update
        from app.database.queries.followup.read import get_follow_up as _get

        with _quiet():
            _update(
                unique_id,
                subject=subject,
                body_markdown=body_markdown,
                generated_at=(datetime.now().replace(microsecond=0).isoformat()
                              if restamp_generated_at else None),
            )
        return _get(unique_id)

    def mark_follow_up_sent(unique_id: str, date_sent: Optional[str] = None) -> dict:
        """Record that a follow-up actually went out (YYYY-MM-DD; defaults to
        today). Only call this once it has genuinely been sent — the distinction
        is load-bearing, because an ask still open under a SENT follow-up is a
        non-response, while the same ask on a draft is an unfinished chase."""
        ensure_app()
        from app.database.queries.followup.update import mark_follow_up_sent as _sent
        from app.database.queries.followup.read import get_follow_up as _get

        with _quiet():
            _sent(unique_id, date_sent=date_sent)
        return _get(unique_id)

    for fn, name, description in (
        (save_follow_up, "save_follow_up",
         "[WRITE] Save a composed follow-up against the meeting it chases, recording which asks it carries."),
        (update_follow_up, "update_follow_up",
         "[WRITE] Correct a follow-up's subject or body; optionally re-stamp when it was re-composed."),
        (mark_follow_up_sent, "mark_follow_up_sent",
         "[WRITE] Record that a follow-up actually went out."),
    ):
        mcp.add_tool(fn, name=name, description=description)
