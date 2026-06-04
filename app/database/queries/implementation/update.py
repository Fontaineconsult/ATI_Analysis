#
# IMPLEMENTATION UPDATE QUERIES
#
from datetime import date

from pycparser.c_ast import Return

from app.database.graph_schema import *
from app.database.class_factory import implementation_classes, documentation_classes, documentation_relationships
from app.database.queries.implementation.read import get_goal_node
from app.data_config import working_group_names
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError
from neomodel import db


# Only the four "doing" implementations carry accountable_working_group (the committee
# accountable for the remediation work, distinct from owned_by Person).
_WORKING_GROUP_ACCOUNTABLE_TYPES = ("Process", "Project", "Procedure", "Service")


def assign_documentation_to_implementation(
        implementation_id: str,
        implementation_type: str,
        documentation_type: str,
        documentation_id: str,
        academic_year: str = None,
        include_in_year: bool = True
) -> bool:
    """
    Assigns documentation to an implementation with optional year-specific inclusion.

    Parameters:
    - implementation_id: unique_id of the implementation
    - implementation_type: type of implementation (Process, Project, etc.)
    - documentation_type: type of documentation (document, webpage, note, message)
    - documentation_id: unique_id of the documentation
    - academic_year: optional academic year (e.g., "2024-2025") for year-specific inclusion
    - include_in_year: if True and academic_year provided, adds to included_in_years;
                       if False, adds to excluded_from_years
    """
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
        # Update existing relationship if academic_year is provided
        if academic_year:
            rel = relationship.relationship(documentation_node)

            included = rel.included_in_years or []
            excluded = rel.excluded_from_years or []

            if include_in_year:
                if academic_year not in included:
                    included.append(academic_year)
                if academic_year in excluded:
                    excluded.remove(academic_year)
            else:
                if academic_year in included:
                    included.remove(academic_year)
                if academic_year not in excluded:
                    excluded.append(academic_year)

            rel.included_in_years = included
            rel.excluded_from_years = excluded
            rel.modified_date = date.today()
            rel.save()

        return True

    # Create new relationship
    relationship_data = {
        'added_date': date.today(),
        'modified_date': date.today()
    }

    # Only add year-specific data if academic_year is provided
    if academic_year:
        if include_in_year:
            relationship_data['included_in_years'] = [academic_year]
            relationship_data['excluded_from_years'] = []
        else:
            relationship_data['included_in_years'] = []
            relationship_data['excluded_from_years'] = [academic_year]
    else:
        # Default behavior - no year-specific inclusion/exclusion
        relationship_data['included_in_years'] = []
        relationship_data['excluded_from_years'] = []

    relationship.connect(documentation_node, relationship_data)

    return True


def add_progress_note_to_plan(
        plan_id: str,
        note_name: str,
        note_content: str,
        created_by_id: str = None
) -> dict:
    """
    Adds a progress note to a plan.

    Parameters:
    - plan_id: unique_id of the plan
    - note_name: name/title of the note
    - note_content: content of the progress note
    - created_by_id: unique_id of the Person creating the note (optional)

    Returns:
    - Dictionary containing the created note and relationships
    """
    # Get the Plan node
    try:
        plan_node = Plan.nodes.get(unique_id=plan_id)
    except Plan.DoesNotExist:
        raise NotFoundError(f"No Plan found with id: {plan_id}")

    # Create the Note node
    note = Note(
        name=note_name,
        content=note_content,
        date_created=date.today(),
        include_in_report=True,
        depreciated=False
    )
    note.save()

    # Connect the note to the plan using progress_updates relationship
    plan_node.progress_updates.connect(note)

    # If created_by_id is provided, connect to Person
    created_by_person = None
    if created_by_id:
        try:
            person = Person.nodes.get(unique_id=created_by_id)
            note.created_by.connect(person)
            created_by_person = person.serialize()
        except Person.DoesNotExist:
            # Log warning but don't fail - note is still created
            print(f"Warning: Person with id {created_by_id} not found")

    return {
        "note": note.serialize(),
        "plan": plan_node.serialize(),
        "created_by": created_by_person
    }


def update_documentation_year_inclusion(
        implementation_id: str,
        implementation_type: str,
        documentation_type: str,
        documentation_id: str,
        academic_year: str,
        include: bool = True
) -> bool:
    """
    Updates year-specific inclusion for existing documentation relationships.
    """
    from datetime import date

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

    if not relationship.is_connected(documentation_node):
        raise NotFoundError(f"No existing relationship between implementation and documentation")

    rel = relationship.relationship(documentation_node)

    included = rel.included_in_years or []
    excluded = rel.excluded_from_years or []

    if include:
        if academic_year not in included:
            included.append(academic_year)
        if academic_year in excluded:
            excluded.remove(academic_year)
    else:
        if academic_year in included:
            included.remove(academic_year)
        if academic_year not in excluded:
            excluded.append(academic_year)

    rel.included_in_years = included
    rel.excluded_from_years = excluded
    rel.modified_date = date.today()
    rel.save()

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


