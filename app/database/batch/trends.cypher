// trends.cypher
// Compares success indicators between two years and returns trend status
// Parameters: $working_group, $past_year, $current_year

MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
  WHERE wg.name = $working_group

MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)
  WHERE indicator.removed IS NULL OR indicator.removed = false

// Get evidence for current year (required)
MATCH (indicator)<-[:tracks]-(evidence_current:YearSuccessEvidence)
        -[:evidence_in_year]->(year_current:AcademicYear)
  WHERE year_current.name = $current_year

// Get status for current year
OPTIONAL MATCH (evidence_current)-[:status_is]->(status_current:StatusLevel)

// Get evidence and status for past year (optional)
OPTIONAL MATCH (indicator)<-[:tracks]-(evidence_past:YearSuccessEvidence)
                 -[:evidence_in_year]->(year_past:AcademicYear)
  WHERE year_past.name = $past_year
OPTIONAL MATCH (evidence_past)-[:status_is]->(status_past:StatusLevel)

// Convert status_value from string to integer for comparison
WITH indicator,
     goal,
     evidence_current,
     status_current,
     CASE WHEN status_past.status_value IS NOT NULL
     THEN toInteger(status_past.status_value)
       ELSE null END as past_value,
     CASE WHEN status_current.status_value IS NOT NULL
     THEN toInteger(status_current.status_value)
       ELSE 0 END as current_value

// Determine trend
WITH indicator,
     goal,
     evidence_current,
     status_current,
     past_value,
     current_value,
     CASE
       WHEN past_value IS NULL THEN 'improving'  // New evidence
       WHEN current_value > past_value THEN 'improving'
       WHEN current_value = past_value THEN 'static'
       WHEN current_value < past_value THEN 'declining'
       ELSE 'static'  // Fallback
       END AS trend

RETURN {

         indicator_number: indicator.number,
         evidence_year_identifier: evidence_current.year_identifier,
         current_value: current_value,
         past_value: past_value,
         trend: trend
       }
  ORDER BY goal.goal_number, indicator.number