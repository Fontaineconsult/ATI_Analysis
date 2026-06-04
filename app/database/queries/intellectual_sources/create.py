#
# INTELLECTUAL SOURCE CREATE QUERIES
#
from app.database.graph_schema import IntellectualSource
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError


def create_intellectual_source(data: dict) -> IntellectualSource:
    """
    Create an IntellectualSource — a non-legal grounding (a theory / body of scholarship)
    that a Principle can `derives_from` alongside Governance. `name` is required and unique.
    """
    name = (data or {}).get("name")
    if not name or not str(name).strip():
        raise ValidationError("name is required")
    name = name.strip()
    if IntellectualSource.nodes.filter(name=name):
        raise ValidationError(f"IntellectualSource named {name!r} already exists")
    try:
        node = IntellectualSource(
            name=name,
            description_short=(data.get("description_short") or None),
            description_full=(data.get("description_full") or None),
        )
        node.save()
        return node
    except Exception as e:
        raise CrudError(f"Failed to create IntellectualSource: {e}")
