from neomodel import db
from datetime import date, datetime

from app.database.tools.support_functions import get_file_hash
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError
from app.database.graph_schema import (Note,
                                       Person,
                                       YearSuccessEvidence,
                                       Message,
                                       Document, Webpage)



def add_note(year_success_evidence: str, note_dict: dict) -> bool:
    """
    Adds a new note for a YearSuccessEvidence node.
    """
    try:
        # Ensure required fields are present
        required_fields = ['name', 'content']
        for field in required_fields:
            if field not in note_dict:
                raise ValidationError(f"Missing required field: {field}")

        # Check if a note with the same name already exists
        existing_note = Note.nodes.get_or_none(name=note_dict.get('name'))
        if existing_note:
            raise ValidationError(f"A note with the name {note_dict.get('name')} already exists.")

        # Fetch the YearSuccessEvidence node
        yse = YearSuccessEvidence.nodes.get_or_none(year_identifier=year_success_evidence)
        if not yse:
            raise NotFoundError(f"YearSuccessEvidence {year_success_evidence} not found.")

        # Create and save the note
        note = Note(
            name=note_dict['name'],
            content=note_dict['content'],
            depreciated=note_dict.get('depreciated', False),
            depreciated_date=date.fromisoformat(note_dict.get('depreciated_date')) if note_dict.get('depreciated_date') else None,
            include_in_report=note_dict.get('include_in_report', True),
            date_created=date.fromisoformat(note_dict['date_created']) if note_dict.get('date_created') else None
        )
        note.save()

        # Handle the created_by relationship
        if 'created_by' in note_dict:
            created_by_data = note_dict['created_by']
            employee_id = created_by_data.get('employee_id')
            if employee_id:
                person = Person.nodes.get_or_none(employee_id=employee_id)
                if not person:
                    person = Person(
                        name=created_by_data['name'],
                        email=created_by_data['email'],
                        employee_id=employee_id,
                        title=created_by_data['title']
                    )
                    person.save()
                note.created_by.connect(person)

        # Connect the note to YearSuccessEvidence
        yse.notes.connect(note)

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise

    except NotFoundError as e:
        print(f"Not found: {e}")
        raise

    except Exception as e:
        print(f"Error during note creation: {e}")
        raise CrudError("Failed to add note", e)



def add_message(year_success_evidence: str, message_dict: dict) -> bool:
    """
    Adds a new message for a YearSuccessEvidence node.
    """
    try:
        # Ensure required fields are present
        required_fields = ['name']
        for field in required_fields:
            if field not in message_dict:
                raise ValidationError(f"Missing required field: {field}")

        # Check if a message with the same name already exists
        existing_message = Message.nodes.get_or_none(name=message_dict.get('name'))
        if existing_message:
            raise ValidationError(f"A message with the name {message_dict.get('name')} already exists.")

        # Fetch the YearSuccessEvidence node
        yse = YearSuccessEvidence.nodes.get_or_none(year_identifier=year_success_evidence)
        if not yse:
            raise NotFoundError(f"YearSuccessEvidence {year_success_evidence} not found.")

        # Create and save the message
        message = Message(
            name=message_dict['name'],
            message_type=message_dict.get('message_type'),
            authored_date=message_dict.get('date_created'),
            content=message_dict.get('content'),
            file_path=message_dict.get('file_path'),
            uri_path=message_dict.get('uri_path'),
            depreciated=message_dict.get('depreciated', False),
            depreciated_date=date.fromisoformat(message_dict['depreciated_date']) if message_dict.get('depreciated_date') else None,
            include_in_report=message_dict.get('include_in_report', True),
        )
        message.save()

        # Handle the created_by relationship
        if 'created_by' in message_dict:
            created_by_data = message_dict['created_by']
            employee_id = created_by_data.get('employee_id')
            if employee_id:
                person = Person.nodes.get_or_none(employee_id=employee_id)
                if not person:
                    person = Person(
                        name=created_by_data['name'],
                        email=created_by_data['email'],
                        employee_id=employee_id,
                        title=created_by_data['title']
                    )
                    person.save()
                message.created_by.connect(person)

        # Connect the message to YearSuccessEvidence
        yse.messages.connect(message)

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise

    except NotFoundError as e:
        print(f"Not found: {e}")
        raise

    except Exception as e:
        print(f"Error during message creation: {e}")
        raise CrudError("Failed to add message", e)

def add_document(name, file_path=None, uri_path=None, depreciated=False,
                 depreciated_date=None, is_administrative_review_documentation=False,
                 is_milestone_and_measures_documentation=False) -> bool:
    """
    Adds a document node to the graph.
    """
    try:
        if not file_path and not uri_path:
            raise ValidationError("Either file path or URI path must be provided.")

        hash = get_file_hash(file_path) if file_path else None

        # Check if a document with the same hash already exists
        existing_document = Document.nodes.get_or_none(hash=hash)
        if existing_document:
            raise ValidationError(f"A document with hash {hash} already exists.")

        # Create and save the document
        new_document = Document(
            hash=hash,
            name=name,
            file_path=file_path,
            uri_path=uri_path,
            depreciated=depreciated,
            depreciated_date=datetime.strptime(depreciated_date, "%Y-%m-%d").date() if depreciated_date else None,
            is_administrative_review_documentation=is_administrative_review_documentation,
            is_milestone_and_measures_documentation=is_milestone_and_measures_documentation
        )
        new_document.save()

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise

    except Exception as e:
        print(f"Failed to add document: {e}")
        raise CrudError("Failed to add document", e)


def add_webpage(url, name, no_longer_exists, depreciated, depreciated_year, description) -> bool:
    """
    Adds a webpage node to the graph.
    """
    try:
        # Check if the webpage already exists
        existing_webpage = Webpage.nodes.get_or_none(url=url)
        if existing_webpage:
            raise ValidationError(f"A webpage with URL {url} already exists.")

        # Create and save the webpage
        new_webpage = Webpage(
            url=url,
            name=name,
            depreciated=depreciated,
            depreciated_date=datetime.strptime(depreciated_year, "%Y-%m-%d").date() if depreciated_year else None,
            no_longer_exists=no_longer_exists,
            description=description
        )
        new_webpage.save()

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise

    except Exception as e:
        print(f"Failed to add webpage: {e}")
        raise CrudError("Failed to add webpage", e)


def add_metric():
    return None