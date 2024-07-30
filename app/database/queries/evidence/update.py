#
# EVIDENCE UPDATE QUERIES
#
from app.database.graph_schema import *

def assign_implementation_to_year_success_indicator(year_success_identifier: str,
                                              implementation_type: str,
                                              implementation_title:str) -> bool:

    implementation = {"process": Process,
                      "project": Project,
                      "procedure": Procedure,
                      "service": Service,
                      "guideline": Guideline}

    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        implementation_class = implementation[implementation_type]
        implementation_node = implementation_class.nodes.get(title=implementation_title)

        # Check if the relationship already exists
        if implementation_node.is_evidence_for.is_connected(year_success_evidence):
            raise Exception(f"Implementation {implementation_title} is already assigned to success indicator {year_success_identifier}")
            return False

        implementation_node.is_evidence_for.connect(year_success_evidence)
        print(f"Implementation {implementation_title} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False


def assign_status_to_yse(year_success_identifier: str, status: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        status_level = StatusLevel.nodes.get(status_level=status)

        # Disconnect any existing status level
        if year_success_evidence.status_level.is_connected():
            year_success_evidence.status_level.disconnect_all()

        # Connect the new status level
        year_success_evidence.status_level.connect(status_level)

        print(f"Status of success indicator {year_success_identifier} set to {status}")
        return True
    except Exception as e:
        print(e)
        return False