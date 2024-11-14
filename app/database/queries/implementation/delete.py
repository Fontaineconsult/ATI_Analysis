#
# IMPLEMENTATION DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError


def unassign_person_as_implementor(unique_id, year_identifier):
    try:
        # Retrieve the Person node by employee name
        person_node = Person.nodes.get(unique_id=unique_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"No Person node found with name: {unique_id}")

    try:
        # Retrieve the YearSuccessEvidence node by year identifier
        year_success_evidence_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"No YearSuccessEvidence node found with year_identifier: {year_identifier}")

    # Check if the relationship exists before attempting to disconnect
    if person_node.implements_yse.is_connected(year_success_evidence_node):
        person_node.implements_yse.disconnect(year_success_evidence_node)
    else:
        raise NotFoundError("The specified person is not currently assigned as an implementor for this year identifier.")

    return True
