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


def delete_position_description(unique_id: str) -> bool:
    """
    Deletes a PositionDescription node by unique_id. Detach-deletes the record
    only: linked Document and Note nodes are shared documentation and survive
    (delete = unlink, the documentation convention).
    :param unique_id: The unique_id of the position description.
    :return: True if deleted.
    """
    try:
        pd = PositionDescription.nodes.get(unique_id=unique_id)
        pd.delete()
        return True
    except PositionDescription.DoesNotExist:
        raise NotFoundError(f"PositionDescription with unique_id {unique_id} does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to delete position description: {str(e)}")
