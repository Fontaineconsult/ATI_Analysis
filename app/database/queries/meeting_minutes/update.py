#
# MEETING MINUTES UPDATE QUERIES
#
from datetime import date, datetime

from app.database.graph_schema import *
from app.database.queries.meeting_minutes.create import (
    _parse_date,
    resolve_communities,
    resolve_people,
)
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


def set_ontology_ingested(unique_id: str, ingested: bool = True, note=_UNSET) -> dict:
    """
    Mark a record as processed by the ontology-ingest skill (or revert the mark).

    Setting stamps today's date; the optional note should summarize what the
    ingest created/enriched so the record answers "did new nodes come out of
    this meeting?" at a glance. Reverting (ingested=False) clears the date and
    note. Returns the refreshed record.
    """
    m = _get(unique_id)
    m.ontology_ingested = bool(ingested)
    if ingested:
        m.ontology_ingest_date = date.today()
        if note is not _UNSET:
            m.ontology_ingest_note = (note.strip() if isinstance(note, str) else note) or None
    else:
        m.ontology_ingest_date = None
        m.ontology_ingest_note = None
    try:
        m.save()
    except Exception as e:
        raise CrudError(f"Failed to set ontology-ingest flag on MeetingMinutes {unique_id!r}: {e}")
    return get_meeting_minutes(unique_id)


def set_minutes_participants(unique_id: str, person_unique_ids: list) -> dict:
    """Full-replace the participant set: Person -[participated_in]-> minutes.

    Participation is a transcript-derived fact (the person was in the room), never an
    idle mention. The caller sends the complete list; an empty list clears everyone.
    Returns the refreshed record.
    """
    m = _get(unique_id)
    people = resolve_people(person_unique_ids)
    try:
        m.participants.disconnect_all()
        for person in people:
            m.participants.connect(person)
    except Exception as e:
        raise CrudError(f"Failed to set participants on MeetingMinutes {unique_id!r}: {e}")
    return get_meeting_minutes(unique_id)


def set_minutes_communities(unique_id: str, community_unique_ids: list) -> dict:
    """Full-replace the minutes -[pertains_to]-> CommunityOfPractice set (multiple
    expected). The caller sends the complete list; an empty list clears the edges.
    Returns the refreshed record.
    """
    m = _get(unique_id)
    communities = resolve_communities(community_unique_ids)
    try:
        m.pertains_to.disconnect_all()
        for community in communities:
            m.pertains_to.connect(community)
    except Exception as e:
        raise CrudError(f"Failed to set pertains_to on MeetingMinutes {unique_id!r}: {e}")
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


# Meeting mode's notes pad writes here. Each entry is one Markdown bullet under
# a heading for the plan on stage, so the record reads as chronological
# minutes and the Campus Plan panel renders it with no new renderer.
ENTRY_KINDS = ("note", "decision", "ask")
_KIND_PREFIX = {"decision": "Decision: ", "ask": "Ask: "}


def _plan_heading(plan) -> str:
    return f"### {plan.name or plan.description or plan.unique_id}"


def _last_heading(content: str):
    """The last '### ' heading in the body, or None."""
    last = None
    for line in (content or "").splitlines():
        if line.startswith("### "):
            last = line.rstrip()
    return last


def append_minutes_entry(unique_id: str, text: str, plan_unique_id: str = None,
                         author_unique_id: str = None, kind: str = "note",
                         clock: str = None) -> dict:
    """Append one timestamped, attributed line to a record's Markdown body.

    With `plan_unique_id`, the line lands under the plan's `###` heading. The
    heading is written only when the body's last heading is a different plan,
    so consecutive notes on one plan share a heading while moving back and
    forth between plans stays chronological. The first entry under a plan also
    asserts minutes -[discusses]-> Plan, the edge that makes "which plans did
    this meeting discuss" a graph query.

    `kind` is 'note' (default), 'decision' or 'ask'; the last two prefix the
    line with the word, which the ontology-ingest rubric already routes.
    `clock` is 'HH:MM'; the server's local time when omitted.

    Returns the refreshed record plus the exact Markdown line appended under
    `appended_line`. Raises ValidationError / NotFoundError / CrudError.
    """
    if not text or not text.strip():
        raise ValidationError("entry text is required")
    if kind not in ENTRY_KINDS:
        raise ValidationError(f"kind must be one of {ENTRY_KINDS}; got {kind!r}")
    m = _get(unique_id)

    plan = None
    if plan_unique_id:
        try:
            plan = Plan.nodes.get(unique_id=plan_unique_id)
        except Plan.DoesNotExist:
            raise NotFoundError(f"Plan {plan_unique_id!r} not found")

    author_name = None
    if author_unique_id:
        try:
            author_name = Person.nodes.get(unique_id=author_unique_id).name
        except Person.DoesNotExist:
            raise NotFoundError(f"Person {author_unique_id!r} not found")

    stamp = clock or datetime.now().strftime("%H:%M")
    body = " ".join(text.strip().split("\n"))
    line = f"- {stamp} {author_name + ': ' if author_name else ''}{_KIND_PREFIX.get(kind, '')}{body}"

    content = (m.content or "").rstrip()
    heading = _plan_heading(plan) if plan is not None else None
    needs_heading = heading is not None and _last_heading(content) != heading
    if not content:
        new_content = f"{heading}\n{line}" if needs_heading else line
    elif needs_heading:
        new_content = f"{content}\n\n{heading}\n{line}"
    else:
        new_content = f"{content}\n{line}"

    try:
        m.content = new_content
        m.save()
        if plan is not None and not m.discusses.is_connected(plan):
            m.discusses.connect(plan)
    except Exception as e:
        raise CrudError(f"Failed to append to MeetingMinutes {unique_id!r}: {e}")

    result = get_meeting_minutes(unique_id)
    result["appended_line"] = line
    return result
