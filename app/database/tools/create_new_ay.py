from neomodel import db


def duplicate_year_success_evidence(old_year, new_year):
    query = """
    MATCH (e:YearSuccessEvidence)-[r:evidence_in_year]->(year:AcademicYear {name: $old_year})
    WITH e, r, year
    CALL {
        WITH e
        CREATE (e2:YearSuccessEvidence)
        SET e2 = e {.*, year_identifier: replace(e.year_identifier, $old_year, $new_year) }

        WITH e, e2
        MATCH (e)-[rel]->(n)
        CREATE (e2)-[newRel:type(rel)]->(n)
    }
    RETURN e2
    """

    results, meta = db.cypher_query(query, {'old_year': old_year, 'new_year': new_year})

    # Return the results (the duplicated nodes)
    return results

duplicate_year_success_evidence('2020-2021', '2022-2023')