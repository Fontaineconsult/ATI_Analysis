#
# GOVERNANCE CREATE QUERIES
#
from datetime import date, datetime

from app.database.graph_schema import Law, Case, Directive, ExternalPolicy, Memo, Guideline

from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError

# DateProperty fields across all governance types. ISO-date strings from the
# frontend's <input type="date"> need conversion before neomodel will accept
# them.
_DATE_FIELDS = {"effective_date", "last_updated", "authored_date"}


def _coerce_date(value):
    """Accept date, datetime, or ISO-date string; return a date."""
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return date.fromisoformat(value)
    raise ValidationError(f"Expected ISO date string, got {type(value).__name__}.")

# Fields each governance type accepts beyond title/description. Any extra keys
# on the payload are silently dropped so the API stays forgiving when the
# frontend sends a superset (the form is type-aware).
_GOVERNANCE_FIELD_WHITELIST = {
    "law": {"effective_date", "last_updated", "relevant_sections", "legislative_authority"},
    "case": {"effective_date", "ruling", "legislative_authority"},
    "directive": {"effective_date", "last_updated", "source_institution"},
    "external_policy": {"effective_date", "last_updated"},
    "memo": {"authored_date"},
    "guideline": {"effective_date", "last_updated"},
}

_GOVERNANCE_TYPE_TO_CLASS = {
    "law": Law,
    "case": Case,
    "directive": Directive,
    "external_policy": ExternalPolicy,
    "memo": Memo,
    "guideline": Guideline,
}


def create_governance_item(governance_type: str, data: dict):
    """
    Single create dispatcher used by the /governance endpoint. The endpoint
    receives one POST shape regardless of type; this function builds the
    right node class with only that type's whitelisted fields.

    All governance types share title (required, unique-indexed) and
    description; remaining fields are type-specific (see whitelist above).

    Returns the saved neomodel instance.
    """
    cls = _GOVERNANCE_TYPE_TO_CLASS.get(governance_type)
    if cls is None:
        raise ValidationError(f"Unknown governance type '{governance_type}'.")

    title = (data or {}).get("title")
    if not title or not str(title).strip():
        raise ValidationError("Title is required.")

    props = {"title": title.strip()}
    if data.get("description"):
        props["description"] = data["description"]

    for field in _GOVERNANCE_FIELD_WHITELIST[governance_type]:
        if field in data and data[field] not in (None, ""):
            value = data[field]
            if field in _DATE_FIELDS:
                value = _coerce_date(value)
            props[field] = value

    try:
        node = cls(**props)
        node.save()
        return node
    except Exception as e:
        raise CrudError(f"Failed to create {cls.__name__}: {e}")
