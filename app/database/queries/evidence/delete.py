#
# EVIDENCE DELETE QUERIES
#
from app.database.class_factory import implementation_classes
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, CrudError

def unassign_person_from_yse(year_success_identifier: str, person_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

    try:
        person = Person.nodes.get(name=person_name)
    except Person.DoesNotExist:
        raise NotFoundError(f"Person with name '{person_name}' not found.")

    try:
        if not person.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Person {person_name} is not assigned to success indicator {year_success_identifier}")

        person.implements_yse.disconnect(year_success_evidence)
        print(f"Person {person_name} unassigned from success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign person: {e}")


def unassign_department_from_yse(year_success_identifier: str, department_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

    try:
        department = Department.nodes.get(name=department_name)
    except Department.DoesNotExist:
        raise NotFoundError(f"Department with name '{department_name}' not found.")

    try:
        if not department.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Department {department_name} is not assigned to success indicator {year_success_identifier}")

        department.implements_yse.disconnect(year_success_evidence)
        print(f"Department {department_name} unassigned from success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign department: {e}")


def unassign_vendor_from_yse(year_success_identifier: str, vendor_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

    try:
        vendor = Vendor.nodes.get(name=vendor_name)
    except Vendor.DoesNotExist:
        raise NotFoundError(f"Vendor with name '{vendor_name}' not found.")

    try:
        if not vendor.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"Vendor {vendor_name} is not assigned to success indicator {year_success_identifier}")

        vendor.implements_yse.disconnect(year_success_evidence)
        print(f"Vendor {vendor_name} unassigned from success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign vendor: {e}")


def unassign_college_from_yse(year_success_identifier: str, college_name: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

    try:
        college = College.nodes.get(name=college_name)
    except College.DoesNotExist:
        raise NotFoundError(f"College with name '{college_name}' not found.")

    try:
        if not college.implements_yse.is_connected(year_success_evidence):
            raise CrudError(f"College {college_name} is not assigned to success indicator {year_success_identifier}")

        college.implements_yse.disconnect(year_success_evidence)
        print(f"College {college_name} unassigned from success indicator {year_success_identifier}")
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign college: {e}")


def unassign_implementation_from_yse(year_success_identifier: str, implementation_type: str, implementation_title: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

    try:
        implementation_class = implementation_classes[implementation_type]
        implementation_node = implementation_class.nodes.get(title=implementation_title)
    except KeyError:
        raise NotFoundError(f"Invalid implementation type '{implementation_type}'")
    except Exception as e:
        raise NotFoundError(f"Implementation '{implementation_title}' not found for type '{implementation_type}'")

    try:
        if not implementation_node.is_evidence_for.is_connected(year_success_evidence):
            raise CrudError(f"Implementation '{implementation_title}' is not assigned to success indicator '{year_success_identifier}'")

        implementation_node.is_evidence_for.disconnect(year_success_evidence)
        print(f"Implementation '{implementation_title}' unassigned from success indicator '{year_success_identifier}'")
        return True
    except Exception as e:
        raise CrudError(f"Failed to unassign implementation: {e}")


def delete_year_success_evidence(year_success_identifier: str) -> bool:
    try:
        year_success_evidence = YearSuccessEvidence.nodes.get(year_identifier=year_success_identifier)
    except YearSuccessEvidence.DoesNotExist:
        raise NotFoundError(f"YearSuccessEvidence with identifier '{year_success_identifier}' not found.")

    try:
        year_success_evidence.delete()
        print(f"Year Success Evidence '{year_success_identifier}' deleted successfully")
        return True
    except Exception as e:
        raise CrudError(f"Failed to delete Year Success Evidence: {e}")

