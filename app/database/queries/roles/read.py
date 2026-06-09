#
# ROLE READ QUERIES
#
# Roles are a seeded controlled set (see app/database/tools/seed_roles.py) — the
# capacities people provide. Read-only here; a Role is held by people (Person.holds_role,
# PD tracking on the edge) and referenced by ParticipationRel.role_handle on the work.
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError


def _serialize_role(role) -> dict:
    return {
        "unique_id": role.unique_id,
        "handle": role.handle,
        "name": role.name,
        "description": role.description,
    }


def get_all_roles() -> list:
    """All Role nodes (the seeded AMM role-categories), ordered by name."""
    try:
        return [_serialize_role(r) for r in Role.nodes.order_by("name")]
    except Exception as e:
        raise CrudError(f"Failed to retrieve roles: {e}")


def get_role(handle: str) -> dict:
    """One Role by its handle. Raises NotFoundError if missing."""
    try:
        return _serialize_role(Role.nodes.get(handle=handle))
    except Role.DoesNotExist:
        raise NotFoundError(f"Role {handle!r} not found")
