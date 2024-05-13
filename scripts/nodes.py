from neomodel import db
from neomodelschema import YearSuccessEvidence, SuccessIndicator

# Set up your database connection
db.set_connection('bolt://neo4j:testtest@localhost:7687')

# Query all YearSuccessEvidence nodes
all_year_success_evidence_nodes = SuccessIndicator.nodes.all()

# Loop through each node
for node in all_year_success_evidence_nodes:

    lower = node.composite_key.lower()
    names = lower.split("-")
    name = f"{names[0]}-{names[1][:3]}"
    print(name)


    node.composite_key = name
    # Save the changes to the database
    node.save()

print("All YearSuccessEvidence nodes have been updated.")