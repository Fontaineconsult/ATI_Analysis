from app.database.graph_schema import YearSuccessEvidence
from app.database.queries.implementation.read import (get_all_processes,
                                                      get_all_projects,
                                                      get_all_procedures,
                                                      get_all_services,
                                                      get_all_guidelines,
                                                      get_all_plans)
from neomodel import db


def get_all_implementations(implementation_type):
    """
    Get all implementation nodes from the graph based on the implementation type
    :param implementation_type: Type of the implementation ("process", "project", "procedure", "service", "guideline")
    :return: List of implementation nodes
    """
    implementation_functions = {
        "process": get_all_processes,
        "project": get_all_projects,
        "procedure": get_all_procedures,
        "service": get_all_services,
        "guideline": get_all_guidelines,
        "plan": get_all_plans
    }

    if implementation_type in implementation_functions:
        return implementation_functions[implementation_type]()
    else:
        raise ValueError(f"Invalid implementation type: {implementation_type}."
                         f" Expected one of: {list(implementation_functions.keys())}")


def assign_year_success_evidence_to_academic_year_node(academic_year_name: str) -> bool:
    # Cypher query to find all YearSuccessEvidence nodes where the year_identifier
    # property contains the academic_year_name
    query = f"MATCH (y:YearSuccessEvidence) WHERE y.year_identifier CONTAINS '{academic_year_name}' RETURN y"
    results, _ = db.cypher_query(query)

    # If the query returns no results, raise an exception and return False
    if not results:
        raise ValueError(f"No YearSuccessEvidence nodes found containing '{academic_year_name}' in year_identifier.")
        return False

    # For each YearSuccessEvidence node found, create a relationship evidence_in_year to the AcademicYear node
    for result in results:
        year_success_evidence_node = YearSuccessEvidence.inflate(result[0])
        query = f"""
        MATCH (a:AcademicYear {{name: '{academic_year_name}'}})
        MATCH (y:YearSuccessEvidence {{year_identifier: '{year_success_evidence_node.year_identifier}'}})
        MERGE (y)-[:evidence_in_year]->(a)
        """
        db.cypher_query(query)

    return True

