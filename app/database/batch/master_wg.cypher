MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
  WHERE wg.name = "Web"

OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)

WITH wg, goal, indicator
  WHERE indicator.removed IS NULL OR indicator.removed = false

OPTIONAL MATCH (indicator)<-[:tracks]-(evidence:YearSuccessEvidence)
                 -[:evidence_in_year]->(year:AcademicYear)
  WHERE year.name = "2023-2024"

WITH wg, goal, indicator, evidence

OPTIONAL MATCH (evidence)-[:has_note]->(evidenceNote:Note)
OPTIONAL MATCH (evidenceNote)-[:created_by]->(noteCreator:Person)

WITH wg, goal, indicator, evidence,
     collect(DISTINCT {
       note: evidenceNote,
       created_by: noteCreator
     }) AS evidenceNotes

OPTIONAL MATCH (evidence)-[:has_message]->(evidenceMessage:Message)
OPTIONAL MATCH (evidenceMessage)-[:created_by]->(messageCreator:Person)

WITH wg, goal, indicator, evidence, evidenceNotes,
     [msg IN collect(DISTINCT {
       message: evidenceMessage,
       created_by: messageCreator
     }) WHERE msg.message IS NOT NULL] AS evidenceMessages

OPTIONAL MATCH (evidence)-[:has_metric]->(evidenceMetric:Metric)
OPTIONAL MATCH (evidenceMetric)-[:created_by]->(metricCreator:Person)

WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages,
     [met IN collect(DISTINCT {
       metric: evidenceMetric,
       created_by: metricCreator
     }) WHERE met.metric IS NOT NULL] AS evidenceMetrics

OPTIONAL MATCH (evidence)-[:status_is]->(statusLevel:StatusLevel)
OPTIONAL MATCH (evidence)<-[:implements]-(person:Person)
OPTIONAL MATCH (evidence)-[:admin_review_completed_by]->(adminReviewer:Person)

WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel,
     collect(DISTINCT person) AS persons,
     collect(DISTINCT adminReviewer) AS adminReviewers

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
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(etNote:Note)
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(etMsg:Message)
OPTIONAL MATCH (evidenceType)-[:has_metric]->(etMetric:Metric)

WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, persons,
     collect({
       type: labels(evidenceType)[0],
       evidenceType: evidenceType,
       docs: collect(DISTINCT doc),
       webs: collect(DISTINCT web),
       notes: collect(DISTINCT etNote),
       msgs: collect(DISTINCT etMsg),
       metrics: collect(DISTINCT etMetric)
     }) AS evidenceTypes

OPTIONAL MATCH (goal)<-[:advances_goal]-(accomplishment:Accomplishment)
                 -[:in_academic_year]->(accomplishmentYear:AcademicYear)
  WHERE accomplishmentYear.name = "2023-2024"

OPTIONAL MATCH (goal)<-[:furthers_goal]-(plan:Plan)
                 -[:in_academic_year]->(planYear:AcademicYear)
  WHERE planYear.name = "2023-2024"

RETURN wg.name as workingGroup,
       collect({
         goal: goal,
         indicators: collect({
         indicator: indicator,
         evidences: collect({
         evidence: evidence,
         statusLevel: statusLevel,
         evidenceTypes: evidenceTypes,
         persons: persons,
         adminReviewers: adminReviewers,
         has_notes: evidenceNotes,
         has_messages: evidenceMessages,
         has_metrics: evidenceMetrics
       }),
         accomplishments: collect(DISTINCT accomplishment),
         plans: collect(DISTINCT plan)
       })
       }) AS goals