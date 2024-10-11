MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
  WHERE wg.name = $working_group

// Match indicators supported by the goal
OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)

// Match evidences linked to the indicators for the specified academic year
OPTIONAL MATCH (indicator)<-[:tracks]-(evidence:YearSuccessEvidence)
                 -[:evidence_in_year]->(year:AcademicYear)
  WHERE year.name = $academic_year

// Filter out indicators without evidence
WITH wg, goal, indicator, evidence
  WHERE evidence IS NOT NULL

// Match persons implementing the evidence
OPTIONAL MATCH (evidence)<-[:implements]-(person:Person)

// Collect persons per evidence
WITH wg, goal, indicator, evidence,
     collect(DISTINCT person) AS persons

// Match evidence types and their documentation
OPTIONAL MATCH (evidence)<-[:is_evidence_for]-(evidenceType)
  WHERE evidenceType:InternalPolicy OR
  evidenceType:Process OR
  evidenceType:Project OR
  evidenceType:Procedure OR
  evidenceType:Service OR
  evidenceType:Guidance OR
  evidenceType:Tracking

OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(doc:Document)
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(web:Webpage)
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(note:Note)
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(msg:Message)
OPTIONAL MATCH (evidenceType)-[:has_metric]->(metric:Metric)

// Aggregate documentation and metrics under each evidence type
WITH wg, goal, indicator, evidence, persons, evidenceType,
     collect(DISTINCT doc) AS docs,
     collect(DISTINCT web) AS webs,
     collect(DISTINCT note) AS notes,
     collect(DISTINCT msg) AS msgs,
     collect(DISTINCT metric) AS metrics

// Create a map for each evidence type with its documentation and metrics
WITH wg, goal, indicator, evidence, persons,
     {
       type: labels(evidenceType)[0],
       evidenceType: evidenceType,
       docs: docs,
       webs: webs,
       notes: notes,
       msgs: msgs,
       metrics: metrics
     } AS evidenceTypeData

// Collect all evidence types under each evidence
WITH wg, goal, indicator, evidence, persons,
     collect(evidenceTypeData) AS evidenceTypes

// Create a map for each evidence with its evidence types and persons
WITH wg, goal, indicator,
     {
       evidence: evidence,
       evidenceTypes: evidenceTypes,
       persons: persons
     } AS evidenceData

// Collect all evidences under each indicator
WITH wg, goal, indicator, collect(evidenceData) AS evidences

// **Filter out indicators without evidences**
  WHERE size(evidences) > 0

// Create a map for each indicator with its evidences
WITH wg, goal,
     {
       indicator: indicator,
       evidences: evidences
     } AS indicatorData

// Collect all indicators under each goal
WITH wg, goal, collect(indicatorData) AS indicators

// Match accomplishments for each goal in the specified academic year
OPTIONAL MATCH (goal)<-[:advances_goal]-(accomplishment:Accomplishment)
                 -[:in_academic_year]->(accomplishmentYear:AcademicYear)
  WHERE accomplishmentYear.name = $academic_year

// Match plans for each goal in the specified academic year
OPTIONAL MATCH (goal)<-[:furthers_goal]-(plan:Plan)
                 -[:in_academic_year]->(planYear:AcademicYear)
  WHERE planYear.name = $academic_year

// Collect accomplishments and plans per goal
WITH wg.name AS workingGroupName, goal, indicators,
     collect(DISTINCT accomplishment) AS accomplishments,
     collect(DISTINCT plan) AS plans

// Create a map for each goal with its indicators, accomplishments, and plans
WITH workingGroupName,
     {
       goal: goal,
       indicators: indicators,
       accomplishments: accomplishments,
       plans: plans
     } AS goalData

// Collect all goals under the working group
WITH workingGroupName, collect(goalData) AS goals

// Convert to JSON
RETURN apoc.convert.toJson({
  workingGroup: workingGroupName,
  goals: goals
}) AS jsonResults