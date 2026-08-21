#
# INDICATOR DELETE QUERIES
#
from app.database.graph_schema import *
from neomodel import db

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError


def delete_evidence_requirement(unique_id):
    """Delete one EvidenceRequirement.

    Returns the number of evidence links whose claim was cleared, so the caller can
    tell the curator what the delete cost rather than silently dropping claims.

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

    handle = node.handle
    try:
        # Strip the handle from every evidence link claiming it, BEFORE the node goes.
        # IsEvidenceForRel.satisfies holds handles, not references, so nothing in the
        # database would stop the array from outliving the requirement — and a dangling
        # handle is invisible: it just quietly stops matching, and the coverage view
        # under-reports without anything looking wrong.
        rows, _ = db.cypher_query(
            """
            MATCH ()-[r:is_evidence_for]->()
            WHERE $handle IN coalesce(r.satisfies, [])
            SET r.satisfies = [h IN r.satisfies WHERE h <> $handle]
            RETURN count(r)
            """,
            {"handle": handle},
        )
        unlinked = rows[0][0] if rows else 0

        node.delete()
        return {"deleted": unique_id, "handle": handle, "claims_cleared": unlinked}
    except Exception as e:
        raise CrudError(f"Failed to delete evidence requirement '{unique_id}': {e}")