def _resolve_implementation(implementation_unique_id, implementation_type):
    """Resolve (type, unique_id) -> implementation node. Raises ValidationError /
    NotFoundError consistent with the rest of the module."""
    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")
    implementation_class = implementation_classes[implementation_type]
    try:
        return implementation_class.nodes.get(unique_id=implementation_unique_id)
    except implementation_class.DoesNotExist:
        raise NotFoundError(f"No {implementation_type} found with unique_id: {implementation_unique_id}")


def assign_person_as_owner(implementation_unique_id, implementation_type, person_unique_id):
    """Connect a Person to an implementation via the owned_by edge."""
    impl_node = _resolve_implementation(implementation_unique_id, implementation_type)
    try:
        person_node = Person.nodes.get(unique_id=person_unique_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"No Person node found with unique_id: {person_unique_id}")
    impl_node.owned_by.connect(person_node)
    return True


def unassign_person_as_owner(implementation_unique_id, implementation_type, person_unique_id):
    """Disconnect a Person from an implementation's owned_by edge."""
    impl_node = _resolve_implementation(implementation_unique_id, implementation_type)
    try:
        person_node = Person.nodes.get(unique_id=person_unique_id)
    except Person.DoesNotExist:
        raise NotFoundError(f"No Person node found with unique_id: {person_unique_id}")
    impl_node.owned_by.disconnect(person_node)
    return True


def _resolve_accountable_implementation(implementation_unique_id, implementation_type):
    """Resolve an implementation that can carry accountable_working_group (the four doing
    types). Raises ValidationError on a non-accountable type."""
    if implementation_type not in _WORKING_GROUP_ACCOUNTABLE_TYPES:
        raise ValidationError(
            f"implementation_type must be one of {list(_WORKING_GROUP_ACCOUNTABLE_TYPES)} to carry "
            f"working-group accountability; got {implementation_type!r}"
        )
    return _resolve_implementation(implementation_unique_id, implementation_type)


def _resolve_working_group(name_or_abbrev):
    """Resolve an ATIWorkingGroup by full name ('Web') or abbreviation ('web'/'pro'/'ins')."""
    name = working_group_names.get(name_or_abbrev, name_or_abbrev)
    try:
        return ATIWorkingGroup.nodes.get(name=name)
    except ATIWorkingGroup.DoesNotExist:
        raise NotFoundError(f"ATIWorkingGroup {name!r} not found")


def assign_accountable_working_group(implementation_unique_id, implementation_type, working_group):
    """Connect an accountable ATIWorkingGroup to an implementation (accountable_working_group).
    The committee accountable for this remediation work — distinct from owned_by (the Person)."""
    impl_node = _resolve_accountable_implementation(implementation_unique_id, implementation_type)
    wg = _resolve_working_group(working_group)
    if not impl_node.accountable_working_group.is_connected(wg):
        impl_node.accountable_working_group.connect(wg)
    return True


