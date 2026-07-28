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
        
        // Match success indicators supported by each goal.
        // Year-gate: hide SIs introduced after the viewed year (a null introduced_in_year is
        // a legacy "always existed" SI; the "YYYY-YYYY" format compares chronologically).
        OPTIONAL MATCH (goal)-[:supported_by]->(indicator:SuccessIndicator)
            WHERE indicator.introduced_in_year IS NULL
               OR indicator.introduced_in_year <= $academic_year

        // Match year-specific evidence for each indicator in the given academic year
        OPTIONAL MATCH (indicator)<-[:tracks]-(evidence:YearSuccessEvidence)
                                 -[:evidence_in_year]->(:AcademicYear {name: $academic_year})
        
        // Collect evidence per indicator
        WITH wg, goal, indicator, collect(DISTINCT evidence) AS yearSuccessIndicators
        
        // Create indicator map including its properties and evidence.
        // A goal whose indicators are all filtered out (e.g. year-gated) must produce an
        // EMPTY successIndicators list — merging the null indicator would emit a phantom
        // {yearSuccessIndicators: []} entry. CASE yields null so collect() drops it.
        WITH wg, goal,
             CASE WHEN indicator IS NULL THEN NULL
                  ELSE apoc.map.merge(indicator {.*}, {yearSuccessIndicators: yearSuccessIndicators})
             END AS ind
        
        // Collect indicators per goal
        WITH wg, goal, collect(ind) AS successIndicators

        // Year-view contract: a goal appears in a year's payload ONLY if at least one
        // of its indicators is visible that year (passes the introduced_in_year gate
        // above). A goal whose entire indicator set post-dates the viewed year — e.g.
        // the com/gov goals before 2026-2027 — is dropped, and a working group whose
        // goals all drop disappears from the payload with it. Removed indicators still
        // count as visible (history stays in settings); the gate is the year, not the
        // removed flag.
        WHERE size(successIndicators) > 0

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


