#
# DESCRIPTOR READ QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


def _resolve_descriptor(descriptor_handle: str) -> UniversalDescriptor:
    try:
        return UniversalDescriptor.nodes.get(descriptor_handle=descriptor_handle)
    except UniversalDescriptor.DoesNotExist:
        raise NotFoundError(f"UniversalDescriptor {descriptor_handle!r} not found")


def get_all_descriptors() -> list:
    """All descriptors as serialized dicts, sorted by handle (stable order for the UI)."""
    descriptors = UniversalDescriptor.nodes.all()
    return sorted(
        (d.serialize() for d in descriptors),
        key=lambda d: (d.get("descriptor_handle") or ""),
    )


def get_descriptor(descriptor_handle: str) -> dict:
    """One descriptor by handle (serialized). Raises NotFoundError if missing."""
    return _resolve_descriptor(descriptor_handle).serialize()
