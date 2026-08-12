"""
Plan updates from the dashboard Annotations > Plans tab.

Regression cover for a bug where every save at status "Complete" 500'd: the form
built its options from `data_config.plan_statuses`, which said "Complete", while the
write-path validator required "Completed" — the spelling every Plan in the graph
actually carries. Two follow-on defects are covered here too, because fixing only the
first would have turned a visible failure into a silent one:

  - The update disconnected ALL of a plan's furthers_yse edges before reconnecting the
    single identifier the caller sent. 53 of 60 plans further more than one YSE (one
    furthers 27), so a successful save would have stripped the rest.
  - A bad plan_status came back as a 500 with no message, because ValidationError was
    rewrapped as CrudError and the error envelope was built positionally.

Isolation: every test owns a throwaway Plan and deletes it at teardown. Real
YearSuccessEvidence nodes are linked but never modified.
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999 Test Plan"

pytestmark = [pytest.mark.integration, pytest.mark.api]

API = "/ati/data-api/v1"


@pytest.fixture
def cleanup_plans(neo4j_connection):
    """Delete sentinel-named plans and any accomplishment auto-created from them."""
    yield
    db.cypher_query(
        "MATCH (a:Accomplishment) WHERE a.name STARTS WITH $p DETACH DELETE a", {"p": SENTINEL})
    db.cypher_query(
        "MATCH (p:Plan) WHERE p.name STARTS WITH $p DETACH DELETE p", {"p": SENTINEL})


@pytest.fixture
def plan_with_yses(cleanup_plans):
    """A throwaway plan furthering three real YSEs — the shape 53 of 60 plans have."""
    from app.database.graph_schema import Plan, YearSuccessEvidence

    yses = YearSuccessEvidence.nodes.all()[:4]
    assert len(yses) == 4, "graph needs at least 4 YSEs for this test"
    plan = Plan(name=SENTINEL, description=f"{SENTINEL} description",
                plan_status="In Progress").save()
    for y in yses[:3]:
        plan.furthered_year_success_indicators.connect(y)
    return plan, yses


def _form_payload(plan, yse, status):
    """Exactly what PlanViewer.handleFormSubmit sends — note the SINGLE yse identifier."""
    return {
        "action": "update_plan",
        "furthered_yse_identifier": yse.year_identifier,
        "unique_id": plan.unique_id,
        "name": plan.name,
        "description": plan.description,
        "is_key_plan": False,
        "is_campus_plan": False,
        "abandoned": False,
        "abandoned_notes": "",
        "plan_status": status,
        "created_by": {},
        "academic_year_name": "2026-2027",
    }


def _yse_count(plan):
    rows, _ = db.cypher_query(
        "MATCH (p:Plan {unique_id: $u})-[:furthers_yse]->(y) RETURN count(y)",
        {"u": plan.unique_id})
    return rows[0][0]


# --- the vocabulary must have exactly one definition -------------------------

def test_validator_and_ui_vocabulary_share_one_source():
    """The bug was two copies of this list disagreeing, so pin that there is one."""
    from app.data_config import plan_statuses

    assert "Completed" in plan_statuses
    assert "Complete" not in plan_statuses, \
        "'Complete' is not what any Plan in the graph carries, nor what update_plan accepts"


def test_every_offered_status_saves(flask_client, plan_with_yses):
    """Whatever the form can offer, the write path must accept."""
    from app.data_config import plan_statuses

    plan, yses = plan_with_yses
    for status in plan_statuses:
        resp = flask_client.put(f"{API}/implementations/plans",
                                json=_form_payload(plan, yses[0], status))
        assert resp.status_code == 200, f"status {status!r} rejected: {resp.get_json()}"


def test_invalid_status_is_400_with_a_readable_message(flask_client, plan_with_yses):
    """Was a 500 whose body said only 'Failed to process request'."""
    plan, yses = plan_with_yses
    resp = flask_client.put(f"{API}/implementations/plans",
                            json=_form_payload(plan, yses[0], "Nonsense"))
    assert resp.status_code == 400
    error = resp.get_json()["error"]
    assert error and "Nonsense" in error, \
        "the message must reach the top-level `error` key, or the UI cannot show it"
    assert "Completed" in error, "tell the caller what is allowed"


# --- the update must not re-home the plan ------------------------------------

def test_update_preserves_other_yse_links(flask_client, plan_with_yses):
    """The form sends ONE identifier; that is not a statement about the other links."""
    plan, yses = plan_with_yses
    assert _yse_count(plan) == 3

    resp = flask_client.put(f"{API}/implementations/plans",
                            json=_form_payload(plan, yses[0], "On Hold"))
    assert resp.status_code == 200
    assert _yse_count(plan) == 3, "updating a plan's fields must not unlink its other indicators"


def test_update_adds_a_new_yse_link_without_replacing(flask_client, plan_with_yses):
    plan, yses = plan_with_yses
    resp = flask_client.put(f"{API}/implementations/plans",
                            json=_form_payload(plan, yses[3], "In Progress"))
    assert resp.status_code == 200
    assert _yse_count(plan) == 4


def test_repeated_update_does_not_duplicate_the_link(flask_client, plan_with_yses):
    plan, yses = plan_with_yses
    for _ in range(3):
        flask_client.put(f"{API}/implementations/plans",
                         json=_form_payload(plan, yses[0], "In Progress"))
    assert _yse_count(plan) == 3, "re-saving must not stack duplicate edges"


# --- the Completed side effect still works -----------------------------------

def test_completed_still_mirrors_into_an_accomplishment(flask_client, plan_with_yses):
    """The auto-create branch keys on 'Completed'; the vocabulary fix must not break it."""
    plan, yses = plan_with_yses
    flask_client.put(f"{API}/implementations/plans",
                     json=_form_payload(plan, yses[0], "Completed"))

    rows, _ = db.cypher_query(
        "MATCH (p:Plan {unique_id: $u})<-[:achieved_through]-(a:Accomplishment) RETURN count(a)",
        {"u": plan.unique_id})
    assert rows[0][0] == 1

    # Leaving Completed drops it again.
    flask_client.put(f"{API}/implementations/plans",
                     json=_form_payload(plan, yses[0], "In Progress"))
    rows, _ = db.cypher_query(
        "MATCH (p:Plan {unique_id: $u})<-[:achieved_through]-(a:Accomplishment) RETURN count(a)",
        {"u": plan.unique_id})
    assert rows[0][0] == 0


def test_missing_unique_id_is_400(flask_client):
    resp = flask_client.put(f"{API}/implementations/plans",
                            json={"action": "update_plan", "name": "x"})
    assert resp.status_code == 400
    assert "unique_id" in (resp.get_json()["error"] or "")


# --- completed_date ----------------------------------------------------------

def test_completed_date_stamps_on_entering_and_clears_on_leaving(flask_client, plan_with_yses):
    """The date must never outlive the state it dates."""
    from datetime import date

    plan, yses = plan_with_yses

    def stored():
        rows, _ = db.cypher_query(
            "MATCH (p:Plan {unique_id: $u}) RETURN toString(p.completed_date)",
            {"u": plan.unique_id})
        return rows[0][0]

    assert stored() is None

    flask_client.put(f"{API}/implementations/plans",
                     json=_form_payload(plan, yses[0], "Completed"))
    assert stored() == date.today().isoformat()

    flask_client.put(f"{API}/implementations/plans",
                     json=_form_payload(plan, yses[0], "In Progress"))
    assert stored() is None, "a plan that is no longer Completed has no completion date"


def test_editing_an_already_completed_plan_does_not_restamp(flask_client, plan_with_yses):
    """Renaming a plan finished last March must not move its completion to today."""
    plan, yses = plan_with_yses
    payload = _form_payload(plan, yses[0], "Completed")
    payload["completed_date"] = "2026-03-14"
    flask_client.put(f"{API}/implementations/plans", json=payload)

    # A later edit that says nothing about the date leaves it alone.
    edit = _form_payload(plan, yses[0], "Completed")
    edit["name"] = f"{SENTINEL} renamed"
    edit.pop("completed_date", None)
    flask_client.put(f"{API}/implementations/plans", json=edit)

    rows, _ = db.cypher_query(
        "MATCH (p:Plan {unique_id: $u}) RETURN toString(p.completed_date)",
        {"u": plan.unique_id})
    assert rows[0][0] == "2026-03-14"


def test_explicit_completed_date_wins_and_empty_clears(flask_client, plan_with_yses):
    """This register is kept retrospectively, so an author must be able to say when."""
    plan, yses = plan_with_yses

    payload = _form_payload(plan, yses[0], "Completed")
    payload["completed_date"] = "2025-11-02"
    assert flask_client.put(f"{API}/implementations/plans", json=payload).status_code == 200

    rows, _ = db.cypher_query(
        "MATCH (p:Plan {unique_id: $u}) RETURN toString(p.completed_date)", {"u": plan.unique_id})
    assert rows[0][0] == "2025-11-02", "an explicit date must beat the auto-stamp"

    payload["completed_date"] = ""
    flask_client.put(f"{API}/implementations/plans", json=payload)
    rows, _ = db.cypher_query(
        "MATCH (p:Plan {unique_id: $u}) RETURN toString(p.completed_date)", {"u": plan.unique_id})
    assert rows[0][0] is None, "present-but-empty clears, so a wrong date is removable"


def test_malformed_completed_date_is_400_not_500(flask_client, plan_with_yses):
    """A client typo is not a server fault."""
    plan, yses = plan_with_yses
    payload = _form_payload(plan, yses[0], "Completed")
    payload["completed_date"] = "14/03/2026"

    resp = flask_client.put(f"{API}/implementations/plans", json=payload)
    assert resp.status_code == 400
    assert "ISO date" in (resp.get_json()["error"] or "")


def test_completed_date_serializes(flask_client, plan_with_yses):
    from app.database.graph_schema import Plan

    plan, yses = plan_with_yses
    payload = _form_payload(plan, yses[0], "Completed")
    payload["completed_date"] = "2026-03-14"
    flask_client.put(f"{API}/implementations/plans", json=payload)

    assert Plan.nodes.get(unique_id=plan.unique_id).serialize()["completed_date"] == "2026-03-14"
