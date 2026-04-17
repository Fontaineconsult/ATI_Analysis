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


SUB_NODE_MAP = {
    'procedure_descriptions': (ProcedureDescription, 'procedure_descriptions', 'description'),
    'procedure_requirements': (ProcedureRequirement, 'procedure_requirements', 'requirement_description'),
    'resource_descriptions': (ResourceDescription, 'resource_descriptions', 'description'),
    'resource_requirements': (ResourceRequirement, 'resource_requirements', 'requirement_description'),
    'documentation_descriptions': (DocumentationDescription, 'documentation_descriptions', 'description'),
    'documentation_requirements': (DocumentationRequirement, 'documentation_requirements', 'requirement_description'),
    'documentation_evidence_descriptions': (DocumentationEvidenceDescription, 'documentation_evidence_descriptions', 'description'),
    'documentation_evidence_requirements': (DocumentationEvidenceRequirement, 'documentation_evidence_requirements', 'requirement_description'),
}


def get_all_sub_nodes(category):
    """
    Fetch all existing nodes of a given sub-node type.
    """
    if category not in SUB_NODE_MAP:
        raise CrudError(f"Invalid category '{category}'.")

    node_class, _, text_field = SUB_NODE_MAP[category]
    try:
        nodes = node_class.nodes.all()
        return [{'unique_id': n.unique_id, text_field: getattr(n, text_field)} for n in nodes]
    except Exception as e:
        raise CrudError(f"Failed to fetch {node_class.__name__} nodes: {e}")


def add_status_level_sub_node(status_level_unique_id, category, text):
    """
    Create a new sub-node and connect it to a StatusLevel.
    """
    if category not in SUB_NODE_MAP:
        raise CrudError(f"Invalid category '{category}'. Valid: {list(SUB_NODE_MAP.keys())}")

    node_class, rel_attr, text_field = SUB_NODE_MAP[category]

    try:
        status_level = StatusLevel.nodes.get(unique_id=status_level_unique_id)
    except StatusLevel.DoesNotExist:
        raise NotFoundError(f"StatusLevel with unique_id '{status_level_unique_id}' not found.")

    try:
        sub_node = node_class(**{text_field: text})
        sub_node.save()
        rel = getattr(status_level, rel_attr)
        rel.connect(sub_node)
        return {'unique_id': sub_node.unique_id, text_field: text}
    except Exception as e:
        raise CrudError(f"Failed to create {node_class.__name__}: {e}")


def connect_sub_node_to_status_level(status_level_unique_id, category, sub_node_unique_id):
    """
    Connect an existing sub-node to a StatusLevel.
    """
    if category not in SUB_NODE_MAP:
        raise CrudError(f"Invalid category '{category}'.")

    node_class, rel_attr, text_field = SUB_NODE_MAP[category]

    try:
        status_level = StatusLevel.nodes.get(unique_id=status_level_unique_id)
    except StatusLevel.DoesNotExist:
        raise NotFoundError(f"StatusLevel with unique_id '{status_level_unique_id}' not found.")

    try:
        sub_node = node_class.nodes.get(unique_id=sub_node_unique_id)
    except node_class.DoesNotExist:
        raise NotFoundError(f"{node_class.__name__} with unique_id '{sub_node_unique_id}' not found.")

    rel = getattr(status_level, rel_attr)
    if rel.is_connected(sub_node):
        raise CrudError(f"{node_class.__name__} is already connected to this StatusLevel.")

    try:
        rel.connect(sub_node)
        return {'unique_id': sub_node.unique_id, text_field: getattr(sub_node, text_field)}
    except Exception as e:
        raise CrudError(f"Failed to connect {node_class.__name__}: {e}")


def create_status_level(data):
    """
    Create a new StatusLevel node.
    """
    status_level_name = data.get('status_level')
    if not status_level_name:
        raise CrudError("Missing required field: 'status_level'")

    # Check uniqueness
    existing = StatusLevel.nodes.filter(status_level=status_level_name)
    if existing:
        raise CrudError(f"StatusLevel '{status_level_name}' already exists.")

    try:
        node = StatusLevel(
            status_level=status_level_name,
            status_value=data.get('status_value', ''),
            description_of_procedures=data.get('description_of_procedures', ''),
            description_of_documentation=data.get('description_of_documentation', ''),
            description_of_documentation_evidence=data.get('description_of_documentation_evidence', ''),
            description_of_resources=data.get('description_of_resources', ''),
            ati_report_evidence_column=data.get('ati_report_evidence_column', ''),
        )
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to create StatusLevel: {e}")

