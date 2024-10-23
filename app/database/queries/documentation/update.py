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
        note = Note.nodes.get(name=note_dict.get('name'))
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
        message = Message.nodes.get(name=message_dict.get('name'))
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














#
# unassign_note_from_yse("Measures of success: Stored in compliance sheriff", "2022-2023-1.6-web")
def update_metric():
    return None