#
# ONTOLOGY READ / INTROSPECTION
#
# The shared engine behind every "ontology" surface (the MCP ontology tools and the
# frontend ontology browser). It answers three questions in one place:
#
#   introspect_schema()  -> WHAT the ontology IS, read from the neomodel classes
#                           themselves (the structural source of truth). Pure: no DB.
#   assemble_ontology()  -> the schema joined to its DESCRIPTIONS — the UniversalDescriptor
#                           prose and the Principles that `shape` each element. Needs the DB.
#   ontology_health()    -> drift + coverage derived from the same assembly: elements with
#                           no descriptor, descriptors pointing at elements that no longer
#                           exist, ungrounded / inert principles. Needs the DB.
#
# Why introspect the CLASSES and not the live graph: db.labels()/db.relationshipTypes()
# only report what instance data happens to exist, so a node type with zero rows is
# invisible there. The ontology is defined by graph_schema.py, so that is what we read.
#
# Connection / import note: the descriptor + principle reads imported below ultimately pull
# `custom_exceptions` from inside the data_api package. As everywhere in the queries layer,
# the ENTRY POINT must have configured neomodel and warmed up data_api first (Flask
# create_app(), tests' conftest, or the MCP server's ontology bootstrap) — this module adds
# no module-level set_connection()/import-of-data_api of its own.
#
import inspect

from neomodel import StructuredNode, ArrayProperty

from app.database import graph_schema
from app.database.identifiers import (
    make_node_type_handle,
    make_field_handle,
    make_field_value_handle,
    make_rel_type_handle,
)

# neomodel match direction constants -> a stable, JSON-friendly label.
_DIRECTION = {1: "to", -1: "from", 0: "both"}


# --------------------------------------------------------------------------- #
# Structural introspection (pure — no database)                               #
# --------------------------------------------------------------------------- #
def _node_classes():
    """Every StructuredNode subclass DEFINED in graph_schema (not imported into it),
    in source order, keyed by label."""
    out = {}
    for obj in vars(graph_schema).values():
        if (
            inspect.isclass(obj)
            and issubclass(obj, StructuredNode)
            and obj is not StructuredNode
            and obj.__module__ == graph_schema.__name__
        ):
            out[obj.__name__] = obj
    return out


def _summary(cls) -> str:
    """First meaningful line of the class docstring (a fallback when no descriptor exists)."""
    doc = inspect.getdoc(cls) or ""
    for line in doc.splitlines():
        line = line.strip()
        if line:
            return line
    return ""


def _prop_type(prop) -> str:
    """Human type name, e.g. 'String', 'Boolean', 'Array<String>'."""
    name = type(prop).__name__
    if isinstance(prop, ArrayProperty):
        inner = getattr(prop, "base_property", None)
        return f"Array<{type(inner).__name__.replace('Property', '')}>" if inner else "Array"
    return name.replace("Property", "")


def _prop_choices(prop):
    """[{value, label}] for a choice field (incl. array-of-choice), else None."""
    choices = getattr(prop, "choices", None)
    if not choices and isinstance(prop, ArrayProperty):
        inner = getattr(prop, "base_property", None)
        choices = getattr(inner, "choices", None) if inner else None
    if not choices:
        return None
    if isinstance(choices, dict):
        return [{"value": k, "label": v} for k, v in choices.items()]
    # tuple/list form: (value, label) or bare value
    return [{"value": c[0], "label": c[1] if len(c) > 1 else c[0]} for c in choices]


def _rel_target(rel_def) -> str:
    """Target label of a relationship. neomodel keeps it as `_raw_class` (a string);
    the `definition` dict does not carry node_class, so read it off the manager."""
    raw = getattr(rel_def, "_raw_class", None)
    if isinstance(raw, str):
        return raw
    if inspect.isclass(raw):
        return raw.__name__
    return str(raw) if raw is not None else None


