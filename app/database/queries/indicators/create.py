#
# INDICATOR CREATE QUERIES
#
from datetime import datetime as dt
from neomodel import db
from app.database.graph_schema import *
from app.data_config import working_group_names

def create_success_indicator(number,
                             sub_committee,
                             success_indicator_text,
                             date_added=None,
                             removed=False):
    if date_added is None:
        date_added = dt.now()

    # Validate sub_committee
    try:
        working_group = working_group_names[sub_committee]
    except KeyError:
        raise ValueError('Invalid sub-committee name')

    # Create composite_key
    composite_key = f'{number}-{sub_committee}'

    # Extract goal_number from number
    goal_number = int(str(number).split('.')[0])

    # Parameters for the query
    params = {
        'wg_name': working_group,
        'goal_number': goal_number
    }

    # Cypher query to find the Goal node connected to the ATIWorkingGroup
    query = """
    MATCH (wg:ATIWorkingGroup {name: $wg_name})-[:responsible_for]->(goal:Goal {goal_number: $goal_number})
    RETURN goal
    """

    # Execute the query
    results, _ = db.cypher_query(query, params)
    if not results:
        error_text = f'Goal with number {params["goal_number"]} does not exist in working group {params["wg_name"]}'
        raise ValueError(error_text)

    # Inflate the Goal node
    goal_node = Goal.inflate(results[0][0])

    # **New Code Starts Here**

    # Check if a SuccessIndicator with the same composite_key already exists

    existing_indicator = SuccessIndicator.nodes.filter(composite_key=composite_key).all()
    if len(existing_indicator) > 0:
        raise ValueError(f'SuccessIndicator with composite_key "{composite_key}" already exists.')

    # **New Code Ends Here**

    # Create and save the SuccessIndicator node
    indicator = SuccessIndicator(
        number=number,
        success_indicator=success_indicator_text,
        composite_key=composite_key,
        date_added=date_added,
        removed=removed
    )
    indicator.save()

    # Connect the SuccessIndicator to the Goal
    goal_node.supporting_success_indicators.connect(indicator)

