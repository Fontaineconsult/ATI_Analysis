#
# INDIVIDUAL CREATE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError

from app.database.graph_schema import Person, ATIWorkingGroup
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError, NotFoundError
from neomodel import db, DoesNotExist

def add_person(data: dict) -> Person:
    """
    Adds a new person node to the graph and establishes relationships.

    :param data: The data for the new person.
    :return: The created Person node.
    """

    employee_id = data.get('employee_id')
    if not employee_id:
        raise ValidationError("Employee ID is required.")

    try:
        # Start a transaction
        with db.transaction:
            # Check if a person with the same employee_id already exists
            existing_person = Person.nodes.get_or_none(employee_id=employee_id)
            if existing_person:
                raise ValidationError(f"Person with employee_id '{employee_id}' already exists.")

            # Create a new Person node
            person = Person(employee_id=employee_id)

            # Set person's properties (only set properties provided in data)
            if 'active' in data and data['active'] is not None:
                person.active = data['active']
            else:
                person.active = True  # Default value

            if 'ati_role' in data and data['ati_role'] is not None:
                person.ati_role = data['ati_role']

            if 'can_approve_yse' in data and data['can_approve_yse'] is not None:
                person.can_approve_yse = data['can_approve_yse']
            else:
                person.can_approve_yse = False  # Default value

            if 'email' in data and data['email'] is not None:
                person.email = data['email']
            else:
                raise ValidationError("Email is required.")

            if 'name' in data and data['name'] is not None:
                person.name = data['name']
            else:
                raise ValidationError("Name is required.")

            if 'title' in data and data['title'] is not None:
                person.title = data['title']
            else:
                raise ValidationError("Title is required.")

            # Save the new person node
            person.save()

            # Establish relationships if 'workingGroups' is provided in data
            if 'workingGroups' in data:
                working_groups = data.get('workingGroups') or []
                if not isinstance(working_groups, list):
                    raise ValidationError("The 'workingGroups' field must be a list.")

                for wg_data in working_groups:
                    wg_name = wg_data.get('name')
                    if wg_name:
                        # Fetch the working group node by its name
                        try:
                            working_group = ATIWorkingGroup.nodes.get(name=wg_name)
                        except DoesNotExist:
                            raise NotFoundError(f"ATIWorkingGroup with name '{wg_name}' not found.")

                        # Create a relationship between the person and the working group
                        person.in_ati_working_group.connect(working_group)

            return person

    except ValidationError:
        raise
    except Exception as e:
        raise CrudError(f"Failed to add person with employee_id '{employee_id}': {str(e)}")
