#
# INDICATOR READ QUERIES
#
from app.database.graph_schema import *



from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

from neomodel import db

# Define the function that executes the query and returns a dictionary of results
def fetch_success_indicators_for_working_group(academic_year):

    query = """
        // Match working groups and their goals
        MATCH (wg:ATIWorkingGroup)-[:responsible_for]->(goal:Goal)
        
        // Match success indicators supported by each goal
        OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)
        
        // Match year-specific evidence for each indicator in the given academic year
        OPTIONAL MATCH (indicator)<-[:tracks]-(evidence:YearSuccessEvidence)
                                 -[:evidence_in_year]->(:AcademicYear {name: $academic_year})
        
        // Collect evidence per indicator
        WITH wg, goal, indicator, collect(DISTINCT evidence) AS yearSuccessIndicators
        
        // Create indicator map including its properties and evidence
        WITH wg, goal, apoc.map.merge(indicator {.*}, {yearSuccessIndicators: yearSuccessIndicators}) AS ind
        
        // Collect indicators per goal
        WITH wg, goal, collect(ind) AS successIndicators
        
        // Create goal map including its properties and indicators
        WITH wg, apoc.map.merge(goal {.*}, {successIndicators: successIndicators}) AS gl
        
        // Collect goals per working group
        WITH wg, collect(gl) AS goals
        
        // Create working group map including its properties and goals
        WITH apoc.map.merge(wg {.*}, {goals: goals}) AS wgMap
        
        // Collect all working group maps
        WITH collect(wgMap) AS wgMaps
        
        // Convert to JSON
        RETURN apoc.convert.toJson(wgMaps) AS jsonResult

            """

    results, meta = db.cypher_query(query, {'academic_year': academic_year})
    if len(results) == 0:
        raise NotFoundError(f"No success indicators found for academic year {academic_year}")
    # Return the duplicated nodes (e2)
    return results


