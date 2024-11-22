#
# DOCUMENTATION UPDATE QUERIES
#
from app.database.graph_schema import *
from datetime import date
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError

def unassign_note_from_yse(note_name, year_success_evidence):
    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get YearSuccessEvidence: {e}")

    try:
        note = Note.nodes.get(name=note_name)
    except Note.DoesNotExist:
        raise NotFoundError(f"Note with name {note_name} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get Note: {e}")

    try:
        yse.notes.disconnect(note)
        return True
    except Exception as e:
        raise CrudError(f"Failed to disconnect Note from YearSuccessEvidence: {e}")


def update_note(year_success_evidence: str, note_dict: dict, created_by: str = None) -> bool:
    try:
        note = Note.nodes.get(unique_id=note_dict.get('unique_id'))
    except Note.DoesNotExist:
        raise NotFoundError(f"Note with name {note_dict.get('name')} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get Note: {e}")

    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get YearSuccessEvidence: {e}")

    person = None
    if created_by:
        try:
            person = Person.nodes.get(employee_id=created_by)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id {created_by} not found.")
        except Exception as e:
            raise CrudError(f"Failed to get Person: {e}")

    try:
        if note.name != note_dict.get('name', note.name):
            note.name = note_dict['name']


        if note.content != note_dict.get('content', note.content):
            note.content = note_dict['content']

        if note.depreciated != note_dict.get('depreciated', note.depreciated):
            note.depreciated = note_dict['depreciated']

        if note_dict.get('depreciated_date'):
            new_depreciated_date = note_dict.get('depreciated_date')
            if new_depreciated_date != str(note.depreciated_date):
                note.depreciated_date = date.fromisoformat(new_depreciated_date) if new_depreciated_date else None

        if note.include_in_report != note_dict.get('include_in_report', note.include_in_report):
            note.include_in_report = note_dict['include_in_report']

        if person and not note.created_by.is_connected(person):
            note.created_by.disconnect_all()
            note.created_by.connect(person)

        note.save()

        if not yse.notes.is_connected(note):
            yse.notes.connect(note)

        return True

    except Exception as e:
        raise CrudError(f"Error during note update: {e}")


def update_message(year_success_evidence: str, message_dict: dict, created_by: str = None) -> bool:
    try:
        message = Message.nodes.get(unique_id=message_dict.get('unique_id'))
    except Message.DoesNotExist:
        raise NotFoundError(f"Message with name {message_dict.get('name')} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get Message: {e}")

    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get YearSuccessEvidence: {e}")

    person = None
    if created_by:
        try:
            person = Person.nodes.get(employee_id=created_by)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id {created_by} not found.")
        except Exception as e:
            raise CrudError(f"Failed to get Person: {e}")

    try:

        if message.name != message_dict.get('name', message.name):
            message.name = message_dict['name']

        if message.content != message_dict.get('content', message.content):
            message.content = message_dict['content']

        if message.file_path != message_dict.get('file_path', message.file_path):
            message.file_path = message_dict['file_path']

        if message.uri_path != message_dict.get('uri_path', message.uri_path):
            message.uri_path = message_dict['uri_path']

        if message.depreciated != message_dict.get('depreciated', message.depreciated):
            message.depreciated = message_dict['depreciated']

        if message_dict.get('depreciated_date'):
            new_depreciated_date = message_dict.get('depreciated_date')
            if new_depreciated_date != str(message.depreciated_date):
                message.depreciated_date = date.fromisoformat(new_depreciated_date) if new_depreciated_date else None

        if message.include_in_report != message_dict.get('include_in_report', message.include_in_report):
            message.include_in_report = message_dict['include_in_report']

        if person and not message.created_by.is_connected(person):
            message.created_by.disconnect_all()
            message.created_by.connect(person)

        message.save()

        if not yse.messages.is_connected(message):
            yse.messages.connect(message)

        return True

    except Exception as e:
        raise CrudError(f"Error during message update: {e}")


