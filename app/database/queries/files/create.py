"""Register managed files in the graph and link them to records.

`register_stored_file` MERGEs a StoredFile by its content key (so the same bytes
register once); `link_file_to_node` attaches it to a Document / Message / Metric.
The blob bytes themselves are written by the app/fs storage layer / the /files
endpoint — this module only manages the graph side.
"""
from datetime import date

from app.database.graph_schema import StoredFile, Person
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError


def register_stored_file(storage_key, original_filename=None, content_type=None,
                         size=None, uploaded_by=None):
    """MERGE a StoredFile by its content key (SHA-256) and return it.

    Content-addressed: registering the same bytes again returns the existing node
    (filling in any missing display metadata). `uploaded_by` is a Person employee_id
    or unique_id (optional).
    """
    if not storage_key:
        raise ValidationError("storage_key is required to register a stored file.")
    try:
        stored_file = StoredFile.nodes.get_or_none(storage_key=storage_key)
        if stored_file is None:
            stored_file = StoredFile(
                storage_key=storage_key,
                original_filename=original_filename,
                content_type=content_type,
                size=size,
                uploaded_date=date.today(),
            ).save()
        else:
            # Keep the first-seen metadata, but fill any gaps from this registration.
            changed = False
            if original_filename and not stored_file.original_filename:
                stored_file.original_filename = original_filename
                changed = True
            if content_type and not stored_file.content_type:
                stored_file.content_type = content_type
                changed = True
            if size is not None and stored_file.size is None:
                stored_file.size = size
                changed = True
            if changed:
                stored_file.save()

        if uploaded_by:
            person = (Person.nodes.get_or_none(employee_id=uploaded_by)
                      or Person.nodes.get_or_none(unique_id=uploaded_by))
            if person and not stored_file.uploaded_by.is_connected(person):
                stored_file.uploaded_by.connect(person)

        return stored_file
    except ValidationError:
        raise
    except Exception as e:
        raise CrudError("Failed to register stored file", e)


def link_file_to_node(node, stored_file):
    """Point `node.has_file` at `stored_file` (ZeroOrOne — replaces any existing link)."""
    try:
        existing = node.has_file.single()
        if existing is not None:
            if existing.storage_key == stored_file.storage_key:
                return  # already linked to this exact file
            node.has_file.disconnect(existing)
        node.has_file.connect(stored_file)
    except Exception as e:
        raise CrudError("Failed to link file to node", e)
