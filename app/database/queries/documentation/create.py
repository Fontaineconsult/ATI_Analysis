from neomodel import db
from datetime import date, datetime

from app.database.queries.implementation.update import assign_documentation_to_implementation
from app.database.tools.support_functions import get_file_hash
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError, CrudError
from app.database.graph_schema import (Note,
                                       Person,
                                       YearSuccessEvidence,
                                       Message,
                                       Document, Webpage, AcademicYear, Metric)



def add_note(
        note_dict: dict,
        year_success_evidence: str = None,
        implementation_id: str = None,
        implementation_type: str = None,
        academic_year: str = None,  # Add this parameter
        include_in_year: bool = True  # Add this parameter
) -> bool:
    """
    Adds a new note to the graph. The note can be assigned to a YearSuccessEvidence or an implementation
    with year-specific inclusion.

    :param note_dict: Dictionary containing note properties.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to assign the note to.
    :param implementation_id: (Optional) The unique_id of the implementation to assign the note to.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param academic_year: (Optional) The academic year for year-specific inclusion (e.g., "2024-2025").
    :param include_in_year: (Optional) Whether to include in the specified academic year (default: True).
    :return: True if the note was added successfully.
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
            note = existing_note
            # If note exists and we're assigning to implementation, update the year inclusion
            if implementation_id and implementation_type:
                assign_documentation_to_implementation(
                    implementation_id=implementation_id,
                    implementation_type=implementation_type,
                    documentation_type="note",  # lowercase to match the convention
                    documentation_id=note.unique_id,
                    academic_year=academic_year,
                    include_in_year=include_in_year
                )
                return True
        else:
            # Create and save the new note
            note = Note(
                name=note_dict['name'],
                content=note_dict['content'],
                depreciated=note_dict.get('depreciated', False),
                depreciated_date=date.fromisoformat(note_dict.get('depreciated_date')) if note_dict.get('depreciated_date') else None,
                include_in_report=note_dict.get('include_in_report', True),
                date_created=date.fromisoformat(note_dict['date_created']) if note_dict.get('date_created') else None,
                file_path=note_dict.get('file_path'),  # Add if your Note model supports this
                uri_path=note_dict.get('uri_path')  # Add if your Note model supports this
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
                            title=created_by_data.get('title')
                        )
                        person.save()
                    note.created_by.connect(person)

        # Optionally connect the note to YearSuccessEvidence
        if year_success_evidence:
            yse = YearSuccessEvidence.nodes.get_or_none(year_identifier=year_success_evidence)
            if not yse:
                raise NotFoundError(f"YearSuccessEvidence {year_success_evidence} not found.")

            if not yse.notes.is_connected(note):
                yse.notes.connect(note)

        # Optionally assign the note to an implementation with year-specific inclusion
        if implementation_id and implementation_type:
            assign_documentation_to_implementation(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type="note",  # lowercase to match the convention
                documentation_id=note.unique_id,
                academic_year=academic_year,
                include_in_year=include_in_year
            )

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



def add_message(
        message_dict: dict,
        year_success_evidence: str = None,
        implementation_id: str = None,
        implementation_type: str = None,
        academic_year: str = None,  # Add this parameter
        include_in_year: bool = True  # Add this parameter
) -> bool:
    """
    Adds a new message to the graph. The message can be assigned to a YearSuccessEvidence or an implementation
    with year-specific inclusion.

    :param message_dict: Dictionary containing message properties.
    :param year_success_evidence: (Optional) The year identifier of the YearSuccessEvidence to assign the message to.
    :param implementation_id: (Optional) The unique_id of the implementation to assign the message to.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param academic_year: (Optional) The academic year for year-specific inclusion (e.g., "2024-2025").
    :param include_in_year: (Optional) Whether to include in the specified academic year (default: True).
    :return: True if the message was added successfully.
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

        # Create and save the message
        message = Message(
            name=message_dict['name'],
            type=message_dict.get('message_type'),
            date_created=date.fromisoformat(message_dict['date_created']) if message_dict.get('date_created') else datetime.now().date(),
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
                        title=created_by_data.get('title')
                    )
                    person.save()
                message.created_by.connect(person)

        # Optionally connect the message to YearSuccessEvidence
        if year_success_evidence:
            yse = YearSuccessEvidence.nodes.get_or_none(year_identifier=year_success_evidence)
            if not yse:
                raise NotFoundError(f"YearSuccessEvidence {year_success_evidence} not found.")
            yse.messages.connect(message)

        # Optionally assign the message to an implementation with year-specific inclusion
        if implementation_id and implementation_type:
            assign_documentation_to_implementation(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type="message",
                documentation_id=message.unique_id,
                academic_year=academic_year,  # Pass academic year
                include_in_year=include_in_year  # Pass inclusion flag
            )

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


