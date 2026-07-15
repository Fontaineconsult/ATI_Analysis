#
# GOVERNANCE UPDATE QUERIES
#
from app.database.graph_schema import Document, Webpage
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
        if field in allowed and value not in (None, ""):
            if field in _DATE_FIELDS:
                value = _coerce_date(value)
            setattr(node, field, value)

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
