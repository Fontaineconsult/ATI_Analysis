#
# INDIVIDUAL CREATE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError

def add_person(name: str,
               email: str,
               employee_id: str,
               title: str) -> bool:
    """
    Adds a person node to the graph
    :param name:
    :param email:
    :param employee_id:
    :param title:
    :return:
    """
    # Validate input
    if not name or not email or not employee_id or not title:
        raise ValidationError("All fields (name, email, employee_id, and title) are required.")

    try:
        # Check if a person with the same employee_id already exists
        existing_person = Person.nodes.get_or_none(employee_id=employee_id)
        if existing_person:
            raise ValidationError(f"Person with employee_id {employee_id} already exists.")

        # Create and save the new person
        new_person = Person(
            name=name,
            email=email,
            employee_id=employee_id,
            title=title
        )
        new_person.save()
        print(f"Person '{name}' added successfully.")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add person: {str(e)}")