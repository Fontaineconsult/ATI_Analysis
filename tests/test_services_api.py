"""
GET /services and the registry behind it.

Two requirements carry most of the weight here:
  - admin-only, enforced on the server (the response describes server paths);
  - an incomplete or broken configuration is reported, never raised: the app
    still boots, the endpoint still answers 200, and one bad entry does not hide
    the others.

No Neo4j: nothing here touches the graph.
"""
import pytest

from app.services import registry
from app.services.external import ExternalProgram

pytestmark = [pytest.mark.unit]

ADMIN_EMAIL = "testuser@example.edu"   # the identity authed_client seeds


@pytest.fixture
def run_root(tmp_path, monkeypatch):
    root = tmp_path / "runs"
    monkeypatch.setenv("ATI_SERVICES_DATA_DIR", str(root))
    return root


# --- Admin only, on the server ---------------------------------------------------

def test_requires_login_when_auth_is_on(auth_app):
    with auth_app.test_client() as client:
        resp = client.get("/ati/data-api/v1/services")
    assert resp.status_code == 401


def test_refuses_a_logged_in_non_admin(auth_app, authed_client):
    auth_app.config["AUTH_ADMINS"] = frozenset({"someone.else@example.edu"})
    resp = authed_client.get("/ati/data-api/v1/services")
    assert resp.status_code == 403
    assert resp.get_json()["error"] == "admin_required"


@pytest.mark.api
def test_answers_an_admin(auth_app, authed_client, run_root):
    auth_app.config["AUTH_ADMINS"] = frozenset({ADMIN_EMAIL})
    resp = authed_client.get("/ati/data-api/v1/services")
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["checked_at"]
    pope = next(s for s in data["services"] if s["name"] == "pope_tech_integration")
    assert {"available", "description", "entry", "programs", "last_run", "problem"} <= set(pope)
    program = pope["programs"][0]
    assert program["dir_setting"] == "ATI_SERVICE_POPE_TECH_DIR"
    assert program["module"] == "pope_tech.query_cli"


def test_is_open_with_auth_off(auth_app, run_root):
    auth_app.config["AUTH_ENFORCED"] = False
    with auth_app.test_client() as client:
        assert client.get("/ati/data-api/v1/services").status_code == 200


# --- Incomplete configuration is a status, never an error ----------------------

PROGRAM = ExternalProgram(key="DEMO", label="Demo", module="demo_cli")


def test_unset_folder_reports_the_missing_setting():
    status = PROGRAM.status(lambda key: None)
    assert status["configured"] is False
    assert status["problem"] == "ATI_SERVICE_DEMO_DIR is not set"
    assert status["dir_setting"] == "ATI_SERVICE_DEMO_DIR"


def test_a_failing_settings_source_reads_as_not_configured():
    def broken(key):
        raise RuntimeError("web.config unreadable")
    status = PROGRAM.status(broken)
    assert status["configured"] is False
    assert "could not be read: web.config unreadable" in status["problem"]


@pytest.mark.parametrize("bad_path", ["C:\\no\\such\\folder", "bad\x00path", "  "])
def test_unusable_paths_are_reported_not_raised(bad_path):
    status = PROGRAM.status(lambda key: bad_path if key.endswith("_DIR") else None)
    assert status["configured"] is False and status["problem"]


def test_a_missing_interpreter_names_the_setting_and_the_path(tmp_path):
    status = PROGRAM.status(lambda key: str(tmp_path) if key.endswith("_DIR") else None)
    assert status["configured"] is False
    assert "default ATI_SERVICE_DEMO_PYTHON points at a missing interpreter" in status["problem"]
    assert status["python_source"] == "default .venv"
    assert status["python"].endswith("python.exe") or status["python"].endswith("python")


def test_one_broken_service_does_not_hide_the_others(monkeypatch):
    good = registry.ServiceSpec(name="good", description="ok", entry="m:f", programs=())
    unknown_program = registry.ServiceSpec(name="ghost", description="?", entry="m:f",
                                           programs=("NOPE",))
    malformed = registry.ServiceSpec(name="broken", description="x", entry="m:f",
                                     programs=None)
    monkeypatch.setattr(registry, "SERVICES", {
        "good": good, "ghost": unknown_program, "broken": malformed,
        "worse": object(),   # not a ServiceSpec at all
    })
    status = registry.services_status(lambda key: None)
    assert status["good"]["available"] is True
    assert status["ghost"]["available"] is False
    assert status["ghost"]["programs"][0]["problem"] == "no program 'NOPE' in the registry"
    assert status["broken"]["available"] is True        # programs=None means none needed
    assert status["worse"]["available"] is False and status["worse"]["problem"]


def test_unreadable_run_folders_are_a_problem_not_an_error(monkeypatch):
    def explode():
        raise PermissionError("access denied")
    monkeypatch.setattr("app.services._support.services_data_root", explode)
    report = registry.last_run("pope_tech_integration")
    assert report["runs"] == 0 and "access denied" in report["problem"]


def test_endpoint_answers_even_when_the_registry_fails(auth_app, monkeypatch):
    auth_app.config["AUTH_ENFORCED"] = False

    def explode(*a, **k):
        raise RuntimeError("registry import failed")
    monkeypatch.setattr(registry, "describe_services", explode)
    with auth_app.test_client() as client:
        resp = client.get("/ati/data-api/v1/services")
    assert resp.status_code == 200
    assert "registry import failed" in resp.get_json()["data"]["problem"]


def test_the_app_boots_when_the_status_check_fails(monkeypatch, auth_db):
    def explode(*a, **k):
        raise RuntimeError("status check blew up")
    monkeypatch.setattr(registry, "services_status", explode)
    from app import create_app

    app = create_app()
    assert app.config["SERVICES"] == {}


# --- Last run, from the run folders ------------------------------------------

def test_last_run_reads_the_newest_folder(run_root):
    service = run_root / "pope_tech_integration"
    older = service / "20261001T090000000000Z"
    newer = service / "20261012T192801134693Z"
    for folder, files in ((older, 1), (newer, 3)):
        folder.mkdir(parents=True)
        for i in range(files):
            (folder / f"f{i}.json").write_text("{}")
    report = registry.last_run("pope_tech_integration")
    assert report == {"runs": 2, "latest": "2026-10-12T19:28:01Z", "latest_files": 3, "problem": None}


def test_no_runs_yet(run_root):
    assert registry.last_run("pope_tech_integration") == {
        "runs": 0, "latest": None, "latest_files": 0, "problem": None}
