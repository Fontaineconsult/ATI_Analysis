#
# SCHEMA ELEMENT DELETE QUERIES
#
from app.database.queries.schema_elements.read import _resolve
from app.endpoints.data_api.errors.custom_exceptions import CrudError


def delete_schema_element(handle) -> bool:
    """Delete a SchemaElement node. neomodel detaches its `shaped_by` edges; the Principles
    that shaped it are left intact (they simply shape one fewer element)."""
    node = _resolve(handle)
    try:
        node.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete SchemaElement {handle!r}: {e}")
