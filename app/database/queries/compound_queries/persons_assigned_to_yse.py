from app.database.class_factory import working_groups
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError, ValidationError

from neomodel import db


def fetch_persons_assigned_to_yse(working_group, academic_year, campus_abbreviation=None):
    if working_group not in working_groups:
        raise ValidationError(f"Invalid working group '{working_group}'.")

    query = """
    MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
      WHERE wg.name = $working_group

    // Match indicators supported by the goal
    OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)

    // Filter out removed indicators using WITH/WHERE (same pattern as get_all_by_working_group)
    WITH wg, goal, indicator
      WHERE indicator IS NULL OR indicator.removed IS NULL OR indicator.removed = false

    // Match YSE for the specified academic year
    OPTIONAL MATCH (indicator)<-[:tracks]-(yse:YearSuccessEvidence)
                     -[:evidence_in_year]->(year:AcademicYear)
      WHERE year.name = $academic_year

    // Match the campus directly from YSE
    OPTIONAL MATCH (yse)-[:evidence_at_campus]->(yseCampus:Campus)

    // Optional campus filter
    WITH wg, goal, indicator, yse, year, yseCampus
      WHERE $campus_abbreviation IS NULL OR yseCampus.abbreviation = $campus_abbreviation

    // Match status level of the YSE
    OPTIONAL MATCH (yse)-[:status_is]->(statusLevel:StatusLevel)

    // Extract goal/indicator properties before aggregation
    // composite_key format is "1.11-pro" — split on '-' to get "1.11" as indicator ID
    WITH goal.description AS goalDescription,
         goal.goal AS goalGoal,
         goal.goal_number AS goalNumber,
         indicator.success_indicator AS indicatorName,
         split(indicator.composite_key, '-')[0] AS indicatorId,
         yse.year_identifier AS yseId,
         year.name AS academicYear,
         yseCampus.name AS campusName,
         yseCampus.abbreviation AS campusAbbreviation,
         statusLevel.status_level AS statusName,
         yse

    // Match persons implementing the YSE and their organizations
    OPTIONAL MATCH (yse)<-[:implements]-(person:Person)
    OPTIONAL MATCH (org)-[:employs]->(person)
      WHERE org:Department OR org:College

    // Collect person names and org names per YSE
    WITH goalDescription, goalGoal, goalNumber, indicatorName, indicatorId,
         yseId, academicYear, campusName, campusAbbreviation, statusName,
         collect(DISTINCT person.name) AS implementor_names,
         collect(DISTINCT org.name) AS org_names

    // Filter out nulls
    WITH goalDescription, goalGoal, goalNumber, indicatorName, indicatorId,
         yseId, academicYear, campusName, campusAbbreviation, statusName,
         [name IN implementor_names WHERE name IS NOT NULL] AS implementor_names,
         [name IN org_names WHERE name IS NOT NULL] AS org_names

    RETURN goalDescription AS goal_description,
           goalGoal AS goal,
           goalNumber AS goal_number,
           indicatorName AS indicator,
           indicatorId AS indicator_id,
           yseId AS yse,
           academicYear AS academic_year,
           statusName AS status,
           CASE WHEN size(implementor_names) > 0
                THEN apoc.text.join(implementor_names, ', ')
                ELSE null END AS implementors,
           CASE WHEN size(org_names) > 0
                THEN apoc.text.join(org_names, ', ')
                ELSE null END AS organizations,
           campusName AS campus,
           campusAbbreviation AS campus_abbreviation
    ORDER BY goalNumber, indicatorId
    """

    try:
        results, meta = db.cypher_query(query, {
            'working_group': working_group,
            'academic_year': academic_year,
            'campus_abbreviation': campus_abbreviation
        })
        return results, meta
    except Exception as e:
        raise CrudError(f"Failed to fetch persons assigned to YSE: {str(e)}")


if __name__ == '__main__':
    results, meta = fetch_persons_assigned_to_yse("Procurement", "2023-2024")
    print(f"Columns: {meta}")
    for row in results:
        print(row)
