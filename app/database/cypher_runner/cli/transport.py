"""neo4j-cli as a subprocess: the only way agent tooling in this package reaches the graph.

No module under ``cypher_runner`` except ``mcp/`` may import the neo4j driver. The two
runners (``run_query``, ``run_file``) build a ``neo4j-cli query`` command here and read its
JSON envelope back. The credential lives in the OS keyring under the CLI's control, so
nothing in this process ever sees a password.

Envelope shapes (neo4j-cli v1.14, ``--format json``):
    one statement   {"columns": [...], "rows": [{...}], "truncated": bool, "arrays_truncated": int, "plan"?: {...}}
    many statements [ <envelope>, ... ]
    failure         {"error": {"code": str, "exit_code": int, "message": str, ...}}   (exit code != 0)
A failed multi-statement call prints the successful envelopes first and then the error
object on its own line, so the stdout is not one JSON document. ``CliResult.envelopes``
handles both shapes.

The CLI reports no write counters. Callers that need to know what a write changed must
read it back.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable, Optional

CLI_NAME = "neo4j-cli"
ENV_OVERRIDE = "NEO4J_CLI"          # absolute path to the binary; beats the PATH lookup
INSTALL_HINT = (
    "neo4j-cli was not found. Install it (see app/database/cypher_runner/cli/README.md):\n"
    "  irm https://neo4j.sh/install.ps1 | iex\n"
    "then open a new shell, or set NEO4J_CLI to the binary's full path."
)
# The CLI prints this on every cleartext bolt:// connection. It is true and it is noise,
# so successful calls drop it and failed calls keep it.
_CLEARTEXT_WARNING = "warning: connecting to "


class CliNotFound(RuntimeError):
    """neo4j-cli is not installed or cannot be located."""


class CliError(RuntimeError):
    """neo4j-cli exited non-zero. ``result`` carries the full output."""

    def __init__(self, result: "CliResult"):
        self.result = result
        super().__init__(result.error_message())


def find_cli() -> str:
    """Locate the binary: NEO4J_CLI override, then PATH, then the installer's default dir."""
    override = os.environ.get(ENV_OVERRIDE)
    if override:
        if Path(override).is_file():
            return override
        raise CliNotFound(f"{ENV_OVERRIDE}={override!r} is not a file.")
    found = shutil.which(CLI_NAME)
    if found:
        return found
    local = os.environ.get("LOCALAPPDATA")
    if local:
        candidate = Path(local) / "neo4j-cli" / "neo4j-cli.exe"
        if candidate.is_file():
            return str(candidate)
    raise CliNotFound(INSTALL_HINT)


def format_param(name: str, value: Any) -> str:
    """``--param`` value. The CLI binds JSON-typed values, so every value is JSON-encoded.

    A string is quoted, which keeps ``"2025"`` and ``"true"`` as strings. A number binds as
    a Cypher FLOAT on the CLI side, so registry Cypher that needs an integer wraps the
    parameter in ``toInteger()``.
    """
    return f"{name}={json.dumps(value)}"


def build_command(
    params: Optional[dict] = None,
    *,
    rw: bool = False,
    atomic: bool = False,
    fmt: str = "json",
    credential: Optional[str] = None,
    database: Optional[str] = None,
    max_rows: int = 0,
    cli: Optional[str] = None,
) -> list[str]:
    """The argv for ``neo4j-cli query``. Cypher itself goes over stdin, never argv, so a
    long batch file cannot hit the Windows command-line length limit."""
    cmd = [cli or find_cli(), "query"]
    if rw:
        cmd.append("--rw")
    if atomic:
        cmd.append("--atomic")
    cmd += ["--format", fmt, "--max-rows", str(max_rows)]
    if credential:
        cmd += ["--credential", credential]
    if database:
        cmd += ["--database", database]
    for key, value in (params or {}).items():
        cmd += ["--param", format_param(key, value)]
    return cmd


@dataclass
class CliResult:
    returncode: int
    stdout: str
    stderr: str
    command: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return self.returncode == 0

    def envelopes(self) -> list[dict]:
        """Every JSON object the CLI printed, in order. Works for the single-object,
        array, and array-then-error shapes described in the module docstring."""
        out: list[dict] = []
        decoder = json.JSONDecoder()
        text = self.stdout
        idx = 0
        while True:
            while idx < len(text) and text[idx].isspace():
                idx += 1
            if idx >= len(text):
                break
            try:
                obj, end = decoder.raw_decode(text, idx)
            except json.JSONDecodeError:
                break
            idx = end
            if isinstance(obj, list):
                out.extend(o for o in obj if isinstance(o, dict))
            elif isinstance(obj, dict):
                out.append(obj)
        return out

    def error(self) -> Optional[dict]:
        for env in reversed(self.envelopes()):
            if "error" in env:
                return env["error"]
        return None

    def error_message(self) -> str:
        err = self.error()
        if err and err.get("message"):
            return err["message"]
        stderr = self.stderr.strip()
        return stderr or f"neo4j-cli exited {self.returncode}"

    def rows(self) -> list[dict]:
        """Rows of the first result envelope (the single-statement case)."""
        for env in self.envelopes():
            if "rows" in env:
                return env["rows"]
        return []

    def warnings(self) -> str:
        """stderr minus the cleartext-connection line."""
        return "\n".join(
            line for line in self.stderr.splitlines() if not line.startswith(_CLEARTEXT_WARNING)
        ).strip()


def run(
    cypher: str,
    params: Optional[dict] = None,
    *,
    rw: bool = False,
    atomic: bool = False,
    fmt: str = "json",
    credential: Optional[str] = None,
    database: Optional[str] = None,
    max_rows: int = 0,
    check: bool = True,
    timeout: float = 900,
) -> CliResult:
    """Run Cypher through neo4j-cli. ``rw`` is the only way a write gets through, and the
    CLI's own EXPLAIN preflight refuses write statements when it is off."""
    cmd = build_command(
        params, rw=rw, atomic=atomic, fmt=fmt, credential=credential,
        database=database, max_rows=max_rows,
    )
    proc = subprocess.run(
        cmd, input=cypher, text=True, capture_output=True, encoding="utf-8", timeout=timeout,
    )
    result = CliResult(proc.returncode, proc.stdout, proc.stderr, cmd)
    if check and not result.ok:
        raise CliError(result)
    return result


def rows(cypher: str, params: Optional[dict] = None, **kwargs) -> list[dict]:
    """Read-only convenience: the rows of a single statement, or raise ``CliError``."""
    return run(cypher, params, **kwargs).rows()


def join_statements(statements: Iterable[str]) -> str:
    """One stdin document the CLI splits back into statements (';' at end of line)."""
    return "".join(f"{s.strip()};\n" for s in statements if s.strip())
