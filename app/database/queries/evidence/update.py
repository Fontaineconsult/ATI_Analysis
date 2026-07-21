#
# EVIDENCE UPDATE QUERIES
#
from datetime import datetime

from app.database.class_factory import implementation_classes
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError, ValidationError

def assign_implementation_to_year_success_indicator(year_success_identifier: str,
                                                    implementation_type: str,
                                                    implementation_title: str) -> bool:

    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        implementation_class = implementation_classes[implementation_type]
        implementation_node = implementation_class.nodes.get(title=implementation_title)

        # Retired implementations are closed to new evidence assignment (their
        # existing historical links are untouched).
        if getattr(implementation_node, 'retired', False):
            raise ValidationError(
                f"Implementation {implementation_title} is retired and cannot be assigned to new evidence"
            )

        if implementation_node.is_evidence_for.is_connected(year_success_evidence):
            raise CrudError(f"Implementation {implementation_title} is already assigned to success indicator {year_success_identifier}")

        implementation_node.is_evidence_for.connect(year_success_evidence)
        print(f"Implementation {implementation_title} assigned to success indicator {year_success_identifier}")
        return True
    except (ValidationError, CrudError):
        raise
    except Exception as e:
        raise CrudError(f"Error assigning implementation {implementation_title} to success indicator {year_success_identifier}: {e}")


def update_status_level_node(unique_id, data):
    """
    Update an existing StatusLevel node's description fields.
    """
    try:
        node = StatusLevel.nodes.get(unique_id=unique_id)
    except StatusLevel.DoesNotExist:
        raise NotFoundError(f"StatusLevel with unique_id '{unique_id}' not found.")
    except Exception as e:
        raise CrudError(f"Failed to retrieve StatusLevel: {e}")

    try:
        if 'description_of_procedures' in data:
            node.description_of_procedures = data['description_of_procedures']
        if 'description_of_documentation' in data:
            node.description_of_documentation = data['description_of_documentation']
        if 'description_of_documentation_evidence' in data:
            node.description_of_documentation_evidence = data['description_of_documentation_evidence']
        if 'description_of_resources' in data:
            node.description_of_resources = data['description_of_resources']
        if 'ati_report_evidence_column' in data:
            node.ati_report_evidence_column = data['ati_report_evidence_column']
        node.save()
        return node.serialize()
    except Exception as e:
        raise CrudError(f"Failed to update StatusLevel: {e}")


