#
# PRINCIPLE DELETE QUERIES
#
from app.database.queries.principles.read import _resolve
from app.endpoints.data_api.errors.custom_exceptions import CrudError


def delete_principle(handle) -> bool:
    """Delete a Principle node. neomodel detaches its `derives_from` and `shapes` edges; the
    grounded Governance/IntellectualSource and shaped UniversalDescriptor nodes are left intact."""
    node = _resolve(handle)
    try:
        node.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete Principle {handle!r}: {e}")
