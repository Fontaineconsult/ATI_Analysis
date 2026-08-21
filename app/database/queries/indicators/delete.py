#
# INDICATOR DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError


def delete_evidence_requirement(unique_id):
    """Delete one EvidenceRequirement.

    A hard delete, not a soft flag: these are reference content, not evidence about a
    year, so there is no history to preserve — the authored `*_example` prose on the
    SuccessIndicator remains the source of record either way.

    Deleting leaves a gap in the `seq` run for that (composite_key, level). That is
    intentional. Seq exists to make the handle unique and to order the list; renumbering
    on delete would rewrite the handles of surviving rows and break any
    `IsEvidenceForRel.satisfies` array already pointing at them.
    """
    try:
        node = EvidenceRequirement.nodes.get(unique_id=unique_id)
    except EvidenceRequirement.DoesNotExist:
        raise NotFoundError(f"EvidenceRequirement '{unique_id}' not found.")
    try:
        node.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete evidence requirement '{unique_id}': {e}")
