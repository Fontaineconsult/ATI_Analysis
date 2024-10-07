#
# IMPLEMENTATION READ QUERIES
#
from app.data_config import working_group_names
from app.database.graph_schema import *
from neomodel import db

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

def get_goal_node(goal_number, working_group):
    """
    Validates the working group and retrieves the Goal node if it exists.

    :param goal_number: The goal number
    :param working_group: The working group short name (pro, web, ins)
    :return: Inflated Goal node if found, otherwise raises an error
    """
    # Validate working_group

    try:
        working_group = working_group_names[working_group]
    except KeyError:
        raise ValueError('Invalid working group name. Must be one of: pro, web, ins')

    # Parameters for the query
    params = {
        'wg_name': working_group,
        'goal_number': goal_number
    }

    # Cypher query to find the ATIWorkingGroup node
    wg_query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})
    RETURN wg
    """

    # Execute the query to check if the working group exists
    wg_results, _ = db.cypher_query(wg_query, params)
    if not wg_results:
        raise ValueError(f'ATIWorkingGroup with name "{params["wg_name"]}" does not exist.')

    # Inflate the ATIWorkingGroup node
    working_group_node = ATIWorkingGroup.inflate(wg_results[0][0])

    # Cypher query to find the Goal node connected to the ATIWorkingGroup
    goal_query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(goal:Goal {goal_number: $goal_number})
    RETURN goal
    """

    # Execute the query to find the Goal node
    goal_results, _ = db.cypher_query(goal_query, params)
    if not goal_results:
        return None  # No Goal found

    # Inflate the Goal node
    goal_node = Goal.inflate(goal_results[0][0])
    return goal_node




