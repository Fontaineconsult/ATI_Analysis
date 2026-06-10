"""
Pytest fixtures and configuration for the ATI Analysis test suite.

Connection model
----------------
By default, tests run against the LIVE Neo4j database (whatever
`set_connection()` in `app/database/graph_schema.py` resolves to via
`app/.env.development`).

When NEO4J_TEST_DATABASE_URL and NEO4J_TEST_DATABASE are both set, tests
redirect to those values instead. Switching to a dedicated test graph in
the future is one env-var change — no test code edits required.

Test-data isolation (CRITICAL while we share the live DB)
---------------------------------------------------------
All test-created data is scoped to a sentinel academic year (`9999-9999`).

  - The sentinel `AcademicYear` node is created on first run and reused
    forever. It's a single benign node that never collides with real data.
  - All cleanup fixtures filter by identifier prefix (`STARTS WITH '9999-9999'`)
    so they cannot match production plans/YSE/etc., even if a test misuses
    them. There is no blanket `MATCH (n) DETACH DELETE n` anywhere — that
    would obliterate the live DB.
  - Real `Campus` / `SuccessIndicator` / `ATIWorkingGroup` / `Person` nodes
    are reused as-is (they're shared reference data) but never modified.

When a dedicated test graph exists, the safety constraint relaxes — cleanup
can become a blanket wipe between tests. Update this docstring and the
cleanup fixtures at that point.

Fixture conventions
-------------------
  - `neo4j_connection` (autouse, session-scope) — configures the driver.
  - `sentinel_academic_year` (session-scope) — the shared `9999-9999` node.
  - `cleanup_plan_family` (function-scope) — apply to tests that create
    CampusPlan / WorkingGroupPlan / ProgressUpdate via the factories.
  - `cleanup_yse_family` (function-scope) — apply to tests that create YSE.

Mark integration tests with `@pytest.mark.integration`. Run only those:
    pytest -m integration
Run only pure unit tests:
    pytest -m "not integration"
"""
import os

import pytest
from neomodel import config, db


TEST_ACADEMIC_YEAR_NAME = "9999-9999"  # Sentinel — never used by production data
# Previous-year sentinel for status-progression tests (tests create YSEs here
# to assert the "previous → current" status display). Same untouchable-prefix
# convention so production data is never matched.
TEST_PREVIOUS_ACADEMIC_YEAR_NAME = "9998-9998"


# --- One-time data_api warm-up ------------------------------------------------
#
# `app/endpoints/data_api/__init__.py` eagerly loads every endpoint module. Each
# endpoint imports from `app/database/queries/<domain>/<verb>.py`, and those
# queries modules import `custom_exceptions` from inside the data_api package.
#
# Under Flask boot this is fine — data_api is already mid-load by the time the
# queries modules ask for custom_exceptions, so the package just returns its
# partial state. Under a *test* import (cold start, no Flask), the queries
# module triggers data_api's first load, which calls back into the queries
# module mid-init → ImportError.
#
# Workaround: force a full Flask app build here, at conftest import time —
# before pytest imports any test_*.py file. After this runs, data_api is fully
# loaded; subsequent module-level imports in test files see the completed
# package and resolve cleanly.
#
# This is purely a test-side accommodation — no production code is changed.
def _warmup_data_api():
    from app import create_app
    create_app()  # discarded; we only need the import side-effect


_warmup_data_api()


@pytest.fixture(scope="session", autouse=True)
def neo4j_connection():
    """
    Configure the neomodel driver for the test session.

    Reads NEO4J_TEST_DATABASE_URL and NEO4J_TEST_DATABASE; falls back to the
    live `set_connection()` if either is unset.
    """
    test_url = os.environ.get("NEO4J_TEST_DATABASE_URL")
    test_db = os.environ.get("NEO4J_TEST_DATABASE")

    if test_url and test_db:
        config.DATABASE_URL = test_url
        config.DATABASE_NAME = test_db
        print(f"\n[pytest] Neo4j connection: TEST DB ({test_db})")
    else:
        # Defer the import so unit-only test runs don't pay the schema-load cost.
        from app.database.graph_schema import set_connection

        set_connection()
        print(
            f"\n[pytest] Neo4j connection: LIVE DB ({config.DATABASE_NAME}) "
            f"— cleanup is scoped to sentinel year {TEST_ACADEMIC_YEAR_NAME!r} only"
        )
    yield


@pytest.fixture(scope="session")
def sentinel_academic_year(neo4j_connection):
    """
    The synthetic `9999-9999` AcademicYear used to scope all test-created data.
    Created on first run, reused thereafter — never deleted.
    """
    from app.database.graph_schema import AcademicYear

    try:
        ay = AcademicYear.nodes.get(name=TEST_ACADEMIC_YEAR_NAME)
    except AcademicYear.DoesNotExist:
        ay = AcademicYear(name=TEST_ACADEMIC_YEAR_NAME).save()
    yield ay


