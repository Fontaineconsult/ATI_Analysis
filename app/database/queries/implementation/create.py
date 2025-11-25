#
# IMPLEMENTATION CREATE QUERIES
#
from datetime import datetime

from app.database.graph_schema import *
from app.database.graph_schema import Process
from app.database.queries.implementation.read import get_goal_node
from app.database.queries.implementation.update import get_current_academic_year


from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError


def add_process(title: str, description: str) -> bool:
    """
    Adds a process node to the graph
    :param title: Title of the process
    :param description: Description of the process
    :return: True if the process node is added successfully, False otherwise
    """
    try:
        new_process = Process(
            title=title,
            description=description
        )
        new_process.save()
        print("Added process")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add process: {e}")


def add_guidance(title: str, description: str) -> bool:
    """
    Adds a guidance node to the graph
    :param title: Title of the guidance
    :param description: Description of the guidance
    :return: True if the guidance node is added successfully, False otherwise
    """
    try:
        new_guidance = Guidance(
            title=title,
            description=description,
        )
        new_guidance.save()
        print("Added guidance")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add guidance: {e}")


def add_project(title: str, description: str) -> bool:
    """
    Adds a project node to the graph
    :param title: Title of the project
    :param description: Description of the project
    :return: True if the project node is added successfully, False otherwise
    """
    try:
        new_project = Project(
            title=title,
            description=description
        )
        new_project.save()
        print("Added project")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add project: {e}")


def add_procedure(title: str, description: str) -> bool:
    """
    Adds a procedure node to the graph
    :param title: Title of the procedure
    :param description: Description of the procedure
    :return: True if the procedure node is added successfully, False otherwise
    """
    try:
        new_procedure = Procedure(
            title=title,
            description=description
        )
        new_procedure.save()
        print("Added procedure")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add procedure: {e}")


def add_service(title: str, description: str) -> bool:
    """
    Adds a service node to the graph
    :param title: Title of the service
    :param description: Description of the service
    :return: True if the service node is added successfully, False otherwise
    """
    try:
        new_service = Service(
            title=title,
            description=description
        )
        new_service.save()
        print("Added service")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add service: {e}")


def add_accomplishment(name: str,
                       description: str,  # Changed from accomplishment_description
                       academic_year: str,
                       advanced_goal_number: int=None,  # Changed to int
                       working_group: str=None,
                       furthered_yse_identifier: str=None,
                       ) -> bool:



    """
    Creates a new Accomplishment node in the graph database.

    An Accomplishment represents a completed achievement that advances the accessibility
    initiative's goals and success indicators.

    Parameters
    ----------
    name : str (required)
        The name/title of the accomplishment. Should be descriptive and unique.
        Example: "WCAG 2.1 Compliance Achieved for Main Website"

    description : str (required)
        Detailed description of what was accomplished. This field is unique indexed,
        so must be distinct from other accomplishments.
        Example: "Successfully upgraded university main website to meet WCAG 2.1 AA standards"

    academic_year : str (required)
        Name of the academic year when this was accomplished. Must match an existing
        AcademicYear node's name.
        Example: "2023-2024"

    advanced_goal_number : int (optional)
        The number of the goal this accomplishment advances. Must be used together
        with working_group parameter.
        Example: 1, 2, 3

    working_group : str (optional)
        Name of the ATI Working Group whose goal is being advanced. Required if
        advanced_goal_number is provided.
        Example: "Web", "Instructional Materials", "Procurement"

    furthered_yse_identifier : str (optional)
        The year_identifier of a YearSuccessEvidence node that this accomplishment
        furthers. Format typically: "YYYY_SuccessIndicatorName"
        Example: "2023-2024_WebAccessibility"

    Returns
    -------
    bool
        True if accomplishment was successfully created, raises CrudError otherwise

    Raises
    ------
    CrudError
        If creation fails due to database issues or invalid references
    AcademicYear.DoesNotExist
        If the specified academic_year doesn't exist

    Examples
    --------
    >>> add_accomplishment(
    ...     name="Campus Website Remediation",
    ...     description="Completed full accessibility audit and remediation of campus website",
    ...     academic_year="2023-2024",
    ...     advanced_goal_number=1,
    ...     working_group="Web"
    ... )
    True
    """

    try:
        academic_year_node = AcademicYear.nodes.get(name=academic_year)
        furthered_goal = None
        furthered_yse = None

        if advanced_goal_number and working_group:
            furthered_goal = get_goal_node(advanced_goal_number, working_group)
        if furthered_yse_identifier:
            furthered_yse = YearSuccessEvidence.nodes.get(year_identifier=furthered_yse_identifier)

        accomplishment = Accomplishment(
            name=name,
            description=description  # Fixed field name
        ).save()

        accomplishment.academic_year.connect(academic_year_node)

        if furthered_goal:
            accomplishment.advanced_goals.connect(furthered_goal)
        if furthered_yse:
            accomplishment.advanced_year_success_indicators.connect(furthered_yse)

        print(f"Accomplishment '{name}' added successfully")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add accomplishment: {e}")


