"""Every external program and every service, in one place.

Adding a service that wraps another Python program:
  1. Declare the program in PROGRAMS.
  2. Declare the service in SERVICES, naming the programs it needs.
  3. Set ATI_SERVICE_<KEY>_DIR (and _PYTHON if it has no .venv) in .env.development
     locally and in web.config for production (Setup-AtiIis.ps1 -ServiceSettings).

create_app() calls services_status() and stores the answer in app.config['SERVICES'];
the Settings > Services page reads describe_services() through GET /services.

Nothing here may raise because a configuration is incomplete. A missing setting, a
missing folder, an unreadable run folder or a malformed registry entry becomes a
`problem` on that one entry, and every other entry is still reported.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.services.external import ExternalProgram, _gateway_get

PROGRAMS = {
    "POPE_TECH": ExternalProgram(
        key="POPE_TECH",
        label="PopeTechIntegrator (Pope Tech WAVE scans)",
        module="pope_tech.query_cli",
    ),
}


@dataclass(frozen=True)
class ServiceSpec:
    """name     the package under app/services/
    entry      'module:function' of its async entry point
    programs   keys into PROGRAMS that must be configured for it to run"""
    name: str
    description: str
    entry: str
    programs: tuple = field(default_factory=tuple)


SERVICES = {
    "pope_tech_integration": ServiceSpec(
        name="pope_tech_integration",
        description="Pope Tech scan snapshots into Metric nodes",
        entry="app.services.pope_tech_integration.service:pull_metric_snapshots",
        programs=("POPE_TECH",),
    ),
}


def get_program(key: str) -> ExternalProgram:
    return PROGRAMS[key]


def _program_status(key, get) -> dict:
    program = PROGRAMS.get(key)
    if program is None:
        return {"program": key, "label": None, "module": None, "configured": False,
                "problem": f"no program '{key}' in the registry"}
    return program.status(get)


def _service_status(spec, get) -> dict:
    try:
        programs = [_program_status(key, get) for key in (spec.programs or ())]
        return {
            "available": all(p["configured"] for p in programs),
            "description": spec.description,
            "entry": spec.entry,
            "programs": programs,
            "problem": None,
        }
    except Exception as e:  # noqa: BLE001 - a malformed entry must not hide the others
        return {"available": False, "description": getattr(spec, "description", None),
                "entry": getattr(spec, "entry", None), "programs": [],
                "problem": f"Could not check this service: {e}"}


def services_status(get=_gateway_get) -> dict:
    """{service name: {available, description, entry, programs, problem}}.

    Checks configuration and paths only. It runs no program and never raises,
    so it is safe to call at app startup.
    """
    return {name: _service_status(spec, get) for name, spec in SERVICES.items()}


def last_run(service_name: str) -> dict:
    """The newest run folder for a service: a run happened, not that it succeeded
    (ServiceResult is not stored). Never raises; an unreadable root is a problem.
    """
    report = {"runs": 0, "latest": None, "latest_files": 0, "problem": None}
    try:
        from app.services._support import services_data_root
        root = services_data_root() / service_name
        if not root.is_dir():
            return report
        runs = sorted((p for p in root.iterdir() if p.is_dir()), key=lambda p: p.name)
        report["runs"] = len(runs)
        if runs:
            newest = runs[-1]
            report["latest_files"] = sum(1 for f in newest.iterdir() if f.is_file())
            report["latest"] = _run_time(newest.name)
    except Exception as e:  # noqa: BLE001
        report["problem"] = f"Could not read run folders: {e}"
    return report


def _run_time(folder_name: str):
    """'20261012T192801134693Z' (new_run_dir's format) -> an ISO UTC timestamp,
    or the folder name itself when it is not in that format."""
    try:
        stamp = datetime.strptime(folder_name, "%Y%m%dT%H%M%S%fZ").replace(tzinfo=timezone.utc)
        return stamp.isoformat(timespec="seconds").replace("+00:00", "Z")
    except ValueError:
        return folder_name


def describe_services(get=_gateway_get) -> dict:
    """What the Settings > Services page shows: every service's status, the
    settings that configure it, and its last run folder. Checked fresh on each
    call; never raises."""
    services = []
    for name, status in services_status(get).items():
        services.append({"name": name, **status, "last_run": last_run(name)})
    return {
        "checked_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "services": services,
    }
