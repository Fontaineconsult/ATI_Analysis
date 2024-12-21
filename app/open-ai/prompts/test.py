from app.graphRag.connector import Neo4jConnection


def plan_overview():

    connection = Neo4jConnection()
    query = connection.query_from_file('../../database/batch/support/current_year_plans.cypher')

    print(query)
    #
    #
    # test_prompt = {
    #
    #     {"role": "system", "content": "You are an analysis agent. Please take these notes and formulate a overview of whats happening"},
    #     {"role": "user", "content": prompt},
    #
    #
    #
    # }

print(plan_overview())