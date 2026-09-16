#
# INTELLECTUAL SOURCE UPDATE QUERIES
#
from datetime import date

from app.database.graph_schema import IntellectualSource
from app.database.queries.intellectual_sources.create import _coerce_date
from app.database.queries.intellectual_sources.read import _resolve, get_intellectual_source
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError, ValidationError

# Patchable text fields. Present-but-empty clears the field, absent leaves it alone.
_TEXT_FIELDS = ("description_short", "description_full", "url", "author", "publisher", "citation")


def update_intellectual_source(unique_id, data: dict) -> dict:
    """Patch name, descriptions, provenance and attribution. Name stays unique.

    `raw_text` is handled outside the field loop and on the governance contract: the
    capture date moves ONLY when the text itself changes, or an unrelated edit would
    make a stale mirror look freshly captured. Clearing the text clears the date.
    `raw_text_captured` is never taken from the caller.
    """
    data = data or {}
    node = _resolve(unique_id)

    if "name" in data:
        new_name = (data["name"] or "").strip()
        if not new_name:
            raise ValidationError("name cannot be empty")
        if new_name != node.name and IntellectualSource.nodes.filter(name=new_name):
            raise ValidationError(f"IntellectualSource named {new_name!r} already exists")
        node.name = new_name

    for f in _TEXT_FIELDS:
        if f in data:
            setattr(node, f, (data[f] or None))

    if "published_date" in data:
        node.published_date = _coerce_date(data["published_date"]) if data["published_date"] else None

    if "raw_text" in data:
        new_raw_text = data["raw_text"] or None
        if node.raw_text != new_raw_text:
            node.raw_text = new_raw_text
            node.raw_text_captured = date.today() if new_raw_text else None

    try:
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update IntellectualSource {unique_id!r}: {e}")


# --- informs: heterogeneous implementation targets, managed via Cypher by unique_id -------
#
# An intellectual source has no authority, so it never "drives" anything. What it does is
# inform: a campus reads it and writes or revises an implementation from it. Recording that
# is what turns the tab from a reading list into provenance, and it answers the question
# the node type exists for, which is whether an implementation is behind what the field
# knows. Same predicate governance uses to reach a Goal.
#
# Targets span the implementation labels, so one statement keyed on the globally-unique
# unique_id covers any of them. Same idiom as queries/principles._set_derives_from.

def _resolve_implementation(unique_id):
    """Confirm the target exists AND is an implementation, so a typo cannot wire a source
    to a Person or a YSE. Returns the label."""
    from neomodel import db

    from app.database.class_factory import implementation_classes

    rows, _ = db.cypher_query(
        "MATCH (n {unique_id:$uid}) RETURN [l IN labels(n) WHERE l IN $labels][0]",
        {"uid": unique_id, "labels": list(implementation_classes)},
    )
    if not rows:
        raise NotFoundError(f"No node with unique_id {unique_id!r}")
    label = rows[0][0]
    if label is None:
        raise ValidationError(
            f"Node {unique_id!r} is not an implementation; informs targets "
            f"one of {sorted(implementation_classes)}"
        )
    return label


def _set_informs(source_unique_id, implementation_unique_id, connect: bool):
    from neomodel import db

    _resolve(source_unique_id)
    _resolve_implementation(implementation_unique_id)
    if connect:
        db.cypher_query(
            "MATCH (s:IntellectualSource {unique_id:$sid}) MATCH (t {unique_id:$tid}) "
            "MERGE (s)-[:informs]->(t)",
            {"sid": source_unique_id, "tid": implementation_unique_id},
        )
    else:
        db.cypher_query(
            "MATCH (s:IntellectualSource {unique_id:$sid})-[r:informs]->(t {unique_id:$tid}) "
            "DELETE r",
            {"sid": source_unique_id, "tid": implementation_unique_id},
        )


def attach_informed_implementation(source_unique_id, implementation_unique_id) -> dict:
    """Record that this source informed an implementation.

    Returns the full read rather than a bare serialize, so the caller sees the edge it
    just wrote without a second request.
    """
    _set_informs(source_unique_id, implementation_unique_id, connect=True)
    return get_intellectual_source(source_unique_id)


def detach_informed_implementation(source_unique_id, implementation_unique_id) -> dict:
    _set_informs(source_unique_id, implementation_unique_id, connect=False)
    return get_intellectual_source(source_unique_id)
