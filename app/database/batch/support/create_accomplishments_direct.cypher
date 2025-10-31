// Direct Cypher Query to Create Accomplishments from Completed Plans
// This version can be run directly in Neo4j Browser or any Cypher execution environment

// ============================================
// VERSION 1: Hard-coded Academic Year
// Use this version by replacing "2024-2025" with your desired year
// ============================================

MATCH (plan:Plan)-[:in_academic_year]->(ay:AcademicYear {name: "2023-2024"})
WHERE plan.plan_status = "Completed"
  AND NOT (plan)<-[:achieved_through]-(:Accomplishment)

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
WITH plan, acc, ay

// Link accomplishment to the plan
CREATE (acc)-[:achieved_through]->(plan)

// Link accomplishment to the same academic year
CREATE (acc)-[:in_academic_year]->(ay)

// Copy goal relationships from Plan to Accomplishment
WITH plan, acc
OPTIONAL MATCH (plan)-[:furthers_goal]->(g:Goal)
FOREACH (goal IN CASE WHEN g IS NOT NULL THEN [g] ELSE [] END |
    CREATE (acc)-[:advances_goal]->(goal)
)

// Copy YSE relationships from Plan to Accomplishment
WITH plan, acc
OPTIONAL MATCH (plan)-[:furthers_yse]->(yse:YearSuccessEvidence)
FOREACH (indicator IN CASE WHEN yse IS NOT NULL THEN [yse] ELSE [] END |
    CREATE (acc)-[:advances_yse]->(indicator)
)

// Return results
WITH acc, plan
RETURN acc.name as accomplishment_name,
       acc.description as accomplishment_description,
       plan.name as plan_name,
       plan.plan_status as plan_status,
       COUNT{(acc)-[:advances_goal]->(:Goal)} as connected_goals,
       COUNT{(acc)-[:advances_yse]->(:YearSuccessEvidence)} as connected_yse_indicators