"""
Feature: implementation lifecycle writes (write-gated).

The write complement to the implementation discovery queries (``search_implementations``,
``implementations_for_campus``, ``implementations_for_yse`` in the registry). An agent
auditing a campus's implementation inventory against an external source (e.g. its public
ATI website) resolves nodes with the read tools, then uses these to bring the graph in
line with reality:

  create_implementation(type, title, description)          -> new node via the sanctioned add_* path
  update_implementation(type, id, title?, description?)    -> scalar field refresh
  attach_webpage_to_implementation(id, type, url, ...)     -> Webpage (MERGE by url) -[:is_documented_by]->
  link_implementation_to_yse(type, title, year_identifier) -> -[:is_evidence_for]-> YSE
  retire_implementation(type, id, retired, ...)            -> retirement lifecycle set/clear

ASSIGNMENT RULE (mirrors the annotation rule): only create a NEW implementation when the
external source describes a distinct program/process/service the graph does not already
cover — check search_implementations first. Prefer updating an existing node (webpage
attachment, description refresh) over creating a near-duplicate.

Independence (same rule as notes_write / ontology_write): each tool only CALLS sanctioned
queries functions; no CRUD logic lives here, and the queries layer never imports this
package. Queries imports happen INSIDE tool bodies, after ``ensure_app()``, so registration
stays app-free and the warm-up / circular-import rule is honored.

Gating: registers ONLY when ATI_MCP_ALLOW_WRITE is on (mirrors the other *_write features
and the write-mode registry queries). All descriptions are prefixed [WRITE].
"""

from typing import Optional

from ._appbootstrap import ensure_app

NAME = "implementations_write"

# Must match the implementation_classes registry keys in app/database/class_factory.py.
IMPLEMENTATION_TYPES = (
    "Process", "Project", "Procedure", "Service", "Guidance", "Tracking", "InternalPolicy",
)


def _create_dispatch():
    """Type -> sanctioned create function, resolved lazily (post-ensure_app)."""
    from app.database.queries.implementation.create import (
        add_process, add_project, add_procedure, add_service,
        add_guidance, add_tracking, add_internal_policy,
    )
    return {
        "Process": add_process,
        "Project": add_project,
        "Procedure": add_procedure,
        "Service": add_service,
        "Guidance": add_guidance,
        "Tracking": add_tracking,
        "InternalPolicy": add_internal_policy,
    }


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    def create_implementation(
        implementation_type: str,
        title: str,
        description: str,
    ) -> dict:
        """Create a new implementation node (Process/Project/Procedure/Service/Guidance/
        Tracking/InternalPolicy) via the sanctioned create path. Check
        search_implementations FIRST — titles are unique-indexed and near-duplicates are
        worse than updates. Returns the new node's unique_id for follow-up linking."""
        ensure_app()
        if implementation_type not in IMPLEMENTATION_TYPES:
            raise ValueError(
                f"implementation_type must be one of {IMPLEMENTATION_TYPES}, got {implementation_type!r}"
            )
        from app.database.class_factory import implementation_classes
        _create_dispatch()[implementation_type](title=title, description=description)
        node = implementation_classes[implementation_type].nodes.get(title=title)
        return {"ok": True, "type": implementation_type, "title": title, "unique_id": node.unique_id}

    def update_implementation(
        implementation_type: str,
        implementation_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
    ) -> dict:
        """Update an implementation's title and/or description (pass only what changes).
        `implementation_id`/`implementation_type` come from search_implementations or
        implementations_for_campus. Titles are unique-indexed."""
        ensure_app()
        from app.database.queries.implementation.update import update_implementation_fields
        result = update_implementation_fields(
            implementation_type=implementation_type,
            implementation_unique_id=implementation_id,
            title=title,
            description=description,
        )
        return {"ok": True, "node": result}

    def attach_webpage_to_implementation(
        implementation_id: str,
        implementation_type: str,
        url: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        academic_year: Optional[str] = None,
        include_in_year: bool = True,
    ) -> dict:
        """Attach a supporting webpage to an implementation (is_documented_by). The
        Webpage node is matched by url if it already exists, created otherwise; the
        attachment is idempotent. `academic_year` optionally year-scopes the link
        (DocumentedByRel included_in_years); omit for a neutral, unscoped attachment."""
        ensure_app()
        from app.database.queries.documentation.create import add_webpage
        add_webpage(
            url=url,
            name=name or url,
            no_longer_exists=False,
            depreciated=False,
            depreciated_date=None,
            description=description or "",
            include_in_report=True,
            implementation_id=implementation_id,
            implementation_type=implementation_type,
            academic_year=academic_year,
            include_in_year=include_in_year,
        )
        return {
            "ok": True,
            "url": url,
            "attached_to": {"implementation_id": implementation_id,
                            "implementation_type": implementation_type},
        }

    def link_implementation_to_yse(
        implementation_type: str,
        implementation_title: str,
        year_identifier: str,
        strength: Optional[int] = None,
    ) -> dict:
        """Link an implementation as evidence for a YSE (is_evidence_for).
        `year_identifier` comes from yse_catalog_for_year (e.g. '2025-2026-2.6-web-csueb');
        the implementation is addressed by TITLE (matching the sanctioned function).
        Optional `strength` 0-3 rates the evidence. Fails if already linked or retired."""
        ensure_app()
        from app.database.queries.evidence.update import (
            assign_implementation_to_year_success_indicator,
        )
        assign_implementation_to_year_success_indicator(
            year_success_identifier=year_identifier,
            implementation_type=implementation_type,
            implementation_title=implementation_title,
            strength=strength,
        )
        return {"ok": True, "implementation": implementation_title, "yse": year_identifier}

    def retire_implementation(
        implementation_type: str,
        implementation_id: str,
        retired: bool = True,
        retired_date: Optional[str] = None,
        retired_note: Optional[str] = None,
    ) -> dict:
        """Set (retired=True, date defaults to today, optional note) or clear
        (retired=False) an implementation's retirement lifecycle. Historical
        is_evidence_for links are never touched; UIs badge and hide retired items."""
        ensure_app()
        from app.database.queries.implementation.update import (
            retire_implementation as _retire,
        )
        result = _retire(
            implementation_type=implementation_type,
            implementation_unique_id=implementation_id,
            retired=retired,
            retired_date=retired_date,
            retired_note=retired_note,
        )
        return {"ok": True, "node": result}

    tools = [
        (create_implementation, "create_implementation",
         "Create a new implementation node (7 types) via the sanctioned create path. Check "
         "search_implementations first — prefer updating an existing node over a near-duplicate."),
        (update_implementation, "update_implementation",
         "Update an implementation's title and/or description by unique_id + type."),
        (attach_webpage_to_implementation, "attach_webpage_to_implementation",
         "Attach a supporting webpage (matched/created by url) to an implementation via "
         "is_documented_by. Idempotent."),
        (link_implementation_to_yse, "link_implementation_to_yse",
         "Link an implementation (by title + type) as is_evidence_for a YSE year_identifier."),
        (retire_implementation, "retire_implementation",
         "Set or clear an implementation's retirement lifecycle (retired flag, date, note)."),
    ]
    for fn, tool_name, desc in tools:
        mcp.add_tool(fn, name=tool_name, description="[WRITE] " + desc)
