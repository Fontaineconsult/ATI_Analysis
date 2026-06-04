#
# TOOL READ QUERIES
#
from neomodel import db

from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


# Implementations that USE a tool, by reverse accessor (reverse of Implementation.uses_tool).
# Accessor names are identical on Tool and Asset (both carry used_*_by_* on the shared
# `uses_tool` rel-type); anchoring on a specific Tool node keeps the two separate.
_TOOL_USED_BY_ACCESSORS = (
    ("Process",   "used_by_processes"),
    ("Project",   "used_by_projects"),
    ("Procedure", "used_by_procedures"),
    ("Service",   "used_by_services"),
)


def _used_by_list(tool) -> list:
    """All implementations that use this tool (via uses_tool), tagged by type."""
    out = []
    for label, accessor in _TOOL_USED_BY_ACCESSORS:
        for impl in getattr(tool, accessor).all():
            out.append({"type": label, "title": impl.title, "unique_id": impl.unique_id})
    return out


def _serialize_tool_detail(tool) -> dict:
    """
    Full tool projection: identity + supplier + optional parent asset(s) + the
    implementations that use it + documentation. `parent_assets` is a list — a tool may
    map to several stewarded assets.
    """
    data = tool.serialize()
    data.update({
        "supplied_by": [{"unique_id": v.unique_id, "name": v.name} for v in tool.supplied_by.all()],
        "parent_assets": [a.serialize() for a in tool.parent_asset.all()],
        "used_by": _used_by_list(tool),
        "described_by": [d.serialize() for d in tool.described_by.all()],
        "notes": [n.serialize() for n in tool.notes.all()],
    })
    return data


def get_all_tools() -> list:
    """All Tool nodes as lightweight summaries, ordered by identifier."""
    return [t.serialize() for t in Tool.nodes.order_by("tool_identifier").all()]


def get_tool(tool_identifier: str) -> dict:
    """Full detail for one Tool. Raises NotFoundError if it doesn't exist."""
    try:
        tool = Tool.nodes.get(tool_identifier=tool_identifier)
    except Tool.DoesNotExist:
        raise NotFoundError(f"Tool {tool_identifier!r} not found")
    return _serialize_tool_detail(tool)


_TOOLS_FOR_ASSET_QUERY = """
    MATCH (t:Tool)-[:tool_of_asset]->(:Asset {asset_identifier: $asset_identifier})
    RETURN t
    ORDER BY t.tool_identifier
"""


def get_tools_for_asset(asset_identifier: str) -> list:
    """All tools whose parent asset is the given asset (summaries)."""
    results, _ = db.cypher_query(_TOOLS_FOR_ASSET_QUERY, {"asset_identifier": asset_identifier})
    return [Tool.inflate(row[0]).serialize() for row in results]
