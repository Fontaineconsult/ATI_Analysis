#
# PRINCIPLE READ QUERIES
#
# `derives_from` targets are heterogeneous (six Governance labels OR IntellectualSource), so
# grounding is read with Cypher pattern comprehensions and assembled in Python — there is no
# single typed neomodel relationship that could inflate them. `shapes` -> UniversalDescriptor
# is read the same way for uniformity.
#
from neomodel import db

from app.database.graph_schema import Principle
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

# Governance label -> API type key (mirrors GOVERNANCE_TYPE_TO_CLASS in queries/governance/read.py).
_LABEL_TO_GOV_TYPE = {
    "Law": "law",
    "Case": "case",
    "Directive": "directive",
    "ExternalPolicy": "external_policy",
    "Memo": "memo",
    "Guideline": "guideline",
}
_GOV_LABELS = list(_LABEL_TO_GOV_TYPE.keys())

_PROJECTION = """
    p.handle AS handle, p.name AS name,
    p.description_short AS description_short, p.description_full AS description_full,
    [(p)-[:derives_from]->(g) WHERE any(l IN labels(g) WHERE l IN $gov_labels)
        | {labels: labels(g), unique_id: g.unique_id, title: g.title}] AS governance,
    [(p)-[:derives_from]->(s:IntellectualSource) | {unique_id: s.unique_id, name: s.name}] AS sources,
    [(p)-[:shapes]->(d:UniversalDescriptor)
        | {descriptor_handle: d.descriptor_handle, title: d.title, descriptor_kind: d.descriptor_kind}] AS shapes
"""


def _resolve(handle):
    node = Principle.nodes.get_or_none(handle=handle)
    if node is None:
        raise NotFoundError(f"Principle {handle!r} not found")
    return node


def _row_to_principle(r) -> dict:
    governance = []
    for g in (r[4] or []):
        labels = g.get("labels") or []
        gov_type = next((_LABEL_TO_GOV_TYPE[l] for l in labels if l in _LABEL_TO_GOV_TYPE), None)
        governance.append({"type": gov_type, "unique_id": g.get("unique_id"), "title": g.get("title")})
    sources = [{"unique_id": s.get("unique_id"), "name": s.get("name")} for s in (r[5] or [])]
    shapes = [
        {
            "descriptor_handle": d.get("descriptor_handle"),
            "title": d.get("title"),
            "descriptor_kind": d.get("descriptor_kind"),
        }
        for d in (r[6] or [])
    ]
    return {
        "handle": r[0],
        "name": r[1],
        "description_short": r[2],
        "description_full": r[3],
        "grounded_in": {"governance": governance, "intellectual_sources": sources},
        "shapes": shapes,
    }


def get_all_principles() -> list:
    rows, _ = db.cypher_query(
        f"MATCH (p:Principle) RETURN {_PROJECTION} ORDER BY p.handle",
        {"gov_labels": _GOV_LABELS},
    )
    return [_row_to_principle(r) for r in rows]


def get_principle(handle) -> dict:
    _resolve(handle)  # 404 if missing
    rows, _ = db.cypher_query(
        f"MATCH (p:Principle {{handle: $handle}}) RETURN {_PROJECTION}",
        {"handle": handle, "gov_labels": _GOV_LABELS},
    )
    return _row_to_principle(rows[0])
