"""
The pope_tech_integration service.

ptq is replaced by a fake `pope_tech.query_cli` module in a temp folder that
writes snapshot files the way `ptq metric-snapshot --out` does. The folder is
located through ATI_SERVICE_POPE_TECH_DIR exactly as the real one is, so the
registry path is exercised and nothing reaches Pope Tech. Graph writes use
the sentinel year and are deleted by composite-key prefix.
"""
import asyncio
import json
import sys
import textwrap
from pathlib import Path

import pytest
from neomodel import db

from app.services.pope_tech_integration import config
from app.services.pope_tech_integration.fetch import build_args, read_snapshots
from app.services.pope_tech_integration.service import pull_metric_snapshots

SENTINEL = "9999-9999"
SCHEMA = config.SNAPSHOT_SCHEMA

FAKE_PTQ = textwrap.dedent('''
    import json, os, sys
    args = sys.argv[1:]
    assert args[0] == "metric-snapshot", args
    assert "--write" not in args
    out = args[args.index("--out") + 1]
    # Like the real ptq: one --org per call, or --all-orgs.
    org_flags = [args[i + 1] for i, a in enumerate(args) if a == "--org"]
    if len(org_flags) > 1:
        sys.exit("ptq takes a single --org")
    orgs = org_flags or ["sfsu", "ssu"]
    dates = [args[i + 1] for i, a in enumerate(args) if a == "--as-of"] or ["2026-10-01"]
    if any(len(d) != 10 for d in dates):
        sys.exit(2)
    for org in orgs:
        for d in dates:
            has_data = d != "2020-01-01"
            snap = {
                "schema": "popetech-metric-snapshot/1",
                "org": {"slug": org + "-slug", "campus": org, "name": org.upper()},
                "as_of": d,
                "has_data": has_data,
                "errors": {"excl_contrast": 10472, "categories": {}},
            }
            with open(os.path.join(out, f"{org}_{d}.json"), "w") as f:
                json.dump(snap, f)
            with open(os.path.join(out, f"{org}_{d}_breakdown.json"), "w") as f:
                json.dump({"raw": True}, f)
    sys.exit(int(os.environ.get("FAKE_PTQ_EXIT", "0")))
''')


def _snapshot(**over):
    snap = {
        "schema": SCHEMA,
        "org": {"slug": "san-francisco-state-university", "campus": "sfsu", "name": "SFSU"},
        "as_of": "2026-10-01",
        "has_data": True,
        "errors": {"excl_contrast": 10472},
    }
    snap.update(over)
    return snap


@pytest.fixture
def fake_ptq(tmp_path, monkeypatch):
    package = tmp_path / "integrator" / "pope_tech"
    package.mkdir(parents=True)
    (package / "__init__.py").write_text("", encoding="utf-8")
    (package / "query_cli.py").write_text(FAKE_PTQ, encoding="utf-8")
    monkeypatch.setenv("ATI_SERVICE_POPE_TECH_DIR", str(package.parent))
    monkeypatch.setenv("ATI_SERVICE_POPE_TECH_PYTHON", sys.executable)
    monkeypatch.setenv("ATI_SERVICES_DATA_DIR", str(tmp_path / "runs"))
    return package


@pytest.fixture
def cleanup_service_metrics(neo4j_connection):
    yield
    db.cypher_query(
        "MATCH (m:Metric) WHERE m.composite_key STARTS WITH $prefix DETACH DELETE m",
        {"prefix": SENTINEL},
    )


# --- Fetch: no database ------------------------------------------------------

@pytest.mark.unit
def test_build_args_is_read_only_and_scoped():
    args = build_args("/out", org="sfsu", as_of=["2026-10-01", "2026-09-01"])
    assert args == ["metric-snapshot", "--out", "/out", "--org", "sfsu",
                    "--as-of", "2026-10-01", "--as-of", "2026-09-01"]
    assert "--write" not in build_args("/out")
    assert "--all-orgs" in build_args("/out")


@pytest.mark.unit
def test_read_snapshots_skips_breakdown_files(tmp_path):
    (tmp_path / "sfsu_2026-10-01.json").write_text(json.dumps(_snapshot()))
    (tmp_path / "sfsu_2026-10-01_breakdown.json").write_text("{}")
    assert [s["as_of"] for s in read_snapshots(tmp_path)] == ["2026-10-01"]


