#
# INDIVIDUAL DELETE QUERIES
#
from app.database.graph_schema import *

def delete_person(employee_id):
    p_node = Person.nodes.get(employee_id=employee_id)
    p_node.delete()
    return True


def delete_person(employee_id: str) -> bool:
    """
    Deletes a directive node from the graph
    :param title: Title of the directive
    :return: True if the directive node is deleted successfully, False otherwise
    """
    try:
        person = Person.nodes.get(employee_id=employee_id)
        person.delete()
        print("Deleted person")
        return True
    except Person.DoesNotExist:
        print("Person does not exist")
        return False