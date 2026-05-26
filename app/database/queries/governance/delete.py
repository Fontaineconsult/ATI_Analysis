#
# GOVERNANCE DELETE QUERIES
#
from app.database.queries.governance.read import GOVERNANCE_TYPE_TO_CLASS
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError, ValidationError


def delete_governance_item(governance_type: str, unique_id: str) -> bool:
    """
    Delete a governance node by type + unique_id. Returns True on success.
    Raises NotFoundError if the node doesn't exist.
    """
    cls = GOVERNANCE_TYPE_TO_CLASS.get(governance_type)
    if cls is None:
        raise ValidationError(f"Unknown governance type '{governance_type}'.")
    if not unique_id:
        raise ValidationError("unique_id is required.")

    node = cls.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"{cls.__name__} with unique_id '{unique_id}' not found.")

    try:
        node.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete {cls.__name__}: {e}")
