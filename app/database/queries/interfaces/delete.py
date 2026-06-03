#
# INTERFACE DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError

# Reuse the resolvers so assign/unassign stay symmetric (mirrors
# queries/assets/delete.py importing from queries/assets/update.py).
from app.database.queries.interfaces.update import (
    _resolve_interface,
    _resolve_implementation,
    _REMEDIATION_ACCESSOR_BY_TYPE,
)


def _disconnect_rel(rel, target, *, what_for: str) -> bool:
    """Idempotent inverse of update._connect_rel."""
    try:
        if rel.is_connected(target):
            rel.disconnect(target)
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign {what_for}: {e}")


def delete_interface(interface_identifier: str) -> bool:
    """
    Delete an Interface node (true delete). neomodel detaches all relationships:
    the presented_by edge to any backing asset, incoming remediates edges, and
    documentation edges are removed, but those neighbor nodes are left intact.

    Raises NotFoundError if the interface is missing, CrudError on failure.
    """
    interface = _resolve_interface(interface_identifier)
    try:
        interface.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete Interface {interface_identifier!r}: {e}")


def unassign_asset_from_interface(interface_identifier: str, asset_identifier: str) -> bool:
    """Disconnect a backing Asset from an Interface (presented_by). Idempotent. Inverse of assign_asset_to_interface."""
    interface = _resolve_interface(interface_identifier)
    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    return _disconnect_rel(interface.presented_by, asset, what_for="backing asset")


def unassign_remediation_from_interface(interface_identifier: str, implementation_type: str, implementation_unique_id: str) -> bool:
    """
    Disconnect a remediating Implementation from an Interface (remediates_interface).
    Idempotent. Inverse of assign_remediation_to_interface.

    Raises ValidationError on a non-remediating type, NotFoundError if the interface or
    implementation is missing, CrudError on failure.
    """
    interface = _resolve_interface(interface_identifier)
    impl = _resolve_implementation(implementation_type, implementation_unique_id)
    accessor = getattr(interface, _REMEDIATION_ACCESSOR_BY_TYPE[implementation_type])
    return _disconnect_rel(accessor, impl, what_for=f"{implementation_type} remediation")
