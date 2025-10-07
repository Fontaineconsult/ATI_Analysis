#
# IMPLEMENTATION DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError


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


def delete_implementation(unique_id):
    """
    Delete an implementation node and disconnect all its relationships using Cypher.

    :param unique_id: Unique identifier of the implementation node to delete
    :return: True if successful
    """
    from neomodel import db

    # First check if the node exists and get its type
    check_query = """
    MATCH (impl)
    WHERE impl.unique_id = $unique_id 
    AND (impl:Process OR impl:Project OR impl:Procedure OR impl:Service 
         OR impl:Guidance OR impl:Tracking OR impl:InternalPolicy)
    RETURN labels(impl) as labels
    """

    result, _ = db.cypher_query(check_query, {'unique_id': unique_id})

    if not result:
        raise NotFoundError(f"No implementation node found with unique_id: {unique_id}")

    # Delete the node and all its relationships in a single query
    delete_query = """
    MATCH (impl)
    WHERE impl.unique_id = $unique_id 
    AND (impl:Process OR impl:Project OR impl:Procedure OR impl:Service 
         OR impl:Guidance OR impl:Tracking OR impl:InternalPolicy)
    DETACH DELETE impl
    RETURN true as success
    """

    result, _ = db.cypher_query(delete_query, {'unique_id': unique_id})

    if result and result[0][0]:
        return True
    else:
        raise CrudError(f"Failed to delete implementation with unique_id: {unique_id}")
#
# delete_implementation("530571d6dff948bbab91a2ee2ba1c82e")