def add_plan(plan_data: dict) -> bool:
    """
    Creates a new Plan node in the graph database.

    A Plan represents a detailed strategy outlining steps, resources, and timelines
    to achieve accessibility goals.

    Parameters
    ----------
    plan_data : dict (required)
        Dictionary containing all plan properties and relationships.

        Required fields:
        - name : str - Name/title of the plan
        - description : str - Detailed description (unique indexed)
        - academic_year_name : str - Name of the academic year for this plan

        Required (at least one):
        - furthered_goal_number : int - Goal number the plan furthers (use with furthered_working_group)
        - furthered_working_group : str - Working group name (use with furthered_goal_number)
        - furthered_yse_identifier : str - Single YearSuccessEvidence identifier (backward compatibility)
        - furthered_yse_identifiers : list[str] - Multiple YearSuccessEvidence identifiers (preferred)

        Optional fields:
        - is_key_plan : bool - Whether this is a key strategic plan (default: False)
        - is_campus_plan : bool - Whether this is a campus-wide plan (default: False)
        - for_next_year : bool - Whether this plan should be moved to next academic year (default: False)
        - plan_status : str - Current status of the plan (e.g., "In Progress", "Completed")
                              If "Completed", completed_year is auto-set if not provided
        - abandoned : bool - Whether the plan was abandoned (default: False)
        - abandoned_notes : str - Notes explaining why plan was abandoned
        - completed_year_name : str - Name of academic year when plan was completed
                                     (auto-set when plan_status is "Completed" if not provided)
        - current_academic_year : str - Override for current academic year calculation

    Returns
    -------
    bool
        True if plan was successfully created

    Raises
    ------
    ValidationError
        If none of the furthering fields are provided
    CrudError
        If creation fails due to database issues
    AcademicYear.DoesNotExist
        If specified academic year doesn't exist

    Examples
    --------
    >>> add_plan({
    ...     'name': 'Web Accessibility Improvement Plan',
    ...     'description': 'Comprehensive plan to improve web accessibility across all platforms',
    ...     'academic_year_name': '2023-2024',
    ...     'is_key_plan': True,
    ...     'furthered_goal_number': 1,
    ...     'furthered_working_group': 'Web',
    ...     'plan_status': 'In Progress'
    ... })
    True

    Notes
    -----
    - At least one furthering relationship must be specified (goal or YSE)
    - Description must be unique across all plans
    - Use academic year names exactly as they exist in the database
    """

    VALID_PLAN_STATUSES = ["Not Started", "In Progress", "Completed", "On Hold", "Abandoned"]

    try:
        # Unpack dictionary values with default fallbacks
        name = plan_data.get('name')
        description = plan_data.get('description')
        academic_year_name = plan_data.get('academic_year_name')
        is_key_plan = plan_data.get('is_key_plan', False)
        is_campus_plan = plan_data.get('is_campus_plan', False)
        for_next_year = plan_data.get('for_next_year', False)  # Added for_next_year field
        plan_status = plan_data.get('plan_status', None)
        abandoned = plan_data.get('abandoned', False)
        abandoned_notes = plan_data.get('abandoned_notes', None)
        completed_year_name = plan_data.get('completed_year_name', None)
        furthered_goal_number = plan_data.get('furthered_goal_number', None)
        furthered_working_group = plan_data.get('furthered_working_group', None)
        furthered_yse_identifier = plan_data.get('furthered_yse_identifier', None)
        furthered_yse_identifiers = plan_data.get('furthered_yse_identifiers', [])

        # Validate plan_status if provided
        if plan_status is not None and plan_status not in VALID_PLAN_STATUSES:
            raise ValidationError(f"Invalid plan_status: '{plan_status}'. Must be one of: {', '.join(VALID_PLAN_STATUSES)}")

        # Validate that at least one of the furthering fields is provided
        if not (furthered_goal_number or furthered_working_group or furthered_yse_identifier or furthered_yse_identifiers):
            raise ValidationError("At least one of 'furthered_goal_number', 'furthered_working_group', 'furthered_yse_identifier', or 'furthered_yse_identifiers' must be specified.")

        # Get or create the academic year node
        academic_year = AcademicYear.nodes.get(name=academic_year_name)

        # Find the goal node if a furthered goal is specified
        furthered_goal = None
        if furthered_goal_number and furthered_working_group:
            furthered_goal = get_goal_node(furthered_goal_number, furthered_working_group)

        # Find YearSuccessEvidence nodes if furthered YSEs are specified
        # Support both single identifier and multiple identifiers
        furthered_yse_identifiers = plan_data.get('furthered_yse_identifiers', [])

        # Also check for single identifier for backward compatibility
        if not furthered_yse_identifiers and furthered_yse_identifier:
            furthered_yse_identifiers = [furthered_yse_identifier]

        furthered_yses = []
        for identifier in furthered_yse_identifiers:
            yse = YearSuccessEvidence.nodes.get_or_none(year_identifier=identifier)
            if yse:
                furthered_yses.append(yse)

        # Create a new plan node with the updated fields
        plan = Plan(
            name=name,
            description=description,              # Using "description" from dict
            is_key_plan=is_key_plan,
            is_campus_plan=is_campus_plan,
            for_next_year=for_next_year,         # Added for_next_year field
            plan_status=plan_status,              # Optional plan status
            abandoned=abandoned,                 # Optional abandoned status
            abandoned_notes=abandoned_notes       # Optional abandoned notes
        ).save()

        # Connect the plan to the academic year
        plan.academic_year.connect(academic_year)

        # If a goal is specified, connect the plan to the furthered goal
        if furthered_goal:
            plan.furthered_goals.connect(furthered_goal)

        # If YSEs are specified, connect the plan to the furthered YearSuccessEvidence nodes
        for yse in furthered_yses:
            plan.furthered_year_success_indicators.connect(yse)

        # Handle completed_year relationship
        # If plan is created with "Completed" status, auto-set completion year if not provided
        if plan_status == "Completed":
            # Use provided completed_year_name, or current_academic_year from data, or calculate it
            if not completed_year_name:
                completed_year_name = plan_data.get('current_academic_year') or get_current_academic_year()

            completed_year = AcademicYear.nodes.get_or_none(name=completed_year_name)
            if not completed_year:
                # Create the academic year if it doesn't exist
                completed_year = AcademicYear(name=completed_year_name)
                completed_year.save()

            plan.completed_year.connect(completed_year)
            print(f"Plan '{name}' created with completed status in academic year '{completed_year_name}'")

            # If plan is created as completed, also create an accomplishment
            try:
                from app.database.queries.implementation.create_accomplishments_from_plans import create_single_accomplishment_from_plan

                # Use completion_notes if provided
                completion_notes = plan_data.get('completion_notes')

                # Create the accomplishment
                accomplishment_result = create_single_accomplishment_from_plan(
                    plan_id=plan.unique_id,
                    accomplishment_name=None,  # Auto-generate name
                    accomplishment_description=completion_notes  # Use completion notes if available
                )

                print(f"Accomplishment '{accomplishment_result['accomplishment_name']}' created automatically for completed plan")

            except Exception as e:
                # Log the error but don't fail the plan creation
                print(f"Warning: Failed to create accomplishment automatically: {e}")

        elif completed_year_name:
            # If a completed year is explicitly specified (regardless of status)
            completed_year = AcademicYear.nodes.get_or_none(name=completed_year_name)
            if not completed_year:
                # Create the academic year if it doesn't exist
                completed_year = AcademicYear(name=completed_year_name)
                completed_year.save()
            plan.completed_year.connect(completed_year)

        print(f"Plan '{name}' added successfully")
        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise e
    except Exception as e:
        raise CrudError(f"Failed to add plan: {e}")




def add_tracking(title: str, description: str) -> bool:
    """
    Adds a tracking node to the graph
    :param title: Title of the tracking
    :param description: Description of the tracking
    :return: True if the tracking node is added successfully, False otherwise
    """
    try:
        new_tracking = Tracking(
            title=title,
            description=description
        )
        new_tracking.save()
        print("Added tracking")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add tracking: {e}")


def add_internal_policy(title: str, description: str) -> bool:
    """
    Adds an internal policy node to the graph
    :param title: Title of the internal policy
    :param description: Description of the internal policy
    :return: True if the internal policy node is added successfully, False otherwise
    """
    try:
        new_internal_policy = InternalPolicy(
            title=title,
            description=description
        )
        new_internal_policy.save()
        print("Added internal policy")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add internal policy: {e}")
