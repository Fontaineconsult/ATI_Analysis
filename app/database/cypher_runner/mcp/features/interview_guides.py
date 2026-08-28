"""
Feature: InterviewGuide reads — the stakeholder-interview preps as graph nodes.

A guide is the upstream twin of MeetingMinutes (the PLAN for a conversation, where
minutes are the record). Recon reads for the /stakeholder-interview and
/ontology-ingest skills: which preps exist for a campus+year, what one guide holds
(targets, interviewees, communities, closure), and which preps work a community's
ground. A guide whose planned meeting_date has passed with no `resulted_in` minutes
is an OPEN LOOP — surface it.

Identifier conventions:
  guides      -> unique_id (from list_interview_guides / the file's `graph:` header)
  communities -> full CommunityOfPractice.name (resolved internally, like the
                 communities_write tools)
"""

from ._appbootstrap import ensure_app

NAME = "interview_guides"


def register(mcp, ctx) -> None:
    def list_interview_guides(campus_abbrev: str, academic_year: str) -> dict:
        """All interview-prep guides anchored to one campus + academic year, newest
        planned meeting first, each with interviewees, target YSEs, communities, and
        the resulted_in closure (null = the prepped meeting has no minutes yet)."""
        ensure_app()
        from app.database.queries.interview_guides.read import guides_panel_for_campus_year
        return guides_panel_for_campus_year(campus_abbrev, academic_year)

    def get_interview_guide(unique_id: str) -> dict:
        """One guide, fully projected: the Markdown body, prepared_for people,
        target YSEs (with indicator identity + status), pertinent communities,
        derived working-group footprint, and the resulted_in minutes if held."""
        ensure_app()
        from app.database.queries.interview_guides.read import get_interview_guide as _get
        return _get(unique_id)

    def list_guides_for_community(community_name: str) -> dict:
        """Interview preps working one community of practice's ground (full community
        name, e.g. 'Faculty Development'), newest first."""
        ensure_app()
        from app.database.graph_schema import CommunityOfPractice
        from app.database.queries.interview_guides.read import guides_for_community
        from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

        community = CommunityOfPractice.nodes.first_or_none(name=community_name)
        if community is None:
            raise NotFoundError(f"Community named {community_name!r} not found — see list_communities")
        return {"community": community.name, "guides": guides_for_community(community.unique_id)}

    tools = [
        (list_interview_guides, "list_interview_guides",
         "Interview-prep guides for a campus + academic year, with targets, interviewees, "
         "and closure state (a past-dated guide with no resulted_in minutes is an open loop)."),
        (get_interview_guide, "get_interview_guide",
         "One interview guide fully projected: Markdown body, people, target YSEs, "
         "communities, WG footprint, resulted_in minutes."),
        (list_guides_for_community, "list_guides_for_community",
         "Interview preps pertaining to one community of practice (full name)."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description=desc)