def _introspect_class(label, cls) -> dict:
    fields = []
    for name, prop in cls.defined_properties(rels=False, aliases=False).items():
        fields.append({
            "name": name,
            "type": _prop_type(prop),
            "required": bool(getattr(prop, "required", False)),
            "unique": bool(getattr(prop, "unique_index", False)),
            "indexed": bool(getattr(prop, "index", False)),
            "choices": _prop_choices(prop),
            "handle": make_field_handle(label, name),
        })

    relationships = []
    for name, rel_def in cls.defined_properties(properties=False, rels=True, aliases=False).items():
        definition = rel_def.definition or {}
        rel_type = definition.get("relation_type")
        model = definition.get("model")
        relationships.append({
            "name": name,
            "rel_type": rel_type,
            "direction": _DIRECTION.get(definition.get("direction"), "to"),
            "target": _rel_target(rel_def),
            "model": model.__name__ if inspect.isclass(model) else None,
            "handle": make_rel_type_handle(rel_type) if rel_type else None,
        })

    return {
        "label": label,
        "handle": make_node_type_handle(label),
        "summary": _summary(cls),
        "fields": fields,
        "relationships": relationships,
    }


def introspect_schema() -> dict:
    """The structural ontology, read from the neomodel classes. Pure (no DB).

    Returns:
      {
        "node_types": [ {label, handle, summary, fields:[...], relationships:[...]} ],
        "relationship_types": [ {rel_type, handle, usages:[{from,to,model}]} ],
        "field_values": [ {field, value, label, handle} ],   # deduped, global
        "counts": {node_types, fields, relationship_types, field_values},
      }
    """
    node_types = [_introspect_class(label, cls) for label, cls in _node_classes().items()]

    # Distinct relationship types (the canonical rel-type set), each with where it is used
    # (from -> to). The DISTINCT set is taken across BOTH directions so a type declared only
    # as a reverse accessor (RelationshipFrom) still counts; USAGES are taken from the
    # outgoing side only, so each physical edge is listed once (from its declaring class).
    all_rel_types = set()
    rel_usages = {}
    for nt in node_types:
        for r in nt["relationships"]:
            rt = r["rel_type"]
            if not rt:
                continue
            all_rel_types.add(rt)
            if r["direction"] != "from":
                rel_usages.setdefault(rt, []).append(
                    {"from": nt["label"], "to": r["target"], "model": r["model"]}
                )
    relationship_types = [
        {"rel_type": rt, "handle": make_rel_type_handle(rt), "usages": rel_usages.get(rt, [])}
        for rt in sorted(all_rel_types)
    ]

    # Distinct field values across every choice field, keyed (field, value) — this is the
    # grain of a field_value descriptor handle, which is global (not per node type).
    field_values = {}
    for nt in node_types:
        for f in nt["fields"]:
            for c in (f["choices"] or []):
                key = (f["name"], c["value"])
                if key not in field_values:
                    field_values[key] = {
                        "field": f["name"],
                        "value": c["value"],
                        "label": c["label"],
                        "handle": make_field_value_handle(f["name"], c["value"]),
                    }

    return {
        "node_types": node_types,
        "relationship_types": relationship_types,
        "field_values": sorted(field_values.values(), key=lambda v: (v["field"], v["value"])),
        "counts": {
            "node_types": len(node_types),
            "fields": sum(len(nt["fields"]) for nt in node_types),
            "relationship_types": len(relationship_types),
            "field_values": len(field_values),
        },
    }


# --------------------------------------------------------------------------- #
# Descriptions overlay (needs the DB)                                         #
# --------------------------------------------------------------------------- #
def _descriptor_indexes():
    """(by_handle, shaped_by) built from the descriptor + principle reads.

    by_handle : descriptor_handle -> serialized descriptor
    shaped_by : descriptor_handle -> [ {handle, name} ]  (principles that `shape` it)
    """
    # Imported here, not at module top, so introspect_schema() stays import-light and
    # usable before the data_api package is warmed.
    from app.database.queries.descriptors.read import get_all_descriptors
    from app.database.queries.principles.read import get_all_principles

    by_handle = {d["descriptor_handle"]: d for d in get_all_descriptors()}

    shaped_by = {}
    principles = get_all_principles()
    for p in principles:
        for s in p.get("shapes", []):
            shaped_by.setdefault(s["descriptor_handle"], []).append(
                {"handle": p["handle"], "name": p["name"]}
            )
    return by_handle, shaped_by, principles


