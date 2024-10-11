#
# INDIVIDUAL READ QUERIES
#
from app.database.graph_schema import *


def get_all_persons() -> list:
    """
    Get all person nodes from the graph
    :return: List of individual nodes
    """
    return Person.nodes.all()

def get_person_by_employee_id(employee_id: str) -> Person:
    """
    Get a person node by employee_id
    :param employee_id: Employee ID of the person
    :return: Person node
    """
    return Person.nodes.get_or_none(employee_id=employee_id)