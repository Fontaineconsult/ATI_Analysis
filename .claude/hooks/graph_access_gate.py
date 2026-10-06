"""PreToolUse gate: graph work goes through neo4j-cli; app work may run the app.

The graph has three access paths:
    1. the HTTP API   Flask endpoints over app/database/queries/<domain> (neomodel).
                      The running app's path. App development runs it and reads it.
    2. the MCP server app/database/cypher_runner/mcp; Claude Desktop and IDE clients.
    3. neo4j-cli      graph work from any agent session, in every conversation: skills,
                      curation, ingest, data reads and writes. run_query / run_file wrap it.

The line is the KIND of work, not the tool. Developing the app: start Flask, call its
endpoints, check responses. Changing graph data: neo4j-cli, never the API standing in
for a data edit. A write endpoint under development is tested with pytest's
flask_client on sentinel data, not by curl against the live graph.

What this gate refuses, from any agent session in this repo:
    - a WRITE request to the data-api (PUT / POST / PATCH / DELETE, or a request body)
      through curl, wget, Invoke-WebRequest, Invoke-RestMethod, requests or httpx. GET
      requests and starting the Flask app pass;
    - inline Python that reaches the graph (python -c / python - / heredoc) when it
      names a driver, neomodel, the queries layer, or a Bolt address;
    - cypher-shell, or any command that carries a Bolt URI or the Bolt port, unless
      the command is one of the sanctioned entry points (pytest, the admin tools under
      app/database/tools, the MCP server, neo4j-cli itself);
    - writing a Python file that imports the raw neo4j driver anywhere except the
      packages that already own one (the MCP executor and two legacy visualisers);
    - writing a Python file outside app/ and tests/ that touches the graph at all, or
      that writes through the data-api (a scratch script is exactly the thing this stops).

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

# An HTTP client in a command or script, and the data-api it would be aimed at.
HTTP_CLIENT = re.compile(
    r"\bcurl\b|\bwget\b|Invoke-WebRequest|Invoke-RestMethod|\biwr\b|\birm\b|"
    r"\brequests\.(?:get|post|put|patch|delete|request|Session)\b|\bhttpx\b|\burllib\b|\bfetch\(",
    re.IGNORECASE,
)
DATA_API = re.compile(r"/data-api\b", re.IGNORECASE)
# The request writes: an explicit write method, or a body (curl -d implies POST).
HTTP_WRITE = re.compile(
    r"(?:-X|--request)\s*[\"']?(?:PUT|POST|PATCH|DELETE)\b|"
    r"\s(?:-d|--data(?:-raw|-binary|-urlencode)?|--json|-F|--form|--post-data)(?:\s|=|$)|"
    r"-Method\s+[\"']?(?:Put|Post|Patch|Delete)\b|"
    r"\b(?:requests|httpx)\.(?:post|put|patch|delete)\b|"
    r"method\s*[=:]\s*[\"'](?:PUT|POST|PATCH|DELETE)[\"']",
    re.IGNORECASE,
)
# Commands that only mention these things (a commit message, a search) are not calls.
MENTION_ONLY = re.compile(r"^\s*(?:git|grep|rg|Select-String)\b", re.IGNORECASE)

API_WRITE_REFUSED = (
    "This writes graph data through the HTTP API. Graph work (skills, curation, data "
    "edits) goes through neo4j-cli: a batch file via run_file --execute, or neo4j-cli "
    "query --rw after asking. When the app function has side effects (update_plan to "
    "Completed creates an Accomplishment; add_person sets neomodel defaults), read it "
    "and reproduce them in the Cypher. If this is app development testing a write "
    "endpoint, test it with pytest's flask_client on sentinel data (tests/conftest.py), "
    "not against the live graph. Starting Flask and GET requests are fine."
)

USE_INSTEAD = (
    "Graph work from an agent session goes through neo4j-cli. App development may run "
    "Flask and read its endpoints. Use:\n"
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
    if (not MENTION_ONLY.search(command) and HTTP_CLIENT.search(command)
            and DATA_API.search(command) and HTTP_WRITE.search(command)):
        return API_WRITE_REFUSED
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
                f"{path_str}: app code does not import the raw neo4j driver. The app "
                "uses neomodel through app/database/queries; the MCP server owns the only "
                "driver under cypher_runner. " + USE_INSTEAD
            )
        return None
    # Outside app/ and tests/: scratch, temp, repo root, claude_files, anywhere.
    if HTTP_CLIENT.search(content) and DATA_API.search(content) and HTTP_WRITE.search(content):
        return f"{path_str}: " + API_WRITE_REFUSED
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
