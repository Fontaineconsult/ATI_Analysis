"""The terminal path to the graph runs through neo4j-cli and nothing else.

Pure unit tests: no database, no CLI binary. The transport is exercised with a fake
subprocess, and the permission hook with sample tool payloads.
"""
from __future__ import annotations

import importlib.util
import json
import re
import subprocess
from pathlib import Path

import pytest

from app.database.cypher_runner import registry, run_file, run_query
from app.database.cypher_runner.cli import transport

pytestmark = pytest.mark.unit

REPO = Path(__file__).resolve().parents[1]
FAKE_CLI = "C:/fake/neo4j-cli.exe"


# --------------------------------------------------------------------------- #
# No driver on the CLI path                                                    #
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "module_path",
    [
        "app/database/cypher_runner/run_query.py",
        "app/database/cypher_runner/run_file.py",
        "app/database/cypher_runner/registry.py",
        "app/database/cypher_runner/cli/transport.py",
        "app/database/cypher_runner/cli/__init__.py",
    ],
)
def test_cli_path_modules_import_no_driver(module_path):
    source = (REPO / module_path).read_text(encoding="utf-8")
    imports = [ln for ln in source.splitlines() if re.match(r"\s*(from|import)\s", ln)]
    for needle in ("neo4j", "neomodel", "config_gateway"):
        offenders = [ln for ln in imports if needle in ln]
        assert not offenders, f"{module_path} must not reach the graph via {offenders}"
    assert "GraphDatabase" not in source


def test_mcp_owns_its_connection():
    source = (REPO / "app/database/cypher_runner/mcp/executor.py").read_text(encoding="utf-8")
    assert "from .connection import resolve_connection" in source
    assert "run_query" not in source
    assert not hasattr(run_query, "resolve_connection")
    assert not hasattr(run_query, "run_cypher")


# --------------------------------------------------------------------------- #
# Transport                                                                    #
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "value, expected",
    [
        ("Web", 'wg="Web"'),
        ("2025", 'wg="2025"'),
        ("true", 'wg="true"'),
        (7, "wg=7"),
        (1.5, "wg=1.5"),
        (True, "wg=true"),
        (None, "wg=null"),
        ("2025-2026 1.1-web", 'wg="2025-2026 1.1-web"'),
    ],
)
def test_format_param_json_encodes_every_value(value, expected):
    assert transport.format_param("wg", value) == expected


def test_build_command_read_default_has_no_rw():
    cmd = transport.build_command({"a": "x"}, cli=FAKE_CLI)
    assert cmd[:2] == [FAKE_CLI, "query"]
    assert "--rw" not in cmd
    assert "--atomic" not in cmd
    assert cmd[cmd.index("--format") + 1] == "json"
    assert cmd[cmd.index("--max-rows") + 1] == "0"
    assert cmd[-2:] == ["--param", 'a="x"']


def test_build_command_write_is_explicit():
    cmd = transport.build_command(rw=True, atomic=True, fmt="table", cli=FAKE_CLI)
    assert "--rw" in cmd and "--atomic" in cmd
    assert cmd[cmd.index("--format") + 1] == "table"


def test_build_command_never_puts_cypher_in_argv():
    cmd = transport.build_command({"k": "v"}, cli=FAKE_CLI)
    assert not any("MATCH" in part for part in cmd)


def test_find_cli_honours_override(monkeypatch, tmp_path):
    exe = tmp_path / "neo4j-cli.exe"
    exe.write_bytes(b"")
    monkeypatch.setenv(transport.ENV_OVERRIDE, str(exe))
    assert transport.find_cli() == str(exe)


def test_find_cli_missing_gives_install_hint(monkeypatch):
    monkeypatch.delenv(transport.ENV_OVERRIDE, raising=False)
    monkeypatch.setenv("LOCALAPPDATA", "C:/nowhere")
    monkeypatch.setattr(transport.shutil, "which", lambda _: None)
    with pytest.raises(transport.CliNotFound) as exc:
        transport.find_cli()
    assert "neo4j.sh" in str(exc.value)


