#
# INTELLECTUAL SOURCE READ QUERIES
#
from neomodel import db

from app.database.graph_schema import IntellectualSource
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

# One statement covers both edge sets. `is_sourced_from` reaches Webpage or Document;
# `informs` reaches any implementation label. Both are read by unique_id rather than by
# label, so a new implementation label needs no change here.
_EDGES_QUERY = """
MATCH (s:IntellectualSource {unique_id: $uid})
OPTIONAL MATCH (s)-[:is_sourced_from]->(src)
WITH s, collect(DISTINCT CASE WHEN src IS NULL THEN NULL ELSE {
    unique_id: src.unique_id,
    label: labels(src)[0],
    name: coalesce(src.name, src.title),
    url: src.url
} END) AS sources
OPTIONAL MATCH (s)-[:informs]->(impl)
RETURN [x IN sources WHERE x IS NOT NULL] AS sources,
       [(s)-[:informs]->(i) | {
           unique_id: i.unique_id,
           label: labels(i)[0],
           title: i.title,
           retired: i.retired
       }] AS informed_implementations
"""


def _resolve(unique_id):
    node = IntellectualSource.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"IntellectualSource {unique_id!r} not found")
    return node


def _with_edges(node) -> dict:
    """Serialized node plus its source and informs edges."""
    data = node.serialize()
    rows, _ = db.cypher_query(_EDGES_QUERY, {"uid": node.unique_id})
    if rows:
        sources, informed = rows[0]
        data["sources"] = sorted(sources or [], key=lambda s: (s.get("name") or "").lower())
        data["informed_implementations"] = sorted(
            informed or [], key=lambda i: (i.get("title") or "").lower()
        )
    else:
        data["sources"] = []
        data["informed_implementations"] = []
    return data


def get_all_intellectual_sources() -> list:
    """All intellectual sources as serialized dicts, sorted by name.

    The list view carries counts rather than the edge payloads, because a reading list
    needs to show which sources are wired and which are inert without pulling every
    implementation title. The detail read carries the payloads.
    """
    rows, _ = db.cypher_query(
        """
        MATCH (s:IntellectualSource)
        RETURN s.unique_id AS uid,
               size([(s)-[:is_sourced_from]->(x) | 1]) AS source_count,
               size([(s)-[:informs]->(x) | 1]) AS informs_count
        """
    )
    counts = {r[0]: {"source_count": r[1], "informs_count": r[2]} for r in rows}
    out = []
    for s in IntellectualSource.nodes.all():
        data = s.serialize()
        data.update(counts.get(s.unique_id, {"source_count": 0, "informs_count": 0}))
        out.append(data)
    return sorted(out, key=lambda s: (s.get("name") or "").lower())


def get_intellectual_source(unique_id) -> dict:
    return _with_edges(_resolve(unique_id))
