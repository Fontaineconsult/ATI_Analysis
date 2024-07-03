#
# ORGANIZATIONAL UNITS UPDATE QUERIES
#
from app.database.graph_schema import *

from app.database.graph_schema import Department, Person

def assign_employee_to_department(department_name, employee_id):
    # Retrieve the department and the employee nodes from the database
    department = Department.nodes.get(name=department_name)
    employee = Person.nodes.get(employee_id=employee_id)

    # Check if the connection already exists
    if not department.employs.is_connected(employee):
        # Create a relationship between the department and the employee if not already connected
        department.employs.connect(employee)
        # Save the changes to the database
        department.save()
        employee.save()
        print(f"Employee {employee_id} has been successfully assigned to the department {department_name}.")
    else:
        # Optionally, indicate that the connection already exists
        print(f"Employee {employee_id} is already assigned to the department {department_name}.")


def assign_employee_to_college(college_name, employee_id):
    # Retrieve the college and the employee nodes from the database
    college = College.nodes.get(name=college_name)
    employee = Person.nodes.get(employee_id=employee_id)

    # Check if the connection already exists
    if not college.employs.is_connected(employee):
        # Create a relationship between the college and the employee if not already connected
        college.employs.connect(employee)
        # Save the changes to the database
        college.save()
        employee.save()
        print(f"Employee {employee_id} has been successfully assigned to the college {college_name}.")
    else:
        # Optionally, indicate that the connection already exists
        print(f"Employee {employee_id} is already assigned to the college {college_name}.")


def assign_employee_to_vendor(vendor_name, employee_id):
    # Retrieve the vendor and the employee nodes from the database
    vendor = Vendor.nodes.get(name=vendor_name)
    employee = Person.nodes.get(employee_id=employee_id)

    # Check if the connection already exists
    if not vendor.employs.is_connected(employee):
        # Create a relationship between the vendor and the employee if not already connected
        vendor.employs.connect(employee)
        # Save the changes to the database
        vendor.save()
        employee.save()
        print(f"Employee {employee_id} has been successfully assigned to the vendor {vendor_name}.")
    else:
        # Optionally, indicate that the connection already exists
        print(f"Employee {employee_id} is already assigned to the vendor {vendor_name}.")