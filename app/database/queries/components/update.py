#
# COMPONENT UPDATE QUERIES
#
from app.database.graph_schema import *
from app.data_config import component_kinds
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# title + parent are baked into component_identifier, so they are immutable — changing
# either is a different component (delete + re-create). Mirrors the interface/asset rule.
_COMPONENT_IDENTITY_FIELDS = ("title", "interface_identifier")


def _resolve_component(component_identifier: str):
    try:
        return Component.nodes.get(component_identifier=component_identifier)
    except Component.DoesNotExist:
        raise NotFoundError(f"Component {component_identifier!r} not found")


def _resolve_interface(interface_identifier: str):
    try:
        return Interface.nodes.get(interface_identifier=interface_identifier)
    except Interface.DoesNotExist:
        raise NotFoundError(f"Interface {interface_identifier!r} not found")


def _resolve_guideline(guideline_unique_id: str):
    try:
        return Guideline.nodes.get(unique_id=guideline_unique_id)
    except Guideline.DoesNotExist:
        raise NotFoundError(f"Guideline {guideline_unique_id!r} not found")


def _connect_rel(rel, target, *, what_for: str) -> bool:
    """Idempotently connect `target` via the bound relationship `rel`."""
    try:
        if not rel.is_connected(target):
            rel.connect(target)
        return True
    except Exception as e:
        raise CrudError(f"Failed to assign {what_for}: {e}")


def update_component(component_identifier: str, data: dict) -> dict:
    """
    Patch a Component's descriptive fields. Only keys present in `data` are touched.

    Mutable: description, component_kind.
    Immutable: title + parent interface (and component_identifier) — the composite key.
    Passing an identity field is a ValidationError.

    Raises NotFoundError if missing, ValidationError on an identity-field change or a bad
    component_kind, CrudError on save failure.
    """
    component = _resolve_component(component_identifier)

    attempted_identity = [f for f in _COMPONENT_IDENTITY_FIELDS if f in data]
    if attempted_identity:
        raise ValidationError(
            f"Identity fields {attempted_identity} are immutable; delete + re-create to change them"
        )

    if "component_kind" in data and data["component_kind"] is not None and data["component_kind"] not in component_kinds:
        raise ValidationError(
            f"component_kind must be one of {list(component_kinds.keys())}; got {data['component_kind']!r}"
        )

    try:
        for field in ("description", "component_kind"):
            if field in data:
                setattr(component, field, data[field])
        component.save()
        return component.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update Component {component_identifier!r}: {e}")


def assign_guideline_to_component(component_identifier: str, guideline_unique_id: str) -> bool:
    """
    Connect a WCAG Guideline the component must satisfy (must_satisfy). Idempotent.
    Raises NotFoundError if the component or guideline is missing, CrudError on failure.
    """
    component = _resolve_component(component_identifier)
    guideline = _resolve_guideline(guideline_unique_id)
    return _connect_rel(component.must_satisfy, guideline, what_for="WCAG guideline")


def assign_parent_interface_to_component(component_identifier: str, interface_identifier: str) -> bool:
    """
    Set the component's parent Interface (part_of). ZeroOrOne, so any existing parent is
    disconnected first (reconnect semantics). Idempotent if the same parent is given.

    NOTE: part_of is an identity coordinate, so re-parenting does NOT rebuild
    component_identifier — the id keeps its original parent prefix. Re-parent only when the
    original attachment was wrong; for a genuine identity change, delete + re-create.

    Raises NotFoundError if the component or interface is missing, CrudError on failure.
    """
    component = _resolve_component(component_identifier)
    interface = _resolve_interface(interface_identifier)
    try:
        if component.part_of.is_connected(interface):
            return True
        existing = component.part_of.single()
        if existing is not None:
            component.part_of.disconnect(existing)
        component.part_of.connect(interface)
        return True
    except Exception as e:
        raise CrudError(f"Failed to assign parent interface: {e}")
