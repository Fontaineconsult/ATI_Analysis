"""Person identity and involvement.

Email is the identity key: unique, stored trimmed and lowercased. ati_involvement is
member, contributor, or contact, defaulting to contact.

The integration tests create throwaway people whose names start with TEST_PREFIX and
whose emails end in @example.invalid, and the cleanup fixture deletes only nodes with
that prefix, so nothing real in the shared graph is touched.
"""
import pytest

from app.database.identifiers import normalize_email

TEST_PREFIX = "zz-test-identity-"


# --------------------------------------------------------------------------- #
# Pure helpers                                                                 #
# --------------------------------------------------------------------------- #
@pytest.mark.unit
@pytest.mark.parametrize("raw, expected", [
    ("  Dan.LeGate@CSUEastBay.edu ", "dan.legate@csueastbay.edu"),
    ("carlsoni@sonoma.edu", "carlsoni@sonoma.edu"),
    (None, None),
    ("   ", None),
])
def test_normalize_email(raw, expected):
    assert normalize_email(raw) == expected


@pytest.mark.unit
def test_normalize_email_rejects_a_title_in_the_email_field():
    with pytest.raises(ValueError):
        normalize_email("Lead Web & Mobile Developer")


@pytest.mark.unit
def test_validate_involvement_defaults_to_contact_and_rejects_unknown_values():
    from app.database.queries.individuals.create import validate_involvement
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError
    assert validate_involvement(None) == "contact"
    assert validate_involvement("contributor") == "contributor"
    with pytest.raises(ValidationError):
        validate_involvement("committee")


# --------------------------------------------------------------------------- #
# Create, update and lookup against the graph                                  #
# --------------------------------------------------------------------------- #
@pytest.fixture
def cleanup_test_people(neo4j_connection):
    from neomodel import db
    query = "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p"
    db.cypher_query(query, {"prefix": TEST_PREFIX})
    yield
    db.cypher_query(query, {"prefix": TEST_PREFIX})


def _person(suffix, email, **extra):
    data = {
        "name": TEST_PREFIX + suffix,
        "employee_id": TEST_PREFIX + suffix,
        "email": email,
        "title": "Test person",
    }
    data.update(extra)
    return data


@pytest.mark.integration
def test_add_person_stores_email_normalized_and_sets_involvement(cleanup_test_people):
    from app.database.queries.individuals.create import add_person
    person = add_person(_person("a", "  ZZ-A@Example.Invalid ", ati_involvement="member"))
    assert person.email == "zz-a@example.invalid"
    assert person.ati_involvement == "member"
    assert person.active is True


@pytest.mark.integration
def test_add_person_without_involvement_creates_a_contact(cleanup_test_people):
    from app.database.queries.individuals.create import add_person
    assert add_person(_person("b", "zz-b@example.invalid")).ati_involvement == "contact"


@pytest.mark.integration
def test_add_person_refuses_an_email_already_held_in_another_case(cleanup_test_people):
    from app.database.queries.individuals.create import add_person
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError
    add_person(_person("c", "zz-c@example.invalid"))
    with pytest.raises(ValidationError, match="already belongs"):
        add_person(_person("d", "ZZ-C@example.invalid"))


@pytest.mark.integration
def test_update_refuses_another_persons_email_but_allows_its_own(cleanup_test_people):
    from app.database.queries.individuals.create import add_person
    from app.database.queries.individuals.update import update_person_by_employee_id
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError
    add_person(_person("e", "zz-e@example.invalid"))
    add_person(_person("f", "zz-f@example.invalid"))
    updated = update_person_by_employee_id({"employee_id": TEST_PREFIX + "f", "email": "ZZ-F@example.invalid"})
    assert updated.email == "zz-f@example.invalid"
    with pytest.raises(ValidationError):
        update_person_by_employee_id({"employee_id": TEST_PREFIX + "f", "email": "zz-e@example.invalid"})


@pytest.mark.integration
def test_update_changes_involvement_and_rejects_an_unknown_value(cleanup_test_people):
    from app.database.queries.individuals.create import add_person
    from app.database.queries.individuals.update import update_person_by_employee_id
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError
    add_person(_person("g", "zz-g@example.invalid"))
    eid = TEST_PREFIX + "g"
    assert update_person_by_employee_id({"employee_id": eid, "ati_involvement": "contributor"}).ati_involvement == "contributor"
    with pytest.raises(ValidationError):
        update_person_by_employee_id({"employee_id": eid, "ati_involvement": "committee"})


@pytest.mark.integration
def test_email_lookup_ignores_case(cleanup_test_people):
    from app.database.queries.individuals.create import add_person
    from app.database.queries.individuals.read import get_person_by_email
    add_person(_person("h", "zz-h@example.invalid"))
    assert get_person_by_email(" ZZ-H@Example.invalid ").name == TEST_PREFIX + "h"


@pytest.mark.integration
def test_the_graph_enforces_email_uniqueness(cleanup_test_people):
    """The constraint backs the application check: a write that skips add_person
    still cannot give two people one email."""
    from neomodel import db
    from app.database.queries.individuals.create import add_person
    add_person(_person("i", "zz-i@example.invalid"))
    with pytest.raises(Exception, match="(?i)constraint|already exists"):
        db.cypher_query("CREATE (:Person {name: $n, email: 'zz-i@example.invalid'})", {"n": TEST_PREFIX + "j"})
