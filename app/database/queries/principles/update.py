#
# PRINCIPLE UPDATE QUERIES (field patch + grounding/shapes edge ops)
#
from neomodel import db

from app.database.graph_schema import UniversalDescriptor, IntellectualSource
from app.database.queries.governance.read import GOVERNANCE_TYPE_TO_CLASS
from app.database.queries.principles.read import _resolve, get_principle
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# --- field patch -------------------------------------------------------------------------

def update_principle(handle, data: dict) -> dict:
    """Patch name / description_short / description_full. `handle` is identity (immutable)."""
    node = _resolve(handle)
    if "name" in data:
        new_name = (data["name"] or "").strip()
        if not new_name:
            raise ValidationError("name cannot be empty")
        node.name = new_name
    for f in ("description_short", "description_full"):
        if f in data:
            setattr(node, f, (data[f] or None))
    try:
        node.save()
    except Exception as e:
        raise CrudError(f"Failed to update Principle {handle!r}: {e}")
    return get_principle(handle)


# --- grounding (derives_from): heterogeneous targets, managed via Cypher by unique_id ------

def _resolve_governance(governance_type, unique_id):
    cls = GOVERNANCE_TYPE_TO_CLASS.get(governance_type)
    if cls is None:
        raise ValidationError(f"Unknown governance type {governance_type!r}")
    node = cls.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"{cls.__name__} {unique_id!r} not found")
    return node


def _resolve_source(unique_id):
    node = IntellectualSource.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"IntellectualSource {unique_id!r} not found")
    return node


def _set_derives_from(principle_handle, target_unique_id, connect: bool):
    # Edge keyed on the globally-unique unique_id, so one statement covers any target label.
    if connect:
        db.cypher_query(
            "MATCH (p:Principle {handle:$h}) MATCH (t {unique_id:$tid}) "
            "MERGE (p)-[:derives_from]->(t)",
            {"h": principle_handle, "tid": target_unique_id},
        )
    else:
        db.cypher_query(
            "MATCH (p:Principle {handle:$h})-[r:derives_from]->(t {unique_id:$tid}) DELETE r",
            {"h": principle_handle, "tid": target_unique_id},
        )


def attach_governance_grounding(principle_handle, governance_type, governance_unique_id) -> dict:
    p = _resolve(principle_handle)
    g = _resolve_governance(governance_type, governance_unique_id)
    try:
        _set_derives_from(p.handle, g.unique_id, True)
    except Exception as e:
        raise CrudError(f"Failed to attach grounding: {e}")
    return get_principle(principle_handle)


def detach_governance_grounding(principle_handle, governance_type, governance_unique_id) -> dict:
    p = _resolve(principle_handle)
    g = _resolve_governance(governance_type, governance_unique_id)
    try:
        _set_derives_from(p.handle, g.unique_id, False)
    except Exception as e:
        raise CrudError(f"Failed to detach grounding: {e}")
    return get_principle(principle_handle)


def attach_source_grounding(principle_handle, source_unique_id) -> dict:
    p = _resolve(principle_handle)
    s = _resolve_source(source_unique_id)
    try:
        _set_derives_from(p.handle, s.unique_id, True)
    except Exception as e:
        raise CrudError(f"Failed to attach grounding: {e}")
    return get_principle(principle_handle)


def detach_source_grounding(principle_handle, source_unique_id) -> dict:
    p = _resolve(principle_handle)
    s = _resolve_source(source_unique_id)
    try:
        _set_derives_from(p.handle, s.unique_id, False)
    except Exception as e:
        raise CrudError(f"Failed to detach grounding: {e}")
    return get_principle(principle_handle)


# --- shapes (Principle -> UniversalDescriptor): the descriptor IS the ontology-element anchor.
# Single target class, so a typed neomodel relationship is clean. Type-level edge only.

def _resolve_descriptor(descriptor_handle):
    node = UniversalDescriptor.nodes.get_or_none(descriptor_handle=descriptor_handle)
    if node is None:
        raise NotFoundError(f"UniversalDescriptor {descriptor_handle!r} not found")
    return node


def attach_shape(principle_handle, descriptor_handle) -> dict:
    p = _resolve(principle_handle)
    d = _resolve_descriptor(descriptor_handle)
    try:
        if not p.shapes.is_connected(d):
            p.shapes.connect(d)
    except Exception as ex:
        raise CrudError(f"Failed to attach shape: {ex}")
    return get_principle(principle_handle)


def detach_shape(principle_handle, descriptor_handle) -> dict:
    p = _resolve(principle_handle)
    d = _resolve_descriptor(descriptor_handle)
    try:
        if p.shapes.is_connected(d):
            p.shapes.disconnect(d)
    except Exception as ex:
        raise CrudError(f"Failed to detach shape: {ex}")
    return get_principle(principle_handle)
