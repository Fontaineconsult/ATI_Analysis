from app.database.graph_schema import *
from app.database.identifiers import YEAR_PREFIX_LENGTH
from neomodel import db




def duplicate_year_success_evidence(old_year, new_year):
    # First, let's see what properties these nodes have
    inspect_query = """
        MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(oldYear:AcademicYear {name: $old_year})
        WITH e LIMIT 1
        RETURN keys(e) AS properties
    """

    results, _ = db.cypher_query(inspect_query, {'old_year': old_year})
    if results:
        print(f"YearSuccessEvidence properties: {results[0][0]}")

    # Now let's do the duplication with a different approach
    query = """
        MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(oldYear:AcademicYear {name: $old_year})
        WITH e, $new_year + substring(e.year_identifier, $year_prefix_length) AS new_year_identifier
        
        // Check if a node with this year_identifier already exists
        OPTIONAL MATCH (existing:YearSuccessEvidence {year_identifier: new_year_identifier})
        WITH e, new_year_identifier, existing
        WHERE existing IS NULL  // Only proceed if no existing node found
        
        // Create the new node with the correct identifiers from the start
        // We'll manually set each property we want to copy
        CREATE (e2:YearSuccessEvidence)
        SET e2.year_identifier = new_year_identifier
        SET e2.unique_id = randomUUID()
        
        // Now copy other properties one by one (we'll need to know what they are)
        // This is a workaround - we set each property individually
        FOREACH (ignoreMe IN CASE WHEN e.description IS NOT NULL THEN [1] ELSE [] END |
            SET e2.description = e.description)
        FOREACH (ignoreMe IN CASE WHEN e.status IS NOT NULL THEN [1] ELSE [] END |
            SET e2.status = e.status)
        FOREACH (ignoreMe IN CASE WHEN e.created_at IS NOT NULL THEN [1] ELSE [] END |
            SET e2.created_at = e.created_at)
        FOREACH (ignoreMe IN CASE WHEN e.updated_at IS NOT NULL THEN [1] ELSE [] END |
            SET e2.updated_at = e.updated_at)
        // Add more FOREACH statements for other properties as needed
        
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
        
        // Process incoming relationships. Retired implementations do NOT carry
        // forward (kept in sync with create_new_ay_campus.py).
        CALL {
            WITH e, e2
            MATCH (n)-[rel_in]->(e)
            WHERE type(rel_in) <> 'evidence_in_year'
              AND NOT (type(rel_in) = 'is_evidence_for' AND coalesce(n.retired, false))
            WITH e2, type(rel_in) AS relType, properties(rel_in) AS relProps, n
            CALL apoc.create.relationship(n, relType, relProps, e2) YIELD rel
            RETURN count(*) AS incomingRelCount
        }
        WITH e2
        
        // Connect e2 to the new academic year
        MATCH (newYear:AcademicYear {name: $new_year})
        MERGE (e2)-[:evidence_in_year]->(newYear)
        RETURN e2, e2.year_identifier AS created_identifier
    """

    results, meta = db.cypher_query(query, {'old_year': old_year, 'new_year': new_year, 'year_prefix_length': YEAR_PREFIX_LENGTH})

    print(f"\nDuplicated {len(results)} YearSuccessEvidence nodes from {old_year} to {new_year}")
    if results:
        print("Sample created identifiers:")
        for row in results[:3]:
            print(f"  {row[1]}")

    return results



def reset_admin_review_for_year(year):
    """
    Reset administrative review status for all YearSuccessEvidence nodes in a given year.
    This will:
    - Set administrative_review_complete to false
    - Remove administrative_review_completed_date
    - Delete the admin_review_completed_by relationship
    """

    query = """
        MATCH (e:YearSuccessEvidence)-[:evidence_in_year]->(year:AcademicYear {name: $year})
        
        // Set administrative_review_complete to false
        SET e.administrative_review_complete = false
        
        // Remove the completed date
        REMOVE e.administrative_review_completed_date
        
        WITH e, year
        
        // Delete the admin_review_completed_by relationship if it exists
        OPTIONAL MATCH (e)-[rel:admin_review_completed_by]->(person:Person)
        DELETE rel
        
        WITH e, year, person
        RETURN count(DISTINCT e) AS nodes_reset, 
               count(DISTINCT person) AS relationships_removed,
               year.name AS year_name
    """

    results, meta = db.cypher_query(query, {'year': year})

    if results:
        nodes_reset = results[0][0]
        relationships_removed = results[0][1]
        year_name = results[0][2]

        print(f"Reset administrative review for {year_name}:")
        print(f"  - {nodes_reset} YearSuccessEvidence nodes reset")
        print(f"  - {relationships_removed} admin_review_completed_by relationships removed")
        print(f"  - All administrative_review_completed_date values cleared")
        print(f"  - All administrative_review_complete flags set to false")
    else:
        print(f"No YearSuccessEvidence nodes found for year {year}")

    return results



if __name__ == '__main__':
    # update_remote()
    # clean_duplicate_year_evidence("2024-2025")
    duplicate_year_success_evidence('2023-2024', '2024-2025')
    reset_admin_review_for_year('2024-2025')