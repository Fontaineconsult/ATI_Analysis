#
# INTELLECTUAL SOURCE UPDATE QUERIES
#
from app.database.graph_schema import IntellectualSource
from app.database.queries.intellectual_sources.read import _resolve
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError


def update_intellectual_source(unique_id, data: dict) -> dict:
    """Patch name / description_short / description_full. Name stays unique."""
    node = _resolve(unique_id)

    if "name" in data:
        new_name = (data["name"] or "").strip()
        if not new_name:
            raise ValidationError("name cannot be empty")
        if new_name != node.name and IntellectualSource.nodes.filter(name=new_name):
            raise ValidationError(f"IntellectualSource named {new_name!r} already exists")
        node.name = new_name

    for f in ("description_short", "description_full"):
        if f in data:
            setattr(node, f, (data[f] or None))

    try:
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update IntellectualSource {unique_id!r}: {e}")
