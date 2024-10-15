#
# DOCUMENTATION UPDATE QUERIES
#
from app.database.graph_schema import *
from datetime import date

def unassign_note_from_yse(note_name, year_success_evidence):

    try:
        yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
    except Exception as e:
        print(f"Failed to get YearSuccessEvidence: {e}")
        return False

    try:
        note = Note.nodes.get(name=note_name)
    except Exception as e:
        print(f"Failed to get Note: {e}")
        return False

    try:
        yse.notes.disconnect(note)
    except Exception as e:
        print(f"Failed to disconnect Note from YearSuccessEvidence: {e}")
        return False
    print(f"Successfully disconnected Note from YearSuccessEvidence")
    return True



def update_note(year_success_evidence: str, note_dict: dict, created_by: str) -> bool:
    """
    Update an existing note for a YearSuccessEvidence node.

    :param year_success_evidence: str: The year identifier for the YearSuccessEvidence node.
    :param note_dict: dict: A dictionary containing the updated fields for the note.
    :param created_by: str: The employee ID of the person who created the note.
    :return: bool: Returns True if the update was successful, otherwise False.
    """
    # Validate input: ensure required fields are present
    required_fields = ['name', 'content']
    for field in required_fields:
        if field not in note_dict:
            print(f"Missing required field: {field}")
            return False

    try:
        # Fetch the note by its unique name
        note = Note.nodes.get(name=note_dict.get('name'))
    except Note.DoesNotExist:
        print("Note not found.")
        return False
    except Exception as e:
        print(f"Failed to get Note: {e}")
        return False

    try:
        # Fetch the YearSuccessEvidence node by year_identifier
        yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
    except YearSuccessEvidence.DoesNotExist:
        print("YearSuccessEvidence not found.")
        return False
    except Exception as e:
        print(f"Failed to get YearSuccessEvidence: {e}")
        return False

    try:
        # Fetch the Person node by employee ID
        person = Person.nodes.get(employee_id=created_by)
    except Person.DoesNotExist:
        print("Person not found.")
        return False
    except Exception as e:
        print(f"Failed to get Person: {e}")
        return False

    # Start the update process
    try:
        # Update fields only if different from the existing values
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

        # Handle the `created_by` relationship: update only if needed
        if not note.created_by.is_connected(person):
            note.created_by.disconnect_all()  # Remove old relationships
            note.created_by.connect(person)   # Connect new person

        # Save the updated note
        note.save()

        # Ensure the note is connected to the YearSuccessEvidence
        if not yse.has_notes.is_connected(note):
            yse.has_notes.connect(note)

        return True

    except Exception as e:
        print(f"Error during note update: {e}")
        return False



















#
# unassign_note_from_yse("Measures of success: Stored in compliance sheriff", "2022-2023-1.6-web")