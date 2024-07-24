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

def add_guidance(title: str, description: str, effective_date: str, last_updated: str) -> bool:
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
            effective_date=datetime.strptime(effective_date, "%Y-%m-%d"),
            last_updated=datetime.strptime(last_updated, "%Y-%m-%d")
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