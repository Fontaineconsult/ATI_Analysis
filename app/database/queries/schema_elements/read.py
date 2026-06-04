#
# SCHEMA ELEMENT READ QUERIES
#
from neomodel import db

from app.database.graph_schema import SchemaElement
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

# Projection shared by list + single read. `shaped_by` is the backref of Principle.shapes;
# `concerned_by` is RESERVED for Phase 2 (Determinations) — emitted empty now so the FE shape
# is stable.
_PROJECTION = """
    e.element_kind AS element_kind, e.handle AS handle, e.name AS name,
    [(e)<-[:shapes]-(p:Principle) | {handle: p.handle, name: p.name}] AS shaped_by
"""


def _resolve(handle):
    node = SchemaElement.nodes.get_or_none(handle=handle)
    if node is None:
        raise NotFoundError(f"SchemaElement {handle!r} not found")
    return node


def _row_to_element(r) -> dict:
    return {
        "element_kind": r[0],
        "handle": r[1],
        "name": r[2],
        "shaped_by": r[3] or [],
        "concerned_by": [],  # Phase 2 (Determinations)
    }


def get_all_schema_elements() -> list:
    rows, _ = db.cypher_query(f"MATCH (e:SchemaElement) RETURN {_PROJECTION} ORDER BY e.handle")
    return [_row_to_element(r) for r in rows]


def get_schema_element(handle) -> dict:
    _resolve(handle)  # 404 if missing
    rows, _ = db.cypher_query(
        f"MATCH (e:SchemaElement {{handle: $handle}}) RETURN {_PROJECTION}", {"handle": handle}
    )
    return _row_to_element(rows[0])
