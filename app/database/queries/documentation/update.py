#
# DOCUMENTATION UPDATE QUERIES
#
from app.database.graph_schema import *
from datetime import date

from app.database.queries.implementation.update import assign_documentation_to_implementation, \
    update_documentation_year_inclusion
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError, ValidationError
from app.database.queries.files.create import register_stored_file, link_file_to_node


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
        created_by: str = None,
        academic_year: str = None,  # Add this parameter
        include_in_year: bool = True  # Add this parameter
) -> bool:
    """
    Updates an existing note. The note can be associated with a YearSuccessEvidence, an implementation, or both.
    Can update year-specific inclusion for implementation relationships.

    :param note_dict: Dictionary containing note properties to update.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to associate the note with.
    :param implementation_id: (Optional) The unique_id of the implementation to associate the note with.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param created_by: (Optional) The employee_id of the person who created the note.
    :param academic_year: (Optional) The academic year for year-specific inclusion (e.g., "2024-2025").
    :param include_in_year: (Optional) Whether to include in the specified academic year (default: True).
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

        for field in ['name', 'content', 'include_in_report', 'file_path', 'uri_path']:
            if field in note_dict and getattr(note, field, None) != note_dict[field]:
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

        # Handle date_created if provided
        if 'date_created' in note_dict:
            new_date_created = note_dict['date_created']
            if new_date_created != (note.date_created.isoformat() if note.date_created else None):
                note.date_created = date.fromisoformat(new_date_created) if new_date_created else None
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

        # Handle Implementation association with year-specific inclusion
        if implementation_id and implementation_type:
            if academic_year:
                # Use update_documentation_year_inclusion for existing relationships
                # or assign_documentation_to_implementation for new ones
                try:
                    update_documentation_year_inclusion(
                        implementation_id=implementation_id,
                        implementation_type=implementation_type,
                        documentation_type="note",
                        documentation_id=note.unique_id,
                        academic_year=academic_year,
                        include=include_in_year
                    )
                except NotFoundError:
                    # If no existing relationship, create one with year inclusion
                    assign_documentation_to_implementation(
                        implementation_id=implementation_id,
                        implementation_type=implementation_type,
                        documentation_type="note",
                        documentation_id=note.unique_id,
                        academic_year=academic_year,
                        include_in_year=include_in_year
                    )
            else:
                # No year specified, just assign normally
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
        created_by: str = None,
        academic_year: str = None,  # Add this parameter
        include_in_year: bool = True  # Add this parameter
) -> bool:
    """
    Updates an existing message. The message can be associated with a YearSuccessEvidence, an implementation, or both.
    Can update year-specific inclusion for implementation relationships.

    :param message_dict: Dictionary containing message properties to update.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to associate the message with.
    :param implementation_id: (Optional) The unique_id of the implementation to associate the message with.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param created_by: (Optional) The employee_id of the person who created the message.
    :param academic_year: (Optional) The academic year for year-specific inclusion (e.g., "2024-2025").
    :param include_in_year: (Optional) Whether to include in the specified academic year (default: True).
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

        for field in ['name', 'content', 'file_path', 'uri_path', 'include_in_report', 'type']:
            if field in message_dict and getattr(message, field, None) != message_dict[field]:
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

        # Handle date_created if provided
        if 'date_created' in message_dict:
            new_date_created = message_dict['date_created']
            if new_date_created != (message.date_created.isoformat() if message.date_created else None):
                message.date_created = date.fromisoformat(new_date_created) if new_date_created else None
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

        # Register + link a managed (uploaded) file if one was attached/changed.
        if message_dict.get('storage_key'):
            current = message.has_file.single()
            if not current or current.storage_key != message_dict['storage_key']:
                link_file_to_node(message, register_stored_file(
                    message_dict['storage_key'],
                    original_filename=message_dict.get('original_filename'),
                    content_type=message_dict.get('content_type'),
                    size=message_dict.get('size'),
                ))

        # Handle YearSuccessEvidence association
        if year_success_evidence:
            try:
                yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
                if not yse.messages.is_connected(message):
                    yse.messages.connect(message)
            except YearSuccessEvidence.DoesNotExist:
                raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")

        # Handle Implementation association with year-specific inclusion
        if implementation_id and implementation_type:
            if academic_year:
                # Use update_documentation_year_inclusion for existing relationships
                # or assign_documentation_to_implementation for new ones
                try:
                    update_documentation_year_inclusion(
                        implementation_id=implementation_id,
                        implementation_type=implementation_type,
                        documentation_type="message",
                        documentation_id=message.unique_id,
                        academic_year=academic_year,
                        include=include_in_year
                    )
                except NotFoundError:
                    # If no existing relationship, create one with year inclusion
                    assign_documentation_to_implementation(
                        implementation_id=implementation_id,
                        implementation_type=implementation_type,
                        documentation_type="message",
                        documentation_id=message.unique_id,
                        academic_year=academic_year,
                        include_in_year=include_in_year
                    )
            else:
                # No year specified, just assign normally
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



