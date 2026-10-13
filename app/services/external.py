"""External programs: Python projects outside this repo that a service runs.

Each program lives in its own folder with its own virtualenv and its own
secrets. The app never imports it. A service runs it as a subprocess,
`<python> -m <module> <args>`, with the program's folder as the working
directory so the program loads its own .env.

Where a program lives is configuration, resolved through config_gateway like
every other setting (environment, then web.config, then .env.<FLASK_ENV>):

    ATI_SERVICE_<KEY>_DIR       the program's folder. Required.
    ATI_SERVICE_<KEY>_PYTHON    its interpreter. Optional; defaults to the
                                program's own .venv inside that folder.

Nothing is guessed. A program whose folder is not configured reports itself as
not configured, and a run refuses to start.
"""
import sys
from dataclasses import dataclass
from pathlib import Path

from app.services._support import CommandOutput, run_command


class ServiceNotConfigured(RuntimeError):
    pass


def _gateway_get(key):
    # Imported on use: the gateway hydrates os.environ on import, and this
    # module must stay importable without side effects.
    from app.config_gateway import config
    return config.get(key)


def _default_venv_python(folder: Path) -> Path:
    venv = folder / ".venv"
    return venv / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")


@dataclass(frozen=True)
class ExternalProgram:
    """One Python program outside the app.

    key     Upper-case setting key, e.g. 'POPE_TECH' -> ATI_SERVICE_POPE_TECH_DIR.
    label   What it is, for status output.
    module  The module run with `python -m`, e.g. 'pope_tech.query_cli'.
    """
    key: str
    label: str
    module: str

    @property
    def dir_setting(self) -> str:
        return f"ATI_SERVICE_{self.key}_DIR"

    @property
    def python_setting(self) -> str:
        return f"ATI_SERVICE_{self.key}_PYTHON"

    def _setting(self, key, get) -> str:
        """A setting as a stripped string. A settings source that fails reads as
        unset, with the reason, rather than raising out of a status check."""
        try:
            value = get(key)
        except Exception as e:  # noqa: BLE001 - any failure means "not configured"
            raise ServiceNotConfigured(f"{key} could not be read: {e}") from e
        return "" if value is None else str(value).strip()

    @staticmethod
    def _exists(path: Path, kind: str) -> bool:
        """is_dir / is_file that treats an unusable path (bad characters, no
        permission, an unreachable share) as missing instead of raising."""
        try:
            return path.is_dir() if kind == "dir" else path.is_file()
        except (OSError, ValueError):
            return False

    def resolve(self, get=_gateway_get):
        """(folder, interpreter) as Paths, or ServiceNotConfigured saying what is missing."""
        configured_dir = self._setting(self.dir_setting, get)
        if not configured_dir:
            raise ServiceNotConfigured(f"{self.dir_setting} is not set")
        folder = Path(configured_dir)
        if not self._exists(folder, "dir"):
            raise ServiceNotConfigured(f"{self.dir_setting} points at a missing folder: {folder}")

        configured_python = self._setting(self.python_setting, get)
        python = Path(configured_python) if configured_python else _default_venv_python(folder)
        if not self._exists(python, "file"):
            source = self.python_setting if configured_python else f"default {self.python_setting}"
            raise ServiceNotConfigured(f"{source} points at a missing interpreter: {python}")
        return folder, python

    def status(self, get=_gateway_get) -> dict:
        """Configured or not, with the reason. Checks paths only, runs nothing,
        and never raises: an incomplete configuration is a status, not an error.

        `dir` and `python` are what is set (or would be used), even when missing,
        so an admin can see exactly which value is wrong.
        """
        report = {
            "program": self.key,
            "label": self.label,
            "module": self.module,
            "dir_setting": self.dir_setting,
            "python_setting": self.python_setting,
            "configured": False,
            "dir": None,
            "python": None,
            "python_source": None,
            "problem": None,
        }
        try:
            report["dir"] = self._setting(self.dir_setting, get) or None
            configured_python = self._setting(self.python_setting, get)
            report["python_source"] = "configured" if configured_python else "default .venv"
            if configured_python:
                report["python"] = configured_python
            elif report["dir"]:
                report["python"] = str(_default_venv_python(Path(report["dir"])))
            folder, python = self.resolve(get)
            report.update(configured=True, dir=str(folder), python=str(python))
        except ServiceNotConfigured as e:
            report["problem"] = str(e)
        except Exception as e:  # noqa: BLE001 - a status check must never take the app down
            report["problem"] = f"Could not check this program: {e}"
        return report

    async def run(self, args, timeout=300, get=_gateway_get) -> CommandOutput:
        """Run `<python> -m <module> <args>` in the program's folder."""
        folder, python = self.resolve(get)
        return await run_command([python, "-m", self.module, *args], cwd=folder, timeout=timeout)
