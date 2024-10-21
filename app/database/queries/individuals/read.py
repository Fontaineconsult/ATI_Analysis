#
# INDIVIDUAL READ QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

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
    person = Person.nodes.get_or_none(employee_id=employee_id)
    if not person:
        raise NotFoundError(f"Person with employee_id {employee_id} does not exist.")
    return person