def update_document(
        document_dict: dict,
        year_success_evidence: str = None,
        implementation_id: str = None,
        implementation_type: str = None,
        maintainer_id: str = None,
        academic_year: str = None,
        include_in_year: bool = None
) -> bool:
    """
    Updates an existing document. The document can be associated with a YearSuccessEvidence, an implementation, or both.

    :param document_dict: Dictionary containing document properties to update.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to associate the document with.
    :param implementation_id: (Optional) The unique_id of the implementation to associate the document with.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param maintainer_id: (Optional) The unique_id of the person who maintains the document.
    :param academic_year: (Optional) The name of the academic year to associate the document with.
    :param include_in_year: (Optional) Boolean indicating whether to include the document in the specified academic year.
    :return: True if the document was updated successfully.
    """

    try:
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
            'description',
            'is_administrative_review_documentation',
            'is_milestone_and_measures_documentation',
            'include_in_report',
            'depreciated'
        ]:
            if field in document_dict and getattr(document, field) != document_dict[field]:
                setattr(document, field, document_dict[field])
                updated_fields = True

        # Handle depreciated_date
        if 'depreciated_date' in document_dict:
            new_depreciated_date_str = document_dict['depreciated_date']
            current_depreciated_date_str = (
                document.depreciated_date.isoformat() if document.depreciated_date else None
            )
            if new_depreciated_date_str != current_depreciated_date_str:
                document.depreciated_date = (
                    date.fromisoformat(new_depreciated_date_str)
                    if new_depreciated_date_str else None
                )
                updated_fields = True

        # Update maintainer
        if maintainer_id:
            try:
                person = Person.nodes.get(unique_id=maintainer_id)
                if not document.maintained_by.is_connected(person):
                    document.maintained_by.disconnect_all()
                    document.maintained_by.connect(person)
                    updated_fields = True
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with unique_id {maintainer_id} not found.")

        if updated_fields:
            document.save()

        # Register + link a managed (uploaded) file if one was attached/changed.
        if document_dict.get('storage_key'):
            current = document.has_file.single()
            if not current or current.storage_key != document_dict['storage_key']:
                link_file_to_node(document, register_stored_file(
                    document_dict['storage_key'],
                    original_filename=document_dict.get('original_filename'),
                    content_type=document_dict.get('content_type'),
                    size=document_dict.get('size'),
                ))

        # Handle year-specific inclusion in relationship
        if implementation_id and implementation_type and academic_year is not None and include_in_year is not None:
            update_documentation_year_inclusion(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type='document',
                documentation_id=unique_id,
                academic_year=academic_year,
                include=include_in_year
            )

        # Handle YearSuccessEvidence association (existing code)
        if year_success_evidence:
            try:
                yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
                if not yse.documents.is_connected(document):
                    yse.documents.connect(document)
            except YearSuccessEvidence.DoesNotExist:
                raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")

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
        maintainer_id: str = None,
        academic_year: str = None,
        include_in_year: bool = None
) -> bool:
    """
    Updates an existing webpage and optionally its year-specific inclusion.
    """
    try:
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

        # Update the maintained_by relationship
        if maintainer_id:
            try:
                person = Person.nodes.get(unique_id=maintainer_id)
                if not webpage.maintained_by.is_connected(person):
                    webpage.maintained_by.disconnect_all()
                    webpage.maintained_by.connect(person)
                    updated_fields = True
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with unique_id {maintainer_id} not found.")

        if updated_fields:
            webpage.save()

        # Handle year-specific inclusion in relationship
        if implementation_id and implementation_type and academic_year is not None and include_in_year is not None:
            from app.database.queries.implementation.update import update_documentation_year_inclusion
            update_documentation_year_inclusion(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type='webpage',
                documentation_id=unique_id,
                academic_year=academic_year,
                include=include_in_year
            )

        # Handle YearSuccessEvidence association
        if year_success_evidence:
            try:
                yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
                if not yse.webpages.is_connected(webpage):
                    yse.webpages.connect(webpage)
            except YearSuccessEvidence.DoesNotExist:
                raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")

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
def update_metric(
        metric_dict: dict,
        year_success_evidence: str = None,
        implementation_id: str = None,
        implementation_type: str = None,
        created_by_id: str = None,
        academic_year: str = None
) -> bool:
    """
    Updates an existing metric. The metric can be associated with a YearSuccessEvidence, an implementation, or both.

    :param metric_dict: Dictionary containing metric properties to update.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to associate the metric with.
    :param implementation_id: (Optional) The unique_id of the implementation to associate the metric with.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param created_by_id: (Optional) The unique_id of the person who created the metric.
    :param academic_year: (Optional) The name of the academic year to associate the metric with.
    :return: True if the metric was updated successfully.
    """
    try:
        # Fetch the metric by unique_id
        unique_id = metric_dict.get('unique_id')
        if not unique_id:
            raise ValidationError("Missing 'unique_id' in metric_dict.")

        try:
            metric = Metric.nodes.get(unique_id=unique_id)
        except Metric.DoesNotExist:
            raise NotFoundError(f"Metric with unique_id {unique_id} not found.")

        # Update metric properties
        updated_fields = False

        for field in [
            'name',
            'composite_key',
            'metric_type',
            'file_path',
            'uri_path',
            'description',
            'single_value',
            'comment',
            'include_in_report'
        ]:
            if field in metric_dict and getattr(metric, field) != metric_dict[field]:
                setattr(metric, field, metric_dict[field])
                updated_fields = True

        # Handle value_dict (JSON field) separately
        if 'value_dict' in metric_dict:
            new_value_dict = metric_dict['value_dict']
            if metric.value_dict != new_value_dict:
                metric.value_dict = new_value_dict
                updated_fields = True

        # Update the created_by relationship using unique_id
        if created_by_id:
            try:
                person = Person.nodes.get(unique_id=created_by_id)
                if not metric.created_by.is_connected(person):
                    metric.created_by.disconnect_all()
                    metric.created_by.connect(person)
                    updated_fields = True
            except Person.DoesNotExist:
                raise NotFoundError(f"Person with unique_id {created_by_id} not found.")

        # Update the academic_year relationship
        if academic_year:
            try:
                ay = AcademicYear.nodes.get(name=academic_year)
                if not metric.academic_year.is_connected(ay):
                    metric.academic_year.disconnect_all()
                    metric.academic_year.connect(ay)
                    updated_fields = True
            except AcademicYear.DoesNotExist:
                raise NotFoundError(f"AcademicYear with name {academic_year} not found.")

        # Save the metric if any fields were updated
        if updated_fields:
            metric.save()

        # Register + link a managed (uploaded) file if one was attached/changed.
        if metric_dict.get('storage_key'):
            current = metric.has_file.single()
            if not current or current.storage_key != metric_dict['storage_key']:
                link_file_to_node(metric, register_stored_file(
                    metric_dict['storage_key'],
                    original_filename=metric_dict.get('original_filename'),
                    content_type=metric_dict.get('content_type'),
                    size=metric_dict.get('size'),
                ))

        # Handle YearSuccessEvidence association
        if year_success_evidence:
            try:
                yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)
                if not yse.metrics.is_connected(metric):
                    yse.metrics.connect(metric)
            except YearSuccessEvidence.DoesNotExist:
                raise NotFoundError(f"YearSuccessEvidence with identifier {year_success_evidence} not found.")

        # Handle Implementation association
        if implementation_id and implementation_type:
            # Get the implementation model class
            implementation_model = get_implementation_model(implementation_type)
            if not implementation_model:
                raise ValidationError(f"Invalid implementation type: {implementation_type}")

            try:
                implementation = implementation_model.nodes.get(unique_id=implementation_id)
                if not implementation.supporting_metrics.is_connected(metric):
                    implementation.supporting_metrics.connect(metric)
            except implementation_model.DoesNotExist:
                raise NotFoundError(f"{implementation_type} with unique_id {implementation_id} not found.")

        return True

    except ValidationError as e:
        raise CrudError(f"Failed to update metric: {e}")

    except NotFoundError as e:
        raise CrudError(f"Failed to update metric: {e}")

    except Exception as e:
        print(f"Error during metric update: {e}")
        raise CrudError(f"Failed to update metric: {e}")


def get_implementation_model(implementation_type: str):
    """
    Helper function to get the implementation model class based on the type.

    :param implementation_type: The type of implementation (e.g., "Process", "Project").
    :return: The model class or None if invalid.
    """
    implementation_models = {
        "Process": Process,
        "Project": Project,
        "Procedure": Procedure,
        "Service": Service,
        "Guidance": Guidance,
        "Tracking": Tracking,
        "InternalPolicy": InternalPolicy
    }
    return implementation_models.get(implementation_type)