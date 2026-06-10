"""Layer-1 unit tests for the SQLite auth store (no Neo4j, no Flask)."""
import sqlite3

import pytest

from app.auth import store

pytestmark = pytest.mark.unit


def test_create_and_verify_user(auth_db):
    store.create_user("jdoe", "hunter22", "Jane Doe", employee_id="913678186")
    row = store.verify_user("jdoe", "hunter22")
    assert row is not None
    assert row["username"] == "jdoe"
    assert row["display_name"] == "Jane Doe"
    assert row["employee_id"] == "913678186"
    assert row["active"] == 1
    # Hash, never the plaintext, is stored
    assert "hunter22" not in row["password_hash"]


def test_verify_wrong_password_returns_none(auth_db):
    store.create_user("jdoe", "hunter22", "Jane Doe")
    assert store.verify_user("jdoe", "wrong") is None


def test_verify_unknown_user_returns_none(auth_db):
    assert store.verify_user("ghost", "whatever") is None


def test_inactive_user_cannot_verify(auth_db):
    store.create_user("jdoe", "hunter22", "Jane Doe")
    store.set_active("jdoe", False)
    assert store.verify_user("jdoe", "hunter22") is None
    store.set_active("jdoe", True)
    assert store.verify_user("jdoe", "hunter22") is not None


def test_set_password(auth_db):
    store.create_user("jdoe", "oldpass", "Jane Doe")
    store.set_password("jdoe", "newpass")
    assert store.verify_user("jdoe", "oldpass") is None
    assert store.verify_user("jdoe", "newpass") is not None


def test_set_password_unknown_user_raises(auth_db):
    with pytest.raises(LookupError):
        store.set_password("ghost", "x")


def test_duplicate_username_rejected(auth_db):
    store.create_user("jdoe", "pw1", "Jane Doe")
    with pytest.raises(sqlite3.IntegrityError):
        store.create_user("jdoe", "pw2", "Imposter")
    # COLLATE NOCASE: case-variant duplicates also rejected
    with pytest.raises(sqlite3.IntegrityError):
        store.create_user("JDOE", "pw3", "Shouty Imposter")


def test_create_user_requires_fields(auth_db):
    with pytest.raises(ValueError):
        store.create_user("", "pw", "Name")
    with pytest.raises(ValueError):
        store.create_user("user", "", "Name")


def test_list_users_excludes_hashes(auth_db):
    store.create_user("a", "pw", "A")
    store.create_user("b", "pw", "B")
    users = store.list_users()
    assert [u["username"] for u in users] == ["a", "b"]
    assert all("password_hash" not in u for u in users)
