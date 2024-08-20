#
# EVIDENCE DELETE QUERIES
#
from app.database.graph_schema import *


def unassign_person_from_yse(year_success_identifier: str, person_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        person = Person.nodes.get(name=person_name)

        # Check if the relationship exists
        if not person.implements_yse.is_connected(year_success_evidence):
            raise Exception(f"Person {person_name} is not assigned to success indicator {year_success_identifier}")

        person.implements_yse.disconnect(year_success_evidence)
        print(f"Person {person_name} unassigned from success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False


def unassign_department_from_yse(year_success_identifier: str, department_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        department = Department.nodes.get(name=department_name)

        # Check if the relationship exists
        if not department.implements_yse.is_connected(year_success_evidence):
            raise Exception(f"Department {department_name} is not assigned to success indicator {year_success_identifier}")

        department.implements_yse.disconnect(year_success_evidence)
        print(f"Department {department_name} unassigned from success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False

def unassign_vendor_from_yse(year_success_identifier: str, vendor_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        vendor = Vendor.nodes.get(name=vendor_name)

        # Check if the relationship exists
        if not vendor.implements_yse.is_connected(year_success_evidence):
            raise Exception(f"Vendor {vendor_name} is not assigned to success indicator {year_success_identifier}")

        vendor.implements_yse.disconnect(year_success_evidence)
        print(f"Vendor {vendor_name} unassigned from success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False


def unassign_college_from_yse(year_success_identifier: str, college_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
        college = College.nodes.get(name=college_name)

        # Check if the relationship exists
        if not college.implements_yse.is_connected(year_success_evidence):
            raise Exception(f"College {college_name} is not assigned to success indicator {year_success_identifier}")

        college.implements_yse.disconnect(year_success_evidence)
        print(f"College {college_name} unassigned from success indicator {year_success_identifier}")
        return True
    except Exception as e:
        print(e)
        return False