from neomodel import db
from app.database.neomodelschema import YearSuccessEvidence, AcademicYear

# Set up your database connection
db.set_connection('bolt://neo4j:testtest@localhost:7687')

# Query all YearSuccessEvidence nodes

def one():

    all_year_success_evidence_nodes = YearSuccessEvidence.nodes.all()

    # Loop through each node
    for node in all_year_success_evidence_nodes:

        lower = node.year_identifier.lower()
        names = lower.split("-")
        name = f"{names[0].replace('/','-')}-{names[1]}-{names[2][:3]}"
        print(name)


        node.year_identifier = name
        # Save the changes to the database

        node.save()

    print("All YearSuccessEvidence nodes have been updated.")


def two():
    all_academic_year_nodes = AcademicYear.nodes.all()

    # Loop through each node
    for node in all_academic_year_nodes:

        # Replace "/" with "-" in the name attribute
        node.name = node.name.replace("/", "-")

        # Save the changes to the database
        node.save()

two()