def _overlay(element, by_handle, shaped_by):
    """Attach `descriptor` (or None) and `shaped_by` (list) onto an element dict in place."""
    handle = element.get("handle")
    element["descriptor"] = by_handle.get(handle)
    element["shaped_by"] = shaped_by.get(handle, [])
    return element


def assemble_ontology() -> dict:
    """The full ontology: structure (introspect_schema) joined to its descriptions.

    Every node type, field, field value, and relationship type carries its
    UniversalDescriptor prose (`descriptor`, or None) and the Principles that shape it
    (`shaped_by`). This is the single payload both the MCP `ati-graph://ontology`
    resource and the frontend ontology browser render.
    """
    schema = introspect_schema()
    by_handle, shaped_by, _principles = _descriptor_indexes()

    for nt in schema["node_types"]:
        _overlay(nt, by_handle, shaped_by)
        for f in nt["fields"]:
            _overlay(f, by_handle, shaped_by)
            for c in (f["choices"] or []):
                c["handle"] = make_field_value_handle(f["name"], c["value"])
                _overlay(c, by_handle, shaped_by)
        for r in nt["relationships"]:
            _overlay(r, by_handle, shaped_by)
    for rt in schema["relationship_types"]:
        _overlay(rt, by_handle, shaped_by)
    for fv in schema["field_values"]:
        _overlay(fv, by_handle, shaped_by)

    return schema


# --------------------------------------------------------------------------- #
# Integrity (needs the DB)                                                     #
# --------------------------------------------------------------------------- #
def _coverage(handles, by_handle):
    total = len(handles)
    described = sum(1 for h in handles if h in by_handle)
    undescribed = sorted(h for h in handles if h not in by_handle)
    return {
        "total": total,
        "described": described,
        "undescribed_count": total - described,
        "coverage_pct": round(100 * described / total, 1) if total else 100.0,
        "undescribed": undescribed,
    }


def ontology_health() -> dict:
    """Drift + coverage — the queryable integrity the schema is designed for.

    The schema's own docstrings note that integrity is "queryable, not enforced at save
    time"; this operationalizes that:

      coverage     : described vs total, per element kind (node_type / field / field_value
                     / rel_type). node_type and rel_type are where full coverage is the goal;
                     field/field_value description is opt-in (salient elements only).
      orphans      : descriptors whose handle points at an element no longer in the schema.
      principles   : ungrounded (derives_from nothing) and inert (shapes nothing) — both are
                     intentionally findable, not save-time errors.
    """
    schema = introspect_schema()
    by_handle, _shaped_by, principles = _descriptor_indexes()

    node_type_handles, field_handles = [], []
    for nt in schema["node_types"]:
        node_type_handles.append(nt["handle"])
        for f in nt["fields"]:
            field_handles.append(f["handle"])
    field_value_handles = [fv["handle"] for fv in schema["field_values"]]
    # Source the rel-type set from the canonical directory so health and introspect agree.
    rel_type_handles = [rt["handle"] for rt in schema["relationship_types"]]

    coverage = {
        "node_type": _coverage(node_type_handles, by_handle),
        "field": _coverage(field_handles, by_handle),
        "field_value": _coverage(field_value_handles, by_handle),
        "rel_type": _coverage(rel_type_handles, by_handle),
    }

    valid_handles = set(node_type_handles) | set(field_handles) | set(field_value_handles) | set(rel_type_handles)
    orphan_descriptors = sorted(
        h for h in by_handle if h not in valid_handles
    )

    ungrounded, inert = [], []
    for p in principles:
        grounded = p.get("grounded_in", {})
        if not grounded.get("governance") and not grounded.get("intellectual_sources"):
            ungrounded.append({"handle": p["handle"], "name": p["name"]})
        if not p.get("shapes"):
            inert.append({"handle": p["handle"], "name": p["name"]})

    total = sum(c["total"] for c in coverage.values())
    described = sum(c["described"] for c in coverage.values())

    return {
        "coverage": coverage,
        "overall_coverage_pct": round(100 * described / total, 1) if total else 100.0,
        "orphan_descriptors": orphan_descriptors,
        "principles": {
            "total": len(principles),
            "ungrounded": ungrounded,
            "inert": inert,
        },
    }
