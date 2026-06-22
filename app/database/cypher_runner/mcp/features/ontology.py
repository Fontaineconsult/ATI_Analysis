"""
Feature: the ontology layer as MCP tools + a resource.

Where the registry tools expose INSTANCE data (run a curated Cypher query), this
feature exposes the ONTOLOGY itself — the node types, fields, field values, and
relationship types of the schema, joined to their UniversalDescriptor prose and the
Principles that justify them, plus a queryable integrity report. It reuses the shared
engine in ``app.database.queries.ontology.read`` so the agent and the frontend ontology
browser see exactly the same assembled ontology.

  ontology_overview()        -> the schema directory (counts + node types). No DB.
  describe_node_type(label)  -> one node type, with its fields/relationships + descriptions.
  ontology_health()          -> drift + coverage (undescribed elements, orphan descriptors,
                                ungrounded / inert principles).
  resource ati-graph://ontology -> the full assembled ontology as JSON.

Bootstrapping (the one place the MCP server reaches into the app): the description overlay
and health report go through the neomodel-backed queries layer, so the first DB-backed call
configures neomodel (``set_connection``) and warms up ``data_api`` (the established rule for
anything importing the queries layer). This is LAZY and ISOLATED — ``ontology_overview`` and
tool registration need neither, and if the app import ever fails, build_server logs-and-skips
this feature while the Cypher registry tools keep working.
"""

import json

from ._appbootstrap import ensure_app as _ensure_app

NAME = "ontology"


def register(mcp, ctx) -> None:
    # Engine import is DB-free (reflects the neomodel classes); safe at registration so the
    # tools list even when no graph is connected.
    from app.database.queries.ontology.read import (
        introspect_schema,
        assemble_ontology,
        ontology_health as _ontology_health,
    )

    def ontology_overview() -> dict:
        """The ontology directory: element counts plus every node type with a one-line
        summary and its field/relationship counts. Pure structure — no database needed."""
        schema = introspect_schema()
        return {
            "counts": schema["counts"],
            "node_types": [
                {
                    "label": nt["label"],
                    "summary": nt["summary"],
                    "fields": len(nt["fields"]),
                    "relationships": len(nt["relationships"]),
                }
                for nt in schema["node_types"]
            ],
        }

    def describe_node_type(label: str) -> dict:
        """One node type in full: its fields (with types, choices, and descriptor prose),
        its relationships, the node-type description, and the Principles that shape it."""
        _ensure_app()
        ontology = assemble_ontology()
        match = next((nt for nt in ontology["node_types"] if nt["label"] == label), None)
        if match is None:
            known = ", ".join(sorted(nt["label"] for nt in ontology["node_types"]))
            raise ValueError(f"unknown node type {label!r}. Known: {known}")
        return match

    def ontology_health() -> dict:
        """Queryable integrity of the ontology: description coverage per element kind,
        descriptors orphaned from the schema, and ungrounded / inert principles."""
        _ensure_app()
        return _ontology_health()

    mcp.add_tool(
        ontology_overview,
        name="ontology_overview",
        description="Directory of the ATI ontology: node types with field/relationship counts (no DB).",
    )
    mcp.add_tool(
        describe_node_type,
        name="describe_node_type",
        description="Full detail for one node type: fields, relationships, descriptions, and shaping principles.",
    )
    mcp.add_tool(
        ontology_health,
        name="ontology_health",
        description="Ontology integrity: description coverage, orphan descriptors, ungrounded/inert principles.",
    )

    @mcp.resource(
        "ati-graph://ontology",
        name="ATI ontology (assembled)",
        description="The full ATI ontology — node types, fields, field values, relationship types — "
                    "joined to their descriptions and the principles that shape them, as JSON.",
        mime_type="application/json",
    )
    def ontology_resource() -> str:
        _ensure_app()
        return json.dumps(assemble_ontology(), default=str)
