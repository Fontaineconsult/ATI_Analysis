import os

from neomodel import db
from app.database.tools.neomodelschema import YearSuccessEvidence, AcademicYear

# Set up your database connection from the DATABASE_URL env var
# (e.g. bolt://user:pass@host:7687) — never hardcode credentials.
db.set_connection(os.environ["DATABASE_URL"])

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