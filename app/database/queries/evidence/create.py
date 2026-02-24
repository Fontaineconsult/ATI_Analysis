#
# EVIDENCE CREATE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError

def create_year_success_evidence_node(academic_year, success_indicator_composite_key, status_level, campus_abbreviation):
    try:
        academic_year_node = AcademicYear.nodes.get(name=academic_year)
    except AcademicYear.DoesNotExist:
        raise NotFoundError(f"AcademicYear with name '{academic_year}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve AcademicYear: {e}")

    try:
        success_indicator_node = SuccessIndicator.nodes.get(composite_key=success_indicator_composite_key)
    except SuccessIndicator.DoesNotExist:
        raise NotFoundError(f"SuccessIndicator with composite_key '{success_indicator_composite_key}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve SuccessIndicator: {e}")

    try:
        status_level_node = StatusLevel.nodes.get(status_level=status_level)
    except StatusLevel.DoesNotExist:
        raise NotFoundError(f"StatusLevel with level '{status_level}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve StatusLevel: {e}")

    try:
        campus_node = Campus.nodes.get(abbreviation=campus_abbreviation)
    except Campus.DoesNotExist:
        raise NotFoundError(f"Campus with abbreviation '{campus_abbreviation}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve Campus: {e}")

    try:
        year_identifier = f"{academic_year_node.name}-{success_indicator_node.composite_key}-{campus_node.abbreviation}"
        # Check if YearSuccessEvidence node already exists
        if not YearSuccessEvidence.nodes.filter(year_identifier=year_identifier):
            new_yse = YearSuccessEvidence(year_identifier=year_identifier)
            new_yse.save()

            # Get the new yse node
            yse_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)

            # Establish relationships
            yse_node.academic_year.connect(academic_year_node)
            yse_node.tracks_success_indicator.connect(success_indicator_node)
            yse_node.status_level.connect(status_level_node)
            yse_node.campus.connect(campus_node)
        else:
            raise CrudError(f"YearSuccessEvidence node with identifier '{year_identifier}' already exists.")

    except Exception as e:
        raise CrudError(f"Error creating YearSuccessEvidence node: {e}")


#
# create_year_success_evidence_node('2020-2021',
#                                   "2.4-ins",
#                                   "Established")