def add_document(
        name,
        file_path=None,
        uri_path=None,
        depreciated=False,
        depreciated_date=None,
        is_administrative_review_documentation=False,
        is_milestone_and_measures_documentation=False,
        implementation_id=None,
        implementation_type=None,
        academic_year=None,  # Add this parameter
        include_in_year=True  # Add this parameter
) -> bool:
    """
    Adds a document node to the graph. Optionally assigns the document to an implementation
    with year-specific inclusion if implementation_id is provided.
    """
    try:
        if not file_path and not uri_path:
            raise ValidationError("Either file path or URI path must be provided.")

        # Calculate hash if file_path is provided
        hash = get_file_hash(file_path) if file_path else None
        hash = None  # Todo implement when get_file_hash is implemented

        # Check if a document with the same hash already exists
        if hash:
            existing_document = Document.nodes.get_or_none(hash=hash)
            if existing_document:
                raise ValidationError(f"A document with hash {hash} already exists.")
        else:
            existing_document = Document.nodes.get_or_none(uri_path=uri_path)
            if existing_document:
                raise ValidationError(f"A document with URI path {uri_path} already exists.")

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

        # Assign to implementation with year-specific inclusion
        if implementation_id and implementation_type:
            assign_documentation_to_implementation(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type="document",
                documentation_id=new_document.unique_id,
                academic_year=academic_year,  # Pass the academic year
                include_in_year=include_in_year  # Pass the inclusion flag
            )

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise
    except Exception as e:
        print(f"Failed to add document: {e}")
        raise CrudError("Failed to add document", e)


def add_webpage(
        url,
        name,
        no_longer_exists,
        depreciated,
        depreciated_date,
        description,
        include_in_report,
        created_by=None,
        implementation_id=None,
        implementation_type=None,
        academic_year=None,  # Add this parameter
        include_in_year=True  # Add this parameter
) -> bool:
    """
    Adds a webpage node to the graph. Optionally assigns the webpage to an implementation
    with year-specific inclusion if implementation_id is provided.

    :param url: The URL of the webpage.
    :param name: The name of the webpage.
    :param no_longer_exists: Boolean indicating if the webpage no longer exists.
    :param depreciated: Boolean indicating if the webpage is depreciated.
    :param depreciated_date: The date the webpage was depreciated (format: YYYY-MM-DD).
    :param description: A description of the webpage.
    :param include_in_report: Global include in report flag.
    :param created_by: (Optional) The person who created/maintains the webpage.
    :param implementation_id: (Optional) The unique_id of the implementation to assign this webpage to.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :param academic_year: (Optional) The academic year for year-specific inclusion (e.g., "2024-2025").
    :param include_in_year: (Optional) Whether to include in the specified academic year (default: True).
    :return: True if the webpage was added successfully.
    """
    try:
        # Check if the webpage already exists
        existing_webpage = Webpage.nodes.get_or_none(url=url)
        if existing_webpage:
            if implementation_id and implementation_type:
                assign_documentation_to_implementation(
                    implementation_id=implementation_id,
                    implementation_type=implementation_type,
                    documentation_type="webpage",
                    documentation_id=existing_webpage.unique_id,
                    academic_year=academic_year,
                    include_in_year=include_in_year
                )
                return True
            else:
                raise ValidationError(f"A webpage with URL {url} already exists.")

        # Create and save the webpage
        new_webpage = Webpage(
            url=url,
            name=name,
            depreciated=depreciated,
            depreciated_date=datetime.strptime(depreciated_date, "%Y-%m-%d").date() if depreciated_date else None,
            no_longer_exists=no_longer_exists,
            description=description,
            include_in_report=include_in_report
        )
        new_webpage.save()

        # Handle the created_by/maintained_by relationship
        if created_by:
            try:
                # Assuming created_by is an employee_id or unique_id
                person = Person.nodes.get_or_none(unique_id=created_by) or \
                         Person.nodes.get_or_none(employee_id=created_by)
                if person:
                    new_webpage.maintained_by.connect(person)
            except Exception as e:
                print(f"Warning: Could not connect created_by person: {e}")
                # Continue even if person connection fails

        # Assign to implementation with year-specific inclusion
        if implementation_id and implementation_type:
            result = assign_documentation_to_implementation(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type="webpage",
                documentation_id=new_webpage.unique_id,
                academic_year=academic_year,
                include_in_year=include_in_year
            )

            if not result:
                print(f"Warning: Failed to assign webpage to implementation")

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise
    except Exception as e:
        print(f"Failed to add webpage: {e}")
        raise CrudError("Failed to add webpage", e)



