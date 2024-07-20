#
# EVIDENCE UPDATE QUERIES
#
from app.database.graph_schema import *

def assign_implementation_to_success_indicator(year_success_identifier: str,
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
        implementation_node = implementation_class(title=implementation_title).save()
        year_success_evidence.implements.connect(implementation_node)
        print("Implementation assigned to success indicator")
        return True