@pytest.fixture
def cleanup_plan_family(neo4j_connection):
    """
    After-test cleanup for CampusPlan / WorkingGroupPlan / ProgressUpdate
    whose identifier starts with the sentinel year. Also removes Plans
    reached via test WGPs (Plan has no year-prefixed identifier of its own,
    so we identify them through the WGP that includes them).

    Cleanup is by identifier prefix or by traversal *from* a test WGP — never
    a blanket Plan delete. Real production Plans cannot be matched.
    """
    yield
    # Test-created Plans — identified by description prefix. We seed test plans
    # with descriptions that start with the sentinel year string, so production
    # Plans (which use real campus/topic descriptions) are never matched.
    db.cypher_query(
        """
        MATCH (p:Plan) WHERE p.description STARTS WITH $year
        DETACH DELETE p
        """,
        {"year": TEST_ACADEMIC_YEAR_NAME},
    )
    # ProgressUpdates next — they hang off WorkingGroupPlans.
    db.cypher_query(
        """
        MATCH (wgp:WorkingGroupPlan)-[:has_progress_update]->(pu:ProgressUpdate)
        WHERE wgp.plan_identifier STARTS WITH $year
        DETACH DELETE pu
        """,
        {"year": TEST_ACADEMIC_YEAR_NAME},
    )
    # WorkingGroupPlans.
    db.cypher_query(
        """
        MATCH (wgp:WorkingGroupPlan)
        WHERE wgp.plan_identifier STARTS WITH $year
        DETACH DELETE wgp
        """,
        {"year": TEST_ACADEMIC_YEAR_NAME},
    )
    # Then the parent CampusPlans.
    db.cypher_query(
        """
        MATCH (cp:CampusPlan)
        WHERE cp.plan_identifier STARTS WITH $year
        DETACH DELETE cp
        """,
        {"year": TEST_ACADEMIC_YEAR_NAME},
    )


@pytest.fixture
def cleanup_yse_family(neo4j_connection):
    """
    After-test cleanup for YearSuccessEvidence whose year_identifier starts
    with either sentinel year (current or the previous-year sentinel used by
    status-progression tests). Mirrors `cleanup_plan_family` for YSE-creating tests.
    """
    yield
    db.cypher_query(
        """
        MATCH (yse:YearSuccessEvidence)
        WHERE yse.year_identifier STARTS WITH $current_year
           OR yse.year_identifier STARTS WITH $previous_year
        DETACH DELETE yse
        """,
        {
            "current_year": TEST_ACADEMIC_YEAR_NAME,
            "previous_year": TEST_PREVIOUS_ACADEMIC_YEAR_NAME,
        },
    )


@pytest.fixture
def flask_client(neo4j_connection):
    """
    Flask test client for endpoint integration tests. Spins up the real app
    via create_app() so blueprint routes, error handlers, and JSON formatting
    all match production.

    Note: create_app() resets `neomodel.config.DATABASE_URL` from the
    production env vars, so we re-apply the test connection (if set) afterward
    to keep us pointed at the test DB. When NEO4J_TEST_DATABASE is unset
    (current default), this is a no-op — both paths point to live.
    """
    from app import create_app

    app = create_app()
    app.config["TESTING"] = True
    # Auth kill-switch off for the functional suite — these tests exercise the
    # data API, not the login flow. Auth-specific tests flip it back on.
    app.config["AUTH_ENFORCED"] = False

    test_url = os.environ.get("NEO4J_TEST_DATABASE_URL")
    test_db = os.environ.get("NEO4J_TEST_DATABASE")
    if test_url and test_db:
        config.DATABASE_URL = test_url
        config.DATABASE_NAME = test_db

    with app.test_client() as client:
        yield client


@pytest.fixture
def auth_db(tmp_path, monkeypatch):
    """Point the auth store at a throwaway SQLite file. Pure-unit safe (no Neo4j)."""
    db_file = tmp_path / "auth_users_test.sqlite3"
    monkeypatch.setenv("AUTH_DB_PATH", str(db_file))
    from app.auth import store

    store.init_db()
    return db_file


@pytest.fixture
def auth_app(auth_db):
    """A Flask app with auth ENFORCED and the store pointed at the tmp sqlite.

    No Neo4j fixtures required — auth endpoints only touch the graph through
    the guarded lazy Person lookup, which degrades to person=null.
    """
    from app import create_app

    app = create_app()
    app.config["TESTING"] = True
    app.config["AUTH_ENFORCED"] = True
    return app


@pytest.fixture
def authed_client(auth_app):
    """Test client with a pre-seeded session (bypasses the login form)."""
    with auth_app.test_client() as client:
        with client.session_transaction() as sess:
            sess["user"] = {
                "username": "testuser",
                "display_name": "Test User",
                "employee_id": "0000000",
                "provider": "local",
            }
        yield client
