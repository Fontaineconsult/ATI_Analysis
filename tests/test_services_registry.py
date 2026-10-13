"""
The generic external-program layer and the service registry.

Settings are passed in through a fake `get`, so nothing here depends on the
machine's .env or web.config.
"""
import asyncio
import importlib
import sys

import pytest

from app.services.external import ExternalProgram, ServiceNotConfigured
from app.services.registry import PROGRAMS, SERVICES, services_status

PROGRAM = ExternalProgram(key="DEMO", label="Demo program", module="demo_cli")


def settings(**values):
    return lambda key: values.get(key)


@pytest.mark.unit
def test_setting_names_follow_the_key():
    assert PROGRAM.dir_setting == "ATI_SERVICE_DEMO_DIR"
    assert PROGRAM.python_setting == "ATI_SERVICE_DEMO_PYTHON"


@pytest.mark.unit
def test_an_unset_folder_is_not_configured():
    with pytest.raises(ServiceNotConfigured, match="ATI_SERVICE_DEMO_DIR is not set"):
        PROGRAM.resolve(settings())
    status = PROGRAM.status(settings())
    assert status["configured"] is False and "not set" in status["problem"]


@pytest.mark.unit
def test_a_missing_folder_is_not_configured(tmp_path):
    with pytest.raises(ServiceNotConfigured, match="missing folder"):
        PROGRAM.resolve(settings(ATI_SERVICE_DEMO_DIR=str(tmp_path / "gone")))


@pytest.mark.unit
def test_the_default_interpreter_is_the_programs_own_venv(tmp_path):
    # No .venv in the folder and no _PYTHON setting: refused, not guessed.
    with pytest.raises(ServiceNotConfigured, match="default ATI_SERVICE_DEMO_PYTHON"):
        PROGRAM.resolve(settings(ATI_SERVICE_DEMO_DIR=str(tmp_path)))

    venv_python = tmp_path / ".venv" / (
        "Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    venv_python.parent.mkdir(parents=True)
    venv_python.write_text("")
    assert PROGRAM.resolve(settings(ATI_SERVICE_DEMO_DIR=str(tmp_path))) == (tmp_path, venv_python)


@pytest.mark.unit
def test_run_calls_the_module_in_the_programs_folder(tmp_path):
    (tmp_path / "demo_cli.py").write_text(
        "import os, sys; print(os.getcwd()); print(' '.join(sys.argv[1:]))", encoding="utf-8")
    get = settings(ATI_SERVICE_DEMO_DIR=str(tmp_path), ATI_SERVICE_DEMO_PYTHON=sys.executable)

    out = asyncio.run(PROGRAM.run(["--flag", "value"], get=get))
    cwd, argv = out.stdout.strip().splitlines()
    assert out.returncode == 0
    assert cwd.lower() == str(tmp_path).lower()
    assert argv == "--flag value"


@pytest.mark.unit
def test_every_service_names_known_programs_and_an_importable_entry():
    for name, spec in SERVICES.items():
        assert spec.name == name
        assert set(spec.programs) <= set(PROGRAMS), name
        module, function = spec.entry.split(":")
        assert callable(getattr(importlib.import_module(module), function)), spec.entry


@pytest.mark.unit
def test_status_marks_a_service_unavailable_without_raising():
    pope = services_status(settings())["pope_tech_integration"]
    assert pope["available"] is False
    assert pope["programs"][0]["problem"] == "ATI_SERVICE_POPE_TECH_DIR is not set"


@pytest.mark.api
def test_create_app_records_service_status(flask_client):
    services = flask_client.application.config["SERVICES"]
    assert set(services) == set(SERVICES)
    assert {"available", "programs"} <= set(services["pope_tech_integration"])
