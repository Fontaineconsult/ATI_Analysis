#
# INTELLECTUAL SOURCE UPDATE QUERIES
#
from datetime import date

from app.database.graph_schema import IntellectualSource
from app.database.queries.intellectual_sources.create import _coerce_date
from app.database.queries.intellectual_sources.read import _resolve
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError

# Patchable text fields. Present-but-empty clears the field, absent leaves it alone.
_TEXT_FIELDS = ("description_short", "description_full", "url", "author", "publisher", "citation")


def update_intellectual_source(unique_id, data: dict) -> dict:
    """Patch name, descriptions, provenance and attribution. Name stays unique.

    `raw_text` is handled outside the field loop and on the governance contract: the
    capture date moves ONLY when the text itself changes, or an unrelated edit would
    make a stale mirror look freshly captured. Clearing the text clears the date.
    `raw_text_captured` is never taken from the caller.
    """
    data = data or {}
    node = _resolve(unique_id)

    if "name" in data:
        new_name = (data["name"] or "").strip()
        if not new_name:
            raise ValidationError("name cannot be empty")
        if new_name != node.name and IntellectualSource.nodes.filter(name=new_name):
            raise ValidationError(f"IntellectualSource named {new_name!r} already exists")
        node.name = new_name

    for f in _TEXT_FIELDS:
        if f in data:
            setattr(node, f, (data[f] or None))

    if "published_date" in data:
        node.published_date = _coerce_date(data["published_date"]) if data["published_date"] else None

    if "raw_text" in data:
        new_raw_text = data["raw_text"] or None
        if node.raw_text != new_raw_text:
            node.raw_text = new_raw_text
            node.raw_text_captured = date.today() if new_raw_text else None

    try:
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update IntellectualSource {unique_id!r}: {e}")
