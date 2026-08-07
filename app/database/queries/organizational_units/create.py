#
# ORGANIZATIONAL UNITS CREATE QUERIES
#
from app.database.graph_schema import *
from app.endpoints.data_api.errors.custom_exceptions import CrudError, ValidationError

def add_department(name: str, location: str) -> bool:
    """
    Adds a department node to the graph
    :param name: Name of the department
    :param location: Location of the department
    :return: True if the department node is added successfully, False otherwise
    """
    try:
        new_department = Department(
            name=name,
            location=location
        )
        new_department.save()
        print("Added department")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add department: {e}")

def add_vendor(name: str, location: str) -> bool:
    """
    Adds a vendor node to the graph
    :param name: Name of the vendor
    :param location: Location of the vendor
    :return: True if the vendor node is added successfully, False otherwise
    """
    try:
        new_vendor = Vendor(
            name=name,
            location=location
        )
        new_vendor.save()
        print("Added vendor")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add vendor: {e}")

def create_vendor(name: str, location: str = None) -> Vendor:
    """
    Create a Vendor node and return it. The sanctioned creation path for the
    /vendors CRUD endpoint: validates a non-blank name, guards the unique-name
    index with a friendly ValidationError, and returns the node so the caller can
    serialize it. (add_vendor above is the older bool-returning helper.)

    Raises ValidationError on a blank/duplicate name, CrudError on save failure.
    """
    if not name or not name.strip():
        raise ValidationError("name is required")
    name = name.strip()

    if Vendor.nodes.filter(name=name):
        raise ValidationError(f"Vendor with name {name!r} already exists")

    try:
        vendor = Vendor(name=name, location=location)
        vendor.save()
        return vendor
    except Exception as e:
        raise CrudError(f"Failed to create Vendor {name!r}: {e}")

_LOCAL_ORG_UNIT_TYPES = None  # populated lazily below (Department/College classes)


def _local_unit_class(unit_type: str):
    global _LOCAL_ORG_UNIT_TYPES
    if _LOCAL_ORG_UNIT_TYPES is None:
        _LOCAL_ORG_UNIT_TYPES = {"department": Department, "college": College}
    unit_cls = _LOCAL_ORG_UNIT_TYPES.get((unit_type or "").strip().lower())
    if unit_cls is None:
        raise ValidationError(
            f"Unknown unit_type {unit_type!r}. Valid types: ['college', 'department']"
        )
    return unit_cls


def create_org_unit(unit_type: str, name: str, location: str = None,
                    campus_abbreviation: str = None):
    """
    Create a local org unit (Department or College) and return it. The sanctioned
    creation path for the /organizational-units POST endpoint: validates a
    non-blank name, guards the unique-name index with a friendly ValidationError,
    and — when `campus_abbreviation` is given — connects operates_under_campus so
    the unit is visible to campus-scoped reads (an unlinked unit is an orphan most
    reports will not see).

    Raises ValidationError on a bad type or blank/duplicate name, NotFoundError
    on an unknown campus, CrudError on save failure.
    """
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

    unit_cls = _local_unit_class(unit_type)
    if not name or not name.strip():
        raise ValidationError("name is required")
    name = name.strip()

    if unit_cls.nodes.filter(name=name):
        raise ValidationError(f"{unit_cls.__name__} with name {name!r} already exists")

    campus = None
    if campus_abbreviation:
        try:
            campus = Campus.nodes.get(abbreviation=campus_abbreviation)
        except Campus.DoesNotExist:
            raise NotFoundError(f"Campus {campus_abbreviation!r} not found")

    try:
        unit = unit_cls(name=name, location=location)
        unit.save()
        if campus is not None:
            unit.operates_under_campus.connect(campus)
        return unit
    except Exception as e:
        raise CrudError(f"Failed to create {unit_cls.__name__} {name!r}: {e}")


def add_college(name: str, location: str) -> bool:
    """
    Adds a college node to the graph
    :param name: Name of the college
    :param location: Location of the college
    :return: True if the college node is added successfully, False otherwise
    """
    try:
        new_college = College(
            name=name,
            location=location
        )
        new_college.save()
        print("Added college")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add college: {e}")

def add_campus(name: str) -> bool:
    """
    Adds a campus node to the graph
    :param name: Name of the campus
    :return: True if the campus node is added successfully, False otherwise
    """
    try:
        new_campus = Campus(
            name=name
        )
        new_campus.save()
        print("Added campus")
        return True
    except Exception as e:
        raise CrudError(f"Failed to add campus: {e}")
