#
# IMPLEMENTATION UPDATE QUERIES
#
from datetime import date

from pycparser.c_ast import Return

from app.database.graph_schema import *
from app.database.class_factory import implementation_classes, documentation_classes, documentation_relationships
from app.database.queries.implementation.read import get_goal_node
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError
from neomodel import db


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


def get_current_academic_year() -> str:
    """
    Determines the current academic year based on the current date.

    Academic years typically run from August/September to May/June.
    This function assumes:
    - If current month >= 8 (August), we're in year YYYY-(YYYY+1)
    - If current month < 8, we're in year (YYYY-1)-YYYY

    Returns
    -------
    str
        Academic year in format "YYYY-YYYY" (e.g., "2024-2025")

    Examples
    --------
    >>> # If run in October 2024
    >>> get_current_academic_year()
    "2024-2025"

    >>> # If run in March 2025
    >>> get_current_academic_year()
    "2024-2025"
    """
    from datetime import datetime

    now = datetime.now()

    # Academic year starts in August (month 8)
    if now.month >= 8:
        # We're in the fall/winter of the academic year
        start_year = now.year
        end_year = now.year + 1
    else:
        # We're in the spring/summer of the academic year
        start_year = now.year - 1
        end_year = now.year

    return f"{start_year}-{end_year}"


