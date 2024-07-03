#
# COMMITTEE READ QUERIES
#
from app.database.graph_schema import *


def get_all_committees() -> list:
    """
    Get all ATIWorkingGroup nodes from the graph
    :return: List of ATIWorkingGroup nodes
    """
    return ATIWorkingGroup.nodes.all()