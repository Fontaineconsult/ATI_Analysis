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
