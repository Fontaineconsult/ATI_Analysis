"""Layer-1 unit tests for the SQLite auth store (no Neo4j, no Flask).

Accounts are keyed by email.
"""
import sqlite3

import pytest

from app.auth import store

pytestmark = pytest.mark.unit


def test_create_and_verify_user(auth_db):
    store.create_user("jane@sfsu.edu", "hunter22", "Jane Doe", employee_id="913678186")
    row = store.verify_user("jane@sfsu.edu", "hunter22")
    assert row is not None
    assert row["email"] == "jane@sfsu.edu"
    assert row["display_name"] == "Jane Doe"
    assert row["employee_id"] == "913678186"
    assert row["active"] == 1
    # Hash, never the plaintext, is stored
    assert "hunter22" not in row["password_hash"]


def test_verify_wrong_password_returns_none(auth_db):
    store.create_user("jane@sfsu.edu", "hunter22", "Jane Doe")
    assert store.verify_user("jane@sfsu.edu", "wrong") is None


def test_verify_unknown_user_returns_none(auth_db):
    assert store.verify_user("ghost@sfsu.edu", "whatever") is None


def test_inactive_user_cannot_verify(auth_db):
    store.create_user("jane@sfsu.edu", "hunter22", "Jane Doe")
    store.set_active("jane@sfsu.edu", False)
    assert store.verify_user("jane@sfsu.edu", "hunter22") is None
    store.set_active("jane@sfsu.edu", True)
    assert store.verify_user("jane@sfsu.edu", "hunter22") is not None


def test_set_password(auth_db):
    store.create_user("jane@sfsu.edu", "oldpass", "Jane Doe")
    store.set_password("jane@sfsu.edu", "newpass")
    assert store.verify_user("jane@sfsu.edu", "oldpass") is None
    assert store.verify_user("jane@sfsu.edu", "newpass") is not None


def test_set_password_unknown_user_raises(auth_db):
    with pytest.raises(LookupError):
        store.set_password("ghost@sfsu.edu", "x")


def test_duplicate_email_rejected(auth_db):
    store.create_user("jane@sfsu.edu", "pw1", "Jane Doe")
    with pytest.raises(sqlite3.IntegrityError):
        store.create_user("jane@sfsu.edu", "pw2", "Imposter")
    # COLLATE NOCASE: case-variant duplicates also rejected
    with pytest.raises(sqlite3.IntegrityError):
        store.create_user("JANE@SFSU.EDU", "pw3", "Shouty Imposter")


def test_create_user_requires_fields(auth_db):
    with pytest.raises(ValueError):
        store.create_user("", "pw", "Name")
    with pytest.raises(ValueError):
        store.create_user("user@sfsu.edu", "", "Name")


def test_list_users_excludes_hashes(auth_db):
    store.create_user("a@sfsu.edu", "pw", "A")
    store.create_user("b@sfsu.edu", "pw", "B")
    users = store.list_users()
    assert [u["email"] for u in users] == ["a@sfsu.edu", "b@sfsu.edu"]
    assert all("password_hash" not in u for u in users)
