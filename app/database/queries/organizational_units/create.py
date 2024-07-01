#
# ORGANIZATIONAL UNITS CREATE QUERIES
#
from app.database.graph_schema import *

def add_department(name: str, location: str) -> bool:
    """
    Adds a department node to the graph
    :param name: Name of the department
    :param location: Location of the department
    :return: True if the department node is added successfully, False otherwise
    """
    try:
        new_department = Department(
            name=name,
            location=location
        )
        new_department.save()
        print("Added department")
        return True
    except Exception as e:
        print(e)
        return False

def add_vendor(name: str, location: str) -> bool:
    """
    Adds a vendor node to the graph
    :param name: Name of the vendor
    :param location: Location of the vendor
    :return: True if the vendor node is added successfully, False otherwise
    """
    try:
        new_vendor = Vendor(
            name=name,
            location=location
        )
        new_vendor.save()
        print("Added vendor")
        return True
    except Exception as e:
        print(e)
        return False