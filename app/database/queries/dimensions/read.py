#
# DIMENSION READ QUERIES
#
# The seven W3C AMM dimensions are a fixed, seeded controlled set (see
# app/database/tools/seed_dimensions.py). This module is read-only — there is no
# user-facing CRUD for Dimension nodes; they are a classification anchor the work
# points at via Implementation.classified_under.
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError


def _serialize_dimension(dimension) -> dict:
    return {
        "unique_id": dimension.unique_id,
        "handle": dimension.handle,
        "name": dimension.name,
        "description": dimension.description,
    }


def get_all_dimensions() -> list:
    """All Dimension nodes (the seven AMM dimensions), ordered by name."""
    try:
        return [_serialize_dimension(d) for d in Dimension.nodes.order_by("name")]
    except Exception as e:
        raise CrudError(f"Failed to retrieve dimensions: {e}")


def get_dimension(handle: str) -> dict:
    """One Dimension by its handle. Raises NotFoundError if missing."""
    try:
        return _serialize_dimension(Dimension.nodes.get(handle=handle))
    except Dimension.DoesNotExist:
        raise NotFoundError(f"Dimension {handle!r} not found")
