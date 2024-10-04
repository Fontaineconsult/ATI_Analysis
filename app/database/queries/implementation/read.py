#
# IMPLEMENTATION READ QUERIES
#
from app.database.graph_schema import *


def get_all_guidances():
    """
    Get all Guidance nodes from the graph
    :return: List of Guideline nodes
    """
    return Guidance.nodes.all()


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

def get_all_plans():
    """
    Get all Plan nodes from the graph
    :return: List of Plan nodes
    """
    return Plan.nodes.all()

def get_all_trackings():
    """
    Get all Tracking nodes from the graph
    :return: List of Tracking nodes
    """
    return Tracking.nodes.all()

def get_all_internal_policies():
    """
    Get all InternalPolicy nodes from the graph
    :return: List of InternalPolicy nodes
    """
    return InternalPolicy.nodes.all()