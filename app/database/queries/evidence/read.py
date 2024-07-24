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

    return results


