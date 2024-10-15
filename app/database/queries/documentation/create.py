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


def add_note(year_success_evidence: str, note_dict: dict, created_by: str = None) -> bool:
    """
    Add a new note for a YearSuccessEvidence node, ensuring no duplicate names exist.

    :param year_success_evidence: str: The year identifier for the YearSuccessEvidence node.
    :param note_dict: dict: A dictionary containing the fields for the note.
    :param created_by: str or None: The employee ID of the person who created the note (optional).
    :return: bool: Returns True if the note was successfully added, otherwise False.
    """
    # Validate input: ensure required fields are present
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
    if created_by:
        try:
            # Fetch the Person node by employee ID, if created_by is provided
            person = Person.nodes.get(employee_id=created_by)
        except Person.DoesNotExist:
            print(f"Person with employee_id {created_by} not found.")
            return False
        except Exception as e:
            print(f"Failed to get Person: {e}")
            return False

    # Start the note creation process
    try:
        # Create the new note
        note = Note(
            name=note_dict['name'],
            content=note_dict['content'],
            depreciated=note_dict.get('depreciated', False),
            depreciated_date=date.fromisoformat(note_dict.get('depreciated_date')) if note_dict.get('depreciated_date') else None,
            include_in_report=note_dict.get('include_in_report', True),
        )
        note.save()

        # Handle the `created_by` relationship, if person exists
        if person:
            note.created_by.connect(person)

        # Connect the new note to the YearSuccessEvidence node
        yse.notes.connect(note)

        return True

    except Exception as e:
        print(f"Error during note creation: {e}")
        return False



def add_message(name: str,
                message_type: str,
                authored_date: str,
                content: str=None,
                file_path: str=None,
                uri_path: str=None,
                ) -> bool:


    try:
        # Check if a memo with the same title already exists
        existing_memo = Message.nodes.get_or_none(name=name)
        if existing_memo:
            print("A memo with the same title already exists.")
            return False

        # Create and save the new memo node
        new_memo = Message(
            name=name,
            uri_path=uri_path,
            file_path=file_path,
            content=content,
            message_type=message_type,
            authored_date=authored_date
        )
        new_memo.save()
        print("Memo added successfully.")
        return True
    except Exception as e:
        print(f"Failed to add memo: {e}")
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