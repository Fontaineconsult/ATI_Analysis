#
# EVIDENCE READ QUERIES
#
from app.database.graph_schema import *



def get_all_academic_years() -> list:
    """
    Get all AcademicYear nodes from the graph
    :return: List of AcademicYear nodes
    """
    return AcademicYear.nodes.all()


def find_year_success_evidence_by_academic_year(academic_year_name):
    """
    Finds all YearSuccessEvidence nodes that relate to the specified AcademicYear through the 'academic_year' relationship
    and also retrieves the linked SuccessIndicator nodes.

    :param academic_year_name: The name of the AcademicYear to filter by.
    :return: List of tuples containing YearSuccessEvidence nodes and their related SuccessIndicator nodes.
    """
    # Find the AcademicYear node by name
    academic_year = AcademicYear.nodes.get(name=academic_year_name)

    # Get all YearSuccessEvidence nodes related to the AcademicYear node
    year_success_evidences = academic_year.year_success_evidences.all()

    results = []
    for yse in year_success_evidences:

        # Get the related SuccessIndicator node
        success_indicators = yse.tracks_success_indicator.single()
        results.append({"year_identifier": yse.year_identifier, "success_indicator": success_indicators.success_indicator})
        results.sort(key=lambda x: float(x["year_identifier"].split('-')[2]))
    return results


def get_yses_by_year_and_implementation(academic_year, implementation_type, implementation_title):
    """
    Finds YearSuccessEvidence nodes that relate to the specified AcademicYear and Implementation node.

    :param academic_year: The name of the AcademicYear to filter by.
    :param implementation_type: The type of the implementation node.
    :param implementation_title: The title of the implementation node.
    :return: List of YearSuccessEvidence nodes that match the criteria.
    """
    # Get the Implementation node by type and title
    implementation = {"process": Process,
                      "project": Project,
                      "procedure": Procedure,
                      "service": Service,
                      "guideline": Guideline}

    implementation_class = implementation[implementation_type]
    implementation_node = implementation_class.nodes.get(title=implementation_title)

    # Get all YearSuccessEvidence nodes related to the Implementation node
    year_success_evidences = implementation_node.is_evidence_for.all()

    # Filter the YearSuccessEvidence nodes to find those that are also related to the specified AcademicYear node
    matching_yses = [yse for yse in year_success_evidences if academic_year in [ay.name for ay in yse.academic_year.all()]]

    results = []
    for yse in matching_yses:
        # Get the StatusLevel node for each YearSuccessEvidence node
        status_level = yse.status_level.single()
        results.append({"year_identifier": yse.year_identifier, "status_level": status_level.status_level})

    # Sort results by the numerical part of the year_identifier
    results.sort(key=lambda x: float(x["year_identifier"].split('-')[2]))

    return results


# print(get_yses_by_year_and_implementation("2020-2021", "process", "Web Accessibility Process V1"))

def get_all_status_level_nodes():
    """
    Get all StatusLevel nodes from the graph
    :return: List of StatusLevel nodes
    """
    return StatusLevel.nodes.all()