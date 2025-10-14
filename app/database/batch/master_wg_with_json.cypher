MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
  WHERE wg.name = $working_group

// Match indicators supported by the goal
OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)

// Filter out indicators where 'removed' is true
WITH wg, goal, indicator
  WHERE indicator.removed IS NULL OR indicator.removed = false

// Match evidences linked to the indicators for the specified academic year
OPTIONAL MATCH (indicator)<-[:tracks]-(evidence:YearSuccessEvidence)
                 -[:evidence_in_year]->(year:AcademicYear)
  WHERE year.name = $academic_year

// Proceed even if evidence is NULL (to include indicators without evidence)
WITH wg, goal, indicator, evidence

// Match notes connected to the evidence and their creators
OPTIONAL MATCH (evidence)-[:has_note]->(evidenceNote:Note)
OPTIONAL MATCH (evidenceNote)-[:created_by]->(noteCreator:Person)

// Collect the notes and their creators per evidence, filtering out nulls
WITH wg, goal, indicator, evidence,
     [note IN collect(DISTINCT {
       note: evidenceNote,
       created_by: noteCreator
     }) WHERE note.note IS NOT NULL] AS evidenceNotes

// Match messages connected to the evidence and their creators
OPTIONAL MATCH (evidence)-[:has_message]->(evidenceMessage:Message)
OPTIONAL MATCH (evidenceMessage)-[:created_by]->(messageCreator:Person)

// Collect the messages and their creators per evidence
WITH wg, goal, indicator, evidence, evidenceNotes,
     collect(DISTINCT {
       message: evidenceMessage,
       created_by: messageCreator
     }) AS evidenceMessages

// Filter out null messages
WITH wg, goal, indicator, evidence, evidenceNotes,
     [msg IN evidenceMessages WHERE msg.message IS NOT NULL] AS evidenceMessages

// Match metrics connected to the evidence and their creators
OPTIONAL MATCH (evidence)-[:has_metric]->(evidenceMetric:Metric)
OPTIONAL MATCH (evidenceMetric)-[:created_by]->(metricCreator:Person)

// Collect the metrics and their creators per evidence
WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages,
     collect(DISTINCT {
       metric: evidenceMetric,
       created_by: metricCreator
     }) AS evidenceMetrics

// Filter out null metrics
WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages,
     [met IN evidenceMetrics WHERE met.metric IS NOT NULL] AS evidenceMetrics

// Match status level of the evidence
OPTIONAL MATCH (evidence)-[:status_is]->(statusLevel:StatusLevel)

// Match persons implementing the evidence
OPTIONAL MATCH (evidence)<-[:implements]-(person:Person)

// Match admin reviewers
OPTIONAL MATCH (evidence)-[:admin_review_completed_by]->(adminReviewer:Person)

// Collect persons and admin reviewers
WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel,
     collect(DISTINCT person) AS persons,
     collect(DISTINCT adminReviewer) AS adminReviewers

// Match plans connected to the evidence
OPTIONAL MATCH (evidence)<-[:furthers_yse]-(evidencePlan:Plan)

// Collect the plans per evidence
WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, persons,
     collect(DISTINCT evidencePlan) AS plans

// Match evidence types and their documentation
OPTIONAL MATCH (evidence)<-[:is_evidence_for]-(evidenceType)
  WHERE evidenceType:InternalPolicy OR
  evidenceType:Process OR
  evidenceType:Project OR
  evidenceType:Procedure OR
  evidenceType:Service OR
  evidenceType:Guidance OR
  evidenceType:Tracking

// Match documentation and metrics associated with evidence types
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(doc:Document)
OPTIONAL MATCH (doc)-[:maintained_by]->(docMaintainer:Person)

OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(web:Webpage)
OPTIONAL MATCH (web)-[:maintained_by]->(webMaintainer:Person)

OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(etNote:Note)
OPTIONAL MATCH (evidenceType)-[:is_documented_by]->(etMsg:Message)
OPTIONAL MATCH (evidenceType)-[:has_metric]->(etMetric:Metric)

// Aggregate documentation and metrics under each evidence type
WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, persons, plans, evidenceType,
     collect(DISTINCT {
       document: doc,
       maintained_by: docMaintainer
     }) AS docs,
     collect(DISTINCT {
       webpage: web,
       maintained_by: webMaintainer
     }) AS webs,
     collect(DISTINCT etNote) AS notes,
     collect(DISTINCT etMsg) AS msgs,
     collect(DISTINCT etMetric) AS metrics

// Filter out null documents and webpages while preserving structure
WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, persons, plans, evidenceType,
     [d IN docs WHERE d.document IS NOT NULL] AS docs,
     [w IN webs WHERE w.webpage IS NOT NULL] AS webs,
     notes, msgs, metrics

// Create a map for each evidence type with its documentation and metrics
WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, persons, plans,
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
WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, persons, plans,
     collect(evidenceTypeData) AS evidenceTypes

// Create a map for each evidence with its data, including plans
WITH wg, goal, indicator, statusLevel, adminReviewers, persons, plans, evidenceTypes, evidence, evidenceNotes, evidenceMessages, evidenceMetrics,
     {
       evidence: evidence,
       statusLevel: statusLevel,
       evidenceTypes: evidenceTypes,
       persons: persons,
       adminReviewers: adminReviewers,
       has_notes: evidenceNotes,
       has_messages: evidenceMessages,
       has_metrics: evidenceMetrics,
       plans: plans
     } AS evidenceData

// Collect all evidences under each indicator
WITH wg, goal, indicator, collect(evidenceData) AS evidences

// Create a map for each indicator with its evidences
WITH wg, goal, indicator, evidences,
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
WITH workingGroupName, goal, indicators, accomplishments, plans,
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