"""
Feature: Query writes — create / update / settle / link / delete pending questions (write-gated).

The write complement to the ``query`` read tools. Each tool only CALLS the sanctioned functions
in ``app.database.queries.query.*`` — the very ones the Flask ``/queries`` endpoints and the React
QueriesPanel use — so no CRUD logic lives here. Functions are imported INSIDE the tool body after
``ensure_app()`` (warm-up / circular-import rule). Registers ONLY when ATI_MCP_ALLOW_WRITE is on
(mirrors ontology_write / notes_write); every description is prefixed [WRITE].

A Query anchors to a WorkingGroupPlan, which encodes campus + academic year + working group. For
``create_query``, identify the anchor with either ``working_group_plan_identifier`` or the
(``campus_abbrev``, ``year_name``, ``working_group``) triple. The plan must already exist for that
campus + year (created with the campus plan) — otherwise create raises NotFoundError.
"""

from typing import Optional

from ._appbootstrap import ensure_app

NAME = "query_write"


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    def create_query(
        question: str,
        working_group_plan_identifier: Optional[str] = None,
        campus_abbrev: Optional[str] = None,
        year_name: Optional[str] = None,
        working_group: Optional[str] = None,
        category: Optional[str] = None,
        detail: Optional[str] = None,
        raised_by_unique_id: Optional[str] = None,
    ) -> dict:
        """Create a pending question anchored to a WorkingGroupPlan. Identify the anchor with
        `working_group_plan_identifier` ('<year>-<campus>-<wg>') OR the (campus_abbrev, year_name,
        working_group) triple. `category` (optional) is one of policy_decision / resource_request /
        technical_clarification / risk_compliance / information_gap. Returns the created query."""
        ensure_app()
        from app.database.queries.query.create import create_query as _create
        from app.database.queries.query.read import get_query as _get
        created = _create(
            question=question,
            working_group_plan_identifier=working_group_plan_identifier,
            campus_abbrev=campus_abbrev,
            year_name=year_name,
            working_group=working_group,
            category=category,
            detail=detail,
            raised_by_unique_id=raised_by_unique_id,
        )
        return _get(created.unique_id)

    def update_query(
        unique_id: str,
        question: Optional[str] = None,
        detail: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
    ) -> dict:
        """Patch a pending question. Only the arguments you actually pass are changed. `status` is
        one of open / in_progress / settled; `category` as in create_query. Returns the refreshed query."""
        ensure_app()
        from app.database.queries.query.update import update_query as _update
        kwargs = {}
        if question is not None:
            kwargs["question"] = question
        if detail is not None:
            kwargs["detail"] = detail
        if category is not None:
            kwargs["category"] = category
        if status is not None:
            kwargs["status"] = status
        return _update(unique_id, **kwargs)

    def settle_query(unique_id: str, answer: str, settled_by_unique_id: Optional[str] = None) -> dict:
        """Record the answer and mark a pending question settled (status=settled, date_settled=today,
        optional settled-by Person). Returns the refreshed query."""
        ensure_app()
        from app.database.queries.query.update import settle_query as _settle
        return _settle(unique_id, answer, settled_by_unique_id)

    def attach_evidence_to_query(unique_id: str, yse_identifier: str) -> dict:
        """Link a pending question to a YearSuccessEvidence it addresses (by year_identifier,
        e.g. '2025-2026-1.1-web-sfsu'). Idempotent. Returns the refreshed query."""
        ensure_app()
        from app.database.queries.query.update import attach_evidence as _attach
        return _attach(unique_id, yse_identifier)

    def detach_evidence_from_query(unique_id: str, yse_identifier: str) -> dict:
        """Remove a pending question's link to a YearSuccessEvidence. Idempotent. Returns the
        refreshed query."""
        ensure_app()
        from app.database.queries.query.update import detach_evidence as _detach
        return _detach(unique_id, yse_identifier)

    def add_query_note(unique_id: str, content: str, created_by_unique_id: Optional[str] = None) -> dict:
        """Attach a note to a pending question. Returns the refreshed query."""
        ensure_app()
        from app.database.queries.query.update import add_query_note as _add_note
        return _add_note(unique_id, content, created_by_unique_id)

    def delete_query(unique_id: str) -> dict:
        """Delete a pending question and its private notes (shared reference nodes are left intact).
        Returns {ok, deleted}."""
        ensure_app()
        from app.database.queries.query.delete import delete_query as _delete
        _delete(unique_id)
        return {"ok": True, "deleted": unique_id}

    tools = [
        (create_query, "create_query",
         "Create a pending question under a WorkingGroupPlan (by identifier or campus+year+working_group)."),
        (update_query, "update_query",
         "Patch a pending question's question/detail/category/status (only the fields you pass)."),
        (settle_query, "settle_query",
         "Record the answer and mark a pending question settled."),
        (attach_evidence_to_query, "attach_evidence_to_query",
         "Link a pending question to a YearSuccessEvidence by year_identifier."),
        (detach_evidence_from_query, "detach_evidence_from_query",
         "Unlink a pending question from a YearSuccessEvidence."),
        (add_query_note, "add_query_note",
         "Attach a note to a pending question."),
        (delete_query, "delete_query",
         "Delete a pending question and its private notes."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description="[WRITE] " + desc)
