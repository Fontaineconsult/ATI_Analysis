from app.database.graph_schema import *
from app.database.class_factory import implementation_classes
from app.endpoints.data_api.errors.custom_exceptions import CrudError
from neomodel import db


def get_all_academic_years() -> list:
    """
    Get all AcademicYear nodes from the graph.
    :return: List of AcademicYear nodes.
    """
    try:
        return AcademicYear.nodes.all()
    except Exception as e:
        raise CrudError(f"Error retrieving academic years: {e}")


def find_year_success_evidence_by_academic_year(academic_year_name: str) -> list:
    """
    Finds all YearSuccessEvidence nodes that relate to the specified AcademicYear through the 'academic_year' relationship
    and also retrieves the linked SuccessIndicator nodes.

    :param academic_year_name: The name of the AcademicYear to filter by.
    :return: List of dictionaries containing YearSuccessEvidence nodes and their related SuccessIndicator nodes.
    """
    try:
        academic_year = AcademicYear.nodes.get(name=academic_year_name)
        year_success_evidences = academic_year.year_success_evidences.all()

        results = []
        for yse in year_success_evidences:
            success_indicator = yse.tracks_success_indicator.single()
            results.append({
                "year_identifier": yse.year_identifier,
                "success_indicator": success_indicator.success_indicator
            })
        results.sort(key=lambda x: float(x["year_identifier"].split('-')[2]))

        return results
    except Exception as e:
        raise CrudError(f"Error finding YearSuccessEvidence by academic year {academic_year_name}: {e}")


def get_yses_by_year_and_implementation(academic_year: str, implementation_type: str, implementation_title: str) -> list:
    """
    Finds YearSuccessEvidence nodes that relate to the specified AcademicYear and Implementation node.

    :param academic_year: The name of the AcademicYear to filter by.
    :param implementation_type: The type of the implementation node.
    :param implementation_title: The title of the implementation node.
    :return: List of YearSuccessEvidence nodes that match the criteria.
    """
    try:
        implementation_class = implementation_classes[implementation_type]
        implementation_node = implementation_class.nodes.get(title=implementation_title)

        year_success_evidences = implementation_node.is_evidence_for.all()

        matching_yses = [yse for yse in year_success_evidences if academic_year in [ay.name for ay in yse.academic_year.all()]]

        results = []
        for yse in matching_yses:
            status_level = yse.status_level.single()
            results.append({
                "year_identifier": yse.year_identifier,
                "status_level": status_level.status_level
            })

        results.sort(key=lambda x: float(x["year_identifier"].split('-')[2]))

        return results
    except Exception as e:
        raise CrudError(f"Error getting YearSuccessEvidence by year {academic_year}, implementation {implementation_title}: {e}")


def get_all_status_level_nodes() -> list:
    """
    Get all StatusLevel nodes from the graph.
    :return: List of StatusLevel nodes.
    """
    try:
        return StatusLevel.nodes.all()
    except Exception as e:
        raise CrudError(f"Error retrieving status levels: {e}")


def get_connected_status_levels() -> list:
    """
    Retrieves all StatusLevel nodes along with their connected nodes.
    :return: List of dictionaries containing StatusLevel data and connected nodes.
    """
    try:
        # Read the Cypher query from the file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Construct the absolute path to the query file
        query_file_path = os.path.join(current_dir, '../../batch/status_levels.cypher')
        # Normalize the path
        query_file_path = os.path.normpath(query_file_path)


        with open(query_file_path, 'r') as file:
            query = file.read()


        # Execute the query
        results, meta = db.cypher_query(query)

        # Extract the data from the results
        status_levels = [record[0] for record in results]

        return status_levels
    except Exception as e:
        raise CrudError(f"Error retrieving connected status levels: {e}")


def get_evidence_trends(past_year, current_year, working_group=None):
    """
    Looks at previous year and current year and determines, per success indicator,
    if the current is lower, same or higher than the past.

    :param past_year: The earlier academic year to compare (e.g., "2022-2023")
    :param current_year: The later academic year to compare (e.g., "2023-2024")
    :param working_group: Optional - specific working group name. If None, returns all three groups.
    :return: Dictionary with trends for each working group or list if single group specified
    """

    try:
        # Read the Cypher query from the file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Construct the absolute path to the query file
        query_file_path = os.path.join(current_dir, '../../batch/trends.cypher')
        # Normalize the path
        query_file_path = os.path.normpath(query_file_path)

        with open(query_file_path, 'r') as file:
            query = file.read()

        # If a specific working group is requested, return just that
        if working_group:
            params = {
                'past_year': past_year,
                'current_year': current_year,
                'working_group': working_group
            }

            results, meta = db.cypher_query(query, params)
            trends = [record[0] for record in results]
            return trends

        # Otherwise, get trends for all three ATI working groups
        working_groups = ['Web', 'Instructional Materials', 'Procurement']
        combined_trends = {}

        for wg in working_groups:
            params = {
                'past_year': past_year,
                'current_year': current_year,
                'working_group': wg
            }

            results, meta = db.cypher_query(query, params)
            trends = [record[0] for record in results]
            combined_trends[wg] = trends

        # Add summary statistics
        combined_trends['summary'] = {
            'past_year': past_year,
            'current_year': current_year,
            'total_indicators': sum(len(trends) for trends in combined_trends.values() if isinstance(trends, list)),
            'by_working_group': {
                wg: {
                    'total': len(combined_trends[wg]),
                    'improving': len([t for t in combined_trends[wg] if t['trend'] == 'improving']),
                    'static': len([t for t in combined_trends[wg] if t['trend'] == 'static']),
                    'declining': len([t for t in combined_trends[wg] if t['trend'] == 'declining'])
                }
                for wg in working_groups
            }
        }

        return combined_trends

    except Exception as e:
        raise CrudError(f"Error retrieving evidence trends: {e}")
