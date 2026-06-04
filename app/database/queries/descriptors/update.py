#
# DESCRIPTOR UPDATE QUERIES
#
from datetime import date

from app.database.graph_schema import *
from app.database.queries.descriptors.create import compose_search_text, _clean
from app.database.queries.descriptors.read import _resolve_descriptor
from app.endpoints.data_api.errors.custom_exceptions import CrudError


# Identity / structural fields are immutable: the handle is built from (kind, target_*),
# so changing one is a different descriptor (delete + re-create). Update only touches the
# descriptive payload below.
_EDITABLE_FIELDS = ("title", "description_short", "description_full", "include_in_report")


def update_descriptor(descriptor_handle: str, data: dict) -> dict:
    """
    Patch a descriptor's descriptive fields. Only keys present in `data` and in
    `_EDITABLE_FIELDS` are touched; `search_text` is recomputed from the resulting values
    and `last_updated` is stamped.

    Raises NotFoundError if the descriptor is missing, CrudError on save failure.
    """
    descriptor = _resolve_descriptor(descriptor_handle)

    for field in _EDITABLE_FIELDS:
        if field not in data:
            continue
        value = data[field]
        if field == "include_in_report":
            descriptor.include_in_report = bool(value)
        else:
            setattr(descriptor, field, _clean(value))

    descriptor.search_text = compose_search_text(
        descriptor.title,
        descriptor.description_short,
        descriptor.description_full,
        descriptor.target_label,
        descriptor.target_field,
        descriptor.target_value,
    )
    descriptor.last_updated = date.today()

    try:
        descriptor.save()
        return descriptor.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update UniversalDescriptor {descriptor_handle!r}: {e}")
