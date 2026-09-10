"""
The /plans board read: one row per visible plan with task rollups.

Covers the three things the board exists to get right: the visibility rule
(plans completed or abandoned in a different year are someone else's books),
the task rollups (open / overdue / unowned, from the merged Asana-subtask
progress records), and the no-next-step flag on an In Progress plan with no
open task.

Isolation: everything created here carries the ZZZ-TEST prefix or the
9999-9999 sentinel year and is deleted by prefix.
"""
import pytest
from neomodel import db

pytestmark = [pytest.mark.integration, pytest.mark.api]

SENTINEL = "ZZZ-TEST plans board"
YEAR = "9999-9999"
CAMPUS = "zzz9"


def _clean():
    db.cypher_query(
        """
        MATCH (p:Plan) WHERE p.description STARTS WITH $prefix
        OPTIONAL MATCH (p)-[:has_asana_subtask]->(s:AsanaSubtask)
        DETACH DELETE s, p
        """,
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (y:YearSuccessEvidence) WHERE y.year_identifier STARTS WITH $p DETACH DELETE y",
        {"p": f"{YEAR}-zz."},
    )
    db.cypher_query(
        "MATCH (c:Campus {abbreviation: $a}) DETACH DELETE c", {"a": CAMPUS},
    )


@pytest.fixture
def board_fixture(neo4j_connection):
    """A sentinel campus + YSE, one visible plan, one hidden (completed in a
    different year) plan. Pre-cleans so a crashed earlier run cannot wedge it."""
    from app.database.graph_schema import AcademicYear, Campus, Plan, YearSuccessEvidence

    _clean()
    campus = Campus(name=f"{SENTINEL} Campus", abbreviation=CAMPUS).save()
    year = AcademicYear.nodes.get(name=YEAR)          # the standing sentinel year
    # The second sanctioned sentinel year; created if a fresh graph lacks it.
    other_year = AcademicYear.nodes.get_or_none(name="9998-9998") \
        or AcademicYear(name="9998-9998").save()
    yse = YearSuccessEvidence(year_identifier=f"{YEAR}-zz.1-zzz-{CAMPUS}").save()
    yse.campus.connect(campus)
    yse.academic_year.connect(year)

    visible = Plan(name=f"{SENTINEL} visible", description=f"{SENTINEL} visible plan",
                   plan_status="In Progress").save()
    visible.furthered_year_success_indicators.connect(yse)

    hidden = Plan(name=f"{SENTINEL} hidden", description=f"{SENTINEL} hidden plan",
                  plan_status="Completed").save()
    hidden.furthered_year_success_indicators.connect(yse)
    hidden.completed_year.connect(other_year)

    yield {"visible": visible, "hidden": hidden}

    _clean()


def _row(board, unique_id):
    rows = [r for r in board if r["unique_id"] == unique_id]
    return rows[0] if rows else None


def test_visibility_matches_the_campus_plan_rule(board_fixture):
    from app.database.queries.plans.read import plans_board

    board = plans_board(CAMPUS, YEAR)
    assert _row(board, board_fixture["visible"].unique_id) is not None
    # Completed in a different year: someone else's books.
    assert _row(board, board_fixture["hidden"].unique_id) is None


def test_task_rollups_count_open_overdue_and_unowned(board_fixture):
    from app.database.queries.asana.create import sync_plan_subtasks
    from app.database.queries.plans.read import plans_board

    plan = board_fixture["visible"]
    sync_plan_subtasks(plan.unique_id, [
        {"gid": "zb1", "name": "done long ago", "completed": True,
         "due_on": "2020-01-01"},
        {"gid": "zb2", "name": "open and overdue", "completed": False,
         "due_on": "2020-01-01"},
        {"gid": "zb3", "name": "open, future due", "completed": False,
         "due_on": "2099-01-01"},
        {"gid": "zb4", "name": "open, no due date", "completed": False},
    ])

    row = _row(plans_board(CAMPUS, YEAR), plan.unique_id)
    assert row["tasks_total"] == 4
    assert row["tasks_open"] == 3
    assert row["tasks_overdue"] == 1          # completed-overdue does not count
    assert row["tasks_unassigned_open"] == 3  # nobody assigned yet
    assert row["no_next_step"] is False       # open tasks exist


