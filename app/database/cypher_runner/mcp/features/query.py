"""
Feature: Query reads — pending questions raised under a WorkingGroupPlan.

The read complement to ``query_write``. Exposes the same serialized shapes the Flask
``/queries`` endpoints and the React QueriesPanel use, by reusing the sanctioned functions in
``app.database.queries.query.read``. A Query anchors to a WorkingGroupPlan, so campus, academic
year, and working group are all derivable from that one edge.

  list_queries_for_plan(wgp_identifier)                        -> panel payload (queries + attachable YSE)
  list_queries_for_working_group(campus, year, working_group)  -> panel payload, resolved from coordinates
  list_queries_for_campus(campus, year)                        -> all of a campus+year's queries, by working group
  get_query(unique_id)                                         -> one query, fully serialized

Bootstrapping (same rule as ontology / notes_write): each DB-backed tool calls ``ensure_app()``
then imports the queries function INSIDE its body, honoring the warm-up / circular-import rule.
Reads are ungated.
"""

from ._appbootstrap import ensure_app

NAME = "query"


def register(mcp, ctx) -> None:
    def list_queries_for_plan(working_group_plan_identifier: str) -> dict:
        """All pending questions raised under one WorkingGroupPlan, plus the candidate YSE that can
        be attached. `working_group_plan_identifier` is '<year>-<campus>-<wg>'
        (e.g. '2025-2026-sfsu-web')."""
        ensure_app()
        from app.database.queries.query.read import query_panel_for_plan
        return query_panel_for_plan(working_group_plan_identifier)

    def list_queries_for_working_group(campus_abbrev: str, academic_year: str, working_group: str) -> dict:
        """Pending questions for a (campus, year, working group), resolved to the WorkingGroupPlan
        server-side. `working_group` accepts the abbrev (web/pro/ins), full name, or route segment
        (web/instructional-materials/procurement). Returns exists=False when no campus plan exists yet."""
        ensure_app()
        from app.database.queries.query.read import query_panel_for_working_group
        return query_panel_for_working_group(campus_abbrev, academic_year, working_group)

    def list_queries_for_campus(campus_abbrev: str, academic_year: str) -> dict:
        """Every pending question for a campus + academic year, grouped by working group."""
        ensure_app()
        from app.database.queries.query.read import list_queries_for_campus as _list
        return _list(campus_abbrev, academic_year)

    def get_query(unique_id: str) -> dict:
        """One pending question in full: question/detail/category/status/answer, derived campus +
        year + working group, the YSE it addresses, people, and notes."""
        ensure_app()
        from app.database.queries.query.read import get_query as _get
        return _get(unique_id)

    tools = [
        (list_queries_for_plan, "list_queries_for_plan",
         "Pending questions under one WorkingGroupPlan (by '<year>-<campus>-<wg>' identifier), with attachable YSE."),
        (list_queries_for_working_group, "list_queries_for_working_group",
         "Pending questions for a campus + year + working group (resolved to the plan server-side)."),
        (list_queries_for_campus, "list_queries_for_campus",
         "All pending questions for a campus + academic year, grouped by working group."),
        (get_query, "get_query",
         "Full detail for one pending question by unique_id."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description=desc)
