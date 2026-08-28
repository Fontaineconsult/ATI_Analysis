"""
Feature: InterviewGuide writes — save / update / close preps (write-gated).

The write complement to the ``interview_guides`` reads. ``save_interview_guide``
is how a freshly authored prep lands in the graph (the CLI twin is
app/database/tools/save_interview_guide.py — same query functions underneath);
``close_interview_guide`` is the ingest-stamp step's tool: once the meeting's
MeetingMinutes node exists, point the guide's ``resulted_in`` at it so the
plan-vs-record pairing survives for next-cycle recon.

Identifier conventions:
  people      -> employee_id (matching people_write / communities_write; resolved
                 internally to the Person)
  targets     -> YSE year_identifier ('2025-2026-8.11-ins-csueb') — native key
  communities -> full CommunityOfPractice.name (resolved internally)
  minutes     -> MeetingMinutes unique_id (from the meeting_minutes reads)

Independence: tools only CALL sanctioned queries functions, imported INSIDE the
tool body after ``ensure_app()``. Registers only when ATI_MCP_ALLOW_WRITE is on;
descriptions are [WRITE]-prefixed.
"""

import contextlib
import sys
from typing import List, Optional

from ._appbootstrap import ensure_app

NAME = "interview_guides_write"


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


def _community_uids(names):
    """Full community names -> unique_ids. Raises NotFoundError on a miss."""
    from app.database.graph_schema import CommunityOfPractice
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    uids = []
    for name in names or []:
        community = CommunityOfPractice.nodes.first_or_none(name=name)
        if community is None:
            raise NotFoundError(f"Community named {name!r} not found — see list_communities")
        uids.append(community.unique_id)
    return uids


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    def save_interview_guide(
        title: str,
        campus_abbrev: str,
        year_name: str,
        content: Optional[str] = None,
        meeting_date: Optional[str] = None,
        source_path: Optional[str] = None,
        people_employee_ids: Optional[List[str]] = None,
        target_year_identifiers: Optional[List[str]] = None,
        community_names: Optional[List[str]] = None,
    ) -> dict:
        """Save a freshly authored interview prep as an InterviewGuide node: the
        Markdown `content` (the guide body), anchored to campus + academic year,
        wired to its intended interviewees (employee_ids), target YSEs
        (year_identifiers; a removed indicator is rejected), and communities (full
        names). `meeting_date` is the PLANNED date; `source_path` names the
        ontology/interviews/ file twin. Returns the full projection — record its
        unique_id as `graph: <uid>` on the file's second line."""
        ensure_app()
        from app.database.queries.interview_guides.create import create_interview_guide as _create
        from app.database.queries.interview_guides.read import get_interview_guide as _get

        with _quiet():
            guide = _create(
                title=title,
                campus_abbrev=campus_abbrev,
                year_name=year_name,
                content=content,
                meeting_date=meeting_date,
                source_path=source_path,
                prepared_for_unique_ids=_people_uids(people_employee_ids),
                target_year_identifiers=target_year_identifiers or [],
                pertains_to_community_unique_ids=_community_uids(community_names),
            )
        return _get(guide.unique_id)

    def update_interview_guide(
        unique_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        meeting_date: Optional[str] = None,
        source_path: Optional[str] = None,
        people_employee_ids: Optional[List[str]] = None,
        target_year_identifiers: Optional[List[str]] = None,
        community_names: Optional[List[str]] = None,
    ) -> dict:
        """Update a guide. Scalar fields change only when supplied; each list, when
        supplied, REPLACES that edge set in full ([] clears it; omit to leave
        untouched). Returns the refreshed projection."""
        ensure_app()
        from app.database.queries.interview_guides.update import (
            set_guide_communities, set_guide_people, set_guide_targets,
            update_interview_guide as _update,
        )
        from app.database.queries.interview_guides.read import get_interview_guide as _get

        with _quiet():
            kwargs = {}
            if title is not None:
                kwargs["title"] = title
            if content is not None:
                kwargs["content"] = content
            if meeting_date is not None:
                kwargs["meeting_date"] = meeting_date
            if source_path is not None:
                kwargs["source_path"] = source_path
            if kwargs:
                _update(unique_id, **kwargs)
            if people_employee_ids is not None:
                set_guide_people(unique_id, _people_uids(people_employee_ids))
            if target_year_identifiers is not None:
                set_guide_targets(unique_id, target_year_identifiers)
            if community_names is not None:
                set_guide_communities(unique_id, _community_uids(community_names))
        return _get(unique_id)

    def close_interview_guide(guide_unique_id: str, minutes_unique_id: Optional[str] = None) -> dict:
        """Close the prep loop: point the guide's resulted_in at the meeting's
        MeetingMinutes (the ingest-stamp step calls this once the minutes node
        exists). Pass minutes_unique_id=null to REOPEN (clear the closure).
        Returns the refreshed projection."""
        ensure_app()
        from app.database.queries.interview_guides.update import set_guide_resulted_in

        with _quiet():
            return set_guide_resulted_in(guide_unique_id, minutes_unique_id)

    tools = [
        (save_interview_guide, "save_interview_guide",
         "Save an authored interview prep as an InterviewGuide node — campus+year "
         "anchor, interviewees (employee_ids), target YSEs, communities (names)."),
        (update_interview_guide, "update_interview_guide",
         "Update a guide's scalars and/or full-replace its edge sets (supplied "
         "lists replace; [] clears; omitted lists untouched)."),
        (close_interview_guide, "close_interview_guide",
         "Point a guide's resulted_in at the meeting's minutes (the ingest-stamp "
         "step); null reopens."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description=f"[WRITE] {desc}")
