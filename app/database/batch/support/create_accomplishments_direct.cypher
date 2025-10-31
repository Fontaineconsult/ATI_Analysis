// Direct Cypher Query to Create Accomplishments from Completed Plans
// This version can be run directly in Neo4j Browser or any Cypher execution environment

// ============================================
// Create Accomplishments in CURRENT year from Plans completed in SPECIFIED year
// ============================================
// Plans from specified year (the year they were planned to complete)
// Accomplishments created in current year (when they were actually accomplished)
//
// This query also:
// - Sets the Plan's completed_year to the current year if not already set
// - Creates accomplishment relationships to goals and YSE indicators
//
// Replace "2023-2024" with the year the plans were set to complete
// Replace "2024-2025" with the current academic year
// ============================================

// Match plans from the specified completion year
MATCH (plan:Plan)-[:in_academic_year]->(planYear:AcademicYear {name: "2023-2024"})
WHERE plan.plan_status = "Completed"
  AND NOT (plan)<-[:achieved_through]-(:Accomplishment)

// Get the current academic year for the accomplishment
MATCH (currentYear:AcademicYear {name: "2024-2025"})

// Create the Accomplishment node
CREATE (acc:Accomplishment {
    unique_id: randomUUID(),
    name: "Accomplished: " + plan.name,
    description: COALESCE(
        plan.completion_notes,
        "Accomplishment derived from completed plan: " + plan.description
    )
})

// Create relationships
WITH plan, acc, planYear, currentYear

// Link accomplishment to the plan
CREATE (acc)-[:achieved_through]->(plan)

// Link accomplishment to the CURRENT academic year (not the plan's year)
CREATE (acc)-[:in_academic_year]->(currentYear)

// Update Plan's completed_year if not already set
// If the plan is marked complete but doesn't have a completed_year, set it to current year
WITH plan, acc, planYear, currentYear
WHERE plan.completed_year IS NULL OR plan.completed_year = ""
SET plan.completed_year = currentYear.name

// Copy goal relationships from Plan to Accomplishment
WITH plan, acc, planYear, currentYear
OPTIONAL MATCH (plan)-[:furthers_goal]->(g:Goal)
FOREACH (goal IN CASE WHEN g IS NOT NULL THEN [g] ELSE [] END |
    CREATE (acc)-[:advances_goal]->(goal)
)

// Copy YSE relationships from Plan to Accomplishment
WITH plan, acc, planYear, currentYear
OPTIONAL MATCH (plan)-[:furthers_yse]->(yse:YearSuccessEvidence)
FOREACH (indicator IN CASE WHEN yse IS NOT NULL THEN [yse] ELSE [] END |
    CREATE (acc)-[:advances_yse]->(indicator)
)

// Return results with both years for verification
WITH acc, plan, planYear, currentYear
RETURN acc.name as accomplishment_name,
       acc.description as accomplishment_description,
       plan.name as plan_name,
       plan.plan_status as plan_status,
       plan.completed_year as plan_completed_year,
       planYear.name as plan_original_year,
       currentYear.name as accomplishment_year,
       COUNT{(acc)-[:advances_goal]->(:Goal)} as connected_goals,
       COUNT{(acc)-[:advances_yse]->(:YearSuccessEvidence)} as connected_yse_indicators