def add_metric(
        metric_dict: dict,
        implementation_id: str = None,
        implementation_type: str = None
) -> bool:
    """
    Adds a new metric to the graph. The metric can be assigned to an implementation.

    :param metric_dict: Dictionary containing metric properties.
    :param implementation_id: (Optional) The unique_id of the implementation to assign the metric to.
    :param implementation_type: (Optional) The type of the implementation (e.g., "Process", "Project").
    :return: True if the metric was added successfully.
    """
    try:
        # Ensure required fields are present
        required_fields = ['name', 'metric_type']
        for field in required_fields:
            if field not in metric_dict:
                raise ValidationError(f"Missing required field: {field}")

        # Generate composite_key for uniqueness
        composite_key = f"{metric_dict['name']}_{metric_dict.get('metric_type')}"

        # Check if a metric with the same composite_key already exists
        existing_metric = Metric.nodes.get_or_none(composite_key=composite_key)
        if existing_metric:
            raise ValidationError(f"A metric with composite_key {composite_key} already exists.")

        # Create and save the metric
        metric = Metric(
            name=metric_dict['name'],
            composite_key=composite_key,
            metric_type=metric_dict.get('metric_type'),
            file_path=metric_dict.get('file_path'),
            uri_path=metric_dict.get('uri_path'),
            description=metric_dict.get('description'),
            single_value=metric_dict.get('single_value'),
            value_dict=metric_dict.get('value_dict'),
            comment=metric_dict.get('comment'),
            include_in_report=metric_dict.get('include_in_report', True)
        )
        metric.save()

        # Handle the created_by relationship
        if 'created_by' in metric_dict:
            created_by_data = metric_dict['created_by']
            employee_id = created_by_data.get('employee_id')
            if employee_id:
                person = Person.nodes.get_or_none(employee_id=employee_id)
                if not person:
                    person = Person(
                        name=created_by_data['name'],
                        email=created_by_data['email'],
                        employee_id=employee_id,
                        title=created_by_data.get('title')
                    )
                    person.save()
                metric.created_by.connect(person)

        # Handle the academic_year relationship
        if 'academic_year' in metric_dict:
            academic_year_identifier = metric_dict['academic_year']
            academic_year_node = AcademicYear.nodes.get(name=academic_year_identifier)
            if not academic_year_node:
                # Create a new AcademicYear node if it doesn't exist
                academic_year_node = AcademicYear(name=academic_year_identifier)
                academic_year_node.save()
            metric.academic_year.connect(academic_year_node)

        # Optionally assign the metric to an implementation
        if implementation_id and implementation_type:
            assign_documentation_to_implementation(
                implementation_id=implementation_id,
                implementation_type=implementation_type,
                documentation_type="metric",
                documentation_id=metric.unique_id
            )

        return True

    except ValidationError as e:
        print(f"Validation error: {e}")
        raise

    except NotFoundError as e:
        print(f"Not found: {e}")
        raise

    except Exception as e:
        print(f"Error during metric creation: {e}")
        raise CrudError("Failed to add metric", e)
