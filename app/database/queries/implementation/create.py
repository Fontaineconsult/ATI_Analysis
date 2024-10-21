#
# IMPLEMENTATION CREATE QUERIES
#
from datetime import datetime

from app.database.graph_schema import *
from app.database.graph_schema import Process
from app.database.queries.implementation.read import get_goal_node


from app.endpoints.data_api.errors.custom_exceptions import CrudError

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
                       accomplishment_description: str,
                       academic_year: str,
                       advanced_goal_number: str=None,
                       working_group: str=None,
                       furthered_yse_identifier: str=None,
                       ) -> bool:
    try:
        academic_year = AcademicYear.nodes.get(name=academic_year)
        if advanced_goal_number and working_group:
            furthered_goal = get_goal_node(advanced_goal_number, working_group)
        if furthered_yse_identifier:
            furthered_yse = YearSuccessEvidence.nodes.get(year_identifier=furthered_yse_identifier)

        accomplishment = Accomplishment(
            name=name,
            accomplishment_description=accomplishment_description,
        ).save()

        accomplishment.academic_year.connect(academic_year)

        if advanced_goal_number and working_group:
            accomplishment.advanced_goals.connect(furthered_goal)
        if furthered_yse_identifier:
            accomplishment.furthered_year_success_indicators.connect(furthered_yse)

        print(f"Plan '{name}' added successfully")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add accomplishment: {e}")


def add_plan(name: str,
             plan_description: str,
             academic_year_name: str,
             is_key_plan: bool=False,
             is_campus_plan: bool=False,
             furthered_goal_number: int=None,
             furthered_working_group: str=None,
             furthered_yse_identifier: str=None) -> bool:
    try:
        academic_year = AcademicYear.nodes.get(name=academic_year_name)

        furthered_goal = None
        if furthered_goal_number and furthered_working_group:
            furthered_goal = get_goal_node(furthered_goal_number, furthered_working_group)

        furthered_yse = None
        if furthered_yse_identifier:
            furthered_yse = YearSuccessEvidence.nodes.get(year_identifier=furthered_yse_identifier)

        plan = Plan(
            name=name,
            plan_description=plan_description,
            is_key_plan=is_key_plan,
            is_campus_plan=is_campus_plan
        ).save()

        plan.academic_year.connect(academic_year)

        if furthered_goal:
            plan.furthered_goals.connect(furthered_goal)

        if furthered_yse:
            plan.furthered_year_success_indicators.connect(furthered_yse)

        print(f"Plan '{name}' added successfully")
        return True
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
