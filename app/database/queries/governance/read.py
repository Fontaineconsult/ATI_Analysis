#
# GOVERNANCE READ QUERIES
#
import json

from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError
from neomodel import db

# API "type" key  ->  neomodel node class. Single source of truth for the
# governance type dispatch across read / create / update / delete.
GOVERNANCE_TYPE_TO_CLASS = {
    "law": Law,
    "case": Case,
    "directive": Directive,
    "external_policy": ExternalPolicy,
    "memo": Memo,
    "guideline": Guideline,
}


def get_all_governance_items() -> list:
    """
    Return every governance node across all 6 types, projected into a uniform
    JSON-friendly shape. Type-specific fields appear as null on nodes that
    don't carry them, which keeps the frontend rendering logic simple.
    """
    query = """
        CALL {
          MATCH (n:Law) RETURN n, 'law' AS type
          UNION ALL
          MATCH (n:Case) RETURN n, 'case' AS type
          UNION ALL
          MATCH (n:Directive) RETURN n, 'directive' AS type
          UNION ALL
          MATCH (n:ExternalPolicy) RETURN n, 'external_policy' AS type
          UNION ALL
          MATCH (n:Memo) RETURN n, 'memo' AS type
          UNION ALL
          MATCH (n:Guideline) RETURN n, 'guideline' AS type
        }
        RETURN apoc.convert.toJson(collect({
          type: type,
          unique_id: n.unique_id,
          title: n.title,
          description: n.description,
          effective_date: toString(n.effective_date),
          last_updated: toString(n.last_updated),
          authored_date: toString(n.authored_date),
          relevant_sections: n.relevant_sections,
          legislative_authority: n.legislative_authority,
          ruling: n.ruling,
          source_institution: n.source_institution,
          documents: [(n)-[:is_documented_by]->(d:Document) |
            {unique_id: d.unique_id, name: d.name, uri_path: d.uri_path, file_path: d.file_path}
          ],
          webpages: [(n)-[:is_documented_by]->(w:Webpage) |
            {unique_id: w.unique_id, name: w.name, url: w.url}
          ]
        })) AS jsonResult
    """
    results, _meta = db.cypher_query(query)
    if not results or not results[0] or not results[0][0]:
        return []
    return json.loads(results[0][0])


def get_governance_item(governance_type: str, unique_id: str):
    """
    Fetch one governance node by type + unique_id. Returns the neomodel
    instance; caller may .serialize() or read properties directly.
    """
    cls = GOVERNANCE_TYPE_TO_CLASS.get(governance_type)
    if cls is None:
        raise NotFoundError(f"Unknown governance type '{governance_type}'.")
    node = cls.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"{cls.__name__} with unique_id '{unique_id}' not found.")
    return node
