#
# INTELLECTUAL SOURCE DELETE QUERIES
#
from app.database.queries.intellectual_sources.read import _resolve
from app.endpoints.data_api.errors.custom_exceptions import CrudError


def delete_intellectual_source(unique_id) -> bool:
    node = _resolve(unique_id)
    try:
        node.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete IntellectualSource {unique_id!r}: {e}")
