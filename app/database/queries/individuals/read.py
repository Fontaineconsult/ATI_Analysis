#
# INDIVIDUAL READ QUERIES
#
from app.database.graph_schema import *



def get_all_persons() -> list:
    """
    Get all person nodes from the graph
    :return: List of individual nodes
    """
    return Person.nodes.all()