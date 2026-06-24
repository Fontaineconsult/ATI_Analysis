"""Auth endpoint + guard contract tests.

These exercise Flask routes via the test client but need NO Neo4j data: the
/me person lookup degrades to null for emails that have no Person (or when the
graph is unreachable), which is itself part of the contract under test.
"""
import pytest

from app.auth import store

pytestmark = pytest.mark.api


def _seed():
    store.create_user("jane@sfsu.edu", "hunter22", "Jane Doe", employee_id="0000000")


# ---------------------------------------------------------------- login

def test_login_success_sets_cookie_and_returns_user(auth_app, auth_db):
    _seed()
    client = auth_app.test_client()
    resp = client.post("/ati/auth/v1/login", json={"email": "jane@sfsu.edu", "password": "hunter22"})
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "success"
    user = body["data"]["user"]
    assert user["email"] == "jane@sfsu.edu"
    assert user["provider"] == "local"
    assert user["display_name"] == "Jane Doe"
    assert user["is_admin"] is False
    cookies = resp.headers.getlist("Set-Cookie")
    assert any("ati_session=" in c and "HttpOnly" in c and "Path=/ati" in c for c in cookies)


def test_login_bad_password_401_single_message(auth_app, auth_db):
    _seed()
    client = auth_app.test_client()
    for creds in [
        {"email": "jane@sfsu.edu", "password": "wrong"},
        {"email": "ghost@sfsu.edu", "password": "whatever"},
    ]:
        resp = client.post("/ati/auth/v1/login", json=creds)
        assert resp.status_code == 401
        assert resp.get_json()["error"] == "invalid_credentials"


def test_login_inactive_user_401(auth_app, auth_db):
    _seed()
    store.set_active("jane@sfsu.edu", False)
    resp = auth_app.test_client().post(
        "/ati/auth/v1/login", json={"email": "jane@sfsu.edu", "password": "hunter22"})
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "invalid_credentials"


def test_login_missing_fields_400(auth_app, auth_db):
    resp = auth_app.test_client().post("/ati/auth/v1/login", json={"email": "jane@sfsu.edu"})
    assert resp.status_code == 400


def test_login_respects_allowlist(auth_app, auth_db):
    _seed()
    auth_app.config["AUTH_ALLOWED_USERS"] = frozenset({"someoneelse@sfsu.edu"})
    resp = auth_app.test_client().post(
        "/ati/auth/v1/login", json={"email": "jane@sfsu.edu", "password": "hunter22"})
    assert resp.status_code == 401


def test_login_admin_flag_from_config(auth_app, auth_db):
    _seed()
    auth_app.config["AUTH_ADMINS"] = frozenset({"jane@sfsu.edu"})
    resp = auth_app.test_client().post(
        "/ati/auth/v1/login", json={"email": "jane@sfsu.edu", "password": "hunter22"})
    assert resp.get_json()["data"]["user"]["is_admin"] is True


# ---------------------------------------------------------------- me / logout

def test_me_anonymous_enforced_401(auth_app):
    resp = auth_app.test_client().get("/ati/auth/v1/me")
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "authentication_required"


def test_me_anonymous_unenforced_200_with_flag(auth_app):
    auth_app.config["AUTH_ENFORCED"] = False
    resp = auth_app.test_client().get("/ati/auth/v1/me")
    assert resp.status_code == 200
    assert resp.get_json()["data"] == {"enforced": False, "user": None}


def test_me_with_session(authed_client):
    resp = authed_client.get("/ati/auth/v1/me")
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["enforced"] is True
    assert data["user"]["email"] == "testuser@example.edu"
    # This email has no Person in the graph — lookup degrades to null
    assert data["user"]["person"] is None


def test_logout_clears_session(auth_app, auth_db):
    _seed()
    client = auth_app.test_client()
    client.post("/ati/auth/v1/login", json={"email": "jane@sfsu.edu", "password": "hunter22"})
    assert client.get("/ati/auth/v1/me").status_code == 200
    resp = client.post("/ati/auth/v1/logout")
    assert resp.status_code == 200
    assert client.get("/ati/auth/v1/me").status_code == 401
    # Idempotent
    assert client.post("/ati/auth/v1/logout").status_code == 200


# ---------------------------------------------------------------- guard

def test_data_api_401_when_enforced_and_anonymous(auth_app):
    resp = auth_app.test_client().get("/ati/data-api/v1/individuals")
    assert resp.status_code == 401
    body = resp.get_json()
    assert body == {
        "status": "error",
        "data": None,
        "message": None,
        "error": "authentication_required",
    }


def test_data_api_options_preflight_passes_guard(auth_app):
    resp = auth_app.test_client().options("/ati/data-api/v1/individuals")
    assert resp.status_code != 401


def test_data_api_open_when_kill_switch_off(auth_app):
    """The global flag disables the guard outright (response may be 200 or a
    DB-dependent error, but never the guard's 401)."""
    auth_app.config["AUTH_ENFORCED"] = False
    resp = auth_app.test_client().get("/ati/data-api/v1/individuals")
    assert resp.status_code != 401


def test_react_shell_stays_public(auth_app):
    """The SPA shell must render anonymously so the login page can load."""
    resp = auth_app.test_client().get("/ati/")
    assert resp.status_code != 401
