#
# PRINCIPLE CREATE QUERIES
#
from app.database.graph_schema import Principle
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError


def create_principle(data: dict) -> Principle:
    """
    Create a Principle (a conceptual commitment of the framework). `handle` (unique, the URL/
    selection key, e.g. 'principle:closest-to-capacity') and `name` are required. Grounding
    (`derives_from`) and `shapes` edges are NOT set here — they are attached afterward from the
    detail panel (mirrors how Governance attaches documents/webpages post-create).
    """
    handle = (data or {}).get("handle")
    name = (data or {}).get("name")
    if not handle or not str(handle).strip():
        raise ValidationError("handle is required (e.g. 'principle:closest-to-capacity')")
    if not name or not str(name).strip():
        raise ValidationError("name is required")
    handle = handle.strip()
    if Principle.nodes.filter(handle=handle):
        raise ValidationError(f"Principle with handle {handle!r} already exists")
    try:
        node = Principle(
            handle=handle,
            name=name.strip(),
            description_short=(data.get("description_short") or None),
            description_full=(data.get("description_full") or None),
        )
        node.save()
        return node
    except Exception as e:
        raise CrudError(f"Failed to create Principle {handle!r}: {e}")
