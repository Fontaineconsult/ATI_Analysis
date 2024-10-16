#
# DOCUMENTATION CREATE QUERIES
#
from datetime import datetime, date

from app.database.graph_schema import *
from app.database.tools.support_functions import get_file_hash


def add_document(name,
                 file_path=None,
                 uri_path=None,
                 depreciated=False,
                 depreciated_date=None,
                 is_administrative_review_documentation=False,
                 is_milestone_and_measures_documentation=False) -> bool:
    """
    Adds a document node to the graph.

    :param hash: Unique hash of the document.
    :param name: Name of the document.
    :param file_path: File path of the document.
    :param uri_path: URI path of the document.
    :param is_administrative_review_documentation: Indicates if it's administrative review documentation.
    :param is_milestone_and_measures_documentation: Indicates if it's milestone and measures documentation.
    :return: True if the document node is added successfully, False otherwise.
    """
    if file_path is None and uri_path is None:
        raise ValueError("Either file path or URI path must be provided.")


    hash = get_file_hash(file_path)

    existing_document = Document.nodes.get_or_none(hash=hash)
    if existing_document:
        print("A document with the same hash already exists.")
        return False

    try:
        new_document = Document(
            hash=hash,
            name=name,
            file_path=file_path,
            uri_path=uri_path,
            depreciated=depreciated,
            depreciated_date=datetime.strptime(depreciated_date, "%Y-%m-%d").year if depreciated_date else None,
            is_administrative_review_documentation=is_administrative_review_documentation,
            is_milestone_and_measures_documentation=is_milestone_and_measures_documentation
        )
        new_document.save()
        print("Document added successfully.")
        return True
    except Exception as e:
        print(f"Failed to add document: {e}")
        return False


def add_webpage(url: str,
                name: str,
                no_longer_exists:bool,
                depreciated:bool,
                depreciated_year: str,
                description: str) -> bool:
    """
    Adds a webpage node to the graph.

    :param url: URL of the webpage.
    :param name: Name of the webpage.
    :param no_longer_exists: Indicates if the webpage no longer exists.
    :param depreciated: Indicates if the webpage is depreciated and no longer relevant as evidence documentaiton.
    :param depreciated_date: Date the webpage was depreciated.
    :param description: Description of the webpage.
    :return: True if the webpage node is added successfully, False otherwise.
    """
    try:
        # Check if a webpage with the same URL already exists
        existing_webpage = Webpage.nodes.get_or_none(url=url)
        if existing_webpage:
            print("A webpage with the same URL already exists.")
            return False

        # Create and save the new webpage node
        new_webpage = Webpage(
            url=url,
            name=name,
            depreciated=depreciated,
            depreciated_date=datetime.strptime(depreciated_year, "%Y-%m-%d").year if depreciated_year else None,
            no_longer_exists=no_longer_exists,
            description=description
        )
        new_webpage.save()
        print("Webpage added successfully.")
        return True
    except Exception as e:
        print(f"Failed to add webpage: {e}")
        return False


from neomodel import db
from datetime import date

def add_note(year_success_evidence: str, note_dict: dict) -> bool:
    """
    Add a new note for a YearSuccessEvidence node, ensuring no duplicate names exist.

    :param year_success_evidence: str: The year identifier for the YearSuccessEvidence node.
    :param note_dict: dict: A dictionary containing the fields for the note, including 'created_by' data.
    :return: bool: Returns True if the note was successfully added, otherwise False.
    """
    # Validate input: ensure required fields are present
    print(year_success_evidence, note_dict)
    required_fields = ['name', 'content']
    for field in required_fields:
        if field not in note_dict:
            print(f"Missing required field: {field}")
            return False

    try:
        # Check if a note with the same name already exists
        if Note.nodes.get(name=note_dict.get('name')):
            print("A note with this name already exists.")
            return False
    except Note.DoesNotExist:
        pass  # If the note doesn't exist, proceed with creation
    except Exception as e:
        print(f"Error checking for existing note: {e}")
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

    person = None
    if 'created_by' in note_dict:
        created_by_data = note_dict['created_by']
        employee_id = created_by_data.get('employee_id')
        if employee_id:
            try:
                # Try to fetch the Person node by employee ID
                person = Person.nodes.get(employee_id=employee_id)
            except Person.DoesNotExist:
                # If Person does not exist, create a new Person node
                person = Person(
                    name=created_by_data.get('name'),
                    email=created_by_data.get('email'),
                    employee_id=employee_id,
                    title=created_by_data.get('title')
                )
                person.save()
            except Exception as e:
                print(f"Failed to get or create Person: {e}")
                return False
        else:
            print("Employee ID is missing in 'created_by' data.")
            return False

    # Start the note creation process
    try:
        # Create the new note
        note = Note(
            name=note_dict['name'],
            content=note_dict['content'],
            depreciated=note_dict.get('depreciated', False),
            depreciated_date=date.fromisoformat(note_dict['depreciated_date']) if note_dict.get('depreciated_date') else None,
            include_in_report=note_dict.get('include_in_report', True),
            date_created=date.fromisoformat(note_dict['date_created']) if note_dict.get('date_created') else None
        )
        note.save()

        # Handle the `created_by` relationship, if person exists
        if person:
            print("Connecting note to person.")
            note.created_by.connect(person)

        # Connect the new note to the YearSuccessEvidence node
        yse.notes.connect(note)

        return True

    except Exception as e:
        print(f"Error during note creation: {e}")
        return False




