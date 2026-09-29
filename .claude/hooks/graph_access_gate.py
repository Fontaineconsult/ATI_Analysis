"""PreToolUse gate: agent graph access goes through the three sanctioned paths only.

    1. the HTTP API   Flask endpoints over app/database/queries/<domain> (neomodel)
    2. the MCP server app/database/cypher_runner/mcp (its own driver, its own process)
    3. neo4j-cli      for anyone working from a terminal; run_query / run_file wrap it

What this gate refuses, from an agent session in this repo:
    - inline Python that reaches the graph (python -c / python - / heredoc) when it
      names a driver, neomodel, the queries layer, or a Bolt address;
    - cypher-shell, or any command that carries a Bolt URI or the Bolt port, unless
      the command is one of the sanctioned entry points (pytest, the Flask app, the
      admin tools under app/database/tools, the MCP server, neo4j-cli itself);
    - writing a Python file that imports the raw neo4j driver anywhere except the
      packages that already own one (the MCP executor and two legacy visualisers);
    - writing a Python file outside app/ and tests/ that touches the graph at all
      (a scratch script that opens a session is exactly the thing this stops).

It says why, and what to use instead. Everything else passes through untouched.

Wiring: .claude/settings.json runs this on PreToolUse for Bash, PowerShell, Write,
Edit and MultiEdit. Exit code 2 blocks the call and hands stderr to the agent.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

# Anything that means "I am talking to the graph from Python" or "I am opening Bolt".
GRAPH_TOKENS = re.compile(
    r"GraphDatabase|from\s+neo4j\s+import|import\s+neo4j\b|neomodel|cypher_query|"
    r"set_connection|app\.database\.(?:queries|graph_schema|tools|cypher_runner\.mcp)|"
    r"create_app|(?:bolt|neo4j)(?:\+s{1,2}c?)?://|:7687\b",
    re.IGNORECASE,
)
# Only the raw driver. neomodel is fine in app code; the raw driver is not.
RAW_DRIVER = re.compile(r"GraphDatabase|from\s+neo4j\s+import|import\s+neo4j\b")

# python -c "...", python - <<EOF, python <<EOF, python - < file
INLINE_PYTHON = re.compile(
    r"python[\w.]*(?:\.exe)?(?:\s+-[A-Za-z]+)*\s+(?:-c\b|-\s|<<|-\s*<)", re.IGNORECASE
)
# A command whose whole point is one of the sanctioned paths.
SANCTIONED_COMMAND = re.compile(
    r"\bneo4j-cli\b|\bpytest\b|\brun\.py\b|\bapplication\.py\b|\bflask\b|"
    r"app\.database\.tools\.|app\.database\.cypher_runner\.mcp\b|"
    r"app[\\/]database[\\/]graph_schema\.py|\bgit\b|\bgrep\b|\brg\b|\bsed\s+-n\b|\bcat\b|"
    r"\bhead\b|\btail\b|Select-String|Get-Content",
    re.IGNORECASE,
)

# Python files that may import the raw neo4j driver (relative to the project root).
RAW_DRIVER_ALLOWED_DIRS = (
    Path("app/database/cypher_runner/mcp"),
    Path("app/database/pyvis"),
    Path("app/graphRag"),
)
# Where app Python that talks to the graph legitimately lives.
APP_DIRS = (Path("app"), Path("tests"))
# The gate's own folder, so editing this file is not blocked by this file.
SELF_DIR = Path(".claude/hooks")

USE_INSTEAD = (
    "Graph access from a session goes through one of three paths: the HTTP API "
    "(queries/<domain> via Flask), the MCP server, or neo4j-cli from a terminal. "
    "From here use neo4j-cli directly, or the wrappers:\n"
    "  python -m app.database.cypher_runner.run_query --list | --query <name> --param k=v\n"
    "  python -m app.database.cypher_runner.run_file <file.cypher> [--execute]\n"
    "  neo4j-cli query :schema --format toon\n"
    "  neo4j-cli query 'MATCH ...' --format toon      (writes need --rw; ask first)\n"
    "See app/database/cypher_runner/cli/README.md."
)


def _project_root(payload: dict) -> Path:
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    if env:
        return Path(env).resolve()
    cwd = payload.get("cwd")
    if cwd:
        return Path(cwd).resolve()
    return Path.cwd().resolve()


def _relative(path_str: str, root: Path) -> Path | None:
    """Path relative to the project root, or None when the file is outside it."""
    try:
        p = Path(path_str)
        if not p.is_absolute():
            p = root / p
        return p.resolve().relative_to(root)
    except (ValueError, OSError):
        return None


def _under(rel: Path | None, dirs) -> bool:
    if rel is None:
        return False
    return any(rel == d or d in rel.parents for d in dirs)


def check_command(command: str) -> str | None:
    """Return a refusal message, or None to allow."""
    if not command:
        return None
    # Only when cypher-shell is the thing being run: at the start of the command or
    # after a separator. A commit message or a grep that mentions it is not a call.
    if re.search(r"(?:^|[;&|\n(`]\s*|\$\(\s*)cypher-shell\b", command, re.IGNORECASE):
        return "cypher-shell opens Bolt directly. " + USE_INSTEAD
    if INLINE_PYTHON.search(command) and GRAPH_TOKENS.search(command):
        return (
            "Inline Python that reaches the graph is not a sanctioned access path. "
            + USE_INSTEAD
        )
    if re.search(r"(?:bolt|neo4j)(?:\+s{1,2}c?)?://|:7687\b", command, re.IGNORECASE):
        if not SANCTIONED_COMMAND.search(command):
            return "This command carries a Bolt address. " + USE_INSTEAD
    return None


def check_file_write(path_str: str, content: str, root: Path) -> str | None:
    """Return a refusal message, or None to allow."""
    if not path_str or not content:
        return None
    if not path_str.lower().endswith(".py"):
        return None
    rel = _relative(path_str, root)
    if _under(rel, (SELF_DIR,)):
        return None
    if _under(rel, APP_DIRS):
        if _under(rel, RAW_DRIVER_ALLOWED_DIRS) or _under(rel, (Path("tests"),)):
            return None
        if RAW_DRIVER.search(content):
            return (
                f"{path_str}: app code does not import the raw neo4j driver. The HTTP "
                "API path uses neomodel through app/database/queries; the MCP server owns "
                "the only driver under cypher_runner. " + USE_INSTEAD
            )
        return None
    # Outside app/ and tests/: scratch, temp, repo root, claude_files, anywhere.
    if GRAPH_TOKENS.search(content):
        return (
            f"{path_str}: a Python file outside app/ and tests/ that talks to the graph "
            "is an ad-hoc query script. " + USE_INSTEAD
        )
    return None


def decide(payload: dict) -> str | None:
    tool = payload.get("tool_name", "")
    inp = payload.get("tool_input") or {}
    root = _project_root(payload)

    if tool in ("Bash", "PowerShell"):
        return check_command(inp.get("command", "") or "")

    if tool == "Write":
        return check_file_write(inp.get("file_path", ""), inp.get("content", "") or "", root)

    if tool == "Edit":
        return check_file_write(inp.get("file_path", ""), inp.get("new_string", "") or "", root)

    if tool == "MultiEdit":
        joined = "\n".join((e.get("new_string") or "") for e in inp.get("edits") or [])
        return check_file_write(inp.get("file_path", ""), joined, root)

    return None


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0  # malformed input: never block on our own bug
    reason = decide(payload)
    if reason:
        sys.stderr.write("graph-access-gate: " + reason + "\n")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