def _fake_run(returncode=0, stdout="", stderr=""):
    calls = []

    def fake(cmd, **kwargs):
        calls.append((cmd, kwargs))
        return subprocess.CompletedProcess(cmd, returncode, stdout, stderr)

    return fake, calls


def test_run_feeds_cypher_over_stdin(monkeypatch):
    fake, calls = _fake_run(stdout='{"columns":["n"],"rows":[{"n":1}],"truncated":false}')
    monkeypatch.setattr(transport.subprocess, "run", fake)
    monkeypatch.setattr(transport, "find_cli", lambda: FAKE_CLI)
    result = transport.run("RETURN 1 AS n", {"x": 1})
    cmd, kwargs = calls[0]
    assert kwargs["input"] == "RETURN 1 AS n"
    assert cmd[0] == FAKE_CLI
    assert result.rows() == [{"n": 1}]


def test_run_raises_on_failure_with_envelope_message(monkeypatch):
    err = json.dumps({"error": {"code": "validation_error", "exit_code": 6, "message": "boom"}})
    fake, _ = _fake_run(returncode=6, stdout=err, stderr="warning: connecting to x over cleartext")
    monkeypatch.setattr(transport.subprocess, "run", fake)
    monkeypatch.setattr(transport, "find_cli", lambda: FAKE_CLI)
    with pytest.raises(transport.CliError) as exc:
        transport.run("RETURN 1")
    assert "boom" in str(exc.value)
    assert exc.value.result.warnings() == ""


def test_envelopes_handle_array_then_error_shape():
    stdout = (
        '[{"columns":["a"],"rows":[]},{"columns":["b"],"rows":[]}]\n'
        '{"error":{"code":"validation_error","exit_code":6,"message":"1 of 3 statements failed"}}\n'
    )
    result = transport.CliResult(6, stdout, "")
    envs = result.envelopes()
    assert len(envs) == 3
    assert result.error()["message"] == "1 of 3 statements failed"
    assert result.rows() == []


def test_join_statements_terminates_each_at_end_of_line():
    text = transport.join_statements(["MATCH (a) RETURN a", "  RETURN 2  ", ""])
    assert text == "MATCH (a) RETURN a;\nRETURN 2;\n"


# --------------------------------------------------------------------------- #
# run_query                                                                    #
# --------------------------------------------------------------------------- #
def test_registry_loads_and_run_query_reexports():
    reg = registry.load_registry()
    assert "list_campuses" in reg
    assert run_query.load_registry is registry.load_registry


def test_run_query_offline_modes_need_no_cli(capsys, monkeypatch):
    monkeypatch.setattr(transport, "find_cli", lambda: (_ for _ in ()).throw(transport.CliNotFound("no")))
    assert run_query.main(["--validate"]) == 0
    assert run_query.main(["--list"]) == 0
    assert run_query.main(["--show", "list_campuses"]) == 0
    out = capsys.readouterr().out
    assert "queries valid" in out and "list_campuses" in out


def test_run_query_write_needs_allow_write():
    with pytest.raises(SystemExit) as exc:
        run_query.main(["--query", "set_yse_status", "--param", "year_identifier=x",
                        "--param", "status_level=Initiated"])
    assert "--allow-write" in str(exc.value)


def test_run_query_delegates_to_cli(monkeypatch, capsys):
    seen = {}

    def fake_run(cypher, params=None, **kwargs):
        seen.update(cypher=cypher, params=params, **kwargs)
        return transport.CliResult(0, '{"columns":["n"],"rows":[{"n":3}]}\n', "")

    monkeypatch.setattr(transport, "run", fake_run)
    assert run_query.main(["--query", "list_campuses"]) == 0
    assert seen["rw"] is False and seen["fmt"] == "json"
    assert "MATCH" in seen["cypher"]
    assert '{"n":3}' in capsys.readouterr().out


def test_run_query_allow_write_passes_rw(monkeypatch):
    seen = {}

    def fake_run(cypher, params=None, **kwargs):
        seen.update(params=params, **kwargs)
        return transport.CliResult(0, "{}", "")

    monkeypatch.setattr(transport, "run", fake_run)
    rc = run_query.main(["--query", "set_yse_status", "--param", "year_identifier=2025-2026 1.1-web",
                         "--param", "status_level=Initiated", "--allow-write", "--table"])
    assert rc == 0
    assert seen["rw"] is True and seen["fmt"] == "table"
    assert seen["params"] == {"year_identifier": "2025-2026 1.1-web", "status_level": "Initiated"}