@pytest.mark.unit
def test_fetch_only_run_keeps_files_and_saves_nothing(fake_ptq):
    result = asyncio.run(pull_metric_snapshots(academic_year=SENTINEL, orgs=["sfsu"]))
    assert result.ok and result.saved == []
    assert [s["reason"] for s in result.skipped] == ["not saved (save=False)"]
    assert sorted(p.name for p in Path(result.run_dir).iterdir()) == [
        "sfsu_2026-10-01.json", "sfsu_2026-10-01_breakdown.json"]


@pytest.mark.unit
def test_several_orgs_make_one_call_each(fake_ptq):
    result = asyncio.run(pull_metric_snapshots(
        academic_year=SENTINEL, orgs=["sfsu", "ssu", "csueb"]))
    assert result.ok, result.errors
    assert sorted(s["item"] for s in result.skipped) == [
        "csueb 2026-10-01", "sfsu 2026-10-01", "ssu 2026-10-01"]


@pytest.mark.unit
def test_bad_date_fails_the_run(fake_ptq):
    result = asyncio.run(pull_metric_snapshots(academic_year=SENTINEL, as_of=["2026-10"]))
    assert not result.ok
    assert "not YYYY-MM-DD" in result.errors[0]


@pytest.mark.unit
def test_unconfigured_integrator_fails_the_run_before_calling_out(tmp_path, monkeypatch):
    monkeypatch.setenv("ATI_SERVICE_POPE_TECH_DIR", str(tmp_path / "missing"))
    monkeypatch.setenv("ATI_SERVICES_DATA_DIR", str(tmp_path / "runs"))
    result = asyncio.run(pull_metric_snapshots(academic_year=SENTINEL))
    assert not result.ok
    assert "ATI_SERVICE_POPE_TECH_DIR points at a missing folder" in result.errors[0]


# --- Store: payload shape -----------------------------------------------------

@pytest.mark.unit
def test_metric_dict_for_a_snapshot():
    from app.services.pope_tech_integration.store import snapshot_metric_dict

    d = snapshot_metric_dict(_snapshot(), "2025-2026")
    assert d["composite_key"] == "2025-2026_popetech_sfsu_2026-10-01"
    assert d["name"] == "Pope Tech WAVE errors (sfsu)"
    assert d["single_value"] == "10472"
    assert d["value_schema"] == SCHEMA and d["measured_on"] == "2026-10-01"
    assert d["academic_year"] == "2025-2026"


@pytest.mark.unit
@pytest.mark.parametrize("over", [{"schema": "other/1"}, {"has_data": False}, {"org": {}}])
def test_unusable_snapshots_are_refused(over):
    from app.endpoints.data_api.errors.custom_exceptions import ValidationError
    from app.services.pope_tech_integration.store import snapshot_metric_dict

    with pytest.raises(ValidationError):
        snapshot_metric_dict(_snapshot(**over), "2025-2026")


# --- Emitter: batch file for a reviewed load, no database ----------------------

@pytest.mark.unit
def test_emitter_writes_one_idempotent_statement_per_usable_snapshot(tmp_path):
    from app.services.pope_tech_integration.emit_cypher import build

    snap = _snapshot(org={"campus": "sfsu", "name": "O'Brien University"})
    (tmp_path / "sfsu_2026-10-01.json").write_text(json.dumps(snap))
    (tmp_path / "sfsu_2026-10-01_breakdown.json").write_text("{}")
    (tmp_path / "ssu_2026-10-01.json").write_text(json.dumps(
        _snapshot(org={"campus": "ssu"}, has_data=False)))

    text, keys = build(tmp_path, "2025-2026", {"sfsu": "SFSU T", "ssu": "SSU T"})

    assert keys == ["2025-2026_popetech_sfsu_2026-10-01"]
    assert "MERGE (m:Metric {composite_key: '2025-2026_popetech_sfsu_2026-10-01'})" in text
    assert "MATCH (t:Tracking {title: 'SFSU T'})" in text
    assert "r.included_in_years = ['2025-2026']" in text
    assert "// Left out: ssu 2026-10-01: no scan data" in text
    # The quote in the name is escaped, so the statement stays one valid literal.
    assert "O\\'Brien University" in text
    # Each statement ends with ';' on its own last line, as run_file splits.
    assert text.count(";\n") == 1


