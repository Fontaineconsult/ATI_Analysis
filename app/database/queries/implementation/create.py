#
# IMPLEMENTATION CREATE QUERIES
#
from datetime import datetime

from app.database.graph_schema import *

from app.database.graph_schema import Process

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

def add_plan(title: str, description: str, is_campus_plan:bool) -> bool:
    """
    Adds a plan node to the graph
    :param title: Title of the plan
    :param description: Description of the plan
    :param is_campus_plan: True if the plan is a campus plan, False otherwise
    :return: True if the plan node is added successfully, False otherwise
    """
    try:
        new_plan = Plan(
            title=title,
            description=description,
            is_campus_plan=is_campus_plan
        )
        new_plan.save()
        print("Added plan")
        return True
    except Exception as e:
        print(e)
        return False

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