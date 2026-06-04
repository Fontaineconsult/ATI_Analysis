#
# INTELLECTUAL SOURCE READ QUERIES
#
from app.database.graph_schema import IntellectualSource
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


def _resolve(unique_id):
    node = IntellectualSource.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"IntellectualSource {unique_id!r} not found")
    return node


def get_all_intellectual_sources() -> list:
    """All intellectual sources as serialized dicts, sorted by name."""
    return sorted(
        (s.serialize() for s in IntellectualSource.nodes.all()),
        key=lambda s: (s.get("name") or "").lower(),
    )


def get_intellectual_source(unique_id) -> dict:
    return _resolve(unique_id).serialize()
