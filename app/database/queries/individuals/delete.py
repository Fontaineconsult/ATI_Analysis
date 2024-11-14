#
# INDIVIDUAL DELETE QUERIES
#
from app.database.graph_schema import *

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError

def delete_person(employee_id: str) -> bool:
    """
    Deletes a Person node from the graph by employee_id
    :param employee_id: The employee ID of the person
    :return: True if the person node is deleted successfully, False otherwise
    """
    try:
        person = Person.nodes.get(employee_id=employee_id)
        person.delete()
        print(f"Deleted person with employee_id {employee_id}")
        return True
    except Person.DoesNotExist:
        raise NotFoundError(f"Person with employee_id {employee_id} does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to delete person: {str(e)}")
