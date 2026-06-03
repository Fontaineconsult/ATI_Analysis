#
# TOOL UPDATE QUERIES
#
from app.database.graph_schema import *
from app.database.class_factory import implementation_classes
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


# Implementation type -> the Tool reverse-accessor that writes a
# (implementation)-[:uses_tool]->(tool) edge. Only these four kinds use tools.
_TOOL_USAGE_ACCESSOR_BY_TYPE = {
    "Process":   "used_by_processes",
    "Project":   "used_by_projects",
    "Procedure": "used_by_procedures",
    "Service":   "used_by_services",
}


def _resolve_tool(tool_identifier: str):
    try:
        return Tool.nodes.get(tool_identifier=tool_identifier)
    except Tool.DoesNotExist:
        raise NotFoundError(f"Tool {tool_identifier!r} not found")


def _resolve_implementation(implementation_type: str, implementation_unique_id: str):
    """Resolve a tool-using implementation by (type, unique_id). Mirrors the interface resolver."""
    if implementation_type not in _TOOL_USAGE_ACCESSOR_BY_TYPE:
        raise ValidationError(
            f"implementation_type must be one of {list(_TOOL_USAGE_ACCESSOR_BY_TYPE.keys())}; "
            f"got {implementation_type!r}"
        )
    cls = implementation_classes[implementation_type]
    try:
        return cls.nodes.get(unique_id=implementation_unique_id)
    except cls.DoesNotExist:
        raise NotFoundError(f"{implementation_type} {implementation_unique_id!r} not found")


def _connect_rel(rel, target, *, what_for: str) -> bool:
    """Idempotently connect `target` via the bound relationship `rel`."""
    try:
        if not rel.is_connected(target):
            rel.connect(target)
        return True
    except Exception as e:
        raise CrudError(f"Failed to assign {what_for}: {e}")


def update_tool(tool_identifier: str, data: dict) -> dict:
    """
    Patch a Tool's descriptive fields. Only keys present in `data` are touched.

    Mutable: title, description. Immutable: tool_identifier (the stable composite key;
    a new identity means delete + re-create).

    Raises NotFoundError if missing, CrudError on save failure.
    """
    tool = _resolve_tool(tool_identifier)
    try:
        for field in ("title", "description"):
            if field in data:
                setattr(tool, field, data[field])
        tool.save()
        return tool.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update Tool {tool_identifier!r}: {e}")


def assign_vendor_to_tool(tool_identifier: str, vendor_name: str) -> bool:
    """Connect a Vendor as the tool's supplier (supplied_by). Idempotent."""
    tool = _resolve_tool(tool_identifier)
    try:
        vendor = Vendor.nodes.get(name=vendor_name)
    except Vendor.DoesNotExist:
        raise NotFoundError(f"Vendor {vendor_name!r} not found")
    return _connect_rel(tool.supplied_by, vendor, what_for="vendor")


def assign_asset_to_tool(tool_identifier: str, asset_identifier: str) -> bool:
    """
    Set the tool's parent Asset (tool_of_asset). parent_asset is ZeroOrOne, so this
    REPLACES any existing parent (disconnect-then-connect) rather than erroring.
    Idempotent when the same asset is already set.

    Raises NotFoundError if the tool or asset is missing, CrudError on failure.
    """
    tool = _resolve_tool(tool_identifier)
    try:
        asset = Asset.nodes.get(asset_identifier=asset_identifier)
    except Asset.DoesNotExist:
        raise NotFoundError(f"Asset {asset_identifier!r} not found")
    try:
        existing = tool.parent_asset.single()
        if existing and existing.asset_identifier != asset_identifier:
            tool.parent_asset.disconnect(existing)
        if not tool.parent_asset.is_connected(asset):
            tool.parent_asset.connect(asset)
        return True
    except Exception as e:
        raise CrudError(f"Failed to assign parent asset: {e}")


def assign_usage_to_tool(tool_identifier: str, implementation_type: str, implementation_unique_id: str) -> bool:
    """
    Connect an Implementation (Process/Project/Procedure/Service) that USES this tool,
    creating (implementation)-[:uses_tool]->(tool) from the Tool side. Idempotent.

    Raises ValidationError on a non-using type, NotFoundError if the tool or
    implementation is missing, CrudError on failure.
    """
    tool = _resolve_tool(tool_identifier)
    impl = _resolve_implementation(implementation_type, implementation_unique_id)
    accessor = getattr(tool, _TOOL_USAGE_ACCESSOR_BY_TYPE[implementation_type])
    return _connect_rel(accessor, impl, what_for=f"{implementation_type} usage")
