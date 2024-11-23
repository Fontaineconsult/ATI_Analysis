#
# IMPLEMENTATION UPDATE QUERIES
#
from app.database.graph_schema import *
from app.database.class_factory import implementation_classes, documentation_classes, documentation_relationships
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError


def assign_documentation_to_implementation(implementation_id, implementation_type, documentation_type, documentation_id):
    # Validate the implementation_type and documentation_type
    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")
    if documentation_type not in documentation_classes:
        raise ValidationError(f"Invalid documentation_type: {documentation_type}")

    try:
        implementation_class = implementation_classes[implementation_type]
        implementation_node = implementation_class.nodes.get(unique_id=implementation_id)
    except implementation_class.DoesNotExist:
        raise NotFoundError(f"No implementation node found with id: {implementation_id}")

    try:
        documentation_class = documentation_classes[documentation_type]
        documentation_node = documentation_class.nodes.get(unique_id=documentation_id)
    except documentation_class.DoesNotExist:
        raise NotFoundError(f"No documentation node found with id: {documentation_id}")

    relationship = getattr(implementation_node, documentation_relationships[documentation_type])

    # Check if the relationship already exists
    if relationship.is_connected(documentation_node):
        raise ValidationError(f"The relationship between implementation {implementation_id} and documentation {documentation_id} already exists.")

    relationship.connect(documentation_node)

    return True


def assign_person_as_implementor(unique_id, year_identifier):
    try:
        person_node = Person.nodes.get(unique_id=unique_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"No Person node found with name: {unique_id}")

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


def update_plan(data: dict) -> bool:
    """
    Update an existing plan based on the provided data.

    :param data: A dictionary containing the plan's properties and relationships to update.
    :return: True if the plan was successfully updated.
    """

    try:
        # Retrieve the existing plan by unique_id
        unique_id = data.get('unique_id')
        if not unique_id:
            raise ValidationError("Missing required field: 'unique_id'")

        plan = Plan.nodes.get(unique_id=unique_id)

        # Update plan properties
        plan.description = data.get('description', plan.description)
        plan.is_key_plan = data.get('is_key_plan', plan.is_key_plan)
        plan.is_campus_plan = data.get('is_campus_plan', plan.is_campus_plan)
        plan.plan_status = data.get('plan_status', plan.plan_status)
        plan.abandoned = data.get('abandoned', plan.abandoned)
        plan.abandoned_notes = data.get('abandoned_notes', plan.abandoned_notes)
        plan.name = data.get('name', plan.name)

        # Save the updated properties
        plan.save()

        # Update academic year relationship
        academic_year_name = data.get('academic_year_name')
        if academic_year_name:
            academic_year = AcademicYear.nodes.get_or_none(name=academic_year_name)
            if academic_year:
                plan.academic_year.disconnect_all()  # Clear any existing academic year relation
                plan.academic_year.connect(academic_year)

        # Update completed year relationship (if provided)
        completed_year_name = data.get('completed_year_name')
        if completed_year_name:
            completed_year = AcademicYear.nodes.get_or_none(name=completed_year_name)
            if completed_year:
                plan.completed_year.disconnect_all()  # Clear any existing completed year relation
                plan.completed_year.connect(completed_year)

        # Update furthered goal relationship
        furthered_goal_number = data.get('furthered_goal_number')
        furthered_working_group = data.get('furthered_working_group')
        if furthered_goal_number and furthered_working_group:
            furthered_goal = Goal.nodes.get_or_none(
                goal_number=furthered_goal_number,
                working_group=furthered_working_group
            )
            if furthered_goal:
                plan.furthered_goals.disconnect_all()  # Clear existing relationships
                plan.furthered_goals.connect(furthered_goal)

        # Update furthered YearSuccessEvidence relationship
        furthered_yse_identifier = data.get('furthered_yse_identifier')
        if furthered_yse_identifier:
            furthered_yse = YearSuccessEvidence.nodes.get_or_none(
                year_identifier=furthered_yse_identifier
            )
            if furthered_yse:
                plan.furthered_year_success_indicators.disconnect_all()  # Clear existing relationships
                plan.furthered_year_success_indicators.connect(furthered_yse)

        print(f"Plan '{plan.name}' updated successfully")
        return True

    except Plan.DoesNotExist:
        raise NotFoundError(f"Plan with unique_id '{unique_id}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to update plan: {e}")
