// trends.cypher
// Per success indicator, compares the current academic year's maturity status against the
// prior year's and labels the change improving / static / declining.
// Parameters: $working_group, $past_year, $current_year, $campus_abbreviation
//
// MUST be campus-scoped. YearSuccessEvidence is per-campus (its year_identifier ends in the
// campus abbreviation, e.g. '2025-2026-1.1-web-csueb'), so an indicator has one YSE *per
// campus per year*. Without a campus filter, (indicator)<-[:tracks]-(YSE) matches every
// campus's evidence and the current<->past comparison becomes a cross-campus cartesian
// (e.g. csueb's current value compared against ssu's past value), producing duplicate rows
// with contradictory trends. Scope BOTH the current and past evidence to $campus_abbreviation
// so the comparison is like-for-like for one campus.
//
// (trends_campus.cypher is a duplicate of this campus-scoped logic, retained for the unused
//  *_campus endpoint shadow — consolidate when that migration lands.)

MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
  WHERE wg.name = $working_group

MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)
  WHERE indicator.removed IS NULL OR indicator.removed = false

// Current-year evidence (required), scoped to the campus.
MATCH (indicator)<-[:tracks]-(evidence_current:YearSuccessEvidence)
        -[:evidence_in_year]->(:AcademicYear {name: $current_year})
OPTIONAL MATCH (evidence_current)-[:evidence_at_campus]->(campus_current:Campus)
WITH wg, goal, indicator, evidence_current, campus_current
  WHERE $campus_abbreviation IS NULL OR campus_current.abbreviation = $campus_abbreviation

// Status for the current year.
OPTIONAL MATCH (evidence_current)-[:status_is]->(status_current:StatusLevel)

// Prior-year evidence (optional), scoped to the SAME campus so the comparison is like-for-like.
OPTIONAL MATCH (indicator)<-[:tracks]-(evidence_past:YearSuccessEvidence)
                 -[:evidence_in_year]->(:AcademicYear {name: $past_year})
OPTIONAL MATCH (evidence_past)-[:evidence_at_campus]->(campus_past:Campus)
WITH indicator, goal, evidence_current, campus_current, status_current, evidence_past, campus_past
  WHERE evidence_past IS NULL
     OR $campus_abbreviation IS NULL
     OR campus_past.abbreviation = $campus_abbreviation

OPTIONAL MATCH (evidence_past)-[:status_is]->(status_past:StatusLevel)

// Convert status_value (stored as a string) to an integer for comparison.
WITH indicator,
     goal,
     evidence_current,
     campus_current,
     status_current,
     CASE WHEN status_past.status_value IS NOT NULL
       THEN toInteger(status_past.status_value)
       ELSE null END AS past_value,
     CASE WHEN status_current.status_value IS NOT NULL
       THEN toInteger(status_current.status_value)
       ELSE 0 END AS current_value

// Determine trend.
WITH indicator,
     goal,
     evidence_current,
     campus_current,
     past_value,
     current_value,
     CASE
       WHEN past_value IS NULL THEN 'improving'   // no prior-year evidence at this campus → treated as new/up
       WHEN current_value > past_value THEN 'improving'
       WHEN current_value = past_value THEN 'static'
       WHEN current_value < past_value THEN 'declining'
       ELSE 'static'  // Fallback
       END AS trend

RETURN {
         indicator_number: indicator.number,
         composite_key: indicator.composite_key,
         evidence_year_identifier: evidence_current.year_identifier,
         campus: campus_current.abbreviation,
         current_value: current_value,
         past_value: past_value,
         trend: trend
       }
  ORDER BY goal.goal_number, indicator.number
