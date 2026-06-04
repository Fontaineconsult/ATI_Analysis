#
# TOOL DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError

# Reuse the resolvers so assign/unassign stay symmetric (mirrors queries/interfaces/delete.py).
from app.database.queries.tools.update import (
    _resolve_tool,
    _resolve_implementation,
    _TOOL_USAGE_ACCESSOR_BY_TYPE,
)


def _disconnect_rel(rel, target, *, what_for: str) -> bool:
    """Idempotent inverse of update._connect_rel."""
    try:
        if rel.is_connected(target):
            rel.disconnect(target)
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign {what_for}: {e}")


def delete_tool(tool_identifier: str) -> bool:
    """
    Delete a Tool node (true delete). neomodel detaches all relationships: the supplier,
    parent-asset, incoming uses_tool, and documentation edges are removed, but those
    neighbor nodes are left intact.

    Raises NotFoundError if the tool is missing, CrudError on failure.
    """
    tool = _resolve_tool(tool_identifier)
    try:
        tool.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete Tool {tool_identifier!r}: {e}")


def unassign_vendor_from_tool(tool_identifier: str, vendor_name: str) -> bool:
    """Disconnect a Vendor from a Tool's supplied_by. Idempotent."""
    tool = _resolve_tool(tool_identifier)
    try:
        vendor = Vendor.nodes.get(name=vendor_name)
    except Vendor.DoesNotExist:
        raise NotFoundError(f"Vendor {vendor_name!r} not found")
    return _disconnect_rel(tool.supplied_by, vendor, what_for="vendor")


def unassign_asset_from_tool(tool_identifier: str, asset_identifier: str) -> bool:
    """Disconnect a Tool's parent Asset (tool_of_asset). Idempotent."""
    tool = _resolve_tool(tool_identifier)
    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    return _disconnect_rel(tool.parent_asset, asset, what_for="parent asset")


def unassign_usage_from_tool(tool_identifier: str, implementation_type: str, implementation_unique_id: str) -> bool:
    """Disconnect an Implementation that uses this tool (uses_tool). Idempotent. Inverse of assign_usage_to_tool."""
    tool = _resolve_tool(tool_identifier)
    impl = _resolve_implementation(implementation_type, implementation_unique_id)
    accessor = getattr(tool, _TOOL_USAGE_ACCESSOR_BY_TYPE[implementation_type])
    return _disconnect_rel(accessor, impl, what_for=f"{implementation_type} usage")
