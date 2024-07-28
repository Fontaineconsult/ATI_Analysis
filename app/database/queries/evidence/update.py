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
        implementation_node.is_evidence_for.connect(year_success_evidence)
        print(f"Implementation {implementation_title} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False


