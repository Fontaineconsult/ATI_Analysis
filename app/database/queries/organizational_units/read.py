#
# ORGANIZATIONAL UNITS WRITE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError

def get_all_departments() -> list:
    """
    Get all department nodes from the graph
    :return: List of department nodes
    """
    try:
        return Department.nodes.all()
    except Exception as e:
        raise CrudError(f"Failed to retrieve departments: {e}")

def get_all_colleges() -> list:
    """
    Get all college nodes from the graph
    :return: List of college nodes
    """
    try:
        return College.nodes.all()
    except Exception as e:
        raise CrudError(f"Failed to retrieve colleges: {e}")

def get_all_vendors() -> list:
    """
    Get all vendor nodes from the graph
    :return: List of vendor nodes
    """
    try:
        return Vendor.nodes.all()
    except Exception as e:
        raise CrudError(f"Failed to retrieve vendors: {e}")

def get_all_campuses() -> list:
    """
    Get all campus nodes from the graph
    :return: List of campus nodes
    """
    try:
        return Campus.nodes.all()
    except Exception as e:
        raise CrudError(f"Failed to retrieve campuses: {e}")

def get_campus_by_name(name: str):
    """
    Get a campus node by name
    :param name: Name of the campus
    :return: Campus node
    """
    try:
        return Campus.nodes.get(name=name)
    except Campus.DoesNotExist:
        raise CrudError(f"Campus '{name}' does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve campus '{name}': {e}")

def get_departments_by_campus(campus_name: str) -> list:
    """
    Get all departments that operate under a given campus
    :param campus_name: Name of the campus
    :return: List of department nodes
    """
    try:
        campus = Campus.nodes.get(name=campus_name)
        return [d for d in Department.nodes.all() if d.operates_under_campus.is_connected(campus)]
    except Campus.DoesNotExist:
        raise CrudError(f"Campus '{campus_name}' does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve departments for campus '{campus_name}': {e}")

def get_colleges_by_campus(campus_name: str) -> list:
    """
    Get all colleges that operate under a given campus
    :param campus_name: Name of the campus
    :return: List of college nodes
    """
    try:
        campus = Campus.nodes.get(name=campus_name)
        return [c for c in College.nodes.all() if c.operates_under_campus.is_connected(campus)]
    except Campus.DoesNotExist:
        raise CrudError(f"Campus '{campus_name}' does not exist.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve colleges for campus '{campus_name}': {e}")
