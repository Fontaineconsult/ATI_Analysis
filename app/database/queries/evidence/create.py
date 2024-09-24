#
# EVIDENCE CREATE QUERIES
#
from app.database.graph_schema import *

def create_year_success_evidence_node(academic_year, success_indicator_composite_key, status_level):


    academic_year = AcademicYear.nodes.get(name=academic_year)
    success_indicator = SuccessIndicator.nodes.get(composite_key=success_indicator_composite_key)
    status_level = StatusLevel.nodes.get(status_level=status_level)


    #check if YearSuccessEvidence node already exists
    if not YearSuccessEvidence.nodes.filter(year_identifier=f"{academic_year.name}-{success_indicator.composite_key}"):
        YearSuccessEvidence(year_identifier=f"{academic_year.name}-{success_indicator.composite_key}").save()

    #get the new yse node
    yse_node = YearSuccessEvidence.nodes.get(year_identifier=f"{academic_year.name}-{success_indicator.composite_key}")

    yse_node.academic_year.connect(academic_year)
    yse_node.tracks_success_indicator.connect(success_indicator)
    yse_node.status_level.connect(status_level)




