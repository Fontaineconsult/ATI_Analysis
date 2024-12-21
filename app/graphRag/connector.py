from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

class Neo4jConnection:
    def __init__(self):
        """Initialize the connection to the Neo4j database."""
        load_dotenv(dotenv_path='../.env.development')
        self.uri = os.getenv('DATABASE_URL')
        self.user = os.getenv('NEO4J_USERNAME')
        self.password = os.getenv('NEO4J_PASSWORD')

    def query(self, query, parameters=None):
        """Run a Cypher query on the Neo4j database and automatically close the connection."""
        with GraphDatabase.driver(self.uri, auth=(self.user, self.password)) as driver:
            with driver.session() as session:
                result = session.run(query, parameters)
                return [record for record in result]

    def query_from_file(self, file_path):
        """Run a Cypher query from a file on the Neo4j database and automatically close the connection."""
        with open(file_path, 'r') as file:
            query = file.read()
        return self.query(query)
