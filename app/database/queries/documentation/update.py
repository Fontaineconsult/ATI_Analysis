#
# DOCUMENTATION UPDATE QUERIES
#
from app.database.graph_schema import *
from datetime import date

from app.database.queries.implementation.update import assign_documentation_to_implementation
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError, ValidationError


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


def update_note(
        note_dict: dict,
        year_success_evidence: str = None,
        implementation_id: str = None,
        implementation_type: str = None,
        created_by: str = None
) -> bool:
    """
    Updates an existing note. The note can be associated with a YearSuccessEvidence, an implementation, or both.

    :param note_dict: Dictionary containing note properties to update.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to associate the note with.
    :param implementation_id: (Optional) The unique_id of the implementation to associate the note with.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param created_by: (Optional) The employee_id of the person who created the note.
    :return: True if the note was updated successfully.
    """
    try:
        # Fetch the note by unique_id

        unique_id = note_dict.get('unique_id')
        if not unique_id:
            raise ValidationError("Missing 'unique_id' in note_dict.")

        try:
            note = Note.nodes.get(unique_id=unique_id)
        except Note.DoesNotExist:
            raise NotFoundError(f"Note with unique_id {unique_id} not found.")

        # Update note properties
        updated_fields = False

        for field in ['name', 'content', 'include_in_report']:
            if field in note_dict and getattr(note, field) != note_dict[field]:
                setattr(note, field, note_dict[field])
                updated_fields = True

        # Handle depreciated and depreciated_date
        if 'depreciated' in note_dict and note.depreciated != note_dict['depreciated']:
            note.depreciated = note_dict['depreciated']
            updated_fields = True

        if 'depreciated_date' in note_dict:
            new_depreciated_date = note_dict['depreciated_date']
            if new_depreciated_date != (note.depreciated_date.isoformat() if note.depreciated_date else None):
                note.depreciated_date = date.fromisoformat(new_depreciated_date) if new_depreciated_date else None
                updated_fields = True

        # Update the created_by relationship
        if created_by:
            try:
                person = Person.nodes.get(employee_id=created_by)
                if not note.created_by.is_connected(person):
                    note.created_by.disconnect_all()
                    note.created_by.connect(person)
                    updated_fields = True
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with employee_id {created_by} not found.")

        # Save the note if any fields were updated
        if updated_fields:
            note.save()

        # Handle YearSuccessEvidence association
        if year_success_evidence:
            try:
                yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
                if not yse.notes.is_connected(note):
                    yse.notes.connect(note)
            except YearSuccessEvidence.DoesNotExist:
                raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")

        # Handle Implementation association
        if implementation_id and implementation_type:
            # Assign the note to the implementation
            assign_documentation_to_implementation(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type="note",
                documentation_id=note.unique_id
            )

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise

    except NotFoundError as e:
        print(f"Not found: {e}")
        raise

    except Exception as e:
        import traceback
        print(f"Error during note update: {e}")
        traceback.print_exc()
        raise CrudError(f"Failed to update note: {e}")



