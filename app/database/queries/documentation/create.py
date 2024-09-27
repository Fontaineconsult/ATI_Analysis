#
# DOCUMENTATION CREATE QUERIES
#
from app.database.graph_schema import *
from app.database.tools.support_functions import get_file_hash


def add_document(name, file_path=None, uri_path=None, is_administrative_review_documentation=False, is_milestone_and_measures_documentation=False) -> bool:
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
            is_administrative_review_documentation=is_administrative_review_documentation,
            is_milestone_and_measures_documentation=is_milestone_and_measures_documentation
        )
        new_document.save()
        print("Document added successfully.")
        return True
    except Exception as e:
        print(f"Failed to add document: {e}")
        return False


def add_webpage(url: str, name: str, no_longer_exists:bool, description: str) -> bool:
    """
    Adds a webpage node to the graph.

    :param url: URL of the webpage.
    :param name: Name of the webpage.
    :param no_longer_exists: Indicates if the webpage no longer exists.
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
            no_longer_exists=no_longer_exists,
            description=description
        )
        new_webpage.save()
        print("Webpage added successfully.")
        return True
    except Exception as e:
        print(f"Failed to add webpage: {e}")
        return False


def add_note(uuid: str, name: str, date_created: str, content: str) -> bool:
    """
    Adds a note node to the graph.

    :param uuid: Unique identifier for the note.
    :param name: Name of the note.
    :param date_created: Date when the note was created.
    :param content: Content of the note.
    :return: True if the note node is added successfully, False otherwise.
    """
    try:
        # Check if a note with the same UUID already exists
        existing_note = Note.nodes.get_or_none(uuid=uuid)
        if existing_note:
            print("A note with the same UUID already exists.")
            return False

        # Create and save the new note node
        new_note = Note(
            uuid=uuid,
            name=name,
            date_created=date_created,
            content=content
        )
        new_note.save()
        print("Note added successfully.")
        return True
    except Exception as e:
        print(f"Failed to add note: {e}")
        return False


def add_memo(title: str, description: str, authored_date: str) -> bool:
    """
    Adds a memo node to the graph.
import sys
sys.path.append(r"C:\\Users\\Fonta\\IdeaProjects\\ATI_Analysis")
sys.path.append(r"C:\\Users\\913678186\\IdeaProjects\\ATI_Analysis")

import ipywidgets as widgets
from IPython.display import display
from app.database.queries.documentation.create import add_note

# Create form widgets
note_name = widgets.Text(value='', placeholder='Enter note name', description='Name:', disabled=False)
note_content = widgets.Textarea(value='', placeholder='Enter note content', description='Content:', disabled=False)
note_date_created = widgets.DatePicker(description='Date Created:', disabled=False)
submit_button = widgets.Button(description='Submit', disabled=False, button_style='', tooltip='Click to submit', icon='check')
output = widgets.Output()

# Define the event handler for the submit button
def on_button_click(b):
    with output:
        output.clear_output()
        success = add_note(
            name=note_name.value,
            content=note_content.value,
            date_created=note_date_created.value
        )
        if success:
            print('Note added successfully')
        else:
            print('Failed to add note')

# Attach the event handler to the button
submit_button.on_click(on_button_click)

# Display the form
form_items = [note_name, note_content, note_date_created, submit_button, output]
form = widgets.VBox(form_items)
display(form)import sys
sys.path.append(r"C:\\Users\\Fonta\\IdeaProjects\\ATI_Analysis")
sys.path.append(r"C:\\Users\\913678186\\IdeaProjects\\ATI_Analysis")

import ipywidgets as widgets
from IPython.display import display
from app.database.queries.documentation.create import add_note

# Create form widgets
note_name = widgets.Text(value='', placeholder='Enter note name', description='Name:', disabled=False)
note_content = widgets.Textarea(value='', placeholder='Enter note content', description='Content:', disabled=False)
note_date_created = widgets.DatePicker(description='Date Created:', disabled=False)
submit_button = widgets.Button(description='Submit', disabled=False, button_style='', tooltip='Click to submit', icon='check')
output = widgets.Output()

# Define the event handler for the submit button
def on_button_click(b):
    with output:
        output.clear_output()
        success = add_note(
            name=note_name.value,
            content=note_content.value,
            date_created=note_date_created.value
        )
        if success:
            print('Note added successfully')
        else:
            print('Failed to add note')

# Attach the event handler to the button
submit_button.on_click(on_button_click)

# Display the form
form_items = [note_name, note_content, note_date_created, submit_button, output]
form = widgets.VBox(form_items)
display(form)
    :param title: Title of the memo.
    :param description: Description of the memo.
    :param authored_date: Date when the memo was authored.
    :return: True if the memo node is added successfully, False otherwise.
    """
    try:
        # Check if a memo with the same title already exists
        existing_memo = Memo.nodes.get_or_none(title=title)
        if existing_memo:
            print("A memo with the same title already exists.")
            return False

        # Create and save the new memo node
        new_memo = Memo(
            title=title,
            description=description,
            authored_date=authored_date
        )
        new_memo.save()
        print("Memo added successfully.")
        return True
    except Exception as e:
        print(f"Failed to add memo: {e}")
        return False




# def add_document_to_year_success_evidence(year_identifier: str,
#                                           document_name: str,
#                                           file_path: str,
#                                           uri_path: str,
#                                           document_hash: str = None,
#                                           ) -> bool:
#     """
#     Adds a document to a year success evidence node
#     :param year_identifier:
#     :param document_name:
#     :param file_path:
#     :param uri_path:
#     :return:
#     """
#     if not document_hash:
#         document_hash = str(uuid.uuid4())
#
#     try:
#         year_status = YearSuccessEvidence.nodes.get(year_identifier=year_identifier)
#         new_document = Document(
#             hash=document_hash,
#             name=document_name,
#             file_path=file_path,
#             uri_path=uri_path
#
#         )
#         new_document.save()
#         year_status.has_documents.connect(new_document)
#
#         return True
#     except Exception as e:
#         return False