# --- Store and service: live graph, sentinel year ----------------------------

# A sentinel Tracking, so the save tests never attach anything to a real one.
TEST_TRACKING = f"{SENTINEL} Pope Tech test tracking"
TEST_TRACKINGS = {"sfsu": TEST_TRACKING}


@pytest.fixture
def sentinel_tracking(neo4j_connection):
    db.cypher_query(
        "MERGE (t:Tracking {title: $title}) "
        "ON CREATE SET t.unique_id = replace(randomUUID(), '-', ''), t.retired = false",
        {"title": TEST_TRACKING},
    )
    yield TEST_TRACKING
    db.cypher_query("MATCH (t:Tracking) WHERE t.title STARTS WITH $prefix DETACH DELETE t",
                    {"prefix": SENTINEL})


def _save(**over):
    kwargs = dict(academic_year=SENTINEL, orgs=["sfsu"], save=True,
                  tracking_titles=TEST_TRACKINGS)
    kwargs.update(over)
    return asyncio.run(pull_metric_snapshots(**kwargs))


@pytest.mark.integration
def test_saved_run_writes_one_metric_per_snapshot(
        fake_ptq, cleanup_service_metrics, sentinel_academic_year, sentinel_tracking):
    from app.database.graph_schema import Metric

    result = _save(as_of=["2026-09-01", "2026-10-01", "2020-01-01"])

    assert result.ok
    assert sorted(result.saved) == [f"{SENTINEL}_popetech_sfsu_2026-09-01",
                                    f"{SENTINEL}_popetech_sfsu_2026-10-01"]
    # The date with no data is skipped with its reason; the others still save.
    assert any("no scan data" in s["reason"] for s in result.skipped)

    metric = Metric.nodes.get(composite_key=f"{SENTINEL}_popetech_sfsu_2026-10-01")
    out = metric.serialize()
    assert out["data"]["as_of"] == "2026-10-01"
    assert out["value_schema"] == SCHEMA
    assert [ay.name for ay in metric.academic_year.all()] == [SENTINEL]


@pytest.mark.integration
def test_saved_metrics_hang_off_the_campus_tracking_for_that_year(
        fake_ptq, cleanup_service_metrics, sentinel_academic_year, sentinel_tracking):
    _save(as_of=["2026-09-01", "2026-10-01"])

    rows, _ = db.cypher_query(
        "MATCH (t:Tracking {title: $title})-[r:has_metric]->(m:Metric) "
        "RETURN m.composite_key, r.included_in_years ORDER BY m.composite_key",
        {"title": TEST_TRACKING},
    )
    assert rows == [
        [f"{SENTINEL}_popetech_sfsu_2026-09-01", [SENTINEL]],
        [f"{SENTINEL}_popetech_sfsu_2026-10-01", [SENTINEL]],
    ]


@pytest.mark.integration
def test_a_missing_tracking_leaves_no_orphan_metric(
        fake_ptq, cleanup_service_metrics, sentinel_academic_year):
    from app.database.graph_schema import Metric

    result = _save(tracking_titles={"sfsu": f"{SENTINEL} no such tracking"})
    assert not result.saved
    assert "does not exist" in result.skipped[0]["reason"]
    assert Metric.nodes.get_or_none(composite_key=f"{SENTINEL}_popetech_sfsu_2026-10-01") is None


@pytest.mark.integration
def test_a_second_run_skips_what_is_already_stored(
        fake_ptq, cleanup_service_metrics, sentinel_academic_year, sentinel_tracking):
    first = _save(as_of=["2026-10-01"])
    second = _save(as_of=["2026-10-01"])
    assert first.saved and not second.saved
    assert "already exists" in second.skipped[0]["reason"]


@pytest.mark.integration
def test_partial_ptq_run_still_saves(fake_ptq, cleanup_service_metrics,
                                     sentinel_academic_year, sentinel_tracking, monkeypatch):
    monkeypatch.setenv("FAKE_PTQ_EXIT", "5")
    result = _save()
    assert result.ok and result.saved
    assert result.skipped[0]["item"] == "ptq"
