#
# IMPLEMENTATION CREATE QUERIES
#
from datetime import datetime

from app.database.graph_schema import *

from app.database.graph_schema import Process
from app.database.queries.implementation.read import get_goal_node


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
        print(e)
        return False

def add_guidance(title: str, description: str) -> bool:
    """
    Adds a guidance node to the graph
    :param title: Title of the guidance
    :param description: Description of the guidance
    :param effective_date: Effective date of the guidance
    :param last_updated: Last updated date of the guidance
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
        print(e)
        return False



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
        print(e)
        return False



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
        print(e)
        return False


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
        print(e)
        return False


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
        print(e)
        return False

# add_accomplishment("Accomplishment 1",
#                    "Two co-executive sponsors volunteered to help steer the ATI at SF State",
#                    "2022-2023",
#                    7,
#                    "web")

def add_plan(name: str,
             plan_description: str,
             academic_year_name: str,
             is_key_plan: bool=False,
             is_campus_plan: bool=False,
             furthered_goal_number: int=None,
             furthered_working_group: str=None,
             furthered_yse_identifier: str=None) -> bool:
    try:
        # Retrieve the AcademicYear node
        academic_year = AcademicYear.nodes.get(name=academic_year_name)

        # Retrieve the Goal node if furthered_goal_number and working_group are provided
        furthered_goal = None
        if furthered_goal_number and furthered_working_group:
            furthered_goal = get_goal_node(furthered_goal_number, furthered_working_group)

        # Retrieve the YearSuccessEvidence node if furthered_yse_identifier is provided
        furthered_yse = None
        if furthered_yse_identifier:
            furthered_yse = YearSuccessEvidence.nodes.get(year_identifier=furthered_yse_identifier)

        # Create and save the Plan node
        plan = Plan(
            name=name,
            plan_description=plan_description,
            is_key_plan=is_key_plan,
            is_campus_plan=is_campus_plan
        ).save()

        # Connect the plan to the academic year
        plan.academic_year.connect(academic_year)

        # Connect the plan to the goal if it was provided
        if furthered_goal:
            plan.furthered_goals.connect(furthered_goal)

        # Connect the plan to the YearSuccessEvidence if it was provided
        if furthered_yse:
            plan.furthered_year_success_indicators.connect(furthered_yse)

        print(f"Plan '{name}' added successfully")
        return True
    except Exception as e:
        print(e)
        return False


add_plan("Plan 1",
         "We will continue to work to re-establish regular web subcommittee meetings.",
         "2022-2023",
         True,
         False,
         7,
         "web")

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
        print(e)
        return False

def add_internal_policy(title: str, description: str) -> bool:
    """
    Adds a internal policy node to the graph
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
        print(e)
        return False