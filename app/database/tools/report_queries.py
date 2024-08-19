from app.database.graph_schema import *

def build_yse_report(year_success_evidence):

    # query for the year success evidence
    yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_evidence)

    # query for the status level
    status = yse.status_level.single()

    # query for the success indicator
    success_indicator = yse.tracks_success_indicator.single()

    # query for the processes_that_evidence
    processes = yse.processes_that_evidence.all()

    # query for the projects_that_evidence
    projects = yse.projects_that_evidence.all()

    # query for the procedures_that_evidence
    procedures = yse.procedures_that_evidence.all()

    # query for the services_that_evidence
    services = yse.services_that_evidence.all()

    # query for the guidelines_that_evidence
    guidance = yse.guidance_that_evidence.all()

    # query for the persons_that_implement
    persons = yse.persons_that_implement.all()

    # combine each query into a dictionary
    report = {
        "year_identifier": yse.year_identifier,
        "status": status.status_level,
        "success_indicator": success_indicator.success_indicator,
        "processes": [{
            "title": process.title,
            "description": process.description,
            "documentation": {
                "documents": [doc.serialize() for doc in process.supporting_documents.all()],
                "webpages": [web.serialize() for web in process.supporting_webpages.all()],
                "notes": [note.serialize() for note in process.supporting_notes.all()],
                "messages": [message.serialize() for message in process.supporting_messages.all()]
            }
        } for process in processes],

        "projects": [{
            "title": project.title,
            "description": project.description,
            "documentation": {
                "documents": [doc.serialize() for doc in project.supporting_documents.all()],
                "webpages": [web.serialize() for web in project.supporting_webpages.all()],
                "notes": [note.serialize() for note in project.supporting_notes.all()],
                "messages": [message.serialize() for message in project.supporting_messages.all()]
            }
        } for project in projects],

        "procedures": [{
            "title": procedure.title,
            "description": procedure.description,
            "documentation": {
                "documents": [doc.serialize() for doc in procedure.supporting_documents.all()],
                "webpages": [web.serialize() for web in procedure.supporting_webpages.all()],
                "notes": [note.serialize() for note in procedure.supporting_notes.all()],
                "messages": [message.serialize() for message in procedure.supporting_messages.all()]
            }
        } for procedure in procedures],

        "services": [{
            "title": service.title,
            "description": service.description,
            "documentation": {
                "documents": [doc.serialize() for doc in service.supporting_documents.all()],
                "webpages": [web.serialize() for web in service.supporting_webpages.all()],
                "notes": [note.serialize() for note in service.supporting_notes.all()],
                "messages": [message.serialize() for message in service.supporting_messages.all()]
            }
        } for service in services],

        "guidelines": [{
            "title": guideline.title,
            "description": guideline.description,
            "documentation": {
                "documents": [doc.serialize() for doc in guideline.supporting_documents.all()],
                "webpages": [web.serialize() for web in guideline.supporting_webpages.all()],
                "notes": [note.serialize() for note in guideline.supporting_notes.all()],
                "messages": [message.serialize() for message in guideline.supporting_messages.all()]
            }
        } for guideline in guidance],

        "persons": [person.name for person in persons]
    }

    return report


def format_dict_to_text(data):
    formatted_text = ""

    # This helper function processes nested structures recursively, applying appropriate formatting based on the type of value.
    def process_nested_structure(value, indent=1):
        inner_text = ""
        indent_space = "  " * indent  # Create indentation string based on the current recursion depth.

        if isinstance(value, list):  # Check if the value is a list
            if not value:  # If the list is empty, explicitly display "None" for clarity
                inner_text += f"{indent_space}None\n"
            else:
                for index, item in enumerate(value):  # Iterate over each item in the list
                    if isinstance(item, dict):  # Check if the item is a dictionary
                        # Number each dictionary for readability, starting a new line for each dictionary's content
                        inner_text += f"{indent_space}{index + 1}.\n"
                        # Recursively process each dictionary to handle nested structures
                        inner_text += process_nested_structure(item, indent + 1) + "\n"
                    else:
                        # If the item is not a dictionary, list it directly with its index
                        inner_text += f"{indent_space}{index + 1}. {item}\n"

        elif isinstance(value, dict):  # Check if the value is a dictionary
            if not value:  # If the dictionary is empty, explicitly display "None"
                inner_text += f"{indent_space}None\n"
            else:
                for k, v in value.items():  # Iterate over each key-value pair in the dictionary
                    # Display the key with a colon and process its value recursively
                    inner_text += f"{indent_space}{k.title()}:\n"
                    inner_text += process_nested_structure(v, indent + 1)

        else:
            # For simple data types that are neither dict nor list, return the value directly with indentation
            return f"{indent_space}{value}\n"

        return inner_text

    for key, value in data.items():  # Iterate over each key-value pair at the root level of the data
        formatted_text += f"{key.title()}:\n"  # Start each section with the key name in title case
        formatted_text += process_nested_structure(value)  # Recursively format the value

    return formatted_text


def format_dict_to_text_html(data):
    formatted_text = "<div style='font-family: monospace;'>"

    # This helper function processes nested structures recursively, applying HTML formatting.
    def process_nested_structure(value, indent=0):
        inner_html = ""
        indent_space = "&nbsp;" * (indent * 4)  # Use HTML non-breaking space for indentation

        if isinstance(value, list):
            if not value:
                inner_html += f"{indent_space}<i>None</i><br>"
            else:
                for index, item in enumerate(value):
                    if isinstance(item, dict):
                        inner_html += f"{indent_space}<b>{index + 1}.</b><br>"
                        inner_html += process_nested_structure(item, indent + 1)
                    else:
                        inner_html += f"{indent_space}<b>{index + 1}.</b> {item}<br>"

        elif isinstance(value, dict):
            if not value:
                inner_html += f"{indent_space}<i>None</i><br>"
            else:
                for k, v in value.items():
                    inner_html += f"{indent_space}<span style='color: blue;'><b>{k.title()}:</b></span><br>"
                    inner_html += process_nested_structure(v, indent + 1)

        else:
            return f"{indent_space}{value}<br>"

        return inner_html

    for key, value in data.items():
        formatted_text += f"<div><span style='color: green;'><b>{key.title()}:</b></span><br>"
        formatted_text += process_nested_structure(value)
        formatted_text += "</div>"

    formatted_text += "</div>"
    return formatted_text


