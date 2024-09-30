#
# EVIDENCE UPDATE QUERIES
#
from app.database.class_factory import implementation_classes
from app.database.graph_schema import *

def assign_implementation_to_year_success_indicator(year_success_identifier: str,
                                              implementation_type: str,
                                              implementation_title:str) -> bool:

    implementation = implementation_classes

    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        implementation_class = implementation[implementation_type]
        print(implementation_class)
        implementation_node = implementation_class.nodes.get(title=implementation_title)

        # Check if the relationship already exists
        if implementation_node.is_evidence_for.is_connected(year_success_evidence):
            raise Exception(f"Implementation {implementation_title} is already assigned to success indicator {year_success_identifier}")


        implementation_node.is_evidence_for.connect(year_success_evidence)
        print(f"Implementation {implementation_title} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False


def assign_status_to_yse(year_success_identifier: str, status: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        status_level = StatusLevel.nodes.get(status_level=status)

        # Disconnect any existing status level


        year_success_evidence.status_level.disconnect_all()
        # Connect the new status level
        year_success_evidence.status_level.connect(status_level)

        print(f"Status of success indicator {year_success_identifier} set to {status}")
        return True
    except Exception as e:
        print(e)
        return False



def assign_person_to_yse(year_success_identifier: str, person_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        person = Person.nodes.get(name=person_name)

        # Check if the relationship already exists
        if person.implements_yse.is_connected(year_success_evidence):
            raise Exception(f"Person {person_name} is already assigned to success indicator {year_success_identifier}")
            return False

        person.implements_yse.connect(year_success_evidence)
        print(f"Person {person_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False

def assign_department_to_yse(year_success_identifier: str, department_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        department = Department.nodes.get(name=department_name)

        # Check if the relationship already exists
        if department.implements_yse.is_connected(year_success_evidence):
            raise Exception(f"Department {department_name} is already assigned to success indicator {year_success_identifier}")
            return False

        department.implements_yse.connect(year_success_evidence)
        print(f"Department {department_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False

def assign_vendor_to_yse(year_success_identifier: str, vendor_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        vendor = Vendor.nodes.get(name=vendor_name)

        # Check if the relationship already exists
        if vendor.implements_yse.is_connected(year_success_evidence):
            raise Exception(f"Vendor {vendor_name} is already assigned to success indicator {year_success_identifier}")
            return False

        vendor.implements_yse.connect(year_success_evidence)
        print(f"Vendor {vendor_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False


def assign_college_to_yse(year_success_identifier: str, college_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        college = College.nodes.get(name=college_name)

        # Check if the relationship already exists
        if college.implements_yse.is_connected(year_success_evidence):
            raise Exception(f"College {college_name} is already assigned to success indicator {year_success_identifier}")
            return False

        college.implements_yse.connect(year_success_evidence)
        print(f"College {college_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False


def assign_note_to_yse(year_success_identifier: str, note_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        note = Note.nodes.get(name=note_name)

        # Check if the relationship already exists
        if year_success_evidence.notes.is_connected(note):
            raise Exception(f"YSE {year_success_identifier} is already has note {note_name}")

        year_success_evidence.notes.connect(note)
        print(f"Note {note_name} assigned to success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False