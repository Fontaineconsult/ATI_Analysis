#
# INDIVIDUAL READ QUERIES
#
from app.database.graph_schema import *


def get_all_individuals() -> list:
    """
    Get all individual nodes from the graph
    :return: List of individual nodes
    """
    return Person.nodes.all()