def update_document(year_success_evidence: str, document_dict: dict, created_by: str = None) -> bool:
    try:
        # Retrieve the Document node by unique_id
        document = Document.nodes.get(unique_id=document_dict.get('unique_id'))
    except Document.DoesNotExist:
        raise NotFoundError(f"Document with unique_id {document_dict.get('unique_id')} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get Document: {e}")

    try:
        # Retrieve the YearSuccessEvidence node by year_identifier
        yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get YearSuccessEvidence: {e}")

    person = None
    if created_by:
        try:
            # Retrieve the Person node by employee_id
            person = Person.nodes.get(employee_id=created_by)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id {created_by} not found.")
        except Exception as e:
            raise CrudError(f"Failed to get Person: {e}")

    try:
        # Update the Document's properties if they have changed
        if document.name != document_dict.get('name', document.name):
            document.name = document_dict['name']

        if document.file_path != document_dict.get('file_path', document.file_path):
            document.file_path = document_dict['file_path']

        if document.uri_path != document_dict.get('uri_path', document.uri_path):
            document.uri_path = document_dict['uri_path']

        if document.is_administrative_review_documentation != document_dict.get('is_administrative_review_documentation', document.is_administrative_review_documentation):
            document.is_administrative_review_documentation = document_dict['is_administrative_review_documentation']

        if document.is_milestone_and_measures_documentation != document_dict.get('is_milestone_and_measures_documentation', document.is_milestone_and_measures_documentation):
            document.is_milestone_and_measures_documentation = document_dict['is_milestone_and_measures_documentation']

        if document.include_in_report != document_dict.get('include_in_report', document.include_in_report):
            document.include_in_report = document_dict['include_in_report']

        if document.depreciated != document_dict.get('depreciated', document.depreciated):
            document.depreciated = document_dict['depreciated']

        # Update depreciated_date if provided
        new_depreciated_date_str = document_dict.get('depreciated_date')
        if new_depreciated_date_str:
            new_depreciated_date = date.fromisoformat(new_depreciated_date_str)
            if document.depreciated_date != new_depreciated_date:
                document.depreciated_date = new_depreciated_date
        elif document.depreciated_date is not None:
            document.depreciated_date = None

        # Update the created_by relationship if a person is provided
        if person:
            if not document.created_by.is_connected(person):
                document.created_by.disconnect_all()
                document.created_by.connect(person)

        # Save the updated Document node
        document.save()

        # Connect the Document to the YearSuccessEvidence if not already connected
        if not yse.documents.is_connected(document):
            yse.documents.connect(document)

        return True

    except Exception as e:
        raise CrudError(f"Error during document update: {e}")


def update_webpage(year_success_evidence: str, webpage_dict: dict, created_by: str = None) -> bool:
    try:
        # Retrieve the Webpage node by unique_id
        webpage = Webpage.nodes.get(unique_id=webpage_dict.get('unique_id'))
    except Webpage.DoesNotExist:
        raise NotFoundError(f"Webpage with unique_id {webpage_dict.get('unique_id')} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get Webpage: {e}")

    try:
        # Retrieve the YearSuccessEvidence node by year_identifier
        yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")
    except Exception as e:
        raise CrudError(f"Failed to get YearSuccessEvidence: {e}")

    person = None
    if created_by:
        try:
            # Retrieve the Person node by employee_id
            person = Person.nodes.get(employee_id=created_by)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id {created_by} not found.")
        except Exception as e:
            raise CrudError(f"Failed to get Person: {e}")

    try:
        # Update the Webpage's properties if they have changed
        if webpage.name != webpage_dict.get('name', webpage.name):
            webpage.name = webpage_dict['name']

        if webpage.url != webpage_dict.get('url', webpage.url):
            webpage.url = webpage_dict['url']

        if webpage.description != webpage_dict.get('description', webpage.description):
            webpage.description = webpage_dict['description']

        if webpage.no_longer_exists != webpage_dict.get('no_longer_exists', webpage.no_longer_exists):
            webpage.no_longer_exists = webpage_dict['no_longer_exists']

        if webpage.depreciated != webpage_dict.get('depreciated', webpage.depreciated):
            webpage.depreciated = webpage_dict['depreciated']

        # Update depreciated_date if provided
        new_depreciated_date_str = webpage_dict.get('depreciated_date')
        if new_depreciated_date_str:
            new_depreciated_date = date.fromisoformat(new_depreciated_date_str)
            if webpage.depreciated_date != new_depreciated_date:
                webpage.depreciated_date = new_depreciated_date
        elif webpage.depreciated_date is not None:
            webpage.depreciated_date = None

        if webpage.include_in_report != webpage_dict.get('include_in_report', webpage.include_in_report):
            webpage.include_in_report = webpage_dict['include_in_report']

        # Update the created_by relationship if a person is provided
        if person:
            if not webpage.created_by.is_connected(person):
                webpage.created_by.disconnect_all()
                webpage.created_by.connect(person)

        # Save the updated Webpage node
        webpage.save()

        # Connect the Webpage to the YearSuccessEvidence if not already connected
        if not yse.webpages.is_connected(webpage):
            yse.webpages.connect(webpage)

        return True

    except Exception as e:
        raise CrudError(f"Error during webpage update: {e}")




#
# unassign_note_from_yse("Measures of success: Stored in compliance sheriff", "2022-2023-1.6-web")
def update_metric():
    return None