def assign_status_to_yse(year_success_identifier: str, status: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        status_level = StatusLevel.nodes.get(status_level=status)

        year_success_evidence.status_level.disconnect_all()
        year_success_evidence.status_level.connect(status_level)

        print(f"Status of success indicator {year_success_identifier} set to {status}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning status {status} to success indicator {year_success_identifier}: {e}")


def assign_person_to_yse(year_success_identifier: str, person_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        person = Person.nodes.get(name=person_name)

        if person.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Person {person_name} is already assigned to success indicator {year_success_identifier}")

        person.implements_yse.connect(year_success_evidence)
        print(f"Person {person_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning person {person_name} to success indicator {year_success_identifier}: {e}")


def assign_department_to_yse(year_success_identifier: str, department_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        department = Department.nodes.get(name=department_name)

        if department.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Department {department_name} is already assigned to success indicator {year_success_identifier}")

        department.implements_yse.connect(year_success_evidence)
        print(f"Department {department_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning department {department_name} to success indicator {year_success_identifier}: {e}")


def assign_vendor_to_yse(year_success_identifier: str, vendor_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        vendor = Vendor.nodes.get(name=vendor_name)

        if vendor.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Vendor {vendor_name} is already assigned to success indicator {year_success_identifier}")

        vendor.implements_yse.connect(year_success_evidence)
        print(f"Vendor {vendor_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning vendor {vendor_name} to success indicator {year_success_identifier}: {e}")


def assign_college_to_yse(year_success_identifier: str, college_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        college = College.nodes.get(name=college_name)

        if college.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"College {college_name} is already assigned to success indicator {year_success_identifier}")

        college.implements_yse.connect(year_success_evidence)
        print(f"College {college_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning college {college_name} to success indicator {year_success_identifier}: {e}")


def assign_note_to_yse(year_success_identifier: str, note_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        note = Note.nodes.get(name=note_name)

        if year_success_evidence.notes.is_connected(note):
            raise CrudError(f"YSE {year_success_identifier} already has note {note_name}")

        year_success_evidence.notes.connect(note)
        print(f"Note {note_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning note {note_name} to success indicator {year_success_identifier}: {e}")


def assign_metric_to_yse(year_success_identifier: str, metric_composite_key: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        metric = Metric.nodes.get(composite_key=metric_composite_key)

        if year_success_evidence.metrics.is_connected(metric):
            raise CrudError(f"YSE {year_success_identifier} already has metric {metric_composite_key}")

        year_success_evidence.metrics.connect(metric)
        print(f"Metric {metric_composite_key} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Error assigning metric {metric_composite_key} to success indicator {year_success_identifier}: {e}")


def assign_approver_to_yse(year_success_identifier: str, employee_id: str) -> bool:
    try:
        # Attempt to get the YearSuccessEvidence node by year_identifier
        try:
            year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        # Attempt to get the Person node by employee_id
        try:
            person = Person.nodes.get(employee_id=employee_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id '{employee_id}' not found.")

        # Check if the person is already assigned as an approver
        if year_success_evidence.administrative_review_completed_by.is_connected(person):
            raise CrudError(f"Approver {employee_id} is already assigned to success indicator {year_success_identifier}")

        # Assign the approver
        year_success_evidence.administrative_review_completed_by.connect(person)
        year_success_evidence.administrative_review_complete = True
        year_success_evidence.administrative_review_completed_date = datetime.now().date()
        year_success_evidence.save()

        print(f"Approver {employee_id} assigned to success indicator {year_success_identifier}")
        return True

    except NotFoundError as e:
        # Reraise NotFoundError to be caught by the calling function for proper error handling
        raise e

    except Exception as e:
        # Catch any other exceptions and raise them as a CrudError
        raise CrudError(f"Error assigning approver {employee_id} to success indicator {year_success_identifier}: {e}")


def update_admin_reviewer_description(year_success_identifier: str, description: str) -> bool:
    """Update the admin_review_description field for a YearSuccessEvidence node"""
    try:
        try:
            year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        year_success_evidence.admin_review_description = description
        year_success_evidence.save()

        print(f"Admin reviewer description updated for {year_success_identifier}")
        return True

    except NotFoundError as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error updating admin reviewer description for {year_success_identifier}: {e}")


def add_admin_reviewer_note(year_success_identifier: str, note_content: str, created_by_employee_id: str) -> dict:
    """
    Add a new admin reviewer note to a YearSuccessEvidence node.
    Creates a Note node and connects it via the admin_reviewer_note relationship.

    :param year_success_identifier: The year_identifier of the YSE
    :param note_content: The content of the note
    :param created_by_employee_id: The employee_id of the person creating the note
    :return: Dictionary with the created note data
    """
    try:
        # Get the YSE node
        try:
            yse = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        except YearSuccessEvidence.DoesNotExist:
            raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

        # Get the person creating the note
        try:
            person = Person.nodes.get(employee_id=created_by_employee_id)
        except Person.DoesNotExist:
            raise NotFoundError(f"Person with employee_id '{created_by_employee_id}' not found.")

        # Create a unique name for the note
        note_name = f"Admin Review Note - {year_success_identifier} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

        # Create the note
        note = Note(
            name=note_name,
            content=note_content,
            date_created=datetime.now().date(),
            depreciated=False,
            include_in_report=True
        )
        note.save()

        # Connect the note to the person who created it
        note.created_by.connect(person)

        # Connect the note to the YSE via admin_reviewer_note relationship
        yse.admin_reviewer_note.connect(note)

        print(f"Admin reviewer note added to {year_success_identifier} by {person.name}")

        return {
            "unique_id": note.unique_id,
            "name": note.name,
            "content": note.content,
            "date_created": note.date_created.isoformat() if note.date_created else None,
            "created_by": {
                "name": person.name,
                "employee_id": person.employee_id,
                "email": person.email
            }
        }

    except NotFoundError as e:
        raise e
    except Exception as e:
        raise CrudError(f"Error adding admin reviewer note for {year_success_identifier}: {e}")

