"""
What production does when the Pope Tech paths are not configured.

Simulates the deployed host faithfully:
  - FLASK_ENV comes from web.config, so the gateway is in production mode and
    never reads a .env file;
  - web.config is the one Setup-AtiIis.ps1 writes when no -ServiceSettings were
    given (no ATI_SERVICE_* keys), or the template's empty placeholders, or a
    path that does not exist on the server;
  - an .env.development that DOES set ATI_SERVICE_POPE_TECH_DIR sits beside it,
    to prove production ignores it.

Then checks every place the services are touched: the boot check, the
Settings > Services endpoint, and a call to the service itself (fetch-only and
save=True). None of them may raise, and nothing reaches the graph.
"""
import asyncio
import os

import pytest

from app import config_gateway
from app.services import registry

pytestmark = [pytest.mark.unit]

SETUP_WEB_CONFIG = """<configuration>
  <appSettings>
    <add key="FLASK_ENV" value="production" />
    <add key="FLASK_SECRET_KEY" value="{secret}" />
    <add key="NEO4J_DATABASE" value="neo4j" />
    <add key="FS_MAX_UPLOAD_MB" value="50" />
    <!-- Services (app/services): where each external program lives -->
{services}
  </appSettings>
</configuration>
"""

SCENARIOS = {
    # Setup-AtiIis.ps1 run with no -ServiceSettings: the block is empty.
    "no service keys": "",
    # Copied from web.config.template without filling the placeholders.
    "template placeholders left empty": (
        '    <add key="ATI_SERVICE_POPE_TECH_DIR" value="" />\n'
        '    <add key="ATI_SERVICE_POPE_TECH_PYTHON" value="" />\n'
        '    <add key="ATI_SERVICES_DATA_DIR" value="" />'
    ),
    # Set, but PopeTechIntegrator was never copied to the server.
    "folder not on the server": '    <add key="ATI_SERVICE_POPE_TECH_DIR" value="C:\\www\\services\\PopeTechIntegrator" />',
}

EXPECTED_PROBLEM = {
    "no service keys": "ATI_SERVICE_POPE_TECH_DIR is not set",
    "template placeholders left empty": "ATI_SERVICE_POPE_TECH_DIR is not set",
    "folder not on the server": "ATI_SERVICE_POPE_TECH_DIR points at a missing folder",
}


@pytest.fixture(params=list(SCENARIOS))
def production_gateway(request, tmp_path, monkeypatch):
    """A production ConfigGateway over a Setup-style web.config, swapped in for
    the app's singleton. os.environ is restored afterwards, because the gateway
    hydrates it."""
    saved_env = dict(os.environ)
    # On the host these come only from web.config; the dev test session put
    # them in os.environ, which would otherwise win.
    for key in ("FLASK_ENV", "ATI_SERVICE_POPE_TECH_DIR", "ATI_SERVICE_POPE_TECH_PYTHON",
                "ATI_SERVICES_DATA_DIR"):
        os.environ.pop(key, None)

    app_dir = tmp_path / "app"
    app_dir.mkdir()
    # A dev file that WOULD configure Pope Tech, if production read it.
    (app_dir / ".env.development").write_text(
        f"ATI_SERVICE_POPE_TECH_DIR={tmp_path}\n", encoding="utf-8")
    (app_dir / ".env.production").write_text(
        f"ATI_SERVICE_POPE_TECH_DIR={tmp_path}\n", encoding="utf-8")
    web_config = tmp_path / "web.config"
    web_config.write_text(SETUP_WEB_CONFIG.format(
        secret="a" * 64, services=SCENARIOS[request.param]), encoding="utf-8")

    gateway = config_gateway.ConfigGateway(app_dir=app_dir, web_config_path=web_config)
    monkeypatch.setattr(config_gateway, "config", gateway)
    # The run-file root defaults under the real app folder; keep it in tmp.
    monkeypatch.setattr(
        "app.services._support.services_data_root", lambda: tmp_path / "runs")
    yield request.param, gateway
    os.environ.clear()
    os.environ.update(saved_env)


def test_the_gateway_is_in_production_and_ignores_env_files(production_gateway):
    _, gateway = production_gateway
    assert gateway.is_production
    assert gateway.get("ATI_SERVICE_POPE_TECH_DIR") in (None, "C:\\www\\services\\PopeTechIntegrator")


def test_status_reports_not_configured_with_the_reason(production_gateway):
    scenario, _ = production_gateway
    status = registry.services_status()["pope_tech_integration"]
    assert status["available"] is False
    assert status["programs"][0]["problem"].startswith(EXPECTED_PROBLEM[scenario])


def _production_app():
    """create_app() in production mode. The config classes were loaded at import
    with dev values, so the secret the host would read from web.config is
    supplied here; everything else is as the app builds it."""
    from app import create_app
    from app.web_config import select_config

    host_config = type("HostConfig", (select_config(),), {"SECRET_KEY": "a" * 64})
    return create_app(config_object=host_config)


def test_the_app_boots_and_logs_one_warning(production_gateway, caplog):
    with caplog.at_level("WARNING"):
        app = _production_app()
    assert app.config["SERVICES"]["pope_tech_integration"]["available"] is False
    warnings = [r.getMessage() for r in caplog.records if "pope_tech_integration" in r.getMessage()]
    assert len(warnings) == 1 and "is not available" in warnings[0]


def test_the_settings_endpoint_answers_200(production_gateway):
    scenario, _ = production_gateway
    app = _production_app()
    app.config["AUTH_ENFORCED"] = False
    with app.test_client() as client:
        resp = client.get("/ati/data-api/v1/services")
    assert resp.status_code == 200
    pope = resp.get_json()["data"]["services"][0]
    assert pope["available"] is False
    assert pope["programs"][0]["problem"].startswith(EXPECTED_PROBLEM[scenario])
    assert pope["last_run"] == {"runs": 0, "latest": None, "latest_files": 0, "problem": None}


@pytest.mark.parametrize("save", [False, True])
def test_calling_the_service_fails_cleanly_and_writes_nothing(production_gateway, save, monkeypatch):
    scenario, _ = production_gateway
    from app.services.pope_tech_integration import service

    # Any attempt to reach the store (and so the graph) is a failure of this test.
    def no_store(*a, **k):
        raise AssertionError("the store must not be reached")
    monkeypatch.setattr("app.services.pope_tech_integration.store.save_snapshot", no_store, raising=False)

    result = asyncio.run(service.pull_metric_snapshots(academic_year="2025-2026", save=save))
    assert result.ok is False
    assert result.saved == []
    assert result.errors[0].startswith(EXPECTED_PROBLEM[scenario])
