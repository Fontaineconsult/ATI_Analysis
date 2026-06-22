"""
Feature: descriptive-layer EDITS as MCP tools (write-gated).

The agent-facing complement to the read feature: author/edit the ontology's DESCRIPTIONS —
UniversalDescriptor prose and the Principle meta-scaffold — so it can close the coverage
gaps `ontology_health` surfaces. Structural schema (node types/fields/vocab in graph_schema.py
/ data_config.py) is NOT editable here; that is source code.

Independence (deliberate): every tool here just CALLS the sanctioned queries-layer functions
(`create_descriptor`, `update_descriptor`, `create_principle`, `attach_shape`, ...) — the same
ones the Flask endpoints call. No CRUD logic lives in this package, and the queries layer never
imports anything from here. The dependency is strictly one-way (MCP → queries). The CRUD
functions are imported INSIDE each tool body, after `ensure_app()`, so registration stays
app-free and the warm-up/circular-import rule is honored.

Gating: these tools register ONLY when ATI_MCP_ALLOW_WRITE is on (mirrors how write-mode
registry queries are gated). All descriptions are prefixed [WRITE].
"""

from typing import Optional

from ._appbootstrap import ensure_app

NAME = "ontology_write"


def register(mcp, ctx) -> None:
    # Off by default: no write tools exist unless the operator opted in.
    if not ctx.settings.allow_write:
        return

    def author_descriptor(
        descriptor_kind: str,
        target_label: Optional[str] = None,
        target_field: Optional[str] = None,
        target_value: Optional[str] = None,
        title: Optional[str] = None,
        description_short: Optional[str] = None,
        description_full: Optional[str] = None,
        include_in_report: bool = False,
    ) -> dict:
        """Create a UniversalDescriptor (node_type | field | field_value | rel_type). The handle
        is built deterministically from kind + target_* (see describe the gap via ontology_health)."""
        ensure_app()
        from app.database.queries.descriptors.create import create_descriptor
        node = create_descriptor(
            descriptor_kind=descriptor_kind,
            target_label=target_label,
            target_field=target_field,
            target_value=target_value,
            title=title,
            description_short=description_short,
            description_full=description_full,
            include_in_report=include_in_report,
        )
        return node.serialize()

    def update_descriptor(
        descriptor_handle: str,
        title: Optional[str] = None,
        description_short: Optional[str] = None,
        description_full: Optional[str] = None,
        include_in_report: Optional[bool] = None,
    ) -> dict:
        """Patch an existing descriptor's prose by handle. Identity (kind/target) is immutable;
        only title / description_short / description_full / include_in_report can change."""
        ensure_app()
        from app.database.queries.descriptors.update import update_descriptor as _update
        data = {}
        if title is not None:
            data["title"] = title
        if description_short is not None:
            data["description_short"] = description_short
        if description_full is not None:
            data["description_full"] = description_full
        if include_in_report is not None:
            data["include_in_report"] = include_in_report
        if not data:
            raise ValueError(
                "nothing to update: provide title / description_short / description_full / include_in_report"
            )
        return _update(descriptor_handle, data)

    def author_principle(
        handle: str,
        name: str,
        description_short: Optional[str] = None,
        description_full: Optional[str] = None,
    ) -> dict:
        """Create a Principle (e.g. handle 'principle:closest-to-capacity'). Grounding and shapes
        edges are attached separately (attach_principle_shape)."""
        ensure_app()
        from app.database.queries.principles.create import create_principle
        node = create_principle({
            "handle": handle,
            "name": name,
            "description_short": description_short,
            "description_full": description_full,
        })
        return node.serialize()

    def attach_principle_shape(principle_handle: str, descriptor_handle: str) -> dict:
        """Link a Principle to the ontology element (UniversalDescriptor) it shapes — wires an
        otherwise inert principle to what it justifies. Returns the principle with its shapes."""
        ensure_app()
        from app.database.queries.principles.update import attach_shape
        return attach_shape(principle_handle, descriptor_handle)

    def detach_principle_shape(principle_handle: str, descriptor_handle: str) -> dict:
        """Remove a Principle's `shapes` edge to a descriptor."""
        ensure_app()
        from app.database.queries.principles.update import detach_shape
        return detach_shape(principle_handle, descriptor_handle)

    tools = [
        (author_descriptor, "author_descriptor",
         "Create a UniversalDescriptor for a node type / field / field value / relationship type."),
        (update_descriptor, "update_descriptor",
         "Edit an existing descriptor's prose (title / short / full / include_in_report) by handle."),
        (author_principle, "author_principle",
         "Create a Principle (conceptual commitment) in the meta-scaffold."),
        (attach_principle_shape, "attach_principle_shape",
         "Link a Principle to a descriptor it shapes (wire an inert principle)."),
        (detach_principle_shape, "detach_principle_shape",
         "Unlink a Principle's shapes edge to a descriptor."),
    ]
    for fn, name, desc in tools:
        mcp.add_tool(fn, name=name, description="[WRITE] " + desc)
