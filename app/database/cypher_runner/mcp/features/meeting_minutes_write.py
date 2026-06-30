"""
Feature: MeetingMinutes writes — record / update / link / delete (write-gated).

The write complement to the ``meeting_minutes`` read tools. Each tool only CALLS the
sanctioned functions in ``app.database.queries.meeting_minutes.*`` — the same ones the Flask
``/meeting-minutes`` endpoints and the React MeetingMinutesPanel use — so no CRUD logic lives
here. Functions are imported INSIDE the tool body after ``ensure_app()``. Registers ONLY when
ATI_MCP_ALLOW_WRITE is on; every description is prefixed [WRITE].

``record_meeting_minutes`` is the "dump auto-generated minutes" tool: paste the Markdown body
and anchor it to a WorkingGroupPlan (by identifier or campus+year+working_group). The plan must
already exist for that campus + year.
"""

from typing import Optional

from ._appbootstrap import ensure_app

NAME = "meeting_minutes_write"


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    def record_meeting_minutes(
        title: str,
        content: Optional[str] = None,
        working_group_plan_identifier: Optional[str] = None,
        campus_abbrev: Optional[str] = None,
        year_name: Optional[str] = None,
        working_group: Optional[str] = None,
        meeting_date: Optional[str] = None,
        recorded_by_unique_id: Optional[str] = None,
    ) -> dict:
        """Record a working-group meeting: paste the minutes `content` (Markdown) and anchor it
        to a WorkingGroupPlan via `working_group_plan_identifier` ('<year>-<campus>-<wg>') OR the
        (campus_abbrev, year_name, working_group) triple. `meeting_date` is 'YYYY-MM-DD'. Returns
        the created record."""
        ensure_app()
        from app.database.queries.meeting_minutes.create import create_meeting_minutes as _create
        from app.database.queries.meeting_minutes.read import get_meeting_minutes as _get
        created = _create(
            title=title,
            content=content,
            working_group_plan_identifier=working_group_plan_identifier,
            campus_abbrev=campus_abbrev,
            year_name=year_name,
            working_group=working_group,
            meeting_date=meeting_date,
            recorded_by_unique_id=recorded_by_unique_id,
        )
        return _get(created.unique_id)

    def update_meeting_minutes(
        unique_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        meeting_date: Optional[str] = None,
    ) -> dict:
        """Patch a meeting record's title / content (Markdown) / meeting_date. Only the fields you
        actually pass are changed. Returns the refreshed record."""
        ensure_app()
        from app.database.queries.meeting_minutes.update import update_meeting_minutes as _update
        kwargs = {}
        if title is not None:
            kwargs["title"] = title
        if content is not None:
            kwargs["content"] = content
        if meeting_date is not None:
            kwargs["meeting_date"] = meeting_date
        return _update(unique_id, **kwargs)

    def attach_document_to_minutes(unique_id: str, name: str, uri_path: Optional[str] = None,
                                   file_path: Optional[str] = None) -> dict:
        """Create a Document (name + optional uri_path/file_path) and link it to a meeting record.
        Returns the refreshed record."""
        ensure_app()
        from app.database.queries.meeting_minutes.update import attach_document as _attach
        return _attach(unique_id, name, uri_path, file_path)

    def attach_webpage_to_minutes(unique_id: str, url: str, name: Optional[str] = None) -> dict:
        """Create a Webpage (url + optional name) and link it to a meeting record. Returns the
        refreshed record."""
        ensure_app()
        from app.database.queries.meeting_minutes.update import attach_webpage as _attach
        return _attach(unique_id, name, url)

    def add_minutes_note(unique_id: str, content: str, created_by_unique_id: Optional[str] = None) -> dict:
        """Attach a note to a meeting record. Returns the refreshed record."""
        ensure_app()
        from app.database.queries.meeting_minutes.update import add_minutes_note as _add
        return _add(unique_id, content, created_by_unique_id)

    def delete_meeting_minutes(unique_id: str) -> dict:
        """Delete a meeting record and its private notes (linked Documents/Webpages are left
        intact). Returns {ok, deleted}."""
        ensure_app()
        from app.database.queries.meeting_minutes.delete import delete_meeting_minutes as _delete
        _delete(unique_id)
        return {"ok": True, "deleted": unique_id}

    tools = [
        (record_meeting_minutes, "record_meeting_minutes",
         "Record a working-group meeting: paste Markdown minutes anchored to a WorkingGroupPlan."),
        (update_meeting_minutes, "update_meeting_minutes",
         "Patch a meeting record's title/content/meeting_date (only the fields you pass)."),
        (attach_document_to_minutes, "attach_document_to_minutes",
         "Create a Document and link it to a meeting record."),
        (attach_webpage_to_minutes, "attach_webpage_to_minutes",
         "Create a Webpage and link it to a meeting record."),
        (add_minutes_note, "add_minutes_note",
         "Attach a note to a meeting record."),
        (delete_meeting_minutes, "delete_meeting_minutes",
         "Delete a meeting record and its private notes."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description="[WRITE] " + desc)
