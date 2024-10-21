#
# IMPLEMENTATION UPDATE QUERIES
#
from app.database.graph_schema import *
from app.database.class_factory import implementation_classes, documentation_classes, documentation_relationships
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError

def assign_documentation_to_implementation(implementation_title, implementation_type, documentation_type, documentation_title):
    # Validate the implementation_type and documentation_type
    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")
    if documentation_type not in documentation_classes:
        raise ValidationError(f"Invalid documentation_type: {documentation_type}")

    try:
        implementation_class = implementation_classes[implementation_type]
        implementation_node = implementation_class.nodes.get(title=implementation_title)
    except implementation_class.DoesNotExist:
        raise NotFoundError(f"No implementation node found with title: {implementation_title}")

    try:
        documentation_class = documentation_classes[documentation_type]
        documentation_node = documentation_class.nodes.get(name=documentation_title)
    except documentation_class.DoesNotExist:
        raise NotFoundError(f"No documentation node found with title: {documentation_title}")

    relationship = getattr(implementation_node, documentation_relationships[documentation_type])
    relationship.connect(documentation_node)

    return True


def assign_person_as_implementor(employee_name, year_identifier):
    try:
        person_node = Person.nodes.get(name=employee_name)
    except Person.DoesNotExist:
        raise NotFoundError(f"No Person node found with name: {employee_name}")

    try:
        year_success_evidence_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"No YearSuccessEvidence node found with year_identifier: {year_identifier}")

    person_node.implements_yse.connect(year_success_evidence_node)

    return True


def assign_note_to_implementation(implementation_title, implementation_type, note_title):
    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")

    try:
        implementation_class = implementation_classes[implementation_type]
        implementation_node = implementation_class.nodes.get(title=implementation_title)
    except implementation_class.DoesNotExist:
        raise NotFoundError(f"No implementation node found with title: {implementation_title}")

    try:
        note = Note.nodes.get(name=note_title)
    except Note.DoesNotExist:
        raise NotFoundError(f"No note node found with title: {note_title}")

    implementation_node.supporting_notes.connect(note)

    return True
