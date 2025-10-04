#
# IMPLEMENTATION READ QUERIES
#
from app.data_config import working_group_names
from app.database.graph_schema import *
from neomodel import db

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError


def get_all_guidances():
    """
    Get all Guidance nodes from the graph
    :return: List of Guidance nodes
    """
    try:
        return Guidance.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch guidances: {e}")


def get_all_processes():
    """
    Get all Process nodes from the graph
    :return: List of Process nodes
    """
    try:
        return Process.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch processes: {e}")


def get_all_projects():
    """
    Get all Project nodes from the graph
    :return: List of Project nodes
    """
    try:
        return Project.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch projects: {e}")


def get_all_procedures():
    """
    Get all Procedure nodes from the graph
    :return: List of Procedure nodes
    """
    try:
        return Procedure.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch procedures: {e}")


def get_all_services():
    """
    Get all Service nodes from the graph
    :return: List of Service nodes
    """
    try:
        return Service.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch services: {e}")


def get_all_plans():
    """
    Get all Plan nodes from the graph
    :return: List of Plan nodes
    """
    try:
        return Plan.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch plans: {e}")


def get_all_trackings():
    """
    Get all Tracking nodes from the graph
    :return: List of Tracking nodes
    """
    try:
        return Tracking.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch trackings: {e}")


def get_all_internal_policies():
    """
    Get all InternalPolicy nodes from the graph
    :return: List of InternalPolicy nodes
    """
    try:
        return InternalPolicy.nodes.all()
    except Exception as e:
        raise NotFoundError(f"Failed to fetch internal policies: {e}")


def get_goal_node(goal_number, working_group):
    """
    Validates the working group and retrieves the Goal node if it exists.

    :param goal_number: The goal number
    :param working_group: The working group short name (pro, web, ins)
    :return: Inflated Goal node if found, otherwise raises an error
    """
    try:
        working_group = working_group_names[working_group]
    except KeyError:
        raise ValueError('Invalid working group name. Must be one of: pro, web, ins')

    params = {
        'wg_name': working_group,
        'goal_number': goal_number
    }

    try:
        wg_query = """
        MATCH (wg:ATIWorkingGroup {name: $wg_name})
        RETURN wg
        """
        wg_results, _ = db.cypher_query(wg_query, params)
        if not wg_results:
            raise NotFoundError(f'ATIWorkingGroup with name "{params["wg_name"]}" does not exist.')

        working_group_node = ATIWorkingGroup.inflate(wg_results[0][0])

        goal_query = """
        MATCH (wg:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(goal:Goal {goal_number: $goal_number})
        RETURN goal
        """
        goal_results, _ = db.cypher_query(goal_query, params)
        if not goal_results:
            return None

        goal_node = Goal.inflate(goal_results[0][0])
        return goal_node
    except Exception as e:
        raise NotFoundError(f"Failed to retrieve goal: {e}")



def get_all_implementations_by_type(implementation_type: str) -> list:
    """
    Get all implementation nodes of a specific type.

    :param implementation_type: Type of implementation (Process, Project, etc.)
    :return: List of implementation nodes
    """
    from app.database.class_factory import implementation_classes

    if implementation_type not in implementation_classes:
        raise ValidationError(f"Invalid implementation_type: {implementation_type}")

    try:
        implementation_class = implementation_classes[implementation_type]
        implementations = implementation_class.nodes.all()

        return [{
            'unique_id': impl.unique_id,
            'title': impl.title,
            'description': impl.description,
            'type': implementation_type
        } for impl in implementations]
    except Exception as e:
        raise CrudError(f"Error retrieving {implementation_type} implementations: {e}")
