#
# QUERY UPDATE QUERIES
#
from datetime import date, datetime

from app.database.graph_schema import *
from app.data_config import query_categories, query_statuses
from app.database.queries.query.read import get_query
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

# Sentinel so callers can distinguish "field omitted" from "field explicitly cleared".
_UNSET = object()


def _get(unique_id: str) -> Query:
    try:
        return Query.nodes.get(unique_id=unique_id)
    except Query.DoesNotExist:
        raise NotFoundError(f"Query {unique_id!r} not found")


def update_query(unique_id: str, question=_UNSET, detail=_UNSET, category=_UNSET, status=_UNSET) -> dict:
    """
    Patch a Query's editable fields. Only arguments that are actually passed are touched;
    pass an explicit value (including None / "" for detail) to clear. Returns the
    refreshed serialized Query.

    Raises ValidationError on an empty question or a bad category/status,
    NotFoundError if the query is missing, CrudError on save failure.
    """
    query = _get(unique_id)

    if question is not _UNSET:
        if not question or not question.strip():
            raise ValidationError("question cannot be empty")
        query.question = question.strip()

    if detail is not _UNSET:
        query.detail = (detail.strip() if isinstance(detail, str) else detail) or None

    if category is not _UNSET:
        if category is not None and category not in query_categories:
            raise ValidationError(
                f"Invalid category {category!r}; must be one of {list(query_categories.keys())}"
            )
        query.category = category

    if status is not _UNSET:
        if status not in query_statuses:
            raise ValidationError(
                f"Invalid status {status!r}; must be one of {list(query_statuses.keys())}"
            )
        query.status = status

    try:
        query.save()
    except Exception as e:
        raise CrudError(f"Failed to update Query {unique_id!r}: {e}")
    return get_query(unique_id)


def settle_query(unique_id: str, answer: str, settled_by_unique_id: str = None) -> dict:
    """
    Record the answer to a Query and mark it settled. Sets status='settled', the answer,
    and date_settled (today), and optionally connects the settling Person. Returns the
    refreshed serialized Query.
    """
    if not answer or not answer.strip():
        raise ValidationError("answer is required to settle a query")

    query = _get(unique_id)

    settler = None
    if settled_by_unique_id:
        try:
            settler = Person.nodes.get(unique_id=settled_by_unique_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person {settled_by_unique_id!r} not found")

    try:
        query.answer = answer.strip()
        query.status = "settled"
        query.date_settled = date.today()
        query.save()
        if settler and not query.query_settled_by.is_connected(settler):
            query.query_settled_by.connect(settler)
    except Exception as e:
        raise CrudError(f"Failed to settle Query {unique_id!r}: {e}")
    return get_query(unique_id)


def attach_evidence(unique_id: str, yse_identifier: str) -> dict:
    """Connect a Query to a YearSuccessEvidence it addresses (idempotent)."""
    query = _get(unique_id)
    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=yse_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence {yse_identifier!r} not found")
    try:
        if not query.addresses_evidence.is_connected(yse):
            query.addresses_evidence.connect(yse)
    except Exception as e:
        raise CrudError(f"Failed to attach evidence {yse_identifier!r} to Query {unique_id!r}: {e}")
    return get_query(unique_id)


def detach_evidence(unique_id: str, yse_identifier: str) -> dict:
    """Remove a Query's addresses_evidence edge to a YSE (idempotent)."""
    query = _get(unique_id)
    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=yse_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence {yse_identifier!r} not found")
    try:
        if query.addresses_evidence.is_connected(yse):
            query.addresses_evidence.disconnect(yse)
    except Exception as e:
        raise CrudError(f"Failed to detach evidence {yse_identifier!r} from Query {unique_id!r}: {e}")
    return get_query(unique_id)


def add_query_note(unique_id: str, content: str, created_by_unique_id: str = None) -> dict:
    """Attach a Note to a Query (predicate has_note). Returns the refreshed serialized Query."""
    if not content or not content.strip():
        raise ValidationError("note content is required")

    query = _get(unique_id)

    author = None
    if created_by_unique_id:
        try:
            author = Person.nodes.get(unique_id=created_by_unique_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person {created_by_unique_id!r} not found")

    try:
        note = Note(
            name=f"Query Note - {unique_id} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')}",
            content=content.strip(),
            date_created=date.today(),
            depreciated=False,
            include_in_report=True,
        )
        note.save()
        query.notes.connect(note)
        if author:
            note.created_by.connect(author)
    except Exception as e:
        raise CrudError(f"Failed to add note to Query {unique_id!r}: {e}")
    return get_query(unique_id)
