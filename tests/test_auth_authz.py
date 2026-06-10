"""Layer-1 unit tests for config-driven authorization (no Neo4j, no Flask)."""
import pytest

from app.auth.authz import is_admin, is_allowed, parse_admins
from app.auth.identity import Identity

pytestmark = pytest.mark.unit


def _identity(username="jdoe", employee_id="913678186"):
    return Identity(username=username, display_name="Jane Doe",
                    employee_id=employee_id, provider="local")


def test_parse_admins_empty_and_none():
    assert parse_admins(None) == frozenset()
    assert parse_admins("") == frozenset()


def test_parse_admins_splits_strips_casefolds():
    assert parse_admins(" JDoe , 913678186 ,,") == frozenset({"jdoe", "913678186"})


def test_is_admin_by_username_case_insensitive():
    assert is_admin(_identity(username="JDoe"), parse_admins("jdoe"))


def test_is_admin_by_employee_id():
    assert is_admin(_identity(), parse_admins("913678186"))


def test_is_admin_false_when_no_match():
    assert not is_admin(_identity(), parse_admins("someoneelse,111"))
    assert not is_admin(_identity(), frozenset())


def test_is_admin_no_employee_id_only_matches_username():
    ident = _identity(employee_id=None)
    assert not is_admin(ident, parse_admins("913678186"))
    assert is_admin(ident, parse_admins("jdoe"))


def test_is_allowed_empty_allowlist_allows_everyone():
    assert is_allowed(_identity(), frozenset())


def test_is_allowed_nonempty_allowlist():
    allowed = parse_admins("jdoe")
    assert is_allowed(_identity(), allowed)
    assert not is_allowed(_identity(username="other", employee_id="222"), allowed)
