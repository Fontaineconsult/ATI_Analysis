"""The external call: run `ptq metric-snapshot` and read the files it writes.

Read-only. `--write` is never passed; ptq refuses state changes without it.
"""
import asyncio
import json
from dataclasses import dataclass, field
from pathlib import Path

from app.services.pope_tech_integration import config
from app.services.registry import get_program


class SnapshotFetchError(RuntimeError):
    pass


@dataclass
class FetchOutput:
    snapshots: list = field(default_factory=list)
    # ptq exit 5: some dates had no usable data. stderr says which.
    partial: bool = False
    stderr: str = ""


def build_args(run_dir: Path, org=None, as_of=None) -> list:
    """ptq arguments for one call. ptq takes a single --org; org=None means
    every org the token reaches."""
    args = ["metric-snapshot", "--out", str(run_dir)]
    args += ["--org", org] if org else ["--all-orgs"]
    for day in as_of or []:
        args += ["--as-of", day]
    return args


def read_snapshots(run_dir: Path) -> list:
    """The snapshot files in a run folder, skipping the raw breakdown files."""
    snapshots = []
    for path in sorted(Path(run_dir).glob("*.json")):
        if path.name.endswith("_breakdown.json"):
            continue
        snapshots.append(json.loads(path.read_text(encoding="utf-8")))
    return snapshots


async def fetch_snapshots(run_dir: Path, orgs=None, as_of=None,
                          timeout=config.DEFAULT_TIMEOUT) -> FetchOutput:
    """Run ptq into run_dir and return the snapshots it wrote.

    One ptq call per org, run concurrently, all writing into run_dir. Any call
    failing fails the fetch.
    """
    program = get_program(config.PROGRAM_KEY)
    calls = [build_args(run_dir, org=org, as_of=as_of) for org in (orgs or [None])]
    outputs = await asyncio.gather(*(program.run(args, timeout=timeout) for args in calls))

    reasons = {
        config.EXIT_BAD_DATE: "a date was not YYYY-MM-DD",
        config.EXIT_WRITE_REFUSED: "ptq was asked to write",
    }
    for org, out in zip(orgs or ["all orgs"], outputs):
        if out.returncode not in (config.EXIT_OK, config.EXIT_SOME_SKIPPED):
            reason = reasons.get(out.returncode, f"exit {out.returncode}")
            raise SnapshotFetchError(
                f"ptq metric-snapshot for {org} failed ({reason}): {out.stderr.strip()[-500:]}")

    return FetchOutput(
        snapshots=read_snapshots(run_dir),
        partial=any(o.returncode == config.EXIT_SOME_SKIPPED for o in outputs),
        stderr="\n".join(o.stderr.strip() for o in outputs if o.stderr.strip()),
    )
