#
# ORGANIZATIONAL UNITS UPDATE QUERIES
#
from app.database.graph_schema import *
from app.database.graph_schema import Department, Person
from app.endpoints.data_api.errors.custom_exceptions import CrudError

def assign_employee_to_department(department_name, employee_id):
    try:
        # Retrieve the department and the employee nodes from the database
        department = Department.nodes.get(name=department_name)
        employee = Person.nodes.get(employee_id=employee_id)

        # Check if the connection already exists
        if not department.employs.is_connected(employee):
            # Create a relationship between the department and the employee if not already connected
            department.employs.connect(employee)
            print(f"Employee {employee_id} has been successfully assigned to the department {department_name}.")
        else:
            print(f"Employee {employee_id} is already assigned to the department {department_name}.")
    except Exception as e:
        raise CrudError(f"Error assigning employee {employee_id} to department {department_name}: {e}")


def assign_employee_to_college(college_name, employee_id):
    try:
        # Retrieve the college and the employee nodes from the database
        college = College.nodes.get(name=college_name)
        employee = Person.nodes.get(employee_id=employee_id)

        # Check if the connection already exists
        if not college.employs.is_connected(employee):
            # Create a relationship between the college and the employee if not already connected
            college.employs.connect(employee)
            print(f"Employee {employee_id} has been successfully assigned to the college {college_name}.")
        else:
            print(f"Employee {employee_id} is already assigned to the college {college_name}.")
    except Exception as e:
        raise CrudError(f"Error assigning employee {employee_id} to college {college_name}: {e}")


def assign_employee_to_vendor(vendor_name, employee_id):
    try:
        # Retrieve the vendor and the employee nodes from the database
        vendor = Vendor.nodes.get(name=vendor_name)
        employee = Person.nodes.get(employee_id=employee_id)

        # Check if the connection already exists
        if not vendor.employs.is_connected(employee):
            # Create a relationship between the vendor and the employee if not already connected
            vendor.employs.connect(employee)
            print(f"Employee {employee_id} has been successfully assigned to the vendor {vendor_name}.")
        else:
            print(f"Employee {employee_id} is already assigned to the vendor {vendor_name}.")
    except Exception as e:
        raise CrudError(f"Error assigning employee {employee_id} to vendor {vendor_name}: {e}")


def assign_department_to_campus(department_name, campus_name):
    try:
        department = Department.nodes.get(name=department_name)
        campus = Campus.nodes.get(name=campus_name)

        if not department.operates_under_campus.is_connected(campus):
            department.operates_under_campus.connect(campus)
            print(f"Department {department_name} has been successfully assigned to campus {campus_name}.")
        else:
            print(f"Department {department_name} is already assigned to campus {campus_name}.")
    except Exception as e:
        raise CrudError(f"Error assigning department {department_name} to campus {campus_name}: {e}")


def assign_college_to_campus(college_name, campus_name):
    try:
        college = College.nodes.get(name=college_name)
        campus = Campus.nodes.get(name=campus_name)

        if not college.operates_under_campus.is_connected(campus):
            college.operates_under_campus.connect(campus)
            print(f"College {college_name} has been successfully assigned to campus {campus_name}.")
        else:
            print(f"College {college_name} is already assigned to campus {campus_name}.")
    except Exception as e:
        raise CrudError(f"Error assigning college {college_name} to campus {campus_name}: {e}")


def unassign_department_from_campus(department_name, campus_name):
    try:
        department = Department.nodes.get(name=department_name)
        campus = Campus.nodes.get(name=campus_name)

        if department.operates_under_campus.is_connected(campus):
            department.operates_under_campus.disconnect(campus)
            print(f"Department {department_name} has been removed from campus {campus_name}.")
        else:
            print(f"Department {department_name} is not assigned to campus {campus_name}.")
    except Exception as e:
        raise CrudError(f"Error removing department {department_name} from campus {campus_name}: {e}")


def unassign_college_from_campus(college_name, campus_name):
    try:
        college = College.nodes.get(name=college_name)
        campus = Campus.nodes.get(name=campus_name)

        if college.operates_under_campus.is_connected(campus):
            college.operates_under_campus.disconnect(campus)
            print(f"College {college_name} has been removed from campus {campus_name}.")
        else:
            print(f"College {college_name} is not assigned to campus {campus_name}.")
    except Exception as e:
        raise CrudError(f"Error removing college {college_name} from campus {campus_name}: {e}")


def rename_campus(campus_name, new_name):
    try:
        campus = Campus.nodes.get(name=campus_name)
        campus.name = new_name
        campus.save()
        print(f"Campus renamed from {campus_name} to {new_name}.")
    except Exception as e:
        raise CrudError(f"Error renaming campus {campus_name}: {e}")
