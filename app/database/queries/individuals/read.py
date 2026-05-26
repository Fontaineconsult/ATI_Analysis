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
        OPTIONAL MATCH (p)-[:works_at_campus]->(camp:Campus)
        WITH p,
             collect(DISTINCT wg) AS workingGroups,
             collect(DISTINCT yse) AS yearSuccessEvidences,
             head(collect(DISTINCT camp.abbreviation)) AS host_campus
        WITH p {
          .*,
          workingGroups: [wg IN workingGroups | wg { .* }],
          yearSuccessEvidences: [yse IN yearSuccessEvidences | yse { .* }],
          host_campus: host_campus
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


def get_person_implementation_details(employee_id: str) -> dict:
    """
    Detail view for the People Explorer: person + their YSEs enriched with
    campus, success indicator, status level, and the implementation nodes
    attached to each YSE via :is_evidence_for.

    Returns a single JSON-serializable dict.
    """
    query = """
        MATCH (p:Person {employee_id: $employee_id})
        OPTIONAL MATCH (p)-[:works_at_campus]->(host:Campus)
        WITH p, host
        OPTIONAL MATCH (p)-[:participates_in]->(wg:ATIWorkingGroup)
        WITH p, host, collect(DISTINCT wg.name) AS workingGroupNames

        WITH p, host, workingGroupNames,
             [(p)-[:implements]->(yse:YearSuccessEvidence) | yse] AS yseNodes

        WITH p, host, workingGroupNames, [
          yse IN yseNodes |
          {
            year_identifier: yse.year_identifier,
            unique_id: yse.unique_id,
            administrative_review_complete: yse.administrative_review_complete,
            indicator_composite_key: head([(yse)-[:tracks]->(si:SuccessIndicator) | si.composite_key]),
            indicator_description:    head([(yse)-[:tracks]->(si:SuccessIndicator) | si.success_indicator]),
            academic_year:            head([(yse)-[:evidence_in_year]->(ay:AcademicYear) | ay.name]),
            campus:                   head([(yse)-[:evidence_at_campus]->(c:Campus) | {abbreviation: c.abbreviation, name: c.name}]),
            status_level:             head([(yse)-[:status_is]->(sl:StatusLevel) | sl.status_level]),
            implementations: [(impl)-[:is_evidence_for]->(yse) | {type: head(labels(impl)), title: impl.title, unique_id: impl.unique_id}]
          }
        ] AS yses

        RETURN apoc.convert.toJson({
          unique_id: p.unique_id,
          employee_id: p.employee_id,
          name: p.name,
          email: p.email,
          title: p.title,
          ati_role: p.ati_role,
          active: p.active,
          can_approve_yse: p.can_approve_yse,
          non_committee_member_active: p.non_committee_member_active,
          host_campus: host.abbreviation,
          workingGroups: workingGroupNames,
          yearSuccessEvidences: yses
        }) AS jsonResult
    """
    results, _meta = db.cypher_query(query, {"employee_id": employee_id})
    if not results or not results[0] or not results[0][0]:
        raise NotFoundError(f"Person with employee_id {employee_id} does not exist.")
    import json
    return json.loads(results[0][0])