def unassign_accountable_working_group(implementation_unique_id, implementation_type, working_group):
    """Disconnect an accountable ATIWorkingGroup from an implementation. Inverse of the assign."""
    impl_node = _resolve_accountable_implementation(implementation_unique_id, implementation_type)
    wg = _resolve_working_group(working_group)
    if impl_node.accountable_working_group.is_connected(wg):
        impl_node.accountable_working_group.disconnect(wg)
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
    Updates an existing Plan node in the graph database.

    Parameters
    ----------
    data : dict (required)
        Dictionary containing plan properties to update.

        Required fields:
        - unique_id : str - The unique identifier of the plan to update

        Optional fields (only include fields you want to update):
        - name : str - New name for the plan
        - description : str - New description (must be unique)
        - academic_year_name : str - Academic year to associate with
        - is_key_plan : bool - Update key plan status
        - is_campus_plan : bool - Update campus plan status
        - plan_status : str - New status (e.g., "Completed", "In Progress")
        - abandoned : bool - Mark as abandoned or not
        - abandoned_notes : str - Notes about abandonment
        - completed_year_name : str - Academic year of completion
        - furthered_goal_number : int - Goal number (use with furthered_working_group)
        - furthered_working_group : str - Working group (use with furthered_goal_number)
        - furthered_yse_identifier : str - YearSuccessEvidence identifier

    Returns
    -------
    bool
        True if plan was successfully updated

    Raises
    ------
    ValidationError
        If unique_id is not provided
    NotFoundError
        If no plan exists with given unique_id
    CrudError
        If update fails due to database issues

    Examples
    --------
    >>> # Update status and mark as completed
    >>> update_plan({
    ...     'unique_id': 'plan_67890',
    ...     'plan_status': 'Completed',
    ...     'completed_year_name': '2023-2024'
    ... })
    True

    >>> # Abandon a plan with notes
    >>> update_plan({
    ...     'unique_id': 'plan_11111',
    ...     'abandoned': True,
    ...     'abandoned_notes': 'Superseded by new campus-wide initiative',
    ...     'plan_status': 'Abandoned'
    ... })
    True

    Notes
    -----
    - Only provided fields will be updated; others remain unchanged
    - Relationships are replaced entirely (existing connections disconnected first)
    - Validation ensures data integrity with existing nodes
    """

    VALID_PLAN_STATUSES = ["Not Started", "In Progress", "Completed", "On Hold", "Abandoned"]


    try:
        unique_id = data.get('unique_id')
        if not unique_id:
            raise ValidationError("Missing required field: 'unique_id'")

        # Validate plan_status if provided
        plan_status = data.get('plan_status')
        if plan_status is not None and plan_status not in VALID_PLAN_STATUSES:
            raise ValidationError(f"Invalid plan_status: '{plan_status}'. Must be one of: {', '.join(VALID_PLAN_STATUSES)}")

        plan = Plan.nodes.get(unique_id=unique_id)

        # Capture pre-mutation status so we can detect Completed transitions
        # AFTER the assignments below — needed for the accomplishment
        # auto-create / auto-delete branch later in this function.
        previous_status = plan.plan_status

        # Update plan properties
        plan.description = data.get('description', plan.description)
        plan.is_key_plan = data.get('is_key_plan', plan.is_key_plan)
        plan.is_campus_plan = data.get('is_campus_plan', plan.is_campus_plan)
        plan.plan_status = data.get('plan_status', plan.plan_status)
        plan.abandoned = data.get('abandoned', plan.abandoned)
        plan.abandoned_notes = data.get('abandoned_notes', plan.abandoned_notes)
        plan.completion_notes = data.get('completion_notes', plan.completion_notes)
        plan.name = data.get('name', plan.name)

        plan.save()

        # Update academic year relationship
        academic_year_name = data.get('academic_year_name')
        if academic_year_name:
            academic_year = AcademicYear.nodes.get_or_none(name=academic_year_name)
            if academic_year:
                plan.academic_year.disconnect_all()
                plan.academic_year.connect(academic_year)

        # Update completed year relationship
        completed_year_name = data.get('completed_year_name')
        if completed_year_name:
            completed_year = AcademicYear.nodes.get_or_none(name=completed_year_name)
            if completed_year:
                plan.completed_year.disconnect_all()
                plan.completed_year.connect(completed_year)

        # Update abandoned year relationship.
        # If `abandoned` was explicitly toggled to False, also drop any existing
        # abandoned_in_year edge so the plan goes back to "active everywhere".
        if 'abandoned' in data and data['abandoned'] is False:
            plan.abandoned_year.disconnect_all()
        abandoned_year_name = data.get('abandoned_year_name')
        if abandoned_year_name:
            abandoned_year = AcademicYear.nodes.get_or_none(name=abandoned_year_name)
            if abandoned_year:
                plan.abandoned_year.disconnect_all()
                plan.abandoned_year.connect(abandoned_year)

        # Accomplishment auto-create / auto-delete based on Completed transitions.
        # When the plan newly becomes Completed, mirror it into an
        # Accomplishment via :achieved_through (idempotent — skip if one
        # already exists). When it leaves Completed, drop the linked
        # accomplishment so the records stay in sync.
        new_plan_status = data.get('plan_status')
        if new_plan_status == "Completed" and previous_status != "Completed":
            existing_acc, _ = db.cypher_query(
                """
                MATCH (p:Plan {unique_id: $plan_id})<-[:achieved_through]-(a:Accomplishment)
                RETURN a.unique_id
                """,
                {"plan_id": plan.unique_id},
            )
            if not existing_acc:
                try:
                    from app.database.queries.implementation.create_accomplishments_from_plans import (
                        create_single_accomplishment_from_plan,
                    )
                    completion_notes = data.get('completion_notes') or plan.completion_notes
                    result = create_single_accomplishment_from_plan(
                        plan_id=plan.unique_id,
                        accomplishment_name=None,
                        accomplishment_description=completion_notes,
                    )
                    print(f"Accomplishment '{result['accomplishment_name']}' auto-created from completed plan '{plan.name}'")
                except Exception as e:
                    # Don't fail the plan update if the accomplishment side errors.
                    print(f"Warning: Failed to create accomplishment automatically: {e}")
        elif new_plan_status is not None and new_plan_status != "Completed" and previous_status == "Completed":
            try:
                db.cypher_query(
                    """
                    MATCH (p:Plan {unique_id: $plan_id})<-[:achieved_through]-(a:Accomplishment)
                    DETACH DELETE a
                    """,
                    {"plan_id": plan.unique_id},
                )
                print(f"Deleted accomplishment linked to plan '{plan.name}' (status changed away from Completed)")
            except Exception as e:
                print(f"Warning: Failed to delete linked accomplishment: {e}")

        # Update furthered goal relationship
        furthered_goal_number = data.get('furthered_goal_number')
        furthered_working_group = data.get('furthered_working_group')
        if furthered_goal_number and furthered_working_group:
            # Use the get_goal_node helper function instead
            furthered_goal = get_goal_node(furthered_goal_number, furthered_working_group)
            if furthered_goal:
                plan.furthered_goals.disconnect_all()
                plan.furthered_goals.connect(furthered_goal)

        # Update furthered YearSuccessEvidence relationship
        furthered_yse_identifier = data.get('furthered_yse_identifier')
        if furthered_yse_identifier:
            furthered_yse = YearSuccessEvidence.nodes.get_or_none(
                year_identifier=furthered_yse_identifier
            )
            if furthered_yse:
                plan.furthered_year_success_indicators.disconnect_all()
                plan.furthered_year_success_indicators.connect(furthered_yse)

        print(f"Plan '{plan.name}' updated successfully")
        return True

    except Plan.DoesNotExist:
        raise NotFoundError(f"Plan with unique_id '{unique_id}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to update plan: {e}")


def update_accomplishment(data: dict) -> bool:

    """
    Updates an existing Accomplishment node in the graph database.

    Parameters
    ----------
    data : dict (required)
        Dictionary containing the accomplishment properties to update.

        Required fields:
        - unique_id : str - The unique identifier of the accomplishment to update

        Optional fields (only include fields you want to update):
        - name : str - New name for the accomplishment
        - description : str - New description (must be unique across all accomplishments)
        - academic_year : str - Name of academic year to associate with
        - advanced_goal_number : int - Goal number being advanced (use with working_group)
        - working_group : str - Working group name (use with advanced_goal_number)
        - furthered_yse_identifier : str - YearSuccessEvidence identifier being furthered

    Returns
    -------
    bool
        True if accomplishment was successfully updated

    Raises
    ------
    ValidationError
        If unique_id is not provided in the data dictionary
    NotFoundError
        If no accomplishment exists with the given unique_id
    CrudError
        If update fails due to database issues

    Examples
    --------
    >>> update_accomplishment({
    ...     'unique_id': 'uuid',
    ...     'description': 'Updated description of campus website remediation project',
    ...     'academic_year': '2024-2025'
    ... })
    True

    Notes
    -----
    - Only fields provided in the data dictionary will be updated
    - Relationships will be completely replaced (not added to)
    - Use disconnect_all() before connecting new relationships
    """

    try:
        unique_id = data.get('unique_id')
        if not unique_id:
            raise ValidationError("Missing required field: 'unique_id'")

        accomplishment = Accomplishment.nodes.get(unique_id=unique_id)

        # Update accomplishment properties
        accomplishment.name = data.get('name', accomplishment.name)
        accomplishment.description = data.get('description', accomplishment.description)

        accomplishment.save()

        # Update academic year relationship
        academic_year_name = data.get('academic_year')
        if academic_year_name:
            academic_year = AcademicYear.nodes.get_or_none(name=academic_year_name)
            if academic_year:
                accomplishment.academic_year.disconnect_all()
                accomplishment.academic_year.connect(academic_year)

        # Update advanced goal relationship
        advanced_goal_number = data.get('advanced_goal_number')
        working_group = data.get('working_group')
        if advanced_goal_number and working_group:
            advanced_goal = get_goal_node(advanced_goal_number, working_group)
            if advanced_goal:
                accomplishment.advanced_goals.disconnect_all()
                accomplishment.advanced_goals.connect(advanced_goal)

        # Update furthered YearSuccessEvidence relationship
        furthered_yse_identifier = data.get('furthered_yse_identifier')
        if furthered_yse_identifier:
            furthered_yse = YearSuccessEvidence.nodes.get_or_none(
                year_identifier=furthered_yse_identifier
            )
            if furthered_yse:
                accomplishment.advanced_year_success_indicators.disconnect_all()
                accomplishment.advanced_year_success_indicators.connect(furthered_yse)

        print(f"Accomplishment '{accomplishment.name}' updated successfully")
        return True

    except Accomplishment.DoesNotExist:
        raise NotFoundError(f"Accomplishment with unique_id '{unique_id}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to update accomplishment: {e}")