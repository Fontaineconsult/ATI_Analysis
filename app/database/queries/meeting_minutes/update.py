#
# MEETING MINUTES UPDATE QUERIES
#
from datetime import date, datetime

from app.database.graph_schema import *
from app.database.queries.meeting_minutes.create import _parse_date
from app.database.queries.meeting_minutes.read import get_meeting_minutes
from app.endpoints.data_api.errors.custom_exceptions import (
    CrudError,
    NotFoundError,
    ValidationError,
)

# Sentinel so callers can distinguish "field omitted" from "field explicitly cleared".
_UNSET = object()


def _get(unique_id: str) -> MeetingMinutes:
    try:
        return MeetingMinutes.nodes.get(unique_id=unique_id)
    except MeetingMinutes.DoesNotExist:
        raise NotFoundError(f"MeetingMinutes {unique_id!r} not found")


def update_meeting_minutes(unique_id: str, title=_UNSET, content=_UNSET, meeting_date=_UNSET) -> dict:
    """Patch a record's title / content (Markdown) / meeting_date. Only passed fields change.
    Returns the refreshed record."""
    m = _get(unique_id)
    if title is not _UNSET:
        if not title or not title.strip():
            raise ValidationError("title cannot be empty")
        m.title = title.strip()
    if content is not _UNSET:
        m.content = (content.strip() if isinstance(content, str) else content) or None
    if meeting_date is not _UNSET:
        m.meeting_date = _parse_date(meeting_date)
    try:
        m.save()
    except Exception as e:
        raise CrudError(f"Failed to update MeetingMinutes {unique_id!r}: {e}")
    return get_meeting_minutes(unique_id)


def _rel_data():
    return {
        "added_date": date.today(),
        "modified_date": date.today(),
        "included_in_years": [],
        "excluded_from_years": [],
    }


def attach_document(unique_id: str, name: str, uri_path: str = None, file_path: str = None) -> dict:
    """Create a Document and link it to the record (supporting_documents / is_documented_by).
    Returns the refreshed record."""
    if not name or not name.strip():
        raise ValidationError("document name is required")
    m = _get(unique_id)
    try:
        doc = Document(name=name.strip(), uri_path=uri_path or None, file_path=file_path or None)
        doc.save()
        m.supporting_documents.connect(doc, _rel_data())
    except Exception as e:
        raise CrudError(f"Failed to attach document to MeetingMinutes {unique_id!r}: {e}")
    return get_meeting_minutes(unique_id)


def attach_webpage(unique_id: str, name: str, url: str) -> dict:
    """Create a Webpage and link it to the record. Returns the refreshed record."""
    if not url or not url.strip():
        raise ValidationError("webpage url is required")
    m = _get(unique_id)
    try:
        web = Webpage(url=url.strip(), name=(name or url).strip())
        web.save()
        m.supporting_webpages.connect(web, _rel_data())
    except Exception as e:
        raise CrudError(f"Failed to attach webpage to MeetingMinutes {unique_id!r}: {e}")
    return get_meeting_minutes(unique_id)


def detach_document(unique_id: str, document_unique_id: str) -> dict:
    """Remove the link to a Document (the Document node itself is left intact)."""
    m = _get(unique_id)
    try:
        doc = Document.nodes.get(unique_id=document_unique_id)
    except Document.DoesNotExist:
        raise NotFoundError(f"Document {document_unique_id!r} not found")
    try:
        if m.supporting_documents.is_connected(doc):
            m.supporting_documents.disconnect(doc)
    except Exception as e:
        raise CrudError(f"Failed to detach document from MeetingMinutes {unique_id!r}: {e}")
    return get_meeting_minutes(unique_id)


def detach_webpage(unique_id: str, webpage_unique_id: str) -> dict:
    """Remove the link to a Webpage (the Webpage node itself is left intact)."""
    m = _get(unique_id)
    try:
        web = Webpage.nodes.get(unique_id=webpage_unique_id)
    except Webpage.DoesNotExist:
        raise NotFoundError(f"Webpage {webpage_unique_id!r} not found")
    try:
        if m.supporting_webpages.is_connected(web):
            m.supporting_webpages.disconnect(web)
    except Exception as e:
        raise CrudError(f"Failed to detach webpage from MeetingMinutes {unique_id!r}: {e}")
    return get_meeting_minutes(unique_id)


def add_minutes_note(unique_id: str, content: str, created_by_unique_id: str = None) -> dict:
    """Attach a Note to a record (predicate has_note). Returns the refreshed record."""
    if not content or not content.strip():
        raise ValidationError("note content is required")
    m = _get(unique_id)
    author = None
    if created_by_unique_id:
        try:
            author = Person.nodes.get(unique_id=created_by_unique_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person {created_by_unique_id!r} not found")
    try:
        note = Note(
            name=f"Minutes Note - {unique_id} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')}",
            content=content.strip(),
            date_created=date.today(),
            depreciated=False,
            include_in_report=True,
        )
        note.save()
        m.notes.connect(note)
        if author:
            note.created_by.connect(author)
    except Exception as e:
        raise CrudError(f"Failed to add note to MeetingMinutes {unique_id!r}: {e}")
    return get_meeting_minutes(unique_id)
