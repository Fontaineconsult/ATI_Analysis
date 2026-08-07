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

def delete_campus(name: str) -> bool:
    """
    Deletes a campus node from the graph
    :param name: Name of the campus
    :return: True if the campus node is deleted successfully, False otherwise
    """
    try:
        campus = Campus.nodes.get(name=name)
        campus.delete()
        print("Deleted campus")
        return True
    except Campus.DoesNotExist:
        raise NotFoundError(f"Campus '{name}' does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to delete campus '{name}': {e}")

def delete_org_unit(unit_type: str, name: str) -> bool:
    """
    Delete a local org unit (Department or College) by unique name. The
    sanctioned path for the /organizational-units DELETE endpoint. Deletion
    detaches all edges (employs, operates_under_campus) with the node — the UI
    surfaces the employee count and confirms before calling this.

    Raises ValidationError on a bad type, NotFoundError if missing, CrudError
    on failure.
    """
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError

    unit_types = {"department": Department, "college": College}
    unit_cls = unit_types.get((unit_type or "").strip().lower())
    if unit_cls is None:
        raise ValidationError(
            f"Unknown unit_type {unit_type!r}. Valid types: ['college', 'department']"
        )
    try:
        unit = unit_cls.nodes.get(name=name)
    except unit_cls.DoesNotExist:
        raise NotFoundError(f"{unit_cls.__name__} {name!r} does not exist.")
    try:
        unit.delete()
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete {unit_cls.__name__} {name!r}: {e}")
