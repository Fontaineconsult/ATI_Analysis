from app.database.neomodelschema import *
from neomodel import db, config
from neomodel import StructuredNode
from typing import Any
from functools import wraps
from typing import Callable
from neomodel import db
from neo4j.graph import Node
import json

config.DATABASE_URL = "bolt://neo4j:testtest@localhost:7687"

# def serialize_results(func: Callable) -> Callable:
#     @wraps(func)
#     def wrapper(*args, **kwargs):
#         results = func(*args, **kwargs)
#         serialized_results = []
#         for result in results:
#             serialized_result = {}
#             for item in result:
#                 print(item)
#                 if isinstance(item, list):
#                     serialized_result[item[0].__class__.__name__] = [sub_item.serialize for sub_item in item]
#                 elif item is not None:
#
#                     serialized_result[item.__class__.__name__] = item.serialize
#             serialized_results.append(serialized_result)
#         return serialized_results
#     return wrapper

# @serialize_results
# def fetch_success_indicators():
#     query = ("""
#         MATCH (yse:YearSuccessEvidence {year_identifier: "2020-2021-5.2-pro"})
#         MATCH (yse)-[:success_indicator_is]-(si:SuccessIndicator)-[:is_a_success_indicator_of]->(g:Goal)
#         WITH yse, si, collect(g) AS Goals
#         MATCH (yse)-[:status_is]->(sl:StatusLevel)
#         WITH yse, si, Goals, collect(sl) AS StatusLevels
#         MATCH (yse)-[:status_in_year]->(ay:AcademicYear)
#         OPTIONAL MATCH (yse)-[:implemented_by]->(p:Person)
#         WITH yse, si, Goals, StatusLevels, ay, collect(p) AS Persons
#         OPTIONAL MATCH (yse)-[:has_document]->(d:Document)
#         RETURN si AS SuccessIndicator, Goals, yse AS YearSuccessEvidence, StatusLevels,
#                ay AS AcademicYear, Persons, collect(d) AS Documents
#     """)
#     results, _ = db.cypher_query(query)
#     return results
#
#
# nodes = fetch_success_indicators()
#
# all = []
# results = {}
#
#
# def recurse_nodes(nodes: list):
#
#
#     if isinstance(nodes, Node):
#
#         if results.get(list(nodes.labels)[0]):
#             return
#
#         results[list(nodes.labels)[0]] = nodes._properties
#
#         # print(list(nodes.labels)[0])
#         # print(nodes._properties)
#
#     if isinstance(nodes, list):
#         print(len(nodes), nodes)
#
#         for node in nodes:
#             recurse_nodes(node)
#
#
#
# recurse_nodes(nodes)
# print(json.dumps(results))



def fetch_success_indicators():
    year_identifier = "2020-2021-5.2-pro"
    yse_node = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)

    si_nodes = yse_node.related_success_indicator.all()
    g_nodes = [si.associated_goal.all() for si in si_nodes]
    sl_nodes = yse_node.status_level.all()
    ay_node = yse_node.academic_year.all()
    p_nodes = yse_node.implemented_by.all()
    d_nodes = yse_node.has_documents.all()

    return si_nodes, g_nodes, yse_node, sl_nodes, ay_node, p_nodes, d_nodes
test = fetch_success_indicators()

print((test[0][0].__class__.__name__))