def test_run_query_print_command_shows_invocation(monkeypatch, capsys):
    monkeypatch.setattr(transport, "find_cli", lambda: FAKE_CLI)
    assert run_query.main(["--query", "list_campuses", "--print-command"]) == 0
    out = capsys.readouterr().out
    assert "neo4j-cli" in out and "query" in out and "MATCH" in out
    assert "--rw" not in out


# --------------------------------------------------------------------------- #
# run_file                                                                     #
# --------------------------------------------------------------------------- #
SAMPLE = """// header comment
MATCH (c:Campus {abbreviation: "sfsu"})
MERGE (c)-[:has_thing]->(:Thing {name: "x; not a terminator"});
// another
MERGE (:Thing {name: "y"});
"""


def test_split_statements_contract_unchanged():
    stmts = run_file.split_statements(SAMPLE)
    assert len(stmts) == 2
    assert stmts[0].startswith("MATCH (c:Campus")
    assert "not a terminator" in stmts[0]


def test_validate_batches_then_names_the_failing_statement(monkeypatch, capsys):
    calls = []

    def fake_run(cypher, params=None, **kwargs):
        calls.append(cypher)
        assert kwargs.get("rw") is not True, "validation must never pass --rw"
        assert cypher.startswith("EXPLAIN ")
        if "BROKEN" in cypher:
            return transport.CliResult(
                6, '{"error":{"code":"validation_error","exit_code":6,"message":"SyntaxError near BROKEN"}}', "")
        return transport.CliResult(0, "[]", "")

    monkeypatch.setattr(transport, "run", fake_run)
    ok = run_file.validate(["RETURN 1", "MATCH (BROKEN", "RETURN 2"])
    out = capsys.readouterr().out
    assert ok is False
    assert "FAIL #002" in out and "SyntaxError near BROKEN" in out
    assert "2/3 statements OK" in out
    assert len(calls) == 4  # one batch, then one per statement


def test_validate_clean_file_is_one_call(monkeypatch, capsys):
    calls = []

    def fake_run(cypher, params=None, **kwargs):
        calls.append(cypher)
        return transport.CliResult(0, "[]", "")

    monkeypatch.setattr(transport, "run", fake_run)
    assert run_file.validate(["RETURN 1", "RETURN 2"]) is True
    assert len(calls) == 1
    assert calls[0] == "EXPLAIN RETURN 1;\nEXPLAIN RETURN 2;\n"
    assert "2/2 statements OK" in capsys.readouterr().out


def test_execute_is_rw_atomic_single_call(monkeypatch, capsys):
    seen = {}

    def fake_run(cypher, params=None, **kwargs):
        seen.update(cypher=cypher, **kwargs)
        return transport.CliResult(0, "[]", "")

    monkeypatch.setattr(transport, "run", fake_run)
    assert run_file.execute(["MERGE (:A)", "MERGE (:B)"]) is True
    assert seen["rw"] is True and seen["atomic"] is True
    assert seen["cypher"] == "MERGE (:A);\nMERGE (:B);\n"
    assert "no write counters" in capsys.readouterr().out


def test_execute_failure_reports_rollback(monkeypatch, capsys):
    def fake_run(cypher, params=None, **kwargs):
        return transport.CliResult(1, '{"error":{"code":"x","exit_code":1,"message":"constraint"}}', "")

    monkeypatch.setattr(transport, "run", fake_run)
    assert run_file.execute(["MERGE (:A)"]) is False
    out = capsys.readouterr().out
    assert "rolled back" in out and "constraint" in out


def test_gates_block_execution(monkeypatch, tmp_path, capsys):
    f = tmp_path / "x.cypher"
    f.write_text("MERGE (:A);\n", encoding="utf-8")
    monkeypatch.setattr(transport, "find_cli", lambda: FAKE_CLI)
    monkeypatch.setattr(transport, "run", lambda *a, **k: transport.CliResult(0, "[]", ""))
    monkeypatch.setattr(run_file, "GATES", [lambda stmts: [f"gate says no to {len(stmts)}"]])
    assert run_file.main([str(f), "--execute"]) == 1
    assert "GATE gate says no to 1" in capsys.readouterr().out


