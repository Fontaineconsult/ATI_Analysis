#
# SCHEMA ELEMENT CREATE QUERIES
#
from app.database.graph_schema import SchemaElement
from app.data_config import schema_element_kinds
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError


def create_schema_element(element_kind: str, data: dict) -> SchemaElement:
    """
    Create a SchemaElement — a stable handle for a type-level element of our own schema.

    `element_kind` is fixed at creation (identity, from the add picker); `handle` is required,
    unique, and the URL/selection key. Handles follow the identifiers.py format
    (`label:<Label>`, `rel:<rel>`, `field:<Label>.<field>`) but are accepted as-entered and
    only checked for non-emptiness + uniqueness here.
    """
    if element_kind not in schema_element_kinds:
        raise ValidationError(
            f"element_kind must be one of {list(schema_element_kinds.keys())}; got {element_kind!r}"
        )
    handle = (data or {}).get("handle")
    if not handle or not str(handle).strip():
        raise ValidationError("handle is required (e.g. 'label:Tool', 'rel:develops', 'field:Asset.scope')")
    handle = handle.strip()
    if SchemaElement.nodes.filter(handle=handle):
        raise ValidationError(f"SchemaElement with handle {handle!r} already exists")
    try:
        node = SchemaElement(
            handle=handle,
            name=(data.get("name") or None),
            element_kind=element_kind,
        )
        node.save()
        return node
    except Exception as e:
        raise CrudError(f"Failed to create SchemaElement {handle!r}: {e}")
