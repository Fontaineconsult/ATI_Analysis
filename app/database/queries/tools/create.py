#
# TOOL CREATE QUERIES
#
import re

from app.database.graph_schema import *
from app.database.identifiers import make_tool_identifier
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)


def _slugify(value: str) -> str:
    """
    Normalize free text into the hyphenated slug form used inside tool_identifiers
    (lowercase, non-alphanumeric runs collapsed to a single '-', no leading/trailing
    '-'). 'Pope Tech' -> 'pope-tech'. Mirrors the helper in queries/interfaces/create.py.
    """
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").strip().lower())
    return slug.strip("-")


def create_tool(
    title: str,
    description: str = None,
    supplied_by: str = None,
    parent_asset: str = None,
) -> Tool:
    """
    Create a Tool (an instrument an Implementation uses to remediate Interfaces —
    e.g. Pope Tech, Equidox, an OCR engine).

    Identity is the slug of `title` (Tool has no scope/locus dimension), built via
    `make_tool_identifier`. This is the only sanctioned creation path: it builds the
    identifier in canonical format and guards the unique index with a friendly error.

    Both edges are OPTIONAL and connected only when given (resolved up front so a bad
    reference is a 404 before we create a dangling node):
      supplied_by  — Vendor name (the tool's supplier).
      parent_asset — Asset.asset_identifier, present when the tool is also a stewarded
                     institutional system. Cardinality ZeroOrOne.

    Raises ValidationError on bad/missing input or a duplicate tool_identifier,
    NotFoundError if `supplied_by` / `parent_asset` name a node that doesn't exist,
    CrudError on save failure.
    """
    if not title or not title.strip():
        raise ValidationError("title is required")

    title_slug = _slugify(title)
    if not title_slug:
        raise ValidationError(f"title {title!r} does not yield a usable slug")

    tool_identifier = make_tool_identifier(title_slug)
    if Tool.nodes.filter(tool_identifier=tool_identifier):
        raise ValidationError(f"Tool with tool_identifier {tool_identifier!r} already exists")

    vendor = None
    if supplied_by:
        try:
            vendor = Vendor.nodes.get(name=supplied_by)
        except Vendor.DoesNotExist:
            raise NotFoundError(f"Vendor {supplied_by!r} not found")

    asset = None
    if parent_asset:
        try:
            asset = Asset.nodes.get(asset_identifier=parent_asset)
        except Asset.DoesNotExist:
            raise NotFoundError(f"Asset {parent_asset!r} not found")

    try:
        tool = Tool(
            tool_identifier=tool_identifier,
            title=title,
            description=description,
        )
        tool.save()
        if vendor is not None:
            tool.supplied_by.connect(vendor)
        if asset is not None:
            tool.parent_asset.connect(asset)
        return tool
    except Exception as e:
        raise CrudError(f"Failed to create Tool {tool_identifier!r}: {e}")
