#
# INDIVIDUAL READ QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
from neomodel import db


def get_all_persons() -> list:
    query =  """
        MATCH (p:Person)
        OPTIONAL MATCH (p)-[:participates_in]->(wg:ATIWorkingGroup)
        OPTIONAL MATCH (p)-[:implements]->(yse:YearSuccessEvidence)
        WITH p, collect(DISTINCT wg) AS workingGroups, collect(DISTINCT yse) AS yearSuccessEvidences
        WITH p {
          .*, 
          workingGroups: [wg IN workingGroups | wg { .* }],
          yearSuccessEvidences: [yse IN yearSuccessEvidences | yse { .* }]
        } AS personData
        RETURN apoc.convert.toJson(collect(personData)) AS jsonResult
            """

    results, meta = db.cypher_query(query)
    if len(results) == 0:
        raise NotFoundError(f"No people found")
        # Return the duplicated nodes (e2)
    return results

def get_all_persons_basic() -> list:
    return Person.nodes.all()


def get_person_by_employee_id(employee_id: str) -> Person:
    """
    Get a person node by employee_id
    :param employee_id: Employee ID of the person
    :return: Person node
    """
    person = Person.nodes.get_or_none(employee_id=employee_id)
    if not person:
        raise NotFoundError(f"Person with employee_id {employee_id} does not exist.")
    return person
