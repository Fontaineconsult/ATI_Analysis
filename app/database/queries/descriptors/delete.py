#
# DESCRIPTOR DELETE QUERIES
#
from app.database.graph_schema import *
from app.database.queries.descriptors.read import _resolve_descriptor
from app.endpoints.data_api.errors.custom_exceptions import CrudError


def delete_descriptor(descriptor_handle: str) -> bool:
    """
    Delete a UniversalDescriptor node (true delete). Descriptors carry no edges to
    instance data, so nothing else is affected.

    Raises NotFoundError if the descriptor is missing, CrudError on failure.
    """
    descriptor = _resolve_descriptor(descriptor_handle)
    try:
        descriptor.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete UniversalDescriptor {descriptor_handle!r}: {e}")
