// Campus-aware Academic Year Migration Query
// Duplicates all YSE nodes from $old_year to $new_year across all campuses.
// Copies all relationships except evidence_in_year (which gets pointed to the new year).
// Skips any YSE that already exists in the new year.
// Run with parameters: {old_year: "2024-2025", new_year: "2025-2026", year_prefix_length: 9}
// $year_prefix_length is the length of the "YYYY-YYYY" academic-year prefix.
// Canonical value lives in app/database/identifiers.py (YEAR_PREFIX_LENGTH).

// Step 1: Ensure the new AcademicYear node exists
MERGE (newYear:AcademicYear {name: $new_year})

WITH newYear

// Step 2: Find all YSE nodes from the old year (across all campuses)
MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(oldYear:AcademicYear {name: $old_year})
OPTIONAL MATCH (e)-[:evidence_at_campus]->(campus:Campus)
WITH e, newYear, campus,
     $new_year + substring(e.year_identifier, $year_prefix_length) AS new_year_identifier

// Skip if already exists
OPTIONAL MATCH (existing:YearSuccessEvidence {year_identifier: new_year_identifier})
WITH e, newYear, campus, new_year_identifier, existing
WHERE existing IS NULL

// Step 3: Create the new YSE node
CREATE (e2:YearSuccessEvidence)
SET e2.year_identifier = new_year_identifier
SET e2.unique_id = randomUUID()

// Copy optional properties (but NOT admin review fields — those get reset)
FOREACH (ignoreMe IN CASE WHEN e.documentation_status IS NOT NULL THEN [1] ELSE [] END |
    SET e2.documentation_status = e.documentation_status)
FOREACH (ignoreMe IN CASE WHEN e.resources_status IS NOT NULL THEN [1] ELSE [] END |
    SET e2.resources_status = e.resources_status)
FOREACH (ignoreMe IN CASE WHEN e.implementation_plan_status IS NOT NULL THEN [1] ELSE [] END |
    SET e2.implementation_plan_status = e.implementation_plan_status)

// Reset admin review fields on new nodes
SET e2.administrative_review_complete = false
SET e2.ready_for_admin_review = false
SET e2.worked_on_in_current_year = false
SET e2.will_work_on_next_year = false

WITH e, e2, newYear, campus

// Step 4: Copy outgoing relationships (except evidence_in_year)
CALL {
    WITH e, e2
    MATCH (e)-[rel_out]->(n)
    WHERE type(rel_out) <> 'evidence_in_year'
      AND type(rel_out) <> 'admin_review_completed_by'
      AND type(rel_out) <> 'admin_review_note'
      AND type(rel_out) <> 'can_be_reviewed_by'
    WITH e2, type(rel_out) AS relType, properties(rel_out) AS relProps, n
    CALL apoc.create.relationship(e2, relType, relProps, n) YIELD rel
    RETURN count(*) AS outgoingRelCount
}
WITH e, e2, newYear, campus

// Step 5: Copy incoming relationships (except evidence_in_year)
CALL {
    WITH e, e2
    MATCH (n)-[rel_in]->(e)
    WHERE type(rel_in) <> 'evidence_in_year'
    WITH e2, type(rel_in) AS relType, properties(rel_in) AS relProps, n
    CALL apoc.create.relationship(n, relType, relProps, e2) YIELD rel
    RETURN count(*) AS incomingRelCount
}
WITH e2, newYear, campus

// Step 6: Connect to the new academic year
MERGE (e2)-[:evidence_in_year]->(newYear)

RETURN e2.year_identifier AS created_identifier,
       COALESCE(campus.abbreviation, 'unknown') AS campus
ORDER BY campus, created_identifier
