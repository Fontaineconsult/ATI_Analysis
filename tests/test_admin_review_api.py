"""
Administrative review — approver-flag enforcement on assign_approver.

The bug: Person.can_approve_yse was collected in Settings but never checked —
any person could complete a review. Enforcement lives in
assign_approver_to_yse (AuthorizationError) so every caller (endpoint, MCP,
script) funnels through it; the endpoint maps it to 403.

Isolation: people + the bare YSE carry the sentinel year prefix (9999-9999...)
in their unique keys; cleanup deletes exactly that prefix. The bare YSE is
create-function-free on purpose — approval only touches the node itself.
"""
import pytest
from neomodel import db

SENTINEL = "9999-9999"

APPROVER_NAME = f"{SENTINEL} Test Approver"
APPROVER_EMPLOYEE_ID = f"{SENTINEL}-emp-approver"
NON_APPROVER_NAME = f"{SENTINEL} Test Non-Approver"
NON_APPROVER_EMPLOYEE_ID = f"{SENTINEL}-emp-non-approver"
YSE_IDENTIFIER = f"{SENTINEL}-7.11-ins-zz"

pytestmark = [pytest.mark.integration, pytest.mark.api]

API = "/ati/data-api/v1/evidence"


@pytest.fixture
def review_fixture(neo4j_connection):
    from app.database.graph_schema import Person, YearSuccessEvidence

    approver = Person(
        name=APPROVER_NAME, employee_id=APPROVER_EMPLOYEE_ID, can_approve_yse=True
    ).save()
    non_approver = Person(
        name=NON_APPROVER_NAME, employee_id=NON_APPROVER_EMPLOYEE_ID, can_approve_yse=False
    ).save()
    yse = YearSuccessEvidence(year_identifier=YSE_IDENTIFIER).save()
    yield approver, non_approver, yse
    db.cypher_query(
        "MATCH (e:YearSuccessEvidence) WHERE e.year_identifier STARTS WITH $prefix DETACH DELETE e",
        {"prefix": SENTINEL},
    )
    db.cypher_query(
        "MATCH (p:Person) WHERE p.name STARTS WITH $prefix DETACH DELETE p",
        {"prefix": SENTINEL},
    )


def _yse_state():
    rows, _ = db.cypher_query(
        "MATCH (e:YearSuccessEvidence {year_identifier: $yid}) "
        "OPTIONAL MATCH (e)-[:admin_review_completed_by]->(p:Person) "
        "RETURN e.administrative_review_complete, e.administrative_review_completed_date, "
        "       collect(p.employee_id)",
        {"yid": YSE_IDENTIFIER},
    )
    return rows[0]


def test_non_approver_is_rejected_with_403(flask_client, review_fixture):
    resp = flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": NON_APPROVER_EMPLOYEE_ID,
    })
    assert resp.status_code == 403
    assert "can_approve_yse" in resp.get_json()["error"]

    complete, completed_date, approvers = _yse_state()
    assert complete is False, "a rejected approval must not touch the node"
    assert completed_date is None
    assert approvers == []


def test_approver_completes_the_review(flask_client, review_fixture):
    resp = flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert resp.status_code == 200

    complete, completed_date, approvers = _yse_state()
    assert complete is True
    assert completed_date is not None
    assert approvers == [APPROVER_EMPLOYEE_ID]


def test_query_function_raises_authorization_error(review_fixture):
    from app.database.queries.evidence.update import assign_approver_to_yse
    from app.endpoints.data_api.errors.custom_exceptions import AuthorizationError

    with pytest.raises(AuthorizationError):
        assign_approver_to_yse(YSE_IDENTIFIER, NON_APPROVER_EMPLOYEE_ID)


# --- Step one: ready_for_admin_review -----------------------------------------

def _ready_state():
    rows, _ = db.cypher_query(
        "MATCH (e:YearSuccessEvidence {year_identifier: $yid}) RETURN e.ready_for_admin_review",
        {"yid": YSE_IDENTIFIER},
    )
    return rows[0][0]


def test_ready_for_review_round_trip(flask_client, review_fixture):
    # Mark ready.
    marked = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": True,
    })
    assert marked.status_code == 200
    assert _ready_state() is True

    # Withdraw the mark (pre-approval state is reversible).
    withdrawn = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": False,
    })
    assert withdrawn.status_code == 200
    assert _ready_state() is False


def test_ready_then_approve_leaves_both_states(flask_client, review_fixture):
    flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": True,
    })
    approved = flask_client.put(API, json={
        "action": "assign_approver",
        "year_success_evidence": YSE_IDENTIFIER,
        "employee_id": APPROVER_EMPLOYEE_ID,
    })
    assert approved.status_code == 200

    complete, _date, approvers = _yse_state()
    assert complete is True
    assert approvers == [APPROVER_EMPLOYEE_ID]
    # Approval leaves the ready flag untouched (display gives Approved precedence).
    assert _ready_state() is True


def test_ready_error_mapping(flask_client, review_fixture):
    missing_flag = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
    })
    assert missing_flag.status_code == 400

    non_boolean = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": YSE_IDENTIFIER,
        "ready": "yes",
    })
    assert non_boolean.status_code == 400

    missing_yse = flask_client.put(API, json={
        "action": "set_ready_for_review",
        "year_success_evidence": f"{SENTINEL}-no-such-yse",
        "ready": True,
    })
    assert missing_yse.status_code == 404
