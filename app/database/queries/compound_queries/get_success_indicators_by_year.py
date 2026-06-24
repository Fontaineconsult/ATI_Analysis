
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

from neomodel import db

# Define the function that executes the query and returns a dictionary of results
def fetch_evidence_for_working_group(academic_year):

    query = """
        MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
        OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)
        OPTIONAL MATCH (indicator)<-[:tracks]-(evidence:YearSuccessEvidence)
                         -[:evidence_in_year]->(year:AcademicYear {name: $academic_year})
        
        WITH wg, goal, indicator, collect(DISTINCT evidence) AS yearSuccessIndicators
        
        WITH wg, goal, indicator { .*, yearSuccessIndicators: yearSuccessIndicators } AS ind
        
        WITH wg, goal, collect(ind) AS successIndicators
        
        WITH wg, goal { .*, successIndicators: successIndicators } AS gl
        
        WITH wg, collect(gl) AS goals
        
        RETURN wg {
          .*,
          goals: goals
        }


            """

    results, meta = db.cypher_query(query, {'academic_year': academic_year})
    if len(results) == 0:
        raise NotFoundError(f"No success indicators found for academic year {academic_year}")
    # Return the duplicated nodes (e2)
    return results


