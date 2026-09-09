#
# INDIVIDUAL CREATE QUERIES
#
from datetime import date

from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError

from app.database.graph_schema import Person, ATIWorkingGroup, Campus, PositionDescription, Document, Note
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError, NotFoundError
from neomodel import db, DoesNotExist

def add_person(data: dict) -> Person:
    """
    Adds a new person node to the graph and establishes relationships.

    :param data: The data for the new person.
    :return: The created Person node.
    """

    employee_id = data.get('employee_id')
    if not employee_id:
        raise ValidationError("Employee ID is required.")

    try:
        # Start a transaction
        with db.transaction:
            # Check if a person with the same employee_id already exists
            existing_person = Person.nodes.get_or_none(employee_id=employee_id)
            if existing_person:
                raise ValidationError(f"Person with employee_id '{employee_id}' already exists.")

            # Create a new Person node
            person = Person(employee_id=employee_id)

            # Set person's properties (only set properties provided in data)
            if 'active' in data and data['active'] is not None:
                person.active = data['active']
            else:
                person.active = True  # Default value

            if 'non_committee_member_active' in data and data['non_committee_member_active'] is not None:
                person.active = data['non_committee_member_active']
            else:
                person.non_committee_member_active = False  # Default value

            if 'ati_role' in data and data['ati_role'] is not None:
                person.ati_role = data['ati_role']

            if 'can_approve_yse' in data and data['can_approve_yse'] is not None:
                person.can_approve_yse = data['can_approve_yse']
            else:
                person.can_approve_yse = False  # Default value

            if 'email' in data and data['email'] is not None:
                person.email = data['email']
            else:
                raise ValidationError("Email is required.")

            if 'name' in data and data['name'] is not None:
                person.name = data['name']
            else:
                raise ValidationError("Name is required.")

            if 'title' in data and data['title'] is not None:
                person.title = data['title']
            else:
                raise ValidationError("Title is required.")

            # Save the new person node
            person.save()

            # Connect host_campus if provided
            host_campus_abbrev = data.get('host_campus')
            if host_campus_abbrev:
                try:
                    campus = Campus.nodes.get(abbreviation=host_campus_abbrev)
                except DoesNotExist:
                    raise NotFoundError(f"Campus with abbreviation '{host_campus_abbrev}' not found.")
                person.host_campus.connect(campus)

            # Establish relationships if 'workingGroups' is provided in data
            if 'workingGroups' in data:
                working_groups = data.get('workingGroups') or []
                if not isinstance(working_groups, list):
                    raise ValidationError("The 'workingGroups' field must be a list.")

                for wg_data in working_groups:
                    wg_name = wg_data.get('name')
                    if wg_name:
                        # Fetch the working group node by its name
                        try:
                            working_group = ATIWorkingGroup.nodes.get(name=wg_name)
                        except DoesNotExist:
                            raise NotFoundError(f"ATIWorkingGroup with name '{wg_name}' not found.")

                        # Create a relationship between the person and the working group
                        person.in_ati_working_group.connect(working_group)

            return person

    except ValidationError:
        raise
    except Exception as e:
        raise CrudError(f"Failed to add person with employee_id '{employee_id}': {str(e)}")


def _resolve_pd_attachments(document_ids, note_ids):
    """Resolve document/note unique_ids to nodes up front, so a bad id fails
    before any edge is written. Returns (documents, notes)."""
    if not isinstance(document_ids, list) or not isinstance(note_ids, list):
        raise ValidationError("document_ids and note_ids must be lists.")
    documents = []
    for doc_id in document_ids:
        document = Document.nodes.get_or_none(unique_id=doc_id)
        if not document:
            raise NotFoundError(f"Document with unique_id '{doc_id}' not found.")
        documents.append(document)
    notes = []
    for note_id in note_ids:
        note = Note.nodes.get_or_none(unique_id=note_id)
        if not note:
            raise NotFoundError(f"Note with unique_id '{note_id}' not found.")
        notes.append(note)
    return documents, notes


def add_position_description(data: dict) -> PositionDescription:
    """
    Creates a PositionDescription anchored to a Person. This is the only sanctioned
    creation path: the describes_position_of edge is required, and neomodel cannot
    enforce a required edge at save time, so it is enforced here.

    :param data: {employee_id (required), name (required), description,
                  effective_date (YYYY-MM-DD), depreciated, depreciated_date,
                  include_in_report, storage_key (app/fs key of the uploaded PD
                  file, with original_filename/content_type/size/uploaded_by),
                  document_ids: [Document unique_id], note_ids: [Note unique_id]}
    :return: The created PositionDescription node.
    """
    from app.database.queries.files.create import register_stored_file, link_file_to_node

    employee_id = data.get('employee_id')
    if not employee_id:
        raise ValidationError("employee_id is required.")
    name = (data.get('name') or '').strip()
    if not name:
        raise ValidationError("Name is required.")

    person = Person.nodes.get_or_none(employee_id=employee_id)
    if not person:
        raise NotFoundError(f"Person with employee_id '{employee_id}' not found.")

    documents, notes = _resolve_pd_attachments(
        data.get('document_ids') or [],
        data.get('note_ids') or [],
    )

    try:
        with db.transaction:
            pd = PositionDescription(
                name=name,
                description=data.get('description'),
                effective_date=date.fromisoformat(data['effective_date']) if data.get('effective_date') else None,
                depreciated=bool(data.get('depreciated', False)),
                depreciated_date=date.fromisoformat(data['depreciated_date']) if data.get('depreciated_date') else None,
                include_in_report=data.get('include_in_report', True),
            )
            pd.save()

            pd.describes_position_of.connect(person)

            # Register + link the uploaded PD file, if one was provided.
            if data.get('storage_key'):
                stored_file = register_stored_file(
                    data['storage_key'],
                    original_filename=data.get('original_filename'),
                    content_type=data.get('content_type'),
                    size=data.get('size'),
                    uploaded_by=data.get('uploaded_by'),
                )
                link_file_to_node(pd, stored_file)

            for document in documents:
                pd.documents.connect(document)
            for note in notes:
                pd.notes.connect(note)

            return pd
    except ValueError as e:
        # date.fromisoformat on a malformed date string
        raise ValidationError(f"Invalid date: {e}")
    except (ValidationError, NotFoundError):
        raise
    except Exception as e:
        raise CrudError(f"Failed to add position description for '{employee_id}': {str(e)}")
