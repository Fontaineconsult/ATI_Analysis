MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(oldYear:AcademicYear {name: $old_year})
WITH e, substring(e.year_identifier, 9) AS rest_of_identifier

// Duplicate the YearSuccessEvidence node
CREATE (e2:YearSuccessEvidence)
SET e2 = e {.*, year_identifier: $new_year + rest_of_identifier }
WITH e, e2

// Process outgoing relationships
CALL {
WITH e, e2
MATCH (e)-[rel_out]->(n)
  WHERE type(rel_out) <> 'evidence_in_year'
WITH e2, type(rel_out) AS relType, properties(rel_out) AS relProps, n
CALL apoc.create.relationship(e2, relType, relProps, n) YIELD rel
RETURN count(*) AS outgoingRelCount
}
WITH e, e2

// Process incoming relationships
CALL {
WITH e, e2
MATCH (n)-[rel_in]->(e)
  WHERE type(rel_in) <> 'evidence_in_year'
WITH e2, type(rel_in) AS relType, properties(rel_in) AS relProps, n
CALL apoc.create.relationship(n, relType, relProps, e2) YIELD rel
RETURN count(*) AS incomingRelCount
}
WITH e2

// Connect e2 to the new academic year
MATCH (newYear:AcademicYear {name: $new_year})
MERGE (e2)-[:evidence_in_year]->(newYear)
RETURN e2