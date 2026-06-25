"""Integration test for the email->Person link lookup used by auth.

Read-only and data-safe: it only asserts the not-found path against a
deliberately-bogus email, so it creates/modifies nothing in the shared graph.
"""
import pytest

from app.endpoints.data_api.errors.custom_exceptions import NotFoundError

pytestmark = pytest.mark.integration


def test_get_person_by_email_missing_raises(neo4j_connection):
    from app.database.queries.individuals.read import get_person_by_email
    with pytest.raises(NotFoundError):
        get_person_by_email("no-such-person-9999@example.invalid")
