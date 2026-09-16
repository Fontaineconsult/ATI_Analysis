#
# INTELLECTUAL SOURCE CREATE QUERIES
#
from datetime import date, datetime

from app.database.graph_schema import IntellectualSource
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError


def _coerce_date(value):
    """Accept date, datetime, or ISO-date string; return a date.

    Mirrors queries/governance/create._coerce_date. Every failure path raises
    ValidationError so a client typo maps to 400 rather than escaping as a bare
    ValueError the blanket handler would report as a 500.
    """
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return date.fromisoformat(value)
        except ValueError:
            raise ValidationError(f"Expected an ISO date (YYYY-MM-DD), got '{value}'.")
    raise ValidationError(f"Expected ISO date string, got {type(value).__name__}.")


# Provenance and attribution fields accepted beyond name/descriptions. Extra keys
# on the payload are dropped so the API stays forgiving when the frontend sends a
# superset.
_TEXT_FIELDS = ("description_short", "description_full", "url", "author", "publisher", "citation")


def create_intellectual_source(data: dict) -> IntellectualSource:
    """
    Create an IntellectualSource — a non-legal grounding (a theory / body of scholarship)
    that a Principle can `derives_from` alongside Governance. `name` is required and unique.

    `raw_text_captured` is stamped here rather than accepted from the caller, so the
    capture date always reflects when this graph took the snapshot.
    """
    data = data or {}
    name = data.get("name")
    if not name or not str(name).strip():
        raise ValidationError("name is required")
    name = name.strip()
    if IntellectualSource.nodes.filter(name=name):
        raise ValidationError(f"IntellectualSource named {name!r} already exists")

    props = {f: (data.get(f) or None) for f in _TEXT_FIELDS}

    if data.get("published_date"):
        props["published_date"] = _coerce_date(data["published_date"])

    raw_text = data.get("raw_text") or None
    props["raw_text"] = raw_text
    props["raw_text_captured"] = date.today() if raw_text else None

    try:
        node = IntellectualSource(name=name, **props)
        node.save()
        return node
    except Exception as e:
        raise CrudError(f"Failed to create IntellectualSource: {e}")
