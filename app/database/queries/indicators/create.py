#
# INDICATOR CREATE QUERIES
#
from datetime import datetime as dt
from os import removedirs

from neomodel import db
from app.database.graph_schema import *
from app.data_config import working_group_names

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError

def create_success_indicator(number,
                             sub_committee,
                             success_indicator_text,
                             date_added=None,
                             removed=False):
    if date_added is None:
        date_added = dt.now()

    try:
        working_group = working_group_names[sub_committee]
    except KeyError:
        raise ValidationError('Invalid sub-committee name. One of: pro, web, ins')

    composite_key = f'{number}-{sub_committee}'
    goal_number = int(str(number).split('.')[0])

    params = {
        'wg_name': working_group,
        'goal_number': goal_number
    }

    query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(goal:Goal {goal_number: $goal_number})
    RETURN goal
    """

    try:
        results, _ = db.cypher_query(query, params)
        if not results:
            raise NotFoundError(f'Goal with number {params["goal_number"]} does not exist in working group {params["wg_name"]}')
        goal_node = Goal.inflate(results[0][0])
    except Exception as e:
        raise CrudError(f"Failed to find or create goal node: {str(e)}")

    existing_indicator = SuccessIndicator.nodes.filter(composite_key=composite_key).all()
    if existing_indicator:
        raise ValidationError(f'SuccessIndicator with composite_key "{composite_key}" already exists.')

    try:
        indicator = SuccessIndicator(
            number=number,
            success_indicator=success_indicator_text,
            composite_key=composite_key,
            date_added=date_added,
            removed=removed
        )
        indicator.save()
        goal_node.supporting_success_indicators.connect(indicator)
    except Exception as e:
        raise CrudError(f"Failed to create SuccessIndicator: {str(e)}")


def add_goal(goal, goal_number, name, removed, working_group):
    try:
        working_group = working_group_names[working_group]
    except KeyError:
        raise ValidationError('Invalid working group name. One of: pro, web, ins')

    params = {
        'wg_name': working_group,
        'goal_number': goal_number
    }

    query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})
    RETURN wg
    """

    try:
        results, _ = db.cypher_query(query, params)
        if not results:
            raise NotFoundError(f'ATIWorkingGroup with name "{params["wg_name"]}" does not exist.')
        working_group_node = ATIWorkingGroup.inflate(results[0][0])
    except Exception as e:
        raise CrudError(f"Failed to retrieve working group: {str(e)}")

    query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(goal:Goal {goal_number: $goal_number})
    RETURN goal
    """

    try:
        results, _ = db.cypher_query(query, params)
        if results:
            raise ValidationError(f'Goal with number {params["goal_number"]} already exists in {params["wg_name"]}')
    except Exception as e:
        raise CrudError(f"Failed to check for existing goal: {str(e)}")

    try:
        goal_node = Goal(
            goal=goal,
            goal_number=goal_number,
            name=name,
            removed=removed
        )
        goal_node.save()
        working_group_node.responsible_for.connect(goal_node)
    except Exception as e:
        raise CrudError(f"Failed to create goal: {str(e)}")
