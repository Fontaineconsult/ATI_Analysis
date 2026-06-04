#
# SCHEMA ELEMENT UPDATE QUERIES
#
from app.database.queries.schema_elements.read import _resolve, get_schema_element
from app.endpoints.data_api.errors.custom_exceptions import CrudError


def update_schema_element(handle, data: dict) -> dict:
    """
    Patch a SchemaElement. `handle` and `element_kind` are identity (immutable — a different
    handle is a different element); only `name` is editable. Relationships (shaped_by) are
    managed from the Principle side.
    """
    node = _resolve(handle)
    if "name" in data:
        node.name = (data["name"] or None)
    try:
        node.save()
        return get_schema_element(handle)
    except Exception as e:
        raise CrudError(f"Failed to update SchemaElement {handle!r}: {e}")
