#
# IMPLEMENTATION READ QUERIES
#
from app.database.graph_schema import *


def get_all_guidelines():
    """
    Get all Guideline nodes from the graph
    :return: List of Guideline nodes
    """
    return Guideline.nodes.all()


def get_all_processes():
    """
    Get all Process nodes from the graph
    :return: List of Process nodes
    """
    return Process.nodes.all()


def get_all_projects():
    """
    Get all Project nodes from the graph
    :return: List of Project nodes
    """
    return Project.nodes.all()


def get_all_procedures():
    """
    Get all Procedure nodes from the graph
    :return: List of Procedure nodes
    """
    return Procedure.nodes.all()


def get_all_services():
    """
    Get all Service nodes from the graph
    :return: List of Service nodes
    """
    return Service.nodes.all()



