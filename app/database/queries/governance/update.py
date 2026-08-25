#
# GOVERNANCE UPDATE QUERIES
#
from datetime import date

from neomodel import db

from app.database.graph_schema import Document, Goal, SuccessIndicator, Webpage
from app.database.queries.governance.create import _DATE_FIELDS, _coerce_date
from app.database.queries.governance.read import GOVERNANCE_TYPE_TO_CLASS
from app.endpoints.data_api.errors.custom_exceptions import CrudError, NotFoundError, ValidationError


def _resolve_governance_node(governance_type: str, unique_id: str):
    """Shared lookup for attach/detach + update flows."""
    cls = GOVERNANCE_TYPE_TO_CLASS.get(governance_type)
    if cls is None:
        raise ValidationError(f"Unknown governance type '{governance_type}'.")
    if not unique_id:
        raise ValidationError("governance unique_id is required.")
    node = cls.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"{cls.__name__} with unique_id '{unique_id}' not found.")
    return node

# Mirrors create-time whitelist + title/description for the common case.
_GOVERNANCE_UPDATABLE_FIELDS = {
    "law": {"title", "description", "effective_date", "last_updated", "relevant_sections", "legislative_authority"},
    "case": {"title", "description", "effective_date", "ruling", "legislative_authority"},
    "directive": {"title", "description", "effective_date", "last_updated", "source_institution"},
    "external_policy": {"title", "description", "effective_date", "last_updated"},
    "memo": {"title", "description", "authored_date"},
    "guideline": {"title", "description", "effective_date", "last_updated"},
}

# See create.py — the source mirror applies to every governance type.
for _type_fields in _GOVERNANCE_UPDATABLE_FIELDS.values():
    _type_fields.add("raw_text")


def update_governance_item(governance_type: str, unique_id: str, data: dict):
    """
    Partial-update by type + unique_id. Only known fields for the given type
    are written; unknown keys are ignored. Returns the saved neomodel
    instance.
    """
    cls = GOVERNANCE_TYPE_TO_CLASS.get(governance_type)
    if cls is None:
        raise ValidationError(f"Unknown governance type '{governance_type}'.")
    if not unique_id:
        raise ValidationError("unique_id is required.")

    node = cls.nodes.get_or_none(unique_id=unique_id)
    if node is None:
        raise NotFoundError(f"{cls.__name__} with unique_id '{unique_id}' not found.")

    allowed = _GOVERNANCE_UPDATABLE_FIELDS[governance_type]
    for field, value in (data or {}).items():
        if field == "raw_text":
            continue  # handled below — it must be clearable, unlike the rest
        if field in allowed and value not in (None, ""):
            if field in _DATE_FIELDS:
                value = _coerce_date(value)
            setattr(node, field, value)

    # raw_text is handled outside the loop for two reasons. The loop skips empty
    # values (a partial-update convention that makes every other field
    # un-clearable), but a bad paste must be removable. And the capture date has
    # to move ONLY when the text itself changes, or an unrelated edit would make
    # a stale mirror look freshly captured. Clearing the text clears the date.
    if "raw_text" in (data or {}):
        new_raw_text = data["raw_text"] or None
        if node.raw_text != new_raw_text:
            node.raw_text = new_raw_text
            node.raw_text_captured = date.today() if new_raw_text else None

    try:
        node.save()
        return node
    except Exception as e:
        raise CrudError(f"Failed to update {cls.__name__}: {e}")


