"""
Org-unit `employs` edges and local-org CRUD — the generic assign/unassign
queries functions, the /organizational-units PUT actions
(assign_employee / unassign_employee), and the POST / local-overview GET /
DELETE lifecycle behind Settings → Organizations.

Isolation: departments, colleges, people, and the campus created here carry the
sentinel year prefix (9999-9999...) in their unique names, mirroring the
convention for non-year-scoped nodes (cleanup filters by that prefix and can
never match production data). No real org units or people are touched.
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"

DEPARTMENT_NAME = f"{SENTINEL} Test Employs Department"
COLLEGE_NAME = f"{SENTINEL} Test Employs College"
PERSON_NAME = f"{SENTINEL} Test Employs Person"
PERSON_EMPLOYEE_ID = f"{SENTINEL}-emp-org-units"
CAMPUS_NAME = f"{SENTINEL} Test Campus"
CAMPUS_ABBREV = f"{SENTINEL}-tc"
CREATED_DEPARTMENT = f"{SENTINEL} Test Created Department"
CREATED_COLLEGE = f"{SENTINEL} Test Created College"

pytestmark = [pytest.mark.integration, pytest.mark.api]

API = "/ati/data-api/v1/organizational-units"


@pytest.fixture
def cleanup_org_units(neo4j_connection):
    """After-test cleanup for sentinel-named org units, people, and campus."""
    yield
    db.cypher_query(
        "MATCH (d:Department) WHERE d.name STARTS WITH $prefix DETACH DELETE d",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (c:College) WHERE c.name STARTS WITH $prefix DETACH DELETE c",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (c:Campus) WHERE c.name STARTS WITH $prefix DETACH DELETE c",
        {"prefix": SENTINEL},
    )


@pytest.fixture
def employs_fixture(cleanup_org_units):
    """A sentinel person + department + college to wire employs edges between."""
    from app.database.graph_schema import Department, College, Person

    person = Person(name=PERSON_NAME, employee_id=PERSON_EMPLOYEE_ID).save()
    department = Department(name=DEPARTMENT_NAME).save()
    college = College(name=COLLEGE_NAME).save()
    return person, department, college


def _edge_exists(unit_label: str, unit_name: str) -> bool:
    rows, _ = db.cypher_query(
        f"MATCH (u:{unit_label} {{name:$n}})-[:employs]->(p:Person {{employee_id:$e}}) "
        "RETURN count(*)",
        {"n": unit_name, "e": PERSON_EMPLOYEE_ID},
    )
    return rows[0][0] > 0


# --- Layer 3/4: queries functions ---------------------------------------------

def test_assign_unassign_round_trip_department_and_college(employs_fixture):
    from app.database.queries.organizational_units.update import (
        assign_employee_to_org_unit,
        unassign_employee_from_org_unit,
    )

    person, _, _ = employs_fixture

    for unit_type, label, name in (
        ("department", "Department", DEPARTMENT_NAME),
        ("college", "College", COLLEGE_NAME),
    ):
        assert assign_employee_to_org_unit(unit_type, name, person.unique_id) is True
        assert _edge_exists(label, name)
        # Idempotent re-assign leaves exactly one edge.
        assert assign_employee_to_org_unit(unit_type, name, person.unique_id) is True
        rows, _ = db.cypher_query(
            f"MATCH (u:{label} {{name:$n}})-[r:employs]->(:Person {{employee_id:$e}}) "
            "RETURN count(r)",
            {"n": name, "e": PERSON_EMPLOYEE_ID},
        )
        assert rows[0][0] == 1

        assert unassign_employee_from_org_unit(unit_type, name, person.unique_id) is True
        assert not _edge_exists(label, name)
        # Idempotent re-unassign is a no-op, not an error.
        assert unassign_employee_from_org_unit(unit_type, name, person.unique_id) is True


def test_assign_validation_and_not_found(employs_fixture):
    from app.database.queries.organizational_units.update import assign_employee_to_org_unit
    from app.endpoints.data_api.errors.custom_exceptions import NotFoundError, ValidationError

    person, _, _ = employs_fixture

    with pytest.raises(ValidationError):
        assign_employee_to_org_unit("campus", DEPARTMENT_NAME, person.unique_id)

    with pytest.raises(NotFoundError):
        assign_employee_to_org_unit("department", f"{SENTINEL} No Such Department", person.unique_id)

    with pytest.raises(NotFoundError):
        assign_employee_to_org_unit("department", DEPARTMENT_NAME, "no-such-unique-id")


def test_person_detail_projects_employers_with_types(employs_fixture):
    from app.database.queries.individuals.read import get_person_implementation_details
    from app.database.queries.organizational_units.update import assign_employee_to_org_unit

    person, _, _ = employs_fixture
    assign_employee_to_org_unit("department", DEPARTMENT_NAME, person.unique_id)
    assign_employee_to_org_unit("college", COLLEGE_NAME, person.unique_id)

    detail = get_person_implementation_details(PERSON_EMPLOYEE_ID)
    employers = {(e["name"], e["type"]) for e in detail["employers"]}
    assert (DEPARTMENT_NAME, "Department") in employers
    assert (COLLEGE_NAME, "College") in employers


# --- Layer 5: endpoint --------------------------------------------------------

def test_put_assign_and_unassign_employee(flask_client, employs_fixture):
    person, _, _ = employs_fixture

    assigned = flask_client.put(API, json={
        "action": "assign_employee",
        "unit_type": "department",
        "name": DEPARTMENT_NAME,
        "person_unique_id": person.unique_id,
    })
    assert assigned.status_code == 200
    assert _edge_exists("Department", DEPARTMENT_NAME)

    unassigned = flask_client.put(API, json={
        "action": "unassign_employee",
        "unit_type": "department",
        "name": DEPARTMENT_NAME,
        "person_unique_id": person.unique_id,
    })
    assert unassigned.status_code == 200
    assert not _edge_exists("Department", DEPARTMENT_NAME)


def test_put_error_mapping(flask_client, employs_fixture):
    person, _, _ = employs_fixture

    missing_fields = flask_client.put(API, json={"action": "assign_employee"})
    assert missing_fields.status_code == 400

    unknown_action = flask_client.put(API, json={"action": "promote_employee"})
    assert unknown_action.status_code == 400

    bad_type = flask_client.put(API, json={
        "action": "assign_employee",
        "unit_type": "campus",
        "name": DEPARTMENT_NAME,
        "person_unique_id": person.unique_id,
    })
    assert bad_type.status_code == 400

    missing_unit = flask_client.put(API, json={
        "action": "assign_employee",
        "unit_type": "department",
        "name": f"{SENTINEL} No Such Department",
        "person_unique_id": person.unique_id,
    })
    assert missing_unit.status_code == 404


# --- Layer 3–5: local-org CRUD (Settings → Organizations) ----------------------

@pytest.fixture
def sentinel_campus(cleanup_org_units):
    from app.database.graph_schema import Campus

    return Campus(name=CAMPUS_NAME, abbreviation=CAMPUS_ABBREV).save()


def test_create_overview_delete_lifecycle(flask_client, sentinel_campus):
    # Create a department and a college linked to the sentinel campus.
    for unit_type, name in (("department", CREATED_DEPARTMENT), ("college", CREATED_COLLEGE)):
        created = flask_client.post(API, json={
            "unit_type": unit_type,
            "name": name,
            "location": "Test Hall",
            "campus": CAMPUS_ABBREV,
        })
        assert created.status_code == 201, created.get_json()

    # operates_under_campus landed.
    rows, _ = db.cypher_query(
        "MATCH (u)-[:operates_under_campus]->(c:Campus {abbreviation: $a}) "
        "WHERE u:Department OR u:College RETURN count(u)",
        {"a": CAMPUS_ABBREV},
    )
    assert rows[0][0] == 2

    # Overview lists both, typed, with zero employees.
    overview = flask_client.get(f"{API}?type=local-overview&campus={CAMPUS_ABBREV}")
    assert overview.status_code == 200
    units = {(u["name"], u["type"], u["employee_count"]) for u in overview.get_json()["data"]}
    assert (CREATED_DEPARTMENT, "Department", 0) in units
    assert (CREATED_COLLEGE, "College", 0) in units

    # Duplicate name is a 400.
    duplicate = flask_client.post(API, json={
        "unit_type": "department", "name": CREATED_DEPARTMENT,
    })
    assert duplicate.status_code == 400

    # Delete both; the overview empties.
    for unit_type, name in (("department", CREATED_DEPARTMENT), ("college", CREATED_COLLEGE)):
        deleted = flask_client.delete(API, json={"unit_type": unit_type, "name": name})
        assert deleted.status_code == 200
    overview = flask_client.get(f"{API}?type=local-overview&campus={CAMPUS_ABBREV}")
    assert overview.get_json()["data"] == []


def test_create_and_delete_error_mapping(flask_client, sentinel_campus):
    assert flask_client.post(API, json={"unit_type": "department"}).status_code == 400
    assert flask_client.post(API, json={
        "unit_type": "campus", "name": f"{SENTINEL} Nope",
    }).status_code == 400
    assert flask_client.post(API, json={
        "unit_type": "department", "name": f"{SENTINEL} Nope", "campus": "no-such-campus",
    }).status_code == 404

    assert flask_client.delete(API, json={"unit_type": "department"}).status_code == 400
    assert flask_client.delete(API, json={
        "unit_type": "department", "name": f"{SENTINEL} No Such Unit",
    }).status_code == 404

    overview_missing_campus = flask_client.get(f"{API}?type=local-overview")
    assert overview_missing_campus.status_code == 400
    overview_bad_campus = flask_client.get(f"{API}?type=local-overview&campus=no-such-campus")
    assert overview_bad_campus.status_code == 404


def test_overview_counts_employees(flask_client, employs_fixture, sentinel_campus):
    from app.database.queries.organizational_units.update import (
        assign_department_to_campus,
        assign_employee_to_org_unit,
    )

    person, department, _ = employs_fixture
    assign_department_to_campus(DEPARTMENT_NAME, CAMPUS_NAME)
    assign_employee_to_org_unit("department", DEPARTMENT_NAME, person.unique_id)

    overview = flask_client.get(f"{API}?type=local-overview&campus={CAMPUS_ABBREV}")
    units = {u["name"]: u["employee_count"] for u in overview.get_json()["data"]}
    assert units[DEPARTMENT_NAME] == 1
