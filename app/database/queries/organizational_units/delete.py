#
# ORGANIZATIONAL UNITS DELETE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError

def delete_department(name: str) -> bool:
    """
    Deletes a department node from the graph
    :param name: Name of the department
    :return: True if the department node is deleted successfully, False otherwise
    """
    try:
        department = Department.nodes.get(name=name)
        department.delete()
        print("Deleted department")
        return True
    except Department.DoesNotExist:
        raise NotFoundError(f"Department '{name}' does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to delete department '{name}': {e}")

def delete_vendor(name: str) -> bool:
    """
    Deletes a vendor node from the graph
    :param name: Name of the vendor
    :return: True if the vendor node is deleted successfully, False otherwise
    """
    try:
        vendor = Vendor.nodes.get(name=name)
        vendor.delete()
        print("Deleted vendor")
        return True
    except Vendor.DoesNotExist:
        raise NotFoundError(f"Vendor '{name}' does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to delete vendor '{name}': {e}")

def delete_college(name: str) -> bool:
    """
    Deletes a college node from the graph
    :param name: Name of the college
    :return: True if the college node is deleted successfully, False otherwise
    """
    try:
        college = College.nodes.get(name=name)
        college.delete()
        print("Deleted college")
        return True
    except College.DoesNotExist:
        raise NotFoundError(f"College '{name}' does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to delete college '{name}': {e}")