def test_in_progress_with_no_open_task_is_flagged(board_fixture):
    from app.database.queries.plans.read import plans_board

    row = _row(plans_board(CAMPUS, YEAR), board_fixture["visible"].unique_id)
    assert row["plan_status"] == "In Progress"
    assert row["tasks_open"] == 0
    assert row["no_next_step"] is True


def test_board_over_http(flask_client, board_fixture):
    resp = flask_client.get(f"/ati/data-api/v1/plans/board?campus={CAMPUS}&year={YEAR}")
    assert resp.status_code == 200
    plans = resp.get_json()["data"]["plans"]
    assert _row(plans, board_fixture["visible"].unique_id) is not None

    missing = flask_client.get("/ati/data-api/v1/plans/board")
    assert missing.status_code == 400


def test_tasks_board_carries_plan_owner_and_overdue(board_fixture):
    from app.database.queries.asana.create import sync_plan_subtasks
    from app.database.queries.plans.read import tasks_board

    plan = board_fixture["visible"]
    sync_plan_subtasks(plan.unique_id, [
        {"gid": "zt1", "name": "overdue and open", "completed": False,
         "due_on": "2020-01-01"},
        {"gid": "zt2", "name": "done", "completed": True, "due_on": "2020-01-01"},
    ])

    tasks = [t for t in tasks_board(CAMPUS, YEAR) if t["plan"]["unique_id"] == plan.unique_id]
    by_gid = {t["asana_gid"]: t for t in tasks}
    assert by_gid["zt1"]["overdue"] is True
    assert by_gid["zt1"]["plan"]["name"] == plan.name
    assert by_gid["zt2"]["overdue"] is False      # completed never counts as overdue
    # Rows from the hidden (other-year) plan never appear.
    hidden_uid = board_fixture["hidden"].unique_id
    assert all(t["plan"]["unique_id"] != hidden_uid for t in tasks_board(CAMPUS, YEAR))


def test_canonical_crud_routes_serve_the_same_views(flask_client, board_fixture):
    """/plans and /accomplishments are the canonical addresses; the old
    /implementations/... rules stay as shims. Same view classes behind both."""
    plan = board_fixture["visible"]

    canonical = flask_client.put("/ati/data-api/v1/plans", json={
        "action": "update_plan",
        "unique_id": plan.unique_id,
        "plan_status": "On Hold",
    })
    assert canonical.status_code == 200, canonical.get_json()

    shim = flask_client.put("/ati/data-api/v1/implementations/plans", json={
        "action": "update_plan",
        "unique_id": plan.unique_id,
        "plan_status": "In Progress",
    })
    assert shim.status_code == 200, shim.get_json()

    accomplishments = flask_client.get("/ati/data-api/v1/accomplishments?all=true")
    assert accomplishments.status_code == 200


def test_accomplishments_board_carries_context(flask_client, board_fixture):
    from app.database.graph_schema import Accomplishment

    acc = Accomplishment(name=f"{SENTINEL} accomplishment",
                         description=f"{SENTINEL} accomplishment description").save()
    try:
        resp = flask_client.get("/ati/data-api/v1/accomplishments/board")
        assert resp.status_code == 200
        rows = resp.get_json()["data"]["accomplishments"]
        mine = [r for r in rows if r["unique_id"] == acc.unique_id]
        assert mine and mine[0]["name"] == f"{SENTINEL} accomplishment"
        assert mine[0]["working_groups"] == []
        assert mine[0]["achieved_through"] == []
    finally:
        db.cypher_query(
            "MATCH (a:Accomplishment) WHERE a.description STARTS WITH $p DETACH DELETE a",
            {"p": SENTINEL},
        )
