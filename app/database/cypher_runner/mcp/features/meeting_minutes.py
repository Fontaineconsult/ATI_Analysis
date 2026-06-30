"""
Feature: MeetingMinutes reads — working-group meeting records.

The read complement to ``meeting_minutes_write``. Reuses the sanctioned functions in
``app.database.queries.meeting_minutes.read``. A record anchors to a WorkingGroupPlan, so
campus, academic year, and working group are all derivable from that one edge; the body
(``content``) is Markdown.

  list_meeting_minutes_for_plan(wgp_identifier)                        -> panel payload (records)
  list_meeting_minutes_for_working_group(campus, year, working_group)   -> panel payload, resolved
  get_meeting_minutes(unique_id)                                       -> one record, fully serialized

Bootstrapping (same rule as query / ontology): each DB-backed tool calls ``ensure_app()`` then
imports the queries function INSIDE its body. Reads are ungated.
"""

from ._appbootstrap import ensure_app

NAME = "meeting_minutes"


def register(mcp, ctx) -> None:
    def list_meeting_minutes_for_plan(working_group_plan_identifier: str) -> dict:
        """All meeting-minutes records under one WorkingGroupPlan, most recent first.
        `working_group_plan_identifier` is '<year>-<campus>-<wg>' (e.g. '2025-2026-sfsu-web')."""
        ensure_app()
        from app.database.queries.meeting_minutes.read import minutes_panel_for_plan
        return minutes_panel_for_plan(working_group_plan_identifier)

    def list_meeting_minutes_for_working_group(campus_abbrev: str, academic_year: str, working_group: str) -> dict:
        """Meeting-minutes records for a (campus, year, working group), resolved to the plan
        server-side. `working_group` accepts the abbrev (web/pro/ins), full name, or route
        segment (web/instructional-materials/procurement). exists=False when no campus plan
        exists yet."""
        ensure_app()
        from app.database.queries.meeting_minutes.read import minutes_panel_for_working_group
        return minutes_panel_for_working_group(campus_abbrev, academic_year, working_group)

    def get_meeting_minutes(unique_id: str) -> dict:
        """One meeting record in full: title, meeting_date, Markdown content, derived campus +
        year + working group, recorder, attached documents/webpages, and notes."""
        ensure_app()
        from app.database.queries.meeting_minutes.read import get_meeting_minutes as _get
        return _get(unique_id)

    tools = [
        (list_meeting_minutes_for_plan, "list_meeting_minutes_for_plan",
         "Meeting-minutes records under one WorkingGroupPlan (by '<year>-<campus>-<wg>' identifier)."),
        (list_meeting_minutes_for_working_group, "list_meeting_minutes_for_working_group",
         "Meeting-minutes records for a campus + year + working group (resolved server-side)."),
        (get_meeting_minutes, "get_meeting_minutes",
         "Full detail (incl. Markdown body) for one meeting record by unique_id."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description=desc)
