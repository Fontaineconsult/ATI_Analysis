#
# COMMITTEE UPDATE QUERIES
#
from app.database.graph_schema import *

def add_person_to_committee(employee_id, committee_name):
    """
    Assigns a Person to an ATIWorkingGroup based on the provided person_id and committee_name.

    Parameters:
    - employee_id (str): The unique identifier of the Person to be added.
    - committee_name (str): The name of the ATIWorkingGroup to which the Person will be added.

    Returns:
    - str: A message indicating the success or failure of the operation.
    """
    try:
        # Retrieve the Person and ATIWorkingGroup nodes from the database
        person = Person.nodes.get(employee_id=employee_id)
        committee = ATIWorkingGroup.nodes.get(name=committee_name)

        # Create the relationship between the Person and the ATIWorkingGroup
        person.in_ati_working_group.connect(committee)

        return f"Person with ID {employee_id} has been successfully added to the committee '{committee_name}'."
    except Exception as e:
        return f"An error occurred: {str(e)}"