def attach_document_to_governance(governance_type: str, governance_unique_id: str, document_unique_id: str):
    """Connect an existing Document to a governance node as a source (is_sourced_from)."""
    if not document_unique_id:
        raise ValidationError("document_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    doc = Document.nodes.get_or_none(unique_id=document_unique_id)
    if doc is None:
        raise NotFoundError(f"Document with unique_id '{document_unique_id}' not found.")
    try:
        node.source_documents.connect(doc)
        return node
    except Exception as e:
        raise CrudError(f"Failed to attach document: {e}")


def detach_document_from_governance(governance_type: str, governance_unique_id: str, document_unique_id: str):
    """Disconnect a Document from a governance node."""
    if not document_unique_id:
        raise ValidationError("document_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    doc = Document.nodes.get_or_none(unique_id=document_unique_id)
    if doc is None:
        raise NotFoundError(f"Document with unique_id '{document_unique_id}' not found.")
    try:
        node.source_documents.disconnect(doc)
        return node
    except Exception as e:
        raise CrudError(f"Failed to detach document: {e}")


def attach_webpage_to_governance(governance_type: str, governance_unique_id: str, webpage_unique_id: str):
    """Connect an existing Webpage to a governance node as a source (is_sourced_from)."""
    if not webpage_unique_id:
        raise ValidationError("webpage_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    page = Webpage.nodes.get_or_none(unique_id=webpage_unique_id)
    if page is None:
        raise NotFoundError(f"Webpage with unique_id '{webpage_unique_id}' not found.")
    try:
        # Governance sources use the `is_sourced_from` edge (source_webpages), distinct
        # from the evidence-flavored `is_documented_by` used by implementation nodes.
        node.source_webpages.connect(page)
        return node
    except Exception as e:
        raise CrudError(f"Failed to attach webpage: {e}")


def detach_webpage_from_governance(governance_type: str, governance_unique_id: str, webpage_unique_id: str):
    """Disconnect a Webpage from a governance node."""
    if not webpage_unique_id:
        raise ValidationError("webpage_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    page = Webpage.nodes.get_or_none(unique_id=webpage_unique_id)
    if page is None:
        raise NotFoundError(f"Webpage with unique_id '{webpage_unique_id}' not found.")
    try:
        node.source_webpages.disconnect(page)
        return node
    except Exception as e:
        raise CrudError(f"Failed to detach webpage: {e}")


#
# GOVERNANCE -> INDICATOR FRAMEWORK
#
# Two edges, two strengths of claim (see the Governance section docstring in
# graph_schema.py):
#   informs -> Goal              broad, non-committal, property-free
#   drives  -> SuccessIndicator  exact, carrying the citation that makes it checkable
#


def attach_goal_to_governance(governance_type: str, governance_unique_id: str, goal_unique_id: str):
    """Connect a Goal to a governance node as part of its authority landscape (informs).

    Property-free and idempotent: `informs` asserts only that the instrument bears
    on the goal, so there is nothing to qualify and re-attaching is a no-op.
    """
    if not goal_unique_id:
        raise ValidationError("goal_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    goal = Goal.nodes.get_or_none(unique_id=goal_unique_id)
    if goal is None:
        raise NotFoundError(f"Goal with unique_id '{goal_unique_id}' not found.")
    try:
        if not node.informed_goals.is_connected(goal):
            node.informed_goals.connect(goal)
        return node
    except Exception as e:
        raise CrudError(f"Failed to attach goal: {e}")


def detach_goal_from_governance(governance_type: str, governance_unique_id: str, goal_unique_id: str):
    """Disconnect a Goal from a governance node (drop the informs edge)."""
    if not goal_unique_id:
        raise ValidationError("goal_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    goal = Goal.nodes.get_or_none(unique_id=goal_unique_id)
    if goal is None:
        raise NotFoundError(f"Goal with unique_id '{goal_unique_id}' not found.")
    try:
        node.informed_goals.disconnect(goal)
        return node
    except Exception as e:
        raise CrudError(f"Failed to detach goal: {e}")


def _apply_drives_qualifiers(rel, data: dict, *, creating: bool):
    """Write DrivesRel's qualifying properties from a request payload.

    Present-but-empty clears; absent leaves alone. That distinction matters because
    the citation is the substance of a `drives` edge — a typo in a `provision` has
    to be removable, but an edit that only touches `note` must not silently wipe
    the `quote`.
    """
    for field in ("provision", "quote", "note"):
        if field in data:
            value = data.get(field)
            setattr(rel, field, value.strip() if isinstance(value, str) and value.strip() else None)
    if creating:
        rel.added_date = date.today()


def attach_indicator_to_governance(governance_type: str, governance_unique_id: str,
                                   indicator_unique_id: str, data: dict = None):
    """Connect a SuccessIndicator to a governance node as a driven requirement (drives).

    Idempotent by design: re-attaching an already-driven indicator updates the
    qualifiers in place rather than creating a second parallel edge. neomodel's
    `.connect()` does not MERGE, so without the is_connected guard the same
    assertion could be recorded twice with conflicting citations.
    """
    if not indicator_unique_id:
        raise ValidationError("indicator_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    indicator = SuccessIndicator.nodes.get_or_none(unique_id=indicator_unique_id)
    if indicator is None:
        raise NotFoundError(f"SuccessIndicator with unique_id '{indicator_unique_id}' not found.")

    data = data or {}
    try:
        if node.driven_success_indicators.is_connected(indicator):
            rel = node.driven_success_indicators.relationship(indicator)
            _apply_drives_qualifiers(rel, data, creating=False)
            rel.save()
        else:
            rel = node.driven_success_indicators.connect(indicator)
            _apply_drives_qualifiers(rel, data, creating=True)
            rel.save()
        return node
    except Exception as e:
        raise CrudError(f"Failed to attach success indicator: {e}")


def update_governance_drives_indicator(governance_type: str, governance_unique_id: str,
                                       indicator_unique_id: str, data: dict = None):
    """Edit the citation on an existing drives edge without re-creating it.

    Distinct from attach so that editing a citation on an edge that has silently
    gone missing fails loudly instead of quietly re-asserting the claim.
    """
    if not indicator_unique_id:
        raise ValidationError("indicator_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    indicator = SuccessIndicator.nodes.get_or_none(unique_id=indicator_unique_id)
    if indicator is None:
        raise NotFoundError(f"SuccessIndicator with unique_id '{indicator_unique_id}' not found.")

    rel = node.driven_success_indicators.relationship(indicator)
    if rel is None:
        raise NotFoundError(
            f"{governance_type} '{governance_unique_id}' does not drive indicator '{indicator_unique_id}'."
        )
    try:
        _apply_drives_qualifiers(rel, data or {}, creating=False)
        rel.save()
        return node
    except Exception as e:
        raise CrudError(f"Failed to update drives citation: {e}")


def detach_indicator_from_governance(governance_type: str, governance_unique_id: str, indicator_unique_id: str):
    """Disconnect a SuccessIndicator from a governance node (drop the drives edge)."""
    if not indicator_unique_id:
        raise ValidationError("indicator_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    indicator = SuccessIndicator.nodes.get_or_none(unique_id=indicator_unique_id)
    if indicator is None:
        raise NotFoundError(f"SuccessIndicator with unique_id '{indicator_unique_id}' not found.")
    try:
        node.driven_success_indicators.disconnect(indicator)
        return node
    except Exception as e:
        raise CrudError(f"Failed to detach success indicator: {e}")


# ---------------------------------------------------------------------------
# Supersession — (Governance)-[:supersedes]->(Governance)
#
# Heterogeneous on both sides, so managed here in Cypher rather than through a
# typed neomodel accessor (same treatment as Principle.derives_from). Direction
# is always NEWER -> OLDER. See the Governance docstring in graph_schema for the
# edge's property contract.
# ---------------------------------------------------------------------------

_VALID_SUPERSEDE_SCOPES = ("full", "partial")


def attach_supersedes(governance_type: str, governance_unique_id: str,
                      superseded_unique_id: str, quote: str = None,
                      scope: str = "full", note: str = None):
    """Record that one governance instrument replaces another.

    The superseding instrument normally declares its own supersession; `quote`
    carries that sentence verbatim so the claim is cited rather than inferred.
    `scope` is 'full' (replaces outright) or 'partial' (replaces a named
    section only). Idempotent: re-attaching refreshes the qualifiers.
    """
    if not superseded_unique_id:
        raise ValidationError("superseded_unique_id is required.")
    if scope not in _VALID_SUPERSEDE_SCOPES:
        raise ValidationError(
            f"Invalid scope (expected {list(_VALID_SUPERSEDE_SCOPES)}): {scope!r}"
        )
    node = _resolve_governance_node(governance_type, governance_unique_id)
    if node.unique_id == superseded_unique_id:
        raise ValidationError("An instrument cannot supersede itself.")
    try:
        rows, _ = db.cypher_query(
            """
            MATCH (newer {unique_id: $newer})
            MATCH (older {unique_id: $older})
            MERGE (newer)-[r:supersedes]->(older)
            ON CREATE SET r.added_date = date()
            SET r.quote = $quote, r.scope = $scope, r.note = $note
            RETURN older.unique_id
            """,
            {"newer": node.unique_id, "older": superseded_unique_id,
             "quote": quote, "scope": scope, "note": note},
        )
        if not rows:
            raise NotFoundError(
                f"Governance node with unique_id '{superseded_unique_id}' not found."
            )
        return node
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        raise CrudError(f"Failed to attach supersedes: {e}")


def detach_supersedes(governance_type: str, governance_unique_id: str,
                      superseded_unique_id: str):
    """Drop a supersession edge (the assertion was wrong, not the history)."""
    if not superseded_unique_id:
        raise ValidationError("superseded_unique_id is required.")
    node = _resolve_governance_node(governance_type, governance_unique_id)
    try:
        db.cypher_query(
            """
            MATCH (newer {unique_id: $newer})-[r:supersedes]->(older {unique_id: $older})
            DELETE r
            """,
            {"newer": node.unique_id, "older": superseded_unique_id},
        )
        return node
    except Exception as e:
        raise CrudError(f"Failed to detach supersedes: {e}")