def test_main_validate_only_does_not_execute(monkeypatch, tmp_path, capsys):
    f = tmp_path / "x.cypher"
    f.write_text("MERGE (:A);\n", encoding="utf-8")
    seen = []
    monkeypatch.setattr(transport, "find_cli", lambda: FAKE_CLI)
    monkeypatch.setattr(transport, "run",
                        lambda cypher, params=None, **k: (seen.append(k), transport.CliResult(0, "[]", ""))[1])
    assert run_file.main([str(f)]) == 0
    assert all(k.get("rw") is not True for k in seen)
    assert "Validate-only" in capsys.readouterr().out


def test_main_without_cli_is_a_config_error(monkeypatch, tmp_path):
    f = tmp_path / "x.cypher"
    f.write_text("MERGE (:A);\n", encoding="utf-8")
    monkeypatch.setattr(transport, "find_cli",
                        lambda: (_ for _ in ()).throw(transport.CliNotFound("missing")))
    assert run_file.main([str(f)]) == 2


# --------------------------------------------------------------------------- #
# The permission hook                                                          #
# --------------------------------------------------------------------------- #
@pytest.fixture(scope="module")
def gate():
    path = REPO / ".claude" / "hooks" / "graph_access_gate.py"
    spec = importlib.util.spec_from_file_location("graph_access_gate", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _cmd(command):
    return {"tool_name": "Bash", "tool_input": {"command": command}, "cwd": str(REPO)}


def _write(path, content, tool="Write"):
    key = "content" if tool == "Write" else "new_string"
    return {"tool_name": tool, "tool_input": {"file_path": path, key: content}, "cwd": str(REPO)}


@pytest.mark.parametrize(
    "command",
    [
        'python -c "from neo4j import GraphDatabase; GraphDatabase.driver(\'bolt://h:7687\')"',
        ".venv/Scripts/python.exe -c 'from neomodel import db; db.cypher_query(\"MATCH (n) RETURN n\")'",
        "python - <<'EOF'\nfrom app.database.queries.evidence.read import x\nEOF",
        "PYTHONPATH=. python -c \"from app import create_app; create_app()\"",
        "cypher-shell -a bolt://130.212.104.18:7687",
        "curl http://130.212.104.18:7687",
        "python scratch.py --uri bolt://x:7687",
        # Graph data written through the HTTP API: graph work goes through neo4j-cli.
        "curl -s -X PUT http://127.0.0.1:5001/ati/data-api/v1/individuals -H 'Content-Type: application/json' -d '{}'",
        "curl -s http://127.0.0.1:5000/ati/data-api/v1/individuals -d '{\"action\":\"add_person\"}'",
        "curl --request DELETE http://localhost:5000/ati/data-api/v1/plans/abc",
        "Invoke-RestMethod -Method Post -Uri http://127.0.0.1:5000/ati/data-api/v1/follow-ups",
        "wget --post-data='x=1' http://127.0.0.1:5000/ati/data-api/v1/plans",
        "python -c \"import requests; requests.post('http://127.0.0.1:5000/ati/data-api/v1/x')\"",
    ],
)
def test_gate_blocks_direct_graph_access(gate, command):
    assert gate.decide(_cmd(command)) is not None


@pytest.mark.parametrize(
    "command",
    [
        "neo4j-cli query 'MATCH (n) RETURN count(n)' --format toon",
        "neo4j-cli credential dbms add --name x --uri bolt://h:7687 --username u --password p --rw",
        "python -m app.database.cypher_runner.run_query --list",
        "python -m app.database.cypher_runner.run_file f.cypher --execute",
        "pytest tests/test_followup.py -v",
        "python -m app.database.tools.create_new_ay_campus",
        "python -m app.database.cypher_runner.mcp --self-test",
        "PYTHONPATH=. python app/database/graph_schema.py",
        # App development: run the app and read its endpoints.
        "python run.py",
        ".venv/Scripts/python.exe app/application.py",
        "$env:FLASK_RUN_PORT='5001'; & .\\.venv\\Scripts\\python.exe app\\application.py",
        "flask run --port 5001",
        "curl -s http://localhost:5000/ati/data-api/v1/communities?view=by_working_group",
        "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:5001/ati/data-api/v1/communities",
        "Invoke-RestMethod -Uri http://127.0.0.1:5000/ati/data-api/v1/plans",
        # Mentions and unrelated HTTP are not writes to the data-api.
        "git commit -m 'refuse curl -X PUT at /data-api from agent sessions'",
        "grep -rn data-api .claude/skills",
        "curl -sL https://www.sfbrn.calstate.edu/accessible -o p1.html",
        "npm start",
        "grep -rn bolt:// app",
        "git log --oneline -5",
        "python -c \"import secrets; print(secrets.token_hex(32))\"",
        "npm test",
        "git commit -m 'refuse cypher-shell and stray bolt:// URIs'",
        "grep -rn cypher-shell .claude/hooks",
    ],
)
def test_gate_allows_sanctioned_paths(gate, command):
    assert gate.decide(_cmd(command)) is None


def test_gate_blocks_raw_driver_in_new_app_code(gate):
    payload = _write(str(REPO / "app/database/queries/evidence/read.py"),
                     "from neo4j import GraphDatabase\n")
    assert gate.decide(payload) is not None


def test_gate_allows_neomodel_in_app_code(gate):
    payload = _write(str(REPO / "app/database/queries/evidence/read.py"),
                     "from neomodel import db\nrows, _ = db.cypher_query('MATCH (n) RETURN n')\n")
    assert gate.decide(payload) is None


def test_gate_allows_the_mcp_executor_and_tests(gate):
    assert gate.decide(_write(str(REPO / "app/database/cypher_runner/mcp/executor.py"),
                              "from neo4j import GraphDatabase\n")) is None
    assert gate.decide(_write(str(REPO / "tests/test_x.py"),
                              "from neo4j import GraphDatabase\n")) is None


def test_gate_blocks_scratch_query_scripts(gate, tmp_path):
    scratch = tmp_path / "probe.py"
    payload = _write(str(scratch), "from neomodel import db\n")
    assert gate.decide(payload) is not None
    payload = _write(str(scratch), "from app.database.queries.evidence.read import x\n", tool="Edit")
    assert gate.decide(payload) is not None


def test_gate_blocks_scratch_scripts_that_write_through_the_data_api(gate, tmp_path):
    content = "import requests\nrequests.put('http://127.0.0.1:5000/ati/data-api/v1/plans', json={})\n"
    assert gate.decide(_write(str(tmp_path / "bulk_update.py"), content)) is not None


def test_gate_allows_scratch_scripts_that_only_read_the_data_api(gate, tmp_path):
    content = "import requests\nprint(requests.get('http://127.0.0.1:5000/ati/data-api/v1/plans').json())\n"
    assert gate.decide(_write(str(tmp_path / "check_endpoint.py"), content)) is None


def test_gate_ignores_non_python_and_harmless_scripts(gate, tmp_path):
    assert gate.decide(_write(str(tmp_path / "notes.md"), "bolt://x:7687")) is None
    assert gate.decide(_write(str(tmp_path / "calc.py"), "print(2 + 2)\n")) is None


def test_gate_can_edit_itself(gate):
    payload = _write(str(REPO / ".claude/hooks/graph_access_gate.py"), "GraphDatabase bolt://")
    assert gate.decide(payload) is None


def test_gate_end_to_end_exit_codes(tmp_path):
    hook = REPO / ".claude" / "hooks" / "graph_access_gate.py"
    py = REPO / ".venv" / "Scripts" / "python.exe"
    if not py.exists():
        pytest.skip("project venv not present")
    blocked = subprocess.run([str(py), str(hook)], input=json.dumps(_cmd("cypher-shell")),
                             text=True, capture_output=True)
    assert blocked.returncode == 2 and "graph-access-gate" in blocked.stderr
    allowed = subprocess.run([str(py), str(hook)], input=json.dumps(_cmd("git status")),
                             text=True, capture_output=True)
    assert allowed.returncode == 0
