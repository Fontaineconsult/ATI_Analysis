#
# COMPONENT DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError

# Reuse the resolvers so assign/unassign stay symmetric (mirrors the assets/interfaces
# delete modules importing from their update module).
from app.database.queries.components.update import (
    _resolve_component,
    _resolve_interface,
    _resolve_guideline,
)


def _disconnect_rel(rel, target, *, what_for: str) -> bool:
    """Idempotent inverse of update._connect_rel."""
    try:
        if rel.is_connected(target):
            rel.disconnect(target)
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign {what_for}: {e}")


def delete_component(component_identifier: str) -> bool:
    """
    Delete a Component node (true delete). neomodel detaches all relationships: the
    part_of edge to its interface, must_satisfy edges to guidelines, and documentation
    edges are removed, but those neighbor nodes are left intact.

    Raises NotFoundError if the component is missing, CrudError on failure.
    """
    component = _resolve_component(component_identifier)
    try:
        component.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete Component {component_identifier!r}: {e}")


def unassign_guideline_from_component(component_identifier: str, guideline_unique_id: str) -> bool:
    """Disconnect a WCAG Guideline from a Component (must_satisfy). Idempotent. Inverse of assign_guideline_to_component."""
    component = _resolve_component(component_identifier)
    guideline = _resolve_guideline(guideline_unique_id)
    return _disconnect_rel(component.must_satisfy, guideline, what_for="WCAG guideline")


def unassign_parent_interface_from_component(component_identifier: str, interface_identifier: str) -> bool:
    """Disconnect a Component's parent Interface (part_of). Idempotent. Inverse of assign_parent_interface_to_component."""
    component = _resolve_component(component_identifier)
    interface = _resolve_interface(interface_identifier)
    return _disconnect_rel(component.part_of, interface, what_for="parent interface")