def update_message(
        message_dict: dict,
        year_success_evidence: str = None,
        implementation_id: str = None,
        implementation_type: str = None,
        created_by: str = None
) -> bool:
    """
    Updates an existing message. The message can be associated with a YearSuccessEvidence, an implementation, or both.

    :param message_dict: Dictionary containing message properties to update.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to associate the message with.
    :param implementation_id: (Optional) The unique_id of the implementation to associate the message with.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param created_by: (Optional) The employee_id of the person who created the message.
    :return: True if the message was updated successfully.
    """
    try:
        # Fetch the message by unique_id
        unique_id = message_dict.get('unique_id')
        if not unique_id:
            raise ValidationError("Missing 'unique_id' in message_dict.")

        try:
            message = Message.nodes.get(unique_id=unique_id)
        except Message.DoesNotExist:
            raise NotFoundError(f"Message with unique_id {unique_id} not found.")

        # Update message properties
        updated_fields = False

        for field in ['name', 'content', 'file_path', 'uri_path', 'include_in_report']:
            if field in message_dict and getattr(message, field) != message_dict[field]:
                setattr(message, field, message_dict[field])
                updated_fields = True

        # Handle depreciated and depreciated_date
        if 'depreciated' in message_dict and message.depreciated != message_dict['depreciated']:
            message.depreciated = message_dict['depreciated']
            updated_fields = True

        if 'depreciated_date' in message_dict:
            new_depreciated_date = message_dict['depreciated_date']
            if new_depreciated_date != (message.depreciated_date.isoformat() if message.depreciated_date else None):
                message.depreciated_date = date.fromisoformat(new_depreciated_date) if new_depreciated_date else None
                updated_fields = True

        # Update the created_by relationship
        if created_by:
            try:
                person = Person.nodes.get(employee_id=created_by)
                if not message.created_by.is_connected(person):
                    message.created_by.disconnect_all()
                    message.created_by.connect(person)
                    updated_fields = True
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with employee_id {created_by} not found.")

        # Save the message if any fields were updated
        if updated_fields:
            message.save()

        # Handle YearSuccessEvidence association
        if year_success_evidence:
            try:
                yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
                if not yse.messages.is_connected(message):
                    yse.messages.connect(message)
            except YearSuccessEvidence.DoesNotExist:
                raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")

        # Handle Implementation association
        if implementation_id and implementation_type:
            # Assign the message to the implementation
            assign_documentation_to_implementation(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type="message",
                documentation_id=message.unique_id
            )

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise

    except NotFoundError as e:
        print(f"Not found: {e}")
        raise

    except Exception as e:
        print(f"Error during message update: {e}")
        raise CrudError(f"Failed to update message: {e}")



def update_document(
        document_dict: dict,
        year_success_evidence: str = None,
        implementation_id: str = None,
        implementation_type: str = None,
        maintainer_id: str = None  # Changed from created_by to maintainer_id using unique_id
) -> bool:
    """
    Updates an existing document. The document can be associated with a YearSuccessEvidence, an implementation, or both.

    :param document_dict: Dictionary containing document properties to update.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to associate the document with.
    :param implementation_id: (Optional) The unique_id of the implementation to associate the document with.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param maintainer_id: (Optional) The unique_id of the person who maintains the document.
    :return: True if the document was updated successfully.
    """

    try:
        # Fetch the document by unique_id
        unique_id = document_dict.get('unique_id')
        if not unique_id:
            raise ValidationError("Missing 'unique_id' in document_dict.")

        try:
            document = Document.nodes.get(unique_id=unique_id)
        except Document.DoesNotExist:
            raise NotFoundError(f"Document with unique_id {unique_id} not found.")

        # Update document properties
        updated_fields = False

        for field in [
            'name',
            'file_path',
            'uri_path',
            'description',  # Added description field
            'is_administrative_review_documentation',
            'is_milestone_and_measures_documentation',
            'include_in_report'
        ]:
            if field in document_dict and getattr(document, field) != document_dict[field]:
                setattr(document, field, document_dict[field])
                updated_fields = True

        # Handle depreciated and depreciated_date
        if 'depreciated' in document_dict and document.depreciated != document_dict['depreciated']:
            document.depreciated = document_dict['depreciated']
            updated_fields = True

        if 'depreciated_date' in document_dict:
            new_depreciated_date_str = document_dict['depreciated_date']
            if new_depreciated_date_str != (document.depreciated_date.isoformat() if document.depreciated_date else None):
                document.depreciated_date = date.fromisoformat(new_depreciated_date_str) if new_depreciated_date_str else None
                updated_fields = True

        # Update the maintained_by relationship using unique_id
        if maintainer_id:
            try:
                person = Person.nodes.get(unique_id=maintainer_id)  # Changed to use unique_id
                if not document.maintained_by.is_connected(person):  # Changed from created_by to maintained_by
                    document.maintained_by.disconnect_all()
                    document.maintained_by.connect(person)
                    updated_fields = True
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with unique_id {maintainer_id} not found.")

        # Save the document if any fields were updated
        if updated_fields:
            document.save()

        # Handle YearSuccessEvidence association
        if year_success_evidence:
            try:
                yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
                if not yse.documents.is_connected(document):
                    yse.documents.connect(document)
            except YearSuccessEvidence.DoesNotExist:
                raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")

        # Handle Implementation association
        if implementation_id and implementation_type:
            # Assign the document to the implementation
            assign_documentation_to_implementation(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type="document",
                documentation_id=document.unique_id
            )

        return True

    except ValidationError as e:
        raise CrudError(f"Failed to update document: {e}")

    except NotFoundError as e:
        raise CrudError(f"Failed to update document: {e}")

    except Exception as e:
        print(f"Error during document update: {e}")
        raise CrudError(f"Failed to update document: {e}")



