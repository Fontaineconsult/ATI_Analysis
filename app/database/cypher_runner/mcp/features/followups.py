"""
Feature: FollowUp reads — the post-meeting chase, read side.

A FollowUp is the message that chases what a meeting left open: the third
corner of the prep / record / chase loop that InterviewGuide and MeetingMinutes
begin. It is COMPOSED by an agent (see the /follow-up skill) and saved through
``followups_write``; the app displays it and never generates one.

The gap table those messages are written against is NOT here — it is the
``meeting_followup_table`` registry query, already exposed as a tool of that
name. These reads cover the saved records: what has been chased before, whether
it went out, and which asks it carried.

Identifier conventions:
  minutes    -> MeetingMinutes unique_id (from the meeting_minutes reads)
  follow-ups -> FollowUp unique_id (from list_follow_ups)

Independence: tools only CALL sanctioned queries functions, imported INSIDE the
tool body after ``ensure_app()``.
"""

from ._appbootstrap import ensure_app

NAME = "followups"


def register(mcp, ctx) -> None:

    def list_follow_ups(meeting_minutes_id: str) -> dict:
        """Every follow-up chasing one meeting, newest first — one per community
        x campus slice. Each carries its subject, status (draft/sent), community,
        campus, the saved markdown body, and `generated_at`: WHEN the message was
        composed. Compare that against the meeting_followup_table output before
        reusing a body — the table moves as evidence lands, so an older follow-up
        may describe a graph that no longer exists."""
        ensure_app()
        from app.database.queries.followup.read import follow_ups_for_meeting
        return {"follow_ups": follow_ups_for_meeting(meeting_minutes_id)}

    def get_follow_up(unique_id: str) -> dict:
        """One saved follow-up in full: body, status, dates, the guide and minutes
        it sits between, its community/campus slice, recipients, the YSEs it
        covers, and the asks it actually carried (includes_query /
        includes_recommendation / includes_concern, each with current status).
        Those ask lists are how you tell what a chase achieved: an ask still open
        on a follow-up that was SENT is a non-response; the same ask on a draft is
        simply an unfinished chase."""
        ensure_app()
        from app.database.queries.followup.read import get_follow_up as _get
        return _get(unique_id)

    for fn, name, description in (
        (list_follow_ups, "list_follow_ups",
         "Follow-ups chasing one meeting (subject, status, community, body, generated_at)."),
        (get_follow_up, "get_follow_up",
         "One follow-up in full, including which asks it carried and their current status."),
    ):
        mcp.add_tool(fn, name=name, description=description)
