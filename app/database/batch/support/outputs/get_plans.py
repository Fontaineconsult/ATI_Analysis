from app.database.graph_schema import set_connection
from neomodel import db

def main():
    set_connection()

    # Read the query from the file
    with open('../current_year_plans.cypher', 'r') as file:
        query = file.read()

    # Run the query
    results, meta = db.cypher_query(query)
    # Create a mapping from column names to indices
    column_indices = {key: idx for idx, key in enumerate(meta)}

    # Process and print the results
    for record in results:
        plan = record[column_indices['p']]
        ay = record[column_indices['ay']]
        yse = record[column_indices['yse']]
        goal = record[column_indices['g']]

        plan_name = plan['name'] if plan else 'N/A'
        print(f"Plan: {plan_name}")

        ay_name = ay['name'] if ay else 'N/A'
        print(f"  Academic Year: {ay_name}")

        if goal:
            goal_name = goal['name'] if 'name' in goal else 'N/A'
            print(f"  Furthers Goal: {goal_name}")
        else:
            print("  Furthers Goal: None")

        if yse:
            yse_identifier = yse['year_identifier'] if 'year_identifier' in yse else 'N/A'
            print(f"  Furthers Year Success Evidence: {yse_identifier}")
        else:
            print("  Furthers Year Success Evidence: None")

        print("-" * 40)

if __name__ == '__main__':
    main()