def update_plan(data: dict) -> dict:
    """
    Updates an existing Plan node in the graph database.

    When a plan's status is changed to "Completed", this function will:
    1. Automatically set the completed_in_year relationship
    2. Create an Accomplishment node linked to the plan
    3. Link the accomplishment to the completion year

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
        - completion_notes : str - Notes about completion (used for accomplishment description)
        - completed_year_name : str - Academic year of completion (auto-set when status becomes Completed)
        - current_academic_year : str - Override for current academic year (defaults to calculated year)
        - furthered_goal_number : int - Goal number (use with furthered_working_group)
        - furthered_working_group : str - Working group (use with furthered_goal_number)
        - furthered_yse_identifier : str - YearSuccessEvidence identifier

    Returns
    -------
    dict
        Dictionary containing:
        - success : bool - Whether the update was successful
        - plan_updated : bool - Whether the plan was updated
        - accomplishment_created : bool - Whether an accomplishment was created
        - accomplishment_details : dict - Details of created accomplishment (if applicable)

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
    >>> # Update status to completed (auto-sets completion year)
    >>> update_plan({
    ...     'unique_id': 'plan_67890',
    ...     'plan_status': 'Completed'
    ... })
    True

    >>> # Update status with explicit completion year
    >>> update_plan({
    ...     'unique_id': 'plan_67890',
    ...     'plan_status': 'Completed',
    ...     'completed_year_name': '2024-2025'
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
    - When plan_status changes to "Completed", completed_year is automatically set
    - When plan_status changes from "Completed" to something else, completed_year is removed
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
        new_plan_status = data.get('plan_status')
        if new_plan_status is not None and new_plan_status not in VALID_PLAN_STATUSES:
            raise ValidationError(f"Invalid plan_status: '{new_plan_status}'. Must be one of: {', '.join(VALID_PLAN_STATUSES)}")

        plan = Plan.nodes.get(unique_id=unique_id)

        # Store the previous status to detect changes
        previous_status = plan.plan_status

        # Update plan properties
        plan.description = data.get('description', plan.description)
        plan.is_key_plan = data.get('is_key_plan', plan.is_key_plan)
        plan.is_campus_plan = data.get('is_campus_plan', plan.is_campus_plan)
        plan.plan_status = data.get('plan_status', plan.plan_status)
        plan.abandoned = data.get('abandoned', plan.abandoned)
        plan.abandoned_notes = data.get('abandoned_notes', plan.abandoned_notes)
        plan.name = data.get('name', plan.name)

        # If status is changed to "Completed", also add completion_notes if provided
        if new_plan_status == "Completed" and 'completion_notes' in data:
            plan.completion_notes = data['completion_notes']

        plan.save()

        # Update academic year relationship
        academic_year_name = data.get('academic_year_name')
        if academic_year_name:
            academic_year = AcademicYear.nodes.get_or_none(name=academic_year_name)
            if academic_year:
                plan.academic_year.disconnect_all()
                plan.academic_year.connect(academic_year)

        # Handle completed_year relationship based on status change
        # Check if status changed to "Completed"
        accomplishment_created = None
        if new_plan_status == "Completed" and previous_status != "Completed":
            # Status changed to Completed - set completion year
            # Use provided completed_year_name, or current_academic_year, or calculate it
            completed_year_name = data.get('completed_year_name') or \
                                  data.get('current_academic_year') or \
                                  get_current_academic_year()

            completed_year = AcademicYear.nodes.get_or_none(name=completed_year_name)
            if completed_year:
                plan.completed_year.disconnect_all()
                plan.completed_year.connect(completed_year)
                print(f"Plan '{plan.name}' marked as completed in academic year '{completed_year_name}'")
            else:
                # Create the academic year if it doesn't exist
                completed_year = AcademicYear(name=completed_year_name)
                completed_year.save()
                plan.completed_year.disconnect_all()
                plan.completed_year.connect(completed_year)
                print(f"Plan '{plan.name}' marked as completed in new academic year '{completed_year_name}'")

            # Automatically create an accomplishment from the completed plan
            # Check if accomplishment already exists (shouldn't happen, but let's be safe)
            existing_accomplishment = db.cypher_query(
                """
                MATCH (p:Plan {unique_id: $plan_id})<-[:achieved_through]-(a:Accomplishment)
                RETURN a.unique_id
                """,
                {"plan_id": plan.unique_id}
            )[0]

            if not existing_accomplishment:
                try:
                    # Import here to avoid circular dependency
                    from app.database.queries.implementation.create_accomplishments_from_plans import create_single_accomplishment_from_plan

                    # Use completion_notes from the data if provided, otherwise None
                    completion_notes = data.get('completion_notes') or plan.completion_notes

                    # Create the accomplishment
                    accomplishment_result = create_single_accomplishment_from_plan(
                        plan_id=plan.unique_id,
                        accomplishment_name=None,  # Auto-generate name
                        accomplishment_description=completion_notes  # Use completion notes if available
                    )

                    accomplishment_created = accomplishment_result
                    print(f"Accomplishment '{accomplishment_result['accomplishment_name']}' created automatically from completed plan")

                except Exception as e:
                    # Log the error but don't fail the plan update
                    print(f"Warning: Failed to create accomplishment automatically: {e}")
                    # The plan is still marked as completed even if accomplishment creation fails
            else:
                print(f"Plan '{plan.name}' already has an accomplishment, updating its year")
                # Update the existing accomplishment's academic year to match the new completion year
                try:
                    existing_acc_id = existing_accomplishment[0][0]
                    existing_acc = Accomplishment.nodes.get(unique_id=existing_acc_id)

                    # Update the accomplishment's academic year to match the new completion year
                    existing_acc.academic_year.disconnect_all()
                    existing_acc.academic_year.connect(completed_year)
                    print(f"Updated existing accomplishment's year to '{completed_year_name}'")
                except Exception as e:
                    print(f"Warning: Failed to update accomplishment's year: {e}")

        elif new_plan_status != "Completed" and previous_status == "Completed":
            # Status changed from Completed to something else - remove completion year
            plan.completed_year.disconnect_all()
            print(f"Plan '{plan.name}' no longer marked as completed - removed completion year")

        elif 'completed_year_name' in data:
            # Explicit completed_year_name provided (regardless of status)
            completed_year_name = data['completed_year_name']
            if completed_year_name:
                completed_year = AcademicYear.nodes.get_or_none(name=completed_year_name)
                if completed_year:
                    plan.completed_year.disconnect_all()
                    plan.completed_year.connect(completed_year)

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

        # Return accomplishment info if one was created
        if accomplishment_created:
            return {
                'success': True,
                'plan_updated': True,
                'accomplishment_created': True,
                'accomplishment_details': accomplishment_created
            }
        else:
            return {
                'success': True,
                'plan_updated': True,
                'accomplishment_created': False
            }

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

        # Update furthered YearSuccessEvidence relationships (now supports multiple)
        # Handle both single identifier (backward compatibility) and multiple identifiers
        furthered_yse_identifiers = data.get('furthered_yse_identifiers', [])

        # Also check for single identifier for backward compatibility
        if not furthered_yse_identifiers:
            single_identifier = data.get('furthered_yse_identifier')
            if single_identifier:
                furthered_yse_identifiers = [single_identifier]

        # Disconnect all existing YSE relationships first
        accomplishment.advanced_year_success_indicators.disconnect_all()

        # Connect all provided YSE identifiers
        for identifier in furthered_yse_identifiers:
            furthered_yse = YearSuccessEvidence.nodes.get_or_none(
                year_identifier=identifier
            )
            if furthered_yse:
                accomplishment.advanced_year_success_indicators.connect(furthered_yse)
                print(f"Connected accomplishment to YSE: {identifier}")
            else:
                print(f"Warning: YSE with identifier {identifier} not found")

        print(f"Accomplishment '{accomplishment.name}' updated successfully")
        return True

    except Accomplishment.DoesNotExist:
        raise NotFoundError(f"Accomplishment with unique_id '{unique_id}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to update accomplishment: {e}")