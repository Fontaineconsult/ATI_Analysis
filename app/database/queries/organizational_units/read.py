#
# ORGANIZATIONAL UNITS WRITE QUERIES
#
from app.database.graph_schema import *


def get_all_departments() -> list:
    """
    Get all department nodes from the graph
    :return: List of department nodes
    """
    return Department.nodes.all()

def get_all_colleges() -> list:
    """
    Get all college nodes from the graph
    :return: List of college nodes
    """
    return College.nodes.all()


def get_all_vendors() -> list:
    """
    Get all vendor nodes from the graph
    :return: List of vendor nodes
    """
    return Vendor.nodes.all()