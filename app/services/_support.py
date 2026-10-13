"""Shared pieces for services: local run folders, subprocess calls, results.

Nothing here knows about a particular service or about the graph.
"""
import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path


def services_data_root() -> Path:
    """ATI_SERVICES_DATA_DIR, else app/data/services, which git ignores."""
    from app.config_gateway import config
    configured = (config.get("ATI_SERVICES_DATA_DIR") or "").strip()
    return Path(configured) if configured else Path(__file__).resolve().parents[1] / "data" / "services"


@dataclass
class ServiceResult:
    """What one service run did, in a shape any caller can log or return."""
    service: str
    ok: bool = True
    run_dir: str = None
    saved: list = field(default_factory=list)      # composite keys written to the graph
    skipped: list = field(default_factory=list)    # {"item": ..., "reason": ...}
    errors: list = field(default_factory=list)

    def skip(self, item, reason):
        self.skipped.append({"item": item, "reason": reason})

    def fail(self, message):
        self.ok = False
        self.errors.append(message)


def new_run_dir(service_name: str) -> Path:
    """A fresh folder for one run's local files, named by UTC timestamp."""
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    path = services_data_root() / service_name / stamp
    path.mkdir(parents=True, exist_ok=True)
    return path


@dataclass
class CommandOutput:
    returncode: int
    stdout: str
    stderr: str


class ServiceTimeout(RuntimeError):
    pass


async def run_command(args, cwd=None, env=None, timeout=300) -> CommandOutput:
    """Run an external program without blocking the event loop.

    The process is killed if it runs past `timeout` seconds.
    """
    proc = await asyncio.create_subprocess_exec(
        *[str(a) for a in args],
        cwd=str(cwd) if cwd else None,
        env=env,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        raise ServiceTimeout(f"{args[0]} ran past {timeout}s and was stopped")
    return CommandOutput(
        proc.returncode,
        stdout.decode("utf-8", errors="replace"),
        stderr.decode("utf-8", errors="replace"),
    )