def update_webpage(
        webpage_dict: dict,
        year_success_evidence: str = None,
        implementation_id: str = None,
        implementation_type: str = None,
        maintainer_id: str = None  # Changed to maintainer_id using unique_id
) -> bool:
    """
    Updates an existing webpage. The webpage can be associated with a YearSuccessEvidence, an implementation, or both.

    :param webpage_dict: Dictionary containing webpage properties to update.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to associate the webpage with.
    :param implementation_id: (Optional) The unique_id of the implementation to associate the webpage with.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param maintainer_id: (Optional) The unique_id of the person who maintains the webpage.
    :return: True if the webpage was updated successfully.
    """
    try:
        # Fetch the webpage by unique_id
        unique_id = webpage_dict.get('unique_id')
        if not unique_id:
            raise ValidationError("Missing 'unique_id' in webpage_dict.")

        try:
            webpage = Webpage.nodes.get(unique_id=unique_id)
        except Webpage.DoesNotExist:
            raise NotFoundError(f"Webpage with unique_id {unique_id} not found.")

        # Update webpage properties
        updated_fields = False

        for field in [
            'name',
            'url',
            'description',
            'no_longer_exists',
            'include_in_report'
        ]:
            if field in webpage_dict and getattr(webpage, field) != webpage_dict[field]:
                setattr(webpage, field, webpage_dict[field])
                updated_fields = True

        # Handle depreciated and depreciated_date
        if 'depreciated' in webpage_dict and webpage.depreciated != webpage_dict['depreciated']:
            webpage.depreciated = webpage_dict['depreciated']
            updated_fields = True

        if 'depreciated_date' in webpage_dict:
            new_depreciated_date_str = webpage_dict['depreciated_date']
            current_depreciated_date_str = (
                webpage.depreciated_date.isoformat() if webpage.depreciated_date else None
            )
            if new_depreciated_date_str != current_depreciated_date_str:
                webpage.depreciated_date = (
                    date.fromisoformat(new_depreciated_date_str)
                    if new_depreciated_date_str else None
                )
                updated_fields = True

        # Update the maintained_by relationship using unique_id
        if maintainer_id:
            try:
                person = Person.nodes.get(unique_id=maintainer_id)  # Changed to use unique_id
                if not webpage.maintained_by.is_connected(person):  # Fixed to use maintained_by
                    webpage.maintained_by.disconnect_all()
                    webpage.maintained_by.connect(person)
                    updated_fields = True
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with unique_id {maintainer_id} not found.")

        # Save the webpage if any fields were updated
        if updated_fields:
            webpage.save()

        # Handle YearSuccessEvidence association
        if year_success_evidence:
            try:
                yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
                if not yse.webpages.is_connected(webpage):
                    yse.webpages.connect(webpage)
            except YearSuccessEvidence.DoesNotExist:
                raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")

        # Handle Implementation association
        if implementation_id and implementation_type:
            # Assign the webpage to the implementation
            try:
                assign_documentation_to_implementation(
                    implementation_id=implementation_id,
                    implementation_type=implementation_type,
                    documentation_type="webpage",
                    documentation_id=webpage.unique_id
                )
            except Exception as e:
                raise CrudError(f"Error assigning webpage to implementation: {e}")

        return True

    except ValidationError as e:
        raise CrudError(f"Failed to update webpage: {e}")

    except NotFoundError as e:
        raise CrudError(f"Failed to update webpage: {e}")

    except Exception as e:
        print(f"Error during webpage update: {e}")
        raise CrudError(f"Failed to update webpage: {e}")





#
# unassign_note_from_yse("Measures of success: Stored in compliance sheriff", "2022-2023-1.6-web")
def update_metric():
    return None