def add_message(year_success_evidence: str, message_dict: dict) -> bool:
    """
    Add a new message for a YearSuccessEvidence node, ensuring no duplicate names exist.

    :param year_success_evidence: str: The year identifier for the YearSuccessEvidence node.
    :param message_dict: dict: A dictionary containing the fields for the message, including 'created_by' data.
    :return: bool: Returns True if the message was successfully added, otherwise False.
    """
    # Validate input: ensure required fields are present
    print(year_success_evidence, message_dict)
    required_fields = ['name', 'message_type', 'date_created']
    for field in required_fields:
        if field not in message_dict:
            print(f"Missing required field: {field}")
            return False

    try:
        # Check if a message with the same name already exists
        if Message.nodes.get(name=message_dict.get('name')):
            print("A message with this name already exists.")
            return False
    except Message.DoesNotExist:
        pass  # If the message doesn't exist, proceed with creation
    except Exception as e:
        print(f"Error checking for existing message: {e}")
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

    person = None
    if 'created_by' in message_dict:
        created_by_data = message_dict['created_by']
        employee_id = created_by_data.get('employee_id')
        if employee_id:
            try:
                # Try to fetch the Person node by employee ID
                person = Person.nodes.get(employee_id=employee_id)
            except Person.DoesNotExist:
                # If Person does not exist, create a new Person node
                person = Person(
                    name=created_by_data.get('name'),
                    email=created_by_data.get('email'),
                    employee_id=employee_id,
                    title=created_by_data.get('title')
                )
                person.save()
            except Exception as e:
                print(f"Failed to get or create Person: {e}")
                return False
        else:
            print("Employee ID is missing in 'created_by' data.")
            return False

    # Start the message creation process
    try:
        # Create the new message
        message = Message(
            name=message_dict['name'],
            message_type=message_dict['message_type'],
            authored_date=message_dict['date_created'],
            content=message_dict.get('content'),
            file_path=message_dict.get('file_path'),
            uri_path=message_dict.get('uri_path'),
            depreciated=message_dict.get('depreciated', False),
            depreciated_date=date.fromisoformat(message_dict['depreciated_date']) if message_dict.get('depreciated_date') else None,
            include_in_report=message_dict.get('include_in_report', True),
        )
        message.save()

        # Handle the `created_by` relationship, if person exists
        if person:
            print("Connecting message to person.")
            message.created_by.connect(person)

        # Connect the new message to the YearSuccessEvidence node
        yse.messages.connect(message)

        return True

    except Exception as e:
        print(f"Error during message creation: {e}")
        return False



def add_metric(name:str,
               academic_year:str,
               description:str=None,
               metric_type:str=None,
               file_path:str=None,
               uri_path:str=None,
               single_value:str=None,
               comment:str=None,
               value_dict:dict=None
               ) -> bool:

        print("DSDFSDFDSFSDF", value_dict, type(value_dict))
        if isinstance(value_dict, dict):
            value_dict = Metric.set_data(value_dict)


        academic_year_node = AcademicYear.nodes.get_or_none(name=academic_year)
        if not academic_year_node:
            raise ValueError(f"No academic year found with name: {academic_year}")

        try:
            # Check if a metric with the same name already exists
            existing_metric = Metric.nodes.get_or_none(name=name)
            if existing_metric:
                print("A metric with the same name already exists.")
                return False

            # Create and save the new metric node
            new_metric = Metric(
                name=name,
                composite_key=f"{name}-{academic_year}",
                description=description,
                metric_type = metric_type,
                file_path = file_path,
                uri_path = uri_path,
                single_value=single_value,
                comment=comment,
                value_dict=value_dict,
            )
            new_metric.save()

            # Connect the metric to the academic year
            new_metric.academic_year.connect(academic_year_node)
            print("Metric added successfully.")
            return True
        except Exception as e:
            print(f"Failed to add metric: {e}")
            return False

# add_metric("What is the total percentage of EEAAP’s",
#            "2020-2021",
#            "",
#            single_value="996",
#            # comment="18 EEAAPs",
#            value_dict=None)



# year_success_evidence = "2022-2023-1.4-web"
# created_by = "913678186"
# note_dict = {
#     "name": "Progress Update",
#     "content": "We have completed 75% of the project ttessssssttttt milestones.",
#     # Optional fields
#     "depreciated": False,
#     "depreciated_date": None,
#     "include_in_report": True,
# }
#
# set_connection()
# result = add_note(
#     year_success_evidence=year_success_evidence,
#     note_dict=note_dict,
#     created_by=created_by
# )
