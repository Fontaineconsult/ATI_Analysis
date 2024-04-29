from flask import Flask, request, jsonify
from neomodel import config
from neomodelschema import *
from neomodel import config, db
app = Flask(__name__)

# Configure your Neo4j database connection
config.DATABASE_URL = 'bolt://neo4j:testtest@localhost:7687'


app = Flask(__name__)


@app.route('/goals', methods=['GET'])
def get_goals():
    goals = Goal.nodes.all()
    print(goals)
    return jsonify([{"name":goal.name, "goal":goal.goal} for goal in goals])

@app.route('/success_indicators',  methods=['GET'])
def create_goal():
    try:
        # Perform a Cypher query to fetch SuccessIndicator along with YearSuccessEvidence and Goals
        query = """
        MATCH (si:SuccessIndicator)-[:is_a_success_indicator_of]->(g:Goal),
              (si)-[:success_indicator_is]->(yse:YearSuccessEvidence)
        RETURN si AS SuccessIndicator, collect(g) AS Goals, collect(yse) AS YearSuccessEvidences
        """
        results, meta = db.cypher_query(query)

        # Parsing the results to a JSON-friendly format
        response = []
        for si, goals, yses in results:
            success_indicator = {
                'number': si['number'],
                'success_indicator': si['success_indicator'],
                'composite_key': si['composite_key'],
                'goals': [{'name': g['name'], 'goal_number': g['goal_number']} for g in goals],
                'year_success_evidences': [{'year_identifier': yse['year_identifier']} for yse in yses]
            }
            response.append(success_indicator)

        return jsonify(response)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True,port=5001)