#
# IMPLEMENTATION UPDATE QUERIES
#
from app.database.graph_schema import *
from app.database.class_factory import implementation_classes, documentation_classes, documentation_relationships
def assign_documentation_to_implementation(implementation_title,
                                           implementation_type,
                                           documentation_type,
                                           documentation_title):


    # Validate the implementation_type and documentation_type
    if implementation_type not in implementation_classes:
        raise ValueError(f"Invalid implementation_type: {implementation_type}")
    if documentation_type not in documentation_classes:
        raise ValueError(f"Invalid documentation_type: {documentation_type}")

    # Retrieve the implementation node
    implementation_class = implementation_classes[implementation_type]
    try:
        implementation_node = implementation_class.nodes.get(title=implementation_title)
    except implementation_class.DoesNotExist:
        raise ValueError(f"No implementation node found with title: {implementation_title}")

    # Retrieve the documentation node
    documentation_class = documentation_classes[documentation_type]
    try:
        documentation_node = documentation_class.nodes.get(name=documentation_title)
    except documentation_class.DoesNotExist:
        raise ValueError(f"No documentation node found with title: {documentation_title}")

    # Establish a relationship between the implementation node and the documentation node
    relationship = getattr(implementation_node, documentation_relationships[documentation_type])
    relationship.connect(documentation_node)

    return True


def assign_person_as_implementor(employee_name, year_identifier):
    # Retrieve the Person node
    try:
        person_node = Person.nodes.get(name=employee_name)
    except Person.DoesNotExist:
        raise ValueError(f"No Person node found with name: {employee_name}")

    # Retrieve the YearSuccessEvidence node
    try:
        year_success_evidence_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise ValueError(f"No YearSuccessEvidence node found with year_identifier: {year_identifier}")

    # Establish a relationship between the Person node and the YearSuccessEvidence node
    person_node.implements_yse.connect(year_success_evidence_node)

    return True