#
# COMMUNITY OF PRACTICE CREATE QUERIES
#
# Communities are freely creatable data (not a seeded vocabulary): one node per
# cross-campus shared-interest area (Library, Faculty Development, ...). No required
# edges — the unique index on name is the only invariant.
#
from app.database.graph_schema import CommunityOfPractice
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError


def create_community(data: dict) -> CommunityOfPractice:
    """Create a CommunityOfPractice. `name` is required and unique; `description` optional."""
    name = (data.get("name") or "").strip()
    if not name:
        raise ValidationError("Community name is required.")
    if CommunityOfPractice.nodes.first_or_none(name=name):
        raise ValidationError(f"A community named {name!r} already exists.")
    try:
        return CommunityOfPractice(name=name, description=data.get("description")).save()
    except Exception as e:
        raise CrudError(f"Failed to create community {name!r}: {e}")
