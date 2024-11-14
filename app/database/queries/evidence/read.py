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


