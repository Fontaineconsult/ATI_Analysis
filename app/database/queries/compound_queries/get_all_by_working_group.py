from app.database.class_factory import working_groups
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError, ValidationError

set_connection()
from neomodel import db

def fetch_evidence_for_working_group(working_group, academic_year):
    # Validate working group

    if working_group not in working_groups:
        raise ValidationError(f"Invalid working group '{working_group}'.")
    # Prepare the query
    query = """
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

    // Match admin review notes and their creators
    OPTIONAL MATCH (evidence)-[:admin_review_note]->(adminNote:Note)
    OPTIONAL MATCH (adminNote)-[:created_by]->(adminNoteCreator:Person)

    // Collect persons, admin reviewers, and admin review notes
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel,
         collect(DISTINCT person) AS persons,
         collect(DISTINCT adminReviewer) AS adminReviewers,
         collect(DISTINCT {
           note: adminNote,
           created_by: adminNoteCreator
         }) AS adminReviewNotes

    // Filter out null admin review notes
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, persons, adminReviewers,
         [arn IN adminReviewNotes WHERE arn.note IS NOT NULL] AS adminReviewNotes
    
    // Match plans connected to the evidence
    OPTIONAL MATCH (evidence)<-[:furthers_yse]-(evidencePlan:Plan)

    // Match progress notes for each plan
    OPTIONAL MATCH (evidencePlan)-[:progress_documented_by]->(planProgressNote:Note)
    OPTIONAL MATCH (planProgressNote)-[:created_by]->(planNoteCreator:Person)

    // Collect the plans with their progress notes per evidence
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, adminReviewNotes, persons,
         evidencePlan,
         collect(DISTINCT {
           note: planProgressNote,
           created_by: planNoteCreator
         }) AS progressNotes

    // Filter out null progress notes and aggregate plans.
    // Project completed_in_year / abandoned_in_year alongside each plan so the
    // FE can year-scope visibility without a second round-trip.
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, adminReviewNotes, persons,
         collect(DISTINCT {
           plan: evidencePlan,
           completed_year: head([(evidencePlan)-[:completed_in_year]->(cy:AcademicYear) | cy.name]),
           abandoned_year: head([(evidencePlan)-[:abandoned_in_year]->(ay:AcademicYear) | ay.name]),
           progress_notes: [pn IN progressNotes WHERE pn.note IS NOT NULL]
         }) AS plansWithNotes

    // Extract just the plans for backward compatibility
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, adminReviewNotes, persons,
         [p IN plansWithNotes WHERE p.plan IS NOT NULL | p.plan] AS plans,
         plansWithNotes
    
    // Match evidence types and their documentation with relationship properties
    OPTIONAL MATCH (evidence)<-[:is_evidence_for]-(evidenceType)
      WHERE evidenceType:InternalPolicy OR
      evidenceType:Process OR
      evidenceType:Project OR
      evidenceType:Procedure OR
      evidenceType:Service OR
      evidenceType:Guidance OR
      evidenceType:Tracking
    
    // Match documentation with relationship properties
    OPTIONAL MATCH (evidenceType)-[docRel:is_documented_by]->(doc:Document)
    OPTIONAL MATCH (doc)-[:maintained_by]->(docMaintainer:Person)
    
    OPTIONAL MATCH (evidenceType)-[webRel:is_documented_by]->(web:Webpage)
    OPTIONAL MATCH (web)-[:maintained_by]->(webMaintainer:Person)
    
    OPTIONAL MATCH (evidenceType)-[noteRel:is_documented_by]->(etNote:Note)
    OPTIONAL MATCH (evidenceType)-[msgRel:is_documented_by]->(etMsg:Message)
    OPTIONAL MATCH (evidenceType)-[:has_metric]->(etMetric:Metric)
    
    // Aggregate documentation with relationship data
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, adminReviewNotes, persons, plans, plansWithNotes, evidenceType,
         collect(DISTINCT {
           document: doc,
           maintained_by: docMaintainer,
           relationship: {
             included_in_years: docRel.included_in_years,
             excluded_from_years: docRel.excluded_from_years,
             added_date: docRel.added_date,
             modified_date: docRel.modified_date,
             added_by: docRel.added_by
           }
         }) AS docs,
         collect(DISTINCT {
           webpage: web,
           maintained_by: webMaintainer,
           relationship: {
             included_in_years: webRel.included_in_years,
             excluded_from_years: webRel.excluded_from_years,
             added_date: webRel.added_date,
             modified_date: webRel.modified_date,
             added_by: webRel.added_by
           }
         }) AS webs,
         collect(DISTINCT {
           note: etNote,
           relationship: {
             included_in_years: noteRel.included_in_years,
             excluded_from_years: noteRel.excluded_from_years,
             added_date: noteRel.added_date,
             modified_date: noteRel.modified_date,
             added_by: noteRel.added_by
           }
         }) AS notes,
         collect(DISTINCT {
           message: etMsg,
           relationship: {
             included_in_years: msgRel.included_in_years,
             excluded_from_years: msgRel.excluded_from_years,
             added_date: msgRel.added_date,
             modified_date: msgRel.modified_date,
             added_by: msgRel.added_by
           }
         }) AS msgs,
         collect(DISTINCT etMetric) AS metrics
    
    // Filter out null documents and webpages while preserving structure
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, adminReviewNotes, persons, plans, plansWithNotes, evidenceType,
         [d IN docs WHERE d.document IS NOT NULL] AS docs,
         [w IN webs WHERE w.webpage IS NOT NULL] AS webs,
         [n IN notes WHERE n.note IS NOT NULL] AS notes,
         [m IN msgs WHERE m.message IS NOT NULL] AS msgs,
         metrics
    
    // Apply year filtering based on relationship properties
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, adminReviewNotes, persons, plans, plansWithNotes, evidenceType,
         [d IN docs WHERE 
           (d.relationship.included_in_years IS NULL OR size(d.relationship.included_in_years) = 0 OR $academic_year IN d.relationship.included_in_years)
           AND (d.relationship.excluded_from_years IS NULL OR NOT $academic_year IN d.relationship.excluded_from_years)
         ] AS docs,
         [w IN webs WHERE 
           (w.relationship.included_in_years IS NULL OR size(w.relationship.included_in_years) = 0 OR $academic_year IN w.relationship.included_in_years)
           AND (w.relationship.excluded_from_years IS NULL OR NOT $academic_year IN w.relationship.excluded_from_years)
         ] AS webs,
         [n IN notes WHERE 
           (n.relationship.included_in_years IS NULL OR size(n.relationship.included_in_years) = 0 OR $academic_year IN n.relationship.included_in_years)
           AND (n.relationship.excluded_from_years IS NULL OR NOT $academic_year IN n.relationship.excluded_from_years)
         ] AS notes,
         [m IN msgs WHERE 
           (m.relationship.included_in_years IS NULL OR size(m.relationship.included_in_years) = 0 OR $academic_year IN m.relationship.included_in_years)
           AND (m.relationship.excluded_from_years IS NULL OR NOT $academic_year IN m.relationship.excluded_from_years)
         ] AS msgs,
         metrics
    
    // Create a map for each evidence type with its documentation and metrics
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, adminReviewNotes, persons, plans, plansWithNotes,
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
    WITH wg, goal, indicator, evidence, evidenceNotes, evidenceMessages, evidenceMetrics, statusLevel, adminReviewers, adminReviewNotes, persons, plans, plansWithNotes,
         collect(evidenceTypeData) AS evidenceTypes

    // Create a map for each evidence with its data, including plans
    WITH wg, goal, indicator, statusLevel, adminReviewers, adminReviewNotes, persons, plans, plansWithNotes, evidenceTypes, evidence, evidenceNotes, evidenceMessages, evidenceMetrics,
         {
           evidence: evidence,
           statusLevel: statusLevel,
           evidenceTypes: evidenceTypes,
           persons: persons,
           adminReviewers: adminReviewers,
           adminReviewNotes: adminReviewNotes,
           has_notes: evidenceNotes,
           has_messages: evidenceMessages,
           has_metrics: evidenceMetrics,
           plans: plans,
           plans_with_notes: plansWithNotes
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

    // Match progress notes for goal-level plans
    OPTIONAL MATCH (plan)-[:progress_documented_by]->(goalPlanProgressNote:Note)
    OPTIONAL MATCH (goalPlanProgressNote)-[:created_by]->(goalPlanNoteCreator:Person)

    // Collect progress notes per plan
    WITH wg, goal, indicators, accomplishment, plan,
         collect(DISTINCT {
           note: goalPlanProgressNote,
           created_by: goalPlanNoteCreator
         }) AS goalPlanProgressNotes

    // Create plan objects with progress notes. Surface completed/abandoned
    // year alongside so the FE can filter without an extra fetch.
    WITH wg, goal, indicators, accomplishment,
         {
           plan: plan,
           completed_year: head([(plan)-[:completed_in_year]->(cy:AcademicYear) | cy.name]),
           abandoned_year: head([(plan)-[:abandoned_in_year]->(ay:AcademicYear) | ay.name]),
           progress_notes: [pn IN goalPlanProgressNotes WHERE pn.note IS NOT NULL]
         } AS planWithNotes

    // Collect accomplishments and plans per goal
    WITH wg.name AS workingGroupName, goal, indicators,
         collect(DISTINCT accomplishment) AS accomplishments,
         collect(DISTINCT planWithNotes.plan) AS plans,
         collect(DISTINCT CASE WHEN planWithNotes.plan IS NOT NULL THEN planWithNotes ELSE NULL END) AS plansWithProgressNotes
    
    // Create a map for each goal with its indicators, accomplishments, and plans
    WITH workingGroupName, goal, indicators, accomplishments, plans, plansWithProgressNotes,
         {
           goal: goal,
           indicators: indicators,
           accomplishments: accomplishments,
           plans: plans,
           plans_with_progress_notes: [p IN plansWithProgressNotes WHERE p IS NOT NULL]
         } AS goalData
    
    // Collect all goals under the working group
    WITH workingGroupName, collect(goalData) AS goals
    
    // Convert to JSON
    RETURN apoc.convert.toJson({
      workingGroup: workingGroupName,
      goals: goals
    }) AS jsonResults
"""

    try:
        results, meta = db.cypher_query(query, {'working_group': working_group, 'academic_year': academic_year})
        if not results:
            raise NotFoundError(f"No data found for the working group '{working_group}' and academic year '{academic_year}'.")
        return json.loads(results[0][0])
    except Exception as e:
        raise CrudError(f"Failed to fetch evidence: {str(e)}")

if __name__=='__main__':
    print(fetch_evidence_for_working_group("Procurement", "2023-2024"))